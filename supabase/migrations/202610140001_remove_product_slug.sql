-- Migration: 202610140001_remove_product_slug.sql
-- Description: Safely remove slug column and associated constraints/indexes from public.products
-- Canonical Identifier: public.products.id (UUID primary key)
-- Application Status: All product routing, queries, mutations, links, and schemas migrated to ID

-- 1. Drop existing unique constraint on slug if present
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_slug_key;

-- 2. Drop existing index on slug if present
DROP INDEX IF EXISTS public.idx_products_slug;

-- 3. Drop the slug column from public.products
ALTER TABLE public.products
  DROP COLUMN IF EXISTS slug CASCADE;
