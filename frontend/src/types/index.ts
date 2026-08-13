export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  display_order?: number;
  product_count?: number;
  created_at?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string;
  display_order: number;
}

export interface Product {
  id: string;
  category_id?: string;
  category?: Category;
  name: string;
  slug: string;
  description: string;
  price: number;
  sale_price?: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  material: string;
  care_instructions: string;
  shipping_information: string;
  tags: string[];
  images: ProductImage[];
  is_active: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new: boolean;
  rating?: number;
  review_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  id: string;
  product_id: string;
  product: Product;
  quantity: number;
}

export interface WishlistItem {
  id: string;
  product_id: string;
  product: Product;
  created_at?: string;
}

export interface Address {
  id?: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default?: boolean;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id: string;
  order_id?: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  user_id?: string;
  order_number: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  currency: string;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  shipping_name: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  shipping_country: string;
  tracking_number?: string;
  notes?: string;
  items: OrderItem[];
  payment?: PaymentRecord;
  created_at: string;
  updated_at?: string;
}

export interface PaymentRecord {
  id?: string;
  order_id: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded';
  error_message?: string;
}

export type CustomOrderStatus =
  | 'new'
  | 'reviewing'
  | 'accepted'
  | 'in_production'
  | 'completed'
  | 'rejected';

export interface CustomOrder {
  id: string;
  request_id: string;
  user_id?: string;
  name: string;
  email: string;
  phone: string;
  product_type: string;
  category?: string;
  color_preference?: string;
  size_dimensions?: string;
  quantity: number;
  budget?: number;
  description: string;
  status: CustomOrderStatus;
  images?: string[];
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id?: string;
  customer_name: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
}

export interface AdminSettings {
  id: string;
  store_name: string;
  store_email: string;
  store_phone: string;
  fixed_shipping_fee: number;
  free_shipping_threshold: number;
  enable_free_shipping: boolean;
  low_stock_threshold: number;
  currency: string;
  currency_symbol: string;
  instagram_url: string;
  is_store_open: boolean;
  updated_at?: string;
}

export interface AdminDashboardMetrics {
  total_revenue: number;
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_products: number;
  low_stock_count: number;
  total_customers: number;
  custom_order_count: number;
  recent_orders: Order[];
  revenue_trend: { date: string; amount: number }[];
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}
