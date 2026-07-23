-- Drop unused auto stubs (empty scaffolding)
DROP TABLE IF EXISTS "auto_variants";
DROP TABLE IF EXISTS "auto_models";
DROP TABLE IF EXISTS "auto_brands";

CREATE TABLE "automobile_manufacturers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo_url" TEXT,
    "country" TEXT,
    "founded_year" INTEGER,
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
    CONSTRAINT "automobile_manufacturers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "automobile_manufacturers_slug_key" ON "automobile_manufacturers"("slug");
CREATE INDEX "automobile_manufacturers_status_idx" ON "automobile_manufacturers"("status");

CREATE TABLE "automobile_vehicles" (
    "id" UUID NOT NULL,
    "manufacturer_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "variant" TEXT,
    "model_year" INTEGER,
    "category" TEXT,
    "body_type" TEXT,
    "fuel_type" TEXT,
    "transmission" TEXT,
    "engine_capacity" TEXT,
    "horsepower" DECIMAL(8,2),
    "torque" DECIMAL(8,2),
    "mileage" DECIMAL(8,2),
    "seating_capacity" INTEGER,
    "ground_clearance" DECIMAL(8,2),
    "boot_space" DECIMAL(8,2),
    "safety_rating" DECIMAL(3,1),
    "ex_showroom_price" DECIMAL(14,2),
    "estimated_on_road_price" DECIMAL(14,2),
    "warranty" TEXT,
    "description" TEXT,
    "specifications" JSONB,
    "pros" JSONB,
    "cons" JSONB,
    "image_url" TEXT,
    "brochure_url" TEXT,
    "video_url" TEXT,
    "affiliate_url" TEXT,
    "expert_rating" DECIMAL(3,2),
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sponsored" BOOLEAN NOT NULL DEFAULT false,
    "status" "publish_status" NOT NULL DEFAULT 'DRAFT',
    "seo_title" TEXT,
    "seo_description" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    CONSTRAINT "automobile_vehicles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "automobile_vehicles_slug_key" ON "automobile_vehicles"("slug");
CREATE INDEX "automobile_vehicles_status_idx" ON "automobile_vehicles"("status");
CREATE INDEX "automobile_vehicles_manufacturer_id_idx" ON "automobile_vehicles"("manufacturer_id");
CREATE INDEX "automobile_vehicles_category_idx" ON "automobile_vehicles"("category");
CREATE INDEX "automobile_vehicles_fuel_type_idx" ON "automobile_vehicles"("fuel_type");
ALTER TABLE "automobile_vehicles" ADD CONSTRAINT "automobile_vehicles_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "automobile_manufacturers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "automobile_maintenance_schedules" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "service_interval" TEXT NOT NULL,
    "estimated_cost" DECIMAL(12,2),
    "notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    CONSTRAINT "automobile_maintenance_schedules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "automobile_maintenance_schedules_vehicle_id_idx" ON "automobile_maintenance_schedules"("vehicle_id");
ALTER TABLE "automobile_maintenance_schedules" ADD CONSTRAINT "automobile_maintenance_schedules_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "automobile_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "automobile_faqs" (
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
    CONSTRAINT "automobile_faqs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "automobile_faqs_status_sort_order_idx" ON "automobile_faqs"("status", "sort_order");

CREATE TABLE "automobile_guides" (
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
    CONSTRAINT "automobile_guides_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "automobile_guides_slug_key" ON "automobile_guides"("slug");
CREATE INDEX "automobile_guides_status_idx" ON "automobile_guides"("status");

CREATE TABLE "automobile_comparisons" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL DEFAULT 'vehicles',
    "entity_ids" JSONB NOT NULL,
    "status" "publish_status" NOT NULL DEFAULT 'PUBLISHED',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    CONSTRAINT "automobile_comparisons_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "automobile_comparisons_slug_key" ON "automobile_comparisons"("slug");
CREATE INDEX "automobile_comparisons_status_idx" ON "automobile_comparisons"("status");
