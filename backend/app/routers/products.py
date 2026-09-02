import uuid
import re
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.schemas.schemas import (
    Product, ProductCreate, ProductUpdate, ProductListResponse, ProductQuickStatusUpdate
)
from app.database import store, supabase_client
from app.utils.security import require_admin

router = APIRouter(tags=["Products"])

def normalize_product_images(p: dict) -> dict:
    raw_images = p.get("images")
    normalized = []
    if raw_images:
        if isinstance(raw_images, list):
            for idx, im in enumerate(raw_images):
                if isinstance(im, str) and im.strip():
                    normalized.append({
                        "id": f"img-{idx}",
                        "product_id": p.get("id", ""),
                        "image_url": im.strip(),
                        "alt_text": p.get("name", "Product"),
                        "display_order": idx + 1
                    })
                elif isinstance(im, dict):
                    url = im.get("image_url") or im.get("url") or im.get("src")
                    if url and str(url).strip():
                        normalized.append({
                            "id": im.get("id") or f"img-{idx}",
                            "product_id": p.get("id", ""),
                            "image_url": str(url).strip(),
                            "alt_text": im.get("alt_text") or p.get("name", "Product"),
                            "display_order": im.get("display_order") or idx + 1
                        })
        elif isinstance(raw_images, str) and raw_images.strip():
            normalized.append({
                "id": "img-0",
                "product_id": p.get("id", ""),
                "image_url": raw_images.strip(),
                "alt_text": p.get("name", "Product"),
                "display_order": 1
            })

    if not normalized:
        single = p.get("image") or p.get("image_url") or p.get("product_image") or "/images/tulip_bouquet.jpg"
        normalized.append({
            "id": "img-0",
            "product_id": p.get("id", ""),
            "image_url": single,
            "alt_text": p.get("name", "Product"),
            "display_order": 1
        })

    primary_url = normalized[0]["image_url"]
    p["images"] = normalized
    p["image"] = primary_url
    p["image_url"] = primary_url
    p["product_image"] = primary_url
    return p

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

    # Normalize image fields across all products
    for p in products_list:
        normalize_product_images(p)

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
                p_obj = {
                    **row,
                    "category": cat,
                    "images": imgs if imgs else [{"image_url": "/images/tulip_bouquet.jpg"}]
                }
                return normalize_product_images(p_obj)
        except Exception:
            pass

    if product_id in store.products:
        p = store.products[product_id]
        if "category" not in p or not p["category"]:
            cat_id = p.get("category_id")
            if cat_id and cat_id in store.categories:
                p["category"] = store.categories[cat_id]
        return normalize_product_images(p)

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
                p_obj = {
                    **row,
                    "category": cat,
                    "images": imgs if imgs else [{"image_url": "/images/tulip_bouquet.jpg"}]
                }
                return normalize_product_images(p_obj)
        except Exception:
            pass

    for p in store.products.values():
        if p.get("slug") == slug:
            if "category" not in p or not p["category"]:
                cat_id = p.get("category_id")
                if cat_id and cat_id in store.categories:
                    p["category"] = store.categories[cat_id]
            return normalize_product_images(p)

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product with slug '{slug}' not found")

# ==========================================================
# Admin Product Management Endpoints
# ==========================================================

@router.get("/admin/products", response_model=List[Product])
async def list_admin_products(
    search: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None, alias="category"),
    status_filter: Optional[str] = Query("all", alias="status"),
    admin_user: dict = Depends(require_admin)
):
    """
    Returns complete product catalog for admin management with search by name, SKU, or tags,
    and filters by category and active status.
    """
    prods = list(store.products.values())
    for p in prods:
        if "category" not in p or not p["category"]:
            c_id = p.get("category_id")
            if c_id and c_id in store.categories:
                p["category"] = store.categories[c_id]
        if not p.get("inventory_count"):
            p["inventory_count"] = p.get("stock_quantity", 0)
        if not p.get("sku"):
            p["sku"] = f"AAAS-{str(p.get('id', '000'))[:6].upper()}"
        normalize_product_images(p)

    # Filter status
    if status_filter == "active":
        prods = [p for p in prods if p.get("is_active", True)]
    elif status_filter == "inactive":
        prods = [p for p in prods if not p.get("is_active", True)]

    # Filter category
    if category_id and category_id.lower() != "all":
        prods = [p for p in prods if str(p.get("category_id")) == category_id or str(p.get("category", {}).get("slug", "")) == category_id or str(p.get("category", {}).get("name", "")).lower() == category_id.lower()]

    # Filter search query (name, SKU, or tags)
    if search and search.strip():
        q = search.strip().lower()
        matched = []
        for p in prods:
            name_match = q in str(p.get("name", "")).lower()
            sku_match = q in str(p.get("sku", "")).lower()
            tags_match = any(q in str(t).lower() for t in p.get("tags", []))
            if name_match or sku_match or tags_match:
                matched.append(p)
        prods = matched

    return prods

@router.post("/admin/products", response_model=Product)
@router.post("/products", response_model=Product)
async def create_product(
    product_in: ProductCreate,
    admin_user: dict = Depends(require_admin)
):
    prod_id = str(uuid.uuid4())
    now_str = datetime.now(timezone.utc).isoformat()
    
    # Collect all possible image inputs
    raw_images: List[str] = []
    if product_in.image_urls:
        raw_images.extend(product_in.image_urls)
    if hasattr(product_in, "images") and product_in.images:
        if isinstance(product_in.images, list):
            raw_images.extend(product_in.images)
        elif isinstance(product_in.images, str):
            raw_images.append(product_in.images)
    for field in ["image", "image_url", "product_image"]:
        val = getattr(product_in, field, None)
        if val and isinstance(val, str) and val.strip():
            raw_images.append(val.strip())

    images = []
    if raw_images:
        for item in raw_images:
            url = item if isinstance(item, str) else (item.get("image_url") or item.get("url") or item.get("src") if isinstance(item, dict) else None)
            if url and isinstance(url, str) and url.strip():
                images.append({
                    "id": str(uuid.uuid4()),
                    "product_id": prod_id,
                    "image_url": url.strip(),
                    "alt_text": product_in.name,
                    "display_order": len(images) + 1
                })
    if not images:
        images.append({
            "id": str(uuid.uuid4()),
            "product_id": prod_id,
            "image_url": "/images/tulip_bouquet.jpg",
            "alt_text": product_in.name,
            "display_order": 1
        })

    primary_url = images[0]["image_url"]

    stock = product_in.inventory_count if product_in.inventory_count is not None else product_in.stock_quantity
    compare_price = product_in.compare_at_price if product_in.compare_at_price is not None else product_in.sale_price
    sku = product_in.sku or f"AAAS-{prod_id[:6].upper()}"
    slug = product_in.slug or re.sub(r'[^a-z0-9]+', '-', product_in.name.lower()).strip('-')

    product_dict = {
        "id": prod_id,
        "name": product_in.name,
        "slug": slug,
        "category_id": product_in.category_id,
        "description": product_in.description,
        "price": product_in.price,
        "sale_price": compare_price,
        "compare_at_price": compare_price,
        "stock_quantity": stock,
        "inventory_count": stock,
        "low_stock_threshold": product_in.low_stock_threshold,
        "sku": sku,
        "material": product_in.material,
        "care_instructions": product_in.care_instructions,
        "shipping_information": product_in.shipping_information,
        "tags": product_in.tags,
        "is_active": product_in.is_active,
        "is_featured": product_in.is_featured,
        "is_customizable": product_in.is_customizable,
        "is_bestseller": product_in.is_bestseller,
        "is_new": product_in.is_new,
        "specifications": product_in.specifications or [],
        "images": images,
        "image": primary_url,
        "image_url": primary_url,
        "product_image": primary_url,
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

    normalize_product_images(product_dict)
    store.products[prod_id] = product_dict
    return product_dict

@router.put("/admin/products/{product_id}", response_model=Product)
@router.put("/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    admin_user: dict = Depends(require_admin)
):
    if product_id not in store.products:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    prod = store.products[product_id]
    update_data = product_update.model_dump(exclude_unset=True)
    
    # Check if any image fields are provided in update
    raw_update_images = []
    if "image_urls" in update_data and update_data["image_urls"]:
        raw_update_images.extend(update_data.pop("image_urls"))
    if "images" in update_data and update_data["images"]:
        imgs_val = update_data.pop("images")
        if isinstance(imgs_val, list):
            raw_update_images.extend(imgs_val)
        elif isinstance(imgs_val, str):
            raw_update_images.append(imgs_val)
    for field in ["image", "image_url", "product_image"]:
        if field in update_data and update_data[field]:
            raw_update_images.append(update_data.pop(field))

    if raw_update_images:
        new_imgs = []
        for item in raw_update_images:
            url = item if isinstance(item, str) else (item.get("image_url") or item.get("url") or item.get("src") if isinstance(item, dict) else None)
            if url and isinstance(url, str) and url.strip():
                new_imgs.append({
                    "id": str(uuid.uuid4()),
                    "product_id": product_id,
                    "image_url": url.strip(),
                    "alt_text": prod.get("name", "Product"),
                    "display_order": len(new_imgs) + 1
                })
        if new_imgs:
            prod["images"] = new_imgs
            prod["image"] = new_imgs[0]["image_url"]
            prod["image_url"] = new_imgs[0]["image_url"]
            prod["product_image"] = new_imgs[0]["image_url"]

    # Sync inventory_count and stock_quantity
    if "inventory_count" in update_data and update_data["inventory_count"] is not None:
        update_data["stock_quantity"] = update_data["inventory_count"]
    elif "stock_quantity" in update_data and update_data["stock_quantity"] is not None:
        update_data["inventory_count"] = update_data["stock_quantity"]

    # Sync compare_at_price and sale_price
    if "compare_at_price" in update_data:
        update_data["sale_price"] = update_data["compare_at_price"]
    elif "sale_price" in update_data:
        update_data["compare_at_price"] = update_data["sale_price"]

    for k, v in update_data.items():
        prod[k] = v

    prod["updated_at"] = datetime.now(timezone.utc).isoformat()
    if prod.get("category_id") in store.categories:
        prod["category"] = store.categories[prod["category_id"]]

    normalize_product_images(prod)

    if supabase_client:
        try:
            db_dict = {k: v for k, v in prod.items() if k not in ["images", "category"]}
            supabase_client.table("products").update(db_dict).eq("id", product_id).execute()
        except Exception as e:
            print(f"Supabase product update failed: {e}")

    return prod

@router.patch("/admin/products/{product_id}/status", response_model=Product)
async def update_product_status(
    product_id: str,
    status_update: ProductQuickStatusUpdate,
    admin_user: dict = Depends(require_admin)
):
    """
    Inline quick-toggles for is_active and is_featured using optimistic UI updates.
    """
    if product_id not in store.products:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    prod = store.products[product_id]
    if status_update.is_active is not None:
        prod["is_active"] = status_update.is_active
    if status_update.is_featured is not None:
        prod["is_featured"] = status_update.is_featured

    prod["updated_at"] = datetime.now(timezone.utc).isoformat()

    if supabase_client:
        try:
            db_update = {}
            if status_update.is_active is not None:
                db_update["is_active"] = status_update.is_active
            if status_update.is_featured is not None:
                db_update["is_featured"] = status_update.is_featured
            db_update["updated_at"] = prod["updated_at"]
            supabase_client.table("products").update(db_update).eq("id", product_id).execute()
        except Exception as e:
            print(f"Supabase product status toggle error: {e}")

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
