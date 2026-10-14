import { createServerSupabaseClient } from "./server";
import { Product } from "@/types/product";

/**
 * Normalizes and parses the specifications field from the database to ensure it's always an array.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseProduct(product: any): Product {
  if (!product) return product;

  const name = product.name || product.title || "Untitled Creation";
  const slug = product.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const imageUrl = product.image_url || (Array.isArray(product.images) && product.images[0]) || "";

  return {
    id: product.id,
    name,
    description: product.description || "",
    price: Number(product.price || 0),
    category: product.category || "Handbags",
    image_url: imageUrl,
    slug,
    created_at: product.created_at,
    updated_at: product.updated_at,
    title: name,
    images: Array.isArray(product.images) && product.images.length > 0 ? product.images : (imageUrl ? [imageUrl] : []),
    is_active: product.is_active !== false,
  };
}

/**
 * Helper to safely generate a unique slug to prevent collisions.
 */
async function generateUniqueSlug(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  name: string
): Promise<string> {
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "product";
  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("slug", baseSlug)
    .maybeSingle();

  if (!existing) {
    return baseSlug;
  }
  return `${baseSlug}-${Date.now().toString().slice(-6)}`;
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
 * Create a new product on the server with minimum viable attributes:
 * Name, Description, Price, Category, and Image.
 */
export async function createProductServer(
  product: {
    name: string;
    description: string;
    price: number;
    category: string;
    image_url: string;
    slug?: string;
  } & Record<string, unknown>
): Promise<Product> {
  const supabase = createServerSupabaseClient();
  const name = (product.name || "").toString().trim();
  const slug = product.slug || (await generateUniqueSlug(supabase, name));
  const price = Number(product.price || 0);
  const description = (product.description || "").toString().trim();
  const category = (product.category || "Handbags").toString().trim();
  const imageUrl = (product.image_url || "").toString().trim();

  const dbPayload = {
    name,
    slug,
    description,
    price,
    category,
    image_url: imageUrl,
    images: [imageUrl],
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
 * Update an existing product by ID on the server preserving unedited fields.
 */
export async function updateProductServer(
  id: string,
  product: {
    name?: string;
    description?: string;
    price?: number;
    category?: string;
    image_url?: string;
  } & Record<string, unknown>
): Promise<Product> {
  const supabase = createServerSupabaseClient();
  const dbPayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (product.name !== undefined || (product as Record<string, unknown>).title !== undefined) {
    dbPayload.name = (product.name || (product as Record<string, unknown>).title || "").toString().trim();
  }
  if (product.description !== undefined) {
    dbPayload.description = product.description.toString().trim();
  }
  if (product.price !== undefined) {
    dbPayload.price = Number(product.price);
  }
  if (product.category !== undefined) {
    dbPayload.category = product.category.toString().trim();
  }
  if (product.image_url !== undefined) {
    const img = product.image_url.toString().trim();
    dbPayload.image_url = img;
    dbPayload.images = [img];
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
