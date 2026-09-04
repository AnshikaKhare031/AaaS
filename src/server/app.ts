import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { settings } from './config';
import { healthRouter } from './routers/health.router';
import { authRouter } from './routers/auth.router';
import { categoriesRouter } from './routers/categories.router';
import { productsRouter } from './routers/products.router';
import { inventoryRouter } from './routers/inventory.router';
import { cartRouter } from './routers/cart.router';
import { wishlistRouter } from './routers/wishlist.router';
import { customOrdersRouter } from './routers/custom-orders.router';
import { reviewsRouter } from './routers/reviews.router';
import { ordersRouter } from './routers/orders.router';
import { paymentsRouter } from './routers/payments.router';
import { adminRouter } from './routers/admin.router';
import { uploadRouter } from './routers/upload.router';

export const app = new Hono();

// Global CORS Middleware - Strict Origin Allowlist
app.use(
  '*',
  cors({
    origin: (origin) => {
      // 1. Same-origin requests or server-to-server calls where no browser Origin header is present
      if (!origin) return '';

      // 2. Explicitly configured production frontend URL
      if (settings.FRONTEND_URL) {
        const normalizedFrontend = settings.FRONTEND_URL.replace(/\/$/, '');
        if (origin === normalizedFrontend) {
          return origin;
        }
      }

      // 3. Localhost development origins
      if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin === 'http://localhost' ||
        origin === 'http://127.0.0.1'
      ) {
        return origin;
      }

      // 4. Configured CORS_ORIGINS
      if (settings.CORS_ORIGINS.includes(origin)) {
        return origin;
      }

      // 5. Vercel deployment/preview subdomains (*.vercel.app)
      if (origin.endsWith('.vercel.app')) {
        return origin;
      }

      // 6. Strict rejection: do NOT allow arbitrary origins
      return null;
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Razorpay-Signature'],
  })
);

// Global Error Handling
app.onError((err, c) => {
  const status = (err as any).status || 500;
  console.error(`[API Error] ${c.req.method} ${c.req.url} ->`, err);
  return c.json(
    {
      detail: err.message || 'Internal Server Error',
    },
    status
  );
});

// Mount all API routers under /api
const api = new Hono();
api.route('/', healthRouter);
api.route('/', authRouter);
api.route('/', categoriesRouter);
api.route('/', productsRouter);
api.route('/', inventoryRouter);
api.route('/', cartRouter);
api.route('/', wishlistRouter);
api.route('/', customOrdersRouter);
api.route('/', reviewsRouter);
api.route('/', ordersRouter);
api.route('/', paymentsRouter);
api.route('/', adminRouter);
api.route('/', uploadRouter);

app.route('/api', api);
app.route('/', api);

// Also mount root health check
app.get('/health', (c) => c.json({ status: 'healthy' }));

// 404 handler
app.notFound((c) => {
  return c.json({ detail: `Route '${c.req.path}' not found` }, 404);
});

export default app;
