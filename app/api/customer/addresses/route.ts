import { NextResponse } from "next/server";
import { createServerUserClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatAddressRow(row: any) {
  if (!row) return row;
  return {
    ...row,
    id: row.id,
    user_id: row.user_id,
    full_name: row.full_name,
    fullName: row.full_name,
    phone: row.phone,
    address_line1: row.address_line1,
    address_line2: row.address_line2,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    country: row.country || "India",
    is_default: Boolean(row.is_default),
    created_at: row.created_at,
    updated_at: row.updated_at,
    // Frontend compatibility aliases:
    house_flat: row.address_line1,
    street: row.address_line2 || "",
    landmark: row.address_line2 || null,
    pin_code: row.pincode,
  };
}

// GET /api/customer/addresses
export async function GET() {
  try {
    const supabase = await createServerUserClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const formattedAddresses = (data || []).map(formatAddressRow);
    return NextResponse.json({ success: true, addresses: formattedAddresses });
  } catch (error) {
    console.error("Fetch addresses error:", error);
    return NextResponse.json({ success: false, error: "Unable to fetch addresses." }, { status: 500 });
  }
}

// POST /api/customer/addresses
export async function POST(request: Request) {
  try {
    const supabase = await createServerUserClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const fullName = (body.fullName || body.full_name || "").toString().trim();
    const phone = (body.phone || "").toString().trim();
    const houseFlat = (body.houseFlat || body.house_flat || "").toString().trim();
    const street = (body.street || "").toString().trim();
    const landmark = (body.landmark || "").toString().trim();
    const city = (body.city || "").toString().trim();
    const state = (body.state || "").toString().trim();
    const pinCode = (body.pinCode || body.pin_code || body.pincode || "").toString().trim();
    const country = (body.country || "India").toString().trim();
    const isDefault = Boolean(body.isDefault ?? body.is_default ?? false);

    const addressLine1 = (
      body.address_line1 ||
      (houseFlat && street ? houseFlat : (houseFlat || street))
    ).toString().trim();

    const addressLine2 = body.address_line2 !== undefined
      ? (body.address_line2 ? body.address_line2.toString().trim() : null)
      : (houseFlat && street ? (landmark ? `${street}, ${landmark}` : street) : (landmark || null));

    if (!fullName || !phone || !addressLine1 || !city || !state || !pinCode) {
      return NextResponse.json({ success: false, error: "Missing required address fields." }, { status: 400 });
    }

    // If isDefault is true, set all other addresses for this user to is_default = false
    if (isDefault) {
      const { error: resetError } = await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);
      if (resetError) {
        console.error("Reset default addresses error:", resetError);
      }
    }

    const { data, error } = await supabase
      .from("addresses")
      .insert({
        user_id: user.id,
        full_name: fullName,
        phone: phone,
        address_line1: addressLine1,
        address_line2: addressLine2,
        city: city,
        state: state,
        pincode: pinCode,
        country: country,
        is_default: isDefault,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, address: formatAddressRow(data) });
  } catch (error) {
    console.error("Create address error:", error);
    return NextResponse.json({ success: false, error: "Unable to create address." }, { status: 500 });
  }
}

// PATCH /api/customer/addresses
export async function PATCH(request: Request) {
  try {
    const supabase = await createServerUserClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const id = body.id;

    if (!id) {
      return NextResponse.json({ success: false, error: "Address ID is required." }, { status: 400 });
    }

    // Verify address ownership first
    const { data: existingAddress, error: checkError } = await supabase
      .from("addresses")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (checkError || !existingAddress) {
      return NextResponse.json({ success: false, error: "Address not found or unauthorized." }, { status: 404 });
    }

    const isDefault = body.isDefault !== undefined ? Boolean(body.isDefault) : (body.is_default !== undefined ? Boolean(body.is_default) : undefined);

    // If isDefault is true, set all other addresses for this user to is_default = false
    if (isDefault) {
      const { error: resetError } = await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);
      if (resetError) {
        console.error("Reset default addresses error:", resetError);
      }
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.fullName !== undefined || body.full_name !== undefined) {
      updatePayload.full_name = (body.fullName || body.full_name || "").toString().trim();
    }
    if (body.phone !== undefined) {
      updatePayload.phone = body.phone.toString().trim();
    }
    if (body.address_line1 !== undefined) {
      updatePayload.address_line1 = body.address_line1.toString().trim();
    } else if (body.houseFlat !== undefined || body.house_flat !== undefined) {
      const hf = (body.houseFlat || body.house_flat || "").toString().trim();
      updatePayload.address_line1 = hf;
    }

    if (body.address_line2 !== undefined) {
      updatePayload.address_line2 = body.address_line2 ? body.address_line2.toString().trim() : null;
    } else if (body.street !== undefined || body.landmark !== undefined) {
      const street = (body.street || "").toString().trim();
      const landmark = (body.landmark || "").toString().trim();
      updatePayload.address_line2 = street ? (landmark ? `${street}, ${landmark}` : street) : (landmark || null);
    }

    if (body.city !== undefined) updatePayload.city = body.city.toString().trim();
    if (body.state !== undefined) updatePayload.state = body.state.toString().trim();
    if (body.pinCode !== undefined || body.pin_code !== undefined || body.pincode !== undefined) {
      updatePayload.pincode = (body.pinCode || body.pin_code || body.pincode || "").toString().trim();
    }
    if (body.country !== undefined) updatePayload.country = body.country.toString().trim();
    if (isDefault !== undefined) updatePayload.is_default = isDefault;

    const { data, error } = await supabase
      .from("addresses")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, address: formatAddressRow(data) });
  } catch (error) {
    console.error("Update address error:", error);
    return NextResponse.json({ success: false, error: "Unable to update address." }, { status: 500 });
  }
}

// DELETE /api/customer/addresses?id=uuid
export async function DELETE(request: Request) {
  try {
    const supabase = await createServerUserClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Address ID is required." }, { status: 400 });
    }

    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete address error:", error);
    return NextResponse.json({ success: false, error: "Unable to delete address." }, { status: 500 });
  }
}


