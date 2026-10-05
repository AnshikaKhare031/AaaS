import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { decryptSession } from "./lib/auth/session";

function isCustomerProtectedPath(pathname: string) {
  return (
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/") ||
    pathname === "/profile" ||
    pathname.startsWith("/profile/") ||
    pathname === "/my-orders" ||
    pathname.startsWith("/my-orders/") ||
    pathname === "/order-confirmation" ||
    pathname.startsWith("/order-confirmation/")
  );
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      domain: cookie.domain,
      maxAge: cookie.maxAge,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sameSite: cookie.sameSite as any,
    });
  });
  return to;
}

function redirectToLogin(request: NextRequest, supabaseResponse: NextResponse) {
  const loginUrl = new URL("/login", request.url);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set("next", nextPath);
  const response = NextResponse.redirect(loginUrl);

  // Copy cookies from supabaseResponse (which has any refreshed Supabase session tokens)
  copyCookies(supabaseResponse, response);

  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  let user = null;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // Refresh the Supabase SSR session if necessary and get the authenticated user
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  // Protect every route beginning with /admin, EXCEPT /admin/login
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const sessionToken = request.cookies.get("admin_session")?.value;

    if (!sessionToken) {
      return copyCookies(supabaseResponse, NextResponse.redirect(new URL("/admin/login", request.url)));
    }

    const payload = await decryptSession(sessionToken);
    if (!payload) {
      return copyCookies(supabaseResponse, NextResponse.redirect(new URL("/admin/login", request.url)));
    }
  }

  // Protect customer routes using Supabase Auth as the single source of truth
  if (isCustomerProtectedPath(pathname)) {
    if (!user) {
      return redirectToLogin(request, supabaseResponse);
    }
  }

  return supabaseResponse;
}

// Config to run middleware only on relevant paths
export const config = {
  matcher: ["/admin/:path*", "/profile/:path*", "/my-orders/:path*", "/checkout/:path*", "/order-confirmation/:path*"],
};

