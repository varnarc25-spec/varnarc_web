-- SEO module: redirects, audit issues, extended metadata fields

ALTER TABLE "seo_metadata"
  ADD COLUMN IF NOT EXISTS "meta_keywords" TEXT,
  ADD COLUMN IF NOT EXISTS "twitter_card" VARCHAR(40),
  ADD COLUMN IF NOT EXISTS "schema_type" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "language" VARCHAR(12);

CREATE TABLE IF NOT EXISTS "seo_redirects" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "source_path" VARCHAR(500) NOT NULL,
  "target_path" VARCHAR(1000) NOT NULL,
  "redirect_type" INTEGER NOT NULL DEFAULT 301,
  "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  "hit_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "seo_redirects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "seo_redirects_source_path_key" ON "seo_redirects"("source_path");
CREATE INDEX IF NOT EXISTS "seo_redirects_status_idx" ON "seo_redirects"("status");

CREATE TABLE IF NOT EXISTS "seo_audits" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "entity_type" VARCHAR(80),
  "entity_id" UUID,
  "issue_type" VARCHAR(80) NOT NULL,
  "severity" VARCHAR(20) NOT NULL DEFAULT 'warning',
  "message" TEXT NOT NULL,
  "resolved" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "seo_audits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "seo_audits_resolved_idx" ON "seo_audits"("resolved");
CREATE INDEX IF NOT EXISTS "seo_audits_entity_idx" ON "seo_audits"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "seo_audits_issue_type_idx" ON "seo_audits"("issue_type");
