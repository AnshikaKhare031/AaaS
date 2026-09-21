import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://seyqdbdvcofdvgjxsvbt.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: Missing Supabase environment variables');
  process.exit(1);
}

const publicClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runVerification() {
  const timestamp = Date.now();
  const testEmail = `trigger_test_${timestamp}@example.com`;
  const testFullName = `Trigger Verification Test User ${timestamp}`;
  let createdUserId: string | null = null;

  console.log(`\n======================================================`);
  console.log(`Starting Live Supabase Customer Registration Trigger Test`);
  console.log(`Test Email: ${testEmail}`);
  console.log(`======================================================\n`);

  try {
    // Step A: Attempt real customer signup via publicClient.auth.signUp()
    console.log('[Step A & G] Calling supabase.auth.signUp()...');
    const { data: signupData, error: signupError } = await publicClient.auth.signUp({
      email: testEmail,
      password: 'StrongTriggerTestPass123!@#',
      options: {
        data: {
          full_name: testFullName,
        },
      },
    });

    if (signupError) {
      console.error('❌ Step A/G Failed: signUp() returned error:', signupError.message, `(Status: ${signupError.status})`);
      if (signupError.status === 500) {
        console.error('👉 Confirmation: Trigger public.handle_new_user() still failed with 500 error.');
      }
      return false;
    }

    if (!signupData.user || !signupData.user.id) {
      console.error('❌ Step A Failed: signUp() succeeded but returned no user object');
      return false;
    }

    createdUserId = signupData.user.id;
    console.log(`✓ Step A Passed: signUp() succeeded. User ID: ${createdUserId}`);
    console.log(`✓ Step G Passed: Zero 500 "Database error creating new user" errors encountered.`);

    // Step B: Verify row exists in auth.users
    console.log('[Step B] Verifying corresponding row in auth.users...');
    const { data: userRecord, error: userFetchErr } = await adminClient.auth.admin.getUserById(createdUserId);
    if (userFetchErr || !userRecord?.user) {
      console.error('❌ Step B Failed: User not found in auth.users:', userFetchErr?.message);
      return false;
    }
    console.log(`✓ Step B Passed: Confirmed user exists in auth.users with email: ${userRecord.user.email}`);

    // Step C: Verify corresponding row was created in public.profiles by trigger
    console.log('[Step C, D, E, F] Verifying triggered row in public.profiles...');
    const { data: profileRecord, error: profileFetchErr } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', createdUserId)
      .single();

    if (profileFetchErr || !profileRecord) {
      console.error('❌ Step C Failed: Profile row not found in public.profiles:', profileFetchErr?.message);
      return false;
    }
    console.log('✓ Step C Passed: Profile record found in public.profiles.');

    // Step D: Verify profile fields (id, full_name, email, role = 'customer')
    const hasCorrectId = profileRecord.id === createdUserId;
    const hasCorrectEmail = profileRecord.email === testEmail;
    const hasCorrectFullName = profileRecord.full_name === testFullName;
    const hasCorrectRole = profileRecord.role === 'customer';

    if (!hasCorrectId || !hasCorrectEmail || !hasCorrectFullName || !hasCorrectRole) {
      console.error('❌ Step D Failed: Profile record columns mismatch:', {
        id: profileRecord.id,
        expectedId: createdUserId,
        email: profileRecord.email,
        expectedEmail: testEmail,
        full_name: profileRecord.full_name,
        expectedFullName: testFullName,
        role: profileRecord.role,
        expectedRole: 'customer',
      });
      return false;
    }
    console.log(`✓ Step D Passed: Profile contains id, email, full_name="${profileRecord.full_name}", role="${profileRecord.role}".`);

    // Step E & F: Verify phone and avatar_url do NOT exist
    const hasPhone = 'phone' in profileRecord && profileRecord.phone !== undefined;
    const hasAvatar = 'avatar_url' in profileRecord && profileRecord.avatar_url !== undefined;

    if (hasPhone) {
      console.error('❌ Step E Failed: "phone" column unexpectedly exists in public.profiles:', profileRecord.phone);
      return false;
    }
    console.log('✓ Step E Passed: "phone" does not exist in public.profiles.');

    if (hasAvatar) {
      console.error('❌ Step F Failed: "avatar_url" column unexpectedly exists in public.profiles:', profileRecord.avatar_url);
      return false;
    }
    console.log('✓ Step F Passed: "avatar_url" does not exist in public.profiles.');

    console.log('\n======================================================');
    console.log('🎉 ALL LIVE SUPABASE TRIGGER VERIFICATION CHECKS PASSED!');
    console.log('======================================================\n');
    return true;
  } catch (err: any) {
    console.error('Unexpected execution error:', err.message);
    return false;
  } finally {
    // Step H: Safely clean up temporary test user
    if (createdUserId) {
      console.log(`[Cleanup] Deleting temporary test account (${createdUserId})...`);
      const { error: deleteErr } = await adminClient.auth.admin.deleteUser(createdUserId);
      if (deleteErr) {
        console.warn('⚠️ Warning: Failed to clean up test user:', deleteErr.message);
      } else {
        console.log('✓ Cleanup: Temporary test account successfully deleted.');
      }
    }
  }
}

runVerification().then((success) => {
  process.exitCode = success ? 0 : 1;
});
