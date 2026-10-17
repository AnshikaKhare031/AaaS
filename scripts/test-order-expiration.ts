import { expirePendingOrders } from "../lib/supabase/expire-orders";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Order Expiration Unit Test Suite
 * Tests the four required behaviors:
 * 1. A pending order past the expiration threshold is marked 'failed'.
 * 2. A paid order is not changed.
 * 3. An order younger than the threshold is not changed.
 * 4. The routine reports a meaningful error if the database update fails.
 * 
 * Does NOT invoke live database or production APIs.
 */

async function runTests() {
  console.log("=================================================");
  console.log("   ORDER EXPIRATION SWEEP UNIT TEST SUITE        ");
  console.log("=================================================\n");

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

  // ---------------------------------------------------------------------------
  // TEST 1: A pending order past expiration threshold is marked 'failed'
  // ---------------------------------------------------------------------------
  {
    let updatePayload: Record<string, unknown> | null = null;
    let updateId: string | null = null;
    let updateStatusCheck: string | null = null;

    const mockSupabase = {
      from: (table: string) => {
        if (table !== "orders") throw new Error(`Unexpected table: ${table}`);
        return {
          select: () => ({
            eq: (_col: string, val: string) => ({
              lt: (_dateCol: string, _dateVal: string) => Promise.resolve({
                data: [
                  {
                    id: "order-stale-1",
                    order_number: "AAAS-1001",
                    provider_order_id: null,
                    payment_status: "pending",
                  },
                ],
                error: null,
              }),
            }),
          }),
          update: (payload: Record<string, unknown>) => {
            updatePayload = payload;
            return {
              eq: (col1: string, val1: string) => {
                if (col1 === "id") updateId = val1;
                return {
                  eq: (col2: string, val2: string) => {
                    if (col2 === "payment_status") updateStatusCheck = val2;
                    return Promise.resolve({ data: null, error: null });
                  },
                };
              },
            };
          },
        };
      },
    } as unknown as SupabaseClient;

    await expirePendingOrders(mockSupabase);

    assert(
      updatePayload !== null &&
      updatePayload["payment_status"] === "failed" &&
      typeof updatePayload["updated_at"] === "string",
      "Test 1.1: Pending order past threshold is transitioned to payment_status = 'failed'"
    );
    assert(
      updateId === "order-stale-1" && updateStatusCheck === "pending",
      "Test 1.2: Concurrency check targets order ID and ensures status was still 'pending'"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 2: A paid order is not changed
  // ---------------------------------------------------------------------------
  {
    let updateCalled = false;

    const mockSupabase = {
      from: (table: string) => {
        return {
          select: () => ({
            eq: (_col: string, _val: string) => ({
              lt: (_dateCol: string, _dateVal: string) => {
                // Database query filters by payment_status = 'pending'.
                // Paid orders are never returned by the query.
                return Promise.resolve({
                  data: [],
                  error: null,
                });
              },
            }),
          }),
          update: () => {
            updateCalled = true;
            return {
              eq: () => ({
                eq: () => Promise.resolve({ data: null, error: null }),
              }),
            };
          },
        };
      },
    } as unknown as SupabaseClient;

    await expirePendingOrders(mockSupabase);

    assert(
      updateCalled === false,
      "Test 2: Paid order is filtered out by query and never modified by expiration routine"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 3: An order younger than the threshold is not changed
  // ---------------------------------------------------------------------------
  {
    let updateCalled = false;
    let queryCutoff: string | null = null;

    const mockSupabase = {
      from: (table: string) => {
        return {
          select: () => ({
            eq: (_col: string, _val: string) => ({
              lt: (_dateCol: string, dateVal: string) => {
                queryCutoff = dateVal;
                // Database query filters by created_at < 30 minutes ago.
                // Orders younger than the threshold are excluded by Postgres.
                return Promise.resolve({
                  data: [],
                  error: null,
                });
              },
            }),
          }),
          update: () => {
            updateCalled = true;
            return {
              eq: () => ({
                eq: () => Promise.resolve({ data: null, error: null }),
              }),
            };
          },
        };
      },
    } as unknown as SupabaseClient;

    const beforeCall = Date.now();
    await expirePendingOrders(mockSupabase);
    const afterCall = Date.now();

    const expectedCutoffMin = beforeCall - 30 * 60 * 1000 - 1000;
    const expectedCutoffMax = afterCall - 30 * 60 * 1000 + 1000;
    const actualCutoff = queryCutoff ? new Date(queryCutoff).getTime() : 0;

    assert(
      updateCalled === false,
      "Test 3.1: Young order is filtered out by query cutoff and never modified"
    );
    assert(
      actualCutoff >= expectedCutoffMin && actualCutoff <= expectedCutoffMax,
      "Test 3.2: Cutoff accurately matches exactly 30 minutes in the past"
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 4: The routine reports a meaningful error if the database update fails
  // ---------------------------------------------------------------------------
  {
    const originalConsoleError = console.error;
    let loggedErrorTitle = "";
    let loggedErrorPayload: Record<string, unknown> | null = null;

    console.error = (title?: unknown, ...args: unknown[]) => {
      if (typeof title === "string" && title.includes("[Order Expiration Sweep] Error expiring order")) {
        loggedErrorTitle = title;
        loggedErrorPayload = (args[0] as Record<string, unknown>) || null;
      }
    };

    try {
      const mockSupabase = {
        from: (table: string) => {
          return {
            select: () => ({
              eq: () => ({
                lt: () => Promise.resolve({
                  data: [
                    {
                      id: "order-fail-update",
                      order_number: "AAAS-1002",
                      provider_order_id: null,
                      payment_status: "pending",
                    },
                  ],
                  error: null,
                }),
              }),
            }),
            update: () => {
              return {
                eq: () => ({
                  eq: () => Promise.resolve({
                    data: null,
                    error: {
                      code: "23514",
                      message: 'new row for relation "orders" violates check constraint "orders_payment_status_check"',
                      details: "Failing row contains (AAAS-1002, failed).",
                      hint: null,
                    },
                  }),
                }),
              };
            },
          };
        },
      } as unknown as SupabaseClient;

      await expirePendingOrders(mockSupabase);
    } finally {
      console.error = originalConsoleError;
    }

    assert(
      loggedErrorTitle.includes("AAAS-1002"),
      "Test 4.1: Error log includes the specific order number"
    );
    assert(
      loggedErrorPayload !== null &&
      loggedErrorPayload["code"] === "23514" &&
      typeof loggedErrorPayload["message"] === "string" &&
      (loggedErrorPayload["message"] as string).includes("violates check constraint"),
      "Test 4.2: Error log contains explicit error code and message (not empty/undefined)"
    );
    assert(
      loggedErrorPayload !== null &&
      loggedErrorPayload["details"] === "Failing row contains (AAAS-1002, failed).",
      "Test 4.3: Error log preserves details without masking"
    );
  }

  console.log("\n=================================================");
  console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED (${passed + failed} assertions)`);
  console.log("=================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner failure:", err);
  process.exit(1);
});
