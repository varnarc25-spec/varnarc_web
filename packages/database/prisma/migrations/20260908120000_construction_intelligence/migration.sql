-- Construction Cost Intelligence: reuse locations/materials/prices; add catalog, labour, BOQ work items, provenance.

ALTER TYPE "construction_location_type" ADD VALUE IF NOT EXISTS 'DISTRICT';

CREATE TYPE "construction_rate_source_type" AS ENUM (
  'OFFICIAL_SOR',
  'OFFICIAL_MARKET_SURVEY',
  'OFFICIAL_STATISTICS',
  'MANUFACTURER',
  'AUTHORIZED_DEALER',
  'MARKET_SURVEY',
  'VARNARC_VERIFIED',
  'DERIVED',
  'ESTIMATED_FALLBACK',
  'USER_OVERRIDE'
);

CREATE TYPE "construction_rate_confidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

CREATE TYPE "construction_rate_record_status" AS ENUM (
  'DRAFT',
  'ACTIVE',
  'AGING',
  'STALE',
  'REVIEW_REQUIRED',
  'ARCHIVED'
);

CREATE TYPE "construction_resource_type" AS ENUM (
  'MATERIAL',
  'LABOUR',
  'EQUIPMENT',
  'SUBCONTRACT',
  'PROFESSIONAL',
  'INTERIOR'
);

ALTER TABLE "construction_material_prices"
  ADD COLUMN IF NOT EXISTS "source_type" "construction_rate_source_type" NOT NULL DEFAULT 'ESTIMATED_FALLBACK',
  ADD COLUMN IF NOT EXISTS "confidence" "construction_rate_confidence" NOT NULL DEFAULT 'LOW',
  ADD COLUMN IF NOT EXISTS "is_derived" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "derivation_method" TEXT,
  ADD COLUMN IF NOT EXISTS "location_factor" DECIMAL(8,4),
  ADD COLUMN IF NOT EXISTS "rate_status" "construction_rate_record_status" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "source_record_id" UUID,
  ADD COLUMN IF NOT EXISTS "specification_id" UUID,
  ADD COLUMN IF NOT EXISTS "retrieved_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "tax_included" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "transport_included" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "construction_rate_sources" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "organization" TEXT,
  "source_type" "construction_rate_source_type" NOT NULL,
  "document_name" TEXT,
  "reference" TEXT,
  "source_url" TEXT,
  "publication_date" DATE,
  "effective_from" DATE,
  "effective_to" DATE,
  "geographical_coverage" TEXT,
  "location_id" UUID,
  "reliability" "construction_rate_confidence" NOT NULL DEFAULT 'MEDIUM',
  "notes" TEXT,
  "media_id" UUID,
  "last_checked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  "created_by" UUID,
  "updated_by" UUID,
  CONSTRAINT "construction_rate_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "construction_material_specifications" (
  "id" UUID NOT NULL,
  "material_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "grade" TEXT,
  "size" TEXT,
  "unit" TEXT NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_material_specifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "construction_labour_trades" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "default_unit" TEXT NOT NULL DEFAULT 'perDay',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_labour_trades_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "construction_labour_rates" (
  "id" UUID NOT NULL,
  "trade_id" UUID NOT NULL,
  "location_id" UUID,
  "unit" TEXT NOT NULL,
  "min_rate" DECIMAL(14,2) NOT NULL,
  "average_rate" DECIMAL(14,2) NOT NULL,
  "max_rate" DECIMAL(14,2) NOT NULL,
  "currency" CHAR(3) NOT NULL DEFAULT 'INR',
  "source_type" "construction_rate_source_type" NOT NULL DEFAULT 'ESTIMATED_FALLBACK',
  "confidence" "construction_rate_confidence" NOT NULL DEFAULT 'LOW',
  "is_derived" BOOLEAN NOT NULL DEFAULT true,
  "derivation_method" TEXT,
  "rate_status" "construction_rate_record_status" NOT NULL DEFAULT 'ACTIVE',
  "source_record_id" UUID,
  "effective_from" TIMESTAMP(3) NOT NULL,
  "effective_to" TIMESTAMP(3),
  "last_verified_at" TIMESTAMP(3),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_labour_rates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "construction_equipment" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "default_unit" TEXT NOT NULL DEFAULT 'day',
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_equipment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "construction_equipment_rates" (
  "id" UUID NOT NULL,
  "equipment_id" UUID NOT NULL,
  "location_id" UUID,
  "unit" TEXT NOT NULL,
  "min_rate" DECIMAL(14,2) NOT NULL,
  "average_rate" DECIMAL(14,2) NOT NULL,
  "max_rate" DECIMAL(14,2) NOT NULL,
  "currency" CHAR(3) NOT NULL DEFAULT 'INR',
  "source_type" "construction_rate_source_type" NOT NULL DEFAULT 'ESTIMATED_FALLBACK',
  "confidence" "construction_rate_confidence" NOT NULL DEFAULT 'LOW',
  "is_derived" BOOLEAN NOT NULL DEFAULT true,
  "rate_status" "construction_rate_record_status" NOT NULL DEFAULT 'ACTIVE',
  "effective_from" TIMESTAMP(3) NOT NULL,
  "last_verified_at" TIMESTAMP(3),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_equipment_rates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "construction_professional_services" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "billing_unit" TEXT NOT NULL DEFAULT 'percentageOfProject',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_professional_services_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "construction_professional_rates" (
  "id" UUID NOT NULL,
  "service_id" UUID NOT NULL,
  "location_id" UUID,
  "unit" TEXT NOT NULL,
  "min_rate" DECIMAL(14,2) NOT NULL,
  "average_rate" DECIMAL(14,2) NOT NULL,
  "max_rate" DECIMAL(14,2) NOT NULL,
  "currency" CHAR(3) NOT NULL DEFAULT 'INR',
  "source_type" "construction_rate_source_type" NOT NULL DEFAULT 'ESTIMATED_FALLBACK',
  "confidence" "construction_rate_confidence" NOT NULL DEFAULT 'LOW',
  "is_derived" BOOLEAN NOT NULL DEFAULT true,
  "rate_status" "construction_rate_record_status" NOT NULL DEFAULT 'ACTIVE',
  "effective_from" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_professional_rates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "construction_phase_templates" (
  "id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_phase_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "construction_work_items" (
  "id" UUID NOT NULL,
  "phase_id" UUID,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "unit" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_work_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "construction_work_item_resources" (
  "id" UUID NOT NULL,
  "work_item_id" UUID NOT NULL,
  "resource_type" "construction_resource_type" NOT NULL,
  "resource_key" TEXT NOT NULL,
  "quantity_coefficient" DECIMAL(16,6) NOT NULL,
  "unit" TEXT NOT NULL,
  "wastage_percent" DECIMAL(6,2) NOT NULL DEFAULT 0,
  "source_type" "construction_rate_source_type" NOT NULL DEFAULT 'ESTIMATED_FALLBACK',
  "confidence" "construction_rate_confidence" NOT NULL DEFAULT 'LOW',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_work_item_resources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "construction_productivity_norms" (
  "id" UUID NOT NULL,
  "trade_id" UUID NOT NULL,
  "work_item_id" UUID,
  "output_per_day" DECIMAL(14,4) NOT NULL,
  "unit" TEXT NOT NULL,
  "crew_composition" TEXT,
  "source_type" "construction_rate_source_type" NOT NULL DEFAULT 'ESTIMATED_FALLBACK',
  "confidence" "construction_rate_confidence" NOT NULL DEFAULT 'LOW',
  "effective_from" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_productivity_norms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "construction_wastage_rules" (
  "id" UUID NOT NULL,
  "category_key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "wastage_percent" DECIMAL(6,2) NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_wastage_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "construction_quality_tiers" (
  "id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_quality_tiers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "construction_quality_specifications" (
  "id" UUID NOT NULL,
  "tier_id" UUID NOT NULL,
  "category_key" TEXT NOT NULL,
  "spec_key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "construction_quality_specifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "construction_interior_components" (
  "id" UUID NOT NULL,
  "room_type" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_interior_components_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "construction_interior_rates" (
  "id" UUID NOT NULL,
  "component_id" UUID NOT NULL,
  "location_id" UUID,
  "quality_code" TEXT,
  "unit" TEXT NOT NULL,
  "min_rate" DECIMAL(14,2) NOT NULL,
  "average_rate" DECIMAL(14,2) NOT NULL,
  "max_rate" DECIMAL(14,2) NOT NULL,
  "currency" CHAR(3) NOT NULL DEFAULT 'INR',
  "source_type" "construction_rate_source_type" NOT NULL DEFAULT 'ESTIMATED_FALLBACK',
  "confidence" "construction_rate_confidence" NOT NULL DEFAULT 'LOW',
  "is_derived" BOOLEAN NOT NULL DEFAULT true,
  "rate_status" "construction_rate_record_status" NOT NULL DEFAULT 'ACTIVE',
  "effective_from" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_interior_rates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "construction_location_cost_factors" (
  "id" UUID NOT NULL,
  "location_id" UUID NOT NULL,
  "material_transport_factor" DECIMAL(8,4) NOT NULL DEFAULT 1,
  "labour_factor" DECIMAL(8,4) NOT NULL DEFAULT 1,
  "equipment_factor" DECIMAL(8,4) NOT NULL DEFAULT 1,
  "interior_factor" DECIMAL(8,4) NOT NULL DEFAULT 1,
  "logistics_factor" DECIMAL(8,4) NOT NULL DEFAULT 1,
  "source_type" "construction_rate_source_type" NOT NULL DEFAULT 'ESTIMATED_FALLBACK',
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "construction_location_cost_factors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "construction_benchmark_rates" (
  "id" UUID NOT NULL,
  "location_id" UUID,
  "building_type" TEXT NOT NULL,
  "quality_tier_id" UUID,
  "min_rate_per_sq_ft" DECIMAL(14,2) NOT NULL,
  "average_rate_per_sq_ft" DECIMAL(14,2) NOT NULL,
  "max_rate_per_sq_ft" DECIMAL(14,2) NOT NULL,
  "source_type" "construction_rate_source_type" NOT NULL DEFAULT 'ESTIMATED_FALLBACK',
  "confidence" "construction_rate_confidence" NOT NULL DEFAULT 'LOW',
  "is_derived" BOOLEAN NOT NULL DEFAULT true,
  "effective_from" TIMESTAMP(3) NOT NULL,
  "last_verified_at" TIMESTAMP(3),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_benchmark_rates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "construction_user_rate_overrides" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "project_id" UUID,
  "resource_type" "construction_resource_type" NOT NULL,
  "resource_key" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "rate" DECIMAL(14,2) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "construction_user_rate_overrides_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "construction_rate_import_batches" (
  "id" UUID NOT NULL,
  "filename" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "row_count" INTEGER NOT NULL DEFAULT 0,
  "error_count" INTEGER NOT NULL DEFAULT 0,
  "errors" JSONB,
  "created_by" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finished_at" TIMESTAMP(3),
  CONSTRAINT "construction_rate_import_batches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "construction_rate_audit_logs" (
  "id" UUID NOT NULL,
  "entity" TEXT NOT NULL,
  "entity_id" UUID NOT NULL,
  "action" TEXT NOT NULL,
  "old_value" JSONB,
  "new_value" JSONB,
  "reason" TEXT,
  "user_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "construction_rate_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "construction_labour_trades_slug_key" ON "construction_labour_trades"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "construction_equipment_slug_key" ON "construction_equipment"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "construction_professional_services_slug_key" ON "construction_professional_services"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "construction_phase_templates_code_key" ON "construction_phase_templates"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "construction_work_items_code_key" ON "construction_work_items"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "construction_wastage_rules_category_key_key" ON "construction_wastage_rules"("category_key");
CREATE UNIQUE INDEX IF NOT EXISTS "construction_quality_tiers_code_key" ON "construction_quality_tiers"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "construction_interior_components_slug_key" ON "construction_interior_components"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "construction_material_specifications_material_id_slug_key" ON "construction_material_specifications"("material_id", "slug");
CREATE UNIQUE INDEX IF NOT EXISTS "construction_quality_specifications_tier_id_category_key_key" ON "construction_quality_specifications"("tier_id", "category_key");
CREATE UNIQUE INDEX IF NOT EXISTS "construction_location_cost_factors_location_id_key" ON "construction_location_cost_factors"("location_id");

ALTER TABLE "construction_rate_sources"
  ADD CONSTRAINT "construction_rate_sources_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "construction_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "construction_material_specifications"
  ADD CONSTRAINT "construction_material_specifications_material_id_fkey"
  FOREIGN KEY ("material_id") REFERENCES "construction_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "construction_material_prices"
  ADD CONSTRAINT "construction_material_prices_source_record_id_fkey"
  FOREIGN KEY ("source_record_id") REFERENCES "construction_rate_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "construction_material_prices_specification_id_fkey"
  FOREIGN KEY ("specification_id") REFERENCES "construction_material_specifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "construction_labour_rates"
  ADD CONSTRAINT "construction_labour_rates_trade_id_fkey"
  FOREIGN KEY ("trade_id") REFERENCES "construction_labour_trades"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "construction_labour_rates_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "construction_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "construction_labour_rates_source_record_id_fkey"
  FOREIGN KEY ("source_record_id") REFERENCES "construction_rate_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "construction_equipment_rates"
  ADD CONSTRAINT "construction_equipment_rates_equipment_id_fkey"
  FOREIGN KEY ("equipment_id") REFERENCES "construction_equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "construction_equipment_rates_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "construction_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "construction_professional_rates"
  ADD CONSTRAINT "construction_professional_rates_service_id_fkey"
  FOREIGN KEY ("service_id") REFERENCES "construction_professional_services"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "construction_professional_rates_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "construction_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "construction_work_items"
  ADD CONSTRAINT "construction_work_items_phase_id_fkey"
  FOREIGN KEY ("phase_id") REFERENCES "construction_phase_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "construction_work_item_resources"
  ADD CONSTRAINT "construction_work_item_resources_work_item_id_fkey"
  FOREIGN KEY ("work_item_id") REFERENCES "construction_work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "construction_productivity_norms"
  ADD CONSTRAINT "construction_productivity_norms_trade_id_fkey"
  FOREIGN KEY ("trade_id") REFERENCES "construction_labour_trades"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "construction_productivity_norms_work_item_id_fkey"
  FOREIGN KEY ("work_item_id") REFERENCES "construction_work_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "construction_quality_specifications"
  ADD CONSTRAINT "construction_quality_specifications_tier_id_fkey"
  FOREIGN KEY ("tier_id") REFERENCES "construction_quality_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "construction_interior_rates"
  ADD CONSTRAINT "construction_interior_rates_component_id_fkey"
  FOREIGN KEY ("component_id") REFERENCES "construction_interior_components"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "construction_interior_rates_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "construction_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "construction_location_cost_factors"
  ADD CONSTRAINT "construction_location_cost_factors_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "construction_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "construction_benchmark_rates"
  ADD CONSTRAINT "construction_benchmark_rates_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "construction_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "construction_benchmark_rates_quality_tier_id_fkey"
  FOREIGN KEY ("quality_tier_id") REFERENCES "construction_quality_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
