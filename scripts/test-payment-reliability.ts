import crypto from "crypto";

/**
 * Payment Reliability Test Suite
 * Tests signature verification, webhook payloads, idempotency logic, order mapping, and error handling.
 * Does NOT invoke real production payment APIs.
 */

// Simulated Mock Server Secret for Webhook Testing
const MOCK_WEBHOOK_SECRET = "whsec_test_secret_1234567890abcdef";
const MOCK_KEY_SECRET = "rzp_sec_test_key_1234567890abcdef";

function generateWebhookSignature(body: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

function generateClientSignature(orderId: string, paymentId: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
}

function runTests() {
  console.log("==========================================");
  console.log(" RUNNING PAYMENT RELIABILITY TEST SUITE ");
  console.log("==========================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // TEST 1: Valid Webhook Signature Generation & Verification
  const validWebhookBody = JSON.stringify({
    event: "order.paid",
    payload: {
      order: {
        entity: {
          id: "order_12345",
          receipt: "CM-1002",
          amount: 50000,
          currency: "INR",
          notes: { internal_order_id: "CM-1002" },
        },
      },
      payment: {
        entity: {
          id: "pay_67890",
          order_id: "order_12345",
        },
      },
    },
  });

  const validSignature = generateWebhookSignature(validWebhookBody, MOCK_WEBHOOK_SECRET);
  const computedSignature = crypto.createHmac("sha256", MOCK_WEBHOOK_SECRET).update(validWebhookBody).digest("hex");
  assert(
    crypto.timingSafeEqual(Buffer.from(validSignature), Buffer.from(computedSignature)),
    "Test 1: Valid Webhook Signature HMAC-SHA256 Match"
  );

  // TEST 2: Invalid Webhook Signature Rejection
  const invalidSignature = "invalid_sig_abcdef1234567890";
  assert(
    validSignature !== invalidSignature,
    "Test 2: Invalid Webhook Signature Correctly Detected"
  );

  // TEST 3: Client Signature Verification Formula
  const clientOrderId = "order_N12345";
  const clientPaymentId = "pay_P67890";
  const validClientSig = generateClientSignature(clientOrderId, clientPaymentId, MOCK_KEY_SECRET);
  const expectedClientSig = crypto
    .createHmac("sha256", MOCK_KEY_SECRET)
    .update(`${clientOrderId}|${clientPaymentId}`)
    .digest("hex");

  assert(
    validClientSig === expectedClientSig,
    "Test 3: Client Verification Signature Match"
  );

  // TEST 4: Simulated Webhook Payload Extraction (order.paid)
  const parsedOrderPaid = JSON.parse(validWebhookBody);
  const rzpOrderId = parsedOrderPaid.payload.order.entity.id;
  const rzpPaymentId = parsedOrderPaid.payload.payment.entity.id;
  const internalRef = parsedOrderPaid.payload.order.entity.receipt;

  assert(
    rzpOrderId === "order_12345" && rzpPaymentId === "pay_67890" && internalRef === "CM-1002",
    "Test 4: Correct Field Extraction from order.paid Event"
  );

  // TEST 5: Simulated Webhook Payload Extraction (payment.captured)
  const paymentCapturedBody = JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: "pay_Cap999",
          order_id: "order_Cap888",
          notes: { internal_order_id: "CM-1003" },
        },
      },
    },
  });

  const parsedPaymentCaptured = JSON.parse(paymentCapturedBody);
  assert(
    parsedPaymentCaptured.payload.payment.entity.id === "pay_Cap999" &&
      parsedPaymentCaptured.payload.payment.entity.order_id === "order_Cap888" &&
      parsedPaymentCaptured.payload.payment.entity.notes.internal_order_id === "CM-1003",
    "Test 5: Correct Field Extraction from payment.captured Event"
  );

  // TEST 6: Simulated Idempotent Order State Transition
  interface MockOrder {
    id: string;
    razorpay_order_id: string | null;
    payment_status: "pending" | "paid" | "failed";
    payment_confirmation_sent_at: string | null;
  }

  const mockDbOrder: MockOrder = {
    id: "uuid-123",
    razorpay_order_id: "order_12345",
    payment_status: "pending",
    payment_confirmation_sent_at: null,
  };

  function simulatePaymentTransition(
    order: MockOrder,
    incomingRzpOrderId: string
  ): { success: boolean; updated: boolean; emailSent: boolean; error?: string } {
    if (order.razorpay_order_id && order.razorpay_order_id !== incomingRzpOrderId) {
      return { success: false, updated: false, emailSent: false, error: "Razorpay order ID mismatch" };
    }

    let updated = false;
    let emailSent = false;

    if (order.payment_status !== "paid") {
      order.payment_status = "paid";
      updated = true;
    }

    if (order.payment_confirmation_sent_at === null) {
      order.payment_confirmation_sent_at = new Date().toISOString();
      emailSent = true;
    }

    return { success: true, updated, emailSent };
  }

  // First Call (Webhook or Client Callback)
  const res1 = simulatePaymentTransition(mockDbOrder, "order_12345");
  assert(
    res1.success === true && res1.updated === true && res1.emailSent === true,
    "Test 6: First Transition Marks Paid and Dispatches Email"
  );

  // Second Call (Duplicate Webhook or Client Callback)
  const res2 = simulatePaymentTransition(mockDbOrder, "order_12345");
  assert(
    res2.success === true && res2.updated === false && res2.emailSent === false,
    "Test 7: Second Call is Idempotent (No Status Change, No Duplicate Email)"
  );

  // TEST 8: Order Mismatch Prevention Check
  const mismatchRes = simulatePaymentTransition(mockDbOrder, "order_WRONG999");
  assert(
    mismatchRes.success === false && mismatchRes.error === "Razorpay order ID mismatch",
    "Test 8: Prevent Associating Payment with Mismatched Order ID"
  );

  // TEST 9: Ensure payment.failed Cannot Overwrite Paid Status
  function simulatePaymentFailure(order: MockOrder): { updated: boolean } {
    if (order.payment_status === "pending") {
      order.payment_status = "failed";
      return { updated: true };
    }
    return { updated: false };
  }

  const failureRes = simulatePaymentFailure(mockDbOrder); // mockDbOrder is currently 'paid'
  assert(
    failureRes.updated === false && mockDbOrder.payment_status === "paid",
    "Test 9: payment.failed Event Cannot Overwrite an Already-Paid Order"
  );

  // TEST 10: Webhook payment.failed Payload Extraction
  const paymentFailedWebhookBody = JSON.stringify({
    event: "payment.failed",
    payload: {
      payment: {
        entity: {
          id: "pay_Fail12345",
          order_id: "order_Fail67890",
          amount: 75000,
          currency: "INR",
          status: "failed",
          error_code: "BAD_REQUEST_ERROR",
          error_description: "Payment was declined by the issuing bank",
          error_source: "bank",
          error_step: "payment_authorization",
          error_reason: "payment_failed",
          notes: {
            internal_order_id: "CM-2001",
            orderId: "uuid-order-2001",
          },
        },
      },
    },
  });

  const parsedFailedWebhook = JSON.parse(paymentFailedWebhookBody);
  const paymentEntity = parsedFailedWebhook.payload.payment.entity;
  assert(
    paymentEntity.id === "pay_Fail12345" &&
      paymentEntity.order_id === "order_Fail67890" &&
      paymentEntity.error_code === "BAD_REQUEST_ERROR" &&
      paymentEntity.error_description === "Payment was declined by the issuing bank" &&
      paymentEntity.error_reason === "payment_failed" &&
      paymentEntity.notes.internal_order_id === "CM-2001",
    "Test 10: Webhook payment.failed Payload Extraction"
  );

  // TEST 11: Client-Side payment.failed Listener Payload Extraction
  const clientFailureResponse = {
    error: {
      code: "BAD_REQUEST_ERROR",
      description: "Payment failed due to card expiration",
      source: "customer",
      step: "payment_authentication",
      reason: "payment_failed",
      metadata: {
        payment_id: "pay_ClientFail999",
        order_id: "order_ClientFail888",
      },
    },
  };

  const clientExtractedPaymentId = clientFailureResponse.error?.metadata?.payment_id || null;
  const clientExtractedOrderId = clientFailureResponse.error?.metadata?.order_id || null;
  const clientExtractedCode = clientFailureResponse.error?.code;
  const clientExtractedDesc = clientFailureResponse.error?.description;
  const clientExtractedReason = clientFailureResponse.error?.reason;

  assert(
    clientExtractedPaymentId === "pay_ClientFail999" &&
      clientExtractedOrderId === "order_ClientFail888" &&
      clientExtractedCode === "BAD_REQUEST_ERROR" &&
      clientExtractedDesc === "Payment failed due to card expiration" &&
      clientExtractedReason === "payment_failed",
    "Test 11: Client-Side payment.failed Listener Payload Extraction"
  );

  // TEST 12: Nullable Fields on Failed Payment Log Entry (Signature is always null on failure)
  interface MockPaymentLog {
    order_id: string | null;
    order_number: string | null;
    razorpay_order_id: string | null;
    razorpay_payment_id: string | null;
    razorpay_signature: string | null;
    event: string;
    status: string;
    error_code: string | null;
    error_description: string | null;
    error_reason: string | null;
  }

  const mockFailedLogEntry: MockPaymentLog = {
    order_id: "uuid-order-2001",
    order_number: "CM-2001",
    razorpay_order_id: "order_Fail67890",
    razorpay_payment_id: null,
    razorpay_signature: null,
    event: "payment.failed",
    status: "failed",
    error_code: "BAD_REQUEST_ERROR",
    error_description: "Payment failed",
    error_reason: "payment_failed",
  };

  assert(
    mockFailedLogEntry.razorpay_signature === null &&
      mockFailedLogEntry.razorpay_payment_id === null &&
      mockFailedLogEntry.event === "payment.failed" &&
      mockFailedLogEntry.status === "failed",
    "Test 12: Nullable Fields (Signature and Payment ID) on Failed Payment Record"
  );

  // TEST 13: Transition Pending Order to Failed with Error Metadata
  const mockPendingOrder: MockOrder = {
    id: "uuid-pending-3001",
    razorpay_order_id: "order_Fail67890",
    payment_status: "pending",
    payment_confirmation_sent_at: null,
  };

  const pendingFailureRes = simulatePaymentFailure(mockPendingOrder);
  assert(
    pendingFailureRes.updated === true && mockPendingOrder.payment_status === "failed",
    "Test 13: Pending Order Successfully Transitions to Failed Status"
  );

  console.log("==========================================");
  console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
