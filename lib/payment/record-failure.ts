import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Order, PaymentFailureDetails } from "@/types/order";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface RecordPaymentFailureParams {
  orderId?: string | null;
  orderNumber?: string | null;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  razorpay_signature?: string | null;
  error?: PaymentFailureDetails | null;
  rawPayload?: Record<string, unknown> | null;
  source?: "client" | "webhook";
}

export interface RecordPaymentFailureResult {
  success: boolean;
  message: string;
  order?: Order | null;
  alreadyPaid?: boolean;
  error?: string;
}

/**
 * Records a Razorpay payment failure in Supabase:
 * 1. Safely finds the order by orderId, orderNumber, or razorpay_order_id.
 * 2. Uses the Supabase admin/service-role client so RLS never blocks server writes.
 * 3. Never overwrites a verified 'paid' status with 'failed'.
 * 4. Atomically updates the order status to 'failed', updating notes with failure diagnostics.
 * 5. Inserts an immutable failure record into payment_logs (with nullable razorpay_signature & razorpay_payment_id).
 */
export async function recordPaymentFailure({
  orderId,
  orderNumber,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  error,
  rawPayload,
  source = "client",
}: RecordPaymentFailureParams): Promise<RecordPaymentFailureResult> {
  const supabase = createServerSupabaseClient();

  // 1. Locate the existing order
  let existingOrder: Order | null = null;

  if (orderId) {
    const isUuid = UUID_REGEX.test(orderId.trim());
    if (isUuid) {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId.trim())
        .maybeSingle();
      if (data) existingOrder = data as Order;
    } else if (!orderNumber) {
      // If orderId is not a UUID, check if it matches order_number
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", orderId.trim())
        .maybeSingle();
      if (data) existingOrder = data as Order;
    }
  }

  if (!existingOrder && orderNumber) {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber.trim())
      .maybeSingle();
    if (data) existingOrder = data as Order;
  }

  if (!existingOrder && razorpay_order_id) {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("razorpay_order_id", razorpay_order_id.trim())
      .maybeSingle();
    if (data) existingOrder = data as Order;
  }

  // 2. Guard against overwriting an already-paid order
  if (existingOrder && existingOrder.payment_status === "paid") {
    console.log(
      `[Payment Failure Logger] Order ${existingOrder.order_number} is already 'paid'. Skipping 'failed' status update.`
    );

    // Audit log late failure without mutating paid order status
    await insertPaymentLogSafe(supabase, {
      order_id: existingOrder.id,
      order_number: existingOrder.order_number,
      razorpay_order_id: razorpay_order_id || existingOrder.razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id || null,
      razorpay_signature: razorpay_signature || null,
      event: "payment.failed.ignored_paid",
      status: "ignored",
      amount: existingOrder.total ? Math.round(Number(existingOrder.total) * 100) : null,
      currency: existingOrder.currency || "INR",
      error_code: error?.code || null,
      error_description: error?.description || null,
      error_source: error?.source || null,
      error_step: error?.step || null,
      error_reason: error?.reason || null,
      error_metadata: error?.metadata || null,
      raw_payload: rawPayload || null,
    });

    return {
      success: true,
      alreadyPaid: true,
      message: "Order is already paid; payment failure status transition ignored.",
      order: existingOrder,
    };
  }

  let finalOrder: Order | null = existingOrder;

  // 3. Atomically transition order payment_status to 'failed'
  if (existingOrder) {
    const updateFields: Record<string, unknown> = {
      payment_status: "failed",
      updated_at: new Date().toISOString(),
    };

    if (razorpay_payment_id) {
      updateFields.razorpay_payment_id = razorpay_payment_id;
    }
    if (razorpay_order_id && !existingOrder.razorpay_order_id) {
      updateFields.razorpay_order_id = razorpay_order_id;
    }

    // Append failure diagnostics into order notes for clear administrator visibility
    const failureSummary = [
      error?.description ? `Reason: ${error.description}` : null,
      error?.code ? `Code: ${error.code}` : null,
      error?.reason ? `Type: ${error.reason}` : null,
      razorpay_payment_id ? `Payment ID: ${razorpay_payment_id}` : null,
      `Source: ${source}`,
    ]
      .filter(Boolean)
      .join(" | ");

    if (failureSummary) {
      const existingNotes = existingOrder.notes ? `${existingOrder.notes}\n` : "";
      updateFields.notes = `${existingNotes}[Payment Failed: ${new Date().toISOString()}] ${failureSummary}`.slice(
        0,
        2000
      );
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update(updateFields)
      .eq("id", existingOrder.id)
      .neq("payment_status", "paid")
      .select("*")
      .maybeSingle();

    if (updateError) {
      console.error("[Payment Failure Logger] Failed to update order status:", updateError);
    } else if (updatedOrder) {
      finalOrder = updatedOrder as Order;
    }
  }

  // 4. Insert failure entry into payment_logs
  const validOrderId =
    finalOrder?.id || (orderId && UUID_REGEX.test(orderId.trim()) ? orderId.trim() : null);

  await insertPaymentLogSafe(supabase, {
    order_id: validOrderId,
    order_number: finalOrder?.order_number || orderNumber || null,
    razorpay_order_id: razorpay_order_id || finalOrder?.razorpay_order_id || null,
    razorpay_payment_id: razorpay_payment_id || null,
    razorpay_signature: razorpay_signature || null,
    event: "payment.failed",
    status: "failed",
    amount: finalOrder?.total ? Math.round(Number(finalOrder.total) * 100) : null,
    currency: finalOrder?.currency || "INR",
    error_code: error?.code || null,
    error_description: error?.description || null,
    error_source: error?.source || null,
    error_step: error?.step || null,
    error_reason: error?.reason || null,
    error_metadata: error?.metadata || null,
    raw_payload: rawPayload || null,
  });

  return {
    success: true,
    alreadyPaid: false,
    message: "Payment failure recorded successfully",
    order: finalOrder,
  };
}

/**
 * Safely inserts a record into payment_logs.
 * Handles missing table gracefully if database migrations are still running.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function insertPaymentLogSafe(supabase: any, logRecord: Record<string, unknown>): Promise<void> {
  try {
    const { error: insertError } = await supabase.from("payment_logs").insert([logRecord]);
    if (insertError) {
      // Log warning without failing the caller if table or column doesn't exist
      console.warn("[Payment Failure Logger] payment_logs insert notice:", insertError.message);
    }
  } catch (err) {
    console.warn("[Payment Failure Logger] payment_logs insert exception:", err);
  }
}
