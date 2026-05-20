-- Migration: 014_extend_quotes
-- Description: Add city, source, statusUpdatedAt, deletedAt to marketplace_quote_requests,
--              make product_id optional, and create quote_images table.
-- Strategy: ADDITIVE ONLY — no column renames, no drops, no data loss.
-- Rollback: DROP TABLE quote_images; ALTER TABLE marketplace_quote_requests DROP COLUMN city, source, status_updated_at, deleted_at; ALTER TABLE marketplace_quote_requests ALTER COLUMN product_id SET NOT NULL;

-- ── Extend marketplace_quote_requests ────────────────────────────────────────

ALTER TABLE marketplace_quote_requests
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS source VARCHAR(50),
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Make product_id optional (allow generic quotes without product association)
ALTER TABLE marketplace_quote_requests
  ALTER COLUMN product_id DROP NOT NULL;

-- ── Create quote_images table ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quote_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES marketplace_quote_requests(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_images_quote_id ON quote_images(quote_id);
