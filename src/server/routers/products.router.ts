import { Hono } from 'hono';
import crypto from 'crypto';
import { store, supabaseClient, isProduction } from '../database';
import { requireAdmin } from '../lib/auth';
import { Product, ProductImage } from '../types';

export const productsRouter = new Hono();

export function normalizeProductImages(p: any): Product {
  const rawImages = p.images;
  const normalized: ProductImage[] = [];

  if (rawImages) {
    if (Array.isArray(rawImages)) {
      rawImages.forEach((im, idx) => {
        if (typeof im === 'string' && im.trim()) {
          normalized.push({
            id: `img-${idx}`,
            product_id: p.id || '',
            image_url: im.trim(),
            alt_text: p.name || 'Product',
            display_order: idx + 1,
          });
        } else if (im && typeof im === 'object') {
          const url = im.image_url || im.url || im.src;
          if (url && String(url).trim()) {
            normalized.push({
              id: im.id || `img-${idx}`,
              product_id: p.id || '',
              image_url: String(url).trim(),
              alt_text: im.alt_text || p.name || 'Product',
              display_order: im.display_order ?? idx + 1,
            });
          }
        }
      });
    } else if (typeof rawImages === 'string' && rawImages.trim()) {
      normalized.push({
        id: 'img-0',
        product_id: p.id || '',
        image_url: rawImages.trim(),
        alt_text: p.name || 'Product',
        display_order: 1,
      });
    }
  }

  if (normalized.length === 0) {
    const single = p.image || p.image_url || p.product_image || '/images/tulip_bouquet.jpg';
    normalized.push({
      id: 'img-0',
      product_id: p.id || '',
      image_url: single,
      alt_text: p.name || 'Product',
      display_order: 1,
    });
  }

  const primaryUrl = normalized[0].image_url;
  p.images = normalized;
  p.image = primaryUrl;
  p.image_url = primaryUrl;
  p.product_image = primaryUrl;
  return p as Product;
}

export function mapDbProductRow(row: any): Product {
  const catName = typeof row.category === 'string' && row.category.trim()
    ? row.category.trim()
    : (row.category?.name || (row.categories && row.categories.name) || 'Crochet');
  const catSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  let matchedCategoryId = row.category_id;
  if (!matchedCategoryId) {
    const matched = Object.values(store.categories).find(
      (c) => c.slug === catSlug || c.name.toLowerCase() === catName.toLowerCase()
    );
    if (matched) {
      matchedCategoryId = matched.id;
    }
  }

  const primaryImage = row.image_url || (Array.isArray(row.images) && row.images[0]) || '/images/tulip_bouquet.jpg';

  let rawImages: any[] = [];
  if (Array.isArray(row.images) && row.images.length > 0) {
    rawImages = row.images;
  } else if (row.product_images && Array.isArray(row.product_images) && row.product_images.length > 0) {
    rawImages = row.product_images;
  } else {
    rawImages = [primaryImage];
  }

  const stock = Number(row.stock_quantity ?? row.inventory_count ?? 0);
  const comparePrice = row.compare_at_price ?? row.sale_price ?? null;

  const prod: any = {
    ...row,
    price: Number(row.price || 0),
    sale_price: comparePrice !== null && comparePrice !== undefined ? Number(comparePrice) : null,
    compare_at_price: comparePrice !== null && comparePrice !== undefined ? Number(comparePrice) : null,
    stock_quantity: stock,
    inventory_count: stock,
    low_stock_threshold: Number(row.low_stock_threshold ?? 3),
    category: {
      id: matchedCategoryId || row.category_id || catSlug,
      name: catName,
      slug: catSlug,
    },
    category_id: matchedCategoryId || row.category_id || catSlug,
    category_name: catName,
    image_url: primaryImage,
    image: primaryImage,
    product_image: primaryImage,
    images: rawImages,
  };

  return normalizeProductImages(prod);
}

export async function fetchProductRow(productId: string): Promise<Product | null> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();

      if (error) {
        console.warn('Supabase fetchProductRow error:', error);
      } else if (data) {
        return mapDbProductRow(data);
      }
    } catch (err) {
      console.warn('Supabase fetchProductRow exception:', err);
    }
  }

  const p = store.products[productId];
  if (p) {
    const prod = { ...p };
    if (!prod.category && prod.category_id && store.categories[prod.category_id]) {
      prod.category = store.categories[prod.category_id];
    }
    return normalizeProductImages(prod);
  }

  return null;
}

// 1. List products with search, filtering, pagination
productsRouter.get('/products', async (c) => {
  const query = c.req.query();
  const categoryParam = query.category;
  const search = query.search;
  const minPrice = query.min_price !== undefined ? parseFloat(query.min_price) : undefined;
  const maxPrice = query.max_price !== undefined ? parseFloat(query.max_price) : undefined;
  const sortBy = query.sort_by || 'featured';
  const inStock = query.in_stock !== undefined ? query.in_stock === 'true' : undefined;
  const featured = query.featured !== undefined ? query.featured === 'true' : undefined;
  const bestseller = query.bestseller !== undefined ? query.bestseller === 'true' : undefined;
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));

  let productsList: any[] = [];

  if (supabaseClient) {
    try {
      const res = await supabaseClient
        .from('products')
        .select('*')
        .eq('is_active', true);
      if (res.data && res.data.length > 0) {
        productsList = res.data.map((row: any) => mapDbProductRow(row));
      }
    } catch (e: any) {
      console.warn('Supabase products fetch failed:', e);
      if (isProduction) {
        return c.json({ detail: e.message || 'Failed to fetch products' }, 500);
      }
    }
  }

  if (isProduction) {
    // In production, products list from Supabase is authoritative
  } else if (productsList.length === 0) {
    productsList = Object.values(store.products).map((p) => {
      const prod = { ...p };
      if (!prod.category && prod.category_id && store.categories[prod.category_id]) {
        prod.category = store.categories[prod.category_id];
      }
      return prod;
    });
  }

  productsList.forEach((p) => normalizeProductImages(p));

  // Filter active
  let filtered = productsList.filter((p) => p.is_active !== false);

  // Category filter
  if (categoryParam && categoryParam !== 'all') {
    filtered = filtered.filter(
      (p) =>
        (p.category && (p.category.slug === categoryParam || p.category.name === categoryParam)) ||
        p.category_id === categoryParam ||
        (typeof p.category === 'string' && p.category.toLowerCase() === categoryParam.toLowerCase()) ||
        (p as any).category_name?.toLowerCase() === categoryParam.toLowerCase()
    );
  }

  // Search filter
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((p) => {
      if ((p.name || '').toLowerCase().includes(q)) return true;
      if ((p.description || '').toLowerCase().includes(q)) return true;
      if (p.tags && Array.isArray(p.tags) && p.tags.some((t: string) => t.toLowerCase().includes(q))) {
        return true;
      }
      if (p.category && (p.category.name || '').toLowerCase().includes(q)) return true;
      return false;
    });
  }

  // Price range
  if (minPrice !== undefined && !isNaN(minPrice)) {
    filtered = filtered.filter((p) => (p.sale_price ?? p.price ?? 0) >= minPrice);
  }
  if (maxPrice !== undefined && !isNaN(maxPrice)) {
    filtered = filtered.filter((p) => (p.sale_price ?? p.price ?? 0) <= maxPrice);
  }

  // Stock
  if (inStock === true) {
    filtered = filtered.filter((p) => (p.stock_quantity ?? 0) > 0);
  }

  // Featured
  if (featured === true) {
    filtered = filtered.filter((p) => Boolean(p.is_featured));
  }

  // Bestseller
  if (bestseller === true) {
    filtered = filtered.filter((p) => Boolean(p.is_bestseller));
  }

  // Sorting
  if (sortBy === 'price_asc') {
    filtered.sort((a, b) => (a.sale_price ?? a.price ?? 0) - (b.sale_price ?? b.price ?? 0));
  } else if (sortBy === 'price_desc') {
    filtered.sort((a, b) => (b.sale_price ?? b.price ?? 0) - (a.sale_price ?? a.price ?? 0));
  } else if (sortBy === 'newest') {
    filtered.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  } else if (sortBy === 'bestseller') {
    filtered.sort((a, b) => (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0));
  } else {
    // featured
    filtered.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return c.json({
    products: paginated,
    total,
    page,
    total_pages: totalPages,
  });
});

// 2. Get product by slug
productsRouter.get('/products/slug/:slug', async (c) => {
  const slug = c.req.param('slug');

  if (supabaseClient) {
    try {
      const res = await supabaseClient
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single();
      if (res.data) {
        return c.json(mapDbProductRow(res.data));
      }
    } catch {
      if (isProduction) {
        return c.json({ detail: `Product with slug '${slug}' not found` }, 404);
      }
    }
  }

  if (isProduction) {
    return c.json({ detail: `Product with slug '${slug}' not found` }, 404);
  }

  for (const p of Object.values(store.products)) {
    if (p.slug === slug) {
      const prod = { ...p };
      if (!prod.category && prod.category_id && store.categories[prod.category_id]) {
        prod.category = store.categories[prod.category_id];
      }
      return c.json(normalizeProductImages(prod));
    }
  }

  return c.json({ detail: `Product with slug '${slug}' not found` }, 404);
});

// 3. Get product by ID (both public /products/:id and /admin/products/:id)
const handleGetProductById = async (c: any) => {
  const productId = c.req.param('product_id') || c.req.param('id');
  const prod = await fetchProductRow(productId);
  if (prod) {
    return c.json(prod);
  }
  return c.json({ detail: `Product with id '${productId}' not found` }, 404);
};

productsRouter.get('/products/:product_id', handleGetProductById);
productsRouter.get('/admin/products/:product_id', async (c) => {
  const adminOrRes = await requireAdmin(c);
  if (adminOrRes instanceof Response) return adminOrRes;
  return handleGetProductById(c);
});

// 4. Admin List Products
productsRouter.get('/admin/products', async (c) => {
  const adminOrRes = await requireAdmin(c);
  if (adminOrRes instanceof Response) return adminOrRes;

  const query = c.req.query();
  const search = query.search;
  const categoryId = query.category || query.category_id;
  const statusFilter = query.status || 'all';

  let prodsList: any[] = [];

  if (supabaseClient) {
    try {
      const res = await supabaseClient
        .from('products')
        .select('*');
      if (res.data && res.data.length > 0) {
        prodsList = res.data.map((row: any) => mapDbProductRow(row));
      }
    } catch (e: any) {
      console.warn('Supabase admin products fetch failed:', e);
      if (isProduction) {
        return c.json({ detail: e.message || 'Failed to fetch products' }, 500);
      }
    }
  }

  if (isProduction) {
    // In production, products list from Supabase is authoritative
  } else if (prodsList.length === 0) {
    prodsList = Object.values(store.products).map((p) => {
      const prod = { ...p };
      if (!prod.category && prod.category_id && store.categories[prod.category_id]) {
        prod.category = store.categories[prod.category_id];
      }
      return prod;
    });
  }

  let prods = prodsList.map((p) => {
    const prod = { ...p };
    if (prod.inventory_count === undefined) prod.inventory_count = prod.stock_quantity ?? 0;
    if (!prod.sku) prod.sku = `AAAS-${String(prod.id).slice(0, 6).toUpperCase()}`;
    return normalizeProductImages(prod);
  });

  if (statusFilter === 'active') {
    prods = prods.filter((p) => p.is_active !== false);
  } else if (statusFilter === 'inactive') {
    prods = prods.filter((p) => p.is_active === false);
  }

  if (categoryId && categoryId.toLowerCase() !== 'all') {
    prods = prods.filter(
      (p) =>
        String(p.category_id) === categoryId ||
        p.category?.slug === categoryId ||
        p.category?.name?.toLowerCase() === categoryId.toLowerCase()
    );
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    prods = prods.filter((p) => {
      const nameMatch = (p.name || '').toLowerCase().includes(q);
      const skuMatch = (p.sku || '').toLowerCase().includes(q);
      const tagsMatch = p.tags && Array.isArray(p.tags) && p.tags.some((t: string) => t.toLowerCase().includes(q));
      return nameMatch || skuMatch || tagsMatch;
    });
  }

  return c.json(prods);
});

// Helper for product creation
async function handleCreateProduct(c: any) {
  const adminOrRes = await requireAdmin(c);
  if (adminOrRes instanceof Response) return adminOrRes;

  const body = await c.req.json();
  const prodId = crypto.randomUUID();
  const nowStr = new Date().toISOString();

  const rawImages: any[] = [];
  if (body.image_urls && Array.isArray(body.image_urls)) rawImages.push(...body.image_urls);
  if (body.images) {
    if (Array.isArray(body.images)) rawImages.push(...body.images);
    else if (typeof body.images === 'string') rawImages.push(body.images);
  }
  for (const f of ['image', 'image_url', 'product_image']) {
    if (body[f] && typeof body[f] === 'string' && body[f].trim()) {
      rawImages.push(body[f].trim());
    }
  }

  const images: ProductImage[] = [];
  if (rawImages.length > 0) {
    rawImages.forEach((item, idx) => {
      const url = typeof item === 'string' ? item : item?.image_url || item?.url || item?.src;
      if (url && String(url).trim()) {
        images.push({
          id: crypto.randomUUID(),
          product_id: prodId,
          image_url: String(url).trim(),
          alt_text: body.name || 'Product',
          display_order: idx + 1,
        });
      }
    });
  }
  if (images.length === 0) {
    images.push({
      id: crypto.randomUUID(),
      product_id: prodId,
      image_url: '/images/tulip_bouquet.jpg',
      alt_text: body.name || 'Product',
      display_order: 1,
    });
  }

  const primaryUrl = images[0].image_url;
  const stock = body.inventory_count ?? body.stock_quantity ?? 0;
  const comparePrice = body.compare_at_price ?? body.sale_price ?? null;
  const sku = body.sku || `AAAS-${prodId.slice(0, 6).toUpperCase()}`;
  const slug = body.slug || (body.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const productDict: Product = {
    id: prodId,
    name: body.name,
    slug,
    category_id: body.category_id || null,
    description: body.description || '',
    price: Number(body.price || 0),
    sale_price: comparePrice !== null ? Number(comparePrice) : null,
    compare_at_price: comparePrice !== null ? Number(comparePrice) : null,
    stock_quantity: Number(stock),
    inventory_count: Number(stock),
    low_stock_threshold: Number(body.low_stock_threshold ?? 3),
    sku,
    material: body.material || '100% Premium Milk Cotton Yarn',
    care_instructions: body.care_instructions || 'Spot clean gently with cold water. Air dry flat.',
    shipping_information: body.shipping_information || 'Dispatched in 2-4 business days.',
    tags: body.tags || [],
    is_active: body.is_active ?? true,
    is_featured: body.is_featured ?? false,
    is_customizable: body.is_customizable ?? false,
    is_bestseller: body.is_bestseller ?? false,
    is_new: body.is_new ?? false,
    specifications: body.specifications || [],
    images,
    image: primaryUrl,
    image_url: primaryUrl,
    product_image: primaryUrl,
    created_at: nowStr,
    updated_at: nowStr,
  };

  if (productDict.category_id && store.categories[productDict.category_id]) {
    productDict.category = store.categories[productDict.category_id];
  }

  if (supabaseClient) {
    try {
      const categoryVal = typeof productDict.category === 'string' && productDict.category
        ? productDict.category
        : (productDict.category?.name || productDict.category_id || 'Crochet');

      const dbDict: any = {
        id: productDict.id,
        name: productDict.name,
        slug: productDict.slug,
        description: productDict.description,
        price: productDict.price,
        sale_price: productDict.sale_price,
        compare_at_price: productDict.compare_at_price,
        category: categoryVal,
        image_url: primaryUrl,
        images: images.map((img: any) => (typeof img === 'string' ? img : img.image_url)),
        stock_quantity: productDict.stock_quantity ?? 0,
        inventory_count: productDict.inventory_count ?? productDict.stock_quantity ?? 0,
        low_stock_threshold: productDict.low_stock_threshold ?? 3,
        sku: productDict.sku,
        material: productDict.material,
        care_instructions: productDict.care_instructions,
        shipping_information: productDict.shipping_information,
        tags: productDict.tags || [],
        specifications: productDict.specifications || [],
        is_active: productDict.is_active ?? true,
        is_featured: productDict.is_featured ?? false,
        is_bestseller: productDict.is_bestseller ?? false,
        is_new: productDict.is_new ?? false,
        is_customizable: productDict.is_customizable ?? false,
        created_at: productDict.created_at,
        updated_at: productDict.updated_at,
      };
      await supabaseClient.from('products').insert(dbDict);
    } catch (e) {
      console.warn('Supabase product insert failed:', e);
    }
  }

  normalizeProductImages(productDict);
  store.products[prodId] = productDict;
  return c.json(productDict);
}

// 5. Product Creation (both /admin/products and /products)
productsRouter.post('/admin/products', handleCreateProduct);
productsRouter.post('/products', handleCreateProduct);

// Helper for product update
async function handleUpdateProduct(c: any) {
  const adminOrRes = await requireAdmin(c);
  if (adminOrRes instanceof Response) return adminOrRes;

  const productId = c.req.param('product_id') || c.req.param('id');
  const existing = await fetchProductRow(productId);
  if (!existing) {
    return c.json({ detail: 'Product not found' }, 404);
  }

  const body = await c.req.json();
  const rawUpdateImages: any[] = [];
  if (body.image_urls && Array.isArray(body.image_urls)) rawUpdateImages.push(...body.image_urls);
  if (body.images) {
    if (Array.isArray(body.images)) rawUpdateImages.push(...body.images);
    else if (typeof body.images === 'string') rawUpdateImages.push(body.images);
  }
  for (const f of ['image', 'image_url', 'product_image']) {
    if (body[f] && typeof body[f] === 'string' && body[f].trim()) {
      rawUpdateImages.push(body[f].trim());
    }
  }

  let updatedImages = existing.images || [];
  if (rawUpdateImages.length > 0) {
    const newImgs: ProductImage[] = [];
    rawUpdateImages.forEach((item, idx) => {
      const url = typeof item === 'string' ? item : item?.image_url || item?.url || item?.src;
      if (url && String(url).trim()) {
        newImgs.push({
          id: crypto.randomUUID(),
          product_id: productId,
          image_url: String(url).trim(),
          alt_text: body.name || existing.name || 'Product',
          display_order: idx + 1,
        });
      }
    });
    if (newImgs.length > 0) {
      updatedImages = newImgs;
    }
  }

  const stock = body.inventory_count ?? body.stock_quantity ?? existing.stock_quantity ?? 0;
  const comparePrice = body.compare_at_price !== undefined
    ? body.compare_at_price
    : (body.sale_price !== undefined ? body.sale_price : existing.compare_at_price ?? null);
  const price = body.price !== undefined ? Number(body.price) : existing.price;

  const updatedProd: Product = {
    ...existing,
    ...body,
    id: productId,
    price,
    sale_price: comparePrice !== null && comparePrice !== undefined ? Number(comparePrice) : null,
    compare_at_price: comparePrice !== null && comparePrice !== undefined ? Number(comparePrice) : null,
    stock_quantity: Number(stock),
    inventory_count: Number(stock),
    low_stock_threshold: Number(body.low_stock_threshold ?? existing.low_stock_threshold ?? 3),
    images: updatedImages,
    image: updatedImages[0]?.image_url || existing.image_url || '/images/tulip_bouquet.jpg',
    image_url: updatedImages[0]?.image_url || existing.image_url || '/images/tulip_bouquet.jpg',
    product_image: updatedImages[0]?.image_url || existing.image_url || '/images/tulip_bouquet.jpg',
    updated_at: new Date().toISOString(),
  };

  if (updatedProd.category_id && store.categories[updatedProd.category_id]) {
    updatedProd.category = store.categories[updatedProd.category_id];
  }

  normalizeProductImages(updatedProd);

  if (supabaseClient) {
    try {
      const categoryVal = typeof updatedProd.category === 'string' && updatedProd.category
        ? updatedProd.category
        : (updatedProd.category?.name || updatedProd.category_id || 'Crochet');

      const dbDict: any = {
        name: updatedProd.name,
        slug: updatedProd.slug,
        description: updatedProd.description,
        price: updatedProd.price,
        sale_price: updatedProd.sale_price,
        compare_at_price: updatedProd.compare_at_price,
        category: categoryVal,
        image_url: updatedProd.image_url || updatedProd.image,
        images: (updatedProd.images || []).map((img: any) => (typeof img === 'string' ? img : img.image_url)),
        stock_quantity: updatedProd.stock_quantity ?? 0,
        inventory_count: updatedProd.inventory_count ?? updatedProd.stock_quantity ?? 0,
        low_stock_threshold: updatedProd.low_stock_threshold ?? 3,
        sku: updatedProd.sku,
        material: updatedProd.material,
        care_instructions: updatedProd.care_instructions,
        shipping_information: updatedProd.shipping_information,
        tags: updatedProd.tags || [],
        specifications: updatedProd.specifications || [],
        is_active: updatedProd.is_active,
        is_featured: updatedProd.is_featured,
        is_bestseller: updatedProd.is_bestseller,
        is_new: updatedProd.is_new,
        is_customizable: updatedProd.is_customizable,
        updated_at: updatedProd.updated_at,
      };
      await supabaseClient.from('products').update(dbDict).eq('id', productId);
    } catch (e) {
      console.warn('Supabase product update failed:', e);
    }
  }

  store.products[productId] = updatedProd;
  return c.json(updatedProd);
}

// 6. Product Update (both /admin/products/:id and /products/:id)
productsRouter.put('/admin/products/:product_id', handleUpdateProduct);
productsRouter.put('/products/:product_id', handleUpdateProduct);

// 7. Inline status quick-toggle
productsRouter.patch('/admin/products/:product_id/status', async (c) => {
  const adminOrRes = await requireAdmin(c);
  if (adminOrRes instanceof Response) return adminOrRes;

  const productId = c.req.param('product_id');
  const existing = await fetchProductRow(productId);
  if (!existing) {
    return c.json({ detail: 'Product not found' }, 404);
  }

  const body = await c.req.json();
  const updated_at = new Date().toISOString();
  const prod: Product = {
    ...existing,
    updated_at,
  };
  if (body.is_active !== undefined) prod.is_active = Boolean(body.is_active);
  if (body.is_featured !== undefined) prod.is_featured = Boolean(body.is_featured);

  if (supabaseClient) {
    try {
      const dbUpd: any = { updated_at };
      if (body.is_active !== undefined) dbUpd.is_active = Boolean(body.is_active);
      if (body.is_featured !== undefined) dbUpd.is_featured = Boolean(body.is_featured);
      await supabaseClient.from('products').update(dbUpd).eq('id', productId);
    } catch (e) {
      console.warn('Supabase product status toggle error:', e);
    }
  }

  store.products[productId] = prod;
  return c.json(prod);
});

// 8. Delete product
productsRouter.delete('/admin/products/:product_id', async (c) => {
  const adminOrRes = await requireAdmin(c);
  if (adminOrRes instanceof Response) return adminOrRes;

  const productId = c.req.param('product_id');
  const existing = await fetchProductRow(productId);
  if (!existing) {
    return c.json({ detail: 'Product not found' }, 404);
  }

  if (supabaseClient) {
    try {
      await supabaseClient.from('products').delete().eq('id', productId);
    } catch (e) {
      console.warn('Supabase product delete failed:', e);
    }
  }

  if (store.products[productId]) {
    delete store.products[productId];
  }

  return c.json({ success: true, message: 'Product deleted successfully' });
});
