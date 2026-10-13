import { Product } from "./product";

export interface OrderItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  order_number: string;
  created_at: string;
  updated_at?: string;
  user_id?: string | null;
  customer_id?: string | null;
  
  // Real database customer fields
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  
  // Real database shipping fields
  shipping_name?: string;
  shipping_email?: string;
  shipping_phone?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_pincode?: string;
  shipping_country?: string;
  
  // Financial fields
  subtotal: number;
  shipping_fee?: number;
  discount_amount?: number;
  total: number;
  total_amount?: number;
  currency?: string;
  
  // Status & tracking fields
  payment_status: "pending" | "paid" | "failed" | "expired";
  order_status: "pending" | "processing" | "shipped" | "delivered";
  status?: string;
  tracking_number?: string | null;
  carrier_name?: string | null;
  notes?: string | null;
  
  // Provider fields
  provider_order_id?: string | null;
  provider_payment_id?: string | null;
  payment_id?: string | null;
  razorpay_payment_id?: string | null;
  razorpay_order_id?: string | null;
  payment_confirmation_sent_at?: string | null;

  // Embedded items
  items: OrderItem[];

  // Frontend compatibility aliases
  email: string;
  phone: string;
  house_flat?: string;
  street?: string;
  landmark?: string | null;
  city?: string;
  state?: string;
  pin_code?: string;
}


