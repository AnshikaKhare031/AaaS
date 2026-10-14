-- Rollback Migration: 202610140001_remove_product_slug_rollback.sql
-- Description: Restores the slug column, its constraints, and the exact pre-migration slug values for all products
-- Data Source: supabase/products_backup_before_slug_removal.json

-- 1. Re-add the slug column
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Restore exact pre-migration slug values for all existing products
UPDATE public.products
SET slug = 'potli-bag'
WHERE id = '7a53b690-e0de-42f9-9cf0-72149c4bfcaa';

UPDATE public.products
SET slug = 'tote-bag'
WHERE id = 'b02ec738-a99e-4c02-9cca-21bc1b8f8740';

UPDATE public.products
SET slug = 'morpankh-keychain'
WHERE id = 'f20f80cf-73be-493a-9b7e-b59ccf1ee473';

UPDATE public.products
SET slug = 'marigold-claw-clip'
WHERE id = '99e7dbc4-0b8c-4cb2-bed7-741303a7821e';

-- 3. Set NOT NULL constraint after restoring data
ALTER TABLE public.products
  ALTER COLUMN slug SET NOT NULL;

-- 4. Re-create unique constraint and index on slug
ALTER TABLE public.products
  ADD CONSTRAINT products_slug_key UNIQUE (slug);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
