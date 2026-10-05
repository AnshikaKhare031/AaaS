import { NextResponse } from "next/server";
import { createServerUserClient, createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createServerUserClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: true, session: null });
    }

    const serviceSupabase = createServerSupabaseClient();
    const fullName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email?.split("@")[0] ??
      null;

    const avatarUrl =
      (user.user_metadata?.avatar_url as string | undefined) ??
      (user.user_metadata?.picture as string | undefined) ??
      null;

    const { data: profile } = await serviceSupabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: fullName,
          email: user.email,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select("*")
      .maybeSingle();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName,
        avatarUrl,
      },
      profile,
    });
  } catch (error) {
    console.error("Customer session sync error:", error);
    return NextResponse.json({ success: false, error: "Unable to sync session." }, { status: 500 });
  }
}
