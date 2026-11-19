import crypto from "crypto";
import {
  recordWebhookEvent,
  getExistingWebhookEvent,
  UUID_REGEX,
} from "../lib/payment/webhook-events";
import { POST as webhookRoute } from "../app/api/payment/webhook/route";
import { NextRequest } from "next/server";

const TEST_SECRET = "whsec_test_secret_for_events_logging_12345";
process.env.RAZORPAY_WEBHOOK_SECRET = TEST_SECRET;
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock-test-project.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "ey-mock-service-role-key-for-unit-tests-1234567890";

function generateSignature(body: string, secret: string = TEST_SECRET): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

async function runTests() {
  console.log("==================================================");
  console.log(" RUNNING WEBHOOK EVENTS LOGGING & IDEMPOTENCY TEST ");
  console.log("==================================================");

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

  // =========================================================================
  // SECTION 1: UNIT TESTS - recordWebhookEvent
  // =========================================================================
  console.log("\n--- SECTION 1: recordWebhookEvent Unit Tests ---");

  // TEST 1: Column Schema Verification on Insert
  let capturedInsertPayload: any = null;
  const mockSupabaseInsert: any = {
    from: (table: string) => {
      assert(table === "webhook_events", "Test 1a: Table targeted is public.webhook_events");
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
        insert: (rows: any[]) => {
          capturedInsertPayload = rows[0];
          return Promise.resolve({ error: null });
        },
      };
    },
  };

  const samplePayload = { event: "order.paid", id: "order_123" };
  const sampleOrderId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

  await recordWebhookEvent({
    eventId: "event_Test123",
    eventType: "order.paid",
    provider: "razorpay",
    payload: samplePayload,
    orderId: sampleOrderId,
    status: "processed",
    errorMessage: null,
    supabaseClient: mockSupabaseInsert,
  });

  assert(capturedInsertPayload !== null, "Test 1b: Insert was triggered");
  assert(capturedInsertPayload.event_id === "event_Test123", "Test 1c: event_id column matches");
  assert(capturedInsertPayload.event_type === "order.paid", "Test 1d: event_type column matches");
  assert(capturedInsertPayload.provider === "razorpay", "Test 1e: provider is 'razorpay'");
  assert(capturedInsertPayload.payload === samplePayload, "Test 1f: payload column matches");
  assert(capturedInsertPayload.order_id === sampleOrderId, "Test 1g: order_id is valid UUID");
  assert(capturedInsertPayload.status === "processed", "Test 1h: status is 'processed'");
  assert(capturedInsertPayload.error_message === null, "Test 1i: error_message is null");
  assert(typeof capturedInsertPayload.processed_at === "string", "Test 1j: processed_at is set");
  assert(!("created_at" in capturedInsertPayload), "Test 1k: created_at is NOT used");
  assert(!("id" in capturedInsertPayload), "Test 1l: id is NOT passed to let DB generate UUID");

  // TEST 2: Safe Order ID Normalization (Non-UUID becomes null to protect FK/type)
  let capturedNonUuidPayload: any = null;
  const mockSupabaseNonUuid: any = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
      insert: (rows: any[]) => {
        capturedNonUuidPayload = rows[0];
        return Promise.resolve({ error: null });
      },
    }),
  };

  await recordWebhookEvent({
    eventId: "event_NonUuid123",
    eventType: "payment.captured",
    payload: {},
    orderId: "CM-1002-NON-UUID",
    status: "processed",
    supabaseClient: mockSupabaseNonUuid,
  });

  assert(
    capturedNonUuidPayload.order_id === null,
    "Test 2: Non-UUID orderId normalized to null to prevent Postgres type/FK errors"
  );

  // TEST 3: Error Logging with exact prefix '[Webhook Events Insert Error]'
  const loggedErrors: any[] = [];
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    loggedErrors.push(args);
  };

  const mockPostgrestError = {
    code: "42703",
    message: "column does not exist",
    details: "column created_at does not exist",
    hint: "check schema",
  };

  const mockSupabaseError: any = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
      insert: () => Promise.resolve({ error: mockPostgrestError }),
    }),
  };

  const errRes = await recordWebhookEvent({
    eventId: "event_ErrTest",
    eventType: "payment.failed",
    payload: {},
    status: "failed",
    errorMessage: "Simulated error",
    supabaseClient: mockSupabaseError,
  });

  console.error = originalConsoleError;
  assert(errRes.success === false, "Test 3a: recordWebhookEvent safely reports failure");
  const matchingLog = loggedErrors.find(
    (call) => call[0] === "[Webhook Events Insert Error]" && call[1] === mockPostgrestError
  );
  assert(
    matchingLog !== undefined,
    "Test 3b: console.error('[Webhook Events Insert Error]', error) called with PostgREST error"
  );

  // TEST 4: Idempotent Update on Existing Event (Duplicate Retry)
  let capturedUpdatePayload: any = null;
  let capturedUpdateIdFilter: any = null;
  const mockSupabaseExisting: any = {
    from: () => ({
      select: () => ({
        eq: (col: string, val: string) => ({
          maybeSingle: async () => ({
            data: {
              id: "existing-uuid-999",
              event_id: val,
              status: "failed",
            },
            error: null,
          }),
        }),
      }),
      update: (updateFields: any) => {
        capturedUpdatePayload = updateFields;
        return {
          eq: (col: string, val: string) => {
            capturedUpdateIdFilter = { col, val };
            return Promise.resolve({ error: null });
          },
        };
      },
    }),
  };

  await recordWebhookEvent({
    eventId: "event_Retry123",
    eventType: "order.paid",
    payload: { retry: true },
    orderId: sampleOrderId,
    status: "processed",
    errorMessage: null,
    supabaseClient: mockSupabaseExisting,
  });

  assert(
    capturedUpdateIdFilter?.col === "id" && capturedUpdateIdFilter?.val === "existing-uuid-999",
    "Test 4a: Existing record updated by primary key id"
  );
  assert(
    capturedUpdatePayload.status === "processed",
    "Test 4b: Existing failed record updated to 'processed'"
  );
  assert(
    capturedUpdatePayload.provider === "razorpay",
    "Test 4c: Provider is razorpay"
  );

  // TEST 5: Fallback Update on 23505 Unique Constraint Race Condition
  let capturedFallbackUpdatePayload: any = null;
  let capturedFallbackFilter: any = null;
  const mockSupabaseRace: any = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
      insert: () => Promise.resolve({ error: { code: "23505", message: "duplicate key" } }),
      update: (updateFields: any) => {
        capturedFallbackUpdatePayload = updateFields;
        return {
          eq: (col: string, val: string) => {
            capturedFallbackFilter = { col, val };
            return Promise.resolve({ error: null });
          },
        };
      },
    }),
  };

  const raceRes = await recordWebhookEvent({
    eventId: "event_RaceCondition",
    eventType: "payment.captured",
    payload: {},
    orderId: sampleOrderId,
    status: "processed",
    supabaseClient: mockSupabaseRace,
  });

  assert(raceRes.success === true, "Test 5a: Race condition handled smoothly");
  assert(
    capturedFallbackFilter?.col === "event_id" && capturedFallbackFilter?.val === "event_RaceCondition",
    "Test 5b: Fallback update by event_id executed"
  );

  // TEST 6: getExistingWebhookEvent helper
  const mockSupabaseGet: any = {
    from: () => ({
      select: () => ({
        eq: (col: string, val: string) => ({
          maybeSingle: async () => ({
            data: { event_id: val, status: "processed" },
            error: null,
          }),
        }),
      }),
    }),
  };

  const found = await getExistingWebhookEvent("event_QueryTest", mockSupabaseGet);
  assert(found !== null && found.status === "processed", "Test 6: getExistingWebhookEvent returns record");

  // =========================================================================
  // SECTION 2: END-TO-END WEBHOOK ROUTE TESTS (Signature, Validation, Dispatch)
  // =========================================================================
  console.log("\n--- SECTION 2: Webhook Route End-to-End Tests ---");

  // Mock global fetch to respond instantly with simulated PostgREST responses
  const originalFetch = globalThis.fetch;
  const mockDbStorage = new Map<string, any>();

  globalThis.fetch = async (input: any, init?: any): Promise<Response> => {
    const urlStr = typeof input === "string" ? input : input.url;
    const method = init?.method || "GET";

    if (urlStr.includes("/rest/v1/webhook_events")) {
      // Handle GET (maybeSingle)
      if (method === "GET") {
        const urlObj = new URL(urlStr);
        const eventIdFilter = urlObj.searchParams.get("event_id");
        const cleanEventId = eventIdFilter ? eventIdFilter.replace(/^eq\./, "") : null;
        if (cleanEventId && mockDbStorage.has(cleanEventId)) {
          return new Response(JSON.stringify(mockDbStorage.get(cleanEventId)), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify(null), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle POST (insert)
      if (method === "POST") {
        const body = JSON.parse(init?.body || "[]");
        const row = Array.isArray(body) ? body[0] : body;
        mockDbStorage.set(row.event_id, { id: "mock-uuid-" + Date.now(), ...row });
        return new Response(JSON.stringify([row]), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle PATCH (update)
      if (method === "PATCH") {
        const body = JSON.parse(init?.body || "{}");
        const urlObj = new URL(urlStr);
        const idFilter = urlObj.searchParams.get("id");
        const cleanId = idFilter ? idFilter.replace(/^eq\./, "") : null;
        for (const [evtId, stored] of mockDbStorage.entries()) {
          if (stored.id === cleanId || stored.event_id === evtId) {
            Object.assign(stored, body);
            break;
          }
        }
        return new Response(JSON.stringify([body]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    // TEST 7: Missing Signature Rejection
    const reqNoSig = new NextRequest("http://localhost/api/payment/webhook", {
      method: "POST",
      body: JSON.stringify({ event: "order.paid" }),
    });
    const resNoSig = await webhookRoute(reqNoSig);
    const jsonNoSig = await resNoSig.json();
    assert(resNoSig.status === 400 && jsonNoSig.success === false, "Test 7: Missing signature returns 400");

    // TEST 8: Invalid Signature Rejection
    const bodyValid = JSON.stringify({ event: "order.paid" });
    const reqBadSig = new NextRequest("http://localhost/api/payment/webhook", {
      method: "POST",
      headers: {
        "x-razorpay-signature": "bad_signature_12345",
        "x-razorpay-event-id": "evt_bad_sig",
      },
      body: bodyValid,
    });
    const resBadSig = await webhookRoute(reqBadSig);
    const jsonBadSig = await resBadSig.json();
    assert(resBadSig.status === 400 && jsonBadSig.error === "Invalid webhook signature", "Test 8: Invalid signature returns 400");

    // TEST 9: Valid Signature & Missing razorpay_order_id on order.paid
    const bodyMissingOrderId = JSON.stringify({
      event: "order.paid",
      payload: {
        order: { entity: {} },
      },
    });
    const sigMissingOrderId = generateSignature(bodyMissingOrderId);
    const reqMissingOrderId = new NextRequest("http://localhost/api/payment/webhook", {
      method: "POST",
      headers: {
        "x-razorpay-signature": sigMissingOrderId,
        "x-razorpay-event-id": "evt_missing_order_id",
      },
      body: bodyMissingOrderId,
    });
    const resMissingOrderId = await webhookRoute(reqMissingOrderId);
    const jsonMissingOrderId = await resMissingOrderId.json();
    assert(
      resMissingOrderId.status === 400 && jsonMissingOrderId.error.includes("Missing razorpay_order_id"),
      "Test 9: Missing razorpay_order_id on order.paid returns 400"
    );

    // TEST 10: Valid Signature & Missing identifiers on payment.captured
    const bodyMissingPaymentId = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: { entity: { id: "pay_123" } }, // missing order_id
      },
    });
    const sigMissingPaymentId = generateSignature(bodyMissingPaymentId);
    const reqMissingPaymentId = new NextRequest("http://localhost/api/payment/webhook", {
      method: "POST",
      headers: {
        "x-razorpay-signature": sigMissingPaymentId,
        "x-razorpay-event-id": "evt_missing_pay_id",
      },
      body: bodyMissingPaymentId,
    });
    const resMissingPaymentId = await webhookRoute(reqMissingPaymentId);
    const jsonMissingPaymentId = await resMissingPaymentId.json();
    assert(
      resMissingPaymentId.status === 400 && jsonMissingPaymentId.error.includes("Missing Razorpay identifiers"),
      "Test 10: Missing identifiers on payment.captured returns 400"
    );

    // TEST 11: Idempotency - Duplicate Webhook Delivery Acknowledgment
    mockDbStorage.set("evt_duplicate_test", {
      id: "uuid-dup-111",
      event_id: "evt_duplicate_test",
      event_type: "order.paid",
      provider: "razorpay",
      status: "processed",
      order_id: sampleOrderId,
      processed_at: new Date(Date.now() - 60000).toISOString(),
    });

    const bodyDuplicate = JSON.stringify({
      event: "order.paid",
      payload: {
        order: {
          entity: {
            id: "order_dup123",
            receipt: "CM-9999",
          },
        },
      },
    });
    const sigDuplicate = generateSignature(bodyDuplicate);
    const reqDuplicate = new NextRequest("http://localhost/api/payment/webhook", {
      method: "POST",
      headers: {
        "x-razorpay-signature": sigDuplicate,
        "x-razorpay-event-id": "evt_duplicate_test",
      },
      body: bodyDuplicate,
    });
    const resDuplicate = await webhookRoute(reqDuplicate);
    const jsonDuplicate = await resDuplicate.json();
    assert(
      resDuplicate.status === 200 && jsonDuplicate.message === "Event already processed",
      "Test 11a: Duplicate webhook retry returns 200 OK 'Event already processed'"
    );
    const updatedDupRecord = mockDbStorage.get("evt_duplicate_test");
    assert(
      updatedDupRecord && updatedDupRecord.status === "processed",
      "Test 11b: Webhook event status remains 'processed' on duplicate retry"
    );

    // TEST 12: Unhandled Event Logging & Acknowledgment
    const bodyUnhandled = JSON.stringify({
      event: "refund.processed",
      payload: { refund: { entity: { id: "rfnd_123" } } },
    });
    const sigUnhandled = generateSignature(bodyUnhandled);
    const reqUnhandled = new NextRequest("http://localhost/api/payment/webhook", {
      method: "POST",
      headers: {
        "x-razorpay-signature": sigUnhandled,
        "x-razorpay-event-id": "evt_unhandled_test",
      },
      body: bodyUnhandled,
    });
    const resUnhandled = await webhookRoute(reqUnhandled);
    const jsonUnhandled = await resUnhandled.json();
    assert(
      resUnhandled.status === 200 && jsonUnhandled.message.includes("refund.processed"),
      "Test 12a: Unhandled event acknowledged with HTTP 200"
    );
    const unhandledRecord = mockDbStorage.get("evt_unhandled_test");
    assert(
      unhandledRecord && unhandledRecord.status === "processed" && unhandledRecord.provider === "razorpay",
      "Test 12b: Unhandled event logged in webhook_events with provider 'razorpay' and status 'processed'"
    );

  } finally {
    globalThis.fetch = originalFetch;
  }


  console.log("==================================================");
  console.log(` ALL TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
