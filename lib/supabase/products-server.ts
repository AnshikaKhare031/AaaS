import { createServerSupabaseClient } from "./server";
import { Product } from "@/types/product";

/**
 * Normalizes and parses the specifications field from the database to ensure it's always an array.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseProduct(product: any): Product {
  if (!product) return product;
  let specifications = product.specifications;
  if (typeof specifications === "string") {
    try {
      specifications = JSON.parse(specifications);
    } catch {
      specifications = [];
    }
  }

  const name = product.name || product.title || "Untitled Creation";
  const slug = product.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const is_featured = typeof product.is_featured === "boolean" ? product.is_featured : !!product.featured;
  const is_customizable = typeof product.is_customizable === "boolean" ? product.is_customizable : !!product.customizable;
  const stock = typeof product.stock_quantity === "number" ? product.stock_quantity : (product.inventory_count ?? 10);
  const imageUrl = product.image_url || (Array.isArray(product.images) && product.images[0]) || "";

  return {
    ...product,
    name,
    title: name,
    slug,
    category: product.category || "Handbags",
    image_url: imageUrl,
    images: Array.isArray(product.images) && product.images.length > 0 ? product.images : (imageUrl ? [imageUrl] : []),
    featured: is_featured,
    is_featured,
    customizable: is_customizable,
    is_customizable,
    stock_quantity: stock,
    inventory_count: stock,
    is_active: product.is_active !== false,
    specifications: Array.isArray(specifications) ? specifications : [],
  };
}

/**
 * Fetch all products from the products table on the server, ordered by created_at desc.
 */
export async function getProductsServer(): Promise<Product[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Server error fetching products:", error);
    throw new Error(error.message);
  }

  return (data || []).map(parseProduct);
}

/**
 * Fetch all active storefront products from the products table on the server (is_active = true).
 */
export async function getActiveProductsServer(): Promise<Product[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Server error fetching active products:", error);
    throw new Error(error.message);
  }

  return (data || []).map(parseProduct);
}

/**
 * Fetch a single product by its ID or slug on the server.
 */
export async function getProductServer(idOrSlug: string): Promise<Product | null> {
  const supabase = createServerSupabaseClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  const query = supabase.from("products").select("*");
  const { data, error } = isUuid
    ? await query.eq("id", idOrSlug).maybeSingle()
    : await query.eq("slug", idOrSlug).maybeSingle();

  if (error) {
    console.error(`Server error fetching product ${idOrSlug}:`, error);
    throw new Error(error.message);
  }

  return data ? parseProduct(data) : null;
}

/**
 * Create a new product on the server with real database column mappings.
 */
export async function createProductServer(
  product: Partial<Product> & Record<string, unknown>
): Promise<Product> {
  const supabase = createServerSupabaseClient();
  const name = (product.name || product.title || "Untitled Creation").toString().trim();
  const slug = (product.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")) || `product-${Date.now()}`;
  const price = Number(product.price || 0);
  const is_featured = Boolean(product.is_featured ?? product.featured ?? false);
  const is_customizable = Boolean(product.is_customizable ?? product.customizable ?? false);
  const is_active = product.is_active !== false;
  const stock = Number(product.stock_quantity ?? product.inventory_count ?? 10);
  const low_stock_threshold = Number(product.low_stock_threshold ?? 3);
  const imageUrl = (product.image_url || (Array.isArray(product.images) ? product.images[0] : "") || "").toString().trim();
  const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : (imageUrl ? [imageUrl] : []);

  const dbPayload = {
    name,
    slug,
    description: (product.description || "").toString(),
    price,
    sale_price: product.sale_price !== undefined && product.sale_price !== null ? Number(product.sale_price) : null,
    category: (product.category || "Handbags").toString(),
    image_url: imageUrl,
    images,
    is_active,
    is_featured,
    is_bestseller: Boolean(product.is_bestseller ?? false),
    is_new: Boolean(product.is_new ?? false),
    is_customizable,
    stock_quantity: stock,
    inventory_count: stock,
    low_stock_threshold,
    specifications: Array.isArray(product.specifications) ? product.specifications : [],
  };

  const { data, error } = await supabase
    .from("products")
    .insert([dbPayload])
    .select()
    .single();

  if (error) {
    console.error("Server error creating product:", error);
    throw new Error(error.message);
  }

  return parseProduct(data);
}

/**
 * Update an existing product by ID on the server with real database column mappings.
 */
export async function updateProductServer(
  id: string,
  product: Partial<Product> & Record<string, unknown>
): Promise<Product> {
  const supabase = createServerSupabaseClient();
  const dbPayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (product.title !== undefined || product.name !== undefined) {
    const name = (product.name || product.title || "").toString().trim();
    dbPayload.name = name;
  }
  if (product.slug !== undefined) dbPayload.slug = product.slug;
  if (product.description !== undefined) dbPayload.description = product.description;
  if (product.price !== undefined) dbPayload.price = Number(product.price);
  if (product.sale_price !== undefined) dbPayload.sale_price = product.sale_price !== null ? Number(product.sale_price) : null;
  if (product.category !== undefined) dbPayload.category = product.category;
  if (product.image_url !== undefined) {
    dbPayload.image_url = product.image_url;
    if (!product.images && product.image_url) {
      dbPayload.images = [product.image_url];
    }
  }
  if (product.images !== undefined) dbPayload.images = product.images;
  if (product.featured !== undefined || product.is_featured !== undefined) {
    dbPayload.is_featured = Boolean(product.is_featured ?? product.featured);
  }
  if (product.customizable !== undefined || product.is_customizable !== undefined) {
    dbPayload.is_customizable = Boolean(product.is_customizable ?? product.customizable);
  }
  if (product.is_active !== undefined) dbPayload.is_active = Boolean(product.is_active);
  if (product.stock_quantity !== undefined || product.inventory_count !== undefined) {
    const stock = Number(product.stock_quantity ?? product.inventory_count);
    dbPayload.stock_quantity = stock;
    dbPayload.inventory_count = stock;
  }
  if (product.low_stock_threshold !== undefined) {
    dbPayload.low_stock_threshold = Number(product.low_stock_threshold);
  }
  if (product.specifications !== undefined) {
    dbPayload.specifications = Array.isArray(product.specifications) ? product.specifications : [];
  }

  const { data, error } = await supabase
    .from("products")
    .update(dbPayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Server error updating product ${id}:`, error);
    throw new Error(error.message);
  }

  return parseProduct(data);
}


/**
 * Delete a product by ID on the server.
 */
export async function deleteProductServer(id: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Server error deleting product ${id}:`, error);
    throw new Error(error.message);
  }
}

/**
 * Upload an image file to the 'product-images' bucket in Supabase Storage on the server.
 * Returns the public URL of the uploaded image.
 */
export async function uploadImageServer(
  fileBuffer: Buffer | ArrayBuffer,
  filename: string,
  contentType: string
): Promise<string> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.storage
    .from("product-images")
    .upload(filename, fileBuffer, {
      contentType,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Server error uploading image to storage:", error);
    throw new Error(error.message);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("product-images")
    .getPublicUrl(filename);

  return publicUrl;
}

/**
 * Delete an image from Supabase Storage by parsing the public URL on the server.
 */
export async function deleteImageServer(imageUrl: string): Promise<void> {
  if (!imageUrl) return;

  const parts = imageUrl.split("/product-images/");
  if (parts.length <= 1) {
    console.warn("Could not parse image filename from URL on server:", imageUrl);
    return;
  }

  const filename = decodeURIComponent(parts[1]);
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.storage
    .from("product-images")
    .remove([filename]);

  if (error) {
    console.error("Server error deleting image from storage:", error);
    throw new Error(error.message);
  }
}
