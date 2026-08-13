import uuid
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.schemas import Review, ReviewCreate, ReviewStatusUpdate
from app.database import store, supabase_client
from app.utils.security import get_current_user_optional, require_admin

router = APIRouter(tags=["Reviews"])

@router.get("/products/{product_id}/reviews", response_model=List[Review])
async def get_product_reviews(product_id: str):
    if supabase_client:
        try:
            res = supabase_client.table("reviews").select("*").eq("product_id", product_id).eq("is_approved", True).order("created_at", desc=True).execute()
            if res.data:
                return res.data
        except Exception:
            pass

    revs = [r for r in store.reviews.values() if r.get("product_id") == product_id and r.get("is_approved", True)]
    revs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return revs

@router.post("/reviews", response_model=Review)
async def submit_product_review(
    review_in: ReviewCreate,
    user: dict = Depends(get_current_user_optional)
):
    rev_id = str(uuid.uuid4())
    now_str = datetime.now(timezone.utc).isoformat()
    new_rev = {
        "id": rev_id,
        "product_id": review_in.product_id,
        "user_id": user["id"] if user else None,
        "customer_name": review_in.customer_name or (user.get("email", "").split("@")[0] if user else "Customer"),
        "rating": review_in.rating,
        "comment": review_in.comment,
        "is_approved": True,  # Auto approve or set to False if strict moderation
        "created_at": now_str,
    }

    if supabase_client:
        try:
            supabase_client.table("reviews").insert(new_rev).execute()
        except Exception as e:
            print(f"Supabase review insert error: {e}")

    store.reviews[rev_id] = new_rev
    return new_rev

@router.get("/admin/reviews", response_model=List[Review])
async def list_admin_reviews(admin_user: dict = Depends(require_admin)):
    if supabase_client:
        try:
            res = supabase_client.table("reviews").select("*").order("created_at", desc=True).execute()
            if res.data:
                return res.data
        except Exception:
            pass

    revs = list(store.reviews.values())
    revs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return revs

@router.put("/admin/reviews/{review_id}/status", response_model=Review)
async def update_review_moderation(
    review_id: str,
    status_in: ReviewStatusUpdate,
    admin_user: dict = Depends(require_admin)
):
    if review_id not in store.reviews:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    rev = store.reviews[review_id]
    rev["is_approved"] = status_in.is_approved

    if supabase_client:
        try:
            supabase_client.table("reviews").update({"is_approved": status_in.is_approved}).eq("id", review_id).execute()
        except Exception as e:
            print(f"Supabase review update error: {e}")

    return rev
