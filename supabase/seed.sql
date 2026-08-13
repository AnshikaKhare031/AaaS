-- ==========================================================
-- AaaS Handmade Crochet - Supabase Seed Data
-- ==========================================================

-- 1. SEED DEFAULT CATEGORIES
INSERT INTO public.categories (id, name, slug, description, image_url, is_active, display_order)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Crochet Flowers & Bouquets', 'crochet-flowers-bouquets', 'Everlasting handcrafted botanical stems, bouquets and floral arrangements made with soft cotton yarn.', '/images/tulip_bouquet.jpg', true, 1),
    ('22222222-2222-2222-2222-222222222222', 'Handbags', 'handbags', 'Chic artisan totes, crossbody bags, and mini clutches handcrafted with chunky textured yarn.', '/images/mini_handbag.jpg', true, 2),
    ('33333333-3333-3333-3333-333333333333', 'Accessories', 'accessories', 'Delicate everyday crochet accessories: keychains, scrunchies, coasters, floral clips, and pouches.', '/images/flower_coaster.jpg', true, 3),
    ('44444444-4444-4444-4444-444444444444', 'Custom Orders', 'custom-orders', 'Personalized bespoke crochet creations tailored to your chosen palette, size, and design vision.', '/images/custom_banner.jpg', true, 4)
ON CONFLICT (slug) DO NOTHING;

-- 2. SEED ADMIN SETTINGS
INSERT INTO public.admin_settings (id, store_name, store_email, store_phone, fixed_shipping_fee, free_shipping_threshold, enable_free_shipping, low_stock_threshold, currency, currency_symbol, instagram_url, is_store_open)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'AaaS - Handmade Crochet',
    'hello@aaascrochet.com',
    '+91 98765 43210',
    99.00,
    1499.00,
    true,
    3,
    'INR',
    '₹',
    'https://instagram.com/aaas_crochet',
    true
)
ON CONFLICT (id) DO NOTHING;

-- 3. SEED PRODUCTS
INSERT INTO public.products (id, category_id, name, slug, description, price, sale_price, stock_quantity, low_stock_threshold, material, care_instructions, shipping_information, tags, is_active, is_featured, is_bestseller, is_new)
VALUES
    (
        'p1111111-1111-1111-1111-111111111111',
        '11111111-1111-1111-1111-111111111111',
        'Crochet Tulip Bouquet',
        'crochet-tulip-bouquet',
        'An enchanting bouquet of handcrafted crochet tulips in delicate shades of soft blush, warm ivory, and gentle peach. Each bloom is individually crocheted from premium milk cotton yarn with flexible wire-reinforced stems, wrapped in eco-conscious kraft paper with an antique gold ribbon tie. A timeless gift that never withers.',
        999.00,
        899.00,
        12,
        3,
        '100% Premium Milk Cotton Yarn, Floral Craft Wire, Kraft Wrap, Satin Ribbon',
        'Keep away from direct moisture. Gently dust with a soft brush or hairdryer on cool setting. Re-shape petals gently with clean hands.',
        'Ships in a sturdy protective presentation gift box within 2-3 business days across India.',
        ARRAY['tulips', 'bouquet', 'flowers', 'gift', 'bestseller'],
        true,
        true,
        true,
        true
    ),
    (
        'p2222222-2222-2222-2222-222222222222',
        '22222222-2222-2222-2222-222222222222',
        'Crochet Mini Handbag',
        'crochet-mini-handbag',
        'Crafted for modern elegance, this chunky-knit artisan handbag features a warm ivory and taupe weave, sturdy structured bamboo top handles, and a soft cotton interior. Perfectly sized to hold your essentials—phone, keys, compact wallet, and lip balm—while adding a warm, handcrafted statement to any outfit.',
        1499.00,
        1299.00,
        8,
        2,
        'Organic Chunky Cotton Yarn, Natural Bamboo Ring Handles, Magnetic Snap Clasp',
        'Spot clean with mild detergent and cold damp cloth. Air dry flat. Do not submerge bamboo handles in water.',
        'Comes with a protective breathable cotton dustbag. Dispatched in 2-4 business days.',
        ARRAY['handbag', 'tote', 'bamboo', 'luxury', 'chic'],
        true,
        true,
        true,
        true
    ),
    (
        'p3333333-3333-3333-3333-333333333333',
        '11111111-1111-1111-1111-111111111111',
        'Crochet Daisy Bouquet',
        'crochet-daisy-bouquet',
        'A cheerful yet elegant arrangement of bright white crochet daisies with golden textured sunburst centers and delicate sage green foliage. Lovingly tied with an organic linen ribbon, this bouquet brings warm, sunny craftsmanship into any room.',
        999.00,
        NULL,
        15,
        3,
        '100% Soft Cotton Blend, Bendable Stem Wire, Natural Linen Tie',
        'Dust gently with soft cloth. Avoid soaking. Stems can be bent to fit various vase heights.',
        'Delivered in gift-ready aesthetic packaging with a personalized handwritten note card.',
        ARRAY['daisy', 'flowers', 'sage', 'gift', 'nature'],
        true,
        true,
        false,
        true
    ),
    (
        'p4444444-4444-4444-4444-444444444444',
        '33333333-3333-3333-3333-333333333333',
        'Crochet Flower Coaster Set',
        'crochet-flower-coaster',
        'Set of 4 artisan botanical coasters handcrafted in harmonious tones of sage green, ivory cream, and warm taupe. Thick, heat-resistant, and absorbent, these coasters protect your tabletops while bringing warmth and organic beauty to your coffee and tea rituals.',
        250.00,
        299.00,
        25,
        5,
        '100% Natural Absorbent Milk Cotton Yarn',
        'Hand wash in cold water with gentle soap. Lay flat on towel to dry. Warm iron over cloth if needed.',
        'Packaged neatly with craft paper belly-band. Dispatched within 24-48 hours.',
        ARRAY['coasters', 'home decor', 'accessories', 'tableware', 'botanical'],
        true,
        false,
        true,
        false
    ),
    (
        'p5555555-5555-5555-5555-555555555555',
        '33333333-3333-3333-3333-333333333333',
        'Crochet Keychain & Charm Set',
        'crochet-keychain-charm-set',
        'An adorable trio of mini handcrafted accessories: a sweet crochet strawberry charm, a soft peach keyring, and a delicate floral scrunchie. Finished with durable antique gold metal lobster clasps to clip effortlessly onto bags, keys, or pouches.',
        199.00,
        249.00,
        30,
        5,
        'Mercerized Cotton Thread, Hypoallergenic Polyester Fill, Antique Gold Alloy Hardware',
        'Wipe hardware with dry microfiber cloth. Spot clean crochet surface gently.',
        'Ships in a cute pillow box with AaaS gold wax seal aesthetic.',
        ARRAY['keychain', 'accessories', 'charms', 'strawberry', 'scrunchie'],
        true,
        false,
        true,
        true
    ),
    (
        'p6666666-6666-6666-6666-666666666666',
        '44444444-4444-4444-4444-444444444444',
        'Bespoke Personalized Crochet Piece',
        'bespoke-custom-crochet-piece',
        'Have a dream crochet design in mind? Collaborate directly with our master artisan to create custom bridal bouquets, heirloom baby blankets, bespoke color-matched handbags, or unique decor pieces. Price starts as a base deposit and adjusts according to your requirements.',
        1499.00,
        NULL,
        99,
        5,
        'Custom Selected Premium Organic Yarns (Cotton, Bamboo, or Merino Wool)',
        'Detailed custom care guide provided with each bespoke finished order.',
        'Made-to-order craft timeline: 7 to 14 days handcrafted production + standard dispatch.',
        ARRAY['custom', 'bespoke', 'personalized', 'artisan', 'special'],
        true,
        true,
        false,
        true
    )
ON CONFLICT (slug) DO NOTHING;

-- 4. SEED PRODUCT IMAGES
INSERT INTO public.product_images (product_id, image_url, alt_text, display_order)
VALUES
    ('p1111111-1111-1111-1111-111111111111', '/images/tulip_bouquet.jpg', 'Handmade Crochet Tulip Bouquet in Pastel Tones', 1),
    ('p1111111-1111-1111-1111-111111111111', '/images/hero_lifestyle.jpg', 'Crochet Bouquet Lifestyle Editorial', 2),
    ('p2222222-2222-2222-2222-222222222222', '/images/mini_handbag.jpg', 'Handmade Chunky Knit Crochet Handbag with Bamboo Handles', 1),
    ('p2222222-2222-2222-2222-222222222222', '/images/hero_lifestyle.jpg', 'Crochet Handbag Lifestyle Shot', 2),
    ('p3333333-3333-3333-3333-333333333333', '/images/daisy_bouquet.jpg', 'Handcrafted Crochet Daisy and Wildflower Bouquet', 1),
    ('p3333333-3333-3333-3333-333333333333', '/images/artisan_hands.jpg', 'Crochet Craftsmanship in Progress', 2),
    ('p4444444-4444-4444-4444-444444444444', '/images/flower_coaster.jpg', 'Set of 4 Handmade Floral Blossom Coasters', 1),
    ('p5555555-5555-5555-5555-555555555555', '/images/keychain_charms.jpg', 'Handmade Mini Crochet Accessories & Keychains', 1),
    ('p6666666-6666-6666-6666-666666666666', '/images/custom_banner.jpg', 'Bespoke Custom Order Flatlay & Yarn Skeins', 1)
ON CONFLICT DO NOTHING;

-- 5. SEED SAMPLE REVIEWS
INSERT INTO public.reviews (product_id, customer_name, rating, comment, is_approved)
VALUES
    ('p1111111-1111-1111-1111-111111111111', 'Ananya S.', 5, 'The tulip bouquet is beyond breathtaking! The stitches are so uniform and delicate. It looks so elegant on my bedside console.', true),
    ('p1111111-1111-1111-1111-111111111111', 'Meera Kapoor', 5, 'Ordered this for my sister’s anniversary. She literally cried happy tears. The packaging with the gold ribbon was perfection.', true),
    ('p2222222-2222-2222-2222-222222222222', 'Rhea Sharma', 5, 'Such a luxury piece! The bamboo handles and chunky knit texture feel very high-end. I get compliments everywhere I go.', true),
    ('p4444444-4444-4444-4444-444444444444', 'Pooja V.', 5, 'Thick, absorbent and so pretty! These coasters transformed my morning tea ritual. Highly recommend!', true)
ON CONFLICT DO NOTHING;
