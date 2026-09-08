-- CreateEnum
CREATE TYPE "construction_commercial_rule_kind" AS ENUM ('TAX', 'OVERHEAD', 'PROFIT', 'CONTINGENCY', 'ESCALATION');

-- CreateEnum
CREATE TYPE "construction_rate_review_status" AS ENUM ('OPEN', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'DEFERRED');

-- CreateEnum
CREATE TYPE "construction_quotation_status" AS ENUM ('DRAFT', 'RECEIVED', 'COMPARED', 'SELECTED', 'REJECTED', 'ARCHIVED');

-- AlterTable
CREATE UNIQUE INDEX "cwir_item_type_key_unique" ON "construction_work_item_resources"("work_item_id", "resource_type", "resource_key");

-- CreateTable
CREATE TABLE "construction_commercial_rules" (
    "id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "kind" "construction_commercial_rule_kind" NOT NULL,
    "percent" DECIMAL(8,4),
    "index_factor" DECIMAL(10,6),
    "source_type" "construction_rate_source_type" NOT NULL DEFAULT 'ESTIMATED_FALLBACK',
    "confidence" "construction_rate_confidence" NOT NULL DEFAULT 'LOW',
    "notes" TEXT,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "construction_commercial_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construction_rate_reviews" (
    "id" UUID NOT NULL,
    "resource_type" "construction_resource_type" NOT NULL,
    "resource_key" TEXT NOT NULL,
    "location_id" UUID,
    "status" "construction_rate_review_status" NOT NULL DEFAULT 'OPEN',
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "construction_rate_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construction_supplier_quotations" (
    "id" UUID NOT NULL,
    "supplier_name" TEXT NOT NULL,
    "location_id" UUID,
    "resource_type" "construction_resource_type" NOT NULL,
    "resource_key" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quoted_rate" DECIMAL(14,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "quoted_at" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3),
    "status" "construction_quotation_status" NOT NULL DEFAULT 'RECEIVED',
    "source_type" "construction_rate_source_type" NOT NULL DEFAULT 'MARKET_SURVEY',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "construction_supplier_quotations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "construction_commercial_rules_location_id_kind_key" ON "construction_commercial_rules"("location_id", "kind");

-- CreateIndex
CREATE INDEX "construction_rate_reviews_status_created_at_idx" ON "construction_rate_reviews"("status", "created_at");

-- CreateIndex
CREATE INDEX "construction_supplier_quotations_status_quoted_at_idx" ON "construction_supplier_quotations"("status", "quoted_at");

-- AddForeignKey
ALTER TABLE "construction_commercial_rules" ADD CONSTRAINT "construction_commercial_rules_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "construction_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construction_rate_reviews" ADD CONSTRAINT "construction_rate_reviews_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "construction_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construction_supplier_quotations" ADD CONSTRAINT "construction_supplier_quotations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "construction_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
