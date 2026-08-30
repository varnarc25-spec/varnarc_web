-- Construction data architecture expansion (prices, locations, BOQ, budget, phases, etc.)

CREATE TYPE "construction_project_status" AS ENUM ('DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "construction_location_type" AS ENUM ('COUNTRY', 'STATE', 'CITY', 'LOCALITY');
CREATE TYPE "construction_price_freshness" AS ENUM ('LIVE', 'VERIFIED', 'ESTIMATED', 'STALE');
CREATE TYPE "construction_boq_status" AS ENUM ('DRAFT', 'ACTIVE', 'FINALIZED', 'ARCHIVED');
CREATE TYPE "construction_phase_status" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');
CREATE TYPE "construction_document_kind" AS ENUM ('DRAWING', 'PERMIT', 'QUOTE', 'INVOICE', 'PHOTO', 'CONTRACT', 'OTHER');
CREATE TYPE "construction_alert_status" AS ENUM ('ACTIVE', 'TRIGGERED', 'PAUSED', 'CANCELLED');
CREATE TYPE "construction_alert_direction" AS ENUM ('BELOW', 'ABOVE');

ALTER TABLE "construction_materials"
  ALTER COLUMN "unit_cost" TYPE DECIMAL(14,2),
  ALTER COLUMN "approximate_price" TYPE DECIMAL(14,2);

ALTER TABLE "construction_projects"
  ADD COLUMN IF NOT EXISTS "status" "construction_project_status" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS "location_id" UUID,
  ADD COLUMN IF NOT EXISTS "currency" CHAR(3) NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS "quality" TEXT,
  ADD COLUMN IF NOT EXISTS "started_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "target_end_at" TIMESTAMP(3);

ALTER TABLE "construction_project_items"
  ADD COLUMN IF NOT EXISTS "unit" TEXT,
  ALTER COLUMN "unit_cost" TYPE DECIMAL(14,2),
  ALTER COLUMN "estimated_cost" TYPE DECIMAL(14,2);

CREATE TABLE IF NOT EXISTS "construction_locations" (
  "id" UUID NOT NULL,
  "parent_id" UUID,
  "type" "construction_location_type" NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "code" TEXT,
  "latitude" DECIMAL(10,7),
  "longitude" DECIMAL(10,7),
  "timezone" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_locations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "construction_locations_slug_key" ON "construction_locations"("slug");
CREATE INDEX IF NOT EXISTS "construction_locations_type_name_idx" ON "construction_locations"("type", "name");
CREATE INDEX IF NOT EXISTS "construction_locations_parent_id_idx" ON "construction_locations"("parent_id");

ALTER TABLE "construction_locations"
  ADD CONSTRAINT "construction_locations_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "construction_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "construction_projects"
  ADD CONSTRAINT "construction_projects_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "construction_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "construction_projects_user_id_status_idx" ON "construction_projects"("user_id", "status");
CREATE INDEX IF NOT EXISTS "construction_projects_location_id_idx" ON "construction_projects"("location_id");
CREATE INDEX IF NOT EXISTS "construction_project_items_material_id_idx" ON "construction_project_items"("material_id");

CREATE TABLE IF NOT EXISTS "construction_material_prices" (
  "id" UUID NOT NULL,
  "material_id" UUID NOT NULL,
  "location_id" UUID,
  "brand_id" UUID,
  "unit" TEXT NOT NULL,
  "currency" CHAR(3) NOT NULL DEFAULT 'INR',
  "price" DECIMAL(14,2) NOT NULL,
  "min_price" DECIMAL(14,2),
  "max_price" DECIMAL(14,2),
  "source" TEXT,
  "source_url" TEXT,
  "freshness" "construction_price_freshness" NOT NULL DEFAULT 'ESTIMATED',
  "effective_from" TIMESTAMP(3) NOT NULL,
  "effective_to" TIMESTAMP(3),
  "verified_at" TIMESTAMP(3),
  "notes" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "construction_material_prices_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "construction_material_prices_material_id_effective_from_idx"
  ON "construction_material_prices"("material_id", "effective_from");
CREATE INDEX IF NOT EXISTS "construction_material_prices_location_id_effective_from_idx"
  ON "construction_material_prices"("location_id", "effective_from");
CREATE INDEX IF NOT EXISTS "construction_material_prices_freshness_effective_from_idx"
  ON "construction_material_prices"("freshness", "effective_from");

ALTER TABLE "construction_material_prices"
  ADD CONSTRAINT "construction_material_prices_material_id_fkey"
  FOREIGN KEY ("material_id") REFERENCES "construction_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "construction_material_prices"
  ADD CONSTRAINT "construction_material_prices_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "construction_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "construction_material_prices"
  ADD CONSTRAINT "construction_material_prices_brand_id_fkey"
  FOREIGN KEY ("brand_id") REFERENCES "construction_brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "construction_cost_rates" (
  "id" UUID NOT NULL,
  "location_id" UUID,
  "work_type" TEXT NOT NULL,
  "name" TEXT,
  "unit" TEXT NOT NULL,
  "currency" CHAR(3) NOT NULL DEFAULT 'INR',
  "rate" DECIMAL(14,2) NOT NULL,
  "quality" TEXT,
  "methodology_key" TEXT,
  "methodology_version" INTEGER NOT NULL DEFAULT 1,
  "source" TEXT,
  "source_url" TEXT,
  "effective_from" TIMESTAMP(3) NOT NULL,
  "effective_to" TIMESTAMP(3),
  "verified_at" TIMESTAMP(3),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "construction_cost_rates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "construction_cost_rates_work_type_effective_from_idx"
  ON "construction_cost_rates"("work_type", "effective_from");
CREATE INDEX IF NOT EXISTS "construction_cost_rates_location_id_work_type_idx"
  ON "construction_cost_rates"("location_id", "work_type");
CREATE INDEX IF NOT EXISTS "construction_cost_rates_methodology_key_methodology_version_idx"
  ON "construction_cost_rates"("methodology_key", "methodology_version");

ALTER TABLE "construction_cost_rates"
  ADD CONSTRAINT "construction_cost_rates_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "construction_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "construction_calculations" (
  "id" UUID NOT NULL,
  "project_id" UUID,
  "user_id" UUID NOT NULL,
  "calculator_slug" TEXT NOT NULL,
  "calculator_id" UUID,
  "name" TEXT,
  "methodology_key" TEXT NOT NULL,
  "methodology_version" INTEGER NOT NULL DEFAULT 1,
  "inputs" JSONB NOT NULL,
  "assumptions" JSONB,
  "outputs" JSONB,
  "unit_summary" JSONB,
  "currency" CHAR(3) NOT NULL DEFAULT 'INR',
  "status" "calculation_status" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_calculations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "construction_calculations_user_id_created_at_idx"
  ON "construction_calculations"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "construction_calculations_project_id_created_at_idx"
  ON "construction_calculations"("project_id", "created_at");
CREATE INDEX IF NOT EXISTS "construction_calculations_calculator_slug_methodology_version_idx"
  ON "construction_calculations"("calculator_slug", "methodology_version");

ALTER TABLE "construction_calculations"
  ADD CONSTRAINT "construction_calculations_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "construction_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "construction_calculations"
  ADD CONSTRAINT "construction_calculations_calculator_id_fkey"
  FOREIGN KEY ("calculator_id") REFERENCES "calculators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "construction_project_phases" (
  "id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "status" "construction_phase_status" NOT NULL DEFAULT 'PLANNED',
  "planned_start" TIMESTAMP(3),
  "planned_end" TIMESTAMP(3),
  "actual_start" TIMESTAMP(3),
  "actual_end" TIMESTAMP(3),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_project_phases_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "construction_project_phases_project_id_sort_order_idx"
  ON "construction_project_phases"("project_id", "sort_order");
CREATE INDEX IF NOT EXISTS "construction_project_phases_project_id_status_idx"
  ON "construction_project_phases"("project_id", "status");

ALTER TABLE "construction_project_phases"
  ADD CONSTRAINT "construction_project_phases_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "construction_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "construction_boqs" (
  "id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" "construction_boq_status" NOT NULL DEFAULT 'DRAFT',
  "currency" CHAR(3) NOT NULL DEFAULT 'INR',
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "construction_boqs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "construction_boqs_project_id_name_version_key"
  ON "construction_boqs"("project_id", "name", "version");
CREATE INDEX IF NOT EXISTS "construction_boqs_project_id_status_idx"
  ON "construction_boqs"("project_id", "status");

ALTER TABLE "construction_boqs"
  ADD CONSTRAINT "construction_boqs_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "construction_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "construction_boq_items" (
  "id" UUID NOT NULL,
  "boq_id" UUID NOT NULL,
  "material_id" UUID,
  "phase_id" UUID,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "unit" TEXT NOT NULL,
  "quantity" DECIMAL(14,4) NOT NULL,
  "unit_rate" DECIMAL(14,2) NOT NULL,
  "wastage_percent" DECIMAL(5,2),
  "amount" DECIMAL(14,2) NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_boq_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "construction_boq_items_boq_id_sort_order_idx"
  ON "construction_boq_items"("boq_id", "sort_order");
CREATE INDEX IF NOT EXISTS "construction_boq_items_material_id_idx" ON "construction_boq_items"("material_id");
CREATE INDEX IF NOT EXISTS "construction_boq_items_phase_id_idx" ON "construction_boq_items"("phase_id");

ALTER TABLE "construction_boq_items"
  ADD CONSTRAINT "construction_boq_items_boq_id_fkey"
  FOREIGN KEY ("boq_id") REFERENCES "construction_boqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "construction_boq_items"
  ADD CONSTRAINT "construction_boq_items_material_id_fkey"
  FOREIGN KEY ("material_id") REFERENCES "construction_materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "construction_boq_items"
  ADD CONSTRAINT "construction_boq_items_phase_id_fkey"
  FOREIGN KEY ("phase_id") REFERENCES "construction_project_phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "construction_budget_items" (
  "id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "phase_id" UUID,
  "category" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "planned_amount" DECIMAL(14,2) NOT NULL,
  "currency" CHAR(3) NOT NULL DEFAULT 'INR',
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_budget_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "construction_budget_items_project_id_idx" ON "construction_budget_items"("project_id");
CREATE INDEX IF NOT EXISTS "construction_budget_items_phase_id_idx" ON "construction_budget_items"("phase_id");

ALTER TABLE "construction_budget_items"
  ADD CONSTRAINT "construction_budget_items_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "construction_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "construction_budget_items"
  ADD CONSTRAINT "construction_budget_items_phase_id_fkey"
  FOREIGN KEY ("phase_id") REFERENCES "construction_project_phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "construction_expenses" (
  "id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "budget_item_id" UUID,
  "phase_id" UUID,
  "vendor_business_id" UUID,
  "name" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "currency" CHAR(3) NOT NULL DEFAULT 'INR',
  "spent_on" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "receipt_media_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_expenses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "construction_expenses_project_id_spent_on_idx"
  ON "construction_expenses"("project_id", "spent_on");
CREATE INDEX IF NOT EXISTS "construction_expenses_budget_item_id_idx" ON "construction_expenses"("budget_item_id");
CREATE INDEX IF NOT EXISTS "construction_expenses_phase_id_idx" ON "construction_expenses"("phase_id");
CREATE INDEX IF NOT EXISTS "construction_expenses_vendor_business_id_idx" ON "construction_expenses"("vendor_business_id");

ALTER TABLE "construction_expenses"
  ADD CONSTRAINT "construction_expenses_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "construction_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "construction_expenses"
  ADD CONSTRAINT "construction_expenses_budget_item_id_fkey"
  FOREIGN KEY ("budget_item_id") REFERENCES "construction_budget_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "construction_expenses"
  ADD CONSTRAINT "construction_expenses_phase_id_fkey"
  FOREIGN KEY ("phase_id") REFERENCES "construction_project_phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "construction_price_alerts" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "material_id" UUID NOT NULL,
  "location_id" UUID,
  "target_price" DECIMAL(14,2) NOT NULL,
  "currency" CHAR(3) NOT NULL DEFAULT 'INR',
  "direction" "construction_alert_direction" NOT NULL DEFAULT 'BELOW',
  "status" "construction_alert_status" NOT NULL DEFAULT 'ACTIVE',
  "last_triggered_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_price_alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "construction_price_alerts_user_id_status_idx"
  ON "construction_price_alerts"("user_id", "status");
CREATE INDEX IF NOT EXISTS "construction_price_alerts_material_id_status_idx"
  ON "construction_price_alerts"("material_id", "status");
CREATE INDEX IF NOT EXISTS "construction_price_alerts_location_id_idx"
  ON "construction_price_alerts"("location_id");

ALTER TABLE "construction_price_alerts"
  ADD CONSTRAINT "construction_price_alerts_material_id_fkey"
  FOREIGN KEY ("material_id") REFERENCES "construction_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "construction_price_alerts"
  ADD CONSTRAINT "construction_price_alerts_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "construction_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "construction_saved_comparisons" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL DEFAULT 'materials',
  "entity_ids" JSONB NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_saved_comparisons_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "construction_saved_comparisons_user_id_created_at_idx"
  ON "construction_saved_comparisons"("user_id", "created_at");

CREATE TABLE IF NOT EXISTS "construction_documents" (
  "id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "kind" "construction_document_kind" NOT NULL DEFAULT 'OTHER',
  "title" TEXT NOT NULL,
  "media_id" UUID,
  "url" TEXT,
  "notes" TEXT,
  "uploaded_by" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "construction_documents_project_id_kind_idx"
  ON "construction_documents"("project_id", "kind");
CREATE INDEX IF NOT EXISTS "construction_documents_media_id_idx"
  ON "construction_documents"("media_id");

ALTER TABLE "construction_documents"
  ADD CONSTRAINT "construction_documents_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "construction_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
