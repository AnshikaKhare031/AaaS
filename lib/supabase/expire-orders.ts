import { SupabaseClient } from "@supabase/supabase-js";
import { getRazorpayServerClient } from "@/lib/payment/razorpay";
import { reconcileOrderPayment } from "@/lib/payment/reconcile";

/**
 * Production-Safe Order Expiration Sweep.
 * 
 * 1. Checks pending orders older than 30 minutes.
 * 2. Cross-checks Razorpay API for orders with razorpay_order_id.
 *    - If paid on Razorpay: auto-reconciles order to 'paid'.
 *    - If unpaid on Razorpay or missing gateway order: marks 'expired'.
 *    - If Razorpay API call fails: leaves as 'pending' for next retry.
 * 3. Never permanently deletes orders (preserves full auditability & late reconciliation).
 */
export async function expirePendingOrders(supabase: SupabaseClient): Promise<void> {
  try {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

    // 1. Fetch pending orders older than 30 minutes
    // Uses provider_order_id from existing schema with fallback to base columns
    let pendingOrders: Array<{
      id: string;
      order_number: string;
      provider_order_id?: string | null;
      razorpay_order_id?: string | null;
      payment_status: string;
    }> | null = null;

    let fetchError: unknown = null;

    const res = await supabase
      .from("orders")
      .select("id, order_number, provider_order_id, payment_status")
      .eq("payment_status", "pending")
      .lt("created_at", thirtyMinutesAgo);

    if (res.error) {
      // Schema fallback: if provider_order_id is not present, query base columns
      const fallbackRes = await supabase
        .from("orders")
        .select("id, order_number, payment_status")
        .eq("payment_status", "pending")
        .lt("created_at", thirtyMinutesAgo);

      if (fallbackRes.error) {
        fetchError = fallbackRes.error;
      } else {
        pendingOrders = fallbackRes.data;
      }
    } else {
      pendingOrders = res.data;
    }

    if (fetchError) {
      const err = fetchError as { message?: string; code?: string; details?: string; hint?: string };
      console.error("[Order Expiration Sweep] Supabase error:", {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
      });
      return;
    }

    if (!pendingOrders || pendingOrders.length === 0) {
      return;
    }

    // 2. Process each pending order safely
    for (const order of pendingOrders) {
      const gatewayOrderId = order.provider_order_id || order.razorpay_order_id || null;

      // Case A: Missing Razorpay order ID (never initiated payment gateway order)
      if (!gatewayOrderId) {
        const { error: expireError } = await supabase
          .from("orders")
          .update({
            payment_status: "expired",
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id)
          .eq("payment_status", "pending");

        if (expireError) {
          console.error(`[Order Expiration Sweep] Error expiring order ${order.order_number}:`, {
            message: expireError?.message,
            code: expireError?.code,
            details: expireError?.details,
            hint: expireError?.hint,
          });
        }
        continue;
      }

      // Case B: Has gateway order ID -> Cross-check status with Razorpay
      try {
        const razorpay = getRazorpayServerClient();
        const rzpOrder = await razorpay.orders.fetch(gatewayOrderId);

        if (rzpOrder && rzpOrder.status === "paid") {
          // Fetch payment(s) to obtain a verified captured payment ID
          let capturedPaymentId: string | null = null;
          try {
            const payments = await razorpay.orders.fetchPayments(gatewayOrderId);
            const capturedPayment = payments?.items?.find(
              (p: { id?: unknown; status?: unknown }) =>
                p.status === "captured" &&
                typeof p.id === "string" &&
                p.id.startsWith("pay_")
            );
            if (capturedPayment?.id) {
              capturedPaymentId = capturedPayment.id as string;
            }
          } catch (payErr) {
            console.warn(
              `[Order Expiration Sweep] Could not fetch payments list for ${gatewayOrderId}:`,
              payErr instanceof Error ? payErr.message : "Fetch payments error"
            );
          }

          // Payment ID Guard: Only reconcile if a verified captured payment ID exists
          if (capturedPaymentId) {
            console.log(
              `[Order Expiration Sweep] Order ${order.order_number} (${gatewayOrderId}) verified with captured payment ${capturedPaymentId}. Auto-reconciling...`
            );

            // Idempotently reconcile order to 'paid'
            await reconcileOrderPayment({
              orderId: order.id,
              orderNumber: order.order_number,
              razorpay_order_id: gatewayOrderId,
              razorpay_payment_id: capturedPaymentId,
            });
          } else {
            // Razorpay reports order as paid, but no captured payment ID could be confirmed.
            // DO NOT reconcile with empty ID, DO NOT expire, and DO NOT send email.
            // Leave payment_status = pending so the next sweep or webhook can retry.
            console.warn(
              `[Order Expiration Sweep] Order ${order.order_number} (${gatewayOrderId}) is marked paid in Razorpay, but no verified captured payment ID (pay_...) was found. Keeping as pending for retry.`
            );
          }
        } else {
          // Order is not paid on Razorpay (attempted, created, etc.)
          // Safely expire with concurrency protection (only update if still pending)
          const { error: expireError } = await supabase
            .from("orders")
            .update({
              payment_status: "expired",
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id)
            .eq("payment_status", "pending");

          if (expireError) {
            console.error(`[Order Expiration Sweep] Error expiring order ${order.order_number}:`, {
              message: expireError?.message,
              code: expireError?.code,
              details: expireError?.details,
              hint: expireError?.hint,
            });
          }
        }
      } catch (rzpErr) {
        // Razorpay API failure (timeout, rate limit, network/server error).
        // CRITICAL: DO NOT EXPIRE THE ORDER. Leave payment_status = pending.
        console.error(
          `[Order Expiration Sweep] Razorpay API check failed for order ${order.order_number} (${gatewayOrderId}). Keeping as pending:`,
          rzpErr instanceof Error ? rzpErr.message : "API error"
        );
      }
    }
  } catch (err) {
    console.error("[Order Expiration Sweep] Unexpected failure during pending orders sweep:", err);
  }
}

