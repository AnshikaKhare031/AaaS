# AaaS — Premium Handmade Crochet Boutique E-Commerce

A full-stack, production-ready luxury e-commerce platform crafted for **AaaS**, an independent boutique brand specializing in handmade crochet flowers, bags, accessories, and bespoke personalized creations.

The backend is built with **TypeScript (Hono)**, running as high-performance serverless functions on **Vercel** alongside the **React (Vite)** storefront, backed by **Supabase** (PostgreSQL, Auth, Storage) and **Razorpay** (Payments & Webhooks).

---

## ✨ Brand Identity & Design System

- **Brand Aesthetic**: Warm, minimal, feminine, editorial, artisan luxury.
- **Color Palette**:
  - Main Background: Soft Ivory (`#F8F5F0`)
  - Secondary Background: Warm Beige (`#EADCCF`)
  - Typography Primary: Espresso Brown (`#5A4335`)
  - Typography Dark: Dark Brown (`#3D2E24`)
  - Secondary Text: Taupe Brown (`#7B6656`)
  - Primary Accent: Antique Gold (`#C6A15B`)
  - Soft Accent: Sage Green (`#B7C0A6`)
  - Borders: Warm Neutral (`#E7DFD7`)
- **Typography**:
  - Headings / Editorial: **Cormorant Garamond**
  - Body / Interfaces: **Manrope**
  - Subtle Accents: **Allura**

---

## 🏗️ Architecture & Tech Stack

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

```
AaaS/
├── frontend/             # React 19 + TypeScript + Vite + Tailwind CSS + Framer Motion
│   ├── src/
│   │   ├── components/   # Logo, Navbar, Footer, ProductCard, SearchModal, etc.
│   │   ├── pages/        # Storefront, Checkout, Custom Orders, Admin Portal
│   │   ├── context/      # AuthContext, CartContext, WishlistContext, ToastContext
│   │   ├── services/     # Axios REST client + Supabase JS Client
│   │   └── types/        # Comprehensive TypeScript Interfaces
│   └── public/images/    # High-resolution lifestyle crochet photography
│
├── src/server/           # TypeScript Backend Engine (Hono)
│   ├── app.ts            # Hono application assembly & error handling
│   ├── config.ts         # Environment settings validation
│   ├── database.ts       # Supabase PostgreSQL client + seeded fallback store
│   ├── lib/              # Auth (JWT verification), Razorpay HMAC helpers
│   ├── services/         # Order, Payment, Inventory, Storage, Admin services
│   └── routers/          # 13 Modular routers (products, orders, payments, admin...)
│
├── api/
│   └── index.ts          # Vercel Serverless Function entry point (hono/vercel)
│
├── server.ts             # Local development server (port 8000 via @hono/node-server)
├── middleware.ts         # Edge middleware for /admin security boundary
├── vercel.json           # Unified Vercel deployment configuration
├── tests/                # Vitest comprehensive integration test suite (31 tests)
└── supabase/             # Relational Database Schema & Storage
    ├── schema.sql        # PostgreSQL tables + RLS Security Policies
    ├── seed.sql          # Seed categories, demo products, reviews, settings
    └── storage_policies.sql # Storage bucket policies (product-images)
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** (v20+) & **npm**

### 2. Installation
```bash
# Install root dependencies (backend, dev tools, test runner)
npm install

# Install frontend dependencies
npm install --prefix frontend
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and set your credentials:
```bash
cp .env.example .env
```

### 4. Run Development Servers
```bash
# Concurrently runs the TypeScript backend on port 8000 and Vite frontend on port 5173
npm run dev
```
- **Storefront**: [http://localhost:5173](http://localhost:5173)
- **API Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 5. Run Automated Tests & Typecheck
```bash
# Run the 31-test integration suite
npm test

# Run TypeScript typechecks and frontend production build
npm run typecheck
```

---

## 🔐 Supabase Setup Guide

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Under **Project Settings -> API**, copy:
   - **Project URL** (`SUPABASE_URL`)
   - **anon public key** (`SUPABASE_ANON_KEY`)
   - **service_role secret key** (`SUPABASE_SERVICE_ROLE_KEY`)
   - **JWT Secret** (`SUPABASE_JWT_SECRET`)

### 2. Run Database Migrations & Storage Policies
1. Open the **SQL Editor** in your Supabase dashboard.
2. Execute [supabase/schema.sql](file:///D:/AaaS/supabase/schema.sql).
3. Execute [supabase/seed.sql](file:///D:/AaaS/supabase/seed.sql).
4. Execute [supabase/storage_policies.sql](file:///D:/AaaS/supabase/storage_policies.sql).
5. Ensure a public bucket named `product-images` exists in Storage.

### 3. Create the First Admin User
1. Register an account with your email via `/register` or `/login`.
2. In Supabase Dashboard -> **SQL Editor**, run:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

---

## 💳 Razorpay Payment & Webhook Integration

1. Sign up on [dashboard.razorpay.com](https://dashboard.razorpay.com).
2. Generate API Keys in **Settings -> API Keys** (Test Mode).
3. Set your webhook URL in **Settings -> Webhooks**:
   - **URL**: `https://<your-vercel-domain>/api/payment/webhook`
   - **Secret**: Set matching `RAZORPAY_WEBHOOK_SECRET`
   - **Events**: `order.paid`, `payment.captured`, `payment.failed`

### Secure Payment Flow:
1. Customer initiates checkout on `/checkout`.
2. Frontend requests order creation: `POST /api/orders` (stock check & authoritative pricing).
3. Backend generates Razorpay Order: `POST /api/payment/create-order`.
4. Razorpay checkout modal opens.
5. Upon payment completion, Razorpay returns `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`.
6. Frontend sends payment details to backend: `POST /api/payment/verify`.
7. **Backend cryptographically verifies the HMAC-SHA256 signature** with constant-time equality check using `RAZORPAY_KEY_SECRET`.
8. Once verified, backend transactionally commits payment, transitions state to `paid`, decrements stock, and triggers confirmation.
9. **Webhook Deduplication**: Webhooks carry cryptographic signatures, deduplicate event IDs, and reconcile delayed payments via an automated recovery sweep.

---

## 📦 Admin Management Features

Access the protected portal at `/admin`:
- **Overview & Analytics** (`/admin`): Real-time revenue, order counts, customer metrics, sales charts.
- **Inventory & Products** (`/admin/inventory`): Add, edit, delete products, upload images, update stock levels, configure low-stock alerts.
- **Orders** (`/admin/orders`): Track fulfillment, update order statuses (`pending`, `confirmed`, `processing`, `shipped`, `delivered`), assign tracking numbers and carriers.
- **Custom Orders** (`/admin/custom-orders`): Review bespoke customer submissions and reference photos.
- **Reviews Moderation** (`/admin/reviews`): Moderate customer reviews.
- **Store Settings** (`/admin/settings`): Configure fixed shipping charge, free shipping threshold, store contact details.

---

## 🛡️ Security Highlights
- **Vercel Serverless Architecture**: Zero external backend hosting needed; unified build deployed to Vercel edge/serverless infrastructure.
- **Edge Middleware Boundary**: Strict Edge-compatible middleware on `/admin/*` and `/api/admin/*` inspecting session cookies and JWT signatures.
- **Never Trust Client Prices**: Order subtotals, discounts, and shipping fees are computed authoritatively on the backend.
- **Transactional Stock Reservation**: Stock is validated prior to order creation and safely restored if orders are cancelled.
- **Constant-Time Crypto Verification**: Razorpay payment and webhook signatures use `crypto.timingSafeEqual` to prevent timing attacks.
- **Secret Isolation**: Sensitive secrets (`RAZORPAY_KEY_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_JWT_SECRET`) are never leaked to the client bundle.

---

## 🚢 Deployment to Vercel

See [DEPLOYMENT.md](file:///D:/AaaS/DEPLOYMENT.md) for detailed step-by-step instructions on deploying the unified application to Vercel.

---

© AaaS. Lovingly handcrafted.
