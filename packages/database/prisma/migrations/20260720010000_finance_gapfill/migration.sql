-- Finance gapfill: content, affiliate, comparisons, feeds, eligibility, credit, portfolio, goals

CREATE TABLE IF NOT EXISTS "finance_faqs" (
    "id" UUID NOT NULL,
    "category_id" UUID,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "publish_status" NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    CONSTRAINT "finance_faqs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "finance_faqs_status_sort_order_idx" ON "finance_faqs"("status", "sort_order");
DO $$ BEGIN
  ALTER TABLE "finance_faqs" ADD CONSTRAINT "finance_faqs_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "finance_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "finance_glossary_terms" (
    "id" UUID NOT NULL,
    "term" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "status" "publish_status" NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    CONSTRAINT "finance_glossary_terms_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "finance_glossary_terms_slug_key" ON "finance_glossary_terms"("slug");
CREATE INDEX IF NOT EXISTS "finance_glossary_terms_status_idx" ON "finance_glossary_terms"("status");

CREATE TABLE IF NOT EXISTS "finance_guides" (
    "id" UUID NOT NULL,
    "category_id" UUID,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "body" TEXT,
    "status" "publish_status" NOT NULL DEFAULT 'DRAFT',
    "seo_title" TEXT,
    "seo_description" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    CONSTRAINT "finance_guides_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "finance_guides_slug_key" ON "finance_guides"("slug");
CREATE INDEX IF NOT EXISTS "finance_guides_status_idx" ON "finance_guides"("status");
DO $$ BEGIN
  ALTER TABLE "finance_guides" ADD CONSTRAINT "finance_guides_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "finance_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "affiliate_clicks" (
    "id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "affiliate_url" TEXT NOT NULL,
    "user_id" UUID,
    "session_id" TEXT,
    "referrer" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "affiliate_clicks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "affiliate_clicks_entity_type_entity_id_idx" ON "affiliate_clicks"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "affiliate_clicks_created_at_idx" ON "affiliate_clicks"("created_at");

CREATE TABLE IF NOT EXISTS "finance_comparisons" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_ids" JSONB NOT NULL,
    "status" "publish_status" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    CONSTRAINT "finance_comparisons_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "finance_comparisons_slug_key" ON "finance_comparisons"("slug");
CREATE INDEX IF NOT EXISTS "finance_comparisons_status_idx" ON "finance_comparisons"("status");

CREATE TABLE IF NOT EXISTS "finance_rate_feeds" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "endpoint_url" TEXT,
    "product_type" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_synced_at" TIMESTAMP(3),
    "last_status" TEXT,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    CONSTRAINT "finance_rate_feeds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "loan_eligibility_checks" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "loan_type" TEXT NOT NULL,
    "income" DECIMAL(14,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "tenure_months" INTEGER,
    "result" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "loan_eligibility_checks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "loan_eligibility_checks_user_id_created_at_idx" ON "loan_eligibility_checks"("user_id", "created_at");

CREATE TABLE IF NOT EXISTS "credit_score_checks" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "pan_masked" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "score" INTEGER,
    "band" TEXT,
    "result" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "credit_score_checks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "credit_score_checks_user_id_created_at_idx" ON "credit_score_checks"("user_id", "created_at");

CREATE TABLE IF NOT EXISTS "finance_portfolios" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My portfolio',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "finance_portfolios_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "finance_portfolios_user_id_idx" ON "finance_portfolios"("user_id");

CREATE TABLE IF NOT EXISTS "finance_portfolio_holdings" (
    "id" UUID NOT NULL,
    "portfolio_id" UUID NOT NULL,
    "symbol" TEXT,
    "name" TEXT NOT NULL,
    "asset_type" TEXT NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL,
    "avg_cost" DECIMAL(14,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "finance_portfolio_holdings_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "finance_portfolio_holdings_portfolio_id_idx" ON "finance_portfolio_holdings"("portfolio_id");
DO $$ BEGIN
  ALTER TABLE "finance_portfolio_holdings" ADD CONSTRAINT "finance_portfolio_holdings_portfolio_id_fkey"
    FOREIGN KEY ("portfolio_id") REFERENCES "finance_portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "finance_goals" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "target_amount" DECIMAL(14,2) NOT NULL,
    "current_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "target_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "finance_goals_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "finance_goals_user_id_status_idx" ON "finance_goals"("user_id", "status");

ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "review_product_id" UUID;
ALTER TABLE "credit_cards" ADD COLUMN IF NOT EXISTS "review_product_id" UUID;
ALTER TABLE "insurance_products" ADD COLUMN IF NOT EXISTS "review_product_id" UUID;
ALTER TABLE "investment_products" ADD COLUMN IF NOT EXISTS "review_product_id" UUID;
