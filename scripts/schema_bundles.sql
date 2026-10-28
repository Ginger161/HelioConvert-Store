-- Run once in Supabase Dashboard > SQL Editor (after schema.sql). Safe to rerun.
-- A bundle is one topic with all its formats (ebook, guides, checklist, mini-course, ...).

create table if not exists public.bundles (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  slug          text not null unique,
  description   text,
  price         numeric(10,2) not null default 19500,
  currency      text not null default 'NGN',
  cover_url     text,
  category      text,
  product_count int not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists public.bundle_items (
  bundle_id  uuid not null references public.bundles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  position   int  not null default 0,
  primary key (bundle_id, product_id)
);

alter table public.orders add column if not exists bundle_id uuid references public.bundles(id);

alter table public.bundles      enable row level security;
alter table public.bundle_items enable row level security;
drop policy if exists "bundles are public" on public.bundles;
create policy "bundles are public" on public.bundles for select using (true);
drop policy if exists "bundle items are public" on public.bundle_items;
create policy "bundle items are public" on public.bundle_items for select using (true);
