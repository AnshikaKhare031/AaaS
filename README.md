# AaaS — Premium Handmade Crochet Boutique E-Commerce

A full-stack, production-ready luxury e-commerce platform crafted for **AaaS**, an independent boutique brand specializing in handmade crochet flowers, bags, accessories, and bespoke personalized creations.

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

```
AaaS/
├── frontend/             # React 19 + TypeScript + Vite + Tailwind CSS + Framer Motion
│   ├── src/
│   │   ├── components/   # Logo, Navbar, Footer, ProductCard, CartDrawer, etc.
│   │   ├── pages/        # Storefront, Checkout, Custom Orders, Admin Portal (8 pages)
│   │   ├── context/      # AuthContext, CartContext, WishlistContext, ToastContext
│   │   ├── services/     # Axios REST client + Supabase JS Client
│   │   └── types/        # Comprehensive TypeScript Interfaces
│   └── public/images/    # High-resolution lifestyle crochet photography
│
├── backend/              # Python 3.11 + FastAPI + Pydantic v2 + Uvicorn
│   ├── app/
│   │   ├── routers/      # products, categories, cart, wishlist, orders, payments, admin, etc.
│   │   ├── services/     # Razorpay cryptographic verification, transactional inventory, orders
│   │   ├── database.py   # Dual-mode: Supabase PostgreSQL + in-memory seeded store
│   │   └── config.py     # Environment settings validation
│   └── test_api.py       # Full 13-step automated integration test suite
│
└── supabase/             # Relational Database Schema & Storage
    ├── schema.sql        # 14 PostgreSQL tables + RLS Security Policies
    ├── seed.sql          # Seed categories, demo products, reviews, settings
    └── storage_policies.sql # Storage buckets (product-images, custom-order-images)
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** (v18+) & **npm**
- **Python** (v3.10+) with `pip`

### 2. Backend Setup & Startup
```bash
# Navigate to backend
cd backend

# Install Python requirements
py -m pip install -r requirements.txt

# Run the automated integration test suite
py test_api.py

# Start FastAPI dev server on http://127.0.0.1:8000
py run.py
```
*Interactive Swagger API documentation is available at [http://127.0.0.1:8000/api/docs](http://127.0.0.1:8000/api/docs).*

### 3. Frontend Setup & Startup
```bash
# In a separate terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite dev server on http://localhost:5173
npm run dev
```

---

## 🔐 Supabase Setup Guide

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Under **Project Settings -> API**, copy:
   - **Project URL** (`SUPABASE_URL`)
   - **anon public key** (`SUPABASE_ANON_KEY`)
   - **service_role secret key** (`SUPABASE_SERVICE_ROLE_KEY`)

### 2. Run Database Migrations & Seeds
1. Open the **SQL Editor** in your Supabase dashboard.
2. Copy and execute [supabase/schema.sql](file:///D:/AaaS/supabase/schema.sql).
3. Copy and execute [supabase/seed.sql](file:///D:/AaaS/supabase/seed.sql).
4. Copy and execute [supabase/storage_policies.sql](file:///D:/AaaS/supabase/storage_policies.sql).

### 3. Configure Google OAuth Authentication
1. In the Supabase Dashboard, go to **Authentication -> Providers -> Google**.
2. Enable Google provider and paste your **Client ID** and **Client Secret** from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
3. Set the authorized redirect URI in Google Console to `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`.

### 4. Create the First Admin User
1. Register an account with your email via `/register` or `/login`.
2. In Supabase Dashboard -> **SQL Editor**, run:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

---

## 💳 Razorpay Payment Integration

1. Sign up on [dashboard.razorpay.com](https://dashboard.razorpay.com).
2. Generate API Keys in **Settings -> API Keys** (Test Mode).
3. Add keys to `backend/.env`:
```env
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```
4. Add `VITE_RAZORPAY_KEY_ID=rzp_test_...` to `frontend/.env`.

### Secure Payment Flow:
1. Customer initiates checkout on `/checkout`.
2. Frontend requests order creation on FastAPI: `POST /api/orders` (stock check & authoritative pricing).
3. Backend generates Razorpay Order: `POST /api/payments/create-order`.
4. Razorpay checkout modal opens.
5. Upon payment completion, Razorpay returns `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`.
6. Frontend sends payment details to backend: `POST /api/payments/verify`.
7. **FastAPI cryptographically verifies the HMAC-SHA256 signature** using `RAZORPAY_KEY_SECRET`.
8. Once verified, backend transactionally decrements inventory stock and confirms the order.

---

## 📦 Admin Management Features

Access the protected portal at `/admin`:
- **Overview & Analytics** (`/admin`): Real-time revenue, order counts, customer metrics, sales charts.
- **Inventory & Products** (`/admin/inventory`): Add, edit, delete products, upload images, update stock levels, configure low-stock alerts.
- **Categories** (`/admin/categories`): Create & manage taxonomy.
- **Orders** (`/admin/orders`): Track fulfillment, update order statuses (`pending`, `confirmed`, `processing`, `shipped`, `delivered`), assign tracking numbers.
- **Custom Orders** (`/admin/custom-orders`): Review bespoke customer submissions and reference photos.
- **Reviews Moderation** (`/admin/reviews`): Moderate customer reviews.
- **Store Settings** (`/admin/settings`): Configure fixed shipping charge, free shipping threshold, store contact details.

---

## 🛡️ Security Highlights
- **Server-Side Authorization**: Admin routes strictly protected by FastAPI dependencies verifying Supabase JWT roles.
- **Never Trust Client Prices**: Order subtotal and shipping fees are computed authoritatively on the backend from database product records.
- **Transactional Stock**: Stock is checked prior to order creation and deducted only upon verified payment.
- **Secret Isolation**: `RAZORPAY_KEY_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` are only ever accessed on the FastAPI server.

---

© AaaS. Lovingly handcrafted.
