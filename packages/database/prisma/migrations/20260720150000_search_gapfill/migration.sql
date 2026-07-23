-- Search MVP gap-fill: enum values, filter/SEO columns, tsvector expansion, result clicks

-- New SearchEntityType values (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'search_entity_type' AND e.enumlabel = 'GUIDE'
  ) THEN
    ALTER TYPE "search_entity_type" ADD VALUE 'GUIDE';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'search_entity_type' AND e.enumlabel = 'DEALER'
  ) THEN
    ALTER TYPE "search_entity_type" ADD VALUE 'DEALER';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'search_entity_type' AND e.enumlabel = 'VENDOR'
  ) THEN
    ALTER TYPE "search_entity_type" ADD VALUE 'VENDOR';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'search_entity_type' AND e.enumlabel = 'FORMULA_PAGE'
  ) THEN
    ALTER TYPE "search_entity_type" ADD VALUE 'FORMULA_PAGE';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'search_entity_type' AND e.enumlabel = 'BUSINESS_SERVICE'
  ) THEN
    ALTER TYPE "search_entity_type" ADD VALUE 'BUSINESS_SERVICE';
  END IF;
END $$;

-- Filterable / SEO columns on search_index
ALTER TABLE "search_index" ADD COLUMN IF NOT EXISTS "tags" TEXT;
ALTER TABLE "search_index" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "search_index" ADD COLUMN IF NOT EXISTS "author" TEXT;
ALTER TABLE "search_index" ADD COLUMN IF NOT EXISTS "brand" TEXT;
ALTER TABLE "search_index" ADD COLUMN IF NOT EXISTS "price_min" DECIMAL(12,2);
ALTER TABLE "search_index" ADD COLUMN IF NOT EXISTS "price_max" DECIMAL(12,2);
ALTER TABLE "search_index" ADD COLUMN IF NOT EXISTS "vehicle_type" TEXT;
ALTER TABLE "search_index" ADD COLUMN IF NOT EXISTS "fuel_type" TEXT;
ALTER TABLE "search_index" ADD COLUMN IF NOT EXISTS "loan_type" TEXT;
ALTER TABLE "search_index" ADD COLUMN IF NOT EXISTS "material_type" TEXT;
ALTER TABLE "search_index" ADD COLUMN IF NOT EXISTS "seo_title" TEXT;
ALTER TABLE "search_index" ADD COLUMN IF NOT EXISTS "seo_description" TEXT;

CREATE INDEX IF NOT EXISTS "search_index_location_idx" ON "search_index"("location");
CREATE INDEX IF NOT EXISTS "search_index_brand_idx" ON "search_index"("brand");
CREATE INDEX IF NOT EXISTS "search_index_rating_idx" ON "search_index"("rating");

-- Expand FTS vector to include tags, brand, location, author
CREATE OR REPLACE FUNCTION search_index_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.keywords, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.tags, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.brand, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.location, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.author, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS search_index_vector_trigger ON "search_index";
CREATE TRIGGER search_index_vector_trigger
BEFORE INSERT OR UPDATE OF title, summary, content, keywords, category, tags, brand, location, author
ON "search_index"
FOR EACH ROW EXECUTE FUNCTION search_index_vector_update();

-- Backfill vectors for existing rows so new weighted fields take effect
UPDATE "search_index" SET "title" = "title";

-- Result click analytics
CREATE TABLE IF NOT EXISTS "search_result_clicks" (
    "id" UUID NOT NULL,
    "query_id" UUID,
    "entity_type" "search_entity_type" NOT NULL,
    "entity_id" UUID NOT NULL,
    "url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_result_clicks_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'search_result_clicks_query_id_fkey'
  ) THEN
    ALTER TABLE "search_result_clicks"
      ADD CONSTRAINT "search_result_clicks_query_id_fkey"
      FOREIGN KEY ("query_id") REFERENCES "search_queries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "search_result_clicks_entity_type_entity_id_idx"
  ON "search_result_clicks"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "search_result_clicks_created_at_idx"
  ON "search_result_clicks"("created_at");
CREATE INDEX IF NOT EXISTS "search_result_clicks_query_id_idx"
  ON "search_result_clicks"("query_id");
