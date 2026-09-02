import jwt
from fastapi import Header, HTTPException, Depends, Request, status
from typing import Optional
from datetime import datetime, timezone, timedelta
from app.config import settings
from app.database import store, supabase_client

def create_admin_session_token(email: Optional[str] = None, user_id: str = "admin-user-id-001") -> str:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(days=7)
    payload = {
        "sub": user_id,
        "email": email or settings.ADMIN_EMAIL,
        "role": "admin",
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
        "aud": "authenticated",
    }
    return jwt.encode(payload, settings.ADMIN_JWT_SECRET, algorithm="HS256")

async def get_current_user_optional(
    request: Request,
    authorization: Optional[str] = Header(None)
) -> Optional[dict]:
    """
    Extracts and cryptographically verifies user session from Authorization Bearer JWT
    or admin_session cookie. Queries the database profiles table for server-side role.
    """
    token = None
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
    if not token:
        token = request.cookies.get("admin_session")

    if not token:
        return None

    payload = None
    for secret in [settings.ADMIN_JWT_SECRET, settings.SUPABASE_JWT_SECRET]:
        try:
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )
            break
        except (jwt.InvalidTokenError, Exception):
            continue

    if not payload:
        return None

    user_id = payload.get("sub")
    email = payload.get("email", "")
    if not user_id:
        return None

    # Look up real role from profiles table (or store)
    role = payload.get("role", "customer")
    if supabase_client:
        try:
            res = supabase_client.table("profiles").select("role").eq("id", user_id).single().execute()
            if res.data:
                role = res.data.get("role", role)
        except Exception:
            pass
    else:
        profile = store.profiles.get(user_id) if hasattr(store, "profiles") else None
        if profile:
            role = profile.get("role", role)

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
