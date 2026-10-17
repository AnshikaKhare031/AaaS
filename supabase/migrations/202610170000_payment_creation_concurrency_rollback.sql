-- Rollback: Remove Payment Creation Concurrency Control
-- Application: Crafty Mind Studio

revoke execute on function public.release_payment_creation_lock(uuid, text) from service_role;
drop function if exists public.release_payment_creation_lock(uuid, text);

revoke execute on function public.claim_payment_creation_lock(uuid, text, integer) from service_role;
drop function if exists public.claim_payment_creation_lock(uuid, text, integer);

alter table public.orders
  drop column if exists payment_creation_locked_at,
  drop column if exists payment_creation_lock_token;
