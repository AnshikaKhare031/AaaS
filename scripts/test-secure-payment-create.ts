import { handleCreatePaymentOrder, _resetInFlightCreations } from "../lib/payment/create-order";
import type { CustomerSessionPayload } from "../lib/auth/customer-session";
import fs from "fs";
import path from "path";

/**
 * Phase 1 Unit & Contract Test Suite: Secure Razorpay Create-Order Endpoint
 * 
 * Baseline security scenarios (1-10):
 * 1. Unauthenticated request rejected (401).
 * 2. Authenticated user cannot pay for another user's order (403 or 404).
 * 3. Client-supplied amount is ignored; DB total is used.
 * 4. Total converted to paise correctly (Math.round(total * 100)).
 * 5. Missing order returns 404.
 * 6. Already-paid order rejected.
 * 7. Zero or negative database total rejected.
 * 8. Lookup by canonical AAAS- order number succeeds.
 * 9. Lookup by valid UUID succeeds.
 * 10. Database persistence failure of razorpay_order_id handled safely (no false success).
 * 
 * Behavioral edge-case tests (Phase 1.2 Audit gaps, 11-15):
 * 11. Razorpay gateway creation failure returns HTTP 502 (G1).
 * 12. Non-pending order statuses ('failed', 'expired') rejected with HTTP 400 (G2).
 * 13. Malformed / non-JSON request body returns HTTP 400 (G3).
 * 14. Missing or whitespace-only orderId returns HTTP 400 (G4).
 * 15. Missing required Razorpay configuration returns HTTP 500 without false success (G5).
 * 
 * Concurrency & Idempotency tests (16-20):
 * 16. Two simultaneous create-order requests cannot create competing orders.
 * 17. Existing valid, usable gateway order is verified and reused without creating a duplicate.
 * 18. Existing gateway order marked 'paid' on Razorpay is rejected (HTTP 400).
 * 19. Existing gateway order with mismatched total/receipt triggers fresh creation.
 * 20. Transient database update failure recovers on bounded retry.
 * 
 * Phase 1.5 Concurrency Defect Fixes (21-25):
 * 21. Distributed lock RPC missing or failing returns HTTP 503 and never invokes gateway.
 * 22. Distributed lock held and polling times out returns HTTP 409 and never invokes gateway.
 * 23. CAS update affects 0 rows, re-fetches winner from DB and safely returns winner ID.
 * 24. CAS update affects 0 rows with mismatched amount in DB returns HTTP 409 non-success response.
 * 25. Token-scoped lock cleanup invokes release_payment_creation_lock with matching token.
 */

function createMockSession(userId?: string): CustomerSessionPayload | null {
  if (!userId) return null;
  return {
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
    expiresAt: Date.now() + 3600 * 1000,
    user: {
      id: userId,
      email: `${userId}@example.com`,
      fullName: "Test Customer",
      avatarUrl: null,
      createdAt: new Date().toISOString(),
    },
  };
}

interface MockSupabaseOptions {
  order?: Record<string, unknown> | null;
  orderError?: Record<string, unknown> | null;
  updateError?: Record<string, unknown> | null;
  updateFailAttempts?: number;
  sharedOrder?: Record<string, unknown>;
  rpcError?: Record<string, unknown> | null;
  lockHeld?: boolean;
  casZeroRows?: boolean;
  rpcMissing?: boolean;
}

function createMockSupabase(options: MockSupabaseOptions = {}) {
  let queriedField: string | null = null;
  let queriedValue: string | null = null;
  let updatedPayload: Record<string, unknown> | null = null;
  let updatedId: string | null = null;
  let updateAttempts = 0;
  let lastRpcCalled: string | null = null;
  let lastRpcParams: Record<string, unknown> | null = null;

  const getActiveOrder = () => {
    if (options.sharedOrder !== undefined) return options.sharedOrder;
    if (options.order !== undefined) return options.order;
    return null;
  };

  const client: Record<string, unknown> = {
    from: (table: string) => {
      if (table !== "orders") throw new Error(`Unexpected table: ${table}`);
      return {
        select: () => ({
          eq: (field: string, val: string) => {
            queriedField = field;
            queriedValue = val;
            return {
              maybeSingle: async () => ({
                data: getActiveOrder(),
                error: options.orderError || null,
              }),
            };
          },
        }),
        update: (payload: Record<string, unknown>) => {
          updatedPayload = payload;
          updateAttempts++;

          const executeUpdate = () => {
            let error = options.updateError || null;
            if (options.updateFailAttempts && updateAttempts > options.updateFailAttempts) {
              error = null;
            }

            if (!error && !options.casZeroRows) {
              const active = getActiveOrder();
              if (active) {
                Object.assign(active, payload);
              }
            }

            const returnData = options.casZeroRows ? null : (getActiveOrder() || payload);

            return {
              data: returnData,
              error,
            };
          };

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const builder: any = {
            eq: (field: string, val: string) => {
              if (field === "id") updatedId = val;
              return builder;
            },
            is: () => {
              return builder;
            },
            select: () => ({
              maybeSingle: async () => executeUpdate(),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              then: (onfulfilled: any, onrejected: any) =>
                Promise.resolve(executeUpdate()).then(onfulfilled, onrejected),
            }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            then: (onfulfilled: any, onrejected: any) => {
              return Promise.resolve(executeUpdate()).then(onfulfilled, onrejected);
            },
          };

          return builder;
        },
      };
    },
  };

  if (!options.rpcMissing) {
    client.rpc = async (fn: string, params: Record<string, unknown>) => {
      lastRpcCalled = fn;
      lastRpcParams = params;

      if (options.rpcError) {
        return { data: null, error: options.rpcError };
      }

      if (fn === "claim_payment_creation_lock") {
        if (options.lockHeld) {
          return { data: false, error: null };
        }
        return { data: true, error: null };
      }

      if (fn === "release_payment_creation_lock") {
        return { data: true, error: null };
      }

      return { data: null, error: { message: `Unknown RPC: ${fn}`, code: "PGRST202" } };
    };
  }

  return {
    client,
    getQueriedField: () => queriedField,
    getQueriedValue: () => queriedValue,
    getUpdatedPayload: () => updatedPayload,
    getUpdatedId: () => updatedId,
    getUpdateAttempts: () => updateAttempts,
    getLastRpcCalled: () => lastRpcCalled,
    getLastRpcParams: () => lastRpcParams,
  };
}

interface MockRazorpayOptions {
  order?: {
    id: string;
    amount?: number;
    currency?: string;
    status?: string;
    receipt?: string;
    notes?: Record<string, string>;
  };
  throwError?: Error;
  createDelayMs?: number;
  fetchHandler?: (id: string) => Promise<unknown> | unknown;
}

function createMockRazorpay(options: MockRazorpayOptions = {}) {
  let capturedOptions: Record<string, unknown> | null = null;
  let createCallCount = 0;
  let fetchCallCount = 0;

  const razorpay = {
    orders: {
      create: async (opts: Record<string, unknown>) => {
        createCallCount++;
        capturedOptions = opts;

        if (options.createDelayMs) {
          await new Promise((resolve) => setTimeout(resolve, options.createDelayMs));
        }

        if (options.throwError) {
          throw options.throwError;
        }

        return (
          options.order || {
            id: `order_rzp_mock_${createCallCount}`,
            amount: opts.amount,
            currency: opts.currency || "INR",
            status: "created",
            receipt: opts.receipt,
          }
        );
      },
      fetch: async (orderId: string) => {
        fetchCallCount++;
        if (options.fetchHandler) {
          return options.fetchHandler(orderId);
        }
        if (options.order) {
          return options.order;
        }
        return {
          id: orderId,
          amount: 250000,
          currency: "INR",
          status: "created",
          receipt: "AAAS-REUSE",
        };
      },
    },
  };

  return {
    razorpay,
    getCapturedOptions: () => capturedOptions,
    getCreateCallCount: () => createCallCount,
    getFetchCallCount: () => fetchCallCount,
  };
}

function makeRequest(body: unknown, isRawText = false) {
  return new Request("http://localhost/api/payment/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: isRawText ? (body as string) : JSON.stringify(body),
  });
}

async function runSuite() {
  console.log("==================================================================");
  console.log("   PHASE 1.5: SECURE RAZORPAY CONCURRENCY DEFECT REGRESSION SUITE ");
  console.log("==================================================================\n");

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

  const TEST_PUBLIC_KEY = "rzp_test_public_key_abc123";

  // ---------------------------------------------------------------------------
  // TEST 1: Unauthenticated request rejected (401)
  // ---------------------------------------------------------------------------
  {
    _resetInFlightCreations();
    const req = makeRequest({ orderId: "AAAS-1001", amount: 2500 });
    const mockDb = createMockSupabase();
    const mockRzp = createMockRazorpay();

    const res = await handleCreatePaymentOrder(req, {
      getCustomerSession: async () => null,
      createServerSupabaseClient: () => mockDb.client,
      getRazorpayServerClient: () => mockRzp.razorpay,
      publicKey: TEST_PUBLIC_KEY,
    });

    const data = await res.json();
    assert(
      res.status === 401 && data.success === false && data.error === "Unauthorized.",
      "Test 1: Unauthenticated request rejected with HTTP 401"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Authenticated user cannot pay for another user's order (403 or 404)
  // ---------------------------------------------------------------------------
  {
    _resetInFlightCreations();
    const req = makeRequest({ orderId: "AAAS-1001" });
    const mockDb = createMockSupabase({
      order: {
        id: "order-uuid-other-user",
        order_number: "AAAS-1001",
        user_id: "user-victim-999",
        total: 3500.0,
        currency: "INR",
        payment_status: "pending",
      },
    });
    const mockRzp = createMockRazorpay();

    const res = await handleCreatePaymentOrder(req, {
      getCustomerSession: async () => createMockSession("user-attacker-111"),
      createServerSupabaseClient: () => mockDb.client,
      getRazorpayServerClient: () => mockRzp.razorpay,
      publicKey: TEST_PUBLIC_KEY,
    });

    const data = await res.json();
    assert(
      (res.status === 403 || res.status === 404) &&
        data.success === false &&
        mockRzp.getCapturedOptions() === null,
      "Test 2: Authenticated user cannot pay for another user's order (returns 403 or 404 without leaking details)"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Client-supplied amount is ignored; DB total is used
  // ---------------------------------------------------------------------------
  {
    _resetInFlightCreations();
    const req = makeRequest({
      orderId: "AAAS-1002",
      amount: 1, // Malicious attempt to pay Rs 1
    });
    const mockDb = createMockSupabase({
      order: {
        id: "order-uuid-tamper",
        order_number: "AAAS-1002",
        user_id: "user-patron-100",
        total: 4999.0, // Authoritative DB total
        currency: "INR",
        payment_status: "pending",
      },
    });
    const mockRzp = createMockRazorpay();

    const res = await handleCreatePaymentOrder(req, {
      getCustomerSession: async () => createMockSession("user-patron-100"),
      createServerSupabaseClient: () => mockDb.client,
      getRazorpayServerClient: () => mockRzp.razorpay,
      publicKey: TEST_PUBLIC_KEY,
    });

    const data = await res.json();
    const capturedOptions = mockRzp.getCapturedOptions();

    assert(
      res.status === 200 &&
        data.success === true &&
        data.amount === 4999.0 &&
        capturedOptions !== null &&
        capturedOptions.amount === 499900,
      "Test 3: Client-supplied amount is ignored; authoritative DB total (Rs 4999 = 499900 paise) is strictly used"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 4: Total converted to paise correctly (Math.round(total * 100))
  // ---------------------------------------------------------------------------
  {
    _resetInFlightCreations();
    const req1 = makeRequest({ orderId: "AAAS-FLOAT" });
    const mockDb1 = createMockSupabase({
      order: {
        id: "order-uuid-float",
        order_number: "AAAS-FLOAT",
        user_id: "user-patron-float",
        total: 19.99,
        currency: "INR",
        payment_status: "pending",
      },
    });
    const mockRzp1 = createMockRazorpay();

    const res1 = await handleCreatePaymentOrder(req1, {
      getCustomerSession: async () => createMockSession("user-patron-float"),
      createServerSupabaseClient: () => mockDb1.client,
      getRazorpayServerClient: () => mockRzp1.razorpay,
      publicKey: TEST_PUBLIC_KEY,
    });

    const opts1 = mockRzp1.getCapturedOptions();

    _resetInFlightCreations();
    const req2 = makeRequest({ orderId: "AAAS-CENTS" });
    const mockDb2 = createMockSupabase({
      order: {
        id: "order-uuid-cents",
        order_number: "AAAS-CENTS",
        user_id: "user-patron-cents",
        total: 1249.5,
        currency: "INR",
        payment_status: "pending",
      },
    });
    const mockRzp2 = createMockRazorpay();

    const res2 = await handleCreatePaymentOrder(req2, {
      getCustomerSession: async () => createMockSession("user-patron-cents"),
      createServerSupabaseClient: () => mockDb2.client,
      getRazorpayServerClient: () => mockRzp2.razorpay,
      publicKey: TEST_PUBLIC_KEY,
    });

    const opts2 = mockRzp2.getCapturedOptions();

    assert(
      res1.status === 200 &&
        opts1?.amount === 1999 &&
        res2.status === 200 &&
        opts2?.amount === 124950,
      "Test 4: Total accurately converted to integer paise using Math.round (19.99 -> 1999 paise, 1249.50 -> 124950 paise)"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Missing order returns 404
  // ---------------------------------------------------------------------------
  {
    _resetInFlightCreations();
    const req = makeRequest({ orderId: "AAAS-NONEXISTENT" });
    const mockDb = createMockSupabase({ order: null });
    const mockRzp = createMockRazorpay();

    const res = await handleCreatePaymentOrder(req, {
      getCustomerSession: async () => createMockSession("user-patron-5"),
      createServerSupabaseClient: () => mockDb.client,
      getRazorpayServerClient: () => mockRzp.razorpay,
      publicKey: TEST_PUBLIC_KEY,
    });

    const data = await res.json();
    assert(
      res.status === 404 &&
        data.success === false &&
        data.error === "Order not found." &&
        mockRzp.getCapturedOptions() === null,
      "Test 5: Missing order returns HTTP 404 and halts payment creation"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 6: Already-paid order rejected
  // ---------------------------------------------------------------------------
  {
    _resetInFlightCreations();
    const req = makeRequest({ orderId: "AAAS-ALREADY-PAID" });
    const mockDb = createMockSupabase({
      order: {
        id: "order-uuid-paid",
        order_number: "AAAS-ALREADY-PAID",
        user_id: "user-patron-paid",
        total: 2000.0,
        currency: "INR",
        payment_status: "paid",
        razorpay_order_id: "order_existing_123",
      },
    });
    const mockRzp = createMockRazorpay();

    const res = await handleCreatePaymentOrder(req, {
      getCustomerSession: async () => createMockSession("user-patron-paid"),
      createServerSupabaseClient: () => mockDb.client,
      getRazorpayServerClient: () => mockRzp.razorpay,
      publicKey: TEST_PUBLIC_KEY,
    });

    const data = await res.json();
    assert(
      res.status === 400 &&
        data.success === false &&
        data.error.includes("already paid") &&
        mockRzp.getCapturedOptions() === null,
      "Test 6: Already-paid order rejected with HTTP 400 without invoking gateway"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 7: Zero or negative database total rejected
  // ---------------------------------------------------------------------------
  {
    _resetInFlightCreations();
    const reqZero = makeRequest({ orderId: "AAAS-ZERO" });
    const mockDbZero = createMockSupabase({
      order: {
        id: "order-uuid-zero",
        order_number: "AAAS-ZERO",
        user_id: "user-patron-7",
        total: 0,
        currency: "INR",
        payment_status: "pending",
      },
    });
    const mockRzpZero = createMockRazorpay();

    const resZero = await handleCreatePaymentOrder(reqZero, {
      getCustomerSession: async () => createMockSession("user-patron-7"),
      createServerSupabaseClient: () => mockDbZero.client,
      getRazorpayServerClient: () => mockRzpZero.razorpay,
      publicKey: TEST_PUBLIC_KEY,
    });
    const dataZero = await resZero.json();

    _resetInFlightCreations();
    const reqNeg = makeRequest({ orderId: "AAAS-NEG" });
    const mockDbNeg = createMockSupabase({
      order: {
        id: "order-uuid-neg",
        order_number: "AAAS-NEG",
        user_id: "user-patron-7",
        total: -50.0,
        currency: "INR",
        payment_status: "pending",
      },
    });
    const mockRzpNeg = createMockRazorpay();

    const resNeg = await handleCreatePaymentOrder(reqNeg, {
      getCustomerSession: async () => createMockSession("user-patron-7"),
      createServerSupabaseClient: () => mockDbNeg.client,
      getRazorpayServerClient: () => mockRzpNeg.razorpay,
      publicKey: TEST_PUBLIC_KEY,
    });
    const dataNeg = await resNeg.json();

    assert(
      resZero.status === 400 &&
        dataZero.success === false &&
        mockRzpZero.getCapturedOptions() === null &&
        resNeg.status === 400 &&
        dataNeg.success === false &&
        mockRzpNeg.getCapturedOptions() === null,
      "Test 7: Zero or negative database total strictly rejected with HTTP 400"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 8: Lookup by canonical AAAS- order number succeeds
  // ---------------------------------------------------------------------------
  {
    _resetInFlightCreations();
    const req = makeRequest({ orderId: "AAAS-8888" });
    const mockDb = createMockSupabase({
      order: {
        id: "a0b1c2d3-4567-4890-abcd-ef0123456789",
        order_number: "AAAS-8888",
        user_id: "user-patron-8",
        total: 1599.0,
        currency: "INR",
        payment_status: "pending",
      },
    });
    const mockRzp = createMockRazorpay();

    const res = await handleCreatePaymentOrder(req, {
      getCustomerSession: async () => createMockSession("user-patron-8"),
      createServerSupabaseClient: () => mockDb.client,
      getRazorpayServerClient: () => mockRzp.razorpay,
      publicKey: TEST_PUBLIC_KEY,
    });

    const data = await res.json();
    assert(
      res.status === 200 &&
        data.success === true &&
        mockDb.getQueriedField() === "order_number" &&
        mockDb.getQueriedValue() === "AAAS-8888" &&
        mockDb.getUpdatedPayload()?.razorpay_order_id === "order_rzp_mock_1" &&
        mockDb.getUpdatedId() === "a0b1c2d3-4567-4890-abcd-ef0123456789",
      "Test 8: Lookup by canonical AAAS- order number routes query to order_number column without UUID syntax errors"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 9: Lookup by valid UUID succeeds
  // ---------------------------------------------------------------------------
  {
    _resetInFlightCreations();
    const targetUuid = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    const req = makeRequest({ orderId: targetUuid });
    const mockDb = createMockSupabase({
      order: {
        id: targetUuid,
        order_number: "AAAS-9999",
        user_id: "user-patron-9",
        total: 2999.0,
        currency: "INR",
        payment_status: "pending",
      },
    });
    const mockRzp = createMockRazorpay();

    const res = await handleCreatePaymentOrder(req, {
      getCustomerSession: async () => createMockSession("user-patron-9"),
      createServerSupabaseClient: () => mockDb.client,
      getRazorpayServerClient: () => mockRzp.razorpay,
      publicKey: TEST_PUBLIC_KEY,
    });

    const data = await res.json();
    assert(
      res.status === 200 &&
        data.success === true &&
        mockDb.getQueriedField() === "id" &&
        mockDb.getQueriedValue() === targetUuid &&
        mockDb.getUpdatedPayload()?.razorpay_order_id === "order_rzp_mock_1" &&
        mockDb.getUpdatedId() === targetUuid,
      "Test 9: Lookup by valid UUID safely routes query to id column and persists gateway order ID"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 10: Database persistence failure of razorpay_order_id handled safely (no false success)
  // ---------------------------------------------------------------------------
  {
    _resetInFlightCreations();
    const req = makeRequest({ orderId: "AAAS-PERSIST-FAIL" });
    const mockDb = createMockSupabase({
      order: {
        id: "order-uuid-db-fail",
        order_number: "AAAS-PERSIST-FAIL",
        user_id: "user-patron-10",
        total: 3100.0,
        currency: "INR",
        payment_status: "pending",
      },
      updateError: {
        message: "Database connection closed unexpectedly",
        code: "08006",
      },
    });
    const mockRzp = createMockRazorpay();

    const res = await handleCreatePaymentOrder(req, {
      getCustomerSession: async () => createMockSession("user-patron-10"),
      createServerSupabaseClient: () => mockDb.client,
      getRazorpayServerClient: () => mockRzp.razorpay,
      publicKey: TEST_PUBLIC_KEY,
    });

    const data = await res.json();
    assert(
      res.status === 500 &&
        data.success === false &&
        data.error.includes("Failed to persist gateway order identifier"),
      "Test 10: Database persistence failure of razorpay_order_id returns HTTP 500 failure (never false success)"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 11 (Audit G1): Razorpay gateway creation failure returns HTTP 502
  // ---------------------------------------------------------------------------
  {
    _resetInFlightCreations();
    const req = makeRequest({ orderId: "AAAS-GATEWAY-FAIL" });
    const mockDb = createMockSupabase({
      order: {
        id: "order-uuid-gw-fail",
        order_number: "AAAS-GATEWAY-FAIL",
        user_id: "user-patron-11",
        total: 2500.0,
        currency: "INR",
        payment_status: "pending",
      },
    });
    const mockRzp = createMockRazorpay({
      throwError: new Error("Razorpay 500: Internal server error on payment gateway"),
    });

    const res = await handleCreatePaymentOrder(req, {
      getCustomerSession: async () => createMockSession("user-patron-11"),
      createServerSupabaseClient: () => mockDb.client,
      getRazorpayServerClient: () => mockRzp.razorpay,
      publicKey: TEST_PUBLIC_KEY,
    });

    const data = await res.json();
    assert(
      res.status === 502 &&
        data.success === false &&
        data.error.includes("Razorpay 500") &&
        mockDb.getUpdatedPayload() === null,
      "Test 11 (Audit G1): Razorpay gateway creation failure returns HTTP 502 and halts persistence"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 12 (Audit G2): Non-pending order statuses ('failed', 'expired') rejected with HTTP 400
  // ---------------------------------------------------------------------------
  {
    _resetInFlightCreations();
    const reqFailed = makeRequest({ orderId: "AAAS-FAILED" });
    const mockDbFailed = createMockSupabase({
      order: {
        id: "order-uuid-failed",
        order_number: "AAAS-FAILED",
        user_id: "user-patron-12",
        total: 1800.0,
        currency: "INR",
        payment_status: "failed",
      },
    });
    const mockRzpFailed = createMockRazorpay();

    const resFailed = await handleCreatePaymentOrder(reqFailed, {
      getCustomerSession: async () => createMockSession("user-patron-12"),
      createServerSupabaseClient: () => mockDbFailed.client,
      getRazorpayServerClient: () => mockRzpFailed.razorpay,
      publicKey: TEST_PUBLIC_KEY,
    });
    const dataFailed = await resFailed.json();

    _resetInFlightCreations();
    const reqExpired = makeRequest({ orderId: "AAAS-EXPIRED" });
    const mockDbExpired = createMockSupabase({
      order: {
        id: "order-uuid-expired",
        order_number: "AAAS-EXPIRED",
        user_id: "user-patron-12",
        total: 1800.0,
        currency: "INR",
        payment_status: "expired",
      },
    });
    const mockRzpExpired = createMockRazorpay();

    const resExpired = await handleCreatePaymentOrder(reqExpired, {
      getCustomerSession: async () => createMockSession("user-patron-12"),
      createServerSupabaseClient: () => mockDbExpired.client,
      getRazorpayServerClient: () => mockRzpExpired.razorpay,
      publicKey: TEST_PUBLIC_KEY,
    });
    const dataExpired = await resExpired.json();

    assert(
      resFailed.status === 400 &&
        dataFailed.success === false &&
        dataFailed.error.includes("failed") &&
        mockRzpFailed.getCreateCallCount() === 0 &&
        resExpired.status === 400 &&
        dataExpired.success === false &&
        dataExpired.error.includes("expired") &&
        mockRzpExpired.getCreateCallCount() === 0,
      "Test 12 (Audit G2): Non-pending order statuses ('failed', 'expired') rejected with HTTP 400 without invoking gateway"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 13 (Audit G3): Malformed / non-JSON request body returns HTTP 400
  // ---------------------------------------------------------------------------
  {
    _resetInFlightCreations();
    const malformedReq = makeRequest("<<<NOT A VALID JSON STRING>>>", true);
    const mockDb = createMockSupabase();
    const mockRzp = createMockRazorpay();

    const res = await handleCreatePaymentOrder(malformedReq, {
      getCustomerSession: async () => createMockSession("user-patron-13"),
      createServerSupabaseClient: () => mockDb.client,
      getRazorpayServerClient: () => mockRzp.razorpay,
      publicKey: TEST_PUBLIC_KEY,
    });

    const data = await res.json();
    assert(
      res.status === 400 &&
        data.success === false &&
        data.error === "Invalid JSON request payload." &&
        mockRzp.getCreateCallCount() === 0,
      "Test 13 (Audit G3): Malformed / non-JSON request body strictly rejected with HTTP 400"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 14 (Audit G4): Missing or whitespace-only orderId returns HTTP 400
  // ---------------------------------------------------------------------------
  {
    _resetInFlightCreations();
    const reqWhitespace = makeRequest({ orderId: "    " });
    const resWhitespace = await handleCreatePaymentOrder(reqWhitespace, {
      getCustomerSession: async () => createMockSession("user-patron-14"),
      publicKey: TEST_PUBLIC_KEY,
    });
    const dataWhitespace = await resWhitespace.json();

    const reqMissing = makeRequest({});
    const resMissing = await handleCreatePaymentOrder(reqMissing, {
      getCustomerSession: async () => createMockSession("user-patron-14"),
      publicKey: TEST_PUBLIC_KEY,
    });
    const dataMissing = await resMissing.json();

    assert(
      resWhitespace.status === 400 &&
        dataWhitespace.success === false &&
        dataWhitespace.error === "Invalid orderId. Must be a non-empty string." &&
        resMissing.status === 400 &&
        dataMissing.success === false &&
        dataMissing.error === "Invalid orderId. Must be a non-empty string.",
      "Test 14 (Audit G4): Missing and whitespace-only orderId rejected with HTTP 400"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 15 (Audit G5): Missing required Razorpay configuration returns HTTP 500
  // ---------------------------------------------------------------------------
  {
    _resetInFlightCreations();
    const reqA = makeRequest({ orderId: "AAAS-1501" });
    const mockDbA = createMockSupabase({
      order: {
        id: "order-uuid-1501",
        order_number: "AAAS-1501",
        user_id: "user-patron-15",
        total: 1000.0,
        currency: "INR",
        payment_status: "pending",
      },
    });

    const resA = await handleCreatePaymentOrder(reqA, {
      getCustomerSession: async () => createMockSession("user-patron-15"),
      createServerSupabaseClient: () => mockDbA.client,
      publicKey: "", // Missing public key
    });
    const dataA = await resA.json();

    _resetInFlightCreations();
    const reqB = makeRequest({ orderId: "AAAS-1502" });
    const mockDbB = createMockSupabase({
      order: {
        id: "order-uuid-1502",
        order_number: "AAAS-1502",
        user_id: "user-patron-15",
        total: 1000.0,
        currency: "INR",
        payment_status: "pending",
      },
    });

    const resB = await handleCreatePaymentOrder(reqB, {
      getCustomerSession: async () => createMockSession("user-patron-15"),
      createServerSupabaseClient: () => mockDbB.client,
      getRazorpayServerClient: () => {
        throw new Error("Missing server-side Razorpay API credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).");
      },
      publicKey: TEST_PUBLIC_KEY,
    });
    const dataB = await resB.json();

    assert(
      resA.status === 500 &&
        dataA.success === false &&
        dataA.error === "Missing NEXT_PUBLIC_RAZORPAY_KEY_ID." &&
        resB.status === 500 &&
        dataB.success === false &&
        dataB.error.includes("Missing server-side Razorpay API credentials"),
      "Test 15 (Audit G5): Missing public key or server credentials safely returns HTTP 500 without claiming success"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 16 (Concurrency Guarantee): Simultaneous create-order requests cannot create competing orders
  // ---------------------------------------------------------------------------
  {
    _resetInFlightCreations();
    const sharedOrder = {
      id: "order-uuid-concurrent-16",
      order_number: "AAAS-CONCURRENT-16",
      user_id: "user-patron-16",
      total: 2500.0,
      currency: "INR",
      payment_status: "pending",
      razorpay_order_id: null,
    };

    const mockDb = createMockSupabase({ sharedOrder });
    const mockRzp = createMockRazorpay({
      createDelayMs: 20,
    });

    const req1 = makeRequest({ orderId: "AAAS-CONCURRENT-16" });
    const req2 = makeRequest({ orderId: "AAAS-CONCURRENT-16" });

    const [res1, res2] = await Promise.all([
      handleCreatePaymentOrder(req1, {
        getCustomerSession: async () => createMockSession("user-patron-16"),
        createServerSupabaseClient: () => mockDb.client,
        getRazorpayServerClient: () => mockRzp.razorpay,
        publicKey: TEST_PUBLIC_KEY,
      }),
      handleCreatePaymentOrder(req2, {
        getCustomerSession: async () => createMockSession("user-patron-16"),
        createServerSupabaseClient: () => mockDb.client,
        getRazorpayServerClient: () => mockRzp.razorpay,
        publicKey: TEST_PUBLIC_KEY,
      }),
    ]);

    const data1 = await res1.json();
    const data2 = await res2.json();

    assert(
      res1.status === 200 &&
        res2.status === 200 &&
        data1.success === true &&
        data2.success === true &&
        data1.razorpayOrderId === data2.razorpayOrderId &&
        sharedOrder.razorpay_order_id === data1.razorpayOrderId &&
        mockRzp.getCreateCallCount() === 1,
      "Test 16 (Concurrency): Simultaneous requests create exactly ONE gateway order and both return the authoritative persisted ID"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 17 (Order Reuse): Existing valid, usable gateway order is verified and reused
  // ---------------------------------------------------------------------------
  {
    _resetInFlightCreations();
    const existingGatewayId = "order_rzp_reusable_1701";
    const mockDb = createMockSupabase({
      order: {
        id: "order-uuid-reuse-17",
        order_number: "AAAS-REUSE-17",
        user_id: "user-patron-17",
        total: 1999.0,
        currency: "INR",
        payment_status: "pending",
        razorpay_order_id: existingGatewayId,
      },
    });

    const mockRzp = createMockRazorpay({
      order: {
        id: existingGatewayId,
        amount: 199900,
        currency: "INR",
        status: "created",
        receipt: "AAAS-REUSE-17",
      },
    });

    const req = makeRequest({ orderId: "AAAS-REUSE-17" });
    const res = await handleCreatePaymentOrder(req, {
      getCustomerSession: async () => createMockSession("user-patron-17"),
      createServerSupabaseClient: () => mockDb.client,
      getRazorpayServerClient: () => mockRzp.razorpay,
      publicKey: TEST_PUBLIC_KEY,
    });

    const data = await res.json();
    assert(
      res.status === 200 &&
        data.success === true &&
        data.razorpayOrderId === existingGatewayId &&
        mockRzp.getCreateCallCount() === 0 &&
        mockRzp.getFetchCallCount() === 1,
      "Test 17 (Reuse): Valid, usable existing gateway order is verified and reused without creating a competing order"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 18 (Order Reuse Rejection): Existing order already paid on Razorpay rejected (HTTP 400)
  // ---------------------------------------------------------------------------
  {
    _resetInFlightCreations();
    const paidGatewayId = "order_rzp_already_paid_1801";
    const mockDb = createMockSupabase({
      order: {
        id: "order-uuid-already-paid-18",
        order_number: "AAAS-PAID-18",
        user_id: "user-patron-18",
        total: 3000.0,
        currency: "INR",
        payment_status: "pending",
        razorpay_order_id: paidGatewayId,
      },
    });

    const mockRzp = createMockRazorpay({
      order: {
        id: paidGatewayId,
        amount: 300000,
        currency: "INR",
        status: "paid",
        receipt: "AAAS-PAID-18",
      },
    });

    const req = makeRequest({ orderId: "AAAS-PAID-18" });
    const res = await handleCreatePaymentOrder(req, {
      getCustomerSession: async () => createMockSession("user-patron-18"),
      createServerSupabaseClient: () => mockDb.client,
      getRazorpayServerClient: () => mockRzp.razorpay,
      publicKey: TEST_PUBLIC_KEY,
    });

    const data = await res.json();
    assert(
      res.status === 400 &&
        data.success === false &&
        data.error === "Order is already paid." &&
        mockRzp.getCreateCallCount() === 0,
      "Test 18 (Reuse Guard): Existing gateway order marked 'paid' on Razorpay rejected with HTTP 400"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 19 (Order Reuse Invalidation): Existing order with mismatched amount triggers fresh order
  // ---------------------------------------------------------------------------
  {
    _resetInFlightCreations();
    const staleGatewayId = "order_rzp_stale_amount_1901";
    const mockDb = createMockSupabase({
      order: {
        id: "order-uuid-mismatch-19",
        order_number: "AAAS-MISMATCH-19",
        user_id: "user-patron-19",
        total: 5000.0,
        currency: "INR",
        payment_status: "pending",
        razorpay_order_id: staleGatewayId,
      },
    });

    const mockRzp = createMockRazorpay({
      fetchHandler: () => ({
        id: staleGatewayId,
        amount: 250000, // Mismatched amount
        currency: "INR",
        status: "created",
        receipt: "AAAS-MISMATCH-19",
      }),
      order: {
        id: "order_rzp_fresh_1902",
        amount: 500000,
        currency: "INR",
        status: "created",
        receipt: "AAAS-MISMATCH-19",
      },
    });

    const req = makeRequest({ orderId: "AAAS-MISMATCH-19" });
    const res = await handleCreatePaymentOrder(req, {
      getCustomerSession: async () => createMockSession("user-patron-19"),
      createServerSupabaseClient: () => mockDb.client,
      getRazorpayServerClient: () => mockRzp.razorpay,
      publicKey: TEST_PUBLIC_KEY,
    });

    const data = await res.json();
    assert(
      res.status === 200 &&
        data.success === true &&
        data.razorpayOrderId === "order_rzp_fresh_1902" &&
        mockRzp.getCreateCallCount() === 1 &&
        mockDb.getUpdatedPayload()?.razorpay_order_id === "order_rzp_fresh_1902",
      "Test 19 (Stale Invalidation): Mismatched existing gateway order is rejected and fresh gateway order created"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 20 (Bounded DB Retry): Transient persistence failure recovers safely
  // ---------------------------------------------------------------------------
  {
    _resetInFlightCreations();
    const req = makeRequest({ orderId: "AAAS-TRANSIENT-FAIL" });
    const mockDb = createMockSupabase({
      order: {
        id: "order-uuid-transient-20",
        order_number: "AAAS-TRANSIENT-FAIL",
        user_id: "user-patron-20",
        total: 4200.0,
        currency: "INR",
        payment_status: "pending",
      },
      updateError: {
        message: "Connection reset by peer",
        code: "08006",
      },
      updateFailAttempts: 1,
    });
    const mockRzp = createMockRazorpay();

    const res = await handleCreatePaymentOrder(req, {
      getCustomerSession: async () => createMockSession("user-patron-20"),
      createServerSupabaseClient: () => mockDb.client,
      getRazorpayServerClient: () => mockRzp.razorpay,
      publicKey: TEST_PUBLIC_KEY,
    });

    const data = await res.json();
    assert(
      res.status === 200 &&
        data.success === true &&
        data.razorpayOrderId === "order_rzp_mock_1" &&
        mockDb.getUpdateAttempts() === 2 &&
        mockDb.getUpdatedPayload()?.razorpay_order_id === "order_rzp_mock_1",
      "Test 20 (Bounded Retry): Transient DB persistence failure recovers on bounded retry without client error"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 21 (Phase 1.5): Lock RPC missing or failing returns HTTP 503 and never invokes gateway
  // ---------------------------------------------------------------------------
  {
    _resetInFlightCreations();
    const req = makeRequest({ orderId: "AAAS-LOCK-FAIL-21" });
    const mockDb = createMockSupabase({
      order: {
        id: "order-uuid-lock-fail-21",
        order_number: "AAAS-LOCK-FAIL-21",
        user_id: "user-patron-21",
        total: 1500.0,
        currency: "INR",
        payment_status: "pending",
      },
      rpcError: {
        message: "function claim_payment_creation_lock does not exist",
        code: "42883",
      },
    });
    const mockRzp = createMockRazorpay();

    const res = await handleCreatePaymentOrder(req, {
      getCustomerSession: async () => createMockSession("user-patron-21"),
      createServerSupabaseClient: () => mockDb.client,
      getRazorpayServerClient: () => mockRzp.razorpay,
      publicKey: TEST_PUBLIC_KEY,
    });

    const data = await res.json();
    assert(
      res.status === 503 &&
        data.success === false &&
        data.error.includes("locking service") &&
        mockRzp.getCreateCallCount() === 0,
      "Test 21 (Lock Failure Guard): Missing or failing lock RPC returns HTTP 503 and NEVER invokes gateway"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 22 (Phase 1.5): Lock held and polling timeout returns HTTP 409 without creating order
  // ---------------------------------------------------------------------------
  {
    _resetInFlightCreations();
    const req = makeRequest({ orderId: "AAAS-LOCK-HELD-22" });
    const mockDb = createMockSupabase({
      order: {
        id: "order-uuid-lock-held-22",
        order_number: "AAAS-LOCK-HELD-22",
        user_id: "user-patron-22",
        total: 2100.0,
        currency: "INR",
        payment_status: "pending",
        razorpay_order_id: null,
      },
      lockHeld: true, // Simulates another active instance holding the lock
    });
    const mockRzp = createMockRazorpay();

    // Fast-forward sleep in test to prevent waiting 3000ms
    const res = await handleCreatePaymentOrder(req, {
      getCustomerSession: async () => createMockSession("user-patron-22"),
      createServerSupabaseClient: () => mockDb.client,
      getRazorpayServerClient: () => mockRzp.razorpay,
      publicKey: TEST_PUBLIC_KEY,
      sleep: async () => {}, // Instant sleep in test
    });

    const data = await res.json();
    assert(
      res.status === 409 &&
        data.success === false &&
        data.error.includes("already in progress") &&
        mockRzp.getCreateCallCount() === 0,
      "Test 22 (Polling Timeout): Lock held by another instance times out and returns HTTP 409 without calling gateway"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 23 (Phase 1.5): CAS update affects 0 rows and successfully adopts winner gateway ID
  // ---------------------------------------------------------------------------
  {
    _resetInFlightCreations();
    const sharedOrder = {
      id: "order-uuid-cas-winner-23",
      order_number: "AAAS-CAS-WIN-23",
      user_id: "user-patron-23",
      total: 3500.0,
      currency: "INR",
      payment_status: "pending",
      razorpay_order_id: "order_rzp_persisted_winner_23", // Winner's persisted ID
    };

    const mockDb = createMockSupabase({
      sharedOrder,
      casZeroRows: true, // Simulates CAS conditional update matching 0 rows
    });
    const mockRzp = createMockRazorpay();

    const req = makeRequest({ orderId: "AAAS-CAS-WIN-23" });
    const res = await handleCreatePaymentOrder(req, {
      getCustomerSession: async () => createMockSession("user-patron-23"),
      createServerSupabaseClient: () => mockDb.client,
      getRazorpayServerClient: () => mockRzp.razorpay,
      publicKey: TEST_PUBLIC_KEY,
    });

    const data = await res.json();
    assert(
      res.status === 200 &&
        data.success === true &&
        data.razorpayOrderId === "order_rzp_persisted_winner_23",
      "Test 23 (CAS Zero-Row Resolution): When CAS update matches 0 rows, adopts authoritative winner ID from DB"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 24 (Phase 1.5): CAS update affects 0 rows with mismatched amount returns HTTP 409
  // ---------------------------------------------------------------------------
  {
    _resetInFlightCreations();
    const sharedOrder = {
      id: "order-uuid-cas-mismatch-24",
      order_number: "AAAS-CAS-MISMATCH-24",
      user_id: "user-patron-24",
      total: 9999.0, // Modified order total!
      currency: "INR",
      payment_status: "pending",
      razorpay_order_id: "order_rzp_tampered_24",
    };

    const mockDb = createMockSupabase({
      order: {
        id: "order-uuid-cas-mismatch-24",
        order_number: "AAAS-CAS-MISMATCH-24",
        user_id: "user-patron-24",
        total: 1000.0, // Initial query sees 1000.0
        currency: "INR",
        payment_status: "pending",
        razorpay_order_id: null,
      },
      casZeroRows: true,
    });

    // When re-fetching after CAS conflict, DB total is 9999.0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalFrom = mockDb.client.from as (t: string) => any;
    let queryCount = 0;
    mockDb.client.from = (t: string) => {
      const res = originalFrom(t);
      const originalSelect = res.select;
      res.select = (cols: string) => {
        queryCount++;
        if (queryCount > 1) {
          return {
            eq: () => ({
              maybeSingle: async () => ({
                data: sharedOrder,
                error: null,
              }),
            }),
          };
        }
        return originalSelect(cols);
      };
      return res;
    };

    const mockRzp = createMockRazorpay();

    const req = makeRequest({ orderId: "AAAS-CAS-MISMATCH-24" });
    const res = await handleCreatePaymentOrder(req, {
      getCustomerSession: async () => createMockSession("user-patron-24"),
      createServerSupabaseClient: () => mockDb.client,
      getRazorpayServerClient: () => mockRzp.razorpay,
      publicKey: TEST_PUBLIC_KEY,
    });

    const data = await res.json();
    assert(
      res.status === 409 &&
        data.success === false &&
        data.error.includes("amount changed"),
      "Test 24 (CAS Invalidation): Zero-row CAS conflict with altered order total strictly rejected with HTTP 409"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 25 (Phase 1.5): Token-scoped lock cleanup invokes release with matching token
  // ---------------------------------------------------------------------------
  {
    _resetInFlightCreations();
    const req = makeRequest({ orderId: "AAAS-CLEANUP-25" });
    const mockDb = createMockSupabase({
      order: {
        id: "a0b1c2d3-1111-4890-abcd-ef0123456789",
        order_number: "AAAS-CLEANUP-25",
        user_id: "user-patron-25",
        total: 1000.0,
        currency: "INR",
        payment_status: "pending",
      },
    });
    const mockRzp = createMockRazorpay();

    await handleCreatePaymentOrder(req, {
      getCustomerSession: async () => createMockSession("user-patron-25"),
      createServerSupabaseClient: () => mockDb.client,
      getRazorpayServerClient: () => mockRzp.razorpay,
      publicKey: TEST_PUBLIC_KEY,
    });

    const lastRpc = mockDb.getLastRpcCalled();
    const lastParams = mockDb.getLastRpcParams();

    assert(
      lastRpc === "release_payment_creation_lock" &&
        lastParams?.p_order_id === "a0b1c2d3-1111-4890-abcd-ef0123456789" &&
        typeof lastParams?.p_lock_token === "string" &&
        (lastParams.p_lock_token as string).startsWith("lock_"),
      "Test 25 (Lock Cleanup): release_payment_creation_lock safely invoked with matching token in finally block"
    );
  }

  // ---------------------------------------------------------------------------
  // STATIC CONTRACT CHECKS
  // ---------------------------------------------------------------------------
  const routeSource = fs.readFileSync(
    path.resolve("app/api/payment/create-order/route.ts"),
    "utf8"
  );
  assert(
    routeSource.includes("handleCreatePaymentOrder"),
    "Contract Check 1: Route delegates to handleCreatePaymentOrder"
  );

  const libSource = fs.readFileSync(
    path.resolve("lib/payment/create-order.ts"),
    "utf8"
  );
  assert(
    libSource.includes("getCustomerSession"),
    "Contract Check 2: Payment logic imports and invokes getCustomerSession"
  );
  assert(
    libSource.includes("UUID_REGEX"),
    "Contract Check 3: Payment logic includes UUID regex for safe query routing"
  );
  assert(
    !libSource.includes("Math.round(amount * 100)"),
    "Contract Check 4: Payment logic never calculates paise from client-supplied amount"
  );
  assert(
    libSource.includes("Math.round(dbTotal * 100)"),
    "Contract Check 5: Payment logic converts authoritative dbTotal to paise using Math.round"
  );

  console.log("\n==================================================================");
  console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED (${passed + failed} assertions)`);
  console.log("==================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error("Test runner execution failed:", err);
  process.exit(1);
});
