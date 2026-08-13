import uuid
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.schemas import Category, CategoryCreate, CategoryUpdate
from app.database import store, supabase_client
from app.utils.security import require_admin

router = APIRouter(tags=["Categories"])

@router.get("/categories", response_model=List[Category])
async def get_categories():
    if supabase_client:
        try:
            res = supabase_client.table("categories").select("*").eq("is_active", True).order("display_order").execute()
            if res.data:
                return res.data
        except Exception:
            pass

    cats = [c for c in store.categories.values() if c.get("is_active", True)]
    cats.sort(key=lambda x: x.get("display_order", 0))
    return cats

@router.post("/admin/categories", response_model=Category)
async def create_category(
    cat_in: CategoryCreate,
    admin_user: dict = Depends(require_admin)
):
    cat_id = str(uuid.uuid4())
    now_str = datetime.now(timezone.utc).isoformat()
    new_cat = {
        "id": cat_id,
        "name": cat_in.name,
        "slug": cat_in.slug,
        "description": cat_in.description,
        "image_url": cat_in.image_url,
        "is_active": cat_in.is_active,
        "display_order": cat_in.display_order,
        "created_at": now_str,
        "updated_at": now_str
    }

    if supabase_client:
        try:
            supabase_client.table("categories").insert(new_cat).execute()
        except Exception as e:
            print(f"Supabase category insert error: {e}")

    store.categories[cat_id] = new_cat
    return new_cat

@router.put("/admin/categories/{cat_id}", response_model=Category)
async def update_category(
    cat_id: str,
    cat_update: CategoryUpdate,
    admin_user: dict = Depends(require_admin)
):
    if cat_id not in store.categories:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    cat = store.categories[cat_id]
    data = cat_update.model_dump(exclude_unset=True)
    for k, v in data.items():
        cat[k] = v
    cat["updated_at"] = datetime.now(timezone.utc).isoformat()

    if supabase_client:
        try:
            supabase_client.table("categories").update(cat).eq("id", cat_id).execute()
        except Exception as e:
            print(f"Supabase category update error: {e}")

    return cat

@router.delete("/admin/categories/{cat_id}")
async def delete_category(
    cat_id: str,
    admin_user: dict = Depends(require_admin)
):
    if supabase_client:
        try:
            supabase_client.table("categories").delete().eq("id", cat_id).execute()
        except Exception as e:
            print(f"Supabase category delete error: {e}")

    if cat_id in store.categories:
        del store.categories[cat_id]
        return {"success": True, "message": "Category deleted"}

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
