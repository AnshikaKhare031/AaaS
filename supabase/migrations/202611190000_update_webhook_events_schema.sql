-- Migration: Align webhook_events table with exact production schema
-- Application: AAAS Atelier / Crafty Mind Studio

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id varchar not null,
  event_type varchar not null,
  provider varchar not null default 'razorpay',
  payload jsonb,
  order_id uuid references public.orders(id) on delete set null,
  status varchar not null default 'processed',
  error_message text,
  processed_at timestamptz not null default now()
);

-- Ensure all required columns exist if table was previously created with legacy schema
alter table public.webhook_events
  add column if not exists event_id varchar,
  add column if not exists provider varchar default 'razorpay',
  add column if not exists payload jsonb,
  add column if not exists order_id uuid references public.orders(id) on delete set null,
  add column if not exists status varchar default 'processed',
  add column if not exists error_message text,
  add column if not exists processed_at timestamptz default now();

-- Drop legacy created_at constraint if it was not null without default
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
      and table_name = 'webhook_events' 
      and column_name = 'created_at'
  ) then
    alter table public.webhook_events alter column created_at drop not null;
  end if;
end $$;

-- Indices for rapid event lookup and deduplication
create index if not exists webhook_events_event_id_idx on public.webhook_events(event_id);
create index if not exists webhook_events_order_id_idx on public.webhook_events(order_id);
create index if not exists webhook_events_processed_at_idx on public.webhook_events(processed_at desc);

-- Row Level Security
alter table public.webhook_events enable row level security;

-- Drop existing policies if re-run
drop policy if exists "Service role has full access to webhook_events" on public.webhook_events;

-- Service role has full unrestricted access
create policy "Service role has full access to webhook_events"
  on public.webhook_events
  for all
  to service_role
  using (true)
  with check (true);
