import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.schemas import CartItem, AddToCartPayload, UpdateCartItemPayload
from app.database import store, supabase_client
from app.utils.security import get_current_user_optional

router = APIRouter(prefix="/cart", tags=["Cart"])

@router.get("", response_model=List[CartItem])
async def get_cart(user: dict = Depends(get_current_user_optional)):
    user_id = user["id"] if user else "guest"
    user_items = store.cart_items.get(user_id, [])
    
    # Enrich with latest product details
    enriched = []
    for item in user_items:
        p = store.products.get(item["product_id"])
        if p:
            enriched.append({**item, "product": p})
    return enriched

@router.post("", response_model=CartItem)
async def add_to_cart(payload: AddToCartPayload, user: dict = Depends(get_current_user_optional)):
    user_id = user["id"] if user else "guest"
    product = store.products.get(payload.product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if product.get("stock_quantity", 0) < payload.quantity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient stock")

    if user_id not in store.cart_items:
        store.cart_items[user_id] = []

    # Check if item already exists
    existing = next((i for i in store.cart_items[user_id] if i["product_id"] == payload.product_id), None)
    if existing:
        existing["quantity"] += payload.quantity
        return {**existing, "product": product}
    else:
        new_item = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "product_id": payload.product_id,
            "quantity": payload.quantity,
        }
        store.cart_items[user_id].append(new_item)
        return {**new_item, "product": product}

@router.put("/{item_id}", response_model=CartItem)
async def update_cart_item(item_id: str, payload: UpdateCartItemPayload, user: dict = Depends(get_current_user_optional)):
    user_id = user["id"] if user else "guest"
    items = store.cart_items.get(user_id, [])
    item = next((i for i in items if i["id"] == item_id or i["product_id"] == item_id), None)
    
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

    prod = store.products.get(item["product_id"])
    if prod and payload.quantity > prod.get("stock_quantity", 0):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Requested quantity exceeds available stock")

    item["quantity"] = payload.quantity
    return {**item, "product": prod}

@router.delete("/{item_id}")
async def remove_cart_item(item_id: str, user: dict = Depends(get_current_user_optional)):
    user_id = user["id"] if user else "guest"
    if user_id in store.cart_items:
        store.cart_items[user_id] = [
            i for i in store.cart_items[user_id] if i["id"] != item_id and i["product_id"] != item_id
        ]
    return {"success": True, "message": "Item removed from cart"}

@router.delete("/clear")
async def clear_cart(user: dict = Depends(get_current_user_optional)):
    user_id = user["id"] if user else "guest"
    if user_id in store.cart_items:
        store.cart_items[user_id] = []
    return {"success": True, "message": "Cart cleared"}
