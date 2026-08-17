from typing import Optional
from fastapi import HTTPException, status
from app.database import store, supabase_client

class InventoryService:
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
