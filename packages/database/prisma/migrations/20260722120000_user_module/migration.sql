-- User module: extended profile, preferences, activity, content subscriptions, bookmark collections

CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "language" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "timezone" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "social_links" JSONB;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_visibility" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_media_id" UUID;

CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username") WHERE "username" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "users_username_idx" ON "users"("username");

ALTER TABLE "bookmarks" ADD COLUMN IF NOT EXISTS "collection_name" TEXT;
CREATE INDEX IF NOT EXISTS "bookmarks_user_collection_idx" ON "bookmarks"("user_id", "collection_name");

CREATE TABLE IF NOT EXISTS "user_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "theme" TEXT,
    "language" TEXT,
    "timezone" TEXT,
    "notification_settings" JSONB,
    "privacy_settings" JSONB,
    "newsletter_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_preferences_user_id_key" ON "user_preferences"("user_id");

CREATE TABLE IF NOT EXISTS "user_activity" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "activity_type" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_activity_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "user_activity_user_created_idx" ON "user_activity"("user_id", "created_at");

CREATE TABLE IF NOT EXISTS "user_content_subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subscription_type" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_content_subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_content_subscriptions_user_type_target_key"
    ON "user_content_subscriptions"("user_id", "subscription_type", "target");
CREATE INDEX IF NOT EXISTS "user_content_subscriptions_user_idx" ON "user_content_subscriptions"("user_id");

ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_content_subscriptions" ADD CONSTRAINT "user_content_subscriptions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
