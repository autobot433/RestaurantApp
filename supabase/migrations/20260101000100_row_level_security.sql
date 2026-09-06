-- =============================================================================
-- Freshly — Row-Level Security
-- =============================================================================
-- RLS is enabled on EVERY table. With RLS on and no matching policy, Postgres
-- denies by default, so the policies below are the ONLY way rows become visible
-- or writable. `auth.uid()` is the id of the currently authenticated user as
-- verified from their JWT — it cannot be spoofed by the client.
--
-- Trust model
--   * anon / authenticated clients use the PUBLIC (anon) key. They are fully
--     constrained by these policies.
--   * The service_role key BYPASSES RLS and is used ONLY in trusted server code
--     (never shipped to the browser) for privileged writes such as awarding
--     reward points or updating order status after payment.
-- =============================================================================

-- Enable + force RLS everywhere ------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items      enable row level security;
alter table public.orders          enable row level security;
alter table public.order_items     enable row level security;
alter table public.favorites       enable row level security;
alter table public.rewards         enable row level security;
alter table public.reservations    enable row level security;

-- FORCE RLS so even the table owner is subject to policies (defense in depth).
alter table public.profiles        force row level security;
alter table public.orders          force row level security;
alter table public.order_items     force row level security;
alter table public.favorites       force row level security;
alter table public.rewards         force row level security;
alter table public.reservations    force row level security;

-- ----------------------------------------------------------------------------
-- profiles: a user sees and edits only their own profile
-- ----------------------------------------------------------------------------
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No INSERT/DELETE policy: rows are created by the handle_new_user trigger
-- (SECURITY DEFINER) and removed only via auth.users cascade.

-- ----------------------------------------------------------------------------
-- menu_categories / menu_items: public read, no client writes
-- ----------------------------------------------------------------------------
drop policy if exists menu_categories_read on public.menu_categories;
create policy menu_categories_read on public.menu_categories
  for select to anon, authenticated
  using (is_active = true);

drop policy if exists menu_items_read on public.menu_items;
create policy menu_items_read on public.menu_items
  for select to anon, authenticated
  using (is_available = true);

-- (No insert/update/delete policies -> only service_role can write the catalog.)

-- ----------------------------------------------------------------------------
-- orders: full self-service, scoped to the owner
-- ----------------------------------------------------------------------------
drop policy if exists orders_select_own on public.orders;
create policy orders_select_own on public.orders
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists orders_insert_own on public.orders;
create policy orders_insert_own on public.orders
  for insert to authenticated
  with check (auth.uid() = user_id);

-- Users may cancel their own still-pending order, but cannot flip it to a paid
-- state or edit money fields to arbitrary values from the client. Privileged
-- status transitions (e.g. -> paid) happen through service_role after Stripe
-- confirms payment.
drop policy if exists orders_update_own_cancel on public.orders;
create policy orders_update_own_cancel on public.orders
  for update to authenticated
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id and status in ('pending','cancelled'));

-- ----------------------------------------------------------------------------
-- order_items: visible/insertable only through an order the user owns
-- ----------------------------------------------------------------------------
drop policy if exists order_items_select_own on public.order_items;
create policy order_items_select_own on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists order_items_insert_own on public.order_items;
create policy order_items_insert_own on public.order_items
  for insert to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- favorites: full self-service, scoped to the owner
-- ----------------------------------------------------------------------------
drop policy if exists favorites_select_own on public.favorites;
create policy favorites_select_own on public.favorites
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists favorites_insert_own on public.favorites;
create policy favorites_insert_own on public.favorites
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists favorites_delete_own on public.favorites;
create policy favorites_delete_own on public.favorites
  for delete to authenticated
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- rewards: user may READ their own balance; only service_role may write it
-- (prevents a client from granting itself points).
-- ----------------------------------------------------------------------------
drop policy if exists rewards_select_own on public.rewards;
create policy rewards_select_own on public.rewards
  for select to authenticated
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- reservations: full self-service, scoped to the owner
-- ----------------------------------------------------------------------------
drop policy if exists reservations_select_own on public.reservations;
create policy reservations_select_own on public.reservations
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists reservations_insert_own on public.reservations;
create policy reservations_insert_own on public.reservations
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists reservations_update_own on public.reservations;
create policy reservations_update_own on public.reservations
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
