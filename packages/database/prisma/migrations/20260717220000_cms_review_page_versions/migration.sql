-- Add REVIEW to publish_status (idempotent-ish for re-runs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'publish_status' AND e.enumlabel = 'REVIEW'
  ) THEN
    ALTER TYPE "publish_status" ADD VALUE 'REVIEW';
  END IF;
END $$;

ALTER TABLE "tags" ADD COLUMN IF NOT EXISTS "description" TEXT;

CREATE TABLE IF NOT EXISTS "page_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "page_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "version" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    CONSTRAINT "page_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "page_versions_page_id_version_key" ON "page_versions"("page_id", "version");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'page_versions_page_id_fkey'
  ) THEN
    ALTER TABLE "page_versions"
      ADD CONSTRAINT "page_versions_page_id_fkey"
      FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
