import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/utils/auth";
import { updateProductServer, deleteProductServer, getProductServer, deleteImageServer } from "@/lib/supabase/products-server";
import { revalidatePath } from "next/cache";
import { getCategoryPath, getCanonicalCategoryName } from "@/lib/constants/categories";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  let id = "";
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    id = (await params).id;
    const body = await request.json();

    const sanitizedUpdate: {
      name?: string;
      description?: string;
      price?: number;
      category?: string;
      image_url?: string;
    } = {};

    if (body.name !== undefined || body.title !== undefined) {
      const name = (body.name || body.title || "").toString().trim();
      if (!name) {
        return NextResponse.json({ error: "Product name cannot be empty" }, { status: 400 });
      }
      sanitizedUpdate.name = name;
    }

    if (body.description !== undefined) {
      const description = body.description.toString().trim();
      if (!description) {
        return NextResponse.json({ error: "Product description cannot be empty" }, { status: 400 });
      }
      sanitizedUpdate.description = description;
    }

    if (body.price !== undefined) {
      const priceNum = Number(body.price);
      if (isNaN(priceNum) || priceNum <= 0) {
        return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });
      }
      sanitizedUpdate.price = priceNum;
    }

    if (body.category !== undefined) {
      const canonical = getCanonicalCategoryName(body.category);
      if (!canonical) {
        return NextResponse.json(
          { error: "Category must be one of: Handbags, Keychains, Accessories" },
          { status: 400 }
        );
      }
      sanitizedUpdate.category = canonical;
    }

    if (body.image_url !== undefined) {
      const img = body.image_url.toString().trim();
      if (!img) {
        return NextResponse.json({ error: "Image URL cannot be empty" }, { status: 400 });
      }
      sanitizedUpdate.image_url = img;
    }

    // Fetch existing product to get old image url
    const oldProduct = await getProductServer(id);

    // Update product
    const updatedProduct = await updateProductServer(id, sanitizedUpdate);

    // If update succeeded and image changed, delete old image from storage
    if (oldProduct && sanitizedUpdate.image_url && oldProduct.image_url !== sanitizedUpdate.image_url) {
      try {
        await deleteImageServer(oldProduct.image_url);
      } catch (err) {
        console.warn("Failed to delete old image from storage on server during update:", err);
      }
    }

    // Invalidate caches to ensure storefront is immediately updated
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/product/${id}`);
    revalidatePath(getCategoryPath(updatedProduct.category));
    if (oldProduct && oldProduct.category !== updatedProduct.category) {
      revalidatePath(getCategoryPath(oldProduct.category));
    }
    revalidatePath("/admin/products");

    return NextResponse.json(updatedProduct);
  } catch (err) {
    console.error(`PUT /api/products/${id} error:`, err);
    const errorMessage = err instanceof Error ? err.message : "Failed to update product";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  let id = "";
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    id = (await params).id;

    // Fetch product to find its image_url before deleting
    const product = await getProductServer(id);

    // Delete from database
    await deleteProductServer(id);

    // Clean up image from storage if it exists
    if (product?.image_url) {
      try {
        await deleteImageServer(product.image_url);
      } catch (err) {
        console.warn("Failed to delete product image from storage on server:", err);
      }
    }

    // Invalidate caches to ensure storefront is immediately updated
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/product/${id}`);
    if (product) {
      revalidatePath(getCategoryPath(product.category));
    }
    revalidatePath("/admin/products");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`DELETE /api/products/${id} error:`, err);
    const errorMessage = err instanceof Error ? err.message : "Failed to delete product";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
