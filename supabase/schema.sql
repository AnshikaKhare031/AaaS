-- ==========================================================
-- AaaS Handmade Crochet - Supabase PostgreSQL Schema
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to auto-create profile on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Valued Customer'),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    sale_price NUMERIC(10, 2) CHECK (sale_price IS NULL OR sale_price >= 0),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_threshold INT NOT NULL DEFAULT 3 CHECK (low_stock_threshold >= 0),
    material TEXT DEFAULT '100% Premium Milk Cotton & Natural Wood Accents',
    care_instructions TEXT DEFAULT 'Gently spot clean with cold water and mild detergent. Lay flat to air dry. Do not machine wash or tumble dry.',
    shipping_information TEXT DEFAULT 'Lovingly packaged and dispatched within 2-4 business days. Standard delivery across India in 4-7 business days.',
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_bestseller BOOLEAN NOT NULL DEFAULT false,
    is_new BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. WISHLISTS & ITEMS
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(wishlist_id, product_id)
);

-- 6. CART ITEMS (For authenticated user persistent cart)
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- 7. ADDRESSES
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 8. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    order_number TEXT UNIQUE NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    shipping_name TEXT NOT NULL,
    shipping_email TEXT NOT NULL,
    shipping_phone TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_city TEXT NOT NULL,
    shipping_state TEXT NOT NULL,
    shipping_pincode TEXT NOT NULL,
    shipping_country TEXT NOT NULL DEFAULT 'India',
    tracking_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_image TEXT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0)
);

-- 10. PAYMENTS (Razorpay transactions)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    razorpay_order_id TEXT NOT NULL,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'authorized', 'captured', 'failed', 'refunded')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. CUSTOM ORDERS
CREATE TABLE IF NOT EXISTS public.custom_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    product_type TEXT NOT NULL,
    category TEXT,
    color_preference TEXT,
    size_dimensions TEXT,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    budget NUMERIC(10, 2),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'accepted', 'in_production', 'completed', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. CUSTOM ORDER IMAGES
CREATE TABLE IF NOT EXISTS public.custom_order_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_order_id UUID NOT NULL REFERENCES public.custom_orders(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    is_approved BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. ADMIN SETTINGS
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_name TEXT NOT NULL DEFAULT 'AaaS - Handmade Crochet',
    store_email TEXT NOT NULL DEFAULT 'hello@aaascrochet.com',
    store_phone TEXT NOT NULL DEFAULT '+91 98765 43210',
    fixed_shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 99.00,
    free_shipping_threshold NUMERIC(10, 2) NOT NULL DEFAULT 1499.00,
    enable_free_shipping BOOLEAN NOT NULL DEFAULT true,
    low_stock_threshold INT NOT NULL DEFAULT 3,
    currency TEXT NOT NULL DEFAULT 'INR',
    currency_symbol TEXT NOT NULL DEFAULT '₹',
    instagram_url TEXT NOT NULL DEFAULT 'https://instagram.com/aaas_crochet',
    is_store_open BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_order_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins full access on profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Categories policies
CREATE POLICY "Anyone can view active categories" ON public.categories FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL USING (public.is_admin());

-- Products & Images policies
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins manage products" ON public.products FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can view product images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Admins manage product images" ON public.product_images FOR ALL USING (public.is_admin());

-- Wishlist policies
CREATE POLICY "Users manage own wishlist" ON public.wishlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own wishlist items" ON public.wishlist_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.wishlists WHERE id = wishlist_items.wishlist_id AND user_id = auth.uid())
);

-- Cart policies
CREATE POLICY "Users manage own cart items" ON public.cart_items FOR ALL USING (auth.uid() = user_id);

-- Addresses policies
CREATE POLICY "Users manage own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id);

-- Orders & Items policies
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Admins manage orders" ON public.orders FOR ALL USING (public.is_admin());

CREATE POLICY "Users view own order items" ON public.order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND (user_id = auth.uid() OR public.is_admin()))
);
CREATE POLICY "Users insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage order items" ON public.order_items FOR ALL USING (public.is_admin());

-- Payments policies
CREATE POLICY "Users view own payment record" ON public.payments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = payments.order_id AND (user_id = auth.uid() OR public.is_admin()))
);
CREATE POLICY "Admins manage payments" ON public.payments FOR ALL USING (public.is_admin());

-- Custom orders policies
CREATE POLICY "Users create custom orders" ON public.custom_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own custom orders" ON public.custom_orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins manage custom orders" ON public.custom_orders FOR ALL USING (public.is_admin());

CREATE POLICY "Users upload custom order images" ON public.custom_order_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own custom order images" ON public.custom_order_images FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.custom_orders WHERE id = custom_order_images.custom_order_id AND (user_id = auth.uid() OR public.is_admin()))
);
CREATE POLICY "Admins manage custom order images" ON public.custom_order_images FOR ALL USING (public.is_admin());

-- Reviews policies
CREATE POLICY "Anyone can view approved reviews" ON public.reviews FOR SELECT USING (is_approved = true OR public.is_admin());
CREATE POLICY "Authenticated users submit reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL USING (public.is_admin());

-- Admin settings policies
CREATE POLICY "Anyone can read store settings" ON public.admin_settings FOR SELECT USING (true);
CREATE POLICY "Admins modify store settings" ON public.admin_settings FOR ALL USING (public.is_admin());
