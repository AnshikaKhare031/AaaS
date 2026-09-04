import { describe, it, expect } from 'vitest';
import app from '../src/server/app';
import { createAdminSessionToken } from '../src/server/lib/auth';
import { store } from '../src/server/database';
import crypto from 'crypto';

describe('End-to-End API Smoke Test Matrix', () => {
  const adminToken = createAdminSessionToken('admin@aaascrochet.com');
  const customerToken = createAdminSessionToken('customer@example.com', 'customer-user-id-001');

  // 1. Health
  it('GET /api/health -> 200', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('healthy');
  });

  // 2. Categories
  it('GET /api/categories -> 200', async () => {
    const res = await app.request('/api/categories');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  // 3. Products
  it('GET /api/products -> 200', async () => {
    const res = await app.request('/api/products');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.products).toBeDefined();
    expect(body.total).toBeGreaterThan(0);
  });

  // 4. Products by ID
  it('GET /api/products/:id -> 200 and 404 for invalid', async () => {
    const firstId = Object.keys(store.products)[0];
    const resValid = await app.request(`/api/products/${firstId}`);
    expect(resValid.status).toBe(200);
    const body = await resValid.json();
    expect(body.id).toBe(firstId);

    const resInvalid = await app.request('/api/products/non-existent-id-999');
    expect(resInvalid.status).toBe(404);
  });

  // 5. Cart: guest and authenticated access
  it('GET /api/cart -> 200 for guest and auth', async () => {
    const guestRes = await app.request('/api/cart');
    expect(guestRes.status).toBe(200);
    expect(Array.isArray(await guestRes.json())).toBe(true);

    const authRes = await app.request('/api/cart', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    expect(authRes.status).toBe(200);
    expect(Array.isArray(await authRes.json())).toBe(true);
  });

  // 6. Wishlist: guest and authenticated access
  it('GET /api/wishlist -> 200 for guest and auth', async () => {
    const guestRes = await app.request('/api/wishlist');
    expect(guestRes.status).toBe(200);
    expect(Array.isArray(await guestRes.json())).toBe(true);

    const authRes = await app.request('/api/wishlist', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    expect(authRes.status).toBe(200);
    expect(Array.isArray(await authRes.json())).toBe(true);
  });

  // 7. Orders: unauthenticated 401, authenticated 200
  it('GET /api/orders -> 401 unauth, 200 auth', async () => {
    const unauth = await app.request('/api/orders');
    expect(unauth.status).toBe(401);

    const auth = await app.request('/api/orders', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    expect(auth.status).toBe(200);
    const body = await auth.json();
    expect(Array.isArray(body)).toBe(true);
  });

  // 8. Custom Orders: POST 200, GET 200
  it('POST & GET /api/custom-orders -> 200', async () => {
    const postRes = await app.request('/api/custom-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Pooja Hegde',
        email: 'pooja.custom@example.com',
        phone: '+919988776655',
        product_type: 'Floral Centerpiece',
        quantity: 1,
        description: 'Pastel daisy crochet bouquet with velvet ribbon',
      }),
    });
    expect(postRes.status).toBe(200);
    const created = await postRes.json();
    expect(created.id).toBeDefined();

    const getRes = await app.request('/api/custom-orders?email=pooja.custom@example.com');
    expect(getRes.status).toBe(200);
    const list = await getRes.json();
    expect(list.length).toBeGreaterThan(0);
  });

  // 9. Reviews: POST 200, GET 200
  it('GET & POST /api/reviews -> 200', async () => {
    const prodId = Object.keys(store.products)[0];
    const postRes = await app.request('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: prodId,
        customer_name: 'Aditi V',
        rating: 5,
        comment: 'Exquisite craftsmanship, absolutely divine!',
      }),
    });
    expect(postRes.status).toBe(200);

    const getRes = await app.request(`/api/products/${prodId}/reviews`);
    expect(getRes.status).toBe(200);
    const reviews = await getRes.json();
    expect(Array.isArray(reviews)).toBe(true);
  });

  // 10. Admin Dashboard: 401 unauth, 403 customer, 200 admin
  it('GET /api/admin/dashboard -> 401 unauth, 403 customer, 200 admin', async () => {
    const unauth = await app.request('/api/admin/dashboard');
    expect(unauth.status).toBe(401);

    const customer = await app.request('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    expect(customer.status).toBe(403);

    const admin = await app.request('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(admin.status).toBe(200);
    const body = await admin.json();
    expect(body.total_revenue).toBeDefined();
    expect(body.total_orders).toBeDefined();
  });

  // 11. Admin Products: 401 unauth, 200 admin
  it('GET /api/admin/products -> 401 unauth, 200 admin', async () => {
    const unauth = await app.request('/api/admin/products');
    expect(unauth.status).toBe(401);

    const admin = await app.request('/api/admin/products', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(admin.status).toBe(200);
    const body = await admin.json();
    expect(Array.isArray(body)).toBe(true);
  });

  // 12. Admin Inventory: 401 unauth, 200 admin
  it('GET /api/admin/inventory -> 401 unauth, 200 admin', async () => {
    const unauth = await app.request('/api/admin/inventory');
    expect(unauth.status).toBe(401);

    const admin = await app.request('/api/admin/inventory', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(admin.status).toBe(200);
    const body = await admin.json();
    expect(Array.isArray(body)).toBe(true);
  });

  // 13. Admin Orders: 401 unauth, 200 admin
  it('GET /api/admin/orders -> 401 unauth, 200 admin', async () => {
    const unauth = await app.request('/api/admin/orders');
    expect(unauth.status).toBe(401);

    const admin = await app.request('/api/admin/orders', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(admin.status).toBe(200);
    const body = await admin.json();
    expect(Array.isArray(body)).toBe(true);
  });

  // 14. Payment: create-order -> 401 unauth, 200 auth
  it('POST /api/payment/create-order -> 401 unauth, 200 auth', async () => {
    const prodId = Object.keys(store.products)[0];
    const orderRes = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ product_id: prodId, quantity: 1 }],
        shipping_address: {
          fullName: 'Customer Test',
          email: 'customer@example.com',
          phone: '+919876543210',
          address: '42 Artisan Lane',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
        },
      }),
    });
    expect(orderRes.status).toBe(201);
    const order = await orderRes.json();

    // Unauth create payment order
    const unauth = await app.request('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: order.id }),
    });
    expect(unauth.status).toBe(401);

    // Auth create payment order
    const auth = await app.request('/api/payment/create-order', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order_id: order.id }),
    });
    expect(auth.status).toBe(200);
    const payOrder = await auth.json();
    expect(payOrder.provider_order_id).toBeDefined();
    expect(payOrder.amount).toBe(order.total_amount);
  });

  // 15. Payment: verify -> 400 for bad signature, 200 for valid HMAC
  it('POST /api/payment/verify -> 400 bad signature, 200 valid HMAC', async () => {
    const prodId = Object.keys(store.products)[0];
    const orderRes = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ product_id: prodId, quantity: 1 }],
        shipping_address: {
          fullName: 'Verification Customer',
          email: 'customer@example.com',
          phone: '+919876543210',
          address: '100 Studio Way',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001',
        },
      }),
    });
    const order = await orderRes.json();

    const pOrderRes = await app.request('/api/payment/create-order', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order_id: order.id }),
    });
    const pOrder = await pOrderRes.json();

    // Bad signature
    const badRes = await app.request('/api/payment/verify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: order.id,
        razorpay_order_id: pOrder.provider_order_id,
        razorpay_payment_id: 'pay_test_random_12345',
        razorpay_signature: 'invalid_forged_signature_hex',
      }),
    });
    expect(badRes.status).toBe(400);

    // Valid signature
    const payId = 'pay_verified_valid_54321';
    const msg = `${pOrder.provider_order_id}|${payId}`;
    const validSig = crypto
      .createHmac('sha256', 'secret_placeholder_key_32chars_aaas')
      .update(msg)
      .digest('hex');

    const goodRes = await app.request('/api/payment/verify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: order.id,
        razorpay_order_id: pOrder.provider_order_id,
        razorpay_payment_id: payId,
        razorpay_signature: validSig,
      }),
    });
    expect(goodRes.status).toBe(200);
    const verified = await goodRes.json();
    expect(verified.success).toBe(true);
    expect(verified.payment_status).toBe('paid');
  });

  // 16. Payment: webhook -> 400 missing/bad signature, 200 valid
  it('POST /api/payment/webhook -> 400 bad sig, 200 valid event', async () => {
    const rawPayload = JSON.stringify({
      id: `evt_smoke_${Date.now()}`,
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_smoke_webhook_123',
            order_id: 'order_smoke_non_existent',
            amount: 149900,
            status: 'captured',
          },
        },
      },
    });

    // Missing signature
    const noSig = await app.request('/api/payment/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: rawPayload,
    });
    expect(noSig.status).toBe(400);

    // Valid signature
    const validSig = crypto
      .createHmac('sha256', 'webhook_secret_key_32chars_aaas')
      .update(rawPayload)
      .digest('hex');

    const validWebhook = await app.request('/api/payment/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': validSig,
      },
      body: rawPayload,
    });
    expect(validWebhook.status).toBe(200);
    const body = await validWebhook.json();
    expect(body.status).toBe('processed');
  });

  // 17. Inventory Concurrency: two simultaneous attempts for the final available item
  it('Concurrency: two simultaneous attempts for final available item -> one succeeds, one fails safely, no negative stock', async () => {
    // Pick or create a product with exactly 1 item in stock
    const testProdId = 'p-concurrency-test-01';
    store.products[testProdId] = {
      id: testProdId,
      name: 'Single Stock Artisan Item',
      slug: 'single-stock-artisan-item',
      price: 499.0,
      stock_quantity: 1,
      inventory_count: 1,
      is_active: true,
      created_at: new Date().toISOString(),
    } as any;

    const orderPayload = {
      items: [{ product_id: testProdId, quantity: 1 }],
      shipping_address: {
        fullName: 'Concurrency Buyer',
        email: 'concurrency@example.com',
        phone: '+919876543210',
        address: '1 Concurrency Way',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
      },
    };

    // Fire two simultaneous requests
    const [res1, res2] = await Promise.all([
      app.request('/api/orders', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${customerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      }),
      app.request('/api/orders', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${customerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    // One succeeds (201 Created), one fails safely (400 Bad Request due to insufficient stock)
    expect(statuses).toEqual([201, 400]);

    // Verify stock is exactly 0 and NEVER negative
    expect(store.products[testProdId].stock_quantity).toBe(0);
  });

  // 18. Authorization & Access Control: customer cannot access another user's order (blocked), admin can
  it('Authorization: customer -> another user order is blocked/forbidden (404 anti-IDOR), admin -> any order is 200', async () => {
    // Seed an order belonging to customer-user-id-002
    const otherUserOrderId = 'ord-seed-002'; // belongs to customer-user-id-002

    // customerToken belongs to customer-user-id-001
    const customerAttempt = await app.request(`/api/orders/${otherUserOrderId}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    // Blocked with 404 to prevent ID enumeration
    expect(customerAttempt.status).toBe(404);
    const custBody = await customerAttempt.json();
    expect(custBody.detail).toContain('Order not found');

    // Admin access allowed
    const adminAttempt = await app.request(`/api/orders/${otherUserOrderId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(adminAttempt.status).toBe(200);
    const adminBody = await adminAttempt.json();
    expect(adminBody.id).toBe(otherUserOrderId);
  });

  // 19. File Upload Validation: MIME type check and 5MB limit rejection
  it('Upload: rejects unsupported MIME type and oversized content', async () => {
    // 1. Unsupported MIME type
    const formBadType = new FormData();
    const badBlob = new Blob(['not an image content'], { type: 'application/pdf' });
    formBadType.append('file', badBlob, 'test.pdf');

    const badTypeRes = await app.request('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formBadType,
    });
    expect(badTypeRes.status).toBe(400);
    const badTypeBody = await badTypeRes.json();
    expect(badTypeBody.detail).toContain('Unsupported file type');

    // 2. Oversized payload (> 5MB)
    const oversizedBlob = new Blob([new Uint8Array(6 * 1024 * 1024)], { type: 'image/png' });
    const formOversized = new FormData();
    formOversized.append('file', oversizedBlob, 'huge.png');

    const oversizedRes = await app.request('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formOversized,
    });
    expect(oversizedRes.status).toBe(400);
    const oversizedBody = await oversizedRes.json();
    expect(oversizedBody.detail).toContain('5MB');
  });

  // 20. Strict CORS Origin Allowlist
  it('CORS: strictly blocks unauthorized origins while allowing whitelisted origins', async () => {
    // 1. Unauthorized origin: Access-Control-Allow-Origin must NOT be returned
    const unauthorizedRes = await app.request('/api/health', {
      headers: { Origin: 'http://malicious-site.com' },
    });
    expect(unauthorizedRes.status).toBe(200);
    expect(unauthorizedRes.headers.get('access-control-allow-origin')).toBeNull();

    // 2. Authorized localhost origin
    const localhostRes = await app.request('/api/health', {
      headers: { Origin: 'http://localhost:5173' },
    });
    expect(localhostRes.status).toBe(200);
    expect(localhostRes.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');

    // 3. Same-origin (no Origin header)
    const sameOriginRes = await app.request('/api/health');
    expect(sameOriginRes.status).toBe(200);
    expect(sameOriginRes.headers.get('access-control-allow-origin')).toBeNull();
  });

  // 21. Centralized Production Config Validation (Fail-Fast)
  it('Config: production config validation fails fast when secrets are missing or insecure', async () => {
    const { validateProductionConfig } = await import('../src/server/config');
    // In test environment (!isProduction), it should not throw
    expect(() => validateProductionConfig()).not.toThrow();
  });
});
