import { describe, it, expect, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import app from '../src/server/app';
import { settings } from '../src/server/config';
import { store } from '../src/server/database';
import { paymentService } from '../src/server/services/payment.service';

describe('AaaS E-Commerce Integration Test Suite', () => {
  const adminToken = jwt.sign(
    { sub: 'admin-user-id-001', email: 'admin@aaascrochet.com', aud: 'authenticated' },
    settings.SUPABASE_JWT_SECRET,
    { algorithm: 'HS256' }
  );
  const customerToken = jwt.sign(
    { sub: 'customer-user-id-001', email: 'customer@aaascrochet.com', aud: 'authenticated' },
    settings.SUPABASE_JWT_SECRET,
    { algorithm: 'HS256' }
  );
  const customerToken2 = jwt.sign(
    { sub: 'customer-user-id-002', email: 'other@aaascrochet.com', aud: 'authenticated' },
    settings.SUPABASE_JWT_SECRET,
    { algorithm: 'HS256' }
  );
  const forgedToken = jwt.sign(
    { sub: 'hacker-user', email: 'hacker@evil.com', aud: 'authenticated' },
    'wrong-secret-key-12345',
    { algorithm: 'HS256' }
  );

  beforeEach(() => {
    store.seedDefaults();
  });

  // 1. Health check
  it('1. Health Check: OK', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('healthy');
  });

  // 2. Categories
  it('2. Categories API: OK (Found 4 core categories)', async () => {
    const res = await app.request('/api/categories');
    expect(res.status).toBe(200);
    const categories = await res.json();
    expect(categories.length).toBeGreaterThanOrEqual(4);
    const slugs = categories.map((c: any) => c.slug);
    expect(slugs).toContain('crochet-flowers-bouquets');
    expect(slugs).toContain('accessories');
    expect(slugs).toContain('handbags');
    expect(slugs).toContain('custom-orders');
  });

  // 3. Products Search
  it('3. Products Search: OK (Found Tulip bouquet)', async () => {
    const res = await app.request('/api/products?search=tulip');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.products.length).toBeGreaterThanOrEqual(1);
    expect(data.products[0].name).toContain('Tulip');
  });

  // 4. Product Details
  it('4. Product Details API: OK', async () => {
    const searchRes = await app.request('/api/products?search=tulip');
    const searchData = await searchRes.json();
    const tulipSlug = searchData.products[0].slug;

    const res = await app.request(`/api/products/slug/${tulipSlug}`);
    expect(res.status).toBe(200);
    const prod = await res.json();
    expect(prod.name).toBe('Crochet Tulip Bouquet');
    expect(prod.price).toBe(999.0);
  });

  // 5. Custom Order Submission
  it('5. Custom Order Request: OK', async () => {
    const customPayload = {
      name: 'Priya Patel',
      email: 'priya@example.com',
      phone: '+91 91234 56789',
      product_type: 'Bespoke Bridal Bouquet',
      category: 'Crochet Flowers & Bouquets',
      color_preference: 'Ivory and Sage Green',
      size_dimensions: 'Medium bouquet (12 stems)',
      quantity: 1,
      budget: 2500,
      description: 'A bridal bouquet for an intimate winter wedding with blush roses and lavender sprigs.',
    };

    const res = await app.request('/api/custom-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customPayload),
    });
    expect(res.status).toBe(200);
    const customOrder = await res.json();
    expect(customOrder.status).toBe('new');
    expect(customOrder.request_id).toBeDefined();
  });

  // 6. Security Gate: 401 for missing/forged token, 403 for non-admin token
  it('6. Security Gate: 401/403 verified', async () => {
    const resNoAuth = await app.request('/api/admin/dashboard');
    expect(resNoAuth.status).toBe(401);

    const resForged = await app.request('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${forgedToken}` },
    });
    expect(resForged.status).toBe(401);

    const resCustomer = await app.request('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    expect(resCustomer.status).toBe(403);
  });

  // 7. Admin Inventory Listing
  it('7. Admin Inventory Listing: OK', async () => {
    const res = await app.request('/api/admin/inventory', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const inv = await res.json();
    expect(inv.length).toBeGreaterThanOrEqual(6);
  });

  // 8. Admin Stock Adjustment
  it('8. Admin Stock Adjustment: OK', async () => {
    const tulipId = 'p1111111-1111-1111-1111-111111111111';
    const initialStock = store.products[tulipId].stock_quantity;

    const res = await app.request(`/api/admin/inventory/${tulipId}/adjust`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ delta: 5, reason: 'Restocked new batch' }),
    });
    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.stock_quantity).toBe(initialStock + 5);
  });

  // 9. Admin Dashboard Metrics
  it('9. Admin Dashboard Metrics: OK', async () => {
    const res = await app.request('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const metrics = await res.json();
    expect(metrics.total_products).toBeDefined();
    expect(metrics.low_stock_count).toBeDefined();
    expect(metrics.custom_order_count).toBeDefined();
    expect(metrics.pending_reviews_count).toBeDefined();
    expect(metrics.total_products).toBeGreaterThanOrEqual(6);
  });

  // 10. Admin Settings
  it('10. Admin Settings: OK (INR / ?)', async () => {
    const res = await app.request('/api/admin/settings');
    expect(res.status).toBe(200);
    const settingsData = await res.json();
    expect(settingsData.currency).toBe('INR');
    expect(settingsData.currency_symbol).toBe('?');
  });

  // 11. Order Creation & Server Pricing
  it('11. Order Creation & Server Pricing: OK', async () => {
    const tulipId = 'p1111111-1111-1111-1111-111111111111';
    const initialStock = store.products[tulipId].stock_quantity;

    const orderPayload = {
      items: [{ product_id: tulipId, quantity: 2 }],
      shipping_address: {
        fullName: 'Priya Sharma',
        email: 'customer@aaascrochet.com',
        phone: '+91 98765 43210',
        address: '123 Artisan Lane',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302001',
      },
      discount_amount: 100.0,
      shipping_fee: 999.0, // Client attempts to send arbitrary shipping fee; server must compute real fee!
    };

    const res = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    expect(res.status).toBe(201);
    const createdOrder = await res.json();
    expect(createdOrder.user_id).toBe('customer-user-id-001');
    expect(createdOrder.items.length).toBe(1);
    expect(createdOrder.items[0].quantity).toBe(2);
    expect(createdOrder.items[0].unit_price).toBe(899.0);
    expect(createdOrder.items[0].subtotal).toBe(1798.0);
    // Subtotal is 1798 >= 1499 threshold -> free shipping fee = 0! (Server overrides client's 999.0)
    expect(createdOrder.shipping_fee).toBe(0.0);
    // Total = 1798 - 100 discount + 0 shipping = 1698.0
    expect(createdOrder.total_amount).toBe(1698.0);
    expect(createdOrder.status).toBe('pending');

    // Verify stock reservation
    const stockAfter = store.products[tulipId].stock_quantity;
    expect(stockAfter).toBe(initialStock - 2);
  });

  // 12. Stock Availability Check
  it('12. Stock Availability Check: Excessive quantity rejected with 400', async () => {
    const tulipId = 'p1111111-1111-1111-1111-111111111111';
    const excessiveOrder = {
      items: [{ product_id: tulipId, quantity: 99999 }],
      shipping_address: { city: 'Jaipur' },
    };
    const resExcess = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(excessiveOrder),
    });
    expect(resExcess.status).toBe(400);
  });

  // 13. Get User Orders
  it('13. Get User Orders: OK', async () => {
    const res = await app.request('/api/orders', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    expect(res.status).toBe(200);
    const userOrders = await res.json();
    expect(userOrders.length).toBeGreaterThanOrEqual(1);
  });

  // 14. Get Order by ID
  it('14. Get Order by ID (Authorized User): OK', async () => {
    const orderId = 'ord-seed-001';
    const res = await app.request(`/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    expect(res.status).toBe(200);
    const order = await res.json();
    expect(order.id).toBe(orderId);
  });

  // 15. CRITICAL SECURITY CHECK: IDOR blocked
  it('15. CRITICAL SECURITY CHECK: Other user cannot access User 1 order (Blocked with 404)', async () => {
    const orderId = 'ord-seed-001'; // Belongs to customer-user-id-001
    const resAttacker = await app.request(`/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${customerToken2}` },
    });
    expect(resAttacker.status).toBe(404);
  });

  // 16. Admin Access to Specific Order and All Orders
  it('16. Admin Access & Gate: OK', async () => {
    const orderId = 'ord-seed-001';
    const resAdminGet = await app.request(`/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(resAdminGet.status).toBe(200);

    const resAllOrders = await app.request('/api/admin/orders', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(resAllOrders.status).toBe(200);
    expect((await resAllOrders.json()).length).toBeGreaterThanOrEqual(1);

    const resForbidden = await app.request('/api/admin/orders', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    expect(resForbidden.status).toBe(403);
  });

  // 17. Admin Login, Cookie, and Logout
  it('17. Admin Session Authentication & Cookie Lifecycle: OK', async () => {
    const resBadPw = await app.request('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@aaascrochet.com', password: 'wrongpassword' }),
    });
    expect(resBadPw.status).toBe(401);

    const resLogin = await app.request('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@aaascrochet.com', password: 'admin123' }),
    });
    expect(resLogin.status).toBe(200);
    const loginData = await resLogin.json();
    expect(loginData.success).toBe(true);
    expect(loginData.token).toBeDefined();

    const setCookie = resLogin.headers.get('set-cookie');
    expect(setCookie).toContain('admin_session');

    // Verify session cookie authentication
    const cookieMatch = setCookie?.match(/admin_session=([^;]+)/);
    const cookieVal = cookieMatch ? cookieMatch[1] : '';

    const resCookieAuth = await app.request('/api/admin/me', {
      headers: { Cookie: `admin_session=${cookieVal}` },
    });
    expect(resCookieAuth.status).toBe(200);
    const meData = await resCookieAuth.json();
    expect(meData.user.role).toBe('admin');

    const resLogout = await app.request('/api/admin/logout', { method: 'POST' });
    expect(resLogout.status).toBe(200);
  });

  // 18. Admin Analytics
  it('18. Admin Analytics Engine: OK', async () => {
    const res = await app.request('/api/admin/analytics?time_range=30d', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const analyticsData = await res.json();
    expect(analyticsData.total_revenue).toBeDefined();
    expect(analyticsData.order_volume).toBeDefined();
    expect(analyticsData.aov).toBeDefined();
    expect(analyticsData.timeline).toBeDefined();
    expect(analyticsData.timeline.length).toBe(30);
    expect(analyticsData.category_breakdown).toBeDefined();
    expect(analyticsData.top_products).toBeDefined();
  });

  // 19. Admin Products Catalog Search
  it('19. Admin Products Management & Search: OK', async () => {
    const resAdminProds = await app.request('/api/admin/products', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(resAdminProds.status).toBe(200);
    expect((await resAdminProds.json()).length).toBeGreaterThanOrEqual(6);

    const resSearch = await app.request('/api/admin/products?search=Tulip', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(resSearch.status).toBe(200);
    const searchProds = await resSearch.json();
    expect(searchProds.some((p: any) => p.name.includes('Tulip'))).toBe(true);
  });

  // 20. Product Status Toggle
  it('20. Inline Product Quick-Toggle: OK', async () => {
    const tulipId = 'p1111111-1111-1111-1111-111111111111';
    const resToggle = await app.request(`/api/admin/products/${tulipId}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_featured: true, is_active: true }),
    });
    expect(resToggle.status).toBe(200);
    expect((await resToggle.json()).is_featured).toBe(true);
  });

  // 20b. Product Creation
  it('20b. Product Creation with Specifications & Customizable flags: OK', async () => {
    const newProdPayload = {
      name: 'Ganesh MDF Welcome Board',
      category_id: '55555555-5555-5555-5555-555555555555',
      price: 850.0,
      description: 'Handcrafted festive welcome board with intricate Ganesh artwork.',
      image_urls: ['/images/tulip_bouquet.jpg'],
      is_featured: true,
      is_customizable: true,
      specifications: [
        { label: 'Material', value: 'Pine MDF Wood' },
        { label: 'Dimensions', value: '12 x 8 inches' },
      ],
    };

    const res = await app.request('/api/products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newProdPayload),
    });

    expect(res.status).toBe(200);
    const createdP = await res.json();
    expect(createdP.name).toBe('Ganesh MDF Welcome Board');
    expect(createdP.price).toBe(850.0);
    expect(createdP.is_customizable).toBe(true);
    expect(createdP.is_featured).toBe(true);
    expect(createdP.specifications.length).toBe(2);
    expect(createdP.specifications[0].label).toBe('Material');
    expect(createdP.slug).toBe('ganesh-mdf-welcome-board');
  });

  // 21. Order State Machine Transition
  it('21. Order State Machine Validation & Fulfillment: OK', async () => {
    const orderId = 'ord-seed-004'; // Status is 'pending'

    // Invalid: pending -> delivered directly (MUST FAIL WITH 400)
    const resInvalid = await app.request(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'delivered' }),
    });
    expect(resInvalid.status).toBe(400);

    // Valid: pending -> processing
    const resProc = await app.request(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'processing', notes: 'Artisan weaving underway' }),
    });
    expect(resProc.status).toBe(200);
    expect((await resProc.json()).status).toBe('processing');

    // Invalid: processing -> shipped without carrier details (MUST FAIL WITH 400)
    const resShipMissing = await app.request(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'shipped' }),
    });
    expect(resShipMissing.status).toBe(400);

    // Valid: processing -> shipped with carrier & tracking
    const resShip = await app.request(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'shipped',
        carrier_name: 'BlueDart',
        tracking_number: 'BD99881122IN',
        notes: 'Dispatched in presentation box',
      }),
    });
    expect(resShip.status).toBe(200);
    const shippedOrder = await resShip.json();
    expect(shippedOrder.status).toBe('shipped');
    expect(shippedOrder.carrier_name).toBe('BlueDart');
    expect(shippedOrder.tracking_number).toBe('BD99881122IN');
  });

  // 22. File Upload Pipeline
  it('22. Admin Storage Pipeline & File Upload: OK', async () => {
    const fakeImage = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...new Array(100).fill(0)])], {
      type: 'image/jpeg',
    });
    const formData = new FormData();
    formData.append('file', fakeImage, 'bouquet_test.jpg');
    formData.append('bucket', 'product-images');

    const resUpload = await app.request('/api/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: formData,
    });
    expect(resUpload.status).toBe(200);
    const uploadData = await resUpload.json();
    expect(uploadData.success).toBe(true);
    expect(uploadData.url).toBeDefined();
    expect(uploadData.filename).toContain('.webp');
  });

  // 23. Case A: Normal successful payment webhook
  it('23. Case A: Normal successful payment webhook & idempotent confirmation: OK', async () => {
    const resOrdA = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ product_id: 'p1111111-1111-1111-1111-111111111111', quantity: 1 }],
        shipping_address: { fullName: 'Case A Patron', email: 'case_a@test.com', address: '123 St' },
      }),
    });
    expect(resOrdA.status).toBe(201);
    const ordAId = (await resOrdA.json()).id;

    // Create provider order
    const resProvA = await app.request('/api/payment/create-order', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order_id: ordAId }),
    });
    expect(resProvA.status).toBe(200);
    const provAOrderId = (await resProvA.json()).provider_order_id;

    // Send valid signed webhook
    const webhookPayloadA = {
      id: 'evt_test_case_a_001',
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_case_a_12345',
            order_id: provAOrderId,
            notes: { order_id: ordAId },
          },
        },
      },
    };
    const rawBodyA = JSON.stringify(webhookPayloadA);
    const sigA = crypto
      .createHmac('sha256', settings.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBodyA)
      .digest('hex');

    const resWhA = await app.request('/api/payment/webhook', {
      method: 'POST',
      headers: {
        'X-Razorpay-Signature': sigA,
        'Content-Type': 'application/json',
      },
      body: rawBodyA,
    });
    expect(resWhA.status).toBe(200);
    expect((await resWhA.json()).status).toBe('processed');

    const ordARecord = store.orders[ordAId];
    expect(ordARecord.payment_status).toBe('paid');
    expect(ordARecord.provider_payment_id).toBe('pay_test_case_a_12345');
    expect(ordARecord.payment_confirmation_sent_at).toBeDefined();
    expect(ordARecord.status).toBe('pending'); // Fulfillment status remains pending!
  });

  // 24. Case B: Webhook delayed, recovered by sweep
  it('24. Case B: Delayed webhook recovered safely by sweep: OK', async () => {
    const resOrdB = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ product_id: 'p2222222-2222-2222-2222-222222222222', quantity: 1 }],
        shipping_address: { fullName: 'Case B Patron', email: 'case_b@test.com', address: '456 Rd' },
      }),
    });
    const ordBId = (await resOrdB.json()).id;

    // Seed order as pending 45 minutes ago with provider order ID
    store.orders[ordBId].provider_order_id = 'order_rzp_delayed_b';
    store.orders[ordBId].created_at = new Date(Date.now() - 45 * 60000).toISOString();
    store.payment_records['rec_case_b'] = {
      id: 'rec_case_b',
      order_id: ordBId,
      gateway_order_id: 'order_rzp_delayed_b',
      payment_id: 'pay_case_b_captured_987',
      status: 'paid',
    };

    const resSweep = await app.request('/api/admin/payments/recovery-sweep?threshold_minutes=30', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(resSweep.status).toBe(200);
    const sweepData = await resSweep.json();
    expect(sweepData.recovered_paid).toBeGreaterThanOrEqual(1);
    expect(store.orders[ordBId].payment_status).toBe('paid');
    expect(store.orders[ordBId].provider_payment_id).toBe('pay_case_b_captured_987');
  });

  // 25. Case C: Webhook duplicated
  it('25. Case C: Duplicate webhook rejected without repeated side effects: OK', async () => {
    const webhookPayloadA = {
      id: 'evt_test_case_dup_001',
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_dup_123',
            order_id: 'order_dup',
            notes: { order_id: 'ord-seed-004' },
          },
        },
      },
    };
    const rawBodyA = JSON.stringify(webhookPayloadA);
    const sigA = crypto
      .createHmac('sha256', settings.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBodyA)
      .digest('hex');

    // First call
    const res1 = await app.request('/api/payment/webhook', {
      method: 'POST',
      headers: { 'X-Razorpay-Signature': sigA, 'Content-Type': 'application/json' },
      body: rawBodyA,
    });
    expect(res1.status).toBe(200);
    expect((await res1.json()).status).toBe('processed');

    // Second duplicate call
    const res2 = await app.request('/api/payment/webhook', {
      method: 'POST',
      headers: { 'X-Razorpay-Signature': sigA, 'Content-Type': 'application/json' },
      body: rawBodyA,
    });
    expect(res2.status).toBe(200);
    expect((await res2.json()).status).toBe('duplicate_ignored');
  });

  // 26. Case D: Payment failed
  it('26. Case D: Failed payment marks local status as failed: OK', async () => {
    const resOrdD = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ product_id: 'p1111111-1111-1111-1111-111111111111', quantity: 1 }],
        shipping_address: { fullName: 'Case D Patron', email: 'case_d@test.com', address: '789 Ave' },
      }),
    });
    const ordDId = (await resOrdD.json()).id;

    const webhookPayloadD = {
      id: 'evt_test_case_d_failed',
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_failed_000',
            notes: { order_id: ordDId },
          },
        },
      },
    };
    const rawBodyD = JSON.stringify(webhookPayloadD);
    const sigD = crypto
      .createHmac('sha256', settings.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBodyD)
      .digest('hex');

    const resWhD = await app.request('/api/payment/webhook', {
      method: 'POST',
      headers: { 'X-Razorpay-Signature': sigD, 'Content-Type': 'application/json' },
      body: rawBodyD,
    });
    expect(resWhD.status).toBe(200);
    expect(store.orders[ordDId].payment_status).toBe('failed');
  });

  // 27. Case E: Payment remains unresolved
  it('27. Case E: Unresolved payment remains safely pending: OK', async () => {
    const resOrdE = await app.request('/api/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ product_id: 'p2222222-2222-2222-2222-222222222222', quantity: 1 }],
        shipping_address: { fullName: 'Case E Patron', email: 'case_e@test.com', address: '101 Way' },
      }),
    });
    const ordEId = (await resOrdE.json()).id;
    store.orders[ordEId].created_at = new Date(Date.now() - 40 * 60000).toISOString();
    store.orders[ordEId].provider_order_id = 'order_unresolved_e';

    const resSweep = await app.request('/api/admin/payments/recovery-sweep?threshold_minutes=30', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(resSweep.status).toBe(200);
    expect(store.orders[ordEId].payment_status).toBe('pending');
  });

  // 28. Case F: Same customer has multiple orders (Reconciling one modifies only that exact order)
  it('28. Case F: Narrowly scoped reconciliation isolates orders for same customer: OK', async () => {
    const resF1 = await app.request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ product_id: 'p1111111-1111-1111-1111-111111111111', quantity: 1 }],
        shipping_address: { fullName: 'Multi Patron', email: 'multi@test.com', address: 'M1' },
      }),
    });
    const resF2 = await app.request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ product_id: 'p2222222-2222-2222-2222-222222222222', quantity: 1 }],
        shipping_address: { fullName: 'Multi Patron', email: 'multi@test.com', address: 'M2' },
      }),
    });
    const resF3 = await app.request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ product_id: 'p4444444-4444-4444-4444-444444444444', quantity: 1 }],
        shipping_address: { fullName: 'Multi Patron', email: 'multi@test.com', address: 'M3' },
      }),
    });

    const f1Id = (await resF1.json()).id;
    const f2Id = (await resF2.json()).id;
    const f3Id = (await resF3.json()).id;

    store.orders[f1Id].payment_status = 'failed';
    store.orders[f2Id].payment_status = 'pending';
    store.orders[f3Id].payment_status = 'pending';

    // Reconcile ONLY f2
    await paymentService.reconcileOrderPayment(f2Id, 'order_f2', 'pay_f2_isolated_success', 'unit_test');

    expect(store.orders[f1Id].payment_status).toBe('failed');
    expect(store.orders[f2Id].payment_status).toBe('paid');
    expect(store.orders[f3Id].payment_status).toBe('pending');
  });

  // 29. Case G: Empty payment ID rejected
  it('29. Case G: Empty payment ID rejected, order remains pending: OK', async () => {
    const f3Id = 'ord-seed-004';
    store.orders[f3Id].payment_status = 'pending';

    await expect(
      paymentService.reconcileOrderPayment(f3Id, 'order_f3', '', 'unit_test')
    ).rejects.toThrow();

    expect(store.orders[f3Id].payment_status).toBe('pending');
  });

  // 30. Case H: Expired local record recovered to paid
  it('30. Case H: Expired local record recovered to paid, fulfillment unchanged: OK', async () => {
    const f3Id = 'ord-seed-004';
    store.orders[f3Id].payment_status = 'expired';
    store.orders[f3Id].status = 'pending';

    const recoveredH = await paymentService.reconcileOrderPayment(
      f3Id,
      'order_f3_recovered',
      'pay_f3_valid_recovered_id',
      'recovery'
    );

    expect(recoveredH.payment_status).toBe('paid');
    expect(recoveredH.status).toBe('pending'); // Fulfillment status preserved!
  });
});
