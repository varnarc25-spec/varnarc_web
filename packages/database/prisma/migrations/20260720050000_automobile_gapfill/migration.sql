ALTER TABLE "automobile_manufacturers" ADD COLUMN IF NOT EXISTS "logo_media_id" UUID;
ALTER TABLE "automobile_vehicles" ADD COLUMN IF NOT EXISTS "brochure_media_id" UUID;

-- Normalize null variants so unique index works
UPDATE "automobile_vehicles" SET "variant" = '' WHERE "variant" IS NULL;
ALTER TABLE "automobile_vehicles" ALTER COLUMN "variant" SET DEFAULT '';
ALTER TABLE "automobile_vehicles" ALTER COLUMN "variant" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "automobile_vehicles_manufacturer_id_model_variant_key"
  ON "automobile_vehicles"("manufacturer_id", "model", "variant");

CREATE TABLE IF NOT EXISTS "automobile_vehicle_images" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "media_id" UUID,
    "image_url" TEXT,
    "alt_text" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "automobile_vehicle_images_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "automobile_vehicle_images_vehicle_id_display_order_idx"
  ON "automobile_vehicle_images"("vehicle_id", "display_order");
ALTER TABLE "automobile_vehicle_images"
  DROP CONSTRAINT IF EXISTS "automobile_vehicle_images_vehicle_id_fkey";
ALTER TABLE "automobile_vehicle_images"
  ADD CONSTRAINT "automobile_vehicle_images_vehicle_id_fkey"
  FOREIGN KEY ("vehicle_id") REFERENCES "automobile_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "automobile_vehicle_reviews" (
    "vehicle_id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    CONSTRAINT "automobile_vehicle_reviews_pkey" PRIMARY KEY ("vehicle_id","review_id")
);
ALTER TABLE "automobile_vehicle_reviews"
  DROP CONSTRAINT IF EXISTS "automobile_vehicle_reviews_vehicle_id_fkey";
ALTER TABLE "automobile_vehicle_reviews"
  ADD CONSTRAINT "automobile_vehicle_reviews_vehicle_id_fkey"
  FOREIGN KEY ("vehicle_id") REFERENCES "automobile_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "automobile_vehicle_reviews"
  DROP CONSTRAINT IF EXISTS "automobile_vehicle_reviews_review_id_fkey";
ALTER TABLE "automobile_vehicle_reviews"
  ADD CONSTRAINT "automobile_vehicle_reviews_review_id_fkey"
  FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
