import { Hono } from 'hono';
import crypto from 'crypto';
import { store, supabaseClient, isProduction } from '../database';
import { requireAdmin } from '../lib/auth';
import { Category } from '../types';

export const categoriesRouter = new Hono();

categoriesRouter.get('/categories', async (c) => {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (data) {
        return c.json(data);
      }
      if (error && isProduction) {
        return c.json({ detail: error.message }, 500);
      }
    } catch (e: any) {
      console.warn('Supabase categories fetch error:', e);
      if (isProduction) {
        return c.json({ detail: e.message || 'Failed to fetch categories' }, 500);
      }
    }
  }

  if (isProduction) {
    return c.json([]);
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
    slug: body.slug,
    description: body.description ?? null,
    image_url: body.image_url ?? null,
    is_active: body.is_active ?? true,
    display_order: body.display_order ?? 0,
    created_at: nowStr,
    updated_at: nowStr,
  };

  if (supabaseClient) {
    try {
      await supabaseClient.from('categories').insert(newCat);
    } catch (e) {
      console.warn('Supabase category insert error:', e);
    }
  }

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

  if (supabaseClient) {
    try {
      await supabaseClient.from('categories').update(cat).eq('id', catId);
    } catch (e) {
      console.warn('Supabase category update error:', e);
    }
  }

  return c.json(cat);
});

categoriesRouter.delete('/admin/categories/:cat_id', async (c) => {
  const adminOrRes = await requireAdmin(c);
  if (adminOrRes instanceof Response) return adminOrRes;

  const catId = c.req.param('cat_id');
  if (supabaseClient) {
    try {
      await supabaseClient.from('categories').delete().eq('id', catId);
    } catch (e) {
      console.warn('Supabase category delete error:', e);
    }
  }

  if (store.categories[catId]) {
    delete store.categories[catId];
    return c.json({ success: true, message: 'Category deleted' });
  }

  return c.json({ detail: 'Category not found' }, 404);
});
