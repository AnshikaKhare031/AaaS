-- Rollback Migration: 202610140000_simplify_products_schema_rollback.sql
-- Description: Completely restores dropped columns AND their exact pre-migration data
-- Data Source: supabase/products_backup_before_simplification.json

-- ============================================================================
-- STEP A: Re-add the 16 dropped columns with original data types and defaults
-- ============================================================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id UUID,
  ADD COLUMN IF NOT EXISTS sale_price NUMERIC,
  ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC,
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inventory_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS material TEXT DEFAULT '100% Premium Milk Cotton & Natural Wood Accents',
  ADD COLUMN IF NOT EXISTS care_instructions TEXT DEFAULT 'Gently spot clean with cold water and mild detergent. Lay flat to air dry. Do not machine wash or tumble dry.',
  ADD COLUMN IF NOT EXISTS shipping_information TEXT DEFAULT 'Lovingly packaged and dispatched within 2-4 business days. Standard delivery across India in 4-7 business days.',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_new BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_customizable BOOLEAN NOT NULL DEFAULT false;

-- ============================================================================
-- STEP B: Restore the exact pre-migration values for existing product records
-- ============================================================================

-- Product 1: "Potli Bag"
UPDATE public.products
SET
  category_id = NULL,
  sale_price = NULL,
  compare_at_price = NULL,
  stock_quantity = 10,
  inventory_count = 10,
  low_stock_threshold = 3,
  sku = 'AAAS-7A53B6',
  material = '100% Premium Milk Cotton Yarn',
  care_instructions = 'Spot clean gently with cold water. Air dry flat.',
  shipping_information = 'Dispatched in 2-4 business days.',
  tags = '{}'::text[],
  specifications = '[]'::jsonb,
  is_featured = true,
  is_bestseller = false,
  is_new = false,
  is_customizable = true,
  category = 'Handbags'
WHERE id = '7a53b690-e0de-42f9-9cf0-72149c4bfcaa';

-- Product 2: "Tote Bag"
UPDATE public.products
SET
  category_id = NULL,
  sale_price = NULL,
  compare_at_price = NULL,
  stock_quantity = 10,
  inventory_count = 10,
  low_stock_threshold = 3,
  sku = NULL,
  material = '100% Premium Milk Cotton & Natural Wood Accents',
  care_instructions = 'Gently spot clean with cold water and mild detergent. Lay flat to air dry. Do not machine wash or tumble dry.',
  shipping_information = 'Lovingly packaged and dispatched within 2-4 business days. Standard delivery across India in 4-7 business days.',
  tags = '{}'::text[],
  specifications = '[]'::jsonb,
  is_featured = false,
  is_bestseller = false,
  is_new = false,
  is_customizable = true,
  category = 'handbags'
WHERE id = 'b02ec738-a99e-4c02-9cca-21bc1b8f8740';
