import { Hono } from 'hono';
import crypto from 'crypto';
import { store } from '../database';
import { getCurrentUser, requireAdmin } from '../lib/auth';
import { Review } from '../types';

export const reviewsRouter = new Hono();

reviewsRouter.get('/products/:product_id/reviews', async (c) => {
  const productId = c.req.param('product_id');

  const revs = Object.values(store.reviews).filter(
    (r) => r.product_id === productId && r.is_approved
  );
  revs.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  return c.json(revs);
});

reviewsRouter.post('/reviews', async (c) => {
  const user = await getCurrentUser(c);
  const body = await c.req.json();

  const revId = crypto.randomUUID();
  const nowStr = new Date().toISOString();

  const newRev: Review = {
    id: revId,
    product_id: body.product_id,
    user_id: user?.id || null,
    customer_name: body.customer_name || (user?.email ? user.email.split('@')[0] : 'Customer'),
    rating: Number(body.rating),
    comment: body.comment,
    is_approved: true,
    created_at: nowStr,
  };

  store.reviews[revId] = newRev;
  return c.json(newRev);
});

reviewsRouter.get('/admin/reviews', async (c) => {
  const adminOrRes = await requireAdmin(c);
  if (adminOrRes instanceof Response) return adminOrRes;

  const revs = Object.values(store.reviews);
  revs.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  return c.json(revs);
});

reviewsRouter.put('/admin/reviews/:review_id/status', async (c) => {
  const adminOrRes = await requireAdmin(c);
  if (adminOrRes instanceof Response) return adminOrRes;

  const reviewId = c.req.param('review_id');
  const rev = store.reviews[reviewId];
  if (!rev) {
    return c.json({ detail: 'Review not found' }, 404);
  }

  const body = await c.req.json();
  rev.is_approved = Boolean(body.is_approved);

  return c.json(rev);
});
