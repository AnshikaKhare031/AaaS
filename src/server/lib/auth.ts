import jwt from 'jsonwebtoken';
import crypto from 'crypto';
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

// In-memory cache for Supabase JWKS public keys
const cachedJwkKeys: Map<string, crypto.KeyObject> = new Map();
let lastJwksFetch = 0;

async function getSupabasePublicKey(kid?: string): Promise<crypto.KeyObject | null> {
  const now = Date.now();
  if (cachedJwkKeys.size === 0 || (kid && !cachedJwkKeys.has(kid)) || now - lastJwksFetch > 600000) {
    if (!settings.SUPABASE_URL) return null;
    try {
      const res = await fetch(`${settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json`, {
        headers: settings.SUPABASE_ANON_KEY ? { apikey: settings.SUPABASE_ANON_KEY } : undefined,
      });
      if (res.ok) {
        const jwks: any = await res.json();
        if (Array.isArray(jwks?.keys)) {
          for (const key of jwks.keys) {
            try {
              const pubKey = crypto.createPublicKey({ key, format: 'jwk' });
              if (key.kid) {
                cachedJwkKeys.set(key.kid, pubKey);
              }
              cachedJwkKeys.set('default', pubKey);
            } catch {
              // Ignore invalid key format
            }
          }
          lastJwksFetch = now;
        }
      }
    } catch {
      // Ignore network failures
    }
  }
  if (kid && cachedJwkKeys.has(kid)) {
    return cachedJwkKeys.get(kid)!;
  }
  return cachedJwkKeys.get('default') || null;
}

export async function getCurrentUser(c: Context): Promise<AuthUser | null> {
  const authHeader = c.req.header('authorization');
  let token: string | undefined;

  if (authHeader) {
    const parts = authHeader.trim().split(/\s+/);
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

  let userId: string | null = null;
  let email = '';
  let role: 'admin' | 'customer' = 'customer';
  let verified = false;

  // 1. Backend-issued Admin Session token (HS256)
  if (settings.ADMIN_JWT_SECRET) {
    try {
      const adminPayload: any = jwt.verify(token, settings.ADMIN_JWT_SECRET, { algorithms: ['HS256'] });
      if (adminPayload && typeof adminPayload === 'object' && adminPayload.sub) {
        userId = adminPayload.sub;
        email = adminPayload.email || '';
        role = adminPayload.role === 'admin' ? 'admin' : 'customer';
        verified = true;
      }
    } catch {
      // Not signed with ADMIN_JWT_SECRET
    }
  }

  // 2. Symmetric SUPABASE_JWT_SECRET (HS256 for local test suites / legacy symmetric tokens)
  if (!verified && settings.SUPABASE_JWT_SECRET) {
    try {
      const hmacPayload: any = jwt.verify(token, settings.SUPABASE_JWT_SECRET, { algorithms: ['HS256'] });
      if (hmacPayload && typeof hmacPayload === 'object' && hmacPayload.sub) {
        userId = hmacPayload.sub;
        email = hmacPayload.email || '';
        role = hmacPayload.role === 'admin' ? 'admin' : 'customer';
        verified = true;
      }
    } catch {
      // Not signed with SUPABASE_JWT_SECRET
    }
  }

  // 3. Supabase Asymmetric Token Verification via JWKS (ES256)
  if (!verified) {
    try {
      const decoded = jwt.decode(token, { complete: true }) as {
        header?: { alg?: string; kid?: string };
        payload?: any;
      } | null;

      if (decoded?.header?.alg === 'ES256') {
        const pubKey = await getSupabasePublicKey(decoded.header.kid);
        if (pubKey) {
          const es256Payload: any = jwt.verify(token, pubKey, { algorithms: ['ES256'] });
          if (es256Payload && typeof es256Payload === 'object' && es256Payload.sub) {
            userId = es256Payload.sub;
            email = es256Payload.email || '';
            const metaRole = es256Payload.user_metadata?.role || es256Payload.app_metadata?.role;
            role = metaRole === 'admin' ? 'admin' : 'customer';
            verified = true;
          }
        }
      }
    } catch {
      // ES256 verification failed
    }
  }

  // 4. Authoritative Supabase Auth API verification
  if (!verified && supabaseClient) {
    try {
      const { data: authData, error: authError } = await supabaseClient.auth.getUser(token);
      if (!authError && authData?.user) {
        userId = authData.user.id;
        email = authData.user.email || '';
        const metaRole = authData.user.user_metadata?.role || authData.user.app_metadata?.role;
        role = metaRole === 'admin' ? 'admin' : 'customer';
        verified = true;
      }
    } catch {
      // Supabase getUser failed
    }
  }

  if (!verified || !userId) {
    return null;
  }

  // Server-side authoritative role lookup
  if (supabaseClient) {
    try {
      const { data } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      if (data?.role) {
        role = data.role === 'admin' ? 'admin' : 'customer';
      } else if (store.profiles[userId]?.role) {
        role = store.profiles[userId].role === 'admin' ? 'admin' : 'customer';
      }
    } catch {
      if (store.profiles[userId]?.role) {
        role = store.profiles[userId].role === 'admin' ? 'admin' : 'customer';
      }
    }
  } else {
    const profile = store.profiles[userId];
    if (profile?.role) {
      role = profile.role === 'admin' ? 'admin' : 'customer';
    }
  }

  return {
    id: userId,
    email,
    role,
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
