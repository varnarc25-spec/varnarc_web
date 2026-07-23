CREATE TABLE IF NOT EXISTS "affiliate_leads" (
    "id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "affiliate_url" TEXT,
    "lead_type" TEXT NOT NULL DEFAULT 'interest',
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "session_id" TEXT,
    "referrer" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "affiliate_leads_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "affiliate_leads_entity_type_entity_id_idx"
  ON "affiliate_leads"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "affiliate_leads_created_at_idx"
  ON "affiliate_leads"("created_at");
