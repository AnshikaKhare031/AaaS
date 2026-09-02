import os
import re
import uuid
from typing import Optional, Dict
from fastapi import UploadFile, HTTPException, status
from app.database import supabase_client

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

class StorageService:
    @staticmethod
    async def upload_file(
        file: UploadFile,
        bucket: str = "product-images",
        folder: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Uploads an image file to Supabase Storage with defensive 5MB size limits,
        MIME-type enforcement, and sanitized [uuid]-[slug].webp naming.
        """
        # Validate MIME type
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type '{file.content_type}'. Allowed types are: image/jpeg, image/png, image/webp."
            )

        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds maximum permitted limit of 5MB."
            )

        # Sanitize filename to [uuid]-[slug].webp
        raw_name = file.filename or "product_asset"
        base_name = raw_name.rsplit(".", 1)[0]
        slug = re.sub(r"[^a-zA-Z0-9_-]", "-", base_name).strip("-").lower()
        slug = slug[:30] if slug else "asset"
        sanitized_filename = f"{uuid.uuid4().hex[:8]}-{slug}.webp"

        path = f"{folder}/{sanitized_filename}" if folder else sanitized_filename

        # Always save locally to ensure static resolution
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        repo_dir = os.path.dirname(backend_dir)
        backend_uploads_dir = os.path.join(backend_dir, "static", "uploads")
        os.makedirs(backend_uploads_dir, exist_ok=True)
        try:
            with open(os.path.join(backend_uploads_dir, sanitized_filename), "wb") as f:
                f.write(content)
        except Exception as e:
            print(f"Failed to write to backend uploads dir: {e}")

        # Also copy to frontend/public/images so Vite serves it instantly
        frontend_images_dir = os.path.join(repo_dir, "frontend", "public", "images")
        if os.path.exists(frontend_images_dir):
            try:
                with open(os.path.join(frontend_images_dir, sanitized_filename), "wb") as f:
                    f.write(content)
            except Exception as e:
                print(f"Failed to write to frontend public images dir: {e}")

        if supabase_client:
            try:
                supabase_client.storage.from_(bucket).upload(path, content, {"content-type": file.content_type})
                public_url = supabase_client.storage.from_(bucket).get_public_url(path)
                return {"url": public_url, "filename": sanitized_filename}
            except Exception as e:
                print(f"Supabase storage upload notice: {e}")

        # Local URL representation (resolvable via both Vite and FastAPI)
        return {
            "url": f"/images/{sanitized_filename}",
            "filename": sanitized_filename
        }

storage_service = StorageService()
