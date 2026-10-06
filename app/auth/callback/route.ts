import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/profile";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle provider-level errors (e.g. user canceled or provider misconfigured)
  if (error || errorDescription) {
    console.error("Auth callback error from provider:", error, errorDescription);
    const errorMessage = errorDescription || error || "Authentication failed.";
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMessage)}`);
  }

  if (code) {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";
    const redirectUrl = isLocalEnv
      ? `${origin}${next}`
      : forwardedHost
      ? `https://${forwardedHost}${next}`
      : `${origin}${next}`;

    const response = NextResponse.redirect(redirectUrl);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      });

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (!exchangeError) {
        return response;
      }
      console.error("Auth callback code exchange error:", exchangeError);
    }

    return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
  }

  // If there is no code in the query string, this may be an implicit flow redirect
  // where tokens are in the URL hash (e.g. #access_token=...&refresh_token=...).
  // The hash is only visible to the client browser, not the server.
  // Return an HTML client page that preserves and processes the hash.
  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Authenticating | AaaS</title>
  </head>
  <body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#F8F2E7;color:#25382E;font-family:sans-serif;">
    <div style="text-align:center;">
      <h2 style="font-weight:400;margin-bottom:8px;">Verifying your account...</h2>
      <p style="color:#5C745F;font-size:14px;">Please wait while we complete your sign in.</p>
    </div>
    <script>
      (function() {
        var hash = window.location.hash;
        var next = ${JSON.stringify(next)};
        if (hash && hash.indexOf("access_token") !== -1) {
          window.location.replace(next + hash);
        } else {
          window.location.replace("/login?error=auth-code-error");
        }
      })();
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
