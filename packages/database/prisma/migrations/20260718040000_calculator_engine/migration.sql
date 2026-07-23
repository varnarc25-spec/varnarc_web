-- Calculator Engine expansion

CREATE TABLE IF NOT EXISTS "calculator_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "calculator_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "calculator_categories_slug_key" ON "calculator_categories"("slug");

ALTER TABLE "calculators" ADD COLUMN IF NOT EXISTS "icon" TEXT;
ALTER TABLE "calculators" ADD COLUMN IF NOT EXISTS "category_id" UUID;
ALTER TABLE "calculators" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "calculators" ADD COLUMN IF NOT EXISTS "result_template" JSONB;
ALTER TABLE "calculators" ADD COLUMN IF NOT EXISTS "seo_title" TEXT;
ALTER TABLE "calculators" ADD COLUMN IF NOT EXISTS "seo_description" TEXT;

CREATE INDEX IF NOT EXISTS "calculators_category_id_idx" ON "calculators"("category_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'calculators_category_id_fkey') THEN
    ALTER TABLE "calculators"
    ADD CONSTRAINT "calculators_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "calculator_categories"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "calculator_fields" ADD COLUMN IF NOT EXISTS "default_value" TEXT;

CREATE TABLE IF NOT EXISTS "calculator_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "calculator_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "formula" TEXT,
    "settings" JSONB,
    "snapshot" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    CONSTRAINT "calculator_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "calculator_versions_calculator_id_version_key"
ON "calculator_versions"("calculator_id", "version");

CREATE INDEX IF NOT EXISTS "calculator_versions_calculator_id_idx" ON "calculator_versions"("calculator_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'calculator_versions_calculator_id_fkey') THEN
    ALTER TABLE "calculator_versions"
    ADD CONSTRAINT "calculator_versions_calculator_id_fkey"
    FOREIGN KEY ("calculator_id") REFERENCES "calculators"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "calculation_history" ADD COLUMN IF NOT EXISTS "duration_ms" INTEGER;

CREATE TABLE IF NOT EXISTS "calculator_analytics_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "calculator_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "session_id" TEXT,
    "user_id" UUID,
    "device" TEXT,
    "referrer" TEXT,
    "duration_ms" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "calculator_analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "calculator_analytics_events_calculator_id_event_type_created_at_idx"
ON "calculator_analytics_events"("calculator_id", "event_type", "created_at");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'calculator_analytics_events_calculator_id_fkey') THEN
    ALTER TABLE "calculator_analytics_events"
    ADD CONSTRAINT "calculator_analytics_events_calculator_id_fkey"
    FOREIGN KEY ("calculator_id") REFERENCES "calculators"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
