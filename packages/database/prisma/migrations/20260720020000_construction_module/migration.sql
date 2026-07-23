-- Construction Module

CREATE TABLE IF NOT EXISTS "construction_categories" (
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
    CONSTRAINT "construction_categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "construction_categories_slug_key" ON "construction_categories"("slug");
CREATE INDEX IF NOT EXISTS "construction_categories_sort_order_idx" ON "construction_categories"("sort_order");

CREATE TABLE IF NOT EXISTS "construction_brands" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo_url" TEXT,
    "logo_media_id" UUID,
    "website" TEXT,
    "description" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "publish_status" NOT NULL DEFAULT 'DRAFT',
    "seo_title" TEXT,
    "seo_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    CONSTRAINT "construction_brands_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "construction_brands_slug_key" ON "construction_brands"("slug");
CREATE INDEX IF NOT EXISTS "construction_brands_status_idx" ON "construction_brands"("status");

ALTER TABLE "construction_materials" ADD COLUMN IF NOT EXISTS "category_id" UUID;
ALTER TABLE "construction_materials" ADD COLUMN IF NOT EXISTS "brand_id" UUID;
ALTER TABLE "construction_materials" ADD COLUMN IF NOT EXISTS "specifications" JSONB;
ALTER TABLE "construction_materials" ADD COLUMN IF NOT EXISTS "approximate_price" DECIMAL(12,2);
ALTER TABLE "construction_materials" ADD COLUMN IF NOT EXISTS "availability_region" TEXT;
ALTER TABLE "construction_materials" ADD COLUMN IF NOT EXISTS "affiliate_url" TEXT;
ALTER TABLE "construction_materials" ADD COLUMN IF NOT EXISTS "media_id" UUID;
ALTER TABLE "construction_materials" ADD COLUMN IF NOT EXISTS "image_url" TEXT;
ALTER TABLE "construction_materials" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "construction_materials" ADD COLUMN IF NOT EXISTS "sponsored" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "construction_materials" ADD COLUMN IF NOT EXISTS "status" "publish_status" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "construction_materials" ADD COLUMN IF NOT EXISTS "rating" DECIMAL(3,2);
ALTER TABLE "construction_materials" ADD COLUMN IF NOT EXISTS "seo_title" TEXT;
ALTER TABLE "construction_materials" ADD COLUMN IF NOT EXISTS "seo_description" TEXT;
ALTER TABLE "construction_materials" ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "construction_materials_status_idx" ON "construction_materials"("status");
CREATE INDEX IF NOT EXISTS "construction_materials_category_id_idx" ON "construction_materials"("category_id");
CREATE INDEX IF NOT EXISTS "construction_materials_brand_id_idx" ON "construction_materials"("brand_id");

DO $$ BEGIN
  ALTER TABLE "construction_materials" ADD CONSTRAINT "construction_materials_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "construction_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "construction_materials" ADD CONSTRAINT "construction_materials_brand_id_fkey"
    FOREIGN KEY ("brand_id") REFERENCES "construction_brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "cost_templates" ADD COLUMN IF NOT EXISTS "category_id" UUID;
ALTER TABLE "cost_templates" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "cost_templates" ADD COLUMN IF NOT EXISTS "formula_reference" TEXT;
ALTER TABLE "cost_templates" ADD COLUMN IF NOT EXISTS "labor_percent" DECIMAL(5,2);
ALTER TABLE "cost_templates" ADD COLUMN IF NOT EXISTS "contingency_percent" DECIMAL(5,2);
ALTER TABLE "cost_templates" ADD COLUMN IF NOT EXISTS "status" "publish_status" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "cost_templates" ALTER COLUMN "items" DROP NOT NULL;
CREATE INDEX IF NOT EXISTS "cost_templates_status_idx" ON "cost_templates"("status");
DO $$ BEGIN
  ALTER TABLE "cost_templates" ADD CONSTRAINT "cost_templates_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "construction_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "construction_estimators" ADD COLUMN IF NOT EXISTS "status" "publish_status" NOT NULL DEFAULT 'DRAFT';
DO $$ BEGIN
  ALTER TABLE "construction_estimators" ADD CONSTRAINT "construction_estimators_template_id_fkey"
    FOREIGN KEY ("template_id") REFERENCES "cost_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "construction_projects" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "project_type" TEXT NOT NULL,
    "area_sqft" DECIMAL(12,2),
    "region" TEXT,
    "estimated_cost" DECIMAL(14,2),
    "breakdown" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "construction_projects_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "construction_projects_user_id_created_at_idx" ON "construction_projects"("user_id", "created_at");

CREATE TABLE IF NOT EXISTS "construction_project_items" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "material_id" UUID,
    "name" TEXT,
    "quantity" DECIMAL(14,4) NOT NULL,
    "unit_cost" DECIMAL(12,2),
    "estimated_cost" DECIMAL(14,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "construction_project_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "construction_project_items_project_id_idx" ON "construction_project_items"("project_id");
DO $$ BEGIN
  ALTER TABLE "construction_project_items" ADD CONSTRAINT "construction_project_items_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "construction_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "construction_project_items" ADD CONSTRAINT "construction_project_items_material_id_fkey"
    FOREIGN KEY ("material_id") REFERENCES "construction_materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "construction_faqs" (
    "id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "publish_status" NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    CONSTRAINT "construction_faqs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "construction_faqs_status_sort_order_idx" ON "construction_faqs"("status", "sort_order");

CREATE TABLE IF NOT EXISTS "construction_guides" (
    "id" UUID NOT NULL,
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
    CONSTRAINT "construction_guides_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "construction_guides_slug_key" ON "construction_guides"("slug");
CREATE INDEX IF NOT EXISTS "construction_guides_status_idx" ON "construction_guides"("status");
