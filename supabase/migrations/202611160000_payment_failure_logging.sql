-- Migration: Payment Failure Logging, Nullable Signatures, and Audit Trail
-- Application: Crafty Mind Studio / AAAS Atelier

-- 1. Ensure razorpay_payment_id and razorpay_signature columns are explicitly nullable on orders table
alter table public.orders alter column razorpay_payment_id drop not null;
alter table public.orders alter column razorpay_signature drop not null;
alter table public.orders alter column razorpay_order_id drop not null;

-- 2. Create public.payment_logs table for comprehensive payment attempt & failure audit trail
create table if not exists public.payment_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  order_number text,
  razorpay_order_id text,
  razorpay_payment_id text, -- nullable (failures may lack payment ID)
  razorpay_signature text,  -- nullable (failures never have valid signature)
  event text not null default 'payment.failed',
  status text not null default 'failed',
  amount numeric,
  currency text default 'INR',
  error_code text,
  error_description text,
  error_source text,
  error_step text,
  error_reason text,
  error_metadata jsonb,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

-- Indices for rapid lookup by order or razorpay IDs
create index if not exists payment_logs_order_id_idx on public.payment_logs(order_id);
create index if not exists payment_logs_order_number_idx on public.payment_logs(order_number);
create index if not exists payment_logs_razorpay_order_id_idx on public.payment_logs(razorpay_order_id);
create index if not exists payment_logs_razorpay_payment_id_idx on public.payment_logs(razorpay_payment_id);
create index if not exists payment_logs_created_at_idx on public.payment_logs(created_at desc);

-- 3. Row Level Security configuration
alter table public.payment_logs enable row level security;

-- Drop existing policies if re-run
drop policy if exists "Service role has full access to payment_logs" on public.payment_logs;
drop policy if exists "Customers can view their own payment logs" on public.payment_logs;

-- Service role has full unrestricted access
create policy "Service role has full access to payment_logs"
  on public.payment_logs
  for all
  to service_role
  using (true)
  with check (true);

-- Authenticated customers can view logs for their own orders
create policy "Customers can view their own payment logs"
  on public.payment_logs
  for select
  to authenticated
  using (
    exists (
      select 1 from public.orders
      where public.orders.id = public.payment_logs.order_id
        and public.orders.user_id = auth.uid()
    )
  );
