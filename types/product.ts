export interface Specification {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  title: string; // Legacy alias synced with name
  slug?: string;
  price: number;
  sale_price?: number | null;
  compare_at_price?: number | null;
  category: string;
  category_id?: string | null;
  description: string;
  image_url: string;
  images?: string[];
  is_featured: boolean;
  featured?: boolean; // Legacy alias
  is_customizable: boolean;
  customizable?: boolean; // Legacy alias
  is_active?: boolean;
  is_bestseller?: boolean;
  is_new?: boolean;
  stock_quantity?: number;
  inventory_count?: number;
  low_stock_threshold?: number;
  material?: string;
  care_instructions?: string;
  shipping_information?: string;
  tags?: string[];
  sku?: string;
  specifications?: Specification[];
  created_at?: string;
  updated_at?: string;
}
