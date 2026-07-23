-- Theme management: scheduling, marketplace, white-label, system baseline

ALTER TABLE "themes"
  ADD COLUMN IF NOT EXISTS "is_system" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "tenant_key" TEXT,
  ADD COLUMN IF NOT EXISTS "season" TEXT,
  ADD COLUMN IF NOT EXISTS "scheduled_from" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "scheduled_until" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "marketplace_listed" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "themes_tenant_key_idx" ON "themes"("tenant_key");
CREATE INDEX IF NOT EXISTS "themes_marketplace_listed_idx" ON "themes"("marketplace_listed");
CREATE INDEX IF NOT EXISTS "themes_scheduled_from_scheduled_until_idx" ON "themes"("scheduled_from", "scheduled_until");
