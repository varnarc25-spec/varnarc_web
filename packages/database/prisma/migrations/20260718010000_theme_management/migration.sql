-- Theme Management System: branding, assets, descriptions

ALTER TABLE "themes" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "themes" ADD COLUMN IF NOT EXISTS "branding" JSONB;

CREATE TABLE IF NOT EXISTS "theme_assets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "theme_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "media_id" UUID,
    "url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "theme_assets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "theme_assets_theme_id_type_key" ON "theme_assets"("theme_id", "type");
CREATE INDEX IF NOT EXISTS "theme_assets_theme_id_idx" ON "theme_assets"("theme_id");

DO $$ BEGIN
  ALTER TABLE "theme_assets" ADD CONSTRAINT "theme_assets_theme_id_fkey"
    FOREIGN KEY ("theme_id") REFERENCES "themes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "theme_assets" ADD CONSTRAINT "theme_assets_media_id_fkey"
    FOREIGN KEY ("media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
