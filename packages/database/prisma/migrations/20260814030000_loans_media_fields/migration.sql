-- Media asset editorial title (image title)
ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "title" TEXT;

-- Finance category media library refs (URLs remain the public render source)
ALTER TABLE "finance_categories" ADD COLUMN IF NOT EXISTS "icon_media_id" UUID;
ALTER TABLE "finance_categories" ADD COLUMN IF NOT EXISTS "featured_image_media_id" UUID;
ALTER TABLE "finance_categories" ADD COLUMN IF NOT EXISTS "hero_image_media_id" UUID;
ALTER TABLE "finance_categories" ADD COLUMN IF NOT EXISTS "icon_alt" TEXT;
ALTER TABLE "finance_categories" ADD COLUMN IF NOT EXISTS "featured_image_alt" TEXT;
ALTER TABLE "finance_categories" ADD COLUMN IF NOT EXISTS "hero_image_alt" TEXT;

-- Lender official logo accessibility
ALTER TABLE "banks" ADD COLUMN IF NOT EXISTS "logo_alt" TEXT;

-- Article hero + OG (library attach, same pattern as featured)
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "hero_image_id" UUID;
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "og_image_id" UUID;

-- Calculator optional illustration
ALTER TABLE "calculators" ADD COLUMN IF NOT EXISTS "illustration_url" TEXT;
ALTER TABLE "calculators" ADD COLUMN IF NOT EXISTS "illustration_media_id" UUID;
ALTER TABLE "calculators" ADD COLUMN IF NOT EXISTS "illustration_alt" TEXT;

CREATE INDEX IF NOT EXISTS "articles_hero_image_id_idx" ON "articles"("hero_image_id");
CREATE INDEX IF NOT EXISTS "articles_og_image_id_idx" ON "articles"("og_image_id");
CREATE INDEX IF NOT EXISTS "calculators_illustration_media_id_idx" ON "calculators"("illustration_media_id");
CREATE INDEX IF NOT EXISTS "finance_categories_featured_image_media_id_idx" ON "finance_categories"("featured_image_media_id");
CREATE INDEX IF NOT EXISTS "banks_logo_media_id_idx" ON "banks"("logo_media_id");

DO $$ BEGIN
  ALTER TABLE "articles"
    ADD CONSTRAINT "articles_hero_image_id_fkey"
    FOREIGN KEY ("hero_image_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "articles"
    ADD CONSTRAINT "articles_og_image_id_fkey"
    FOREIGN KEY ("og_image_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
