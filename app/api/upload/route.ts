import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/utils/auth";
import { uploadImageServer } from "@/lib/supabase/products-server";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates the image binary against canonical magic bytes.
 * Supports JPEG, PNG, and WebP formats.
 */
function detectImageMimeType(buffer: Uint8Array): string | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // WebP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

export async function POST(request: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 1. Enforce strict 5MB maximum file size limit
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds maximum allowed size of 5MB." },
        { status: 400 }
      );
    }

    // Read file contents as ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    if (fileBuffer.byteLength > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds maximum allowed size of 5MB." },
        { status: 400 }
      );
    }

    // 2. Validate actual image magic bytes (not trusting client-supplied file.type)
    const uint8Array = new Uint8Array(fileBuffer);
    const verifiedMimeType = detectImageMimeType(uint8Array);

    if (!verifiedMimeType) {
      return NextResponse.json(
        { error: "Invalid image format. Only JPEG, PNG, and WebP images are permitted." },
        { status: 400 }
      );
    }

    // 3. Generate safe unique filename with verified extension
    const extensionMap: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };
    const extension = extensionMap[verifiedMimeType] || ".png";

    const timestamp = Date.now();
    const baseName = file.name
      ? file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50)
      : "upload";
    const filename = `${timestamp}_${baseName}${extension}`;

    const publicUrl = await uploadImageServer(fileBuffer, filename, verifiedMimeType);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("POST /api/upload error:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to upload image";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
