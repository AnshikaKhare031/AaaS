import { NextRequest, NextResponse } from "next/server";
import { recordPaymentFailure } from "@/lib/payment/record-failure";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request payload." },
        { status: 400 }
      );
    }

    const {
      orderId,
      orderNumber,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      error,
      // Support flat error fields as fallback
      error_code,
      error_description,
      error_source,
      error_step,
      error_reason,
    } = body;

    if (!orderId && !orderNumber && !razorpay_order_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required order identifier (orderId, orderNumber, or razorpay_order_id).",
        },
        { status: 400 }
      );
    }

    const normalizedError = {
      code: error?.code || error_code || null,
      description: error?.description || error_description || null,
      source: error?.source || error_source || null,
      step: error?.step || error_step || null,
      reason: error?.reason || error_reason || null,
      metadata: error?.metadata || null,
    };

    const result = await recordPaymentFailure({
      orderId: typeof orderId === "string" ? orderId : undefined,
      orderNumber: typeof orderNumber === "string" ? orderNumber : undefined,
      razorpay_order_id: typeof razorpay_order_id === "string" ? razorpay_order_id : undefined,
      razorpay_payment_id: typeof razorpay_payment_id === "string" ? razorpay_payment_id : undefined,
      razorpay_signature: typeof razorpay_signature === "string" ? razorpay_signature : null,
      error: normalizedError,
      rawPayload: body,
      source: "client",
    });

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        alreadyPaid: result.alreadyPaid || false,
        orderId: result.order?.id,
        orderNumber: result.order?.order_number,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("Error in /api/razorpay/payment-failed:", err);
    const errorMessage = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
