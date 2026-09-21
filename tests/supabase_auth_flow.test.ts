import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import app from '../src/server/app';
import { settings, validateProductionConfig } from '../src/server/config';

const SUPABASE_URL = settings.SUPABASE_URL || 'https://seyqdbdvcofdvgjxsvbt.supabase.co';
const SUPABASE_ANON_KEY = settings.SUPABASE_ANON_KEY || 'sb_publishable_astPHrwj2EufjHMrJQVkbQ_NBkf9oCU';

describe('Supabase Authentication Foundation End-to-End Verification', () => {
  const publicClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  const testEmail = 'aaas_audit_test_1788980673785@gmail.com';
  const testPassword = 'AuditTestPassword123!';

  let realAccessToken = '';
  let realRefreshToken = '';
  let realUserId = '';

  it('1. Public Supabase client initializes with genuine project URL and anon key', () => {
    expect(SUPABASE_URL).toBe('https://seyqdbdvcofdvgjxsvbt.supabase.co');
    expect(SUPABASE_ANON_KEY).toContain('sb_publishable_');
    expect(publicClient).toBeDefined();
    expect(publicClient.auth).toBeDefined();
  });

  it('2. Customer signs in through real Supabase Auth and receives valid ES256 access token', async () => {
    const { data, error } = await publicClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    expect(error).toBeNull();
    expect(data?.session).toBeDefined();
    expect(data?.user).toBeDefined();

    realAccessToken = data.session!.access_token;
    realRefreshToken = data.session!.refresh_token;
    realUserId = data.user!.id;

    expect(realAccessToken).toBeTruthy();
    expect(realUserId).toBe('36154132-32b7-44f7-95f1-1823337fabdb');

    // Verify token algorithm is ES256
    const headerBase64 = realAccessToken.split('.')[0];
    const header = JSON.parse(Buffer.from(headerBase64, 'base64').toString());
    expect(header.alg).toBe('ES256');
  });

  it('3. Backend receives access token and successfully verifies customer identity on GET /api/auth/me', async () => {
    expect(realAccessToken).toBeTruthy();

    const res = await app.request('/api/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${realAccessToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(realUserId);
    expect(body.email).toBe(testEmail);
    expect(body.role).toBe('customer');
    expect(body.is_admin).toBe(false);
  });

  it('4. Backend GET /api/auth/status verifies customer authenticated state', async () => {
    const res = await app.request('/api/auth/status', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${realAccessToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.authenticated).toBe(true);
    expect(body.user.id).toBe(realUserId);
    expect(body.user.email).toBe(testEmail);
  });

  it('5. Protected customer endpoint GET /api/orders succeeds with authenticated Bearer token', async () => {
    const res = await app.request('/api/orders', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${realAccessToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it('6. Invalid token is rejected with 401 Unauthorized', async () => {
    const res = await app.request('/api/auth/me', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.detail).toBe('Authentication required');
  });

  it('7. Forged token is rejected with 401 Unauthorized on protected endpoint', async () => {
    const forgedToken = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJoYWNrZXIiLCJlbWFpbCI6ImhhY2tlckBldmlsLmNvbSJ9.bad_signature';
    const res = await app.request('/api/orders', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${forgedToken}`,
      },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.detail).toBe('Authentication required');
  });

  it('8. Missing token is rejected with 401 Unauthorized', async () => {
    const res = await app.request('/api/auth/me', {
      method: 'GET',
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.detail).toBe('Authentication required');
  });

  it('9. Session persistence & refresh: refreshed access token successfully authenticates backend', async () => {
    const { data: refreshData, error: refreshError } = await publicClient.auth.refreshSession({
      refresh_token: realRefreshToken,
    });

    expect(refreshError).toBeNull();
    expect(refreshData.session).toBeDefined();

    const newAccessToken = refreshData.session!.access_token;
    expect(newAccessToken).toBeTruthy();

    const res = await app.request('/api/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${newAccessToken}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(realUserId);
    expect(body.email).toBe(testEmail);
  });

  it('10. Sign out works: clears Supabase session cleanly', async () => {
    const { error } = await publicClient.auth.signOut();
    expect(error).toBeNull();

    const { data: sessionData } = await publicClient.auth.getSession();
    expect(sessionData.session).toBeNull();
  });

  it('11. Production fail-fast validation rejects placeholder secrets', () => {
    expect(() => validateProductionConfig()).not.toThrow(); // Should pass in dev mode

    // In production mode, placeholders must trigger fatal error
    const origEnv = process.env.ENVIRONMENT;
    const origJwtSecret = settings.SUPABASE_JWT_SECRET;
    try {
      process.env.ENVIRONMENT = 'production';
      // Temporarily test placeholder rejection
      expect(() => {
        // Will throw because settings contains dev/placeholder values
        validateProductionConfig();
      }).toThrow(/FATAL: Insecure default credentials detected/);
    } finally {
      process.env.ENVIRONMENT = origEnv;
    }
  });
});
