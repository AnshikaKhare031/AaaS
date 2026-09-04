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

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

// Category
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  is_active: boolean;
  display_order: number;
  product_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryCreate {
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  display_order?: number;
}

export interface CategoryUpdate {
  name?: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  display_order?: number;
}

// Product
export interface ProductImage {
  id?: string;
  product_id?: string;
  image_url: string;
  alt_text?: string | null;
  display_order: number;
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  category_id?: string | null;
  category?: Category | null;
  name: string;
  slug: string;
  description: string;
  price: number;
  sale_price?: number | null;
  compare_at_price?: number | null;
  stock_quantity: number;
  inventory_count?: number;
  low_stock_threshold: number;
  sku?: string | null;
  material?: string | null;
  care_instructions?: string | null;
  shipping_information?: string | null;
  tags: string[];
  images: ProductImage[];
  image?: string | null;
  image_url?: string | null;
  product_image?: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_customizable?: boolean;
  is_bestseller: boolean;
  is_new: boolean;
  specifications?: ProductSpecification[];
  rating?: number;
  review_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductCreate {
  name: string;
  slug?: string;
  category_id?: string | null;
  description: string;
  price: number;
  sale_price?: number | null;
  compare_at_price?: number | null;
  stock_quantity?: number;
  inventory_count?: number;
  low_stock_threshold?: number;
  sku?: string | null;
  material?: string | null;
  care_instructions?: string | null;
  shipping_information?: string | null;
  tags?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  is_customizable?: boolean;
  is_bestseller?: boolean;
  is_new?: boolean;
  image_urls?: string[];
  images?: any;
  image?: string | null;
  image_url?: string | null;
  product_image?: string | null;
  specifications?: ProductSpecification[];
}

export interface ProductUpdate {
  name?: string;
  slug?: string;
  category_id?: string | null;
  description?: string;
  price?: number;
  sale_price?: number | null;
  compare_at_price?: number | null;
  stock_quantity?: number;
  inventory_count?: number;
  low_stock_threshold?: number;
  sku?: string | null;
  material?: string | null;
  care_instructions?: string | null;
  shipping_information?: string | null;
  tags?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  is_customizable?: boolean;
  is_bestseller?: boolean;
  is_new?: boolean;
  image_urls?: string[];
  images?: any;
  image?: string | null;
  image_url?: string | null;
  product_image?: string | null;
  specifications?: ProductSpecification[];
}

export interface ProductQuickStatusUpdate {
  is_active?: boolean;
  is_featured?: boolean;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  total_pages: number;
}

// Cart
export interface CartItem {
  id: string;
  user_id?: string | null;
  product_id: string;
  product: Product;
  quantity: number;
  created_at?: string;
}

// Wishlist
export interface WishlistItem {
  id: string;
  user_id?: string | null;
  product_id: string;
  product: Product;
  created_at?: string;
}

// Custom Order
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
  user_id?: string | null;
  name: string;
  email: string;
  phone: string;
  product_type: string;
  category?: string | null;
  color_preference?: string | null;
  size_dimensions?: string | null;
  quantity: number;
  budget?: number | null;
  description: string;
  images: string[];
  status: CustomOrderStatus | string;
  admin_notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CustomOrderCreate {
  name: string;
  email: string;
  phone: string;
  product_type: string;
  category?: string | null;
  color_preference?: string | null;
  size_dimensions?: string | null;
  quantity?: number;
  budget?: number | null;
  description: string;
  images?: string[];
}

export interface CustomOrderStatusUpdate {
  status: string;
  admin_notes?: string | null;
}

// Reviews
export interface Review {
  id: string;
  product_id: string;
  user_id?: string | null;
  order_id?: string | null;
  customer_name: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at?: string;
}

export interface ReviewCreate {
  product_id: string;
  customer_name: string;
  rating: number;
  comment: string;
}

export interface ReviewStatusUpdate {
  is_approved: boolean;
}

// Settings
export interface AdminSettings {
  id?: string;
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

export interface AdminSettingsUpdate {
  store_name?: string;
  store_email?: string;
  store_phone?: string;
  fixed_shipping_fee?: number;
  free_shipping_threshold?: number;
  enable_free_shipping?: boolean;
  low_stock_threshold?: number;
  currency?: string;
  currency_symbol?: string;
  instagram_url?: string;
  is_store_open?: boolean;
}

export interface OperationalAlert {
  type: string;
  title: string;
  description: string;
  action_link?: string | null;
}

export interface AdminDashboardOverviewResponse {
  total_orders: number;
  paid_orders: number;
  pending_orders: number;
  failed_payments: number;
  expired_payments: number;
  total_revenue: number;
  low_stock_count: number;
  total_products: number;
  recent_orders: Order[];
  payment_health: Record<string, number>;
  operational_alerts: OperationalAlert[];
  custom_order_count: number;
  pending_reviews_count: number;
}

export interface AdminDashboardMetrics {
  total_products: number;
  low_stock_count: number;
  total_customers: number;
  custom_order_count: number;
  pending_reviews_count: number;
}

// Orders & Payments
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'refunded';

export interface OrderItem {
  id: string;
  order_id?: string;
  product_id: string;
  product_name: string;
  product_image?: string | null;
  unit_price: number;
  price?: number;
  quantity: number;
  subtotal: number;
  total?: number;
}

export interface OrderItemCreate {
  product_id: string;
  quantity: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  items: OrderItem[];
  shipping_address: any;
  subtotal?: number;
  discount_amount: number;
  shipping_fee: number;
  total_amount: number;
  status: OrderStatus | string;
  payment_status: PaymentStatus | string;
  payment_method?: string | null;
  payment_id?: string | null;
  provider_order_id?: string | null;
  provider_payment_id?: string | null;
  payment_confirmation_sent_at?: string | null;
  carrier_name?: string | null;
  tracking_number?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrderCreate {
  items: OrderItemCreate[];
  shipping_address: any;
  discount_amount?: number;
  shipping_fee?: number;
  notes?: string | null;
}

export interface OrderStatusUpdatePayload {
  status: OrderStatus;
  carrier_name?: string | null;
  tracking_number?: string | null;
  notes?: string | null;
}

export interface PaymentCreateOrderRequest {
  order_id: string;
}

export interface PaymentCreateOrderResponse {
  order_id: string;
  provider_order_id: string;
  amount: number;
  currency: string;
  key_id: string;
}

export interface PaymentVerifyRequest {
  order_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentVerifyResponse {
  success: boolean;
  message: string;
  payment_status: PaymentStatus | string;
  order_id: string;
  order_number: string;
}

export interface PaymentRecoveryItem {
  order_id: string;
  order_number: string;
  previous_payment_status: string;
  new_payment_status: string;
  provider_payment_id?: string | null;
  reason: string;
}

export interface PaymentRecoverySweepResponse {
  scanned_count: number;
  recovered_paid: number;
  marked_failed_or_expired: number;
  unchanged: number;
  details: PaymentRecoveryItem[];
}

export interface PaymentRecord {
  id: string;
  order_id: string;
  gateway_order_id?: string | null;
  payment_id?: string | null;
  amount?: number;
  currency?: string;
  status: string;
  created_at?: string;
}

// Analytics
export type AnalyticsTimeRange = '7d' | '30d' | '90d' | 'ytd';

export interface AnalyticsTimelineItem {
  date: string;
  revenue: number;
  orders: number;
}

export interface AnalyticsCategoryItem {
  category: string;
  revenue: number;
  percentage: number;
  orders_count: number;
}

export interface AnalyticsTopProduct {
  id: string;
  name: string;
  image?: string | null;
  units_sold: number;
  revenue: number;
}

export interface AdminAnalyticsResponse {
  time_range: string;
  total_revenue: number;
  order_volume: number;
  aov: number;
  revenue_change_pct: number;
  order_volume_change_pct: number;
  aov_change_pct: number;
  timeline: AnalyticsTimelineItem[];
  category_breakdown: AnalyticsCategoryItem[];
  top_products: AnalyticsTopProduct[];
  payment_health?: Record<string, number>;
}

export interface AdminLoginPayload {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
}
