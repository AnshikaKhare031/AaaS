# AaaS Atelier

A Premium handcrafted crochet storefront and artisan lifestyle boutique. Built with Next.js 15, Tailwind CSS, Supabase SSR, and Razorpay.

## Features
- **Artisan Catalog**: Dynamic collection filtering across Handbags, Keychains, and Accessories.
- **Made-to-Order Craft**: Thoughtfully prepared artisan crochet items with transparent creation turnaround timelines.
- **Member-Only Checkout**: Authenticated checkout flow linking order history and saved addresses to customer profiles.
- **Razorpay Integration**: Enterprise-grade payment gateway integration featuring distributed mutex locking, CAS concurrency safeguards, failure logging, and automated payment recovery.
- **Secure Authentication**: Consolidated Supabase auth synchronization with server cookies, protecting admin and customer dashboards.
- **Automated Order Reconciliation**: Webhook-driven idempotency ensuring orders and notifications sync cleanly across asynchronous gateway states.

---

## Environment Variables

Configure the following environment variables in your `.env.local` or hosting provider dashboard (e.g., Vercel):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=            # Your public Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=       # Your public Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY=           # Supabase service role key (keep secret, server-only)

# Authentication Secrets
ADMIN_PASSWORD=                      # Master password for admin dashboard access
ADMIN_SESSION_SECRET=                # 64-character secret for signing admin session tokens
CUSTOMER_SESSION_SECRET=             # 64-character secret for customer sessions

# Razorpay Integration
NEXT_PUBLIC_RAZORPAY_KEY_ID=         # Public Razorpay key ID (e.g. rzp_live_...)
RAZORPAY_KEY_ID=                     # Server Razorpay key ID
RAZORPAY_KEY_SECRET=                 # Server Razorpay key secret
RAZORPAY_WEBHOOK_SECRET=             # Razorpay webhook signing secret configured in Razorpay Dashboard

# Email Notifications (Resend)
RESEND_API_KEY=                      # Resend service API key
RESEND_FROM_EMAIL=                   # Source email (e.g. AaaS Atelier <orders@aaasatelier.in>)
RESEND_REPLY_TO=                     # Reply-to email for customer inquiries (e.g. hello@aaasatelier.in)
ADMIN_NOTIFICATION_EMAIL=            # Administrator inbox for new order alerts

# Automation & Cron
CRON_SECRET=                         # Bearer token for securing /api/cron/expire-orders
NEXT_PUBLIC_SITE_URL=                # Public canonical website URL (e.g. https://www.aaasatelier.in)
```

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the storefront.

### 3. Build for Production
```bash
npm run build
npm run start
```

---

## Production Deployment Checklist
1. Configure all required environment variables in your hosting provider (Vercel, AWS Amplify, etc.).
2. Configure Razorpay webhooks pointing to your production host `/api/payment/webhook` endpoint with events:
   - `order.paid`
   - `payment.captured`
   - `payment.failed`
3. Configure scheduled cron invoking `/api/cron/expire-orders` with `Authorization: Bearer <CRON_SECRET>` every 15 minutes.
4. Verify Supabase indexes on `orders(user_id)`, `orders(order_number)`, `orders(payment_status)`, and `payment_logs(order_id)`.
