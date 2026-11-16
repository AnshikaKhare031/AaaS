import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { expirePendingOrders } from "@/lib/supabase/expire-orders";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  // In development, allow testing if secret is not set
  if (!cronSecret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[Cron Expire-Orders] CRON_SECRET is not configured on production server.");
      return false;
    }
    return true;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (token === cronSecret) {
      return true;
    }
  }

  const headerSecret = request.headers.get("x-cron-secret");
  if (headerSecret && headerSecret.trim() === cronSecret) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServerSupabaseClient();
    console.log("[Cron Expire-Orders] Starting scheduled pending orders sweep...");
    await expirePendingOrders(supabase);
    console.log("[Cron Expire-Orders] Completed scheduled pending orders sweep.");

    return NextResponse.json({
      success: true,
      message: "Order expiration sweep completed successfully.",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron Expire-Orders] Sweep error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
