-- Migration: 202610140002_backfill_and_sync_profiles.sql
-- Description: Idempotently backfill missing customer profiles for existing auth.users
-- and ensure the on_auth_user_created trigger is active, secure, and aligned with public.profiles.

-- 1. Canonical Trigger Function: secure, role-hardcoded, idempotent
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), ''),
      NULLIF(split_part(NEW.email, '@', 1), ''),
      'Valued Customer'
    ),
    NEW.email,
    'customer',
    COALESCE(NEW.created_at, now()),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2. Clean up legacy obsolete trigger; ensure primary trigger exists without dropping
DROP TRIGGER IF EXISTS on_auth_user_created_customer_profile ON auth.users;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- 3. Idempotently backfill missing profile rows for existing auth.users
-- Only inserts for users missing a row in public.profiles.
-- Existing profile rows, roles (e.g. admin), and updated timestamps are strictly preserved.
INSERT INTO public.profiles (id, full_name, email, role, created_at, updated_at)
SELECT 
  u.id,
  COALESCE(
    NULLIF(TRIM(u.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(TRIM(u.raw_user_meta_data ->> 'name'), ''),
    NULLIF(split_part(u.email, '@', 1), ''),
    'Valued Customer'
  ) AS full_name,
  u.email,
  'customer' AS role,
  COALESCE(u.created_at, now()) AS created_at,
  now() AS updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
