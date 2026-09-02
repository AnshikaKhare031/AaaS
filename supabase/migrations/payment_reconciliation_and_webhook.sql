-- ==========================================================
-- Migration: Payment Reconciliation, Webhook Idempotency, and Expiration State
-- ==========================================================

-- 1. Ensure orders table has provider fields and confirmation timestamps
ALTER TABLE IF EXISTS public.orders
  ADD COLUMN IF NOT EXISTS provider_order_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS provider_payment_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS payment_confirmation_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_provider_order_id ON public.orders(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

-- 2. Webhook Events Table for Deduplication & Auditing
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  provider VARCHAR(50) DEFAULT 'razorpay',
  payload JSONB NOT NULL,
  order_id VARCHAR(255),
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'processed',
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_order_id ON public.webhook_events(order_id);

-- 3. Row Level Security for Webhook Events (Admin & Service Role only)
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook event audits"
  ON public.webhook_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
