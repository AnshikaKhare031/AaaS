import os
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Optional

from app.config import settings
from app.database import store, supabase_client
from app.services.storage_service import storage_service
from app.utils.security import require_admin

# Routers
from app.routers import (
    auth,
    products,
    categories,
    inventory,
    cart,
    wishlist,
    custom_orders,
    reviews,
    orders,
    admin,
    payments,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=" * 60)
    print(f"✨ Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    print(f"📦 Environment: {settings.ENVIRONMENT}")
    if supabase_client:
        print("🔗 Supabase PostgreSQL: Connected")
    else:
        print("💡 Supabase credentials not set yet -> Running with in-memory seeded store")
    print("=" * 60)
    yield
    print("🛑 Shutting down AaaS Backend Service")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Full-Stack Production REST API for AaaS - Premium Handmade Crochet Boutique Brand",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API Routers under /api
app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(inventory.router, prefix="/api")
app.include_router(cart.router, prefix="/api")
app.include_router(wishlist.router, prefix="/api")
app.include_router(custom_orders.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

# Static Files & Uploads Mounting
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BACKEND_STATIC_DIR = os.path.join(BASE_DIR, "backend", "static")
BACKEND_UPLOADS_DIR = os.path.join(BACKEND_STATIC_DIR, "uploads")
FRONTEND_IMAGES_DIR = os.path.join(BASE_DIR, "frontend", "public", "images")

os.makedirs(BACKEND_UPLOADS_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=BACKEND_STATIC_DIR), name="static")
app.mount("/uploads", StaticFiles(directory=BACKEND_UPLOADS_DIR), name="uploads")

if os.path.exists(FRONTEND_IMAGES_DIR):
    app.mount("/images", StaticFiles(directory=FRONTEND_IMAGES_DIR), name="images")

# System Health Endpoint
@app.get("/api/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "supabase_connected": supabase_client is not None,
        "environment": settings.ENVIRONMENT
    }

# File Upload Endpoint (Restricted to Admin Sessions)
@app.post("/api/upload", tags=["Storage"])
async def upload_image_endpoint(
    file: UploadFile = File(...),
    bucket: str = Form("product-images"),
    folder: Optional[str] = Form(None),
    admin_user: dict = Depends(require_admin)
):
    """
    Multi-part file upload endpoint restricted to admin sessions.
    Enforces max file size 5MB and image/jpeg, image/png, image/webp MIME types.
    """
    result = await storage_service.upload_file(file, bucket=bucket, folder=folder)
    return {
        "success": True,
        "filename": result["filename"],
        "url": result["url"]
    }
