-- =====================================================
-- DataVault — base tables (saved_datasets, purchases, coupon_redemptions)
-- =====================================================
-- Idempotent. Run AFTER 0001_init_profiles.sql in Supabase SQL Editor.
--
-- These are the *only* app tables referenced in src/app + lib/, so if the new
-- project is empty, running these two scripts unblocks:
--   - /profile rendering (saved_datasets load instead of schema-cache error)
--   - hasDailyAccess gating (purchases / coupon_redemptions reads)
--
-- Stored functions (redeem_coupon etc.) are sourced from the old project —
-- see `Docs / README` or the export commands at the bottom of this file.
-- =====================================================

create table if not exists public.saved_datasets (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  dataset_code  text        not null,
  created_at    timestamptz not null default now(),
  unique (user_id, dataset_code)
);

create table if not exists public.purchases (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  dataset_code text        not null,
  status      text        not null default 'pending',
  amount      numeric,
  currency    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.coupon_redemptions (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  code        text        not null,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

-- Helpful indexes for the two reads the app does in hot paths.
create index if not exists saved_datasets_user_idx  on public.saved_datasets (user_id);
create index if not exists purchases_user_code_idx   on public.purchases (user_id, dataset_code, status);
create index if not exists coupon_red_user_exp_idx   on public.coupon_redemptions (user_id, expires_at);

-- =====================================================
-- RLS
-- =====================================================
alter table public.saved_datasets enable row level security;
alter table public.purchases enable row level security;
alter table public.coupon_redemptions enable row level security;

do $pol$ begin
  drop policy if exists "saved_datasets: self read" on public.saved_datasets;
  create policy "saved_datasets: self read"
    on public.saved_datasets for select
    using (auth.uid() = user_id);
  drop policy if exists "saved_datasets: self write" on public.saved_datasets;
  create policy "saved_datasets: self write"
    on public.saved_datasets for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

  drop policy if exists "purchases: self read" on public.purchases;
  create policy "purchases: self read"
    on public.purchases for select
    using (auth.uid() = user_id);

  drop policy if exists "coupon_red: self read" on public.coupon_redemptions;
  create policy "coupon_red: self read"
    on public.coupon_redemptions for select
    using (auth.uid() = user_id);
end $pol$;

-- =====================================================
-- NOTES
-- =====================================================
-- * RLS means the browser client (anon / publishable key) can list the
--   signed-in user's own rows; writes go through the user's own session.
-- * Admin-created rows (e.g. a paid purchase after a Stripe/Hourglass
--   checkout) bypass RLS via the service role; set `SUPABASE_SECRET_KEY`
--   in .env.local or the Supabase dashboard.
-- * The `redeem_coupon` RPC invoked by /api/coupons/coupon-redeem is NOT in
--   this migration because it's a Postgres function, not a table. Export it
--   from your old project:
--
--       -- Run in the OLD Supabase project (SQL editor):
--       SELECT pg_get_functiondef(p.oid)
--       FROM pg_proc p
--       JOIN pg_namespace n ON n.oid = p.pronamespace
--       WHERE n.nspname = 'public'
--         AND p.proname IN ('redeem_coupon', /* others */);
--
--   Paste the output into a new query in THIS project and run.
-- * Other tables referenced by your old middleware/checks? Query the old
--   project with:
--       SELECT tablename FROM pg_tables WHERE schemaname = 'public';
--   and replicate the ones this codebase touches.
-- =====================================================
