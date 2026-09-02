-- Migration: Remove Amazon ASIN column from products table
ALTER TABLE products DROP COLUMN IF EXISTS amazon_asin;
