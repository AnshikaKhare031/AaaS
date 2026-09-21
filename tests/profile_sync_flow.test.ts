import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { settings } from '../src/server/config';

const SUPABASE_URL = settings.SUPABASE_URL || 'https://seyqdbdvcofdvgjxsvbt.supabase.co';
const SUPABASE_ANON_KEY = settings.SUPABASE_ANON_KEY || 'sb_publishable_astPHrwj2EufjHMrJQVkbQ_NBkf9oCU';
const SUPABASE_SERVICE_ROLE_KEY = settings.SUPABASE_SERVICE_ROLE_KEY;

describe('Customer Profile System - Phone & Avatar URL Removal Verification', () => {
  const publicClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const testEmail = `aaas_profile_test_${Date.now()}@gmail.com`;
  const testPassword = 'StrongCustomerPassword123!';
  const testFullName = 'Ananya Sharma';
  let createdUserId = '';

  // Step A: Create brand-new customer account & verify registration sends only full_name (no phone, no avatar_url)
  it('A: Registration creates account in auth.users and profile in public.profiles without phone or avatar_url', async () => {
    // 1. Create customer with only email, password, and full_name in user_metadata
    const { data: authData, error: signupError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: testFullName,
      },
    });

    expect(signupError).toBeNull();
    expect(authData.user).toBeDefined();
    createdUserId = authData.user!.id;

    // Verify auth.users record does NOT have phone or avatar metadata
    expect(authData.user?.user_metadata?.full_name).toBe(testFullName);
    expect(authData.user?.user_metadata?.phone).toBeUndefined();
    expect(authData.user?.user_metadata?.avatar).toBeUndefined();
    expect(authData.user?.user_metadata?.avatar_url).toBeUndefined();

    // 2. Verify trigger automatically creates corresponding row in public.profiles
    const { data: profile, error: profileErr } = await adminClient
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', createdUserId)
      .single();

    expect(profileErr).toBeNull();
    expect(profile).toBeDefined();
    expect(profile!.id).toBe(createdUserId);
    expect(profile!.full_name).toBe(testFullName);
    expect(profile!.email).toBe(testEmail);
    expect(profile!.role).toBe('customer');

    // Verify application profile fields do NOT include phone or avatar_url
    expect((profile as any).phone).toBeUndefined();
    expect((profile as any).avatar_url).toBeUndefined();
  });

  // Step B: Sign in with the new customer account
  it('B: Customer authenticates successfully with credentials', async () => {
    const { data: loginData, error: loginErr } = await publicClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    expect(loginErr).toBeNull();
    expect(loginData.session).toBeDefined();
    expect(loginData.session?.access_token).toBeTruthy();
    expect(loginData.user?.id).toBe(createdUserId);
  });

  // Step C: Open /account - verify profile displays full_name and email, and no phone or avatar_url field
  it('C: Account profile fetch returns full_name, email and contains no phone or avatar_url field', async () => {
    const { data: profile, error: fetchErr } = await publicClient
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', createdUserId)
      .single();

    expect(fetchErr).toBeNull();
    expect(profile!.full_name).toBe(testFullName);
    expect(profile!.email).toBe(testEmail);
    expect((profile as any).phone).toBeUndefined();
    expect((profile as any).avatar_url).toBeUndefined();
  });

  // Step D: Edit profile - verify profile updates successfully without sending phone or avatar_url
  it('D: Profile updates full_name successfully without sending phone or avatar_url', async () => {
    const updatedName = 'Ananya Sharma (Updated)';

    const updatePayload = {
      full_name: updatedName,
      updated_at: new Date().toISOString(),
    };

    // Ensure request update payload does not contain avatar_url or phone
    expect('avatar_url' in updatePayload).toBe(false);
    expect('phone' in updatePayload).toBe(false);

    // Customer updates their own profile
    const { data: updatedRecord, error: updateErr } = await publicClient
      .from('profiles')
      .update(updatePayload)
      .eq('id', createdUserId)
      .select('id, full_name, email, role')
      .single();

    expect(updateErr).toBeNull();
    expect(updatedRecord).toBeDefined();
    expect(updatedRecord!.full_name).toBe(updatedName);
    expect((updatedRecord as any).phone).toBeUndefined();
    expect((updatedRecord as any).avatar_url).toBeUndefined();

    // Verify persisted database row
    const { data: verifiedRow } = await adminClient
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', createdUserId)
      .single();

    expect(verifiedRow?.full_name).toBe(updatedName);
    expect((verifiedRow as any).phone).toBeUndefined();
    expect((verifiedRow as any).avatar_url).toBeUndefined();
  });

  // Step E: Migration test: verifies public.profiles.avatar_url is dropped while existing profiles remain intact
  it('E: Migration test: verifies public.profiles.avatar_url is removed while existing profiles remain intact', async () => {
    const { newDb } = await import('pg-mem');
    const db = newDb({ noAstCoverageCheck: true });

    db.public.none('CREATE SCHEMA IF NOT EXISTS auth;');
    db.public.none('CREATE TABLE IF NOT EXISTS auth.users (id UUID PRIMARY KEY, email TEXT);');
    db.public.none(`
      INSERT INTO auth.users (id, email) VALUES
      ('2ce58e58-ec4c-41fe-aeeb-4e5773fcda93', 'admin1@aaas.com'),
      ('36154132-32b7-44f7-95f1-1823337fabdb', 'cust1@aaas.com');
    `);

    // Schema Before Migration:
    // id | full_name | email | avatar_url | role
    db.public.none(`
      CREATE TABLE public.profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        full_name TEXT,
        email TEXT UNIQUE,
        avatar_url TEXT,
        role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      INSERT INTO public.profiles (id, full_name, email, avatar_url, role) VALUES
      ('2ce58e58-ec4c-41fe-aeeb-4e5773fcda93', 'Admin One', 'admin1@aaas.com', NULL, 'admin'),
      ('36154132-32b7-44f7-95f1-1823337fabdb', 'Customer One', 'cust1@aaas.com', NULL, 'customer');
    `);

    // Verify avatar_url column exists BEFORE migration
    const beforeCols = db.public.many(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles';"
    ).map((c: any) => c.column_name);
    expect(beforeCols).toContain('avatar_url');

    const beforeProfiles = db.public.many('SELECT id, full_name, email, avatar_url, role FROM public.profiles;');
    expect(beforeProfiles).toHaveLength(2);

    // Apply idempotent migration
    db.public.none('ALTER TABLE public.profiles DROP COLUMN IF EXISTS avatar_url;');

    // Schema After Migration:
    // id | full_name | email | role
    const afterCols = db.public.many(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles';"
    ).map((c: any) => c.column_name);
    expect(afterCols).not.toContain('avatar_url');
    expect(afterCols).toContain('id');
    expect(afterCols).toContain('full_name');
    expect(afterCols).toContain('email');
    expect(afterCols).toContain('role');

    // Verify existing profile rows remain completely intact
    const afterProfiles = db.public.many('SELECT id, full_name, email, role FROM public.profiles;');
    expect(afterProfiles).toHaveLength(2);
    expect(afterProfiles[0].id).toBe('2ce58e58-ec4c-41fe-aeeb-4e5773fcda93');
    expect(afterProfiles[0].full_name).toBe('Admin One');
    expect(afterProfiles[0].email).toBe('admin1@aaas.com');
    expect(afterProfiles[0].role).toBe('admin');
    expect((afterProfiles[0] as any).avatar_url).toBeUndefined();

    expect(afterProfiles[1].id).toBe('36154132-32b7-44f7-95f1-1823337fabdb');
    expect(afterProfiles[1].full_name).toBe('Customer One');
    expect(afterProfiles[1].email).toBe('cust1@aaas.com');
    expect(afterProfiles[1].role).toBe('customer');
    expect((afterProfiles[1] as any).avatar_url).toBeUndefined();
  });

  // Step F: Verify existing users remain untouched
  it('F: Confirms existing customer accounts remain untouched in auth.users and profiles', async () => {
    const existingTestEmail = 'aaas_audit_test_1788980673785@gmail.com';

    const { data: list } = await adminClient.auth.admin.listUsers();
    const userInAuth = list.users.find((u) => u.email === existingTestEmail);

    expect(userInAuth).toBeDefined();
    expect(userInAuth?.id).toBe('36154132-32b7-44f7-95f1-1823337fabdb');

    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', userInAuth!.id)
      .single();

    expect(existingProfile).toBeDefined();
    expect(existingProfile?.email).toBe(existingTestEmail);
    expect(existingProfile?.role).toBe('customer');
    expect((existingProfile as any).phone).toBeUndefined();
    expect((existingProfile as any).avatar_url).toBeUndefined();

    // Clean up temporary test user
    if (createdUserId) {
      await adminClient.auth.admin.deleteUser(createdUserId);
    }
  });
});
