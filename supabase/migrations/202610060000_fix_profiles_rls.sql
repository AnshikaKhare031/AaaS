-- Security Hardening: Restrict public/anon access to profiles table
-- Application: AaaS E-Commerce Platform

-- Ensure RLS is active on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove any overly permissive or public policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone'
  ) THEN
    DROP POLICY "Public profiles are viewable by everyone" ON public.profiles;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Profiles are viewable by everyone'
  ) THEN
    DROP POLICY "Profiles are viewable by everyone" ON public.profiles;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Enable read access for all users'
  ) THEN
    DROP POLICY "Enable read access for all users" ON public.profiles;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Profiles are readable by anyone'
  ) THEN
    DROP POLICY "Profiles are readable by anyone" ON public.profiles;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Allow public read'
  ) THEN
    DROP POLICY "Allow public read" ON public.profiles;
  END IF;
END $$;

-- Recreate strict owner-only SELECT policy
DROP POLICY IF EXISTS "Profiles are readable by owner" ON public.profiles;
CREATE POLICY "Profiles are readable by owner"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Maintain strict owner-only INSERT policy
DROP POLICY IF EXISTS "Profiles are insertable by owner" ON public.profiles;
CREATE POLICY "Profiles are insertable by owner"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Maintain strict owner-only UPDATE policy
DROP POLICY IF EXISTS "Profiles are updatable by owner" ON public.profiles;
CREATE POLICY "Profiles are updatable by owner"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
