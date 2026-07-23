ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "review_type" TEXT NOT NULL DEFAULT 'editorial';
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "entity_type" TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "entity_id" UUID;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "summary" TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "verdict" TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "recommendation" TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "featured_media_id" UUID;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "seo_title" TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "seo_description" TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "view_count" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "reviews_entity_type_entity_id_idx" ON "reviews"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "reviews_review_type_idx" ON "reviews"("review_type");

CREATE TABLE IF NOT EXISTS "user_reviews" (
    "id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "product_id" UUID,
    "review_id" UUID,
    "user_id" UUID NOT NULL,
    "rating" DECIMAL(3,2) NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "status" "publish_status" NOT NULL DEFAULT 'REVIEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "user_reviews_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_reviews_user_id_entity_type_entity_id_key"
  ON "user_reviews"("user_id", "entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "user_reviews_entity_type_entity_id_status_idx"
  ON "user_reviews"("entity_type", "entity_id", "status");
CREATE INDEX IF NOT EXISTS "user_reviews_status_idx" ON "user_reviews"("status");
ALTER TABLE "user_reviews"
  DROP CONSTRAINT IF EXISTS "user_reviews_user_id_fkey";
ALTER TABLE "user_reviews"
  ADD CONSTRAINT "user_reviews_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_reviews"
  DROP CONSTRAINT IF EXISTS "user_reviews_review_id_fkey";
ALTER TABLE "user_reviews"
  ADD CONSTRAINT "user_reviews_review_id_fkey"
  FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "review_helpfulness" (
    "id" UUID NOT NULL,
    "user_review_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "vote" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "review_helpfulness_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "review_helpfulness_user_review_id_user_id_key"
  ON "review_helpfulness"("user_review_id", "user_id");
ALTER TABLE "review_helpfulness"
  DROP CONSTRAINT IF EXISTS "review_helpfulness_user_review_id_fkey";
ALTER TABLE "review_helpfulness"
  ADD CONSTRAINT "review_helpfulness_user_review_id_fkey"
  FOREIGN KEY ("user_review_id") REFERENCES "user_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
