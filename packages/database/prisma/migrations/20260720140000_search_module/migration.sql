-- CreateEnum
CREATE TYPE "search_entity_type" AS ENUM (
  'ARTICLE',
  'PAGE',
  'CMS_CATEGORY',
  'TAG',
  'LOAN',
  'BANK',
  'CREDIT_CARD',
  'INSURANCE',
  'MATERIAL',
  'BRAND',
  'VEHICLE',
  'MANUFACTURER',
  'BUSINESS',
  'AI_TOOL',
  'AI_CATEGORY',
  'CALCULATOR',
  'REVIEW',
  'COMPARISON',
  'MEDIA'
);

-- CreateTable
CREATE TABLE "search_index" (
    "id" UUID NOT NULL,
    "entity_type" "search_entity_type" NOT NULL,
    "entity_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT,
    "keywords" TEXT,
    "slug" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "category" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "status" "publish_status" NOT NULL DEFAULT 'PUBLISHED',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sponsored" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3),
    "search_vector" tsvector,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_index_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "search_index_entity_type_entity_id_key" ON "search_index"("entity_type", "entity_id");
CREATE INDEX "search_index_entity_type_status_idx" ON "search_index"("entity_type", "status");
CREATE INDEX "search_index_category_idx" ON "search_index"("category");
CREATE INDEX "search_index_published_at_idx" ON "search_index"("published_at");
CREATE INDEX "search_index_slug_idx" ON "search_index"("slug");
CREATE INDEX "search_index_search_vector_idx" ON "search_index" USING GIN ("search_vector");

CREATE OR REPLACE FUNCTION search_index_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.keywords, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS search_index_vector_trigger ON "search_index";
CREATE TRIGGER search_index_vector_trigger
BEFORE INSERT OR UPDATE OF title, summary, content, keywords, category
ON "search_index"
FOR EACH ROW EXECUTE FUNCTION search_index_vector_update();

-- AlterTable search_queries
ALTER TABLE "search_queries" ADD COLUMN IF NOT EXISTS "clicked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "search_queries" ADD COLUMN IF NOT EXISTS "latency_ms" INTEGER;
CREATE INDEX IF NOT EXISTS "search_queries_results_idx" ON "search_queries"("results");

-- CreateTable popular_searches
CREATE TABLE "popular_searches" (
    "id" UUID NOT NULL,
    "keyword" TEXT NOT NULL,
    "search_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "popular_searches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "popular_searches_keyword_key" ON "popular_searches"("keyword");
CREATE INDEX "popular_searches_search_count_idx" ON "popular_searches"("search_count");
