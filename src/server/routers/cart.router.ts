import { Hono } from 'hono';
import crypto from 'crypto';
import { store } from '../database';
import { getCurrentUser } from '../lib/auth';
import { CartItem } from '../types';

export const cartRouter = new Hono();

cartRouter.get('/cart', async (c) => {
  const user = await getCurrentUser(c);
  const userId = user?.id || 'guest';
  const userItems = store.cart_items[userId] || [];

  const enriched: CartItem[] = [];
  for (const item of userItems) {
    const p = store.products[item.product_id];
    if (p) {
      enriched.push({ ...item, product: p });
    }
  }
  return c.json(enriched);
});

cartRouter.post('/cart', async (c) => {
  const user = await getCurrentUser(c);
  const userId = user?.id || 'guest';
  const body = await c.req.json();
  const productId = body.product_id;
  const quantity = Number(body.quantity || 1);

  const product = store.products[productId];
  if (!product) {
    return c.json({ detail: 'Product not found' }, 404);
  }

  if ((product.stock_quantity ?? 0) < quantity) {
    return c.json({ detail: 'Insufficient stock' }, 400);
  }

  if (!store.cart_items[userId]) {
    store.cart_items[userId] = [];
  }

  const existing = store.cart_items[userId].find((i) => i.product_id === productId);
  if (existing) {
    existing.quantity += quantity;
    return c.json({ ...existing, product });
  } else {
    const newItem: CartItem = {
      id: crypto.randomUUID(),
      user_id: userId,
      product_id: productId,
      quantity,
      product,
    };
    store.cart_items[userId].push(newItem);
    return c.json(newItem);
  }
});

cartRouter.put('/cart/:item_id', async (c) => {
  const user = await getCurrentUser(c);
  const userId = user?.id || 'guest';
  const itemId = c.req.param('item_id');
  const body = await c.req.json();
  const quantity = Number(body.quantity);

  const items = store.cart_items[userId] || [];
  const item = items.find((i) => i.id === itemId || i.product_id === itemId);

  if (!item) {
    return c.json({ detail: 'Cart item not found' }, 404);
  }

  const prod = store.products[item.product_id];
  if (prod && quantity > (prod.stock_quantity ?? 0)) {
    return c.json({ detail: 'Requested quantity exceeds available stock' }, 400);
  }

  item.quantity = quantity;
  return c.json({ ...item, product: prod || item.product });
});

cartRouter.delete('/cart/clear', async (c) => {
  const user = await getCurrentUser(c);
  const userId = user?.id || 'guest';
  if (store.cart_items[userId]) {
    store.cart_items[userId] = [];
  }
  return c.json({ success: true, message: 'Cart cleared' });
});

cartRouter.delete('/cart/:item_id', async (c) => {
  const user = await getCurrentUser(c);
  const userId = user?.id || 'guest';
  const itemId = c.req.param('item_id');

  if (store.cart_items[userId]) {
    store.cart_items[userId] = store.cart_items[userId].filter(
      (i) => i.id !== itemId && i.product_id !== itemId
    );
  }
  return c.json({ success: true, message: 'Item removed from cart' });
});
