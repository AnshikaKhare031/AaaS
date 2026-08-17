from typing import Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.schemas import AdminDashboardMetrics, AdminSettings, AdminSettingsUpdate
from app.database import store, supabase_client
from app.utils.security import require_admin

router = APIRouter(prefix="/admin", tags=["Admin System"])

@router.get("/dashboard", response_model=AdminDashboardMetrics)
async def get_admin_dashboard_metrics(admin_user: dict = Depends(require_admin)):
    """
    Computes real-time catalog, custom orders, and review moderation metrics for the admin dashboard.
    """
    products = list(store.products.values())
    custom_orders = list(store.custom_orders.values())
    reviews = list(store.reviews.values())

    if supabase_client:
        try:
            p_res = supabase_client.table("products").select("id, stock_quantity, low_stock_threshold").execute()
            if p_res.data:
                products = p_res.data
            c_res = supabase_client.table("custom_orders").select("id, email").execute()
            if c_res.data:
                custom_orders = c_res.data
            r_res = supabase_client.table("reviews").select("id, is_approved").execute()
            if r_res.data:
                reviews = r_res.data
        except Exception:
            pass

    total_products = len(products)
    low_stock_count = sum(1 for p in products if p.get("stock_quantity", 0) <= p.get("low_stock_threshold", 3))
    custom_order_count = len(custom_orders)
    unique_customers = len(set(o.get("email") for o in custom_orders if o.get("email")))
    pending_reviews_count = sum(1 for r in reviews if not r.get("is_approved", False))

    return {
        "total_products": total_products,
        "low_stock_count": low_stock_count,
        "total_customers": unique_customers,
        "custom_order_count": custom_order_count,
        "pending_reviews_count": pending_reviews_count,
    }

@router.get("/settings", response_model=AdminSettings)
async def get_store_settings():
    if supabase_client:
        try:
            res = supabase_client.table("admin_settings").select("*").single().execute()
            if res.data:
                return res.data
        except Exception:
            pass

    return store.settings

@router.put("/settings", response_model=AdminSettings)
async def update_store_settings(
    settings_in: AdminSettingsUpdate,
    admin_user: dict = Depends(require_admin)
):
    data = settings_in.model_dump(exclude_unset=True)
    for k, v in data.items():
        store.settings[k] = v
    store.settings["updated_at"] = datetime.now(timezone.utc).isoformat()

    if supabase_client:
        try:
            supabase_client.table("admin_settings").update(store.settings).eq("id", store.settings.get("id")).execute()
        except Exception as e:
            print(f"Supabase settings update error: {e}")

    return store.settings
