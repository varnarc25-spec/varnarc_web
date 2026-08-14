-- Loans ecosystem Phase 1: extend finance categories, banks, loans; FAQs/comparisons; rate history + content sources

-- Finance categories (loan hub fields)
ALTER TABLE "finance_categories" ADD COLUMN IF NOT EXISTS "short_description" TEXT;
ALTER TABLE "finance_categories" ADD COLUMN IF NOT EXISTS "introduction" TEXT;
ALTER TABLE "finance_categories" ADD COLUMN IF NOT EXISTS "icon" TEXT;
ALTER TABLE "finance_categories" ADD COLUMN IF NOT EXISTS "featured_image" TEXT;
ALTER TABLE "finance_categories" ADD COLUMN IF NOT EXISTS "hero_image" TEXT;
ALTER TABLE "finance_categories" ADD COLUMN IF NOT EXISTS "min_interest_rate" DECIMAL(8,4);
ALTER TABLE "finance_categories" ADD COLUMN IF NOT EXISTS "max_interest_rate" DECIMAL(8,4);
ALTER TABLE "finance_categories" ADD COLUMN IF NOT EXISTS "typical_min_amount" DECIMAL(14,2);
ALTER TABLE "finance_categories" ADD COLUMN IF NOT EXISTS "typical_max_amount" DECIMAL(14,2);
ALTER TABLE "finance_categories" ADD COLUMN IF NOT EXISTS "typical_min_tenure" INTEGER;
ALTER TABLE "finance_categories" ADD COLUMN IF NOT EXISTS "typical_max_tenure" INTEGER;
ALTER TABLE "finance_categories" ADD COLUMN IF NOT EXISTS "meta_title" TEXT;
ALTER TABLE "finance_categories" ADD COLUMN IF NOT EXISTS "meta_description" TEXT;
ALTER TABLE "finance_categories" ADD COLUMN IF NOT EXISTS "seo_content" TEXT;
ALTER TABLE "finance_categories" ADD COLUMN IF NOT EXISTS "content_sections" JSONB;
ALTER TABLE "finance_categories" ADD COLUMN IF NOT EXISTS "loan_hub_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "finance_categories" ADD COLUMN IF NOT EXISTS "status" "publish_status" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "finance_categories" ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMP(3);

UPDATE "finance_categories" SET "status" = 'PUBLISHED', "published_at" = COALESCE("published_at", "created_at")
WHERE "deleted_at" IS NULL AND "status" = 'DRAFT';

CREATE INDEX IF NOT EXISTS "finance_categories_loan_hub_enabled_status_idx"
  ON "finance_categories"("loan_hub_enabled", "status");

-- Banks (lender fields)
ALTER TABLE "banks" ADD COLUMN IF NOT EXISTS "legal_name" TEXT;
ALTER TABLE "banks" ADD COLUMN IF NOT EXISTS "lender_type" TEXT;
ALTER TABLE "banks" ADD COLUMN IF NOT EXISTS "headquarters" TEXT;
ALTER TABLE "banks" ADD COLUMN IF NOT EXISTS "support_url" TEXT;
ALTER TABLE "banks" ADD COLUMN IF NOT EXISTS "source_url" TEXT;
CREATE INDEX IF NOT EXISTS "banks_lender_type_idx" ON "banks"("lender_type");

-- Loans (product fields)
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "short_description" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "interest_rate_min" DECIMAL(8,4);
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "interest_rate_max" DECIMAL(8,4);
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "rate_type" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "benchmark_type" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "processing_fee_min" DECIMAL(8,4);
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "processing_fee_max" DECIMAL(8,4);
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "processing_fee_text" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "foreclosure_charge_text" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "prepayment_charge_text" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "late_payment_charge_text" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "loan_amount_min" DECIMAL(14,2);
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "loan_amount_max" DECIMAL(14,2);
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "minimum_age" INTEGER;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "maximum_age" INTEGER;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "minimum_income" DECIMAL(14,2);
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "minimum_credit_score" INTEGER;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "employment_types" JSONB;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "eligibility_summary" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "documents_required" JSONB;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "features" JSONB;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "benefits" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "disadvantages" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "application_process" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "approval_time" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "disbursement_time" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "official_application_url" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "source_url" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "rate_last_verified_at" TIMESTAMP(3);
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "sponsored" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "sponsored_disclosure" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "needs_rate_review" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "canonical_url" TEXT;

-- Backfill range fields from legacy single values where present
UPDATE "loans"
SET
  "interest_rate_min" = COALESCE("interest_rate_min", "interest_rate"),
  "interest_rate_max" = COALESCE("interest_rate_max", "interest_rate"),
  "loan_amount_max" = COALESCE("loan_amount_max", "max_amount"),
  "processing_fee_min" = COALESCE("processing_fee_min", "processing_fee"),
  "processing_fee_max" = COALESCE("processing_fee_max", "processing_fee")
WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "loans_category_id_slug_idx" ON "loans"("category_id", "slug");
CREATE INDEX IF NOT EXISTS "loans_featured_status_idx" ON "loans"("featured", "status");
CREATE INDEX IF NOT EXISTS "loans_sponsored_status_idx" ON "loans"("sponsored", "status");
CREATE INDEX IF NOT EXISTS "loans_needs_rate_review_status_idx" ON "loans"("needs_rate_review", "status");
CREATE INDEX IF NOT EXISTS "loans_rate_last_verified_at_idx" ON "loans"("rate_last_verified_at");

-- Finance FAQs polymorphic scope
ALTER TABLE "finance_faqs" ADD COLUMN IF NOT EXISTS "entity_type" TEXT;
ALTER TABLE "finance_faqs" ADD COLUMN IF NOT EXISTS "entity_id" UUID;
CREATE INDEX IF NOT EXISTS "finance_faqs_entity_type_entity_id_idx"
  ON "finance_faqs"("entity_type", "entity_id");

-- Finance comparisons SEO fields
ALTER TABLE "finance_comparisons" ADD COLUMN IF NOT EXISTS "intro" TEXT;
ALTER TABLE "finance_comparisons" ADD COLUMN IF NOT EXISTS "seo_title" TEXT;
ALTER TABLE "finance_comparisons" ADD COLUMN IF NOT EXISTS "seo_description" TEXT;
ALTER TABLE "finance_comparisons" ADD COLUMN IF NOT EXISTS "canonical_url" TEXT;
ALTER TABLE "finance_comparisons" ADD COLUMN IF NOT EXISTS "methodology_note" TEXT;
ALTER TABLE "finance_comparisons" ADD COLUMN IF NOT EXISTS "noindex" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "finance_comparisons_entity_type_status_idx"
  ON "finance_comparisons"("entity_type", "status");

-- Loan rate history
CREATE TABLE IF NOT EXISTS "loan_rate_histories" (
    "id" UUID NOT NULL,
    "loan_id" UUID NOT NULL,
    "interest_rate_min" DECIMAL(8,4),
    "interest_rate_max" DECIMAL(8,4),
    "source_url" TEXT,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    CONSTRAINT "loan_rate_histories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "loan_rate_histories_loan_id_effective_date_idx"
  ON "loan_rate_histories"("loan_id", "effective_date");

DO $$ BEGIN
  ALTER TABLE "loan_rate_histories" ADD CONSTRAINT "loan_rate_histories_loan_id_fkey"
    FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Content sources
CREATE TABLE IF NOT EXISTS "content_sources" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" UUID,
    "retrieved_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "notes" TEXT,
    "status" "publish_status" NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    CONSTRAINT "content_sources_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "content_sources_entity_type_entity_id_idx"
  ON "content_sources"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "content_sources_status_idx" ON "content_sources"("status");
