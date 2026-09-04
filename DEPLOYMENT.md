# Deployment Guide: AaaS E-Commerce (Unified Vercel Deployment)

This guide walks you through deploying the complete **AaaS E-Commerce** platform to **Vercel** with a single, unified deployment containing both the **React + Vite Frontend** and the **TypeScript / Hono Serverless Backend**, connected to **Supabase** and **Razorpay**.

---

## 1. Architecture Overview

```text
                               VERCEL
        ┌────────────────────────────────────────────────────────┐
        │                                                        │
        │   React Frontend (Vite SPA)   ──>   /                  │
        │   TypeScript Backend (Hono)   ──>   /api/*             │
        │   Edge Middleware (Auth/Role) ──>   /admin/*           │
        │                                                        │
        └───────────────────────────┬────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
          Supabase Platform                  Razorpay Gateway
     - PostgreSQL Database              - Payment Orders
     - Row Level Security (RLS)         - Webhook Events
     - Auth (Customer Sessions)         - HMAC Verification
     - Storage (Product WebP Images)
```

- **Hosting**: Vercel (No Render, Railway, or separate containers required).
- **Backend Runtime**: Vercel Serverless Function (`nodejs` runtime via `@hono/node-server/vercel`).
- **Frontend**: Vite SPA built to `frontend/dist`.
- **Database / Auth / Storage**: Supabase.
- **Payment Gateway**: Razorpay (Webhooks + modal checkout).

---

## 2. Environment Variables Checklist

Configure these environment variables in your **Vercel Project Settings** (`Settings` -> `Environment Variables`):

| Variable | Description | Environment | Example |
| :--- | :--- | :--- | :--- |
| `SUPABASE_URL` | Supabase Project URL | Production, Preview | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Anonymous Key | Production, Preview | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Secret | Production, Preview | `eyJhbGci...` |
| `SUPABASE_JWT_SECRET` | Supabase JWT Secret (Settings -> API -> JWT Secret) | Production, Preview | `your-supabase-jwt-secret` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | Production, Preview | `rzp_live_...` (or `rzp_test_...`) |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | Production, Preview | `your_razorpay_secret` |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Webhook Secret for HMAC verification | Production, Preview | `your_webhook_secret` |
| `ADMIN_EMAIL` | Superadmin Login Email | Production, Preview | `admin@aaas.com` |
| `ADMIN_PASSWORD` | Superadmin Password | Production, Preview | `StrongPassword123!` |
| `ADMIN_JWT_SECRET` | Secret key used to sign Admin session tokens | Production, Preview | `high_entropy_random_secret_32_chars` |
| `RESEND_API_KEY` | *(Optional)* Resend API key for transactional emails | Production, Preview | `re_...` |
| `EMAIL_FROM` | *(Optional)* Sender email address | Production, Preview | `orders@yourdomain.com` |
| `VITE_SUPABASE_URL` | Frontend Supabase URL | Production, Preview | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Frontend Supabase Anon Key | Production, Preview | `eyJhbGci...` |
| `VITE_API_BASE_URL` | Frontend API Base Route | Production, Preview | `/api` |
| `VITE_RAZORPAY_KEY_ID` | Public Razorpay Key ID | Production, Preview | `rzp_live_...` (or `rzp_test_...`) |

---

## 3. Supabase Setup

1. **Database Schema**:
   Apply SQL schema and migrations located in `supabase/` (or table definitions for `products`, `categories`, `orders`, `order_items`, `profiles`, `cart_items`, `wishlist_items`, `custom_orders`, `reviews`, `store_settings`).
2. **Storage Bucket**:
   - Create a public bucket named `product-images`.
   - Set public read permissions so uploaded WebP images can be accessed directly.
3. **Profiles RLS & Role**:
   - Verify that your admin user profile in `profiles` has `role = 'admin'`.

---

## 4. Razorpay Webhook Configuration

1. Log into your [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Go to **Settings** -> **Webhooks** -> **Add New Webhook**.
3. **Webhook URL**: `https://<your-vercel-domain>.vercel.app/api/payment/webhook`
4. **Secret**: Enter the exact secret string you set in `RAZORPAY_WEBHOOK_SECRET`.
5. **Active Events**:
   - `order.paid`
   - `payment.captured`
   - `payment.failed`
6. Click **Save**.

---

## 5. Local Development & Testing

### Prerequisites
- Node.js 20+ (tested on Node 22 / 24)
- npm 10+

### Step 1: Install Dependencies
```bash
# In project root:
npm install

# In frontend folder:
npm install --prefix frontend
```

### Step 2: Configure Local Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### Step 3: Run the Development Server
```bash
npm run dev
```
- **Backend**: Runs on `http://localhost:8000` (`server.ts`)
- **Frontend**: Runs on `http://localhost:5173` (Vite dev server with `/api` proxying to `8000`)

### Step 4: Run Integration & Smoke Tests
```bash
npm test
```
Executes the comprehensive 50-test integration and E2E smoke test suite (`vitest run`).

### Step 5: Typecheck & Production Build Verification
```bash
npm run typecheck
```

---

## 6. Deploying to Vercel

### Option A: GitHub Integration (Recommended)
1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete TypeScript backend migration for Vercel"
   git push origin main
   ```
2. In the [Vercel Dashboard](https://vercel.com/dashboard), click **Add New...** -> **Project**.
3. Select your repository.
4. Framework Preset: **Other** (configured via `vercel.json`).
5. Root Directory: `./` (leave default).
6. Build Command: `npm run build`
7. Output Directory: `frontend/dist`
8. Add your Environment Variables as listed in Section 2.
9. Click **Deploy**.

### Option B: Deploy via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 7. Post-Deployment Verification Checklist

- [ ] **Health Check**: Visit `https://<your-domain>/api/health` — should return `{"status":"ok", ...}`.
- [ ] **Catalog Browsing**: Visit `https://<your-domain>/shop` — categories and products load.
- [ ] **Customer Auth**: Register/Sign in via Supabase Auth on `/login`.
- [ ] **Order Creation & Pricing**: Add items to cart and proceed to `/checkout`.
- [ ] **Razorpay Checkout**: Open checkout, verify modal popup loads with correct total.
- [ ] **Admin Portal**: Access `https://<your-domain>/admin` with valid admin credentials.
- [ ] **Image Upload**: Upload a product image in Admin (`/admin/products/new`) — verify it saves to Supabase storage as WebP.
- [ ] **Webhook Processing**: Send a test payment from Razorpay Test Mode or test webhook event from dashboard — check order status updates to `paid`.
