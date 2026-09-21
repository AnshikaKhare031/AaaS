import { describe, it, expect, beforeEach } from 'vitest';
import app from '../src/server/app';
import { createAdminSessionToken } from '../src/server/lib/auth';
import { store } from '../src/server/database';
import jwt from 'jsonwebtoken';
import { settings } from '../src/server/config';

describe('Security Fix Verification: Custom Orders Authorization & Tenant Isolation', () => {
  const customerAId = 'cust-a-uuid-1111';
  const customerBId = 'cust-b-uuid-2222';

  // Tokens
  const customerAToken = jwt.sign(
    { sub: customerAId, email: 'alice@example.com', role: 'customer', aud: 'authenticated' },
    settings.SUPABASE_JWT_SECRET,
    { algorithm: 'HS256' }
  );

  const customerBToken = jwt.sign(
    { sub: customerBId, email: 'bob@example.com', role: 'customer', aud: 'authenticated' },
    settings.SUPABASE_JWT_SECRET,
    { algorithm: 'HS256' }
  );

  const adminToken = createAdminSessionToken('admin@aaascrochet.com');

  beforeEach(() => {
    store.seedDefaults();

    // Populate isolated test custom orders
    store.custom_orders['co-cust-a-1'] = {
      id: 'co-cust-a-1',
      request_id: 'CUST-2026-1001',
      user_id: customerAId,
      name: 'Alice Smith',
      email: 'alice@example.com',
      phone: '+919111111111',
      product_type: 'Amigurumi Doll',
      category: 'Crochet Toys',
      color_preference: 'Lavender & White',
      size_dimensions: '25cm',
      quantity: 1,
      budget: 1200,
      description: 'Handmade doll with floral dress',
      images: ['https://example.com/img_alice.jpg'],
      status: 'new',
      admin_notes: null,
      created_at: '2026-09-20T10:00:00.000Z',
      updated_at: '2026-09-20T10:00:00.000Z',
    };

    store.custom_orders['co-cust-b-1'] = {
      id: 'co-cust-b-1',
      request_id: 'CUST-2026-2002',
      user_id: customerBId,
      name: 'Bob Jones',
      email: 'bob@example.com',
      phone: '+919222222222',
      product_type: 'Crochet Blanket',
      category: 'Home Decor',
      color_preference: 'Beige & Sage',
      size_dimensions: '150x200cm',
      quantity: 1,
      budget: 4500,
      description: 'King size weighted crochet blanket',
      images: ['https://example.com/img_bob.jpg'],
      status: 'new',
      admin_notes: null,
      created_at: '2026-09-20T10:05:00.000Z',
      updated_at: '2026-09-20T10:05:00.000Z',
    };
  });

  // TEST 1: No Authorization header
  it('TEST 1: Guest / unauthenticated request to GET /api/custom-orders returns 401 and leaks NO customer data', async () => {
    const res = await app.request('/api/custom-orders', {
      method: 'GET',
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.detail).toBe('Authentication required');

    // Confirm no customer PII was returned
    const text = JSON.stringify(body);
    expect(text).not.toContain('Alice Smith');
    expect(text).not.toContain('Bob Jones');
    expect(text).not.toContain('alice@example.com');
    expect(text).not.toContain('bob@example.com');
    expect(text).not.toContain('+919111111111');
    expect(text).not.toContain('+919222222222');
    expect(text).not.toContain('4500');
  });

  it('TEST 1b: Guest / unauthenticated request to GET /api/custom-orders/:custom_id returns 401', async () => {
    const res = await app.request('/api/custom-orders/co-cust-b-1', {
      method: 'GET',
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.detail).toBe('Authentication required');
    expect(JSON.stringify(body)).not.toContain('Bob Jones');
  });

  // TEST 2: Valid Customer A token
  it('TEST 2: Valid Customer A token returns ONLY Customer A records (200 OK)', async () => {
    const res = await app.request('/api/custom-orders', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${customerAToken}`,
      },
    });

    expect(res.status).toBe(200);
    const orders = await res.json();
    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBe(1);

    expect(orders[0].id).toBe('co-cust-a-1');
    expect(orders[0].user_id).toBe(customerAId);
    expect(orders[0].name).toBe('Alice Smith');
    expect(orders[0].email).toBe('alice@example.com');

    // Customer B data must NOT be present
    const resText = JSON.stringify(orders);
    expect(resText).not.toContain('Bob Jones');
    expect(resText).not.toContain('bob@example.com');
    expect(resText).not.toContain('co-cust-b-1');
  });

  // TEST 3: Valid Customer B token
  it('TEST 3: Valid Customer B token returns ONLY Customer B records (200 OK)', async () => {
    const res = await app.request('/api/custom-orders', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${customerBToken}`,
      },
    });

    expect(res.status).toBe(200);
    const orders = await res.json();
    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBe(1);

    expect(orders[0].id).toBe('co-cust-b-1');
    expect(orders[0].user_id).toBe(customerBId);
    expect(orders[0].name).toBe('Bob Jones');
    expect(orders[0].email).toBe('bob@example.com');

    // Customer A data must NOT be present
    const resText = JSON.stringify(orders);
    expect(resText).not.toContain('Alice Smith');
    expect(resText).not.toContain('alice@example.com');
    expect(resText).not.toContain('co-cust-a-1');
  });

  // TEST 4: Customer A attempts to access Customer B's data
  it('TEST 4: Customer A attempting to access Customer B data is prevented (Tenant Isolation & Anti-IDOR)', async () => {
    // 4a. Customer A listing: Customer B is never included
    const listRes = await app.request('/api/custom-orders', {
      method: 'GET',
      headers: { Authorization: `Bearer ${customerAToken}` },
    });
    expect(listRes.status).toBe(200);
    const list = await listRes.json();
    const hasBob = list.some((o: any) => o.user_id === customerBId || o.id === 'co-cust-b-1');
    expect(hasBob).toBe(false);

    // 4b. Customer A direct ID lookup for Customer B order ID returns 404 (IDOR protection)
    const directIdRes = await app.request('/api/custom-orders/co-cust-b-1', {
      method: 'GET',
      headers: { Authorization: `Bearer ${customerAToken}` },
    });
    expect(directIdRes.status).toBe(404);
    const directIdBody = await directIdRes.json();
    expect(directIdBody.detail).toContain('Custom order request not found');

    // 4c. Customer A direct request_id lookup for Customer B returns 404
    const directReqIdRes = await app.request('/api/custom-orders/CUST-2026-2002', {
      method: 'GET',
      headers: { Authorization: `Bearer ${customerAToken}` },
    });
    expect(directReqIdRes.status).toBe(404);
  });

  // TEST 5: Valid admin authentication
  it('TEST 5: Valid admin authentication preserves authorized global view across custom orders', async () => {
    // 5a. Admin calling GET /api/custom-orders receives all records
    const adminCustomRes = await app.request('/api/custom-orders', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(adminCustomRes.status).toBe(200);
    const adminCustomList = await adminCustomRes.json();
    expect(adminCustomList.length).toBeGreaterThanOrEqual(2);
    const ids = adminCustomList.map((o: any) => o.id);
    expect(ids).toContain('co-cust-a-1');
    expect(ids).toContain('co-cust-b-1');

    // 5b. Admin dedicated endpoint GET /api/admin/custom-orders returns 200 with all orders
    const adminDedRes = await app.request('/api/admin/custom-orders', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(adminDedRes.status).toBe(200);
    const adminDedList = await adminDedRes.json();
    expect(adminDedList.length).toBeGreaterThanOrEqual(2);

    // 5c. Customer attempting to access /api/admin/custom-orders is rejected with 403
    const customerAdminAttempt = await app.request('/api/admin/custom-orders', {
      method: 'GET',
      headers: { Authorization: `Bearer ${customerAToken}` },
    });
    expect(customerAdminAttempt.status).toBe(403);

    // 5d. Admin can inspect any custom order by ID
    const adminGetB = await app.request('/api/custom-orders/co-cust-b-1', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(adminGetB.status).toBe(200);
    const orderB = await adminGetB.json();
    expect(orderB.name).toBe('Bob Jones');

    // 5e. Admin can update custom order status
    const adminUpdateRes = await app.request('/api/admin/custom-orders/co-cust-b-1/status', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'in_progress',
        admin_notes: 'Artisan yarn assigned',
      }),
    });
    expect(adminUpdateRes.status).toBe(200);
    const updated = await adminUpdateRes.json();
    expect(updated.status).toBe('in_progress');
    expect(updated.admin_notes).toBe('Artisan yarn assigned');
  });
});
