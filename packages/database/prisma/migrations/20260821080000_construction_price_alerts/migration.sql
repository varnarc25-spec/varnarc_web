-- Material price alerts: % conditions, cooldown/dedupe fields, trigger history.

ALTER TYPE "construction_alert_direction" ADD VALUE IF NOT EXISTS 'DROP_PCT';
ALTER TYPE "construction_alert_direction" ADD VALUE IF NOT EXISTS 'RISE_PCT';

ALTER TABLE "construction_price_alerts"
  ADD COLUMN IF NOT EXISTS "name" TEXT,
  ADD COLUMN IF NOT EXISTS "threshold_percent" DECIMAL(8,4),
  ADD COLUMN IF NOT EXISTS "baseline_price" DECIMAL(14,2),
  ADD COLUMN IF NOT EXISTS "cooldown_hours" INTEGER NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS "last_notified_price" DECIMAL(14,2),
  ADD COLUMN IF NOT EXISTS "last_notification_id" UUID;

ALTER TABLE "construction_price_alerts"
  ALTER COLUMN "target_price" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "construction_price_alerts_status_deleted_at_idx"
  ON "construction_price_alerts"("status", "deleted_at");

CREATE TABLE IF NOT EXISTS "construction_price_alert_triggers" (
  "id" UUID NOT NULL,
  "alert_id" UUID NOT NULL,
  "observed_price" DECIMAL(14,2) NOT NULL,
  "baseline_price" DECIMAL(14,2),
  "target_price" DECIMAL(14,2),
  "threshold_percent" DECIMAL(8,4),
  "change_percent" DECIMAL(10,4),
  "direction" "construction_alert_direction" NOT NULL,
  "currency" CHAR(3) NOT NULL DEFAULT 'INR',
  "price_observation_id" UUID,
  "notification_id" UUID,
  "suppressed" BOOLEAN NOT NULL DEFAULT false,
  "suppress_reason" TEXT,
  "notes" TEXT,
  "metadata" JSONB,
  "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "construction_price_alert_triggers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "construction_price_alert_triggers_alert_id_triggered_at_idx"
  ON "construction_price_alert_triggers"("alert_id", "triggered_at");
CREATE INDEX IF NOT EXISTS "construction_price_alert_triggers_triggered_at_idx"
  ON "construction_price_alert_triggers"("triggered_at");

ALTER TABLE "construction_price_alert_triggers"
  DROP CONSTRAINT IF EXISTS "construction_price_alert_triggers_alert_id_fkey";
ALTER TABLE "construction_price_alert_triggers"
  ADD CONSTRAINT "construction_price_alert_triggers_alert_id_fkey"
  FOREIGN KEY ("alert_id") REFERENCES "construction_price_alerts"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
