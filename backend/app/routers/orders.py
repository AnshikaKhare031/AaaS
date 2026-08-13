from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.schemas import Order, OrderCreate, OrderStatusUpdate
from app.database import store, supabase_client
from app.utils.security import get_current_user_optional, require_admin
from app.services.order_service import order_service
from app.services.inventory_service import inventory_service

router = APIRouter(tags=["Orders"])

@router.post("/orders", response_model=Order)
async def create_new_order(
    order_in: OrderCreate,
    user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Validates stock availability, calculates authoritative prices, and creates a new order in pending status.
    """
    # 1. Check stock before order creation
    items_data = [item.model_dump() for item in order_in.items]
    is_available, error_msg = inventory_service.check_stock_availability(items_data)
    if not is_available:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)

    user_id = user["id"] if user else None
    order = order_service.create_order(order_in, user_id=user_id)
    return order

@router.get("/orders", response_model=List[Order])
async def list_orders(user: dict = Depends(get_current_user_optional)):
    """
    Returns orders belonging to current user or all demo orders.
    """
    user_id = user["id"] if user else None

    if supabase_client and user_id:
        try:
            res = supabase_client.table("orders").select("*, order_items(*)").eq("user_id", user_id).order("created_at", desc=True).execute()
            if res.data:
                orders_list = []
                for row in res.data:
                    items = row.get("order_items", [])
                    orders_list.append({**row, "items": items})
                return orders_list
        except Exception:
            pass

    orders = list(store.orders.values())
    if user_id:
        user_orders = [o for o in orders if o.get("user_id") == user_id]
        if user_orders:
            return user_orders
            
    orders.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return orders

@router.get("/orders/{order_id}", response_model=Order)
async def get_order_by_id(order_id: str, user: Optional[dict] = Depends(get_current_user_optional)):
    if supabase_client:
        try:
            res = supabase_client.table("orders").select("*, order_items(*)").or_(f"id.eq.{order_id},order_number.eq.{order_id}").single().execute()
            if res.data:
                row = res.data
                items = row.get("order_items", [])
                return {**row, "items": items}
        except Exception:
            pass

    if order_id in store.orders:
        return store.orders[order_id]

    for o in store.orders.values():
        if o.get("order_number") == order_id:
            return o

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

# ==========================================================
# Admin Order Management Endpoints
# ==========================================================

@router.get("/admin/orders", response_model=List[Order])
async def list_admin_orders(admin_user: dict = Depends(require_admin)):
    if supabase_client:
        try:
            res = supabase_client.table("orders").select("*, order_items(*)").order("created_at", desc=True).execute()
            if res.data:
                orders_list = []
                for row in res.data:
                    items = row.get("order_items", [])
                    orders_list.append({**row, "items": items})
                return orders_list
        except Exception:
            pass

    orders = list(store.orders.values())
    orders.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return orders

@router.put("/admin/orders/{order_id}/status", response_model=Order)
async def update_order_status(
    order_id: str,
    status_update: OrderStatusUpdate,
    admin_user: dict = Depends(require_admin)
):
    if order_id not in store.orders:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order = store.orders[order_id]
    order["order_status"] = status_update.status
    if status_update.tracking_number:
        order["tracking_number"] = status_update.tracking_number

    if supabase_client:
        try:
            supabase_client.table("orders").update({
                "order_status": status_update.status,
                "tracking_number": status_update.tracking_number
            }).eq("id", order_id).execute()
        except Exception as e:
            print(f"Supabase order status update error: {e}")

    return order
