-- Add soft delete columns to marketplace products and categories (Wave 5 / Task 6.1)
ALTER TABLE marketplace_products
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE marketplace_categories
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS marketplace_products_active_not_deleted_idx
  ON marketplace_products (artist_id, active)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS marketplace_categories_artist_not_deleted_idx
  ON marketplace_categories (artist_id, sort_order)
  WHERE deleted_at IS NULL;
