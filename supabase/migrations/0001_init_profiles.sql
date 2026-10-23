-- =====================================================
-- DataVault — initial schema (profiles)
-- =====================================================
-- Run this ONCE in your Supabase project:
--   Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
--
-- Idempotent: safe to run repeatedly. The companion code in
-- `app/api/auth/register/route.ts` upserts into `public.profiles`,
-- so a missing row is never fatal, but the table and RLS rules
-- must exist for `getViewer()` / `canReadNews` / the profile
-- screen to work.
-- =====================================================

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id           uuid        primary key references auth.users(id) on delete cascade,
  full_name     text,
  country       text,
  phone_code    text,
  phone_number  text,
  company       text,
  job_title     text,
  role          text        not null default 'user'
                             check (role in ('user', 'admin')),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A user can read and update their own row. Account creation (signup) is
-- performed server-side with the service role, which bypasses RLS.
do $pol$ begin
  drop policy if exists "profiles: self read" on public.profiles;
  create policy "profiles: self read"
    on public.profiles for select
    using (auth.uid() = id);

  drop policy if exists "profiles: self update" on public.profiles;
  create policy "profiles: self update"
    on public.profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);
end $pol$;

-- Provision an empty profile on signup (the register route overrides
-- role/full_name via upsert, but users created through any other path — such
-- as an admin creating them in the dashboard — still get a row here).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Keep `updated_at` fresh on every update.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row
  execute function public.touch_updated_at();

-- =====================================================
-- NOTES
-- =====================================================
-- * The remaining app tables (purchases, saved_datasets,
--   coupon_redemptions) are not in this migration. If the news room or other
--   product features need them, export from the old project's SQL editor or
--   rebuild them per ./README. This migration deliberately only ships what the
--   authentication + role gating layer requires.
-- * To grant an existing account admin, run:
--       update public.profiles set role = 'admin' where id = auth.uid();
--   or, with service role:
--       update public.profiles set role = 'admin' where email = '…';
--   (The `ADMIN_EMAILS` env var also grants admin at registration time.)
