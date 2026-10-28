-- Run once in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text not null unique,
  description text,
  price       numeric(10,2) not null default 3500,   -- one-off price
  currency    text not null default 'NGN',
  cover_url   text,
  file_path   text not null,                          -- path inside the private books-secure bucket
  category    text,
  subcategory text,
  format      text,
  created_at  timestamptz not null default now()
);
create index if not exists products_category_idx on public.products (category);

-- orders: written server-side only (service role) after payment verification
create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  kind        text not null check (kind in ('product', 'bundle')),
  product_id  uuid references public.products(id),   -- null for bundle orders
  reference   text not null unique,                   -- payment provider reference
  amount      numeric(10,2) not null,
  currency    text not null,
  status      text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  created_at  timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.orders   enable row level security;
-- catalog is public-read; file_path is not secret (the bucket is private). orders have no public policy.
drop policy if exists "products are public" on public.products;
create policy "products are public" on public.products for select using (true);
