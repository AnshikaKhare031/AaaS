import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { settings } from '../src/server/config';

const SUPABASE_URL = settings.SUPABASE_URL || 'https://seyqdbdvcofdvgjxsvbt.supabase.co';
const SUPABASE_ANON_KEY = settings.SUPABASE_ANON_KEY || 'sb_publishable_astPHrwj2EufjHMrJQVkbQ_NBkf9oCU';
const SUPABASE_SERVICE_ROLE_KEY = settings.SUPABASE_SERVICE_ROLE_KEY;

describe('Customer Signup Flow & Supabase Response Handling', () => {
  const publicClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 1. Invalid email format
  it('1. Deliberately invalid email returns validation error and does NOT create user', async () => {
    const res = await publicClient.auth.signUp({
      email: 'not-an-email-at-all',
      password: 'StrongPassword123!',
    });

    expect(res.error).not.toBeNull();
    expect(res.error?.message).toContain('invalid');
    expect(res.data.user).toBeNull();
  });

  // 2. Weak password
  it('2. Password violating minimum length returns weak_password error', async () => {
    const res = await publicClient.auth.signUp({
      email: 'valid_syntax_user@example.com',
      password: '123',
    });

    expect(res.error).not.toBeNull();
    expect(res.error?.message).toContain('at least 6 characters');
    expect(res.data.user).toBeNull();
  });

  // 3. Duplicate email handling
  it('3. Duplicate email returns empty identities array in Supabase GoTrue', async () => {
    // Existing verified account
    const res = await publicClient.auth.signUp({
      email: 'verified_customer_test@aaascrochet.com',
      password: 'CustomerPassword123!',
    });

    // When duplicate email is submitted, GoTrue returns either an empty identities array or an error
    if (!res.error) {
      expect(Array.isArray(res.data.user?.identities)).toBe(true);
      expect(res.data.user?.identities?.length).toBe(0);
      expect(res.data.session).toBeNull();
    } else {
      expect(res.error.message).toBeTruthy();
    }
  });

  // 4. Database Trigger on auth.users -> public.profiles
  it('4. User creation in auth.users triggers automatic profile creation in public.profiles', async () => {
    const uniqueEmail = `flow_test_${Date.now()}@aaascrochet.com`;
    const fullName = 'Automation Test User';

    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email: uniqueEmail,
      password: 'StrongPassword123!',
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    expect(createErr).toBeNull();
    expect(newUser?.user?.id).toBeDefined();

    const createdUserId = newUser.user!.id;

    // Verify row automatically exists in profiles table
    const { data: profile, error: profileErr } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', createdUserId)
      .single();

    expect(profileErr).toBeNull();
    expect(profile).toBeDefined();
    expect(profile.id).toBe(createdUserId);
    expect(profile.email).toBe(uniqueEmail);
    expect(profile.full_name).toBe(fullName);
    expect(profile.role).toBe('customer');

    // Clean up test user
    await adminClient.auth.admin.deleteUser(createdUserId);
  });

  // 5. Existing user verified in Supabase
  it('5. Confirms verified customer account exists in auth.users and profiles table', async () => {
    const targetEmail = 'verified_customer_test@aaascrochet.com';

    const { data: list } = await adminClient.auth.admin.listUsers();
    const userInAuth = list.users.find((u) => u.email === targetEmail);

    expect(userInAuth).toBeDefined();
    expect(userInAuth?.id).toBe('0fa248e7-b97c-4d03-bd15-6518396fa4d7');

    const { data: profile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', userInAuth!.id)
      .single();

    expect(profile).toBeDefined();
    expect(profile.email).toBe(targetEmail);
    expect(profile.role).toBe('customer');
  });
});
