import { createServerSupabaseClient } from "./server";
import { Order } from "@/types/order";
import { expirePendingOrders } from "./expire-orders";

/**
 * Fetch all customer orders on the server, ordered by created_at desc.
 */
export async function getOrdersServer(): Promise<Order[]> {
  const supabase = createServerSupabaseClient();
  
  // Clean up any abandoned pending orders safely without crashing admin orders page
  try {
    await expirePendingOrders(supabase);
  } catch (sweepErr) {
    console.error("[Order Expiration Sweep] Error in sweep:", sweepErr);
  }

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


