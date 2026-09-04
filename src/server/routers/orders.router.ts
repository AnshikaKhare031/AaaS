import { Hono } from 'hono';
import { requireAuth, requireAdmin } from '../lib/auth';
import { orderService } from '../services/order.service';

export const ordersRouter = new Hono();

ordersRouter.post('/orders', async (c) => {
  const userOrRes = await requireAuth(c);
  if (userOrRes instanceof Response) return userOrRes;

  const body = await c.req.json();
  try {
    const order = await orderService.createOrder(userOrRes.id, body);
    return c.json(order, 201);
  } catch (err: any) {
    return c.json({ detail: err.message || 'Failed to create order' }, err.status || 400);
  }
});

ordersRouter.get('/orders', async (c) => {
  const userOrRes = await requireAuth(c);
  if (userOrRes instanceof Response) return userOrRes;

  const orders = await orderService.getUserOrders(userOrRes.id);
  return c.json(orders);
});

ordersRouter.get('/orders/:order_id', async (c) => {
  const userOrRes = await requireAuth(c);
  if (userOrRes instanceof Response) return userOrRes;

  const orderId = c.req.param('order_id');
  const isAdmin = userOrRes.role === 'admin';

  try {
    const order = await orderService.getOrderById(orderId, userOrRes.id, isAdmin);
    return c.json(order);
  } catch (err: any) {
    return c.json({ detail: err.message || 'Order not found' }, err.status || 404);
  }
});

ordersRouter.get('/admin/orders', async (c) => {
  const adminOrRes = await requireAdmin(c);
  if (adminOrRes instanceof Response) return adminOrRes;

  const query = c.req.query();
  const statusFilter = query.status;
  const search = query.search;

  let orders = await orderService.getAllOrders(adminOrRes.id);

  if (statusFilter && statusFilter.toLowerCase() !== 'all') {
    orders = orders.filter((o) => (o.status || '').toLowerCase() === statusFilter.toLowerCase());
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    orders = orders.filter((o) => {
      const orderNum = (o.order_number || '').toLowerCase();
      const custName = (o.customer_name || '').toLowerCase();
      const custEmail = (o.customer_email || '').toLowerCase();
      const tracking = (o.tracking_number || '').toLowerCase();

      let shipName = '';
      let shipEmail = '';
      if (o.shipping_address && typeof o.shipping_address === 'object') {
        shipName = (o.shipping_address.fullName || '').toLowerCase();
        shipEmail = (o.shipping_address.email || '').toLowerCase();
      }

      return (
        orderNum.includes(q) ||
        custName.includes(q) ||
        custEmail.includes(q) ||
        tracking.includes(q) ||
        shipName.includes(q) ||
        shipEmail.includes(q)
      );
    });
  }

  return c.json(orders);
});

ordersRouter.patch('/admin/orders/:order_id/status', async (c) => {
  const adminOrRes = await requireAdmin(c);
  if (adminOrRes instanceof Response) return adminOrRes;

  const orderId = c.req.param('order_id');
  const body = await c.req.json();

  try {
    const updated = await orderService.updateOrderStatus(orderId, body, adminOrRes.id);
    return c.json(updated);
  } catch (err: any) {
    return c.json({ detail: err.message || 'Failed to update order status' }, err.status || 400);
  }
});
