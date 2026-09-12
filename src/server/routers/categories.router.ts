import { Hono } from 'hono';
import crypto from 'crypto';
import { store, supabaseClient, isProduction } from '../database';
import { requireAdmin } from '../lib/auth';
import { Category } from '../types';

export const categoriesRouter = new Hono();

categoriesRouter.get('/categories', async (c) => {
  if (supabaseClient) {
    try {
      const { data } = await supabaseClient
        .from('products')
        .select('category')
        .eq('is_active', true);
      if (data && data.length > 0) {
        const distinctNames = Array.from(new Set(data.map((r: any) => r.category).filter(Boolean)));
        if (distinctNames.length > 0) {
          const list: Category[] = distinctNames.map((name: any, idx: number) => {
            const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            return {
              id: slug,
              name: String(name),
              slug,
              description: null,
              image_url: null,
              is_active: true,
              display_order: idx + 1,
            };
          });
          return c.json(list);
        }
      }
    } catch (e: any) {
      console.warn('Supabase categories fetch note:', e);
    }
  }

  const cats = Object.values(store.categories).filter((cat) => cat.is_active !== false);
  cats.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  return c.json(cats);
});

categoriesRouter.post('/admin/categories', async (c) => {
  const adminOrRes = await requireAdmin(c);
  if (adminOrRes instanceof Response) return adminOrRes;

  const body = await c.req.json();
  const catId = crypto.randomUUID();
  const nowStr = new Date().toISOString();

  const newCat: Category = {
    id: catId,
    name: body.name,
    slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    description: body.description ?? null,
    image_url: body.image_url ?? null,
    is_active: body.is_active ?? true,
    display_order: body.display_order ?? 0,
    created_at: nowStr,
    updated_at: nowStr,
  };

  store.categories[catId] = newCat;
  return c.json(newCat);
});

categoriesRouter.put('/admin/categories/:cat_id', async (c) => {
  const adminOrRes = await requireAdmin(c);
  if (adminOrRes instanceof Response) return adminOrRes;

  const catId = c.req.param('cat_id');
  const cat = store.categories[catId];
  if (!cat) {
    return c.json({ detail: 'Category not found' }, 404);
  }

  const body = await c.req.json();
  Object.assign(cat, body);
  cat.updated_at = new Date().toISOString();

  return c.json(cat);
});

categoriesRouter.delete('/admin/categories/:cat_id', async (c) => {
  const adminOrRes = await requireAdmin(c);
  if (adminOrRes instanceof Response) return adminOrRes;

  const catId = c.req.param('cat_id');
  if (store.categories[catId]) {
    delete store.categories[catId];
    return c.json({ success: true, message: 'Category deleted' });
  }

  return c.json({ detail: 'Category not found' }, 404);
});
