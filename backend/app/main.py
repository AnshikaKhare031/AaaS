from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, status
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
    orders,
    payments,
    custom_orders,
    reviews,
    admin,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=" * 60)
    print(f"✨ Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    print(f"📦 Environment: {settings.ENVIRONMENT}")
    print(f"⚡ Razorpay Key ID: {settings.RAZORPAY_KEY_ID[:8]}***")
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
app.include_router(orders.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(custom_orders.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

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

# File Upload Endpoint (for Product Images and Custom Order References)
@app.post("/api/upload", tags=["Storage"])
async def upload_image_endpoint(
    file: UploadFile = File(...),
    bucket: str = Form("product-images"),
    folder: Optional[str] = Form(None)
):
    """
    Uploads an image file to Supabase Storage and returns the public accessible URL.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files (JPEG, PNG, WebP, SVG) are allowed."
        )

    file_url = await storage_service.upload_file(file, bucket=bucket, folder=folder)
    return {
        "success": True,
        "filename": file.filename,
        "url": file_url
    }
