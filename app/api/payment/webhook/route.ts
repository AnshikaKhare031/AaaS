import { NextRequest, NextResponse } from "next/server";
import { reconcileOrderPayment } from "@/lib/payment/reconcile";
import { recordPaymentFailure } from "@/lib/payment/record-failure";
import {
  recordWebhookEvent,
  getExistingWebhookEvent,
  UUID_REGEX,
} from "@/lib/payment/webhook-events";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  let parsedPayload: Record<string, unknown> | null = null;
  let parsedEvent: string | null = null;
  let parsedEventId: string | null = null;

  try {
    // 1. Read raw request body as text BEFORE any JSON parsing
    const rawBody = await req.text();

    // 2. Extract headers (case-insensitive via Web Headers API)
    const signature = req.headers.get("x-razorpay-signature");
    const headerEventId = req.headers.get("x-razorpay-event-id");

    if (!signature) {
      return NextResponse.json(
        { success: false, error: "Missing X-Razorpay-Signature header." },
        { status: 400 }
      );
    }

    // 3. Obtain webhook secret from environment (MUST NOT use RAZORPAY_KEY_SECRET)
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[Razorpay Webhook] Missing RAZORPAY_WEBHOOK_SECRET environment variable.");
      return NextResponse.json(
        { success: false, error: "Razorpay webhook secret is not configured on the server." },
        { status: 500 }
      );
    }

    // 4. Verify webhook signature using HMAC-SHA256 over raw request body
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const clientBuffer = Buffer.from(signature, "utf8");

    let isSignatureValid = false;
    if (expectedBuffer.length === clientBuffer.length) {
      isSignatureValid = crypto.timingSafeEqual(expectedBuffer, clientBuffer);
    }

    if (!isSignatureValid) {
      console.error("[Razorpay Webhook] Webhook signature verification failed.");
      return NextResponse.json(
        { success: false, error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    // 5. Parse JSON payload only after valid signature verification
    try {
      parsedPayload = JSON.parse(rawBody);
    } catch (parseErr) {
      console.error("[Razorpay Webhook] Invalid JSON payload:", parseErr);
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload = parsedPayload as Record<string, any>;
    const event = typeof payload.event === "string" ? payload.event : "";
    parsedEvent = event;

    const eventId =
      headerEventId ||
      (typeof payload?.event_id === "string" ? payload.event_id : null) ||
      (typeof payload?.id === "string" && payload.id.startsWith("event_") ? payload.id : null);
    parsedEventId = eventId;

    console.log(`[Razorpay Webhook] Received valid event: ${event} (Event ID: ${eventId || "none"})`);

    // 6. Check for duplicate event using X-Razorpay-Event-Id header with service-role admin client
    if (eventId) {
      const existing = await getExistingWebhookEvent(eventId);
      if (existing && existing.status === "processed") {
        console.log(`[Razorpay Webhook] Event ${eventId} already processed. Returning 200 OK.`);
        // Safely update processed_at timestamp on duplicate retry without re-reconciling
        await recordWebhookEvent({
          eventId,
          eventType: event,
          provider: "razorpay",
          payload,
          orderId: existing.order_id,
          status: "processed",
          processedAt: new Date().toISOString(),
        });

        return NextResponse.json(
          { success: true, message: "Event already processed" },
          { status: 200 }
        );
      }
    }

    // 7. Handle target events
    if (event === "order.paid") {
      const orderEntity = payload.payload?.order?.entity;
      const paymentEntity = payload.payload?.payment?.entity;

      const razorpayOrderId = orderEntity?.id;
      const razorpayPaymentId = paymentEntity?.id || orderEntity?.payment_id || "";
      const orderNumber =
        orderEntity?.receipt ||
        orderEntity?.notes?.internal_order_id ||
        orderEntity?.notes?.order_number ||
        paymentEntity?.notes?.internal_order_id ||
        paymentEntity?.notes?.order_number;
      const orderId =
        orderEntity?.notes?.orderId ||
        orderEntity?.notes?.id ||
        paymentEntity?.notes?.orderId ||
        paymentEntity?.notes?.id;

      if (!razorpayOrderId) {
        await recordWebhookEvent({
          eventId,
          eventType: event,
          provider: "razorpay",
          payload,
          orderId: null,
          status: "failed",
          errorMessage: "Missing razorpay_order_id in order.paid payload",
          processedAt: new Date().toISOString(),
        });

        return NextResponse.json(
          { success: false, error: "Missing razorpay_order_id in order.paid payload" },
          { status: 400 }
        );
      }

      const result = await reconcileOrderPayment({
        orderId,
        orderNumber,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
      });

      const resolvedOrderId =
        result.order?.id ||
        (orderId && UUID_REGEX.test(orderId.trim()) ? orderId.trim() : null);

      await recordWebhookEvent({
        eventId,
        eventType: event,
        provider: "razorpay",
        payload,
        orderId: resolvedOrderId,
        status: result.success ? "processed" : "failed",
        errorMessage: result.success ? null : (result.error || result.message),
        processedAt: new Date().toISOString(),
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || result.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: true, message: result.message, alreadyPaid: result.alreadyPaid },
        { status: 200 }
      );
    }

    if (event === "payment.captured") {
      const paymentEntity = payload.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;
      const orderNumber =
        paymentEntity?.notes?.internal_order_id || paymentEntity?.notes?.order_number;
      const orderId = paymentEntity?.notes?.orderId || paymentEntity?.notes?.id;

      if (!razorpayOrderId || !razorpayPaymentId) {
        await recordWebhookEvent({
          eventId,
          eventType: event,
          provider: "razorpay",
          payload,
          orderId: null,
          status: "failed",
          errorMessage: "Missing Razorpay identifiers in payment.captured payload",
          processedAt: new Date().toISOString(),
        });

        return NextResponse.json(
          { success: false, error: "Missing Razorpay identifiers in payment.captured payload" },
          { status: 400 }
        );
      }

      const result = await reconcileOrderPayment({
        orderId,
        orderNumber,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
      });

      const resolvedOrderId =
        result.order?.id ||
        (orderId && UUID_REGEX.test(orderId.trim()) ? orderId.trim() : null);

      await recordWebhookEvent({
        eventId,
        eventType: event,
        provider: "razorpay",
        payload,
        orderId: resolvedOrderId,
        status: result.success ? "processed" : "failed",
        errorMessage: result.success ? null : (result.error || result.message),
        processedAt: new Date().toISOString(),
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || result.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: true, message: result.message, alreadyPaid: result.alreadyPaid },
        { status: 200 }
      );
    }

    if (event === "payment.failed") {
      const paymentEntity = payload.payload?.payment?.entity;
      const razorpayPaymentId = paymentEntity?.id;
      const razorpayOrderId = paymentEntity?.order_id;
      const orderNumber =
        paymentEntity?.notes?.internal_order_id ||
        paymentEntity?.notes?.order_number ||
        paymentEntity?.receipt;
      const orderId = paymentEntity?.notes?.orderId || paymentEntity?.notes?.id;

      const result = await recordPaymentFailure({
        orderId: orderId || undefined,
        orderNumber: orderNumber || undefined,
        razorpay_order_id: razorpayOrderId || undefined,
        razorpay_payment_id: razorpayPaymentId || undefined,
        razorpay_signature: null,
        error: {
          code: paymentEntity?.error_code || null,
          description: paymentEntity?.error_description || null,
          source: paymentEntity?.error_source || null,
          step: paymentEntity?.error_step || null,
          reason: paymentEntity?.error_reason || null,
          metadata: paymentEntity?.error_metadata || null,
        },
        rawPayload: payload,
        source: "webhook",
      });

      const resolvedOrderId =
        result.order?.id ||
        (orderId && UUID_REGEX.test(orderId.trim()) ? orderId.trim() : null);

      await recordWebhookEvent({
        eventId,
        eventType: event,
        provider: "razorpay",
        payload,
        orderId: resolvedOrderId,
        status: result.success ? "processed" : "failed",
        errorMessage: result.success ? null : (result.error || result.message),
        processedAt: new Date().toISOString(),
      });

      return NextResponse.json(
        { success: true, message: result.message, alreadyPaid: result.alreadyPaid || false },
        { status: 200 }
      );
    }

    // Unhandled event types respond with HTTP 200 OK so Razorpay does not retry unnecessarily
    await recordWebhookEvent({
      eventId,
      eventType: event || "unknown",
      provider: "razorpay",
      payload,
      orderId: null,
      status: "processed",
      processedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, message: `Event ${event} received and acknowledged` },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("Error processing Razorpay webhook:", err);
    const errorMessage = err instanceof Error ? err.message : "Internal server error";

    try {
      if (parsedPayload && parsedEvent) {
        await recordWebhookEvent({
          eventId: parsedEventId,
          eventType: parsedEvent,
          provider: "razorpay",
          payload: parsedPayload,
          orderId: null,
          status: "failed",
          errorMessage,
          processedAt: new Date().toISOString(),
        });
      }
    } catch (logErr) {
      console.error("[Razorpay Webhook] Failed to record error event in catch block:", logErr);
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
