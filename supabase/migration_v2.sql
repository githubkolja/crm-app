-- ============================================================
-- CRM App — Supabase SQL Migration v2
-- Run this in your Supabase SQL Editor AFTER migration.sql
-- ============================================================

-- ── Prospection Actions (linked to leads) ───────────────────
create table if not exists prospection_actions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users not null,
  lead_id       uuid references leads(id) on delete cascade not null,
  type          text not null default 'call'
                  check (type in ('call', 'email', 'meeting', 'linkedin', 'other')),
  notes         text,
  actioned_at   date not null default current_date,
  created_at    timestamptz not null default now()
);

alter table prospection_actions enable row level security;

create policy "pact: user owns row (select)"  on prospection_actions for select  using (auth.uid() = user_id);
create policy "pact: user owns row (insert)"  on prospection_actions for insert  with check (auth.uid() = user_id);
create policy "pact: user owns row (update)"  on prospection_actions for update  using (auth.uid() = user_id);
create policy "pact: user owns row (delete)"  on prospection_actions for delete  using (auth.uid() = user_id);

-- ── Commercial Actions (linked to opportunities) ─────────────
create table if not exists commercial_actions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users not null,
  opportunity_id   uuid references opportunities(id) on delete cascade not null,
  type             text not null default 'demo'
                     check (type in ('demo', 'proposal', 'negotiation', 'follow_up', 'other')),
  notes            text,
  actioned_at      date not null default current_date,
  created_at       timestamptz not null default now()
);

alter table commercial_actions enable row level security;

create policy "cact: user owns row (select)"  on commercial_actions for select  using (auth.uid() = user_id);
create policy "cact: user owns row (insert)"  on commercial_actions for insert  with check (auth.uid() = user_id);
create policy "cact: user owns row (update)"  on commercial_actions for update  using (auth.uid() = user_id);
create policy "cact: user owns row (delete)"  on commercial_actions for delete  using (auth.uid() = user_id);

-- ── Add "deal" stage to opportunities ────────────────────────
-- Recreate the check constraint to include 'deal'
alter table opportunities
  drop constraint if exists opportunities_stage_check;

alter table opportunities
  add constraint opportunities_stage_check
  check (stage in ('prospect', 'proposal', 'negotiation', 'closed-won', 'closed-lost', 'deal'));

-- ── Add lead_source_id to clients (tracks origin lead) ───────
alter table clients
  add column if not exists lead_source_id uuid references leads(id) on delete set null;
