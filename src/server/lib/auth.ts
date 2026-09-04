import jwt from 'jsonwebtoken';
import { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { settings } from '../config';
import { store, supabaseClient } from '../database';
import { AuthUser } from '../types';

export function createAdminSessionToken(email?: string, userId = 'admin-user-id-001'): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 7 * 24 * 60 * 60; // 7 days
  const payload = {
    sub: userId,
    email: email || settings.ADMIN_EMAIL,
    role: 'admin',
    iat: now,
    exp,
    aud: 'authenticated',
  };
  return jwt.sign(payload, settings.ADMIN_JWT_SECRET, { algorithm: 'HS256' });
}

export async function getCurrentUser(c: Context): Promise<AuthUser | null> {
  const authHeader = c.req.header('authorization');
  let token: string | undefined;

  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    token = getCookie(c, 'admin_session');
  }

  if (!token) {
    return null;
  }

  let payload: any = null;
  const secrets = [settings.ADMIN_JWT_SECRET, settings.SUPABASE_JWT_SECRET];

  for (const secret of secrets) {
    try {
      payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
      break;
    } catch {
      continue;
    }
  }

  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const userId = payload.sub;
  const email = payload.email || '';
  if (!userId) {
    return null;
  }

  let role: string = payload.role || 'customer';

  // Server-side authoritative role lookup
  if (supabaseClient) {
    try {
      const { data } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      if (data && data.role) {
        role = data.role;
      }
    } catch {
      // Fallback
    }
  } else {
    const profile = store.profiles[userId];
    if (profile && profile.role) {
      role = profile.role;
    }
  }

  return {
    id: userId,
    email,
    role: (role === 'admin' ? 'admin' : 'customer'),
  };
}

export async function requireAuth(c: Context): Promise<AuthUser | Response> {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ detail: 'Authentication required' }, 401);
  }
  return user;
}

export async function requireAdmin(c: Context): Promise<AuthUser | Response> {
  const userOrResponse = await requireAuth(c);
  if (userOrResponse instanceof Response) {
    return userOrResponse;
  }
  if (userOrResponse.role !== 'admin') {
    return c.json({ detail: 'Admin authorization required to access this resource' }, 403);
  }
  return userOrResponse;
}
