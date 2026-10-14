import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server-side environment variables (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY).");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function createServerUserClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase client-side environment variables.");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Can be ignored if handled by middleware
        }
      },
    },
  });
}

export interface CustomerProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

/**
 * Ensures that a public.profiles row exists for a verified authenticated user ID.
 * This provides server-side self-healing / recovery against race conditions,
 * missing signup triggers, or legacy accounts lacking a profile.
 *
 * Uses the privileged service-role client to guarantee insertion without being
 * blocked by owner-only RLS or client state, while strictly using a verified
 * server-side user ID (never a client-supplied ID).
 */
export async function ensureCustomerProfile(
  userId: string,
  email?: string | null,
  fullName?: string | null
): Promise<CustomerProfileRow | null> {
  if (!userId) return null;

  const adminClient = createServerSupabaseClient();
  const safeEmail = email ? email.trim() : null;
  const safeFullName =
    fullName && fullName.trim().length > 0
      ? fullName.trim()
      : safeEmail?.split("@")[0] || "Valued Customer";

  // Check if profile exists first
  const { data: existing, error: selectError } = await adminClient
    .from("profiles")
    .select("id, email, full_name, role, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (existing && !selectError) {
    return existing as CustomerProfileRow;
  }

  // Idempotently insert missing profile row without overwriting if created concurrently
  const { data: inserted, error: insertError } = await adminClient
    .from("profiles")
    .upsert(
      {
        id: userId,
        email: safeEmail,
        full_name: safeFullName,
        role: "customer",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id", ignoreDuplicates: true }
    )
    .select("id, email, full_name, role, created_at, updated_at")
    .maybeSingle();

  if (insertError) {
    console.error("ensureCustomerProfile insert error:", insertError);
  }

  if (inserted) {
    return inserted as CustomerProfileRow;
  }

  // If ignoreDuplicates: true prevented insertion because of a concurrent insert,
  // or if insert errored, perform a fresh SELECT to return the existing profile
  const { data: freshProfile, error: freshSelectError } = await adminClient
    .from("profiles")
    .select("id, email, full_name, role, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (freshSelectError) {
    console.error("ensureCustomerProfile fresh SELECT error:", freshSelectError);
  }

  return (freshProfile as CustomerProfileRow) || null;
}

