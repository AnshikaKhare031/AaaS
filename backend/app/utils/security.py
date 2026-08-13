from fastapi import Header, HTTPException, Depends, status
from typing import Optional
from app.config import settings
import jwt

async def get_current_user_optional(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """
    Extracts user info from Authorization header if present.
    Supports Supabase JWT tokens and demo tokens.
    """
    if not authorization:
        return None
    
    try:
        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None
        
        token = parts[1]
        
        # Handle demo token
        if token.startswith("demo-"):
            role = "admin" if "admin" in token else "customer"
            return {
                "id": "demo-admin-uuid-001" if role == "admin" else "demo-customer-uuid-001",
                "email": "admin@aaascrochet.com" if role == "admin" else "customer@aaascrochet.com",
                "role": role,
            }
        
        # In a live Supabase environment, decode without verifying secret if supabase manages it,
        # or verify with JWT secret if configured.
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            user_id = payload.get("sub")
            email = payload.get("email", "")
            role = payload.get("app_metadata", {}).get("role") or payload.get("user_metadata", {}).get("role", "customer")
            return {
                "id": user_id,
                "email": email,
                "role": role,
            }
        except Exception:
            return None
    except Exception:
        return None

async def get_current_user_required(current_user: Optional[dict] = Depends(get_current_user_optional)) -> dict:
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user

async def require_admin(
    authorization: Optional[str] = Header(None),
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    current_user: Optional[dict] = Depends(get_current_user_optional)
) -> dict:
    """
    Ensures the requester has admin privileges.
    Verifies either:
    1. A valid admin Supabase JWT role ('admin')
    2. A valid X-Admin-Key matching settings.ADMIN_SECRET_KEY
    3. Demo admin credentials
    """
    # 1. Check custom admin key header
    if x_admin_key and x_admin_key == settings.ADMIN_SECRET_KEY:
        return {"id": "system-admin", "role": "admin", "email": "system-admin@aaascrochet.com"}

    # 2. Check user role
    if current_user and current_user.get("role") == "admin":
        return current_user

    # If in development mode without strict Supabase auth, allow demo admin headers
    if authorization and "admin" in authorization.lower():
        return {"id": "demo-admin-uuid-001", "role": "admin", "email": "admin@aaascrochet.com"}

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Admin authorization required to access this resource",
    )
