export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'completed' | 'failed' | 'expired' | 'refunded';

export type PaymentMethod = 'razorpay' | 'cod' | 'upi';

export interface OrderItem {
  id: string;
  order_id?: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  unit_price: number;
  price?: number;
  quantity: number;
  subtotal: number;
  total?: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  items: OrderItem[];
  shipping_address: any;
  subtotal?: number;
  discount_amount?: number;
  shipping_fee: number;
  total_amount: number;
  status: OrderStatus;
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod | string;
  payment_id?: string;
  provider_order_id?: string;
  provider_payment_id?: string;
  payment_confirmation_sent_at?: string;
  carrier_name?: string;
  tracking_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderStatusUpdatePayload {
  status: OrderStatus;
  carrier_name?: string;
  tracking_number?: string;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  order_id: string;
  payment_gateway: string;
  gateway_order_id?: string;
  payment_id?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  created_at?: string;
}

export interface CreateOrderItemPayload {
  product_id: string;
  quantity: number;
}

export interface CreateOrderPayload {
  items: CreateOrderItemPayload[];
  shipping_address: any;
  discount_amount?: number;
  shipping_fee?: number;
  notes?: string;
}
