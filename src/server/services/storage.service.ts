import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { supabaseClient, isProduction } from '../database';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export class StorageService {
  async uploadFile(
    content: Buffer,
    filename: string,
    contentType: string,
    bucket = 'product-images',
    folder?: string
  ): Promise<{ success: boolean; filename: string; url: string }> {
    if (!ALLOWED_MIME_TYPES.has(contentType)) {
      const err = new Error(
        `Unsupported file type '${contentType}'. Allowed types are: image/jpeg, image/png, image/webp.`
      ) as any;
      err.status = 400;
      throw err;
    }

    if (content.length > MAX_FILE_SIZE) {
      const err = new Error('File size exceeds maximum permitted limit of 5MB.') as any;
      err.status = 400;
      throw err;
    }

    const rawName = filename || 'product_asset';
    const baseName = rawName.split('.')[0] || 'asset';
    const slug =
      baseName
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase()
        .slice(0, 30) || 'asset';

    const uniquePrefix = crypto.randomBytes(4).toString('hex');
    const sanitizedFilename = `${uniquePrefix}-${slug}.webp`;
    const storagePath = folder ? `${folder}/${sanitizedFilename}` : sanitizedFilename;

    // Try saving locally to frontend/public/images if dir exists and not in test/serverless
    if (process.env.NODE_ENV !== 'test' && !isProduction) {
      try {
        const frontendPublicImages = path.resolve(process.cwd(), 'frontend', 'public', 'images');
        if (fs.existsSync(frontendPublicImages)) {
          fs.writeFileSync(path.join(frontendPublicImages, sanitizedFilename), content);
        }
      } catch {
        // Ignored in serverless
      }
    }

    if (supabaseClient) {
      try {
        const { error } = await supabaseClient.storage
          .from(bucket)
          .upload(storagePath, content, { contentType, upsert: true });

        if (!error) {
          const { data } = supabaseClient.storage.from(bucket).getPublicUrl(storagePath);
          return {
            success: true,
            filename: sanitizedFilename,
            url: data.publicUrl,
          };
        }

        if (isProduction) {
          throw new Error(`Supabase storage upload failed: ${error.message}`);
        }
      } catch (err: any) {
        if (isProduction) {
          throw err;
        }
        console.warn('Supabase storage upload notice:', err);
      }
    } else if (isProduction) {
      throw new Error('Supabase storage client required for file uploads in production.');
    }

    return {
      success: true,
      filename: sanitizedFilename,
      url: `/images/${sanitizedFilename}`,
    };
  }
}

export const storageService = new StorageService();
