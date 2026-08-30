-- VCCI framework tables. Seeds active methodology only — no published index snapshots
-- (numeric values must not be exposed until quality gates pass).

CREATE TYPE "construction_vcci_publication_status" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'RETIRED');

CREATE TABLE IF NOT EXISTS "construction_vcci_methodologies" (
  "id" UUID NOT NULL,
  "version" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "baseline_label" TEXT NOT NULL,
  "baseline_start" DATE NOT NULL,
  "baseline_end" DATE NOT NULL,
  "baseline_index" DECIMAL(10,2) NOT NULL DEFAULT 100,
  "weights" JSONB NOT NULL,
  "notes" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_vcci_methodologies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "construction_vcci_methodologies_version_key"
  ON "construction_vcci_methodologies"("version");

CREATE TABLE IF NOT EXISTS "construction_vcci_snapshots" (
  "id" UUID NOT NULL,
  "methodology_id" UUID NOT NULL,
  "methodology_version" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "location_id" UUID,
  "component_key" TEXT,
  "index_value" DECIMAL(12,2) NOT NULL,
  "calculation_date" DATE NOT NULL,
  "component_indexes" JSONB,
  "component_weights" JSONB,
  "source_datasets" JSONB,
  "coverage_ratio" DECIMAL(6,4),
  "quality_passed" BOOLEAN NOT NULL DEFAULT false,
  "quality_blockers" JSONB,
  "status" "construction_vcci_publication_status" NOT NULL DEFAULT 'DRAFT',
  "published_at" TIMESTAMP(3),
  "notes" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_vcci_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "construction_vcci_snapshots_scope_calculation_date_idx"
  ON "construction_vcci_snapshots"("scope", "calculation_date");
CREATE INDEX IF NOT EXISTS "construction_vcci_snapshots_location_id_calculation_date_idx"
  ON "construction_vcci_snapshots"("location_id", "calculation_date");
CREATE INDEX IF NOT EXISTS "construction_vcci_snapshots_component_key_calculation_date_idx"
  ON "construction_vcci_snapshots"("component_key", "calculation_date");
CREATE INDEX IF NOT EXISTS "construction_vcci_snapshots_status_calculation_date_idx"
  ON "construction_vcci_snapshots"("status", "calculation_date");
CREATE INDEX IF NOT EXISTS "construction_vcci_snapshots_methodology_id_calculation_date_idx"
  ON "construction_vcci_snapshots"("methodology_id", "calculation_date");

ALTER TABLE "construction_vcci_snapshots"
  ADD CONSTRAINT "construction_vcci_snapshots_methodology_id_fkey"
  FOREIGN KEY ("methodology_id") REFERENCES "construction_vcci_methodologies"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "construction_vcci_snapshots"
  ADD CONSTRAINT "construction_vcci_snapshots_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "construction_locations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "construction_vcci_methodologies" (
  "id", "version", "label", "baseline_label", "baseline_start", "baseline_end",
  "baseline_index", "weights", "notes", "is_active", "created_at", "updated_at"
) VALUES (
  gen_random_uuid(),
  '2026.08.1',
  'VCCI framework v2026.08.1',
  'Q1 2026',
  '2026-01-01',
  '2026-03-31',
  100,
  '{"cement":0.14,"steel":0.16,"aggregates":0.08,"masonry":0.1,"labour":0.25,"finishing":0.12,"electrical":0.08,"plumbing":0.07}'::jsonb,
  'Active methodology definition only. No published numeric snapshots are seeded — public index values require quality-gated PUBLISHED rows.',
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("version") DO UPDATE SET
  "label" = EXCLUDED."label",
  "baseline_label" = EXCLUDED."baseline_label",
  "baseline_start" = EXCLUDED."baseline_start",
  "baseline_end" = EXCLUDED."baseline_end",
  "weights" = EXCLUDED."weights",
  "notes" = EXCLUDED."notes",
  "is_active" = true,
  "updated_at" = NOW(),
  "deleted_at" = NULL;
