from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from app.schemas.schemas import OrderCreate, OrderResponse, OrderStatusUpdatePayload
from app.services.order_service import order_service
from app.utils.security import get_current_user_required, require_admin

router = APIRouter(tags=["Orders"])

@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
@router.post("/orders/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_order(
    order_in: OrderCreate,
    current_user: dict = Depends(get_current_user_required)
):
    """
    Creates an order for the authenticated user with server-side validation and stock adjustment.
    """
    return order_service.create_order(user_id=current_user["id"], order_in=order_in)

@router.get("/orders", response_model=List[OrderResponse])
@router.get("/orders/", response_model=List[OrderResponse], include_in_schema=False)
async def list_user_orders(
    current_user: dict = Depends(get_current_user_required)
):
    """
    Lists all orders belonging strictly to the authenticated user.
    """
    return order_service.get_user_orders(user_id=current_user["id"])

@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order_by_id(
    order_id: str,
    current_user: dict = Depends(get_current_user_required)
):
    """
    Retrieves order details with strict ownership verification.
    """
    is_admin = current_user.get("role") == "admin"
    return order_service.get_order_by_id(
        order_id=order_id,
        user_id=current_user["id"],
        is_admin=is_admin
    )

@router.get("/admin/orders", response_model=List[OrderResponse])
@router.get("/admin/orders/", response_model=List[OrderResponse], include_in_schema=False)
async def list_all_orders_admin(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    admin_user: dict = Depends(require_admin)
):
    """
    Admin-only endpoint to retrieve and filter all system orders for management and fulfillment.
    """
    orders = order_service.get_all_orders(admin_user_id=admin_user["id"])

    # Filter by status if provided (and not 'all')
    if status_filter and status_filter.lower() != "all":
        orders = [o for o in orders if o.get("status", "").lower() == status_filter.lower()]

    # Filter by search string if provided
    if search and search.strip():
        q = search.strip().lower()
        filtered = []
        for o in orders:
            order_num = str(o.get("order_number", "")).lower()
            cust_name = str(o.get("customer_name", "")).lower()
            cust_email = str(o.get("customer_email", "")).lower()
            tracking = str(o.get("tracking_number", "")).lower()

            # Also check nested shipping address if customer fields are empty
            ship_addr = o.get("shipping_address")
            if isinstance(ship_addr, dict):
                cust_name = cust_name or str(ship_addr.get("fullName", "")).lower()
                cust_email = cust_email or str(ship_addr.get("email", "")).lower()

            if q in order_num or q in cust_name or q in cust_email or q in tracking:
                filtered.append(o)
        orders = filtered

    return orders

@router.patch("/admin/orders/{order_id}/status", response_model=OrderResponse)
async def update_order_status_endpoint(
    order_id: str,
    status_in: OrderStatusUpdatePayload,
    admin_user: dict = Depends(require_admin)
):
    """
    Admin-only endpoint to update order fulfillment status, carrier details, and dispatch shipping notifications.
    """
    return order_service.update_order_status(
        order_id=order_id,
        status_in=status_in,
        admin_user_id=admin_user["id"]
    )
