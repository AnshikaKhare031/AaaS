import { createServerUserClient } from "@/lib/supabase/server";
import { CustomerSessionPayload } from "./customer-session";

export async function getCustomerSession(): Promise<CustomerSessionPayload | null> {
  try {
    const supabase = await createServerUserClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    const fullName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email?.split("@")[0] ??
      null;

    const avatarUrl =
      (user.user_metadata?.avatar_url as string | undefined) ??
      (user.user_metadata?.picture as string | undefined) ??
      null;

    return {
      accessToken: "",
      refreshToken: "",
      expiresAt: Date.now() + 3600 * 1000,
      user: {
        id: user.id,
        email: user.email ?? null,
        fullName,
        avatarUrl,
        createdAt: user.created_at ?? null,
      },
    };
  } catch (err) {
    console.error("getCustomerSession error:", err);
    return null;
  }
}

export async function setCustomerSession(_payload?: CustomerSessionPayload) {
  // Supabase SSR automatically persists session cookies
}

export async function clearCustomerSession() {
  // Supabase SSR automatically clears session cookies on signOut
}
