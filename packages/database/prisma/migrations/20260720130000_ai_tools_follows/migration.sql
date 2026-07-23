CREATE TABLE IF NOT EXISTS "ai_category_follows" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_category_follows_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_category_follows_user_id_category_id_key" ON "ai_category_follows"("user_id", "category_id");
CREATE INDEX IF NOT EXISTS "ai_category_follows_user_id_created_at_idx" ON "ai_category_follows"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "ai_category_follows_category_id_idx" ON "ai_category_follows"("category_id");

ALTER TABLE "ai_category_follows" DROP CONSTRAINT IF EXISTS "ai_category_follows_user_id_fkey";
ALTER TABLE "ai_category_follows" ADD CONSTRAINT "ai_category_follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_category_follows" DROP CONSTRAINT IF EXISTS "ai_category_follows_category_id_fkey";
ALTER TABLE "ai_category_follows" ADD CONSTRAINT "ai_category_follows_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ai_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
