-- Reusable construction checklist progress per project
CREATE TABLE IF NOT EXISTS "construction_project_checklist_progress" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" UUID NOT NULL,
  "checklist_id" UUID,
  "checklist_slug" TEXT NOT NULL,
  "items" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "construction_project_checklist_progress_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "construction_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "construction_project_checklist_progress_checklist_id_fkey"
    FOREIGN KEY ("checklist_id") REFERENCES "construction_checklists"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "construction_project_checklist_progress_project_id_checklist_slug_key"
  ON "construction_project_checklist_progress" ("project_id", "checklist_slug");

CREATE INDEX IF NOT EXISTS "construction_project_checklist_progress_project_id_idx"
  ON "construction_project_checklist_progress" ("project_id");

CREATE INDEX IF NOT EXISTS "construction_project_checklist_progress_checklist_slug_idx"
  ON "construction_project_checklist_progress" ("checklist_slug");
