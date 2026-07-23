-- Auth0 RBAC structure (safe for empty/dev seed data)

DELETE FROM "role_permissions";
DELETE FROM "user_roles";
DELETE FROM "permissions";
DELETE FROM "roles";
DELETE FROM "audit_logs";
DELETE FROM "users";

-- Rename auth0_sub -> auth0_user_id if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'auth0_sub'
  ) THEN
    ALTER TABLE "users" RENAME COLUMN "auth0_sub" TO "auth0_user_id";
  END IF;
END $$;

-- Expand users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "first_name" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_name" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "display_name" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMP(3);

-- Drop old name column if exists (replaced by first/last/display)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'name'
  ) THEN
    UPDATE "users" SET "display_name" = COALESCE("display_name", "name");
    ALTER TABLE "users" DROP COLUMN "name";
  END IF;
END $$;

-- User status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE "user_status" AS ENUM ('ACTIVE', 'DISABLED', 'PENDING', 'DELETED');
  END IF;
END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" "user_status" NOT NULL DEFAULT 'ACTIVE';

-- Roles description
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Permissions module + description
ALTER TABLE "permissions" ADD COLUMN IF NOT EXISTS "module" TEXT;
UPDATE "permissions" SET "module" = 'general' WHERE "module" IS NULL;
ALTER TABLE "permissions" ALTER COLUMN "module" SET NOT NULL;
ALTER TABLE "permissions" ADD COLUMN IF NOT EXISTS "description" TEXT;
CREATE INDEX IF NOT EXISTS "permissions_module_idx" ON "permissions"("module");

-- Login history
CREATE TABLE IF NOT EXISTS "login_history" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "ip_address" TEXT,
  "device" TEXT,
  "browser" TEXT,
  "operating_system" TEXT,
  "country" TEXT,
  "login_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "login_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "login_history_user_id_login_time_idx" ON "login_history"("user_id", "login_time");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'login_history_user_id_fkey'
  ) THEN
    ALTER TABLE "login_history"
      ADD CONSTRAINT "login_history_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Rebuild audit_logs to match Auth0 doc shape
DROP TABLE IF EXISTS "audit_logs";
CREATE TABLE "audit_logs" (
  "id" UUID NOT NULL,
  "user_id" UUID,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entity_id" TEXT,
  "old_value" JSONB,
  "new_value" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
