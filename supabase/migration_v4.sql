-- ============================================================
-- CRM App — Supabase SQL Migration v4
-- Run this in your Supabase SQL Editor AFTER migration_v3.sql
-- ============================================================

-- ── Add 'transformed' status to leads ────────────────────────
alter table leads
  drop constraint if exists leads_status_check;

alter table leads
  add constraint leads_status_check
  check (status in ('new', 'contacted', 'qualified', 'lost', 'transformed'));

-- ── Add 'transformed' stage to opportunities ─────────────────
alter table opportunities
  drop constraint if exists opportunities_stage_check;

alter table opportunities
  add constraint opportunities_stage_check
  check (stage in ('prospect', 'proposal', 'negotiation', 'closed-won', 'closed-lost', 'deal', 'transformed'));

-- ── Add transformed_at timestamp to leads and opportunities ──
alter table leads
  add column if not exists transformed_at timestamptz;

alter table opportunities
  add column if not exists transformed_at timestamptz;
