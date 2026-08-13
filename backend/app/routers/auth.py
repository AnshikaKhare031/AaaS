from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from app.utils.security import get_current_user_optional, get_current_user_required
from app.database import supabase_client

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/me")
async def get_me(user: dict = Depends(get_current_user_required)):
    """
    Returns current authenticated user profile and roles.
    """
    return {
        "id": user["id"],
        "email": user.get("email"),
        "role": user.get("role", "customer"),
        "is_admin": user.get("role") == "admin"
    }

@router.get("/status")
async def get_auth_status(user: Optional[dict] = Depends(get_current_user_optional)):
    if not user:
        return {"authenticated": False, "user": None}
    return {
        "authenticated": True,
        "user": user,
        "is_admin": user.get("role") == "admin"
    }
