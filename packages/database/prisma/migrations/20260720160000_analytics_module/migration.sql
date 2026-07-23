-- Analytics module: events, aggregates, traffic, system metrics, affiliates, saved reports

CREATE TABLE IF NOT EXISTS "analytics_events" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "session_id" UUID,
    "event_type" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" UUID,
    "path" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "analytics_events_event_type_created_at_idx" ON "analytics_events"("event_type", "created_at");
CREATE INDEX IF NOT EXISTS "analytics_events_entity_type_entity_id_idx" ON "analytics_events"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "analytics_events_session_id_created_at_idx" ON "analytics_events"("session_id", "created_at");
CREATE INDEX IF NOT EXISTS "analytics_events_user_id_created_at_idx" ON "analytics_events"("user_id", "created_at");

ALTER TABLE "analytics_events" DROP CONSTRAINT IF EXISTS "analytics_events_session_id_fkey";
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "analytics_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "analytics_aggregates" (
    "id" UUID NOT NULL,
    "entity_type" TEXT,
    "entity_id" UUID,
    "metric_name" TEXT NOT NULL,
    "metric_value" DOUBLE PRECISION NOT NULL,
    "period" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "analytics_aggregates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "analytics_aggregates_metric_period_entity_key"
  ON "analytics_aggregates"("metric_name", "period", "period_start", COALESCE("entity_type", ''), COALESCE("entity_id"::text, ''));
CREATE INDEX IF NOT EXISTS "analytics_aggregates_period_period_start_idx" ON "analytics_aggregates"("period", "period_start");
CREATE INDEX IF NOT EXISTS "analytics_aggregates_metric_name_period_start_idx" ON "analytics_aggregates"("metric_name", "period_start");

CREATE TABLE IF NOT EXISTS "traffic_sources" (
    "id" UUID NOT NULL,
    "session_id" UUID,
    "source" TEXT,
    "medium" TEXT,
    "campaign" TEXT,
    "referrer" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "traffic_sources_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "traffic_sources_source_created_at_idx" ON "traffic_sources"("source", "created_at");
CREATE INDEX IF NOT EXISTS "traffic_sources_campaign_created_at_idx" ON "traffic_sources"("campaign", "created_at");

ALTER TABLE "traffic_sources" DROP CONSTRAINT IF EXISTS "traffic_sources_session_id_fkey";
ALTER TABLE "traffic_sources" ADD CONSTRAINT "traffic_sources_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "analytics_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "system_metrics" (
    "id" UUID NOT NULL,
    "metric_name" TEXT NOT NULL,
    "metric_value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "system_metrics_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "system_metrics_metric_name_recorded_at_idx" ON "system_metrics"("metric_name", "recorded_at");

CREATE TABLE IF NOT EXISTS "affiliate_conversions" (
    "id" UUID NOT NULL,
    "partner" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" UUID,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "affiliate_conversions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "affiliate_conversions_partner_idx" ON "affiliate_conversions"("partner");
CREATE INDEX IF NOT EXISTS "affiliate_conversions_entity_type_entity_id_idx" ON "affiliate_conversions"("entity_type", "entity_id");

CREATE TABLE IF NOT EXISTS "analytics_saved_reports" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "filters" JSONB,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "analytics_saved_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "analytics_saved_reports_created_by_idx" ON "analytics_saved_reports"("created_by");
