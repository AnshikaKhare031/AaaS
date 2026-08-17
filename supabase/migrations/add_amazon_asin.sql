-- Migration: Add Amazon ASIN column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS amazon_asin text;
