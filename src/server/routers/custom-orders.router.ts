import { Hono } from 'hono';
import crypto from 'crypto';
import { store } from '../database';
import { getCurrentUser, requireAdmin } from '../lib/auth';
import { CustomOrder } from '../types';

export const customOrdersRouter = new Hono();

customOrdersRouter.post('/custom-orders', async (c) => {
  const user = await getCurrentUser(c);
  const body = await c.req.json();

  const customId = crypto.randomUUID();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const requestId = `CUST-${new Date().getFullYear()}-${randomNum}`;
  const nowStr = new Date().toISOString();
  const userId = user?.id || null;

  const customRecord: CustomOrder = {
    id: customId,
    request_id: requestId,
    user_id: userId,
    name: body.name,
    email: body.email,
    phone: body.phone,
    product_type: body.product_type,
    category: body.category || null,
    color_preference: body.color_preference || null,
    size_dimensions: body.size_dimensions || null,
    quantity: Number(body.quantity || 1),
    budget: body.budget !== undefined ? Number(body.budget) : null,
    description: body.description,
    images: body.images || [],
    status: 'new',
    admin_notes: null,
    created_at: nowStr,
    updated_at: nowStr,
  };

  store.custom_orders[customId] = customRecord;
  return c.json(customRecord);
});

customOrdersRouter.get('/custom-orders', async (c) => {
  const user = await getCurrentUser(c);
  const userId = user?.id || null;

  let orders = Object.values(store.custom_orders);
  if (userId) {
    orders = orders.filter((o) => o.user_id === userId);
  }
  orders.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  return c.json(orders);
});

customOrdersRouter.get('/custom-orders/:custom_id', async (c) => {
  const customId = c.req.param('custom_id');
  if (store.custom_orders[customId]) {
    return c.json(store.custom_orders[customId]);
  }
  for (const o of Object.values(store.custom_orders)) {
    if (o.request_id === customId) {
      return c.json(o);
    }
  }
  return c.json({ detail: 'Custom order request not found' }, 404);
});

// Admin endpoints
customOrdersRouter.get('/admin/custom-orders', async (c) => {
  const adminOrRes = await requireAdmin(c);
  if (adminOrRes instanceof Response) return adminOrRes;

  const orders = Object.values(store.custom_orders);
  orders.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  return c.json(orders);
});

customOrdersRouter.put('/admin/custom-orders/:custom_id/status', async (c) => {
  const adminOrRes = await requireAdmin(c);
  if (adminOrRes instanceof Response) return adminOrRes;

  const customId = c.req.param('custom_id');
  const order = store.custom_orders[customId];
  if (!order) {
    return c.json({ detail: 'Custom order not found' }, 404);
  }

  const body = await c.req.json();
  order.status = body.status;
  if (body.admin_notes !== undefined) {
    order.admin_notes = body.admin_notes;
  }
  order.updated_at = new Date().toISOString();

  return c.json(order);
});
