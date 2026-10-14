-- Migration: 202610140000_simplify_products_schema.sql
-- Description: Safely simplify public.products table to minimum viable attributes
-- Retains: id, name, slug, description, price, category, image_url, images, created_at, updated_at, is_active
-- Drops: 16 obsolete/unneeded columns
-- Note: images column remains untouched (retains TEXT[] NOT NULL constraint)

-- 1. Standardize existing records to canonical Title Case categories
UPDATE public.products
SET category = 'Handbags'
WHERE LOWER(TRIM(category)) = 'handbags';

UPDATE public.products
SET category = 'Keychains'
WHERE LOWER(TRIM(category)) = 'keychains';

UPDATE public.products
SET category = 'Accessories'
WHERE LOWER(TRIM(category)) = 'accessories';

-- 2. Drop 16 obsolete/unneeded columns
ALTER TABLE public.products
  DROP COLUMN IF EXISTS category_id,
  DROP COLUMN IF EXISTS sale_price,
  DROP COLUMN IF EXISTS compare_at_price,
  DROP COLUMN IF EXISTS stock_quantity,
  DROP COLUMN IF EXISTS inventory_count,
  DROP COLUMN IF EXISTS low_stock_threshold,
  DROP COLUMN IF EXISTS sku,
  DROP COLUMN IF EXISTS material,
  DROP COLUMN IF EXISTS care_instructions,
  DROP COLUMN IF EXISTS shipping_information,
  DROP COLUMN IF EXISTS tags,
  DROP COLUMN IF EXISTS specifications,
  DROP COLUMN IF EXISTS is_featured,
  DROP COLUMN IF EXISTS is_bestseller,
  DROP COLUMN IF EXISTS is_new,
  DROP COLUMN IF EXISTS is_customizable;

-- 3. Slug uniqueness: verified that products_slug_key already exists on public.products(slug)
-- (No redundant constraint or index added)
