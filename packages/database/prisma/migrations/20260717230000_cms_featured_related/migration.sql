-- AlterTable articles
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "is_featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "reading_time_minutes" INTEGER;

CREATE INDEX IF NOT EXISTS "articles_is_featured_status_idx" ON "articles"("is_featured", "status");

-- CreateTable article_related
CREATE TABLE IF NOT EXISTS "article_related" (
    "article_id" UUID NOT NULL,
    "related_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "article_related_pkey" PRIMARY KEY ("article_id","related_id")
);

CREATE INDEX IF NOT EXISTS "article_related_article_id_sort_order_idx" ON "article_related"("article_id", "sort_order");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'article_related_article_id_fkey') THEN
    ALTER TABLE "article_related"
      ADD CONSTRAINT "article_related_article_id_fkey"
      FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'article_related_related_id_fkey') THEN
    ALTER TABLE "article_related"
      ADD CONSTRAINT "article_related_related_id_fkey"
      FOREIGN KEY ("related_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
