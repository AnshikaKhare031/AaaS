import { NextResponse } from "next/server";
import { createServerUserClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createServerUserClient();
    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Customer logout error:", error);
    return NextResponse.json({ success: false, error: "Unable to log out." }, { status: 500 });
  }
}
