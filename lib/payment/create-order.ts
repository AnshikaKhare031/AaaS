import { NextRequest, NextResponse } from "next/server";
import { getRazorpayServerClient } from "@/lib/payment/razorpay";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCustomerSession } from "@/lib/auth/customer-session-server";
import type { CustomerSessionPayload } from "@/lib/auth/customer-session";
import type { SupabaseClient } from "@supabase/supabase-js";
import type Razorpay from "razorpay";

// Regular expression matching standard 36-char hex UUID (v1-v5)
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CreateOrderDependencies {
  getCustomerSession?: () => Promise<CustomerSessionPayload | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createServerSupabaseClient?: () => SupabaseClient | any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getRazorpayServerClient?: () => Razorpay | any;
  publicKey?: string;
  sleep?: (ms: number) => Promise<void>;
}

interface PaymentOrderResult {
  status: number;
  data: Record<string, unknown>;
}

// In-flight active order creation promises to prevent competing creations within the same process
const inFlightCreations = new Map<string, Promise<PaymentOrderResult>>();

/**
 * Resets the in-flight creations map. Exposed for test isolation.
 */
export function _resetInFlightCreations(): void {
  inFlightCreations.clear();
}

/**
 * Handles payment order creation on Razorpay for a verified customer order.
 * Accepts optional dependencies for deterministic unit testing without live network or database calls.
 */
export async function handleCreatePaymentOrder(
  req: Request | NextRequest,
  deps: CreateOrderDependencies = {}
) {
  try {
    const getSession = deps.getCustomerSession || getCustomerSession;
    const getSupabase = deps.createServerSupabaseClient || createServerSupabaseClient;
    const getRazorpay = deps.getRazorpayServerClient || getRazorpayServerClient;
    const publicKey = deps.publicKey ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    // 1. Authenticate customer session
    const customerSession = await getSession();
    if (!customerSession || !customerSession.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    // 2. Validate request payload
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request payload." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request payload." },
        { status: 400 }
      );
    }

    const { orderId } = body as { orderId?: unknown; amount?: unknown };
    if (!orderId || typeof orderId !== "string" || orderId.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Invalid orderId. Must be a non-empty string." },
        { status: 400 }
      );
    }

    const trimmedOrderId = orderId.trim();

    // 3. Query order from database using safe identifier routing (UUID vs canonical order_number)
    const supabase = getSupabase();
    const isUuid = UUID_REGEX.test(trimmedOrderId);

    let query = supabase
      .from("orders")
      .select("id, order_number, user_id, total, currency, payment_status, razorpay_order_id");

    if (isUuid) {
      query = query.eq("id", trimmedOrderId);
    } else {
      query = query.eq("order_number", trimmedOrderId);
    }

    const { data: order, error: orderError } = await query.maybeSingle();

    if (orderError) {
      console.error("[Payment Create-Order] Database error fetching order:", orderError);
      return NextResponse.json(
        { success: false, error: "Failed to retrieve order." },
        { status: 500 }
      );
    }

    // 4. Validate order existence and customer ownership
    // Return 404 if order does not exist OR belongs to another customer to avoid leaking existence
    if (!order || order.user_id !== customerSession.user.id) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    // 5. Validate payment status (must be pending; reject if already paid or non-payable)
    if (order.payment_status === "paid") {
      return NextResponse.json(
        { success: false, error: "Order is already paid." },
        { status: 400 }
      );
    }

    if (order.payment_status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: `Order is not in a payable state (current status: ${order.payment_status}).`,
        },
        { status: 400 }
      );
    }

    // 6. Validate authoritative order total from database and convert to integer paise
    const dbTotal = typeof order.total === "string" ? parseFloat(order.total) : Number(order.total);
    if (
      typeof dbTotal !== "number" ||
      isNaN(dbTotal) ||
      !Number.isFinite(dbTotal) ||
      dbTotal <= 0
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid order amount in database. Total must be positive." },
        { status: 400 }
      );
    }

    const amountInPaise = Math.round(dbTotal * 100);
    if (amountInPaise <= 0) {
      return NextResponse.json(
        { success: false, error: "Order total rounded to zero paise." },
        { status: 400 }
      );
    }

    // 7. Verify Razorpay credentials & configuration
    if (!publicKey || typeof publicKey !== "string" || publicKey.trim() === "") {
      console.error("[Payment Create-Order] Missing NEXT_PUBLIC_RAZORPAY_KEY_ID.");
      return NextResponse.json(
        { success: false, error: "Missing NEXT_PUBLIC_RAZORPAY_KEY_ID." },
        { status: 500 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let razorpay: any;
    try {
      razorpay = getRazorpay();
    } catch (rzpErr: unknown) {
      console.error("[Payment Create-Order] Failed to initialize Razorpay client:", rzpErr);
      const message = rzpErr instanceof Error ? rzpErr.message : "Missing Razorpay configuration";
      return NextResponse.json(
        { success: false, error: message },
        { status: 500 }
      );
    }

    // 8. In-process concurrency control:
    // If another request is currently creating a payment order for this internal order ID,
    // await that promise and return the exact same authoritative result.
    const orderInternalId: string = order.id;

    if (inFlightCreations.has(orderInternalId)) {
      const inFlightPromise = inFlightCreations.get(orderInternalId)!;
      const inFlightResult = await inFlightPromise;
      return NextResponse.json(inFlightResult.data, { status: inFlightResult.status });
    }

    const executeCreation = async (): Promise<PaymentOrderResult> => {
      // A. Reusability Check:
      // If the order already has a razorpay_order_id, verify its relationship and usability
      // directly with the gateway before attempting new creation.
      if (order.razorpay_order_id) {
        if (typeof razorpay.orders?.fetch === "function") {
          try {
            const existingRzp = await razorpay.orders.fetch(order.razorpay_order_id);
            if (existingRzp) {
              // 1. Verify relationship to this internal order
              const receiptMatches = existingRzp.receipt === order.order_number;
              const notesMatch =
                existingRzp.notes?.internal_order_id === order.order_number ||
                existingRzp.notes?.order_number === order.order_number ||
                existingRzp.notes?.orderId === order.id;

              const isRelated = receiptMatches || notesMatch;

              // 2. Verify usability (must be payable and match amount & currency)
              const isPayableStatus =
                existingRzp.status === "created" || existingRzp.status === "attempted";
              const amountMatches = Number(existingRzp.amount) === amountInPaise;
              const currencyMatches =
                (existingRzp.currency || "INR").toUpperCase() ===
                (order.currency || "INR").toUpperCase();

              if (existingRzp.status === "paid") {
                return {
                  status: 400,
                  data: { success: false, error: "Order is already paid." },
                };
              }

              if (isRelated && isPayableStatus && amountMatches && currencyMatches) {
                console.log(
                  `[Payment Create-Order] Reusing verified existing gateway order ${existingRzp.id} for order ${order.order_number}`
                );
                return {
                  status: 200,
                  data: {
                    success: true,
                    razorpayOrderId: existingRzp.id,
                    amount: dbTotal,
                    amountInPaise: existingRzp.amount ?? amountInPaise,
                    currency: existingRzp.currency || "INR",
                    key: publicKey,
                  },
                };
              } else {
                console.warn(
                  `[Payment Create-Order] Existing Razorpay order ${order.razorpay_order_id} cannot be reused:`,
                  { isRelated, status: existingRzp.status, amountMatches, currencyMatches }
                );
              }
            }
          } catch (fetchErr) {
            console.warn(
              `[Payment Create-Order] Could not fetch existing Razorpay order ${order.razorpay_order_id}:`,
              fetchErr instanceof Error ? fetchErr.message : fetchErr
            );
          }
        }
      }

      // B. Distributed lock acquisition:
      // Must acquire distributed lock before creating an external gateway order.
      // If RPC is missing, errors, or fails, fail safely without invoking the gateway.
      let lockToken: string | null = null;
      let distributedLockAcquired = false;

      if (typeof supabase.rpc !== "function") {
        console.error("[Payment Create-Order] Database client does not support RPC locking.");
        return {
          status: 503,
          data: {
            success: false,
            error: "Payment locking service is unavailable. Please retry in a few moments.",
          },
        };
      }

      try {
        lockToken = `lock_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        const { data: lockResult, error: lockRpcError } = await supabase.rpc(
          "claim_payment_creation_lock",
          {
            p_order_id: order.id,
            p_lock_token: lockToken,
            p_lease_seconds: 30,
          }
        );

        if (lockRpcError || typeof lockResult !== "boolean") {
          console.error("[Payment Create-Order] Distributed lock claim failed with error:", lockRpcError);
          return {
            status: 503,
            data: {
              success: false,
              error: "Payment locking service is temporarily unavailable. Please retry in a few moments.",
            },
          };
        }

        distributedLockAcquired = lockResult;

        if (!distributedLockAcquired) {
          // Another instance holds the lock. Bounded poll for it to persist razorpay_order_id
          const pollDeadline = Date.now() + 3000;
          while (Date.now() < pollDeadline) {
            if (deps.sleep) {
              await deps.sleep(100);
            } else {
              await new Promise((resolve) => setTimeout(resolve, 100));
            }

            const { data: polledOrder } = await supabase
              .from("orders")
              .select("id, razorpay_order_id, total, currency, payment_status")
              .eq("id", order.id)
              .maybeSingle();

            if (polledOrder?.razorpay_order_id) {
              const polledAmount = typeof polledOrder.total === "string" ? parseFloat(polledOrder.total) : Number(polledOrder.total);
              const polledPaise = Math.round(polledAmount * 100);

              if (polledPaise === amountInPaise) {
                return {
                  status: 200,
                  data: {
                    success: true,
                    razorpayOrderId: polledOrder.razorpay_order_id,
                    amount: polledAmount,
                    amountInPaise: polledPaise,
                    currency: polledOrder.currency || "INR",
                    key: publicKey,
                  },
                };
              }
            }
          }

          // Polling timed out without finding persisted ID. Stop and return 409 without calling gateway.
          console.warn("[Payment Create-Order] Polling timed out waiting for concurrent payment creation:", order.id);
          return {
            status: 409,
            data: {
              success: false,
              error: "Payment creation already in progress. Please retry in a few moments.",
            },
          };
        }
      } catch (lockException) {
        console.error("[Payment Create-Order] Unexpected error during lock acquisition:", lockException);
        return {
          status: 503,
          data: {
            success: false,
            error: "Payment locking service is temporarily unavailable. Please retry in a few moments.",
          },
        };
      }

      try {
        // C. Create order with payment gateway (only when lock is held)
        const options = {
          amount: amountInPaise,
          currency: (order.currency && order.currency.toUpperCase()) || "INR",
          receipt: order.order_number,
          notes: {
            internal_order_id: order.order_number,
            order_number: order.order_number,
            orderId: order.id,
          },
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let razorpayOrder: any;
        try {
          razorpayOrder = await razorpay.orders.create(options);
        } catch (gatewayErr: unknown) {
          console.error("[Payment Create-Order] Razorpay order creation failed:", gatewayErr);
          const message = gatewayErr instanceof Error ? gatewayErr.message : "Payment gateway error";
          return {
            status: 502,
            data: { success: false, error: message },
          };
        }

        if (!razorpayOrder || !razorpayOrder.id) {
          return {
            status: 502,
            data: { success: false, error: "Failed to create gateway order." },
          };
        }

        // D. Persist razorpay_order_id with CAS verification and bounded retry
        let updateError: unknown = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let updatedRow: any = null;
        const maxRetries = 2;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          let updateQuery = supabase
            .from("orders")
            .update({
              razorpay_order_id: razorpayOrder.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id);

          // CAS: If order previously had no razorpay_order_id, only update if it is still null
          if (
            typeof updateQuery.is === "function" &&
            (order.razorpay_order_id === null || order.razorpay_order_id === undefined)
          ) {
            updateQuery = updateQuery.is("razorpay_order_id", null);
          }

          let queryRes: { data: unknown; error: unknown };
          if (typeof updateQuery.select === "function") {
            queryRes = await updateQuery.select("id, order_number, total, currency, payment_status, razorpay_order_id").maybeSingle();
          } else {
            queryRes = await updateQuery;
          }

          updateError = queryRes.error;
          updatedRow = queryRes.data;

          if (!updateError) {
            break;
          }

          if (attempt < maxRetries) {
            console.warn(
              `[Payment Create-Order] Transient database update error on attempt ${attempt}:`,
              updateError
            );
            if (deps.sleep) {
              await deps.sleep(50);
            }
          }
        }

        if (updateError) {
          console.error(
            `[Payment Create-Order] Failed to persist razorpay_order_id ${razorpayOrder.id} for order ${order.id}:`,
            updateError
          );
          return {
            status: 500,
            data: { success: false, error: "Failed to persist gateway order identifier to order record." },
          };
        }

        // CAS Conflict Detection: Update executed without error, but 0 rows were updated
        if (!updatedRow) {
          console.warn(
            `[Payment Create-Order] CAS conflict detected for order ${order.id}. Re-fetching authoritative record...`
          );

          const { data: latestOrder, error: fetchLatestError } = await supabase
            .from("orders")
            .select("id, order_number, user_id, total, currency, payment_status, razorpay_order_id")
            .eq("id", order.id)
            .maybeSingle();

          if (fetchLatestError || !latestOrder) {
            console.error("[Payment Create-Order] Failed to retrieve order after CAS conflict:", fetchLatestError);
            return {
              status: 500,
              data: { success: false, error: "Failed to resolve order state after concurrency conflict." },
            };
          }

          const winnerGatewayId = latestOrder.razorpay_order_id;
          if (!winnerGatewayId || typeof winnerGatewayId !== "string" || winnerGatewayId.trim() === "") {
            console.error("[Payment Create-Order] Order has no persisted razorpay_order_id after CAS conflict.");
            return {
              status: 409,
              data: { success: false, error: "Concurrent payment conflict. Please retry your request." },
            };
          }

          if (latestOrder.user_id !== customerSession.user.id) {
            return {
              status: 404,
              data: { success: false, error: "Order not found." },
            };
          }

          if (latestOrder.payment_status !== "pending") {
            return {
              status: 400,
              data: { success: false, error: `Order is not in a payable state (current status: ${latestOrder.payment_status}).` },
            };
          }

          const latestDbTotal = typeof latestOrder.total === "string" ? parseFloat(latestOrder.total) : Number(latestOrder.total);
          const latestAmountInPaise = Math.round(latestDbTotal * 100);

          if (latestAmountInPaise !== amountInPaise) {
            console.error(
              `[Payment Create-Order] Amount mismatch on persisted winner order: expected ${amountInPaise}, found ${latestAmountInPaise}`
            );
            return {
              status: 409,
              data: { success: false, error: "Order amount changed during payment initiation. Please retry." },
            };
          }

          const latestCurrency = (latestOrder.currency || "INR").toUpperCase();
          const expectedCurrency = (order.currency || "INR").toUpperCase();
          if (latestCurrency !== expectedCurrency) {
            console.error(
              `[Payment Create-Order] Currency mismatch on persisted winner order: expected ${expectedCurrency}, found ${latestCurrency}`
            );
            return {
              status: 409,
              data: { success: false, error: "Order currency mismatch during payment initiation. Please retry." },
            };
          }

          console.log(
            `[Payment Create-Order] Adopting verified winner gateway order ${winnerGatewayId} for order ${order.order_number}`
          );
          return {
            status: 200,
            data: {
              success: true,
              razorpayOrderId: winnerGatewayId,
              amount: latestDbTotal,
              amountInPaise: latestAmountInPaise,
              currency: latestCurrency,
              key: publicKey,
            },
          };
        }

        // E. Return authoritative success result for the persisted gateway order
        return {
          status: 200,
          data: {
            success: true,
            razorpayOrderId: razorpayOrder.id,
            amount: dbTotal,
            amountInPaise: razorpayOrder.amount ?? amountInPaise,
            currency: razorpayOrder.currency || "INR",
            key: publicKey,
          },
        };
      } finally {
        if (distributedLockAcquired && lockToken && typeof supabase.rpc === "function") {
          try {
            await supabase.rpc("release_payment_creation_lock", {
              p_order_id: order.id,
              p_lock_token: lockToken,
            });
          } catch {
            // Non-fatal; lease automatically expires
          }
        }
      }
    };

    const creationPromise = executeCreation();
    inFlightCreations.set(orderInternalId, creationPromise);

    try {
      const result = await creationPromise;
      return NextResponse.json(result.data, { status: result.status });
    } finally {
      inFlightCreations.delete(orderInternalId);
    }
  } catch (err: unknown) {
    console.error("[Payment Create-Order] Server error:", err);
    const errorMessage = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
