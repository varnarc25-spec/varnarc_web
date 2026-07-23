-- CreateEnum
CREATE TYPE "ai_pricing_model" AS ENUM ('FREE', 'FREEMIUM', 'SUBSCRIPTION', 'PAY_AS_YOU_GO', 'ENTERPRISE', 'LIFETIME');

-- CreateEnum
CREATE TYPE "ai_tool_event_type" AS ENUM ('VIEW', 'OUTBOUND_CLICK', 'AFFILIATE_CLICK', 'BOOKMARK', 'SEARCH', 'COMPARE');

-- CreateTable
CREATE TABLE "ai_categories" (
    "id" UUID NOT NULL,
    "parent_id" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ai_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_tools" (
    "id" UUID NOT NULL,
    "category_id" UUID,
    "company_id" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "short_description" TEXT,
    "logo_url" TEXT,
    "cover_image_url" TEXT,
    "pricing_model" "ai_pricing_model" NOT NULL DEFAULT 'FREEMIUM',
    "pricing_details" TEXT,
    "monthly_price" TEXT,
    "annual_price" TEXT,
    "free_plan" BOOLEAN NOT NULL DEFAULT false,
    "free_trial" BOOLEAN NOT NULL DEFAULT false,
    "api_available" BOOLEAN NOT NULL DEFAULT false,
    "website" TEXT,
    "documentation" TEXT,
    "affiliate_url" TEXT,
    "platforms" JSONB,
    "languages" JSONB,
    "faqs" JSONB,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sponsored" BOOLEAN NOT NULL DEFAULT false,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "status" "publish_status" NOT NULL DEFAULT 'DRAFT',
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "bookmark_count" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "ai_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_features" (
    "id" UUID NOT NULL,
    "tool_id" UUID NOT NULL,
    "feature_name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ai_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_integrations" (
    "id" UUID NOT NULL,
    "tool_id" UUID NOT NULL,
    "integration_name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ai_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_screenshots" (
    "id" UUID NOT NULL,
    "tool_id" UUID NOT NULL,
    "media_id" UUID,
    "url" TEXT,
    "caption" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tool_screenshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_bookmarks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tool_id" UUID NOT NULL,
    "collection_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "user_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_tool_recently_viewed" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tool_id" UUID NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_tool_recently_viewed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_tool_events" (
    "id" UUID NOT NULL,
    "tool_id" UUID,
    "event_type" "ai_tool_event_type" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_tool_events_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "ai_categories_slug_key" ON "ai_categories"("slug");
CREATE INDEX "ai_categories_parent_id_idx" ON "ai_categories"("parent_id");

CREATE UNIQUE INDEX "ai_tools_slug_key" ON "ai_tools"("slug");
CREATE INDEX "ai_tools_status_slug_idx" ON "ai_tools"("status", "slug");
CREATE INDEX "ai_tools_featured_sponsored_idx" ON "ai_tools"("featured", "sponsored");
CREATE INDEX "ai_tools_pricing_model_idx" ON "ai_tools"("pricing_model");
CREATE INDEX "ai_tools_category_id_idx" ON "ai_tools"("category_id");
CREATE INDEX "ai_tools_company_id_idx" ON "ai_tools"("company_id");

CREATE UNIQUE INDEX "ai_features_tool_id_feature_name_key" ON "ai_features"("tool_id", "feature_name");
CREATE INDEX "ai_features_tool_id_idx" ON "ai_features"("tool_id");

CREATE UNIQUE INDEX "ai_integrations_tool_id_integration_name_key" ON "ai_integrations"("tool_id", "integration_name");
CREATE INDEX "ai_integrations_tool_id_idx" ON "ai_integrations"("tool_id");

CREATE INDEX "tool_screenshots_tool_id_sort_order_idx" ON "tool_screenshots"("tool_id", "sort_order");

CREATE UNIQUE INDEX "user_bookmarks_user_id_tool_id_key" ON "user_bookmarks"("user_id", "tool_id");
CREATE INDEX "user_bookmarks_user_id_collection_name_idx" ON "user_bookmarks"("user_id", "collection_name");
CREATE INDEX "user_bookmarks_tool_id_idx" ON "user_bookmarks"("tool_id");

CREATE UNIQUE INDEX "ai_tool_recently_viewed_user_id_tool_id_key" ON "ai_tool_recently_viewed"("user_id", "tool_id");
CREATE INDEX "ai_tool_recently_viewed_user_id_viewed_at_idx" ON "ai_tool_recently_viewed"("user_id", "viewed_at");

CREATE INDEX "ai_tool_events_tool_id_event_type_created_at_idx" ON "ai_tool_events"("tool_id", "event_type", "created_at");
CREATE INDEX "ai_tool_events_event_type_created_at_idx" ON "ai_tool_events"("event_type", "created_at");

-- FKs
ALTER TABLE "ai_categories" ADD CONSTRAINT "ai_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "ai_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_tools" ADD CONSTRAINT "ai_tools_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ai_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_tools" ADD CONSTRAINT "ai_tools_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_features" ADD CONSTRAINT "ai_features_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "ai_tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_integrations" ADD CONSTRAINT "ai_integrations_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "ai_tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tool_screenshots" ADD CONSTRAINT "tool_screenshots_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "ai_tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_bookmarks" ADD CONSTRAINT "user_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_bookmarks" ADD CONSTRAINT "user_bookmarks_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "ai_tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_tool_recently_viewed" ADD CONSTRAINT "ai_tool_recently_viewed_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_tool_recently_viewed" ADD CONSTRAINT "ai_tool_recently_viewed_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "ai_tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_tool_events" ADD CONSTRAINT "ai_tool_events_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "ai_tools"("id") ON DELETE SET NULL ON UPDATE CASCADE;
