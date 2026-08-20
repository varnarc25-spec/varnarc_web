-- Newsletter subscriber source + status tracking support
ALTER TABLE "newsletter_subscribers"
  ADD COLUMN IF NOT EXISTS "source" VARCHAR(80);
