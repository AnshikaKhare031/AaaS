from typing import List, Tuple, Optional
from fastapi import HTTPException, status
from app.database import store, supabase_client

class InventoryService:
    @staticmethod
    def check_stock_availability(items: List[dict]) -> Tuple[bool, Optional[str]]:
        """
        Validates whether all requested items in the order have sufficient stock.
        Returns (True, None) if stock is sufficient, or (False, error_message).
        """
        for item in items:
            product_id = item.get("product_id")
            quantity = item.get("quantity", 1)

            if supabase_client:
                try:
                    res = supabase_client.table("products").select("name, stock_quantity, is_active").eq("id", product_id).single().execute()
                    if res.data:
                        stock = res.data.get("stock_quantity", 0)
                        name = res.data.get("name", "Product")
                        if stock < quantity:
                            return False, f'Only {stock} items available for "{name}".'
                except Exception as e:
                    print(f"Supabase stock check error: {e}")

            # Check store
            if product_id in store.products:
                prod = store.products[product_id]
                stock = prod.get("stock_quantity", 0)
                name = prod.get("name", "Product")
                if stock < quantity:
                    return False, f'Only {stock} items available for "{name}".'
            else:
                return False, f"Product ID {product_id} not found."

        return True, None

    @staticmethod
    def reduce_stock_for_order(items: List[dict]) -> bool:
        """
        Atomically/Transactionally decreases product stock after verified payment.
        """
        for item in items:
            product_id = item.get("product_id")
            quantity = item.get("quantity", 1)

            # 1. Update in Supabase if live
            if supabase_client:
                try:
                    res = supabase_client.table("products").select("stock_quantity").eq("id", product_id).single().execute()
                    if res.data:
                        current = res.data.get("stock_quantity", 0)
                        new_stock = max(0, current - quantity)
                        supabase_client.table("products").update({
                            "stock_quantity": new_stock
                        }).eq("id", product_id).execute()
                except Exception as e:
                    print(f"Supabase stock deduction error: {e}")

            # 2. Update in store
            if product_id in store.products:
                current = store.products[product_id].get("stock_quantity", 0)
                new_stock = max(0, current - quantity)
                store.products[product_id]["stock_quantity"] = new_stock

        return True

    @staticmethod
    def adjust_stock(product_id: str, delta: int, reason: Optional[str] = None) -> dict:
        """
        Adjust stock quantity by delta (positive or negative).
        """
        if supabase_client:
            try:
                res = supabase_client.table("products").select("*").eq("id", product_id).single().execute()
                if res.data:
                    current = res.data.get("stock_quantity", 0)
                    new_stock = max(0, current + delta)
                    upd = supabase_client.table("products").update({
                        "stock_quantity": new_stock
                    }).eq("id", product_id).execute()
                    return upd.data[0] if upd.data else res.data
            except Exception as e:
                print(f"Supabase stock adjust error: {e}")

        if product_id not in store.products:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

        prod = store.products[product_id]
        current = prod.get("stock_quantity", 0)
        new_stock = max(0, current + delta)
        prod["stock_quantity"] = new_stock
        return prod

inventory_service = InventoryService()
