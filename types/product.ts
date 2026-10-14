export type ProductCategory = "Handbags" | "Keychains" | "Accessories";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory | string;
  image_url: string;
  created_at?: string;
  updated_at?: string;
  // Backward-compatible properties preserved for data-layer passthrough
  title?: string;
  images?: string[];
  is_active?: boolean;
}

