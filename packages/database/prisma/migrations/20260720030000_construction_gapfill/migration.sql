CREATE TABLE IF NOT EXISTS "construction_checklists" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "items" JSONB NOT NULL,
    "project_type" TEXT,
    "status" "publish_status" NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    CONSTRAINT "construction_checklists_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "construction_checklists_slug_key" ON "construction_checklists"("slug");
CREATE INDEX IF NOT EXISTS "construction_checklists_status_idx" ON "construction_checklists"("status");

CREATE TABLE IF NOT EXISTS "construction_comparisons" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL DEFAULT 'materials',
    "entity_ids" JSONB NOT NULL,
    "status" "publish_status" NOT NULL DEFAULT 'PUBLISHED',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    CONSTRAINT "construction_comparisons_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "construction_comparisons_slug_key" ON "construction_comparisons"("slug");
CREATE INDEX IF NOT EXISTS "construction_comparisons_status_idx" ON "construction_comparisons"("status");
