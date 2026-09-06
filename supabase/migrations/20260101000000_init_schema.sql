-- =============================================================================
-- Ahar — core schema
-- =============================================================================
-- Design notes
--   * Money is always stored as integer cents (never floats) to avoid rounding
--     bugs and to make server-side total re-computation exact.
--   * Every user-owned table carries a `user_id uuid references auth.users`.
--     Row-Level Security (enabled in the companion policies migration) uses that
--     column to guarantee a user can only ever touch their own rows.
--   * Public catalog tables (menu_categories, menu_items) are world-readable but
--     never writable by clients — only the service role / SQL migrations manage
--     them.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- profiles — one row per auth user, auto-created by trigger on signup
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  full_name    text check (char_length(full_name) <= 120),
  phone        text check (phone is null or phone ~ '^\+?[0-9]{7,15}$'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- menu_categories — public catalog
-- ----------------------------------------------------------------------------
create table if not exists public.menu_categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 80),
  slug         text not null unique check (slug ~ '^[a-z0-9-]+$'),
  description  text check (char_length(description) <= 400),
  sort_order   int not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- menu_items — public catalog
-- ----------------------------------------------------------------------------
create table if not exists public.menu_items (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.menu_categories (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 120),
  description  text check (char_length(description) <= 600),
  price_cents  int not null check (price_cents >= 0 and price_cents <= 100000),
  image_url    text check (image_url is null or image_url ~ '^https?://'),
  tags         text[] not null default '{}',
  is_available boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists menu_items_category_idx on public.menu_items (category_id);

-- ----------------------------------------------------------------------------
-- orders — user-owned. Totals are authoritative and computed server-side.
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  status         text not null default 'pending'
                   check (status in ('pending','paid','preparing','ready','completed','cancelled')),
  subtotal_cents int not null check (subtotal_cents >= 0),
  tax_cents      int not null default 0 check (tax_cents >= 0),
  tip_cents      int not null default 0 check (tip_cents >= 0),
  total_cents    int not null check (total_cents >= 0),
  fulfillment    text not null default 'pickup' check (fulfillment in ('pickup','delivery')),
  note           text check (char_length(note) <= 500),
  stripe_payment_intent text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- order_items — child rows of orders; prices are snapshotted at purchase time
-- ----------------------------------------------------------------------------
create table if not exists public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  menu_item_id     uuid references public.menu_items (id) on delete set null,
  name_snapshot    text not null,
  unit_price_cents int not null check (unit_price_cents >= 0),
  quantity         int not null check (quantity between 1 and 50),
  created_at       timestamptz not null default now()
);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- ----------------------------------------------------------------------------
-- favorites — user-owned
-- ----------------------------------------------------------------------------
create table if not exists public.favorites (
  user_id      uuid not null references auth.users (id) on delete cascade,
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (user_id, menu_item_id)
);

-- ----------------------------------------------------------------------------
-- rewards — user-owned loyalty balance; writable only by trusted server code
-- ----------------------------------------------------------------------------
create table if not exists public.rewards (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  points      int not null default 0 check (points >= 0),
  tier        text not null default 'bronze' check (tier in ('bronze','silver','gold','platinum')),
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- reservations — user-owned
-- ----------------------------------------------------------------------------
create table if not exists public.reservations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  party_size    int not null check (party_size between 1 and 20),
  reserved_for  timestamptz not null,
  status        text not null default 'requested'
                  check (status in ('requested','confirmed','seated','cancelled')),
  note          text check (char_length(note) <= 300),
  created_at    timestamptz not null default now()
);
create index if not exists reservations_user_idx on public.reservations (user_id, reserved_for desc);

-- ----------------------------------------------------------------------------
-- updated_at maintenance
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Auto-provision profile + rewards row when a new auth user is created
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;

  insert into public.rewards (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
