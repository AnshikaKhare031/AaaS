-- ==========================================================
-- Migration: Remove obsolete phone column from public.profiles
-- ==========================================================

-- Verify that public.profiles has no dependencies on phone
-- and drop the phone column safely.
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS phone;
