-- ============================================================
-- CRM App — Supabase SQL Migration
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── Leads ───────────────────────────────────────────────────
create table if not exists leads (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users not null,
  name          text not null,
  company       text,
  email         text,
  phone         text,
  status        text not null default 'new'
                  check (status in ('new', 'contacted', 'qualified', 'lost')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table leads enable row level security;

create policy "leads: user owns row (select)"   on leads for select  using (auth.uid() = user_id);
create policy "leads: user owns row (insert)"   on leads for insert  with check (auth.uid() = user_id);
create policy "leads: user owns row (update)"   on leads for update  using (auth.uid() = user_id);
create policy "leads: user owns row (delete)"   on leads for delete  using (auth.uid() = user_id);

-- ── Opportunities ────────────────────────────────────────────
create table if not exists opportunities (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references auth.users not null,
  title                text not null,
  value                numeric,
  stage                text not null default 'prospect'
                         check (stage in ('prospect', 'proposal', 'negotiation', 'closed-won', 'closed-lost')),
  expected_close_date  date,
  lead_id              uuid references leads(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table opportunities enable row level security;

create policy "opportunities: user owns row (select)"  on opportunities for select  using (auth.uid() = user_id);
create policy "opportunities: user owns row (insert)"  on opportunities for insert  with check (auth.uid() = user_id);
create policy "opportunities: user owns row (update)"  on opportunities for update  using (auth.uid() = user_id);
create policy "opportunities: user owns row (delete)"  on opportunities for delete  using (auth.uid() = user_id);

-- ── Clients ──────────────────────────────────────────────────
create table if not exists clients (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users not null,
  name             text not null,
  company          text not null,
  email            text,
  phone            text,
  industry         text,
  contract_value   numeric,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table clients enable row level security;

create policy "clients: user owns row (select)"  on clients for select  using (auth.uid() = user_id);
create policy "clients: user owns row (insert)"  on clients for insert  with check (auth.uid() = user_id);
create policy "clients: user owns row (update)"  on clients for update  using (auth.uid() = user_id);
create policy "clients: user owns row (delete)"  on clients for delete  using (auth.uid() = user_id);
