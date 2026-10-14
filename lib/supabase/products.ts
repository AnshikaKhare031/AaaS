import { supabase } from "@/lib/supabase";
import { Product } from "@/types/product";

/**
 * Normalizes and parses the specifications field from the database to ensure it's always an array.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseProduct(product: any): Product {
  if (!product) return product;

  const name = product.name || product.title || "Untitled Creation";
  const imageUrl = product.image_url || (Array.isArray(product.images) && product.images[0]) || "";

  return {
    id: product.id,
    name,
    description: product.description || "",
    price: Number(product.price || 0),
    category: product.category || "Handbags",
    image_url: imageUrl,
    created_at: product.created_at,
    updated_at: product.updated_at,
    title: name,
    images: Array.isArray(product.images) && product.images.length > 0 ? product.images : (imageUrl ? [imageUrl] : []),
    is_active: product.is_active !== false,
  };
}

/**
 * Fetch all products from the products table, ordered by created_at desc.
 */
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    throw new Error(error.message);
  }

  return (data || []).map(parseProduct);
}

/**
 * Fetch active storefront products (is_active = true), ordered by created_at desc.
 */
export async function getActiveProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching active products:", error);
    throw new Error(error.message);
  }

  return (data || []).map(parseProduct);
}

/**
 * Fetch a single product by its UUID ID.
 */
export async function getProduct(id: string): Promise<Product | null> {
  if (!id) return null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid) return null;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw new Error(error.message);
  }

  return data ? parseProduct(data) : null;
}

/**
 * Create a new product.
 */
export async function createProduct(
  product: {
    name?: string;
    title?: string;
    description: string;
    price: number;
    category: string;
    image_url: string;
  } & Record<string, unknown>
): Promise<Product> {
  const name = (product.name || product.title || "").toString().trim();
  const price = Number(product.price || 0);
  const description = (product.description || "").toString().trim();
  const category = (product.category || "Handbags").toString().trim();
  const imageUrl = (product.image_url || (Array.isArray(product.images) ? product.images[0] : "") || "").toString().trim();

  const dbPayload = {
    name,
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
    console.error("Error creating product:", error);
    throw new Error(error.message);
  }

  return parseProduct(data);
}

/**
 * Update an existing product by ID.
 */
export async function updateProduct(
  id: string,
  product: {
    name?: string;
    title?: string;
    description?: string;
    price?: number;
    category?: string;
    image_url?: string;
  } & Record<string, unknown>
): Promise<Product> {
  const dbPayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (product.title !== undefined || product.name !== undefined) {
    dbPayload.name = (product.name || product.title || "").toString().trim();
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
    console.error(`Error updating product ${id}:`, error);
    throw new Error(error.message);
  }

  return parseProduct(data);
}


/**
 * Delete a product by ID.
 */
export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Error deleting product ${id}:`, error);
    throw new Error(error.message);
  }
}

/**
 * Upload an image file to the 'product-images' bucket in Supabase Storage.
 * Returns the public URL of the uploaded image.
 */
export async function uploadImage(file: File): Promise<string> {
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
  const filename = `${timestamp}_${sanitizedName}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(filename, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Error uploading image to storage:", error);
    throw new Error(error.message);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("product-images")
    .getPublicUrl(filename);

  return publicUrl;
}

/**
 * Delete an image from Supabase Storage by parsing the public URL.
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  if (!imageUrl) return;

  const parts = imageUrl.split("/product-images/");
  if (parts.length <= 1) {
    console.warn("Could not parse image filename from URL:", imageUrl);
    return;
  }

  const filename = decodeURIComponent(parts[1]);

  const { error } = await supabase.storage
    .from("product-images")
    .remove([filename]);

  if (error) {
    console.error("Error deleting image from storage:", error);
    throw new Error(error.message);
  }
}
