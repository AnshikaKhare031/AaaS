-- ==========================================================
-- Migration: Fix Customer Registration Trigger (public.handle_new_user)
-- ==========================================================
-- Root Cause:
-- The function public.handle_new_user() was referencing removed columns
-- (phone / avatar_url) from public.profiles, causing PostgreSQL constraint
-- errors that manifested as "Database error creating new user" during signup.
--
-- Fix:
-- 1. Updates public.handle_new_user() to insert ONLY valid existing columns:
--    id, full_name, email, role.
-- 2. Uses ON CONFLICT (id) DO NOTHING to safely preserve existing profiles.
-- 3. Preserves default role 'customer' and full_name fallback.
-- 4. Ensures on_auth_user_created trigger is attached to auth.users without
--    dropping or recreating it if already present.
-- ==========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Valued Customer'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up legacy duplicate trigger if present from earlier migrations
DROP TRIGGER IF EXISTS on_auth_user_created_customer_profile ON auth.users;

-- Ensure trigger exists on auth.users without unnecessarily recreating if already present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

