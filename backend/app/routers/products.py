import uuid
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.schemas.schemas import (
    Product, ProductCreate, ProductUpdate, ProductListResponse
)
from app.database import store, supabase_client
from app.utils.security import require_admin

router = APIRouter(tags=["Products"])

@router.get("/products", response_model=ProductListResponse)
async def list_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: Optional[str] = Query("featured", description="featured, newest, price_asc, price_desc, bestseller"),
    in_stock: Optional[bool] = None,
    featured: Optional[bool] = None,
    bestseller: Optional[bool] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Search, filter, sort, and paginate through products catalog.
    """
    # 1. Fetch from Supabase if available
    products_list = []
    if supabase_client:
        try:
            query = supabase_client.table("products").select("*, categories(*), product_images(*)")
            query = query.eq("is_active", True)
            res = query.execute()
            if res.data:
                for row in res.data:
                    cat = row.get("categories")
                    imgs = row.get("product_images", [])
                    products_list.append({
                        **row,
                        "category": cat,
                        "images": imgs if imgs else [{"image_url": "/images/tulip_bouquet.jpg"}]
                    })
        except Exception as e:
            print(f"Supabase products fetch failed: {e}. Using local store.")
            products_list = []

    # 2. Fallback to store
    if not products_list:
        products_list = list(store.products.values())
        for p in products_list:
            if "category" not in p or not p["category"]:
                cat_id = p.get("category_id")
                if cat_id and cat_id in store.categories:
                    p["category"] = store.categories[cat_id]

    # Filter is_active
    filtered = [p for p in products_list if p.get("is_active", True)]

    # Category filter (by slug or id)
    if category and category != "all":
        filtered = [
            p for p in filtered
            if (p.get("category") and p["category"].get("slug") == category) or
               p.get("category_id") == category
        ]

    # Search filter (name, description, tags, category name)
    if search and search.strip():
        q = search.strip().lower()
        def matches_search(p):
            if q in p.get("name", "").lower():
                return True
            if q in p.get("description", "").lower():
                return True
            if any(q in tag.lower() for tag in p.get("tags", [])):
                return True
            if p.get("category") and q in p["category"].get("name", "").lower():
                return True
            return False
        filtered = [p for p in filtered if matches_search(p)]

    # Price range filter
    if min_price is not None:
        filtered = [p for p in filtered if (p.get("sale_price") or p.get("price", 0)) >= min_price]
    if max_price is not None:
        filtered = [p for p in filtered if (p.get("sale_price") or p.get("price", 0)) <= max_price]

    # In Stock filter
    if in_stock is True:
        filtered = [p for p in filtered if p.get("stock_quantity", 0) > 0]

    # Featured filter
    if featured is True:
        filtered = [p for p in filtered if p.get("is_featured")]

    # Bestseller filter
    if bestseller is True:
        filtered = [p for p in filtered if p.get("is_bestseller")]

    # Sorting
    if sort_by == "price_asc":
        filtered.sort(key=lambda x: (x.get("sale_price") or x.get("price", 0)))
    elif sort_by == "price_desc":
        filtered.sort(key=lambda x: (x.get("sale_price") or x.get("price", 0)), reverse=True)
    elif sort_by == "newest":
        filtered.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    elif sort_by == "bestseller":
        filtered.sort(key=lambda x: (1 if x.get("is_bestseller") else 0), reverse=True)
    else:  # "featured"
        filtered.sort(key=lambda x: (1 if x.get("is_featured") else 0), reverse=True)

    total = len(filtered)
    total_pages = max(1, (total + limit - 1) // limit)
    start = (page - 1) * limit
    paginated = filtered[start : start + limit]

    return {
        "products": paginated,
        "total": total,
        "page": page,
        "total_pages": total_pages,
    }

@router.get("/products/{product_id}", response_model=Product)
async def get_product_by_id(product_id: str):
    if supabase_client:
        try:
            res = supabase_client.table("products").select("*, categories(*), product_images(*)").eq("id", product_id).single().execute()
            if res.data:
                row = res.data
                cat = row.get("categories")
                imgs = row.get("product_images", [])
                return {
                    **row,
                    "category": cat,
                    "images": imgs if imgs else [{"image_url": "/images/tulip_bouquet.jpg"}]
                }
        except Exception:
            pass

    if product_id in store.products:
        p = store.products[product_id]
        if "category" not in p or not p["category"]:
            cat_id = p.get("category_id")
            if cat_id and cat_id in store.categories:
                p["category"] = store.categories[cat_id]
        return p

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

@router.get("/products/slug/{slug}", response_model=Product)
async def get_product_by_slug(slug: str):
    if supabase_client:
        try:
            res = supabase_client.table("products").select("*, categories(*), product_images(*)").eq("slug", slug).single().execute()
            if res.data:
                row = res.data
                cat = row.get("categories")
                imgs = row.get("product_images", [])
                return {
                    **row,
                    "category": cat,
                    "images": imgs if imgs else [{"image_url": "/images/tulip_bouquet.jpg"}]
                }
        except Exception:
            pass

    for p in store.products.values():
        if p.get("slug") == slug:
            if "category" not in p or not p["category"]:
                cat_id = p.get("category_id")
                if cat_id and cat_id in store.categories:
                    p["category"] = store.categories[cat_id]
            return p

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product with slug '{slug}' not found")

# ==========================================================
# Admin Product Management Endpoints
# ==========================================================

@router.post("/admin/products", response_model=Product)
async def create_product(
    product_in: ProductCreate,
    admin_user: dict = Depends(require_admin)
):
    prod_id = str(uuid.uuid4())
    now_str = datetime.now(timezone.utc).isoformat()
    
    images = []
    if product_in.image_urls:
        for idx, url in enumerate(product_in.image_urls):
            images.append({
                "id": str(uuid.uuid4()),
                "product_id": prod_id,
                "image_url": url,
                "alt_text": product_in.name,
                "display_order": idx + 1
            })
    else:
        images.append({
            "id": str(uuid.uuid4()),
            "product_id": prod_id,
            "image_url": "/images/tulip_bouquet.jpg",
            "alt_text": product_in.name,
            "display_order": 1
        })

    product_dict = {
        "id": prod_id,
        "name": product_in.name,
        "slug": product_in.slug,
        "category_id": product_in.category_id,
        "description": product_in.description,
        "price": product_in.price,
        "sale_price": product_in.sale_price,
        "stock_quantity": product_in.stock_quantity,
        "low_stock_threshold": product_in.low_stock_threshold,
        "material": product_in.material,
        "care_instructions": product_in.care_instructions,
        "shipping_information": product_in.shipping_information,
        "tags": product_in.tags,
        "is_active": product_in.is_active,
        "is_featured": product_in.is_featured,
        "is_bestseller": product_in.is_bestseller,
        "is_new": product_in.is_new,
        "images": images,
        "created_at": now_str,
        "updated_at": now_str,
    }

    if product_in.category_id and product_in.category_id in store.categories:
        product_dict["category"] = store.categories[product_in.category_id]

    # Save to Supabase if available
    if supabase_client:
        try:
            db_dict = {k: v for k, v in product_dict.items() if k not in ["images", "category"]}
            supabase_client.table("products").insert(db_dict).execute()
            for img in images:
                supabase_client.table("product_images").insert(img).execute()
        except Exception as e:
            print(f"Supabase product insert failed: {e}")

    store.products[prod_id] = product_dict
    return product_dict

@router.put("/admin/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    admin_user: dict = Depends(require_admin)
):
    if product_id not in store.products:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    prod = store.products[product_id]
    update_data = product_update.model_dump(exclude_unset=True)
    
    if "image_urls" in update_data:
        image_urls = update_data.pop("image_urls")
        if image_urls:
            prod["images"] = [
                {"id": str(uuid.uuid4()), "product_id": product_id, "image_url": u, "display_order": i+1}
                for i, u in enumerate(image_urls)
            ]

    for k, v in update_data.items():
        prod[k] = v

    prod["updated_at"] = datetime.now(timezone.utc).isoformat()
    if prod.get("category_id") in store.categories:
        prod["category"] = store.categories[prod["category_id"]]

    if supabase_client:
        try:
            db_dict = {k: v for k, v in prod.items() if k not in ["images", "category"]}
            supabase_client.table("products").update(db_dict).eq("id", product_id).execute()
        except Exception as e:
            print(f"Supabase product update failed: {e}")

    return prod

@router.delete("/admin/products/{product_id}")
async def delete_product(
    product_id: str,
    admin_user: dict = Depends(require_admin)
):
    if supabase_client:
        try:
            supabase_client.table("products").delete().eq("id", product_id).execute()
        except Exception as e:
            print(f"Supabase product delete failed: {e}")

    if product_id in store.products:
        del store.products[product_id]
        return {"success": True, "message": "Product deleted successfully"}

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
