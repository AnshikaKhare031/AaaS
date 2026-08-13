-- ==========================================================
-- AaaS Handmade Crochet - Supabase Storage Buckets & Policies
-- ==========================================================

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('product-images', 'product-images', true),
    ('category-images', 'category-images', true),
    ('custom-order-images', 'custom-order-images', false),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies for product-images (Public read, Admin write)
CREATE POLICY "Public Read Product Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admin Upload Product Images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND (public.is_admin() OR auth.role() = 'service_role'));

CREATE POLICY "Admin Delete Product Images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND (public.is_admin() OR auth.role() = 'service_role'));

-- 3. Storage Policies for category-images (Public read, Admin write)
CREATE POLICY "Public Read Category Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'category-images');

CREATE POLICY "Admin Upload Category Images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'category-images' AND (public.is_admin() OR auth.role() = 'service_role'));

-- 4. Storage Policies for custom-order-images (User upload, User & Admin read)
CREATE POLICY "Users and Admins Read Custom Order Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'custom-order-images' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin() OR auth.role() = 'service_role'));

CREATE POLICY "Users Upload Custom Order Images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'custom-order-images' AND (auth.role() = 'authenticated' OR auth.role() = 'anon'));

-- 5. Storage Policies for avatars (Public read, Owner update)
CREATE POLICY "Public Read Avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users Upload Own Avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
