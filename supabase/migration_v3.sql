-- ============================================================
-- CRM App — Supabase SQL Migration v3
-- Run this in your Supabase SQL Editor AFTER migration_v2.sql
-- ============================================================

-- Add client_id to opportunities so the deal→client link survives
-- the deletion of the source lead (lead_id becomes NULL on delete).
alter table opportunities
  add column if not exists client_id uuid references clients(id) on delete set null;
