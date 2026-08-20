-- Contact form message storage (apply with prisma migrate or db execute)
-- Safe additive migration: creates enum + table + indexes only.

DO $$ BEGIN
  CREATE TYPE "contact_message_status" AS ENUM ('NEW', 'SENT', 'FAILED', 'SPAM', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "contact_messages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "topic" TEXT NOT NULL,
  "destination" TEXT NOT NULL DEFAULT 'general',
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "company" TEXT,
  "org_website" TEXT,
  "page_url" TEXT,
  "metadata" JSONB,
  "status" "contact_message_status" NOT NULL DEFAULT 'NEW',
  "email_error" TEXT,
  "sent_at" TIMESTAMP(3),
  "ip_hash" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "contact_messages_status_created_at_idx" ON "contact_messages"("status", "created_at");
CREATE INDEX IF NOT EXISTS "contact_messages_topic_created_at_idx" ON "contact_messages"("topic", "created_at");
CREATE INDEX IF NOT EXISTS "contact_messages_email_created_at_idx" ON "contact_messages"("email", "created_at");
