-- Construction document vault: expand kinds + private storage metadata + entity links

ALTER TYPE "construction_document_kind" ADD VALUE IF NOT EXISTS 'FLOOR_PLAN';
ALTER TYPE "construction_document_kind" ADD VALUE IF NOT EXISTS 'STRUCTURAL';
ALTER TYPE "construction_document_kind" ADD VALUE IF NOT EXISTS 'BOQ';
ALTER TYPE "construction_document_kind" ADD VALUE IF NOT EXISTS 'RECEIPT';
ALTER TYPE "construction_document_kind" ADD VALUE IF NOT EXISTS 'APPROVAL';
ALTER TYPE "construction_document_kind" ADD VALUE IF NOT EXISTS 'WARRANTY';
ALTER TYPE "construction_document_kind" ADD VALUE IF NOT EXISTS 'MATERIAL_BILL';

ALTER TABLE "construction_documents" ADD COLUMN IF NOT EXISTS "storage_key" TEXT;
ALTER TABLE "construction_documents" ADD COLUMN IF NOT EXISTS "original_filename" TEXT;
ALTER TABLE "construction_documents" ADD COLUMN IF NOT EXISTS "mime_type" TEXT;
ALTER TABLE "construction_documents" ADD COLUMN IF NOT EXISTS "size_bytes" INTEGER;
ALTER TABLE "construction_documents" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
ALTER TABLE "construction_documents" ADD COLUMN IF NOT EXISTS "boq_id" UUID;
ALTER TABLE "construction_documents" ADD COLUMN IF NOT EXISTS "expense_id" UUID;
ALTER TABLE "construction_documents" ADD COLUMN IF NOT EXISTS "phase_id" UUID;
ALTER TABLE "construction_documents" ADD COLUMN IF NOT EXISTS "quote_document_id" UUID;

CREATE INDEX IF NOT EXISTS "construction_documents_boq_id_idx" ON "construction_documents"("boq_id");
CREATE INDEX IF NOT EXISTS "construction_documents_expense_id_idx" ON "construction_documents"("expense_id");
CREATE INDEX IF NOT EXISTS "construction_documents_phase_id_idx" ON "construction_documents"("phase_id");
CREATE INDEX IF NOT EXISTS "construction_documents_quote_document_id_idx" ON "construction_documents"("quote_document_id");

DO $$ BEGIN
  ALTER TABLE "construction_documents"
    ADD CONSTRAINT "construction_documents_boq_id_fkey"
    FOREIGN KEY ("boq_id") REFERENCES "construction_boqs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "construction_documents"
    ADD CONSTRAINT "construction_documents_expense_id_fkey"
    FOREIGN KEY ("expense_id") REFERENCES "construction_expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "construction_documents"
    ADD CONSTRAINT "construction_documents_phase_id_fkey"
    FOREIGN KEY ("phase_id") REFERENCES "construction_project_phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "construction_documents"
    ADD CONSTRAINT "construction_documents_quote_document_id_fkey"
    FOREIGN KEY ("quote_document_id") REFERENCES "construction_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
