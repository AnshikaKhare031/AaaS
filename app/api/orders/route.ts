import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, ensureCustomerProfile } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { getCustomerSession } from "@/lib/auth/customer-session-server";
import { getActiveProductsServer } from "@/lib/supabase/products-server";
import { calculateShipping } from "@/lib/shipping";

// Helper to generate a sequential order number
async function generateOrderNumber(supabase: SupabaseClient): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("order_number")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching latest order number:", error);
      // Safe fallback using timestamp slice in case query fails
      return `AAAS-${Date.now().toString().slice(-6)}`;
    }

    if (!data || !data.order_number) {
      return "AAAS-1001";
    }

    // Match sequential order numbers in format AAAS-XXXX or legacy CM-XXXX
    const match = data.order_number.match(/(?:AAAS|CM)-(\d+)/);
    if (match) {
      const lastNum = parseInt(match[1], 10);
      return `AAAS-${lastNum + 1}`;
    }

    return "AAAS-1001";
  } catch (err) {
    console.error("Failed to generate order number:", err);
    return `AAAS-${Date.now().toString().slice(-6)}`;
  }
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer, address, items } = body;
    const customerSession = await getCustomerSession();

    if (!customerSession) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Guest checkout is not allowed." },
        { status: 401 }
      );
    }

    // 1. Validation: Required customer fields exist
    if (!customer || !customer.fullName || !customer.email || !customer.phone) {
      return NextResponse.json(
        { success: false, error: "Missing customer information (fullName, email, phone)." },
        { status: 400 }
      );
    }

    // 2. Validation: Required shipping address fields exist
    if (
      !address ||
      !address.houseFlat ||
      !address.street ||
      !address.city ||
      !address.state ||
      !address.pinCode
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required shipping address details." },
        { status: 400 }
      );
    }

    // 3. Validation: Items array is not empty
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Items list cannot be empty." },
        { status: 400 }
      );
    }

    // 4. Trust only the product ID and quantity from the client. Price, title,
    // and every other product detail is re-fetched from the database so that
    // the amount actually charged can never be set by the request body.
    const requestedItems = items.map((item: { product?: { id?: string }; quantity?: number }) => ({
      productId: item?.product?.id,
      quantity: Number(item?.quantity),
    }));

    const hasInvalidItem = requestedItems.some(
      ({ productId, quantity }) =>
        !productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99
    );

    if (hasInvalidItem) {
      return NextResponse.json(
        { success: false, error: "One or more items in the cart are invalid." },
        { status: 400 }
      );
    }

    const catalogProducts = await getActiveProductsServer();
    const productById = new Map(catalogProducts.map((product) => [product.id, product]));

    const verifiedItems: { product: (typeof catalogProducts)[number]; quantity: number }[] = [];
    for (const { productId, quantity } of requestedItems) {
      const product = productById.get(productId as string);
      if (!product || product.is_active === false) {
        return NextResponse.json(
          { success: false, error: "One or more items in the cart are no longer available." },
          { status: 400 }
        );
      }
      verifiedItems.push({ product, quantity });
    }

    const subtotal = verifiedItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const total = subtotal + calculateShipping(subtotal);

    // Create the server-side Supabase client using Service Role key
    const supabase = createServerSupabaseClient();

    // Ensure profile row exists for verified session before insert to satisfy orders_user_id_fkey
    await ensureCustomerProfile(
      customerSession.user.id,
      customerSession.user.email,
      customer.fullName || customerSession.user.fullName
    );

    // Insert order into Supabase with retry logic for unique constraint violations
    let insertedOrder = null;
    let insertError = null;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      attempts++;
      // Generate sequential order number
      const orderNumber = await generateOrderNumber(supabase);

      const shippingAddressStr = (
        address.shipping_address ||
        [address.houseFlat, address.street, address.landmark].filter(Boolean).join(", ") ||
        address.address_line1 ||
        ""
      ).trim();
      const shippingCity = (address.shipping_city || address.city || "").trim();
      const shippingState = (address.shipping_state || address.state || "").trim();
      const shippingPincode = (address.shipping_pincode || address.pinCode || address.pincode || "").trim();
      const shippingCountry = (address.shipping_country || address.country || "India").trim();
      const shippingFee = calculateShipping(subtotal);

      // Prepare Database Record structure matching live orders schema
      const orderRecord = {
        order_number: orderNumber,
        user_id: customerSession.user.id,
        customer_id: customerSession.user.id,
        customer_name: customer.fullName.trim(),
        customer_email: customer.email.trim(),
        customer_phone: customer.phone.trim(),
        shipping_name: customer.fullName.trim(),
        shipping_email: customer.email.trim(),
        shipping_phone: customer.phone.trim(),
        shipping_address: shippingAddressStr,
        shipping_city: shippingCity,
        shipping_state: shippingState,
        shipping_pincode: shippingPincode,
        shipping_country: shippingCountry,
        items: verifiedItems, // Server-verified against the products table, never trusted from the client
        subtotal: subtotal,
        shipping_fee: shippingFee,
        discount_amount: 0,
        total: total,
        total_amount: total,
        currency: "INR",
        payment_status: "pending",
        order_status: "pending",
        status: "pending",
      };

      const { data, error } = await supabase
        .from("orders")
        .insert([orderRecord])
        .select("id, order_number")
        .single();


      if (error) {
        insertError = error;
        // Check for Postgres unique key violation (23505)
        if (error.code === "23505") {
          console.warn(`Order number collision detected on attempt ${attempts} (order_number: ${orderNumber}). Retrying...`);
          // Small delay before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));
          continue;
        }
        break;
      }

      insertedOrder = data;
      insertError = null;
      break;
    }

    if (insertError || !insertedOrder) {
      console.error("Failed to insert order in Supabase after multiple attempts:", insertError);
      return NextResponse.json(
        { success: false, error: "Internal server error. Failed to save order record." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: insertedOrder.id,
      orderNumber: insertedOrder.order_number,
    });
  } catch (err) {
    console.error("Server-side error in order creation API:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error. Processing failed." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, payment_status, customer, address } = body;
    const customerSession = await getCustomerSession();

    if (!customerSession) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    if (!orderId || !payment_status) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: orderId and payment_status." },
        { status: 400 }
      );
    }

    const allowedPaymentStatuses = ["pending", "failed", "expired"];
    if (!allowedPaymentStatuses.includes(payment_status)) {
      return NextResponse.json(
        { success: false, error: "Invalid payment_status. Can only transition to pending, failed, or expired." },
        { status: 400 }
      );
    }

    const updateFields: Record<string, unknown> = {
      payment_status,
      updated_at: new Date().toISOString(),
    };

    if (customer) {
      if (customer.fullName) {
        updateFields.customer_name = customer.fullName.trim();
        updateFields.shipping_name = customer.fullName.trim();
      }
      if (customer.email) {
        updateFields.customer_email = customer.email.trim();
        updateFields.shipping_email = customer.email.trim();
      }
      if (customer.phone) {
        updateFields.customer_phone = customer.phone.trim();
        updateFields.shipping_phone = customer.phone.trim();
      }
    }

    if (address) {
      const addrStr = (
        address.shipping_address ||
        [address.houseFlat, address.street, address.landmark].filter(Boolean).join(", ") ||
        address.address_line1 ||
        ""
      ).trim();
      if (addrStr) updateFields.shipping_address = addrStr;
      if (address.city || address.shipping_city) {
        updateFields.shipping_city = (address.city || address.shipping_city).trim();
      }
      if (address.state || address.shipping_state) {
        updateFields.shipping_state = (address.state || address.shipping_state).trim();
      }
      const pin = address.pinCode || address.pincode || address.shipping_pincode;
      if (pin) updateFields.shipping_pincode = pin.trim();
    }


    const supabase = createServerSupabaseClient();

    // Check existing order status to prevent late failure or retry updates from overwriting a verified 'paid' status
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id, order_number, payment_status")
      .eq("id", orderId)
      .eq("user_id", customerSession.user.id)
      .maybeSingle();

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    if (existingOrder.payment_status === "paid") {
      // Never overwrite a verified paid status with pending/failed/expired
      return NextResponse.json({
        success: true,
        order: existingOrder,
        message: "Order is already paid; payment status transition ignored.",
      });
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update(updateFields)
      .eq("id", orderId)
      .eq("user_id", customerSession.user.id)
      .neq("payment_status", "paid")
      .select("id, order_number, payment_status")
      .maybeSingle();

    if (updateError) {
      console.error("Failed to update order payment status:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update order payment record." },
        { status: 500 }
      );
    }

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder
    });
  } catch (err) {
    console.error("Error in PATCH /api/orders:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
