// ==========================================================
// Edge Middleware for Admin Security Boundary
// ==========================================================

const WHITELISTED_PATHS = [
  '/admin/login',
  '/api/admin/login',
];

/**
 * Edge-compatible middleware verifying admin_session cookie signature and expiration.
 * Redirects unauthenticated traffic to /admin/login or returns 401 for API endpoints.
 */
export async function middleware(request: any) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Whitelist /admin/login and /api/admin/login
  if (WHITELISTED_PATHS.some((allowed) => pathname === allowed || pathname.startsWith(allowed))) {
    return;
  }

  // Extract admin_session cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c: string) => {
      const [k, ...v] = c.trim().split('=');
      return [k, decodeURIComponent(v.join('='))];
    })
  );

  let sessionToken = cookies['admin_session'];
  const authHeader = request.headers.get('authorization') || '';
  if (!sessionToken && authHeader.toLowerCase().startsWith('bearer ')) {
    sessionToken = authHeader.slice(7).trim();
  }

  if (!sessionToken) {
    if (pathname.startsWith('/api/')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', detail: 'Admin session required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const redirectUrl = new URL('/admin/login', request.url);
    redirectUrl.searchParams.set('from', pathname);
    return Response.redirect(redirectUrl.toString(), 307);
  }

  try {
    // Validate JWT structure and expiration
    const parts = sessionToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Malformed token');
    }

    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(payloadBase64));

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSeconds) {
      throw new Error('Session expired');
    }

    if (payload.role !== 'admin') {
      throw new Error('Unauthorized role');
    }

    // Authenticated admin session
    return;
  } catch (err) {
    if (pathname.startsWith('/api/')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', detail: 'Invalid or expired admin session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const redirectUrl = new URL('/admin/login', request.url);
    redirectUrl.searchParams.set('from', pathname);
    return Response.redirect(redirectUrl.toString(), 307);
  }
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
