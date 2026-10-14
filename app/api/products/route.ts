import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/utils/auth";
import { getProductsServer, createProductServer } from "@/lib/supabase/products-server";
import { revalidatePath } from "next/cache";
import { getCategoryPath, getCanonicalCategoryName } from "@/lib/constants/categories";

export async function GET() {
  try {
    const products = await getProductsServer();
    return NextResponse.json(products);
  } catch (err) {
    console.error("GET /api/products error:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to fetch products";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const resolvedName = (body.name || body.title || "").toString().trim();
    const description = (body.description || "").toString().trim();
    const numericPrice = Number(body.price);
    const canonicalCategory = getCanonicalCategoryName(body.category || "");
    const imageUrl = (body.image_url || (Array.isArray(body.images) ? body.images[0] : "") || "").toString().trim();

    if (!resolvedName) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ error: "Product description is required" }, { status: 400 });
    }

    if (isNaN(numericPrice) || numericPrice <= 0) {
      return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });
    }

    if (!canonicalCategory) {
      return NextResponse.json(
        { error: "Category must be one of: Handbags, Keychains, Accessories" },
        { status: 400 }
      );
    }

    if (!imageUrl) {
      return NextResponse.json({ error: "Product image is required" }, { status: 400 });
    }

    const newProduct = await createProductServer({
      name: resolvedName,
      description,
      price: numericPrice,
      category: canonicalCategory,
      image_url: imageUrl,
    });

    // Invalidate caches to ensure storefront is immediately updated
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(getCategoryPath(canonicalCategory));
    revalidatePath("/admin/products");

    return NextResponse.json(newProduct, { status: 201 });
  } catch (err) {
    console.error("POST /api/products error:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to create product";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


