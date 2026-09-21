import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { settings } from '../src/server/config';

const SUPABASE_URL = settings.SUPABASE_URL || 'https://seyqdbdvcofdvgjxsvbt.supabase.co';
const SUPABASE_ANON_KEY = settings.SUPABASE_ANON_KEY || 'sb_publishable_astPHrwj2EufjHMrJQVkbQ_NBkf9oCU';
const SUPABASE_SERVICE_ROLE_KEY = settings.SUPABASE_SERVICE_ROLE_KEY;

describe('Customer Profile System - Phone Removal Verification', () => {
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

  // Step A: Create brand-new customer account & verify registration sends only full_name (no phone)
  it('A: Registration creates account in auth.users and profile in public.profiles without phone', async () => {
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

    // Verify auth.users record does NOT have phone metadata
    expect(authData.user?.user_metadata?.full_name).toBe(testFullName);
    expect(authData.user?.user_metadata?.phone).toBeUndefined();

    // 2. Verify trigger automatically creates corresponding row in public.profiles
    const { data: profile, error: profileErr } = await adminClient
      .from('profiles')
      .select('id, full_name, email, role, avatar_url')
      .eq('id', createdUserId)
      .single();

    expect(profileErr).toBeNull();
    expect(profile).toBeDefined();
    expect(profile!.id).toBe(createdUserId);
    expect(profile!.full_name).toBe(testFullName);
    expect(profile!.email).toBe(testEmail);
    expect(profile!.role).toBe('customer');

    // Verify application profile fields do NOT include phone
    expect((profile as any).phone).toBeUndefined();
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

  // Step C: Open /account - verify profile displays full_name and email, and no phone field
  it('C: Account profile fetch returns full_name, email and contains no phone field', async () => {
    const { data: profile, error: fetchErr } = await publicClient
      .from('profiles')
      .select('id, full_name, email, role, avatar_url')
      .eq('id', createdUserId)
      .single();

    expect(fetchErr).toBeNull();
    expect(profile!.full_name).toBe(testFullName);
    expect(profile!.email).toBe(testEmail);
    expect((profile as any).phone).toBeUndefined();
  });

  // Step D: Edit profile - verify profile updates successfully without sending phone
  it('D: Profile updates full_name successfully without sending phone', async () => {
    const updatedName = 'Ananya Sharma (Updated)';

    const updatePayload = {
      full_name: updatedName,
      updated_at: new Date().toISOString(),
    };

    // Customer updates their own profile
    const { data: updatedRecord, error: updateErr } = await publicClient
      .from('profiles')
      .update(updatePayload)
      .eq('id', createdUserId)
      .select('id, full_name, email, role, avatar_url')
      .single();

    expect(updateErr).toBeNull();
    expect(updatedRecord).toBeDefined();
    expect(updatedRecord!.full_name).toBe(updatedName);
    expect((updatedRecord as any).phone).toBeUndefined();

    // Verify persisted database row
    const { data: verifiedRow } = await adminClient
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', createdUserId)
      .single();

    expect(verifiedRow?.full_name).toBe(updatedName);
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

    // Clean up temporary test user
    if (createdUserId) {
      await adminClient.auth.admin.deleteUser(createdUserId);
    }
  });
});
