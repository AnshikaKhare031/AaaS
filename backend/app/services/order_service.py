import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import HTTPException, status
from app.schemas.schemas import (
    OrderCreate,
    OrderResponse,
    OrderItemResponse,
    OrderStatus,
    PaymentStatus,
    OrderStatusUpdatePayload,
)
from app.config import settings
from app.database import store, supabase_client
from app.services.inventory_service import inventory_service

class OrderService:
    @staticmethod
    def _fetch_product(product_id: str) -> Optional[dict]:
        """Fetches product details from Supabase or the in-memory store."""
        if supabase_client:
            try:
                res = supabase_client.table("products").select("*, product_images(*)").eq("id", product_id).single().execute()
                if res.data:
                    return res.data
            except Exception:
                pass
        return store.products.get(product_id)

    @classmethod
    def create_order(cls, user_id: str, order_in: OrderCreate) -> dict:
        """
        Creates an order for the user with server-computed pricing, stock validation, and stock deduction.
        """
        if not order_in.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order must contain at least one item."
            )

        order_id = str(uuid.uuid4())
        order_number = f"ORD-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        now_str = datetime.now(timezone.utc).isoformat()

        validated_items: List[dict] = []

        # 1. Stock check & server-side item price calculation
        for item in order_in.items:
            prod = cls._fetch_product(item.product_id)
            if not prod:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with id '{item.product_id}' not found."
                )

            available_stock = prod.get("stock_quantity", 0)
            if available_stock < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for '{prod.get('name', 'Product')}'. Available: {available_stock}, Requested: {item.quantity}."
                )

            # Determine genuine price on server (do not trust client subtotal)
            sale_price = prod.get("sale_price")
            base_price = prod.get("price", 0.0)
            unit_price = float(sale_price) if (sale_price is not None and sale_price < base_price) else float(base_price)
            item_subtotal = round(unit_price * item.quantity, 2)

            # Extract image
            image_url = None
            images = prod.get("images") or prod.get("product_images") or []
            if images and isinstance(images, list):
                first_img = images[0]
                image_url = first_img.get("image_url") if isinstance(first_img, dict) else str(first_img)
            elif prod.get("image_url"):
                image_url = prod.get("image_url")

            order_item_dict = {
                "id": str(uuid.uuid4()),
                "order_id": order_id,
                "product_id": item.product_id,
                "product_name": prod.get("name", "Artisan Handmade Piece"),
                "product_image": image_url,
                "unit_price": unit_price,
                "quantity": item.quantity,
                "subtotal": item_subtotal,
            }
            validated_items.append(order_item_dict)

        # 2. Server-side computation of totals
        subtotal = round(sum(i["subtotal"] for i in validated_items), 2)
        settings_data = store.settings
        free_thresh = settings_data.get("free_shipping_threshold", 1499.0)
        fixed_ship = settings_data.get("fixed_shipping_fee", 99.0)
        free_enabled = settings_data.get("enable_free_shipping", True)

        computed_shipping_fee = 0.0 if (free_enabled and subtotal >= free_thresh) else fixed_ship
        discount = max(0.0, float(order_in.discount_amount or 0.0))
        total_amount = round(max(0.0, subtotal - discount + computed_shipping_fee), 2)

        # 3. Reserve / deduct stock for each item via inventory_service
        for item in validated_items:
            inventory_service.adjust_stock(
                product_id=item["product_id"],
                delta=-item["quantity"],
                reason=f"Order {order_number} reservation"
            )

        # 4. Construct Order Record
        order_record = {
            "id": order_id,
            "order_number": order_number,
            "user_id": user_id,
            "items": validated_items,
            "shipping_address": order_in.shipping_address,
            "total_amount": total_amount,
            "discount_amount": discount,
            "shipping_fee": computed_shipping_fee,
            "status": OrderStatus.PENDING.value,
            "payment_status": PaymentStatus.PENDING.value,
            "created_at": now_str,
            "updated_at": now_str,
        }

        # 5. Persist to Supabase if available
        if supabase_client:
            try:
                db_order = {
                    "id": order_id,
                    "order_number": order_number,
                    "user_id": user_id,
                    "subtotal": subtotal,
                    "shipping_fee": computed_shipping_fee,
                    "total": total_amount,
                    "currency": "INR",
                    "order_status": OrderStatus.PENDING.value,
                    "payment_status": PaymentStatus.PENDING.value,
                    "shipping_name": order_in.shipping_address.get("fullName", "") if isinstance(order_in.shipping_address, dict) else "",
                    "shipping_email": order_in.shipping_address.get("email", "") if isinstance(order_in.shipping_address, dict) else "",
                    "shipping_phone": order_in.shipping_address.get("phone", "") if isinstance(order_in.shipping_address, dict) else "",
                    "shipping_address": order_in.shipping_address.get("address", "") if isinstance(order_in.shipping_address, dict) else str(order_in.shipping_address),
                    "shipping_city": order_in.shipping_address.get("city", "") if isinstance(order_in.shipping_address, dict) else "",
                    "shipping_state": order_in.shipping_address.get("state", "") if isinstance(order_in.shipping_address, dict) else "",
                    "shipping_pincode": order_in.shipping_address.get("pincode", "") if isinstance(order_in.shipping_address, dict) else "",
                    "created_at": now_str,
                    "updated_at": now_str,
                }
                supabase_client.table("orders").insert(db_order).execute()
                for v_item in validated_items:
                    db_item = {
                        "id": v_item["id"],
                        "order_id": order_id,
                        "product_id": v_item["product_id"],
                        "product_name": v_item["product_name"],
                        "product_image": v_item["product_image"],
                        "quantity": v_item["quantity"],
                        "unit_price": v_item["unit_price"],
                        "subtotal": v_item["subtotal"],
                    }
                    supabase_client.table("order_items").insert(db_item).execute()
            except Exception as e:
                print(f"Supabase order persistence error: {e}")

        # Store in InMemoryStore
        store.orders[order_id] = order_record
        store.order_items[order_id] = validated_items

        return order_record

    @classmethod
    def get_user_orders(cls, user_id: str) -> List[dict]:
        """
        Returns all orders strictly filtered by user_id.
        """
        if supabase_client:
            try:
                res = supabase_client.table("orders").select("*, order_items(*)").eq("user_id", user_id).order("created_at", desc=True).execute()
                if res.data:
                    orders = []
                    for row in res.data:
                        items = row.get("order_items") or []
                        order = dict(row)
                        order["items"] = items
                        order["total_amount"] = float(row.get("total") or row.get("total_amount", 0.0))
                        order["status"] = row.get("order_status") or row.get("status", "pending")
                        orders.append(order)
                    return orders
            except Exception as e:
                print(f"Supabase get_user_orders error: {e}")

        user_orders = [
            dict(o, items=store.order_items.get(o["id"], []))
            for o in store.orders.values()
            if o.get("user_id") == user_id
        ]
        user_orders.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return user_orders

    @classmethod
    def get_order_by_id(cls, order_id: str, user_id: str, is_admin: bool = False) -> dict:
        """
        CRITICAL SECURITY FIX: Enforce strict ownership check so non-admin users
        can NEVER access other users' orders.
        """
        order = None
        if supabase_client:
            try:
                res = supabase_client.table("orders").select("*, order_items(*)").eq("id", order_id).single().execute()
                if res.data:
                    order = dict(res.data)
                    order["items"] = res.data.get("order_items") or []
                    order["total_amount"] = float(res.data.get("total") or res.data.get("total_amount", 0.0))
                    order["status"] = res.data.get("order_status") or res.data.get("status", "pending")
            except Exception:
                pass

        if not order:
            stored = store.orders.get(order_id)
            if stored:
                order = dict(stored, items=store.order_items.get(order_id, []))

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        # STRICT OWNERSHIP CHECK: Non-admins cannot view other users' orders
        if not is_admin and order.get("user_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        return order

    @classmethod
    def get_all_orders(cls, admin_user_id: str) -> List[dict]:
        """
        Accessible only by admin users for management/fulfillment.
        """
        if supabase_client:
            try:
                res = supabase_client.table("orders").select("*, order_items(*)").order("created_at", desc=True).execute()
                if res.data:
                    all_orders = []
                    for row in res.data:
                        items = row.get("order_items") or []
                        order = dict(row)
                        order["items"] = items
                        order["total_amount"] = float(row.get("total") or row.get("total_amount", 0.0))
                        order["status"] = row.get("order_status") or row.get("status", "pending")
                        all_orders.append(order)
                    return all_orders
            except Exception as e:
                print(f"Supabase get_all_orders error: {e}")

        all_orders = [
            dict(o, items=store.order_items.get(o["id"], []))
            for o in store.orders.values()
        ]
        all_orders.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return all_orders

    @classmethod
    def update_order_status(
        cls,
        order_id: str,
        status_in: OrderStatusUpdatePayload,
        admin_user_id: str
    ) -> dict:
        """
        Updates order status enforcing valid state machine transitions, carrier details
        for shipped status, and automated transactional email dispatch.
        """
        order = cls.get_order_by_id(order_id=order_id, user_id=admin_user_id, is_admin=True)

        current_status_str = order.get("status", OrderStatus.PENDING.value)
        try:
            current_status = OrderStatus(current_status_str)
        except ValueError:
            current_status = OrderStatus.PENDING

        new_status = status_in.status

        # Enforce valid state transitions (unless idempotent re-save)
        if new_status != current_status:
            valid_transitions = {
                OrderStatus.PENDING: {OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.CANCELLED},
                OrderStatus.CONFIRMED: {OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.CANCELLED},
                OrderStatus.PROCESSING: {OrderStatus.SHIPPED, OrderStatus.CANCELLED},
                OrderStatus.SHIPPED: {OrderStatus.DELIVERED, OrderStatus.CANCELLED},
                OrderStatus.DELIVERED: set(),
                OrderStatus.CANCELLED: set(),
            }

            allowed = valid_transitions.get(current_status, set())
            if new_status not in allowed:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid order transition: Cannot transition order from '{current_status.value}' to '{new_status.value}' directly."
                )

        # Carrier and Tracking code are required when shipping
        if new_status == OrderStatus.SHIPPED:
            carrier = (status_in.carrier_name or order.get("carrier_name") or "").strip()
            tracking = (status_in.tracking_number or order.get("tracking_number") or "").strip()
            if not carrier or not tracking:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Carrier name and tracking number are required when marking an order as shipped."
                )
            order["carrier_name"] = carrier
            order["tracking_number"] = tracking

            # Trigger automated transactional email notification
            cls._dispatch_shipping_notification(order, carrier, tracking)

        # If cancelled, restore reserved stock back to inventory
        if new_status == OrderStatus.CANCELLED and current_status != OrderStatus.CANCELLED:
            for item in order.get("items", []):
                p_id = item.get("product_id")
                qty = item.get("quantity", 0)
                if p_id and qty > 0:
                    inventory_service.adjust_stock(
                        product_id=p_id,
                        delta=qty,
                        reason=f"Order {order.get('order_number')} cancellation restock"
                    )

        now_str = datetime.now(timezone.utc).isoformat()
        order["status"] = new_status.value
        if status_in.notes is not None:
            order["notes"] = status_in.notes
        order["updated_at"] = now_str

        # Update Supabase if available
        if supabase_client:
            try:
                update_fields = {
                    "status": new_status.value,
                    "updated_at": now_str,
                }
                if order.get("carrier_name"):
                    update_fields["carrier_name"] = order.get("carrier_name")
                if order.get("tracking_number"):
                    update_fields["tracking_number"] = order.get("tracking_number")
                if order.get("notes"):
                    update_fields["notes"] = order.get("notes")

                supabase_client.table("orders").update(update_fields).eq("id", order_id).execute()
            except Exception as e:
                print(f"Supabase order status update error: {e}")

        # Update in-memory store
        store.orders[order_id] = order
        return order

    @staticmethod
    def _dispatch_shipping_notification(order: dict, carrier_name: str, tracking_number: str):
        """
        Sends transactional shipping notification email via Resend if RESEND_API_KEY is configured.
        """
        recipient = order.get("customer_email")
        if not recipient and isinstance(order.get("shipping_address"), dict):
            recipient = order.get("shipping_address", {}).get("email")

        if not recipient:
            return

        order_num = order.get("order_number", "ORD-XXXXX")
        if settings.RESEND_API_KEY:
            try:
                import urllib.request
                import json

                payload = {
                    "from": f"{settings.PROJECT_NAME} <orders@aaascrochet.com>",
                    "to": [recipient],
                    "subject": f"Your Handcrafted Order {order_num} Has Shipped! 🌸",
                    "html": f"""
                    <div style='font-family: serif; color: #3D2E24; padding: 24px; background: #F8F5F0; max-width: 600px; margin: 0 auto; border-radius: 16px;'>
                        <h2 style='color: #5A4335;'>Your Creation Has Been Dispatched! 🚚</h2>
                        <p>Dear Valued Patron,</p>
                        <p>We are delighted to share that your artisan crochet order <strong>{order_num}</strong> has been packaged with care and is on its way.</p>
                        <div style='background: #FFFFFF; border: 1px solid #E7DFD7; border-radius: 12px; padding: 18px; margin: 20px 0;'>
                            <p style='margin: 4px 0;'><strong>Carrier:</strong> {carrier_name}</p>
                            <p style='margin: 4px 0;'><strong>Tracking Number:</strong> {tracking_number}</p>
                            <p style='margin: 4px 0;'><strong>Total Amount:</strong> ₹{order.get('total_amount', 0.0)}</p>
                        </div>
                        <p style='font-size: 12px; color: #7B6656;'>Thank you for cherishing handmade artistry ♡</p>
                    </div>
                    """
                }
                req = urllib.request.Request(
                    "https://api.resend.com/emails",
                    data=json.dumps(payload).encode("utf-8"),
                    headers={
                        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=5) as response:
                    print(f"Resend email dispatched successfully, status: {response.status}")
            except Exception as e:
                print(f"Resend notification dispatch note: {e}")
        else:
            print(f"[TRANSACTIONAL EMAIL MOCK] Shipped notification sent to {recipient} for {order_num} via {carrier_name} (#{tracking_number})")

order_service = OrderService()

# Export functions for flexible importing
create_order = order_service.create_order
get_user_orders = order_service.get_user_orders
get_order_by_id = order_service.get_order_by_id
get_all_orders = order_service.get_all_orders
update_order_status = order_service.update_order_status

