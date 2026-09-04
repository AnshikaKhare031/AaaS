import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import crypto from 'crypto';
import { settings } from '../config';
import { requireAdmin, createAdminSessionToken } from '../lib/auth';
import { adminService } from '../services/admin.service';
import { isProduction } from '../database';

export const adminRouter = new Hono();

adminRouter.post('/admin/login', async (c) => {
  const body = await c.req.json();
  const emailClean = (body.email || '').trim().toLowerCase();
  const expectedEmail = settings.ADMIN_EMAIL;

  if (emailClean !== expectedEmail) {
    return c.json({ detail: 'Invalid admin credentials' }, 401);
  }

  let isValidPassword = false;
  if (settings.ADMIN_PASSWORD_HASH) {
    try {
      const pBuf = Buffer.from(body.password || '');
      const hBuf = Buffer.from(settings.ADMIN_PASSWORD_HASH);
      if (pBuf.length === hBuf.length) {
        isValidPassword = crypto.timingSafeEqual(pBuf, hBuf);
      }
    } catch {
      isValidPassword = false;
    }
  }

  if (!isValidPassword && settings.ADMIN_SECRET) {
    try {
      const pBuf = Buffer.from(body.password || '');
      const sBuf = Buffer.from(settings.ADMIN_SECRET);
      if (pBuf.length === sBuf.length) {
        isValidPassword = crypto.timingSafeEqual(pBuf, sBuf);
      }
    } catch {
      isValidPassword = false;
    }
  }

  if (!isValidPassword) {
    return c.json({ detail: 'Invalid admin credentials' }, 401);
  }

  const token = createAdminSessionToken(expectedEmail);

  setCookie(c, 'admin_session', token, {
    maxAge: 604800,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'Lax',
    path: '/',
  });

  const adminProfile = {
    id: 'admin-user-id-001',
    email: expectedEmail,
    full_name: 'AaaS Master Artisan',
    role: 'admin',
  };

  return c.json({
    success: true,
    token,
    user: adminProfile,
  });
});

adminRouter.post('/admin/logout', async (c) => {
  deleteCookie(c, 'admin_session', {
    path: '/',
    sameSite: 'Lax',
    secure: isProduction,
  });
  return c.json({
    success: true,
    message: 'Admin session invalidated and logged out successfully',
  });
});

adminRouter.get('/admin/me', async (c) => {
  const adminOrRes = await requireAdmin(c);
  if (adminOrRes instanceof Response) return adminOrRes;

  return c.json({
    authenticated: true,
    user: adminOrRes,
  });
});

adminRouter.get('/admin/dashboard', async (c) => {
  const adminOrRes = await requireAdmin(c);
  if (adminOrRes instanceof Response) return adminOrRes;

  const data = await adminService.getDashboardOverview();
  return c.json(data);
});

adminRouter.get('/admin/settings', async (c) => {
  const settingsData = await adminService.getStoreSettings();
  return c.json(settingsData);
});

adminRouter.put('/admin/settings', async (c) => {
  const adminOrRes = await requireAdmin(c);
  if (adminOrRes instanceof Response) return adminOrRes;

  const body = await c.req.json();
  const updated = await adminService.updateStoreSettings(body);
  return c.json(updated);
});

adminRouter.get('/admin/analytics', async (c) => {
  const adminOrRes = await requireAdmin(c);
  if (adminOrRes instanceof Response) return adminOrRes;

  const timeRange = c.req.query('time_range') || '30d';
  const data = await adminService.getAnalytics(timeRange);
  return c.json(data);
});
