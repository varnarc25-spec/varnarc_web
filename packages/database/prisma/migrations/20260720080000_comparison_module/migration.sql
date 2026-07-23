CREATE TABLE IF NOT EXISTS "comparison_templates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "description" TEXT,
    "attributes" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    CONSTRAINT "comparison_templates_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "comparison_templates_entity_type_idx" ON "comparison_templates"("entity_type");

ALTER TABLE "comparisons" ADD COLUMN IF NOT EXISTS "template_id" UUID;
ALTER TABLE "comparisons" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "comparisons" ADD COLUMN IF NOT EXISTS "comparison_type" TEXT;
ALTER TABLE "comparisons" ADD COLUMN IF NOT EXISTS "entity_type" TEXT;
ALTER TABLE "comparisons" ADD COLUMN IF NOT EXISTS "recommendation" TEXT;
ALTER TABLE "comparisons" ADD COLUMN IF NOT EXISTS "winner_entity_type" TEXT;
ALTER TABLE "comparisons" ADD COLUMN IF NOT EXISTS "winner_entity_id" UUID;
ALTER TABLE "comparisons" ADD COLUMN IF NOT EXISTS "seo_title" TEXT;
ALTER TABLE "comparisons" ADD COLUMN IF NOT EXISTS "seo_description" TEXT;
ALTER TABLE "comparisons" ADD COLUMN IF NOT EXISTS "view_count" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "comparisons_entity_type_idx" ON "comparisons"("entity_type");
CREATE INDEX IF NOT EXISTS "comparisons_comparison_type_idx" ON "comparisons"("comparison_type");

ALTER TABLE "comparisons"
  DROP CONSTRAINT IF EXISTS "comparisons_template_id_fkey";
ALTER TABLE "comparisons"
  ADD CONSTRAINT "comparisons_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "comparison_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "comparison_items" ADD COLUMN IF NOT EXISTS "entity_type" TEXT;
ALTER TABLE "comparison_items" ADD COLUMN IF NOT EXISTS "entity_id" UUID;
ALTER TABLE "comparison_items" ADD COLUMN IF NOT EXISTS "label" TEXT;
CREATE INDEX IF NOT EXISTS "comparison_items_entity_type_entity_id_idx" ON "comparison_items"("entity_type", "entity_id");

ALTER TABLE "comparison_attributes" ADD COLUMN IF NOT EXISTS "value_type" TEXT NOT NULL DEFAULT 'text';
ALTER TABLE "comparison_attributes" ADD COLUMN IF NOT EXISTS "group_key" TEXT;

CREATE TABLE IF NOT EXISTS "comparison_values" (
    "id" UUID NOT NULL,
    "comparison_item_id" UUID NOT NULL,
    "comparison_attribute_id" UUID NOT NULL,
    "value" JSONB NOT NULL,
    "highlight" TEXT,
    CONSTRAINT "comparison_values_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "comparison_values_comparison_item_id_comparison_attribute_id_key"
  ON "comparison_values"("comparison_item_id", "comparison_attribute_id");
ALTER TABLE "comparison_values"
  DROP CONSTRAINT IF EXISTS "comparison_values_comparison_item_id_fkey";
ALTER TABLE "comparison_values"
  ADD CONSTRAINT "comparison_values_comparison_item_id_fkey"
  FOREIGN KEY ("comparison_item_id") REFERENCES "comparison_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comparison_values"
  DROP CONSTRAINT IF EXISTS "comparison_values_comparison_attribute_id_fkey";
ALTER TABLE "comparison_values"
  ADD CONSTRAINT "comparison_values_comparison_attribute_id_fkey"
  FOREIGN KEY ("comparison_attribute_id") REFERENCES "comparison_attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
