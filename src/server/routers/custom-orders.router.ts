import { Hono } from 'hono';
import crypto from 'crypto';
import { store, supabaseClient } from '../database';
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

  if (supabaseClient) {
    try {
      const { images: _, ...dbDict } = customRecord as any;
      await supabaseClient.from('custom_orders').insert(dbDict);
      for (const imgUrl of customRecord.images) {
        await supabaseClient.from('custom_order_images').insert({
          id: crypto.randomUUID(),
          custom_order_id: customId,
          image_url: imgUrl,
        });
      }
    } catch (e) {
      console.warn('Supabase custom order insert error:', e);
    }
  }

  store.custom_orders[customId] = customRecord;
  return c.json(customRecord);
});

customOrdersRouter.get('/custom-orders', async (c) => {
  const user = await getCurrentUser(c);
  const userId = user?.id || null;

  if (supabaseClient && userId) {
    try {
      const res = await supabaseClient
        .from('custom_orders')
        .select('*, custom_order_images(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (res.data) {
        return c.json(
          res.data.map((row: any) => ({
            ...row,
            images: (row.custom_order_images || []).map((img: any) => img.image_url),
          }))
        );
      }
    } catch {
      // Fallback
    }
  }

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

  if (supabaseClient) {
    try {
      const res = await supabaseClient
        .from('custom_orders')
        .select('*, custom_order_images(*)')
        .order('created_at', { ascending: false });

      if (res.data) {
        return c.json(
          res.data.map((row: any) => ({
            ...row,
            images: (row.custom_order_images || []).map((img: any) => img.image_url),
          }))
        );
      }
    } catch {
      // Fallback
    }
  }

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

  if (supabaseClient) {
    try {
      await supabaseClient
        .from('custom_orders')
        .update({
          status: body.status,
          admin_notes: body.admin_notes,
          updated_at: order.updated_at,
        })
        .eq('id', customId);
    } catch (e) {
      console.warn('Supabase custom order status update error:', e);
    }
  }

  return c.json(order);
});
