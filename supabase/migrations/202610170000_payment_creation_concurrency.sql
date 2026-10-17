-- Migration: Payment Creation Concurrency Control and Mutual Exclusion
-- Application: Crafty Mind Studio
-- Purpose: Prevent competing gateway order creation across distributed serverless instances

alter table public.orders
  add column if not exists payment_creation_locked_at timestamptz,
  add column if not exists payment_creation_lock_token text;

-- Atomic lock claim function
create or replace function public.claim_payment_creation_lock(
  p_order_id uuid,
  p_lock_token text,
  p_lease_seconds integer default 30
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_acquired boolean;
  v_lease integer;
begin
  -- Input validation
  if p_order_id is null or p_lock_token is null or length(trim(p_lock_token)) < 8 then
    return false;
  end if;

  -- Bounded lease duration: between 5 seconds and 120 seconds (default 30 seconds)
  v_lease := greatest(5, least(coalesce(p_lease_seconds, 30), 120));

  update public.orders
  set
    payment_creation_locked_at = now(),
    payment_creation_lock_token = p_lock_token,
    updated_at = now()
  where id = p_order_id
    and payment_status = 'pending'
    and (
      payment_creation_locked_at is null
      or payment_creation_locked_at < (now() - make_interval(secs => v_lease))
      or payment_creation_lock_token = p_lock_token
    );

  v_acquired := found;
  return v_acquired;
end;
$$;

-- Atomic token-scoped lock release function
create or replace function public.release_payment_creation_lock(
  p_order_id uuid,
  p_lock_token text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_released boolean;
begin
  if p_order_id is null or p_lock_token is null or length(trim(p_lock_token)) < 8 then
    return false;
  end if;

  update public.orders
  set
    payment_creation_locked_at = null,
    payment_creation_lock_token = null,
    updated_at = now()
  where id = p_order_id
    and payment_creation_lock_token = p_lock_token;

  v_released := found;
  return v_released;
end;
$$;

-- Restrict permissions: Revoke public API access, grant only to privileged service_role
revoke all on function public.claim_payment_creation_lock(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.claim_payment_creation_lock(uuid, text, integer) to service_role;

revoke all on function public.release_payment_creation_lock(uuid, text) from public, anon, authenticated;
grant execute on function public.release_payment_creation_lock(uuid, text) to service_role;
