const { newDb } = require('pg-mem');
const fs = require('fs');

async function testFixedDDL() {
  console.log('--- Initializing pg-mem PostgreSQL simulator for DDL & Schema validation ---');
  const db = newDb({ noAstCoverageCheck: true });

  db.public.none('CREATE SCHEMA IF NOT EXISTS auth;');
  db.public.none('CREATE TABLE IF NOT EXISTS auth.users (id UUID PRIMARY KEY, email TEXT);');
  
  // Insert 5 auth users matching live Supabase
  db.public.none(`
    INSERT INTO auth.users (id, email) VALUES
    ('2ce58e58-ec4c-41fe-aeeb-4e5773fcda93', 'admin1@aaas.com'),
    ('e6476597-621b-42c9-a883-52b263f16f30', 'admin2@aaas.com'),
    ('a12a7529-7f91-4b6f-b27e-23028ac182d4', 'cust1@aaas.com'),
    ('7d0b9cff-84e7-425d-a796-3bc64a0d614d', 'cust2@aaas.com'),
    ('36154132-32b7-44f7-95f1-1823337fabdb', 'cust3@aaas.com');
  `);

  // Setup exact live baseline before migration:
  // 1. Profiles with 5 records
  db.public.none(`
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      full_name TEXT,
      email TEXT UNIQUE,
      phone TEXT,
      avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    INSERT INTO public.profiles (id, full_name, email, role) VALUES
    ('2ce58e58-ec4c-41fe-aeeb-4e5773fcda93', 'Admin One', 'admin1@aaas.com', 'admin'),
    ('e6476597-621b-42c9-a883-52b263f16f30', 'Admin Two', 'admin2@aaas.com', 'admin'),
    ('a12a7529-7f91-4b6f-b27e-23028ac182d4', 'Customer One', 'cust1@aaas.com', 'customer'),
    ('7d0b9cff-84e7-425d-a796-3bc64a0d614d', 'Customer Two', 'cust2@aaas.com', 'customer'),
    ('36154132-32b7-44f7-95f1-1823337fabdb', 'Customer Three', 'cust3@aaas.com', 'customer');
  `);

  // 2. Old products table (WITHOUT sku, WITHOUT category text, WITH category_id)
  db.public.none(`
    CREATE TABLE public.categories (id UUID PRIMARY KEY, name TEXT, slug TEXT);
    CREATE TABLE public.products (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      price NUMERIC(10, 2) NOT NULL,
      sale_price NUMERIC(10, 2),
      category_id UUID REFERENCES public.categories(id),
      stock_quantity INT NOT NULL DEFAULT 0,
      low_stock_threshold INT NOT NULL DEFAULT 3,
      tags TEXT[] DEFAULT '{}',
      material TEXT,
      care_instructions TEXT,
      shipping_information TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      is_featured BOOLEAN NOT NULL DEFAULT false,
      is_bestseller BOOLEAN NOT NULL DEFAULT false,
      is_new BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // 3. Old orders table (WITHOUT items JSONB, WITHOUT customer_id, WITHOUT payment_id)
  db.public.none(`
    CREATE TABLE public.orders (
      id UUID PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      user_id UUID REFERENCES public.profiles(id),
      shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
      shipping_name TEXT,
      shipping_email TEXT,
      shipping_phone TEXT,
      shipping_city TEXT,
      shipping_state TEXT,
      shipping_pincode TEXT,
      shipping_country TEXT DEFAULT 'India',
      subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
      shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
      total NUMERIC(10, 2) NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'INR',
      payment_status TEXT NOT NULL DEFAULT 'pending',
      order_status TEXT NOT NULL DEFAULT 'pending',
      tracking_number TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // 4. Old order_items (WITHOUT price, WITHOUT total aliases)
  db.public.none(`
    CREATE TABLE public.order_items (
      id UUID PRIMARY KEY,
      order_id UUID NOT NULL REFERENCES public.orders(id),
      product_id UUID REFERENCES public.products(id),
      product_name TEXT NOT NULL,
      product_image TEXT,
      unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
      quantity INT NOT NULL,
      subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0
    );
  `);

  // 5. Old addresses (WITHOUT updated_at)
  db.public.none(`
    CREATE TABLE public.addresses (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES public.profiles(id),
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
  `);

  // 6. Old obsolete tables
  db.public.none(`
    CREATE TABLE public.product_images (id UUID PRIMARY KEY, product_id UUID, image_url TEXT, display_order INT);
    CREATE TABLE public.cart_items (id UUID PRIMARY KEY);
    CREATE TABLE public.wishlists (id UUID PRIMARY KEY);
    CREATE TABLE public.wishlist_items (id UUID PRIMARY KEY);
    CREATE TABLE public.payments (id UUID PRIMARY KEY, order_id UUID, amount NUMERIC, currency TEXT);
    CREATE TABLE public.custom_orders (id UUID PRIMARY KEY);
    CREATE TABLE public.custom_order_images (id UUID PRIMARY KEY);
    CREATE TABLE public.reviews (id UUID PRIMARY KEY);
    CREATE TABLE public.admin_settings (id UUID PRIMARY KEY);
  `);

  console.log('✓ Baseline simulated database initialized successfully.');

  // Run the sequence of DDL statements from the fixed migration
  function runMigrationSequence(iteration) {
    console.log(`--- Executing Migration Sequence Iteration ${iteration} ---`);
    
    // 1. Create webhook_events
    db.public.none(`
      CREATE TABLE IF NOT EXISTS public.webhook_events (
        id UUID PRIMARY KEY,
        event_id VARCHAR(255) NOT NULL UNIQUE,
        event_type VARCHAR(100) NOT NULL,
        provider VARCHAR(50) DEFAULT 'razorpay',
        payload JSONB NOT NULL,
        order_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'processed',
        error_message TEXT,
        processed_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // 2. Add columns to products
    const prodColsToAdd = [
      { name: 'category', type: 'TEXT' },
      { name: 'image_url', type: 'TEXT' },
      { name: 'images', type: "TEXT[] NOT NULL DEFAULT '{}'" },
      { name: 'compare_at_price', type: 'NUMERIC(10, 2)' },
      { name: 'sale_price', type: 'NUMERIC(10, 2)' },
      { name: 'inventory_count', type: 'INT NOT NULL DEFAULT 0' },
      { name: 'stock_quantity', type: 'INT NOT NULL DEFAULT 0' },
      { name: 'low_stock_threshold', type: 'INT NOT NULL DEFAULT 3' },
      { name: 'sku', type: 'TEXT UNIQUE' },
      { name: 'tags', type: "TEXT[] DEFAULT '{}'" },
      { name: 'specifications', type: "JSONB DEFAULT '[]'::jsonb" },
      { name: 'material', type: "TEXT DEFAULT '100% Cotton'" },
      { name: 'care_instructions', type: "TEXT DEFAULT 'Spot clean'" },
      { name: 'shipping_information', type: "TEXT DEFAULT 'Standard delivery'" },
      { name: 'is_active', type: 'BOOLEAN NOT NULL DEFAULT true' },
      { name: 'is_featured', type: 'BOOLEAN NOT NULL DEFAULT false' },
      { name: 'is_bestseller', type: 'BOOLEAN NOT NULL DEFAULT false' },
      { name: 'is_new', type: 'BOOLEAN NOT NULL DEFAULT false' },
      { name: 'is_customizable', type: 'BOOLEAN NOT NULL DEFAULT false' },
    ];

    for (const c of prodColsToAdd) {
      const exists = db.public.many(`SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = '${c.name}';`).length > 0;
      if (!exists) {
        db.public.none(`ALTER TABLE public.products ADD COLUMN ${c.name} ${c.type};`);
      }
    }

    // 3. Add columns to orders
    const ordColsToAdd = [
      { name: 'items', type: "JSONB NOT NULL DEFAULT '[]'::jsonb" },
      { name: 'customer_id', type: 'UUID' },
      { name: 'customer_name', type: 'TEXT' },
      { name: 'customer_email', type: 'TEXT' },
      { name: 'customer_phone', type: 'TEXT' },
      { name: 'discount_amount', type: 'NUMERIC(10, 2) NOT NULL DEFAULT 0' },
      { name: 'total_amount', type: 'NUMERIC(10, 2) NOT NULL DEFAULT 0' },
      { name: 'payment_method', type: "TEXT DEFAULT 'razorpay'" },
      { name: 'payment_id', type: 'TEXT' },
      { name: 'provider_order_id', type: 'VARCHAR(255)' },
      { name: 'provider_payment_id', type: 'VARCHAR(255)' },
      { name: 'payment_confirmation_sent_at', type: 'TIMESTAMPTZ' },
      { name: 'status', type: "TEXT DEFAULT 'pending'" },
      { name: 'carrier_name', type: 'TEXT' },
      { name: 'tracking_number', type: 'TEXT' },
      { name: 'notes', type: 'TEXT' },
    ];

    for (const c of ordColsToAdd) {
      const exists = db.public.many(`SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = '${c.name}';`).length > 0;
      if (!exists) {
        db.public.none(`ALTER TABLE public.orders ADD COLUMN ${c.name} ${c.type};`);
      }
    }

    // 4. Add columns to order_items
    const itemColsToAdd = [
      { name: 'unit_price', type: 'NUMERIC(10, 2) NOT NULL DEFAULT 0' },
      { name: 'price', type: 'NUMERIC(10, 2) NOT NULL DEFAULT 0' },
      { name: 'subtotal', type: 'NUMERIC(10, 2) NOT NULL DEFAULT 0' },
      { name: 'total', type: 'NUMERIC(10, 2) NOT NULL DEFAULT 0' },
    ];

    for (const c of itemColsToAdd) {
      const exists = db.public.many(`SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = '${c.name}';`).length > 0;
      if (!exists) {
        db.public.none(`ALTER TABLE public.order_items ADD COLUMN ${c.name} ${c.type};`);
      }
    }

    // 5. Add columns to addresses
    const addrColsToAdd = [
      { name: 'updated_at', type: 'TIMESTAMPTZ NOT NULL DEFAULT now()' },
    ];

    for (const c of addrColsToAdd) {
      const exists = db.public.many(`SELECT 1 FROM information_schema.columns WHERE table_name = 'addresses' AND column_name = '${c.name}';`).length > 0;
      if (!exists) {
        db.public.none(`ALTER TABLE public.addresses ADD COLUMN ${c.name} ${c.type};`);
      }
    }

    // 6. Drop obsolete tables
    const tablesToDrop = [
      'cart_items', 'wishlist_items', 'wishlists', 'custom_order_images', 'custom_orders',
      'reviews', 'payments', 'admin_settings', 'product_images', 'categories'
    ];
    for (const t of tablesToDrop) {
      db.public.none(`DROP TABLE IF EXISTS public.${t} CASCADE;`);
    }

    // 7. Create indexes (NOW SKU EXISTS! NO ERROR!)
    db.public.none(`CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);`);
    db.public.none(`CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);`);
    db.public.none(`CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);`);
    db.public.none(`CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);`);
    db.public.none(`CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);`);

    db.public.none(`CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);`);
    db.public.none(`CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);`);
    db.public.none(`CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);`);
    db.public.none(`CREATE INDEX IF NOT EXISTS idx_orders_provider_order_id ON public.orders(provider_order_id);`);
    db.public.none(`CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);`);
    db.public.none(`CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);`);
    db.public.none(`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);`);

    db.public.none(`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);`);
    db.public.none(`CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);`);

    db.public.none(`CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);`);

    db.public.none(`CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events(event_id);`);
    db.public.none(`CREATE INDEX IF NOT EXISTS idx_webhook_events_order_id ON public.webhook_events(order_id);`);

    // 8. Drop obsolete phone column from public.profiles
    db.public.none(`ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone;`);

    console.log(`✓ Iteration ${iteration} completed successfully without errors!`);
  }

  // Run 1
  runMigrationSequence(1);

  // Verify profiles preserved
  const p1 = db.public.many('SELECT id, role FROM public.profiles;');
  if (p1.length !== 5) throw new Error('Expected 5 profiles, got ' + p1.length);
  console.log('✓ Profiles preserved: 5 profiles remain intact');

  // Verify phone column dropped from public.profiles
  const phoneCol = db.public.many("SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone';");
  if (phoneCol.length > 0) throw new Error('Column phone was not dropped from public.profiles');
  console.log('✓ Column profiles.phone successfully dropped and verified absent');

  // Verify sku index and column
  const prodSkuCol = db.public.many("SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sku';");
  if (prodSkuCol.length === 0) throw new Error('Column sku missing from products');
  console.log('✓ Column products.sku verified to exist');

  // Run 2 (Idempotency)
  runMigrationSequence(2);

  // Verify profiles still preserved
  const p2 = db.public.many('SELECT id, role FROM public.profiles;');
  if (p2.length !== 5) throw new Error('Expected 5 profiles after Run 2, got ' + p2.length);
  console.log('✓ Idempotency verified: Run 2 succeeded with zero errors, 5 profiles intact');

  // Run seed-products.sql
  console.log('--- Testing seed-products.sql ---');
  const seedSql = fs.readFileSync('D:/AaaS/supabase/seed-products.sql', 'utf8');
  db.public.none(seedSql);
  const prods = db.public.many('SELECT id, name, sku, price, category FROM public.products;');
  if (prods.length !== 6) throw new Error('Expected 6 products, got ' + prods.length);
  console.log('✓ seed-products.sql successfully inserted 6 products');

  // Run seed-products.sql a second time
  db.public.none(seedSql);
  const prods2 = db.public.many('SELECT id, name, sku, price, category FROM public.products;');
  if (prods2.length !== 6) throw new Error('Expected 6 products after duplicate run, got ' + prods2.length);
  console.log('✓ seed-products.sql idempotency verified: exactly 6 products, 0 duplicates');

  console.log('\n=== ALL DDL & SEED CHECKS PASSED WITH 100% SUCCESS ===');
}

testFixedDDL().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
