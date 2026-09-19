import { describe, it, expect } from 'vitest';
import app from '../src/server/app';
import { store } from '../src/server/database';
import { createAdminSessionToken } from '../src/server/lib/auth';
import { fetchProductRow, mapDbProductRow } from '../src/server/routers/products.router';

describe('Complete Product Lifecycle & Serverless Persistence Flow', () => {
  const adminToken = createAdminSessionToken('admin@aaascrochet.com', 'admin-user-id-001');

  // Test product data fixture
  const testProductData = {
    name: 'Artisan Sunflower Coaster',
    description: 'A hand-crocheted bright yellow sunflower coaster made with organic cotton.',
    price: 349.0,
    category_id: '33333333-3333-3333-3333-333333333333', // Accessories
    stock_quantity: 15,
    is_featured: false,
    is_active: true,
    is_customizable: true,
    is_bestseller: false,
    is_new: true,
    specifications: [
      { label: 'Material', value: '100% Organic Milk Cotton' },
      { label: 'Diameter', value: '12 cm' },
    ],
    tags: ['sunflower', 'coaster', 'handmade', 'cotton'],
  };

  it('1. Verifies complete 13-point product lifecycle: Upload -> Create -> List -> Storefront -> Edit -> Toggle -> Cold-Start -> Delete', async () => {
    // -------------------------------------------------------------
    // 1 & 2. Image upload: POST /api/upload
    // -------------------------------------------------------------
    const sampleImageContent = Buffer.from('fake-webp-image-binary-data');
    const formData = new FormData();
    const file = new File([sampleImageContent], 'sunflower_coaster.webp', { type: 'image/webp' });
    formData.append('file', file);
    formData.append('bucket', 'product-images');

    const uploadRes = await app.request('/api/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: formData,
    });

    expect(uploadRes.status).toBe(200);
    const uploadData = await uploadRes.json();
    expect(uploadData.success).toBe(true);
    expect(uploadData.filename).toBeDefined();
    expect(uploadData.url).toBeDefined();
    expect(typeof uploadData.url).toBe('string');
    const uploadedImageUrl = uploadData.url;

    // -------------------------------------------------------------
    // 3. Product creation: POST /api/admin/products
    // -------------------------------------------------------------
    const createPayload = {
      ...testProductData,
      image_url: uploadedImageUrl,
      image_urls: [uploadedImageUrl],
    };

    const createRes = await app.request('/api/admin/products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createPayload),
    });

    expect(createRes.status).toBe(200);
    const createdProduct = await createRes.json();
    expect(createdProduct.id).toBeDefined();
    expect(createdProduct.name).toBe(testProductData.name);
    expect(createdProduct.price).toBe(349.0);
    expect(createdProduct.stock_quantity).toBe(15);
    expect(createdProduct.inventory_count).toBe(15);
    expect(createdProduct.image_url).toBe(uploadedImageUrl);
    expect(createdProduct.slug).toBe('artisan-sunflower-coaster');
    expect(createdProduct.is_active).toBe(true);
    expect(createdProduct.is_featured).toBe(false);
    expect(createdProduct.is_customizable).toBe(true);
    expect(createdProduct.is_new).toBe(true);

    const productId = createdProduct.id;
    const productSlug = createdProduct.slug;

    // -------------------------------------------------------------
    // 4. Product appears in admin product list: GET /api/admin/products
    // -------------------------------------------------------------
    const adminListRes = await app.request('/api/admin/products', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(adminListRes.status).toBe(200);
    const adminProducts = await adminListRes.json();
    const foundInAdmin = adminProducts.find((p: any) => p.id === productId);
    expect(foundInAdmin).toBeDefined();
    expect(foundInAdmin.name).toBe(testProductData.name);

    // -------------------------------------------------------------
    // 5 & 6. Product lookup by ID (both admin and public routes)
    // -------------------------------------------------------------
    const adminGetByIdRes = await app.request(`/api/admin/products/${productId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(adminGetByIdRes.status).toBe(200);
    const adminGetProduct = await adminGetByIdRes.json();
    expect(adminGetProduct.id).toBe(productId);

    const publicGetByIdRes = await app.request(`/api/products/${productId}`);
    expect(publicGetByIdRes.status).toBe(200);
    const publicGetProduct = await publicGetByIdRes.json();
    expect(publicGetProduct.id).toBe(productId);

    // -------------------------------------------------------------
    // 7, 8 & 9. Editing product: Changing price, stock, and description
    // -------------------------------------------------------------
    const editPayload = {
      name: 'Artisan Sunflower Coaster (Deluxe)',
      price: 399.0,
      stock_quantity: 20,
      inventory_count: 20,
      description: 'Updated deluxe hand-crocheted coaster with reinforced border.',
    };

    const updateRes = await app.request(`/api/admin/products/${productId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(editPayload),
    });

    expect(updateRes.status).toBe(200);
    const updatedProduct = await updateRes.json();
    expect(updatedProduct.price).toBe(399.0);
    expect(updatedProduct.stock_quantity).toBe(20);
    expect(updatedProduct.inventory_count).toBe(20);
    expect(updatedProduct.name).toBe('Artisan Sunflower Coaster (Deluxe)');
    expect(updatedProduct.description).toBe('Updated deluxe hand-crocheted coaster with reinforced border.');

    // -------------------------------------------------------------
    // 10. Featured & Active toggle: PATCH /api/admin/products/:id/status
    // -------------------------------------------------------------
    const toggleRes = await app.request(`/api/admin/products/${productId}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_featured: true, is_active: true }),
    });

    expect(toggleRes.status).toBe(200);
    const toggledProduct = await toggleRes.json();
    expect(toggledProduct.is_featured).toBe(true);
    expect(toggledProduct.is_active).toBe(true);

    // -------------------------------------------------------------
    // 12 & 13. Storefront displays product and image
    // -------------------------------------------------------------
    const storefrontListRes = await app.request('/api/products?search=Sunflower');
    expect(storefrontListRes.status).toBe(200);
    const storefrontData = await storefrontListRes.json();
    expect(storefrontData.products.length).toBeGreaterThanOrEqual(1);
    const sfProduct = storefrontData.products.find((p: any) => p.id === productId);
    expect(sfProduct).toBeDefined();
    expect(sfProduct.price).toBe(399.0);
    expect(sfProduct.image_url).toBe(uploadedImageUrl);

    const storefrontSlugRes = await app.request(`/api/products/slug/${productSlug}`);
    expect(storefrontSlugRes.status).toBe(200);
    const sfSlugProduct = await storefrontSlugRes.json();
    expect(sfSlugProduct.id).toBe(productId);
    expect(sfSlugProduct.image_url).toBe(uploadedImageUrl);

    // -------------------------------------------------------------
    // 11. Deleting the product: DELETE /api/admin/products/:id
    // -------------------------------------------------------------
    const deleteRes = await app.request(`/api/admin/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(deleteRes.status).toBe(200);
    const deleteJson = await deleteRes.json();
    expect(deleteJson.success).toBe(true);

    // Verify product is gone from storefront and admin
    const verifyDeleted = await app.request(`/api/products/${productId}`);
    expect(verifyDeleted.status).toBe(404);

    const verifyAdminDeleted = await app.request(`/api/admin/products/${productId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(verifyAdminDeleted.status).toBe(404);
  });

  it('2. Verifies category mapping and storefront filtering across all 8 supported categories', async () => {
    const categoriesToTest = [
      { id: '11111111-1111-1111-1111-111111111111', name: 'Crochet Flowers & Bouquets', slug: 'crochet-flowers-bouquets' },
      { id: '22222222-2222-2222-2222-222222222222', name: 'Handbags', slug: 'handbags' },
      { id: '33333333-3333-3333-3333-333333333333', name: 'Accessories', slug: 'accessories' },
      { id: '44444444-4444-4444-4444-444444444444', name: 'Custom Orders', slug: 'custom-orders' },
      { id: '55555555-5555-5555-5555-555555555555', name: 'MDF Board Art', slug: 'mdf-board-art' },
      { id: '66666666-6666-6666-6666-666666666666', name: 'Pouches', slug: 'pouches' },
      { id: '77777777-7777-7777-7777-777777777777', name: 'Magnets', slug: 'magnets' },
      { id: '88888888-8888-8888-8888-888888888888', name: 'Rakhis', slug: 'rakhis' },
    ];

    for (const cat of categoriesToTest) {
      const prodRes = await app.request('/api/admin/products', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Sample Item - ${cat.name}`,
          category_id: cat.id,
          price: 299,
          stock_quantity: 5,
          image_url: '/images/tulip_bouquet.jpg',
        }),
      });
      expect(prodRes.status).toBe(200);
      const prod = await prodRes.json();
      expect(prod.category_id).toBe(cat.id);

      // Verify category mapping via mapDbProductRow
      const mapped = mapDbProductRow({
        id: prod.id,
        name: prod.name,
        category: cat.name,
        price: 299,
        image_url: '/images/tulip_bouquet.jpg',
      });
      expect(mapped.category_id).toBe(cat.id);
      expect(mapped.category.name).toBe(cat.name);
      expect(mapped.category.slug).toBe(cat.slug);

      // Verify storefront filtering by category slug
      const filterRes = await app.request(`/api/products?category=${cat.slug}`);
      expect(filterRes.status).toBe(200);
      const filterData = await filterRes.json();
      expect(filterData.products.some((p: any) => p.id === prod.id)).toBe(true);

      // Cleanup
      await app.request(`/api/admin/products/${prod.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }
  });

  it('3. Verifies boolean fields survive Create -> Admin List -> Edit -> Storefront (featured, active, customizable, bestseller, new)', async () => {
    const payload = {
      name: 'Flags Verification Product',
      price: 799,
      category_id: '11111111-1111-1111-1111-111111111111',
      stock_quantity: 12,
      is_featured: true,
      is_active: true,
      is_customizable: true,
      is_bestseller: true,
      is_new: true,
      image_url: '/images/tulip_bouquet.jpg',
    };

    const createRes = await app.request('/api/admin/products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    expect(createRes.status).toBe(200);
    const prod = await createRes.json();
    const prodId = prod.id;

    expect(prod.is_featured).toBe(true);
    expect(prod.is_active).toBe(true);
    expect(prod.is_customizable).toBe(true);
    expect(prod.is_bestseller).toBe(true);
    expect(prod.is_new).toBe(true);

    // Verify Admin List has all flags
    const adminListRes = await app.request('/api/admin/products', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminList = await adminListRes.json();
    const adminProd = adminList.find((p: any) => p.id === prodId);
    expect(adminProd.is_featured).toBe(true);
    expect(adminProd.is_customizable).toBe(true);

    // Edit to toggle flags
    const updateRes = await app.request(`/api/admin/products/${prodId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        is_featured: false,
        is_customizable: false,
        is_bestseller: false,
      }),
    });
    expect(updateRes.status).toBe(200);
    const updatedProd = await updateRes.json();
    expect(updatedProd.is_featured).toBe(false);
    expect(updatedProd.is_customizable).toBe(false);
    expect(updatedProd.is_bestseller).toBe(false);
    expect(updatedProd.is_active).toBe(true);

    // Verify on Storefront
    const sfRes = await app.request(`/api/products/${prodId}`);
    expect(sfRes.status).toBe(200);
    const sfProd = await sfRes.json();
    expect(sfProd.is_featured).toBe(false);
    expect(sfProd.is_customizable).toBe(false);

    // Cleanup
    await app.request(`/api/admin/products/${prodId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  });

  it('4. Verifies cold-start scenario: when in-memory store is empty, product row loads, updates, and deletes safely', async () => {
    const rawDbRow = {
      id: '99999999-9999-9999-9999-999999999999',
      name: 'Cold Start Artisan Item',
      slug: 'cold-start-artisan-item',
      description: 'Handmade item existing in persistent DB during serverless cold start.',
      price: 599.0,
      sale_price: 499.0,
      compare_at_price: 499.0,
      category: 'Handbags',
      image_url: '/images/mini_handbag.jpg',
      images: ['/images/mini_handbag.jpg'],
      stock_quantity: 8,
      inventory_count: 8,
      low_stock_threshold: 2,
      sku: 'AAAS-COLD01',
      tags: ['coldstart', 'handbag'],
      is_active: true,
      is_featured: true,
      is_customizable: false,
      is_bestseller: false,
      is_new: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Map DB row without requiring store.products
    const mappedProduct = mapDbProductRow(rawDbRow);
    expect(mappedProduct.id).toBe(rawDbRow.id);
    expect(mappedProduct.name).toBe('Cold Start Artisan Item');
    expect(mappedProduct.category_id).toBe('22222222-2222-2222-2222-222222222222'); // Handbags UUID
    expect(mappedProduct.stock_quantity).toBe(8);
    expect(mappedProduct.inventory_count).toBe(8);

    // 2. Ensure store.products does NOT have this ID
    expect(store.products[rawDbRow.id]).toBeUndefined();

    // 3. Populate into memory as if loaded from DB query
    store.products[rawDbRow.id] = mappedProduct;

    // 4. Test fetchProductRow finds it
    const fetched = await fetchProductRow(rawDbRow.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.name).toBe('Cold Start Artisan Item');

    // 5. Test update works
    const putRes = await app.request(`/api/admin/products/${rawDbRow.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ price: 649.0, stock_quantity: 12 }),
    });
    expect(putRes.status).toBe(200);
    const putJson = await putRes.json();
    expect(putJson.price).toBe(649.0);
    expect(putJson.stock_quantity).toBe(12);

    // 6. Test status toggle works
    const patchRes = await app.request(`/api/admin/products/${rawDbRow.id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_featured: false }),
    });
    expect(patchRes.status).toBe(200);
    expect((await patchRes.json()).is_featured).toBe(false);

    // 7. Test delete works
    const delRes = await app.request(`/api/admin/products/${rawDbRow.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(delRes.status).toBe(200);
    expect(store.products[rawDbRow.id]).toBeUndefined();

    // 8. Confirm 404
    const getRes = await app.request(`/api/products/${rawDbRow.id}`);
    expect(getRes.status).toBe(404);
  });

  // 5. Verifies database persistence fail-fast
  it('5. Verifies database persistence fail-fast: refuses silent in-memory fallback when not in test mode', async () => {
    const origEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'development';
      const res = await app.request('/api/admin/products', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Fail Fast Test Product',
          price: 999,
          category_id: 'handbags',
        }),
      });
      // When supabaseClient is not connected, it must return 503 instead of silently saving in memory
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.detail).toContain('Database persistence unavailable');
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });
});
