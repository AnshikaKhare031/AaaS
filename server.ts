import { serve } from '@hono/node-server';
import app from './src/server/app';
import { settings } from './src/server/config';

console.log('='.repeat(60));
console.log(`? Starting ${settings.PROJECT_NAME} v${settings.VERSION} (TypeScript Backend)`);
console.log(`?? Environment: ${settings.ENVIRONMENT}`);
console.log(`?? Server listening on http://127.0.0.1:${settings.PORT}`);
console.log('='.repeat(60));

serve({
  fetch: app.fetch,
  port: settings.PORT,
});
