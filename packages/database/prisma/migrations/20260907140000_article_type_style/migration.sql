-- AlterEnum
CREATE TYPE "article_type" AS ENUM (
  'GENERAL',
  'GUIDE',
  'CALCULATOR_GUIDE',
  'COMPARISON',
  'HOW_TO',
  'RATES',
  'ELIGIBILITY',
  'NEWS'
);

-- AlterTable
ALTER TABLE "articles"
  ADD COLUMN "article_type" "article_type" NOT NULL DEFAULT 'GENERAL',
  ADD COLUMN "article_style" VARCHAR(80) NOT NULL DEFAULT 'default',
  ADD COLUMN "custom_css_class" VARCHAR(80);
