-- Moderated community material price reports.
-- Never auto-promoted into construction_material_prices (primary market hub).

CREATE TYPE "construction_community_price_status" AS ENUM (
  'PENDING',
  'VERIFIED',
  'REJECTED',
  'FLAGGED'
);

CREATE TABLE IF NOT EXISTS "construction_community_price_reports" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "material_id" UUID NOT NULL,
  "location_id" UUID NOT NULL,
  "brand_id" UUID,
  "brand_name" TEXT,
  "unit" TEXT NOT NULL,
  "currency" CHAR(3) NOT NULL DEFAULT 'INR',
  "price" DECIMAL(14,2) NOT NULL,
  "purchase_date" DATE NOT NULL,
  "supplier_name" TEXT,
  "notes" TEXT,
  "source_label" TEXT NOT NULL DEFAULT 'community_report',
  "status" "construction_community_price_status" NOT NULL DEFAULT 'PENDING',
  "trust_score" INTEGER NOT NULL DEFAULT 40,
  "is_outlier" BOOLEAN NOT NULL DEFAULT false,
  "outlier_ratio" DECIMAL(8,4),
  "reference_mid_price" DECIMAL(14,2),
  "is_duplicate" BOOLEAN NOT NULL DEFAULT false,
  "duplicate_of_id" UUID,
  "invoice_storage_key" TEXT,
  "invoice_mime_type" TEXT,
  "invoice_original_name" TEXT,
  "invoice_byte_size" INTEGER,
  "moderation_notes" TEXT,
  "moderated_by" UUID,
  "moderated_at" TIMESTAMP(3),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_community_price_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "construction_community_price_reports_user_id_created_at_idx"
  ON "construction_community_price_reports"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "construction_community_price_reports_material_location_status_idx"
  ON "construction_community_price_reports"("material_id", "location_id", "status");
CREATE INDEX IF NOT EXISTS "construction_community_price_reports_status_purchase_date_idx"
  ON "construction_community_price_reports"("status", "purchase_date");
CREATE INDEX IF NOT EXISTS "construction_community_price_reports_status_trust_score_idx"
  ON "construction_community_price_reports"("status", "trust_score");
CREATE INDEX IF NOT EXISTS "construction_community_price_reports_deleted_at_idx"
  ON "construction_community_price_reports"("deleted_at");

ALTER TABLE "construction_community_price_reports"
  DROP CONSTRAINT IF EXISTS "construction_community_price_reports_material_id_fkey";
ALTER TABLE "construction_community_price_reports"
  ADD CONSTRAINT "construction_community_price_reports_material_id_fkey"
  FOREIGN KEY ("material_id") REFERENCES "construction_materials"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "construction_community_price_reports"
  DROP CONSTRAINT IF EXISTS "construction_community_price_reports_location_id_fkey";
ALTER TABLE "construction_community_price_reports"
  ADD CONSTRAINT "construction_community_price_reports_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "construction_locations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "construction_community_price_reports"
  DROP CONSTRAINT IF EXISTS "construction_community_price_reports_brand_id_fkey";
ALTER TABLE "construction_community_price_reports"
  ADD CONSTRAINT "construction_community_price_reports_brand_id_fkey"
  FOREIGN KEY ("brand_id") REFERENCES "construction_brands"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "construction_community_price_reports"
  DROP CONSTRAINT IF EXISTS "construction_community_price_reports_duplicate_of_id_fkey";
ALTER TABLE "construction_community_price_reports"
  ADD CONSTRAINT "construction_community_price_reports_duplicate_of_id_fkey"
  FOREIGN KEY ("duplicate_of_id") REFERENCES "construction_community_price_reports"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
