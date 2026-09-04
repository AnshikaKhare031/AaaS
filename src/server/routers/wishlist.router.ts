import { Hono } from 'hono';
import crypto from 'crypto';
import { store } from '../database';
import { getCurrentUser } from '../lib/auth';
import { WishlistItem } from '../types';

export const wishlistRouter = new Hono();

wishlistRouter.get('/wishlist', async (c) => {
  const user = await getCurrentUser(c);
  const userId = user?.id || 'guest';
  const items = store.wishlist_items[userId] || [];

  const enriched: WishlistItem[] = [];
  for (const item of items) {
    const p = store.products[item.product_id];
    if (p) {
      enriched.push({ ...item, product: p });
    }
  }
  return c.json(enriched);
});

wishlistRouter.post('/wishlist', async (c) => {
  const user = await getCurrentUser(c);
  const userId = user?.id || 'guest';
  const body = await c.req.json();
  const productId = body.product_id;

  const product = store.products[productId];
  if (!product) {
    return c.json({ detail: 'Product not found' }, 404);
  }

  if (!store.wishlist_items[userId]) {
    store.wishlist_items[userId] = [];
  }

  const existing = store.wishlist_items[userId].find((i) => i.product_id === productId);
  if (existing) {
    return c.json({ ...existing, product });
  }

  const newItem: WishlistItem = {
    id: crypto.randomUUID(),
    user_id: userId,
    product_id: productId,
    product,
    created_at: new Date().toISOString(),
  };
  store.wishlist_items[userId].push(newItem);
  return c.json(newItem);
});

wishlistRouter.delete('/wishlist/:product_id', async (c) => {
  const user = await getCurrentUser(c);
  const userId = user?.id || 'guest';
  const productId = c.req.param('product_id');

  if (store.wishlist_items[userId]) {
    store.wishlist_items[userId] = store.wishlist_items[userId].filter(
      (i) => i.product_id !== productId && i.id !== productId
    );
  }
  return c.json({ success: true, message: 'Product removed from wishlist' });
});
