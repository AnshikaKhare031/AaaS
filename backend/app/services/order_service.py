import random
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from app.database import store, supabase_client
from app.schemas.schemas import OrderCreate

class OrderService:
    @staticmethod
    def generate_order_number() -> str:
        year = datetime.now().year
        random_digits = random.randint(1000, 9999)
        return f"AAAS-{year}-{random_digits}"

    @staticmethod
    def calculate_order_financials(items_data: List[dict]) -> Dict[str, Any]:
        """
        Calculates subtotal, shipping_fee, and total using AUTHORITATIVE prices from the database.
        Never trusts client-provided prices!
        """
        subtotal = 0.0
        enriched_items = []

        settings_fee = store.settings.get("fixed_shipping_fee", 99.0)
        free_threshold = store.settings.get("free_shipping_threshold", 1499.0)
        enable_free = store.settings.get("enable_free_shipping", True)

        for item in items_data:
            product_id = item.get("product_id")
            quantity = item.get("quantity", 1)

            # Look up product in Supabase or Store
            product = None
            if supabase_client:
                try:
                    res = supabase_client.table("products").select("*, product_images(*)").eq("id", product_id).single().execute()
                    product = res.data
                except Exception:
                    pass

            if not product:
                product = store.products.get(product_id)

            if not product:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product ID '{product_id}' is invalid or no longer available."
                )

            # Authoritative unit price
            price = float(product.get("sale_price") if product.get("sale_price") is not None else product.get("price"))
            line_subtotal = price * quantity
            subtotal += line_subtotal

            image_url = "/images/tulip_bouquet.jpg"
            if product.get("images"):
                image_url = product["images"][0].get("image_url", image_url)
            elif product.get("product_images"):
                image_url = product["product_images"][0].get("image_url", image_url)

            enriched_items.append({
                "id": str(uuid.uuid4()),
                "product_id": product_id,
                "product_name": product.get("name"),
                "product_image": image_url,
                "quantity": quantity,
                "unit_price": price,
                "subtotal": line_subtotal
            })

        # Calculate shipping fee
        is_free = enable_free and subtotal >= free_threshold
        shipping_fee = 0.0 if (len(enriched_items) == 0 or is_free) else float(settings_fee)
        total = round(subtotal + shipping_fee, 2)

        return {
            "subtotal": round(subtotal, 2),
            "shipping_fee": round(shipping_fee, 2),
            "total": total,
            "items": enriched_items
        }

    @classmethod
    def create_order(cls, order_in: OrderCreate, user_id: Optional[str] = None) -> dict:
        financials = cls.calculate_order_financials([item.model_dump() for item in order_in.items])
        
        order_id = str(uuid.uuid4())
        order_number = cls.generate_order_number()
        now_str = datetime.now(timezone.utc).isoformat()

        # Ensure each item has order_id
        items_with_order_id = [{**it, "order_id": order_id} for it in financials["items"]]

        order_record = {
            "id": order_id,
            "user_id": user_id,
            "order_number": order_number,
            "subtotal": financials["subtotal"],
            "shipping_fee": financials["shipping_fee"],
            "total": financials["total"],
            "currency": "INR",
            "payment_status": "pending",
            "order_status": "pending",
            "shipping_name": order_in.shipping_name,
            "shipping_email": order_in.shipping_email,
            "shipping_phone": order_in.shipping_phone,
            "shipping_address": order_in.shipping_address,
            "shipping_city": order_in.shipping_city,
            "shipping_state": order_in.shipping_state,
            "shipping_pincode": order_in.shipping_pincode,
            "shipping_country": order_in.shipping_country,
            "notes": order_in.notes,
            "tracking_number": None,
            "items": items_with_order_id,
            "created_at": now_str,
            "updated_at": now_str
        }

        # Persist to Supabase if configured
        if supabase_client:
            try:
                # Insert order
                order_insert = {k: v for k, v in order_record.items() if k != "items"}
                supabase_client.table("orders").insert(order_insert).execute()
                
                # Insert order items
                for it in items_with_order_id:
                    supabase_client.table("order_items").insert(it).execute()
            except Exception as e:
                print(f"Failed to persist order to Supabase: {e}")

        # Always save in store
        store.orders[order_id] = order_record
        return order_record

order_service = OrderService()
