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
  image?: string;
  units_sold: number;
  revenue: number;
}

export interface AdminAnalyticsResponse {
  time_range: AnalyticsTimeRange | string;
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

export interface OperationalAlert {
  type: string;
  title: string;
  description: string;
  action_link?: string;
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
  recent_orders: import('./order').Order[];
  payment_health: Record<string, number>;
  operational_alerts: OperationalAlert[];
  custom_order_count?: number;
  pending_reviews_count?: number;
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

export interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  category_id?: string;
  price: number;
  compare_at_price?: number | null;
  sale_price?: number | null;
  stock_quantity: number;
  inventory_count?: number;
  low_stock_threshold: number;
  sku?: string;
  material?: string;
  care_instructions?: string;
  shipping_information?: string;
  tags: string[];
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  is_customizable?: boolean;
  is_bestseller?: boolean;
  is_new?: boolean;
  specifications?: { label: string; value: string }[];
}
