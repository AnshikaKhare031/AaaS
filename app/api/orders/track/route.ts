import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { expirePendingOrders } from "@/lib/supabase/expire-orders";
import { getCustomerSession } from "@/lib/auth/customer-session-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, email } = body;

    // 1. Validation: check that both parameters exist
    if (!orderNumber || !email) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    const trimmedOrderNumber = orderNumber.trim();
    const trimmedEmail = email.trim();

    if (trimmedOrderNumber === "" || trimmedEmail === "") {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Clean up any abandoned pending orders
    await expirePendingOrders(supabase);

    const customerSession = await getCustomerSession();
    if (!customerSession) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in to track orders." },
        { status: 401 }
      );
    }

    // 2. Query Supabase: match both order_number and email case-insensitively using real schema columns
    // We select only tracking-relevant fields. Never expose signatures, IDs, or metadata.
    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        created_at,
        customer_name,
        customer_email,
        customer_phone,
        shipping_name,
        shipping_email,
        shipping_phone,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_pincode,
        shipping_country,
        items,
        subtotal,
        shipping_fee,
        total,
        payment_status,
        order_status,
        status,
        tracking_number
      `)
      .eq("order_number", trimmedOrderNumber)
      .eq("user_id", customerSession.user.id)
      .or(`customer_email.ilike.${trimmedEmail},shipping_email.ilike.${trimmedEmail}`)
      .maybeSingle();

    if (error) {
      console.error("Database error during order tracking:", error);
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    // 3. Prevent information leak (never return 200 with empty data)
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    const mappedOrder = {
      ...order,
      email: order.customer_email || order.shipping_email || "",
      phone: order.customer_phone || order.shipping_phone || "",
      house_flat: order.shipping_address || "",
      street: "",
      landmark: null,
      city: order.shipping_city || "",
      state: order.shipping_state || "",
      pin_code: order.shipping_pincode || "",
    };

    return NextResponse.json({
      success: true,
      order: mappedOrder,
    });

  } catch (err: unknown) {
    console.error("Tracking API error:", err);
    return NextResponse.json(
      { success: false, error: "Order not found." },
      { status: 404 }
    );
  }
}
