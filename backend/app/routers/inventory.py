from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.schemas.schemas import Product, StockUpdatePayload, StockAdjustPayload
from app.database import store, supabase_client
from app.utils.security import require_admin
from app.services.inventory_service import inventory_service

router = APIRouter(prefix="/admin/inventory", tags=["Admin Inventory"])

@router.get("", response_model=List[Product])
async def get_inventory(
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    admin_user: dict = Depends(require_admin)
):
    """
    Returns full product list with real-time stock levels, low-stock thresholds, and status for admin inventory management.
    """
    products_list = []
    if supabase_client:
        try:
            res = supabase_client.table("products").select("*, categories(*), product_images(*)").execute()
            if res.data:
                for row in res.data:
                    cat = row.get("categories")
                    imgs = row.get("product_images", [])
                    products_list.append({
                        **row,
                        "category": cat,
                        "images": imgs if imgs else [{"image_url": "/images/tulip_bouquet.jpg"}]
                    })
        except Exception:
            pass

    if not products_list:
        products_list = list(store.products.values())
        for p in products_list:
            if "category" not in p or not p["category"]:
                cat_id = p.get("category_id")
                if cat_id and cat_id in store.categories:
                    p["category"] = store.categories[cat_id]

    # Filters
    if search and search.strip():
        q = search.strip().lower()
        products_list = [
            p for p in products_list
            if q in p.get("name", "").lower() or q in p.get("slug", "").lower()
        ]

    if category and category != "all":
        products_list = [
            p for p in products_list
            if (p.get("category") and p["category"].get("slug") == category) or
               p.get("category_id") == category
        ]

    if status == "in_stock":
        products_list = [p for p in products_list if p.get("stock_quantity", 0) > p.get("low_stock_threshold", 3)]
    elif status == "low_stock":
        products_list = [
            p for p in products_list
            if 0 < p.get("stock_quantity", 0) <= p.get("low_stock_threshold", 3)
        ]
    elif status == "out_of_stock":
        products_list = [p for p in products_list if p.get("stock_quantity", 0) <= 0]

    return products_list

@router.put("/{product_id}", response_model=Product)
async def update_stock(
    product_id: str,
    payload: StockUpdatePayload,
    admin_user: dict = Depends(require_admin)
):
    if product_id not in store.products:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    prod = store.products[product_id]
    prod["stock_quantity"] = payload.stock_quantity

    if supabase_client:
        try:
            supabase_client.table("products").update({
                "stock_quantity": payload.stock_quantity
            }).eq("id", product_id).execute()
        except Exception as e:
            print(f"Supabase stock update error: {e}")

    return prod

@router.post("/{product_id}/adjust", response_model=Product)
async def adjust_stock(
    product_id: str,
    payload: StockAdjustPayload,
    admin_user: dict = Depends(require_admin)
):
    updated = inventory_service.adjust_stock(product_id, payload.delta, payload.reason)
    return updated
