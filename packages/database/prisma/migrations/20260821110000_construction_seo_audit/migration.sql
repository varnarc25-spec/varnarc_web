-- Construction SEO Audit Dashboard (internal admin)
CREATE TYPE "construction_seo_audit_run_status" AS ENUM (
  'QUEUED',
  'RUNNING_FAST',
  'RUNNING_DEFERRED',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE "construction_seo_audit_severity" AS ENUM (
  'INFO',
  'WARNING',
  'CRITICAL'
);

CREATE TYPE "construction_seo_audit_issue_status" AS ENUM (
  'OPEN',
  'RESOLVED',
  'IGNORED'
);

CREATE TABLE "construction_seo_audit_runs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "status" "construction_seo_audit_run_status" NOT NULL DEFAULT 'QUEUED',
  "mode" VARCHAR(20) NOT NULL DEFAULT 'FULL',
  "site_url" VARCHAR(255) NOT NULL,
  "triggered_by" UUID,
  "summary" JSONB,
  "error" TEXT,
  "started_at" TIMESTAMP(3),
  "finished_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "construction_seo_audit_runs_status_created_at_idx"
  ON "construction_seo_audit_runs" ("status", "created_at");
CREATE INDEX "construction_seo_audit_runs_created_at_idx"
  ON "construction_seo_audit_runs" ("created_at");

CREATE TABLE "construction_seo_audit_issues" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "run_id" UUID NOT NULL,
  "path" VARCHAR(500) NOT NULL,
  "page_type" VARCHAR(40) NOT NULL,
  "issue_type" VARCHAR(80) NOT NULL,
  "severity" "construction_seo_audit_severity" NOT NULL DEFAULT 'WARNING',
  "status" "construction_seo_audit_issue_status" NOT NULL DEFAULT 'OPEN',
  "message" TEXT NOT NULL,
  "recommended_action" TEXT NOT NULL,
  "evidence" JSONB,
  "http_status" INTEGER,
  "lcp" DOUBLE PRECISION,
  "cls" DOUBLE PRECISION,
  "inp" DOUBLE PRECISION,
  "resolved_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "construction_seo_audit_issues_run_id_fkey"
    FOREIGN KEY ("run_id") REFERENCES "construction_seo_audit_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "construction_seo_audit_issues_run_id_severity_idx"
  ON "construction_seo_audit_issues" ("run_id", "severity");
CREATE INDEX "construction_seo_audit_issues_run_id_issue_type_idx"
  ON "construction_seo_audit_issues" ("run_id", "issue_type");
CREATE INDEX "construction_seo_audit_issues_run_id_page_type_idx"
  ON "construction_seo_audit_issues" ("run_id", "page_type");
CREATE INDEX "construction_seo_audit_issues_run_id_status_idx"
  ON "construction_seo_audit_issues" ("run_id", "status");
CREATE INDEX "construction_seo_audit_issues_path_idx"
  ON "construction_seo_audit_issues" ("path");
