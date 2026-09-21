-- ==========================================================
-- Migration: Remove obsolete avatar_url column from public.profiles
-- ==========================================================

-- 1. Ensure handle_new_user() trigger function no longer references avatar_url
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

-- 2. Safely drop avatar_url column from public.profiles
-- Verified dependencies:
-- - No foreign keys depend on avatar_url
-- - No RLS policies depend on avatar_url
-- - No views depend on avatar_url
-- - No indexes depend on avatar_url
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS avatar_url;
