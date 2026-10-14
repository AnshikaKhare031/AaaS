-- Rollback Migration: 202610140002_backfill_and_sync_profiles_rollback.sql
-- Description: Rollback definitions for 202610140002_backfill_and_sync_profiles.sql.
-- NOTE: Dropping profile rows for real users who have addresses or orders
-- would re-introduce foreign-key violations (code 23503). Therefore, deleting
-- populated profiles is strongly discouraged.
--
-- This script reverts the trigger function definition with secure search_path.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), ''),
      NULLIF(split_part(NEW.email, '@', 1), ''),
      'Valued Customer'
    ),
    NEW.email,
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
