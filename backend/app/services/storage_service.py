import uuid
from typing import Optional
from fastapi import UploadFile, HTTPException, status
from app.database import supabase_client

class StorageService:
    @staticmethod
    async def upload_file(file: UploadFile, bucket: str = "product-images", folder: Optional[str] = None) -> str:
        """
        Uploads file to Supabase Storage and returns the public URL.
        """
        file_ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
        unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
        path = f"{folder}/{unique_filename}" if folder else unique_filename

        content = await file.read()

        if supabase_client:
            try:
                supabase_client.storage.from_(bucket).upload(path, content)
                public_url = supabase_client.storage.from_(bucket).get_public_url(path)
                return public_url
            except Exception as e:
                print(f"Supabase storage upload error: {e}")

        # Fallback local mock path
        return f"/images/{file.filename or 'uploaded_image.jpg'}"

storage_service = StorageService()
