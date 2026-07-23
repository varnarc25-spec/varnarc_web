-- Media Library expansion: metadata fields, folder paths, collections, usage tracking

ALTER TABLE "media_folders" ADD COLUMN IF NOT EXISTS "path" TEXT;

ALTER TABLE "media_albums" ADD COLUMN IF NOT EXISTS "description" TEXT;

ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "original_name" TEXT;
ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "file_name" TEXT;
ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "mime_type" TEXT;
ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "duration" INTEGER;
ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "thumbnail_url" TEXT;
ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "caption" TEXT;
ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "description" TEXT;

CREATE TABLE IF NOT EXISTS "media_usage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "asset_id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "field_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_usage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "media_usage_asset_id_entity_type_entity_id_field_name_key"
ON "media_usage"("asset_id", "entity_type", "entity_id", "field_name");

CREATE INDEX IF NOT EXISTS "media_usage_asset_id_idx" ON "media_usage"("asset_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'media_usage_asset_id_fkey'
  ) THEN
    ALTER TABLE "media_usage"
    ADD CONSTRAINT "media_usage_asset_id_fkey"
    FOREIGN KEY ("asset_id") REFERENCES "media_assets"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
