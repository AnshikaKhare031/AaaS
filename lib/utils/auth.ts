import crypto from "crypto";
import { getSession } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Checks if the current user session is authenticated as administrator.
 * Returns true if authenticated, false otherwise.
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * Verifies if the provided password matches the ADMIN_PASSWORD environment variable.
 * Uses a constant-time comparison to avoid leaking password length/content via timing.
 */
export function verifyPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error("ADMIN_PASSWORD is not configured on the server.");
    return false;
  }

  const providedBuffer = Buffer.from(password, "utf8");
  const expectedBuffer = Buffer.from(adminPassword, "utf8");

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface LoginAttemptEntry {
  count: number;
  windowStart: number;
}

// In-memory fallback in case of transient database disconnects
const fallbackLoginAttempts = new Map<string, LoginAttemptEntry>();

/**
 * Checks whether an identifier (e.g. client IP) has exceeded the allowed admin login attempts.
 * Queries Supabase admin_login_attempts table with in-memory fallback.
 */
export async function isLoginRateLimited(identifier: string): Promise<boolean> {
  if (!identifier || identifier === "unknown") return false;

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("admin_login_attempts")
      .select("attempt_count, window_start")
      .eq("identifier", identifier)
      .maybeSingle();

    if (!error && data) {
      const windowStart = new Date(data.window_start).getTime();
      if (Date.now() - windowStart > LOGIN_ATTEMPT_WINDOW_MS) {
        // Window expired, clean up asynchronously
        void supabase.from("admin_login_attempts").delete().eq("identifier", identifier);
        return false;
      }
      return data.attempt_count >= MAX_LOGIN_ATTEMPTS;
    }
  } catch (err) {
    console.warn("[Admin Rate Limiter] Database check notice, using fallback:", err);
  }

  // Fallback to in-memory store
  const entry = fallbackLoginAttempts.get(identifier);
  if (!entry) return false;

  if (Date.now() - entry.windowStart > LOGIN_ATTEMPT_WINDOW_MS) {
    fallbackLoginAttempts.delete(identifier);
    return false;
  }

  return entry.count >= MAX_LOGIN_ATTEMPTS;
}

/**
 * Records a failed login attempt in Supabase with in-memory fallback.
 */
export async function recordFailedLoginAttempt(identifier: string): Promise<void> {
  if (!identifier || identifier === "unknown") return;

  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  try {
    const supabase = createServerSupabaseClient();
    const { data: existing, error: selectError } = await supabase
      .from("admin_login_attempts")
      .select("id, attempt_count, window_start")
      .eq("identifier", identifier)
      .maybeSingle();

    if (!selectError && existing) {
      const windowStart = new Date(existing.window_start).getTime();
      if (now - windowStart > LOGIN_ATTEMPT_WINDOW_MS) {
        // Reset window
        await supabase
          .from("admin_login_attempts")
          .update({
            attempt_count: 1,
            window_start: nowIso,
            updated_at: nowIso,
          })
          .eq("id", existing.id);
      } else {
        // Increment count
        await supabase
          .from("admin_login_attempts")
          .update({
            attempt_count: existing.attempt_count + 1,
            updated_at: nowIso,
          })
          .eq("id", existing.id);
      }
      return;
    } else if (!selectError) {
      // Insert new attempt record
      await supabase.from("admin_login_attempts").insert({
        identifier,
        attempt_count: 1,
        window_start: nowIso,
        updated_at: nowIso,
      });
      return;
    }
  } catch (err) {
    console.warn("[Admin Rate Limiter] Database update notice, using fallback:", err);
  }

  // Fallback in-memory
  const entry = fallbackLoginAttempts.get(identifier);
  if (!entry || now - entry.windowStart > LOGIN_ATTEMPT_WINDOW_MS) {
    fallbackLoginAttempts.set(identifier, { count: 1, windowStart: now });
  } else {
    entry.count += 1;
  }
}

/**
 * Clears failed login attempts for the given identifier upon successful authentication.
 */
export async function clearLoginAttempts(identifier: string): Promise<void> {
  if (!identifier || identifier === "unknown") return;

  fallbackLoginAttempts.delete(identifier);

  try {
    const supabase = createServerSupabaseClient();
    await supabase.from("admin_login_attempts").delete().eq("identifier", identifier);
  } catch (err) {
    console.warn("[Admin Rate Limiter] Failed to clear attempts in database:", err);
  }
}
