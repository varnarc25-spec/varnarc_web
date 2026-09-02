-- Automobile discovery: image provenance, safety source, launch status, model search indexes, image cache.

ALTER TABLE "automobile_vehicles" ADD COLUMN IF NOT EXISTS "image_source" TEXT;
ALTER TABLE "automobile_vehicles" ADD COLUMN IF NOT EXISTS "image_source_page" TEXT;
ALTER TABLE "automobile_vehicles" ADD COLUMN IF NOT EXISTS "image_author" TEXT;
ALTER TABLE "automobile_vehicles" ADD COLUMN IF NOT EXISTS "image_license" TEXT;
ALTER TABLE "automobile_vehicles" ADD COLUMN IF NOT EXISTS "image_attribution" TEXT;
ALTER TABLE "automobile_vehicles" ADD COLUMN IF NOT EXISTS "image_last_verified_at" TIMESTAMP(3);
ALTER TABLE "automobile_vehicles" ADD COLUMN IF NOT EXISTS "image_confidence" DECIMAL(4,2);
ALTER TABLE "automobile_vehicles" ADD COLUMN IF NOT EXISTS "source_url" TEXT;
ALTER TABLE "automobile_vehicles" ADD COLUMN IF NOT EXISTS "source_name" TEXT;
ALTER TABLE "automobile_vehicles" ADD COLUMN IF NOT EXISTS "last_verified_at" TIMESTAMP(3);
ALTER TABLE "automobile_vehicles" ADD COLUMN IF NOT EXISTS "safety_agency" TEXT;
ALTER TABLE "automobile_vehicles" ADD COLUMN IF NOT EXISTS "safety_source_url" TEXT;
ALTER TABLE "automobile_vehicles" ADD COLUMN IF NOT EXISTS "launch_status" TEXT;

CREATE INDEX IF NOT EXISTS "automobile_vehicles_seating_capacity_idx" ON "automobile_vehicles"("seating_capacity");
CREATE INDEX IF NOT EXISTS "automobile_vehicles_ex_showroom_price_idx" ON "automobile_vehicles"("ex_showroom_price");
CREATE INDEX IF NOT EXISTS "automobile_vehicles_manufacturer_id_model_idx" ON "automobile_vehicles"("manufacturer_id", "model");

CREATE TABLE IF NOT EXISTS "automobile_image_cache" (
    "id" UUID NOT NULL,
    "cache_key" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "provider" TEXT,
    "image_url" TEXT,
    "source_page" TEXT,
    "author" TEXT,
    "license" TEXT,
    "attribution" TEXT,
    "photo_id" TEXT,
    "query_used" TEXT,
    "confidence" DECIMAL(4,2),
    "last_verified_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "automobile_image_cache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "automobile_image_cache_cache_key_key" ON "automobile_image_cache"("cache_key");
CREATE INDEX IF NOT EXISTS "automobile_image_cache_expires_at_idx" ON "automobile_image_cache"("expires_at");
