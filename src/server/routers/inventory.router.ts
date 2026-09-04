import { Hono } from 'hono';
import { store, supabaseClient } from '../database';
import { requireAdmin } from '../lib/auth';
import { inventoryService } from '../services/inventory.service';
import { normalizeProductImages } from './products.router';

export const inventoryRouter = new Hono();

inventoryRouter.get('/admin/inventory', async (c) => {
  const adminOrRes = await requireAdmin(c);
  if (adminOrRes instanceof Response) return adminOrRes;

  const query = c.req.query();
  const search = query.search;
  const category = query.category;
  const statusFilter = query.status;

  let productsList: any[] = [];

  if (supabaseClient) {
    try {
      const res = await supabaseClient
        .from('products')
        .select('*, categories(*), product_images(*)');
      if (res.data) {
        productsList = res.data.map((row: any) => ({
          ...row,
          category: row.categories,
          images: row.product_images || [{ image_url: '/images/tulip_bouquet.jpg' }],
        }));
      }
    } catch {
      // Fallback
    }
  }

  if (productsList.length === 0) {
    productsList = Object.values(store.products).map((p) => {
      const prod = { ...p };
      if (!prod.category && prod.category_id && store.categories[prod.category_id]) {
        prod.category = store.categories[prod.category_id];
      }
      return prod;
    });
  }

  productsList.forEach((p) => normalizeProductImages(p));

  // Filters
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    productsList = productsList.filter(
      (p) => (p.name || '').toLowerCase().includes(q) || (p.slug || '').toLowerCase().includes(q)
    );
  }

  if (category && category !== 'all') {
    productsList = productsList.filter(
      (p) =>
        (p.category && p.category.slug === category) ||
        p.category_id === category
    );
  }

  if (statusFilter === 'in_stock') {
    productsList = productsList.filter((p) => (p.stock_quantity ?? 0) > (p.low_stock_threshold ?? 3));
  } else if (statusFilter === 'low_stock') {
    productsList = productsList.filter(
      (p) => (p.stock_quantity ?? 0) > 0 && (p.stock_quantity ?? 0) <= (p.low_stock_threshold ?? 3)
    );
  } else if (statusFilter === 'out_of_stock') {
    productsList = productsList.filter((p) => (p.stock_quantity ?? 0) <= 0);
  }

  return c.json(productsList);
});

inventoryRouter.put('/admin/inventory/:product_id', async (c) => {
  const adminOrRes = await requireAdmin(c);
  if (adminOrRes instanceof Response) return adminOrRes;

  const productId = c.req.param('product_id');
  const prod = store.products[productId];
  if (!prod) {
    return c.json({ detail: 'Product not found' }, 404);
  }

  const body = await c.req.json();
  const stockQuantity = Number(body.stock_quantity);
  prod.stock_quantity = stockQuantity;
  prod.inventory_count = stockQuantity;

  if (supabaseClient) {
    try {
      await supabaseClient
        .from('products')
        .update({ stock_quantity: stockQuantity })
        .eq('id', productId);
    } catch (e) {
      console.warn('Supabase stock update error:', e);
    }
  }

  return c.json(prod);
});

inventoryRouter.post('/admin/inventory/:product_id/adjust', async (c) => {
  const adminOrRes = await requireAdmin(c);
  if (adminOrRes instanceof Response) return adminOrRes;

  const productId = c.req.param('product_id');
  const body = await c.req.json();
  const delta = Number(body.delta || 0);
  const reason = body.reason;

  try {
    const updated = await inventoryService.adjustStock(productId, delta, reason);
    return c.json(updated);
  } catch (err: any) {
    return c.json({ detail: err.message || 'Product not found' }, err.status || 404);
  }
});
