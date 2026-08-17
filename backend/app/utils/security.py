import jwt
from fastapi import Header, HTTPException, Depends, status
from typing import Optional
from app.config import settings
from app.database import store, supabase_client

async def get_current_user_optional(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """
    Extracts and cryptographically verifies user session from Authorization Bearer JWT.
    Queries the database profiles table for the actual server-side role.
    """
    if not authorization:
        return None
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    token = parts[1]

    try:
        # Verify signature against the real Supabase JWT secret (Project Settings > API > JWT Secret)
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.InvalidTokenError:
        return None

    user_id = payload.get("sub")
    email = payload.get("email", "")
    if not user_id:
        return None

    # Look up the real role from the profiles table (never trust a role claim in the token itself)
    role = "customer"
    if supabase_client:
        try:
            res = supabase_client.table("profiles").select("role").eq("id", user_id).single().execute()
            role = res.data.get("role", "customer") if res.data else "customer"
        except Exception:
            role = "customer"
    else:
        profile = store.profiles.get(user_id) if hasattr(store, "profiles") else None
        if profile:
            role = profile.get("role", "customer")

    return {"id": user_id, "email": email, "role": role}


async def get_current_user_required(current_user: Optional[dict] = Depends(get_current_user_optional)) -> dict:
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


async def require_admin(current_user: dict = Depends(get_current_user_required)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin authorization required to access this resource",
        )
    return current_user
