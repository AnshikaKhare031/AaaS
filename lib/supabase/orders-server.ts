import { createServerSupabaseClient } from "./server";
import { Order } from "@/types/order";

/**
 * Fetch all customer orders on the server, ordered by created_at desc.
 * Note: Order expiration sweeps are decoupled and handled asynchronously via /api/cron/expire-orders.
 */
export async function getOrdersServer(): Promise<Order[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Server error fetching orders:", error);
    throw new Error(error.message);
  }

  // Cast and normalize return type safely
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((o: any) => ({
    ...o,
    customer_name: o.customer_name || o.shipping_name || "Customer",
    email: o.email || o.customer_email || o.shipping_email || "",
    phone: o.phone || o.customer_phone || o.shipping_phone || "",
    house_flat: o.house_flat || o.shipping_address || "",
    street: o.street || "",
    city: o.city || o.shipping_city || "",
    state: o.state || o.shipping_state || "",
    pin_code: o.pin_code || o.shipping_pincode || "",
  })) as Order[];
}


