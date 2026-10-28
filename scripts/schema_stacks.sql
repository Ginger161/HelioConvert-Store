-- Run once in Supabase Dashboard > SQL Editor (after schema.sql and schema_bundles.sql). Safe to rerun.
-- Stacks (e.g. the Business Stack) are defined in store/lib/stacks.ts, so they need no tables of their own:
-- an order just records which stack was bought.

alter table public.orders drop constraint if exists orders_kind_check;
alter table public.orders add constraint orders_kind_check check (kind in ('product', 'bundle', 'stack'));
alter table public.orders add column if not exists stack_slug text;
