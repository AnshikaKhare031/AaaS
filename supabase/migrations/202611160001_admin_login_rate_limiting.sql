-- Migration: Distributed Admin Login Rate Limiting
-- Application: AaaS Atelier
-- Purpose: Persist failed admin login attempt counters across distributed serverless instances

create table if not exists public.admin_login_attempts (
  id uuid primary key default gen_random_uuid(),
  identifier text not null unique,
  attempt_count integer not null default 1,
  window_start timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_login_attempts_identifier_idx on public.admin_login_attempts(identifier);
create index if not exists admin_login_attempts_window_start_idx on public.admin_login_attempts(window_start);

alter table public.admin_login_attempts enable row level security;

drop policy if exists "Service role has full access to admin_login_attempts" on public.admin_login_attempts;

create policy "Service role has full access to admin_login_attempts"
  on public.admin_login_attempts
  for all
  to service_role
  using (true)
  with check (true);
