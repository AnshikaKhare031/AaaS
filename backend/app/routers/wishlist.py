import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.schemas import WishlistItem, WishlistPayload
from app.database import store, supabase_client
from app.utils.security import get_current_user_optional

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])

@router.get("", response_model=List[WishlistItem])
async def get_wishlist(user: dict = Depends(get_current_user_optional)):
    user_id = user["id"] if user else "guest"
    items = store.wishlist_items.get(user_id, [])
    
    enriched = []
    for item in items:
        p = store.products.get(item["product_id"])
        if p:
            enriched.append({**item, "product": p})
    return enriched

@router.post("", response_model=WishlistItem)
async def add_to_wishlist(payload: WishlistPayload, user: dict = Depends(get_current_user_optional)):
    user_id = user["id"] if user else "guest"
    product = store.products.get(payload.product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if user_id not in store.wishlist_items:
        store.wishlist_items[user_id] = []

    existing = next((i for i in store.wishlist_items[user_id] if i["product_id"] == payload.product_id), None)
    if existing:
        return {**existing, "product": product}

    new_item = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "product_id": payload.product_id,
    }
    store.wishlist_items[user_id].append(new_item)
    return {**new_item, "product": product}

@router.delete("/{product_id}")
async def remove_from_wishlist(product_id: str, user: dict = Depends(get_current_user_optional)):
    user_id = user["id"] if user else "guest"
    if user_id in store.wishlist_items:
        store.wishlist_items[user_id] = [
            i for i in store.wishlist_items[user_id] if i["product_id"] != product_id and i["id"] != product_id
        ]
    return {"success": True, "message": "Product removed from wishlist"}
