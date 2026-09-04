import { Hono } from 'hono';
import { settings } from '../config';
import { supabaseClient } from '../database';

export const healthRouter = new Hono();

healthRouter.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: settings.PROJECT_NAME,
    version: settings.VERSION,
    supabase_connected: supabaseClient !== null,
    environment: settings.ENVIRONMENT,
  });
});
