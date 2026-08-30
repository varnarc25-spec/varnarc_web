-- Construction Search Opportunity dashboard (privacy-safe aggregates)
CREATE TYPE "construction_search_opportunity_status" AS ENUM (
  'OPEN',
  'PLANNED',
  'IMPLEMENTED',
  'IGNORED'
);

CREATE TABLE "construction_search_events" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "query_hash" VARCHAR(64) NOT NULL,
  "display_query" VARCHAR(160) NOT NULL,
  "surface" VARCHAR(40) NOT NULL,
  "intent" VARCHAR(40) NOT NULL,
  "result_count" INTEGER NOT NULL,
  "clicked" BOOLEAN NOT NULL DEFAULT false,
  "path_prefix" VARCHAR(120),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "construction_search_events_query_hash_created_at_idx"
  ON "construction_search_events" ("query_hash", "created_at");
CREATE INDEX "construction_search_events_created_at_idx"
  ON "construction_search_events" ("created_at");
CREATE INDEX "construction_search_events_surface_created_at_idx"
  ON "construction_search_events" ("surface", "created_at");
CREATE INDEX "construction_search_events_intent_created_at_idx"
  ON "construction_search_events" ("intent", "created_at");
CREATE INDEX "construction_search_events_result_count_created_at_idx"
  ON "construction_search_events" ("result_count", "created_at");

CREATE TABLE "construction_search_opportunities" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "query_hash" VARCHAR(64) NOT NULL,
  "display_query" VARCHAR(160) NOT NULL,
  "intent" VARCHAR(40) NOT NULL,
  "opportunity_type" VARCHAR(60) NOT NULL,
  "search_count" INTEGER NOT NULL DEFAULT 0,
  "zero_result_count" INTEGER NOT NULL DEFAULT 0,
  "click_count" INTEGER NOT NULL DEFAULT 0,
  "avg_result_count" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "zero_result_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "window_days" INTEGER NOT NULL DEFAULT 30,
  "status" "construction_search_opportunity_status" NOT NULL DEFAULT 'OPEN',
  "notes" TEXT,
  "evidence" JSONB,
  "first_seen_at" TIMESTAMP(3) NOT NULL,
  "last_seen_at" TIMESTAMP(3) NOT NULL,
  "status_updated_at" TIMESTAMP(3),
  "status_updated_by" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "construction_search_opportunities_query_hash_window_days_key"
  ON "construction_search_opportunities" ("query_hash", "window_days");
CREATE INDEX "construction_search_opportunities_status_search_count_idx"
  ON "construction_search_opportunities" ("status", "search_count");
CREATE INDEX "construction_search_opportunities_opportunity_type_search_count_idx"
  ON "construction_search_opportunities" ("opportunity_type", "search_count");
CREATE INDEX "construction_search_opportunities_intent_search_count_idx"
  ON "construction_search_opportunities" ("intent", "search_count");
CREATE INDEX "construction_search_opportunities_last_seen_at_idx"
  ON "construction_search_opportunities" ("last_seen_at");
