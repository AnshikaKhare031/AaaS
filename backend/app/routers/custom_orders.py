import uuid
import random
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.schemas import (
    CustomOrder,
    CustomOrderCreate,
    CustomOrderStatusUpdate
)
from app.database import store, supabase_client
from app.utils.security import get_current_user_optional, require_admin

router = APIRouter(tags=["Custom Orders"])

@router.post("/custom-orders", response_model=CustomOrder)
async def submit_custom_order(
    custom_in: CustomOrderCreate,
    user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Submits a bespoke handmade crochet custom request.
    """
    custom_id = str(uuid.uuid4())
    random_num = random.randint(1000, 9999)
    request_id = f"CUST-{datetime.now().year}-{random_num}"
    now_str = datetime.now(timezone.utc).isoformat()
    user_id = user["id"] if user else None

    custom_record = {
        "id": custom_id,
        "request_id": request_id,
        "user_id": user_id,
        "name": custom_in.name,
        "email": custom_in.email,
        "phone": custom_in.phone,
        "product_type": custom_in.product_type,
        "category": custom_in.category,
        "color_preference": custom_in.color_preference,
        "size_dimensions": custom_in.size_dimensions,
        "quantity": custom_in.quantity,
        "budget": custom_in.budget,
        "description": custom_in.description,
        "images": custom_in.images or [],
        "status": "new",
        "admin_notes": None,
        "created_at": now_str,
        "updated_at": now_str
    }

    if supabase_client:
        try:
            db_dict = {k: v for k, v in custom_record.items() if k != "images"}
            supabase_client.table("custom_orders").insert(db_dict).execute()
            for img_url in (custom_in.images or []):
                supabase_client.table("custom_order_images").insert({
                    "id": str(uuid.uuid4()),
                    "custom_order_id": custom_id,
                    "image_url": img_url
                }).execute()
        except Exception as e:
            print(f"Supabase custom order insert error: {e}")

    store.custom_orders[custom_id] = custom_record
    return custom_record

@router.get("/custom-orders", response_model=List[CustomOrder])
async def list_custom_orders(user: dict = Depends(get_current_user_optional)):
    user_id = user["id"] if user else None
    
    if supabase_client and user_id:
        try:
            res = supabase_client.table("custom_orders").select("*, custom_order_images(*)").eq("user_id", user_id).order("created_at", desc=True).execute()
            if res.data:
                res_list = []
                for row in res.data:
                    imgs = [img["image_url"] for img in row.get("custom_order_images", [])]
                    res_list.append({**row, "images": imgs})
                return res_list
        except Exception:
            pass

    orders = list(store.custom_orders.values())
    if user_id:
        orders = [o for o in orders if o.get("user_id") == user_id]
    orders.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return orders

@router.get("/custom-orders/{custom_id}", response_model=CustomOrder)
async def get_custom_order_detail(custom_id: str):
    if custom_id in store.custom_orders:
        return store.custom_orders[custom_id]
    for o in store.custom_orders.values():
        if o.get("request_id") == custom_id:
            return o
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Custom order request not found")

# ==========================================================
# Admin Custom Orders Endpoints
# ==========================================================

@router.get("/admin/custom-orders", response_model=List[CustomOrder])
async def list_admin_custom_orders(admin_user: dict = Depends(require_admin)):
    if supabase_client:
        try:
            res = supabase_client.table("custom_orders").select("*, custom_order_images(*)").order("created_at", desc=True).execute()
            if res.data:
                res_list = []
                for row in res.data:
                    imgs = [img["image_url"] for img in row.get("custom_order_images", [])]
                    res_list.append({**row, "images": imgs})
                return res_list
        except Exception:
            pass

    orders = list(store.custom_orders.values())
    orders.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return orders

@router.put("/admin/custom-orders/{custom_id}/status", response_model=CustomOrder)
async def update_custom_order_status(
    custom_id: str,
    status_update: CustomOrderStatusUpdate,
    admin_user: dict = Depends(require_admin)
):
    if custom_id not in store.custom_orders:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Custom order not found")

    order = store.custom_orders[custom_id]
    order["status"] = status_update.status
    if status_update.admin_notes:
        order["admin_notes"] = status_update.admin_notes
    order["updated_at"] = datetime.now(timezone.utc).isoformat()

    if supabase_client:
        try:
            supabase_client.table("custom_orders").update({
                "status": status_update.status,
                "admin_notes": status_update.admin_notes,
                "updated_at": order["updated_at"]
            }).eq("id", custom_id).execute()
        except Exception as e:
            print(f"Supabase custom order status update error: {e}")

    return order
