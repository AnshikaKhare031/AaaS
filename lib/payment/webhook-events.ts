import { createServerSupabaseClient } from "../supabase/server";
import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface WebhookEventRecord {
  id?: string;
  event_id: string;
  event_type: string;
  provider: string;
  payload: Record<string, unknown> | null;
  order_id?: string | null;
  status: string;
  error_message?: string | null;
  processed_at?: string;
}

export interface RecordWebhookEventParams {
  eventId?: string | null;
  eventType: string;
  provider?: string;
  payload: Record<string, unknown> | null;
  orderId?: string | null;
  status: "processed" | "failed" | string;
  errorMessage?: string | null;
  processedAt?: string;
  supabaseClient?: SupabaseClient;
}

/**
 * Retrieves an existing webhook event record by event_id using the Supabase service-role client.
 * Returns null if eventId is empty, if the record does not exist, or on query error.
 */
export async function getExistingWebhookEvent(
  eventId?: string | null,
  client?: SupabaseClient
): Promise<WebhookEventRecord | null> {
  if (!eventId || typeof eventId !== "string" || eventId.trim() === "") {
    return null;
  }

  try {
    const supabase = client || createServerSupabaseClient();
    const { data, error } = await supabase
      .from("webhook_events")
      .select("id, event_id, event_type, provider, payload, order_id, status, error_message, processed_at")
      .eq("event_id", eventId.trim())
      .maybeSingle();

    if (error) {
      console.error("[Webhook Events Insert Error]", error);
      return null;
    }

    return (data as WebhookEventRecord) || null;
  } catch (err) {
    console.error("[Webhook Events Insert Error]", err);
    return null;
  }
}

/**
 * Inserts or updates a validated webhook event in public.webhook_events
 * using the Supabase service-role client.
 *
 * Exact schema columns:
 * - event_id (varchar)
 * - event_type (varchar)
 * - provider (varchar: 'razorpay')
 * - payload (jsonb)
 * - order_id (uuid / varchar: nullable)
 * - status (varchar: 'processed' | 'failed')
 * - error_message (text: nullable)
 * - processed_at (timestamptz)
 */
export async function recordWebhookEvent({
  eventId,
  eventType,
  provider = "razorpay",
  payload,
  orderId,
  status,
  errorMessage,
  processedAt,
  supabaseClient,
}: RecordWebhookEventParams): Promise<{ success: boolean; error?: unknown }> {
  // Ensure effective event_id is never empty
  const effectiveEventId =
    eventId && typeof eventId === "string" && eventId.trim().length > 0
      ? eventId.trim()
      : `evt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

  // Normalize order_id to valid UUID or null to prevent UUID syntax or FK violations
  const safeOrderId =
    orderId && typeof orderId === "string" && UUID_REGEX.test(orderId.trim())
      ? orderId.trim()
      : null;

  const timestamp = processedAt || new Date().toISOString();

  const recordToPersist = {
    event_id: effectiveEventId,
    event_type: eventType,
    provider: provider || "razorpay",
    payload: payload || {},
    order_id: safeOrderId,
    status: status,
    error_message: errorMessage || null,
    processed_at: timestamp,
  };

  try {
    const supabase = supabaseClient || createServerSupabaseClient();
    // 1. Check for existing event row by event_id
    const { data: existing, error: selectError } = await supabase
      .from("webhook_events")
      .select("id, event_id")
      .eq("event_id", effectiveEventId)
      .maybeSingle();

    if (selectError) {
      console.error("[Webhook Events Insert Error]", selectError);
    }

    // 2. If existing row found, update it (idempotency for duplicate retries)
    if (existing?.id) {
      const { error: updateError } = await supabase
        .from("webhook_events")
        .update(recordToPersist)
        .eq("id", existing.id);

      if (updateError) {
        console.error("[Webhook Events Insert Error]", updateError);
        return { success: false, error: updateError };
      }

      return { success: true };
    }

    // 3. Otherwise, insert new row (do not provide id so Postgres generates it)
    const { error: insertError } = await supabase
      .from("webhook_events")
      .insert([recordToPersist]);

    if (insertError) {
      // Handle potential race condition if a concurrent request inserted the same event_id
      if (insertError.code === "23505") {
        const { error: fallbackUpdateError } = await supabase
          .from("webhook_events")
          .update(recordToPersist)
          .eq("event_id", effectiveEventId);

        if (fallbackUpdateError) {
          console.error("[Webhook Events Insert Error]", fallbackUpdateError);
          return { success: false, error: fallbackUpdateError };
        }

        return { success: true };
      }

      console.error("[Webhook Events Insert Error]", insertError);
      return { success: false, error: insertError };
    }

    return { success: true };
  } catch (err) {
    console.error("[Webhook Events Insert Error]", err);
    return { success: false, error: err };
  }
}
