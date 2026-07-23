-- Finance Module

CREATE TABLE IF NOT EXISTS "finance_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    CONSTRAINT "finance_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "finance_categories_slug_key" ON "finance_categories"("slug");
CREATE INDEX IF NOT EXISTS "finance_categories_sort_order_idx" ON "finance_categories"("sort_order");

-- Enhance banks
ALTER TABLE "banks" ADD COLUMN IF NOT EXISTS "logo_media_id" UUID;
ALTER TABLE "banks" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "banks" ADD COLUMN IF NOT EXISTS "status" "publish_status" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "banks" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "banks" ADD COLUMN IF NOT EXISTS "seo_title" TEXT;
ALTER TABLE "banks" ADD COLUMN IF NOT EXISTS "seo_description" TEXT;
CREATE INDEX IF NOT EXISTS "banks_status_idx" ON "banks"("status");

-- Enhance loans
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "category_id" UUID;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "interest_rate" DECIMAL(8,4);
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "processing_fee" DECIMAL(8,4);
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "tenure_min" INTEGER;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "tenure_max" INTEGER;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "max_amount" DECIMAL(14,2);
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "eligibility" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "affiliate_url" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "pros" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "cons" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "status" "publish_status" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "seo_title" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "seo_description" TEXT;
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "loans_status_idx" ON "loans"("status");
CREATE INDEX IF NOT EXISTS "loans_category_id_idx" ON "loans"("category_id");

DO $$ BEGIN
  ALTER TABLE "loans" ADD CONSTRAINT "loans_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "finance_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "credit_cards" (
    "id" UUID NOT NULL,
    "bank_id" UUID NOT NULL,
    "category_id" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "annual_fee" DECIMAL(12,2),
    "joining_fee" DECIMAL(12,2),
    "rewards" TEXT,
    "cashback" TEXT,
    "lounge_access" BOOLEAN NOT NULL DEFAULT false,
    "affiliate_url" TEXT,
    "pros" TEXT,
    "cons" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "publish_status" NOT NULL DEFAULT 'DRAFT',
    "metadata" JSONB,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    CONSTRAINT "credit_cards_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "credit_cards_bank_id_slug_key" ON "credit_cards"("bank_id", "slug");
CREATE INDEX IF NOT EXISTS "credit_cards_status_idx" ON "credit_cards"("status");

DO $$ BEGIN
  ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_bank_id_fkey"
    FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "finance_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "insurance_products" (
    "id" UUID NOT NULL,
    "category_id" UUID,
    "provider_name" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "coverage" TEXT,
    "premium" DECIMAL(12,2),
    "benefits" TEXT,
    "affiliate_url" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "publish_status" NOT NULL DEFAULT 'DRAFT',
    "metadata" JSONB,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    CONSTRAINT "insurance_products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "insurance_products_slug_key" ON "insurance_products"("slug");
CREATE INDEX IF NOT EXISTS "insurance_products_status_idx" ON "insurance_products"("status");

DO $$ BEGIN
  ALTER TABLE "insurance_products" ADD CONSTRAINT "insurance_products_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "finance_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "investment_products" (
    "id" UUID NOT NULL,
    "category_id" UUID,
    "provider_name" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "risk_level" TEXT,
    "expected_return" DECIMAL(8,4),
    "lock_in_period" TEXT,
    "affiliate_url" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "publish_status" NOT NULL DEFAULT 'DRAFT',
    "metadata" JSONB,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    CONSTRAINT "investment_products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "investment_products_slug_key" ON "investment_products"("slug");
CREATE INDEX IF NOT EXISTS "investment_products_status_idx" ON "investment_products"("status");
CREATE INDEX IF NOT EXISTS "investment_products_risk_level_idx" ON "investment_products"("risk_level");

DO $$ BEGIN
  ALTER TABLE "investment_products" ADD CONSTRAINT "investment_products_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "finance_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enhance interest_rates (loan_id becomes optional)
ALTER TABLE "interest_rates" ALTER COLUMN "loan_id" DROP NOT NULL;
ALTER TABLE "interest_rates" ADD COLUMN IF NOT EXISTS "bank_id" UUID;
ALTER TABLE "interest_rates" ADD COLUMN IF NOT EXISTS "product_type" TEXT;
ALTER TABLE "interest_rates" ADD COLUMN IF NOT EXISTS "provider_id" UUID;
ALTER TABLE "interest_rates" ADD COLUMN IF NOT EXISTS "source" TEXT;
ALTER TABLE "interest_rates" ADD COLUMN IF NOT EXISTS "created_by" UUID;
ALTER TABLE "interest_rates" ADD COLUMN IF NOT EXISTS "updated_by" UUID;
CREATE INDEX IF NOT EXISTS "interest_rates_product_type_effective_from_idx" ON "interest_rates"("product_type", "effective_from");
CREATE INDEX IF NOT EXISTS "interest_rates_bank_id_idx" ON "interest_rates"("bank_id");

DO $$ BEGIN
  ALTER TABLE "interest_rates" ADD CONSTRAINT "interest_rates_bank_id_fkey"
    FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
