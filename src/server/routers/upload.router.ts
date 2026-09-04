import { Hono } from 'hono';
import { requireAdmin } from '../lib/auth';
import { storageService } from '../services/storage.service';

export const uploadRouter = new Hono();

uploadRouter.post('/upload', async (c) => {
  const adminOrRes = await requireAdmin(c);
  if (adminOrRes instanceof Response) return adminOrRes;

  try {
    const formData = await c.req.formData();
    const file = formData.get('file');
    const bucket = (formData.get('bucket') as string) || 'product-images';
    const folder = (formData.get('folder') as string) || undefined;

    if (!file || typeof file === 'string') {
      return c.json({ detail: 'No file uploaded' }, 400);
    }

    const fileObj = file as File;
    const arrayBuffer = await fileObj.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await storageService.uploadFile(
      buffer,
      fileObj.name,
      fileObj.type,
      bucket,
      folder
    );

    return c.json({
      success: true,
      filename: result.filename,
      url: result.url,
    });
  } catch (err: any) {
    return c.json({ detail: err.message || 'File upload failed' }, err.status || 400);
  }
});
