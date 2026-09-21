-- ==========================================================
-- Migration: Restructure AaaS to Simple CraftyMinds-like Database Architecture (FIXED)
-- Ordering Guarantee:
-- 1. Enable extensions
-- 2. Ensure base tables exist
-- 3. Add ALL missing columns across tables BEFORE any index, constraint, or backfill
-- 4. Backfill existing relational data into flattened columns / JSONB
-- 5. Drop obsolete tables
-- 6. Create indexes safely (all referenced columns guaranteed to exist)
-- 7. Functions and auth triggers
-- 8. Row Level Security policies
-- ==========================================================

-- ----------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------
-- 2. BASE TABLES (IF NOT EXISTS)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
    total NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    payment_status TEXT NOT NULL DEFAULT 'pending',
    order_status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_image TEXT,
    quantity INT NOT NULL CHECK (quantity > 0)
);

CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'India',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    provider VARCHAR(50) DEFAULT 'razorpay',
    payload JSONB NOT NULL,
    order_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'processed',
    error_message TEXT,
    processed_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------
-- 3. ENSURE ALL MISSING COLUMNS EXIST (BEFORE ANY INDEX OR BACKFILL)
-- ----------------------------------------------------------

-- 3A. Products columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'category') THEN
        ALTER TABLE public.products ADD COLUMN category TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'image_url') THEN
        ALTER TABLE public.products ADD COLUMN image_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'images') THEN
        ALTER TABLE public.products ADD COLUMN images TEXT[] NOT NULL DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'compare_at_price') THEN
        ALTER TABLE public.products ADD COLUMN compare_at_price NUMERIC(10, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'sale_price') THEN
        ALTER TABLE public.products ADD COLUMN sale_price NUMERIC(10, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'inventory_count') THEN
        ALTER TABLE public.products ADD COLUMN inventory_count INT NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'stock_quantity') THEN
        ALTER TABLE public.products ADD COLUMN stock_quantity INT NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'low_stock_threshold') THEN
        ALTER TABLE public.products ADD COLUMN low_stock_threshold INT NOT NULL DEFAULT 3;
    END IF;
    -- Fix: Ensure sku exists on existing products table before any index references it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'sku') THEN
        ALTER TABLE public.products ADD COLUMN sku TEXT UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'tags') THEN
        ALTER TABLE public.products ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'specifications') THEN
        ALTER TABLE public.products ADD COLUMN specifications JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'material') THEN
        ALTER TABLE public.products ADD COLUMN material TEXT DEFAULT '100% Premium Milk Cotton & Natural Wood Accents';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'care_instructions') THEN
        ALTER TABLE public.products ADD COLUMN care_instructions TEXT DEFAULT 'Gently spot clean with cold water and mild detergent. Lay flat to air dry. Do not machine wash or tumble dry.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'shipping_information') THEN
        ALTER TABLE public.products ADD COLUMN shipping_information TEXT DEFAULT 'Lovingly packaged and dispatched within 2-4 business days. Standard delivery across India in 4-7 business days.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'is_active') THEN
        ALTER TABLE public.products ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'is_featured') THEN
        ALTER TABLE public.products ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'is_bestseller') THEN
        ALTER TABLE public.products ADD COLUMN is_bestseller BOOLEAN NOT NULL DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'is_new') THEN
        ALTER TABLE public.products ADD COLUMN is_new BOOLEAN NOT NULL DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'is_customizable') THEN
        ALTER TABLE public.products ADD COLUMN is_customizable BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- 3B. Orders columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'items') THEN
        ALTER TABLE public.orders ADD COLUMN items JSONB NOT NULL DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_id') THEN
        ALTER TABLE public.orders ADD COLUMN customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_name') THEN
        ALTER TABLE public.orders ADD COLUMN customer_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_email') THEN
        ALTER TABLE public.orders ADD COLUMN customer_email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_phone') THEN
        ALTER TABLE public.orders ADD COLUMN customer_phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'discount_amount') THEN
        ALTER TABLE public.orders ADD COLUMN discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'total_amount') THEN
        ALTER TABLE public.orders ADD COLUMN total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_method') THEN
        ALTER TABLE public.orders ADD COLUMN payment_method TEXT DEFAULT 'razorpay';
    END IF;
    -- Fix: Ensure payment_id exists on orders table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_id') THEN
        ALTER TABLE public.orders ADD COLUMN payment_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'provider_order_id') THEN
        ALTER TABLE public.orders ADD COLUMN provider_order_id VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'provider_payment_id') THEN
        ALTER TABLE public.orders ADD COLUMN provider_payment_id VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_confirmation_sent_at') THEN
        ALTER TABLE public.orders ADD COLUMN payment_confirmation_sent_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'status') THEN
        ALTER TABLE public.orders ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'carrier_name') THEN
        ALTER TABLE public.orders ADD COLUMN carrier_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'tracking_number') THEN
        ALTER TABLE public.orders ADD COLUMN tracking_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'notes') THEN
        ALTER TABLE public.orders ADD COLUMN notes TEXT;
    END IF;
END $$;

-- 3C. Order items columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'unit_price') THEN
        ALTER TABLE public.order_items ADD COLUMN unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0;
    END IF;
    -- Fix: Ensure price and total alias columns exist on order_items before referencing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'price') THEN
        ALTER TABLE public.order_items ADD COLUMN price NUMERIC(10, 2) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'subtotal') THEN
        ALTER TABLE public.order_items ADD COLUMN subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'total') THEN
        ALTER TABLE public.order_items ADD COLUMN total NUMERIC(10, 2) NOT NULL DEFAULT 0;
    END IF;
END $$;

-- 3D. Addresses columns
DO $$
BEGIN
    -- Fix: Ensure updated_at exists on addresses table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'addresses' AND column_name = 'updated_at') THEN
        ALTER TABLE public.addresses ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;
END $$;

-- ----------------------------------------------------------
-- 4. DATA MIGRATION & BACKFILLS (SAFE CONDITIONAL CHECKS)
-- ----------------------------------------------------------

-- 4A. Backfill category from categories table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'category_id') THEN
            UPDATE public.products p
            SET category = c.name
            FROM public.categories c
            WHERE p.category_id = c.id AND (p.category IS NULL OR p.category = '');
        END IF;
    END IF;
END $$;

-- 4B. Backfill image_url and images[] from product_images table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_images') THEN
        -- Primary image
        UPDATE public.products p
        SET image_url = pi.image_url
        FROM (
            SELECT DISTINCT ON (product_id) product_id, image_url
            FROM public.product_images
            ORDER BY product_id, display_order ASC
        ) pi
        WHERE p.id = pi.product_id AND (p.image_url IS NULL OR p.image_url = '');

        -- Image array
        UPDATE public.products p
        SET images = arr.img_list
        FROM (
            SELECT product_id, array_agg(image_url ORDER BY display_order ASC) AS img_list
            FROM public.product_images
            GROUP BY product_id
        ) arr
        WHERE p.id = arr.product_id AND (p.images IS NULL OR array_length(p.images, 1) IS NULL);
    END IF;
END $$;

-- 4C. Fallback image values for products without images
UPDATE public.products
SET image_url = '/images/tulip_bouquet.jpg'
WHERE image_url IS NULL OR image_url = '';

UPDATE public.products
SET images = ARRAY[image_url]
WHERE images IS NULL OR array_length(images, 1) IS NULL;

-- 4D. Synchronize inventory_count and stock_quantity
UPDATE public.products
SET inventory_count = stock_quantity
WHERE inventory_count = 0 AND stock_quantity > 0;

-- 4E. Drop foreign key constraint on category_id if present
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_schema = 'public' AND table_name = 'products' AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%category%'
    ) LOOP
        EXECUTE 'ALTER TABLE public.products DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- 4F. Backfill existing order_items into orders.items JSONB
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
        UPDATE public.orders o
        SET items = item_agg.agg
        FROM (
            SELECT order_id, jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'product_id', product_id,
                    'product_name', product_name,
                    'product_image', product_image,
                    'quantity', quantity,
                    'unit_price', COALESCE(unit_price, price, 0),
                    'subtotal', COALESCE(subtotal, total, 0)
                )
            ) AS agg
            FROM public.order_items
            GROUP BY order_id
        ) item_agg
        WHERE o.id = item_agg.order_id AND (o.items IS NULL OR o.items = '[]'::jsonb);
    END IF;
END $$;

-- 4G. Synchronize order alias fields
UPDATE public.orders
SET 
    total_amount = total,
    status = order_status,
    customer_id = COALESCE(customer_id, user_id)
WHERE total_amount = 0 AND total > 0;

-- 4H. Synchronize order_items alias fields safely
UPDATE public.order_items
SET price = unit_price, total = subtotal
WHERE price = 0 AND unit_price > 0;

UPDATE public.order_items
SET unit_price = price, subtotal = total
WHERE unit_price = 0 AND price > 0;

-- ----------------------------------------------------------
-- 5. REMOVE OBSOLETE TABLES
-- ----------------------------------------------------------
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.wishlist_items CASCADE;
DROP TABLE IF EXISTS public.wishlists CASCADE;
DROP TABLE IF EXISTS public.custom_order_images CASCADE;
DROP TABLE IF EXISTS public.custom_orders CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.admin_settings CASCADE;
DROP TABLE IF EXISTS public.product_images CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- ----------------------------------------------------------
-- 6. CREATE INDEXES (ALL COLUMNS GUARANTEED TO EXIST)
-- ----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_provider_order_id ON public.orders(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_order_id ON public.webhook_events(order_id);

-- ----------------------------------------------------------
-- 7. FUNCTIONS & TRIGGERS
-- ----------------------------------------------------------
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Clean existing policies before recreating
DO $$
BEGIN
    -- Profiles policies
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Admins full access on profiles" ON public.profiles;

    -- Products policies
    DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
    DROP POLICY IF EXISTS "Admins manage products" ON public.products;

    -- Orders policies
    DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
    DROP POLICY IF EXISTS "Users create orders" ON public.orders;
    DROP POLICY IF EXISTS "Admins manage orders" ON public.orders;

    -- Order items policies
    DROP POLICY IF EXISTS "Users view own order items" ON public.order_items;
    DROP POLICY IF EXISTS "Users insert order items" ON public.order_items;
    DROP POLICY IF EXISTS "Admins manage order items" ON public.order_items;

    -- Addresses policies
    DROP POLICY IF EXISTS "Users manage own addresses" ON public.addresses;
    DROP POLICY IF EXISTS "Admins view all addresses" ON public.addresses;

    -- Webhook events policies
    DROP POLICY IF EXISTS "Admins can view webhook event audits" ON public.webhook_events;
END $$;

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins full access on profiles" ON public.profiles
    FOR ALL USING (public.is_admin());

-- Products
CREATE POLICY "Anyone can view active products" ON public.products
    FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins manage products" ON public.products
    FOR ALL USING (public.is_admin());

-- Orders
CREATE POLICY "Users view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Admins manage orders" ON public.orders
    FOR ALL USING (public.is_admin());

-- Order items
CREATE POLICY "Users view own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE id = order_items.order_id 
              AND (user_id = auth.uid() OR public.is_admin())
        )
    );
CREATE POLICY "Users insert order items" ON public.order_items
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage order items" ON public.order_items
    FOR ALL USING (public.is_admin());

-- Addresses
CREATE POLICY "Users manage own addresses" ON public.addresses
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins view all addresses" ON public.addresses
    FOR SELECT USING (public.is_admin());

-- Webhook Events (Admin audit only; backend uses service-role)
CREATE POLICY "Admins can view webhook event audits" ON public.webhook_events
    FOR SELECT TO authenticated USING (public.is_admin());
