import { NextResponse } from "next/server";
import { setSession } from "@/lib/auth/session";
import {
  verifyPassword,
  isLoginRateLimited,
  recordFailedLoginAttempt,
  clearLoginAttempts,
} from "@/lib/utils/auth";

function getClientIdentifier(request: Request): string {
  // Edge proxy trusted headers: Vercel, Cloudflare, Fastly, AWS
  const vercelIp = request.headers.get("x-vercel-ip")?.trim();
  if (vercelIp) return vercelIp;

  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return "unknown";
}

export async function POST(request: Request) {
  try {
    const identifier = getClientIdentifier(request);

    if (await isLoginRateLimited(identifier)) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    if (!verifyPassword(password)) {
      await recordFailedLoginAttempt(identifier);
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    // Correct password, clear attempts and set session
    await clearLoginAttempts(identifier);
    await setSession({ admin: true });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Login API error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
