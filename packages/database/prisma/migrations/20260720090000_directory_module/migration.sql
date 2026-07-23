DO $$ BEGIN
  CREATE TYPE "listing_type" AS ENUM ('FREE', 'VERIFIED', 'FEATURED', 'SPONSORED', 'PREMIUM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "verification_status" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "lead_status" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "directory_event_type" AS ENUM (
    'VIEW', 'PROFILE_CLICK', 'WEBSITE_CLICK', 'PHONE_CLICK',
    'WHATSAPP_CLICK', 'EMAIL_CLICK', 'LEAD_REQUEST', 'SEARCH'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "business_categories" ADD COLUMN IF NOT EXISTS "icon" TEXT;
ALTER TABLE "business_categories" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "business_categories" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "business_categories_parent_id_idx" ON "business_categories"("parent_id");

ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "contact_person" TEXT;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "social_links" JSONB;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "logo_url" TEXT;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "cover_image_url" TEXT;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "listing_type" "listing_type" NOT NULL DEFAULT 'FREE';
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "verification_status" "verification_status" NOT NULL DEFAULT 'UNVERIFIED';
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "sponsored" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "seo_title" TEXT;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "seo_description" TEXT;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "view_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "businesses_featured_sponsored_idx" ON "businesses"("featured", "sponsored");
CREATE INDEX IF NOT EXISTS "businesses_verification_status_idx" ON "businesses"("verification_status");
CREATE INDEX IF NOT EXISTS "businesses_listing_type_idx" ON "businesses"("listing_type");

ALTER TABLE "business_locations" ADD COLUMN IF NOT EXISTS "district" TEXT;
ALTER TABLE "business_locations" ADD COLUMN IF NOT EXISTS "locality" TEXT;
ALTER TABLE "business_locations" ADD COLUMN IF NOT EXISTS "google_maps_url" TEXT;
CREATE INDEX IF NOT EXISTS "business_locations_state_city_idx" ON "business_locations"("state", "city");
CREATE INDEX IF NOT EXISTS "business_locations_latitude_longitude_idx" ON "business_locations"("latitude", "longitude");

CREATE TABLE IF NOT EXISTS "business_products" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "business_products_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "business_products_business_id_idx" ON "business_products"("business_id");
ALTER TABLE "business_products" DROP CONSTRAINT IF EXISTS "business_products_business_id_fkey";
ALTER TABLE "business_products"
  ADD CONSTRAINT "business_products_business_id_fkey"
  FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "business_media" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "media_id" UUID,
    "url" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'gallery',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "business_media_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "business_media_business_id_kind_idx" ON "business_media"("business_id", "kind");
ALTER TABLE "business_media" DROP CONSTRAINT IF EXISTS "business_media_business_id_fkey";
ALTER TABLE "business_media"
  ADD CONSTRAINT "business_media_business_id_fkey"
  FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "business_hours" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "day" INTEGER NOT NULL,
    "open_time" TEXT,
    "close_time" TEXT,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "business_hours_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "business_hours_business_id_day_key" ON "business_hours"("business_id", "day");
CREATE INDEX IF NOT EXISTS "business_hours_business_id_idx" ON "business_hours"("business_id");
ALTER TABLE "business_hours" DROP CONSTRAINT IF EXISTS "business_hours_business_id_fkey";
ALTER TABLE "business_hours"
  ADD CONSTRAINT "business_hours_business_id_fkey"
  FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "lead_requests" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "user_id" UUID,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "message" TEXT,
    "lead_type" TEXT NOT NULL DEFAULT 'contact',
    "status" "lead_status" NOT NULL DEFAULT 'NEW',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "lead_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "lead_requests_business_id_status_idx" ON "lead_requests"("business_id", "status");
CREATE INDEX IF NOT EXISTS "lead_requests_status_created_at_idx" ON "lead_requests"("status", "created_at");
ALTER TABLE "lead_requests" DROP CONSTRAINT IF EXISTS "lead_requests_business_id_fkey";
ALTER TABLE "lead_requests"
  ADD CONSTRAINT "lead_requests_business_id_fkey"
  FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_requests" DROP CONSTRAINT IF EXISTS "lead_requests_user_id_fkey";
ALTER TABLE "lead_requests"
  ADD CONSTRAINT "lead_requests_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "directory_events" (
    "id" UUID NOT NULL,
    "business_id" UUID,
    "event_type" "directory_event_type" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "directory_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "directory_events_event_type_created_at_idx" ON "directory_events"("event_type", "created_at");
CREATE INDEX IF NOT EXISTS "directory_events_business_id_event_type_idx" ON "directory_events"("business_id", "event_type");
ALTER TABLE "directory_events" DROP CONSTRAINT IF EXISTS "directory_events_business_id_fkey";
ALTER TABLE "directory_events"
  ADD CONSTRAINT "directory_events_business_id_fkey"
  FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
