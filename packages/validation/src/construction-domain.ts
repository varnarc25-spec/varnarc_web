import { z } from 'zod';
import { jsonValueSchema, uuidSchema } from './common';

/** Default construction currency — India-first platform. */
export const CONSTRUCTION_DEFAULT_CURRENCY = 'INR' as const;

export const CONSTRUCTION_UNITS = [
  'nos',
  'bag',
  'kg',
  'tonne',
  'm',
  'm2',
  'm3',
  'ft',
  'ft2',
  'ft3',
  'liter',
  'brass',
  'cum',
  'cft',
  'sqft',
  'sqm',
  'day',
  'hour',
  'lump_sum',
] as const;

export type ConstructionUnit = (typeof CONSTRUCTION_UNITS)[number];

export const CONSTRUCTION_PROJECT_STATUSES = [
  'DRAFT',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'ARCHIVED',
] as const;

export const CONSTRUCTION_LOCATION_TYPES = ['COUNTRY', 'STATE', 'CITY', 'LOCALITY'] as const;

export const CONSTRUCTION_PRICE_FRESHNESS = ['LIVE', 'VERIFIED', 'ESTIMATED', 'STALE'] as const;

export const CONSTRUCTION_BOQ_STATUSES = ['DRAFT', 'ACTIVE', 'FINALIZED', 'ARCHIVED'] as const;

export const CONSTRUCTION_PHASE_STATUSES = [
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'SKIPPED',
] as const;

export const CONSTRUCTION_DOCUMENT_KINDS = [
  'DRAWING',
  'PERMIT',
  'QUOTE',
  'INVOICE',
  'PHOTO',
  'CONTRACT',
  'OTHER',
  'FLOOR_PLAN',
  'STRUCTURAL',
  'BOQ',
  'RECEIPT',
  'APPROVAL',
  'WARRANTY',
  'MATERIAL_BILL',
] as const;

export const CONSTRUCTION_ALERT_STATUSES = ['ACTIVE', 'TRIGGERED', 'PAUSED', 'CANCELLED'] as const;

export const CONSTRUCTION_ALERT_DIRECTIONS = ['BELOW', 'ABOVE', 'DROP_PCT', 'RISE_PCT'] as const;

export const CONSTRUCTION_WORK_TYPES = [
  'builtup_basic',
  'builtup_standard',
  'builtup_premium',
  'labor_mason',
  'labor_helper',
  'labor_carpenter',
  'labor_electrician',
  'labor_plumber',
  'excavation',
  'concrete_m20',
  'concrete_m25',
  'plaster',
  'painting',
  'tiling',
  'steel_binding',
] as const;

export const constructionCurrencySchema = z
  .string()
  .length(3)
  .transform((v) => v.toUpperCase())
  .default(CONSTRUCTION_DEFAULT_CURRENCY);

export const constructionUnitSchema = z
  .string()
  .min(1)
  .max(40)
  .refine((v) => CONSTRUCTION_UNITS.includes(v as ConstructionUnit) || v.length > 0, {
    message: 'Invalid unit',
  });

export const moneyAmountSchema = z
  .number()
  .finite()
  .nonnegative()
  .max(999_999_999_999.99)
  .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, {
    message: 'Amount must have at most 2 decimal places',
  });

export const quantitySchema = z.number().finite().positive().max(999_999_999.9999);

export const constructionProjectStatusSchema = z.enum(CONSTRUCTION_PROJECT_STATUSES);
export const constructionLocationTypeSchema = z.enum(CONSTRUCTION_LOCATION_TYPES);
export const constructionPriceFreshnessSchema = z.enum(CONSTRUCTION_PRICE_FRESHNESS);
export const constructionBoqStatusSchema = z.enum(CONSTRUCTION_BOQ_STATUSES);
export const constructionPhaseStatusSchema = z.enum(CONSTRUCTION_PHASE_STATUSES);
export const constructionDocumentKindSchema = z.enum(CONSTRUCTION_DOCUMENT_KINDS);
export const constructionAlertStatusSchema = z.enum(CONSTRUCTION_ALERT_STATUSES);
export const constructionAlertDirectionSchema = z.enum(CONSTRUCTION_ALERT_DIRECTIONS);

export const createConstructionLocationSchema = z.object({
  parentId: uuidSchema.optional().nullable(),
  type: constructionLocationTypeSchema,
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120),
  code: z.string().max(32).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  timezone: z.string().max(64).optional().nullable(),
});

export const createConstructionMaterialPriceSchema = z.object({
  materialId: uuidSchema,
  locationId: uuidSchema.optional().nullable(),
  brandId: uuidSchema.optional().nullable(),
  unit: constructionUnitSchema,
  currency: constructionCurrencySchema,
  price: moneyAmountSchema,
  minPrice: moneyAmountSchema.optional().nullable(),
  maxPrice: moneyAmountSchema.optional().nullable(),
  source: z.string().max(200).optional().nullable(),
  sourceUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  freshness: constructionPriceFreshnessSchema.default('ESTIMATED'),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional().nullable(),
  verifiedAt: z.coerce.date().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  metadata: jsonValueSchema.optional().nullable(),
});

export const createConstructionCostRateSchema = z.object({
  locationId: uuidSchema.optional().nullable(),
  workType: z.string().min(1).max(80),
  name: z.string().max(150).optional().nullable(),
  unit: constructionUnitSchema,
  currency: constructionCurrencySchema,
  rate: moneyAmountSchema,
  quality: z.enum(['basic', 'standard', 'premium']).optional().nullable(),
  methodologyKey: z.string().max(80).optional().nullable(),
  methodologyVersion: z.number().int().positive().default(1),
  source: z.string().max(200).optional().nullable(),
  sourceUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional().nullable(),
  verifiedAt: z.coerce.date().optional().nullable(),
  metadata: jsonValueSchema.optional().nullable(),
});

export const createConstructionCalculationSchema = z.object({
  projectId: uuidSchema.optional().nullable(),
  calculatorSlug: z.string().min(1).max(120),
  calculatorId: uuidSchema.optional().nullable(),
  name: z.string().max(150).optional().nullable(),
  methodologyKey: z.string().min(1).max(80),
  methodologyVersion: z.number().int().positive().default(1),
  inputs: jsonValueSchema,
  assumptions: jsonValueSchema.optional().nullable(),
  outputs: jsonValueSchema.optional().nullable(),
  unitSummary: jsonValueSchema.optional().nullable(),
  currency: constructionCurrencySchema,
  status: z.enum(['SUCCESS', 'FAILED', 'PENDING']).default('PENDING'),
});

export const createConstructionBoqSchema = z.object({
  projectId: uuidSchema,
  name: z.string().min(1).max(150),
  version: z.number().int().positive().default(1),
  status: constructionBoqStatusSchema.default('DRAFT'),
  currency: constructionCurrencySchema,
  notes: z.string().max(5000).optional().nullable(),
});

export const createConstructionBoqItemSchema = z.object({
  boqId: uuidSchema,
  materialId: uuidSchema.optional().nullable(),
  phaseId: uuidSchema.optional().nullable(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  unit: constructionUnitSchema,
  quantity: quantitySchema,
  unitRate: moneyAmountSchema,
  wastagePercent: z.number().min(0).max(100).optional().nullable(),
  amount: moneyAmountSchema,
  sortOrder: z.number().int().nonnegative().default(0),
  metadata: jsonValueSchema.optional().nullable(),
});

/** Nested BOQ create for generator save (amount recomputed server-side). */
export const createConstructionBoqWithItemsSchema = z.object({
  projectId: uuidSchema,
  name: z.string().min(1).max(150),
  version: z.number().int().positive().optional(),
  status: constructionBoqStatusSchema.default('DRAFT'),
  currency: constructionCurrencySchema,
  notes: z.string().max(5000).optional().nullable(),
  contingencyPercent: z.number().min(0).max(50).optional().nullable(),
  taxPercent: z.number().min(0).max(50).optional().nullable(),
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        description: z.string().max(2000).optional().nullable(),
        unit: constructionUnitSchema,
        quantity: quantitySchema,
        unitRate: moneyAmountSchema,
        wastagePercent: z.number().min(0).max(100).optional().nullable(),
        sortOrder: z.number().int().nonnegative().default(0),
        metadata: jsonValueSchema.optional().nullable(),
      }),
    )
    .min(1)
    .max(2000),
});

export type CreateConstructionBoqWithItemsInput = z.infer<
  typeof createConstructionBoqWithItemsSchema
>;

/** Body for POST /construction/projects/:projectId/boqs (projectId from URL). */
export const saveConstructionProjectBoqSchema = createConstructionBoqWithItemsSchema.omit({
  projectId: true,
});

export type SaveConstructionProjectBoqInput = z.infer<typeof saveConstructionProjectBoqSchema>;

export const createConstructionProjectPhaseSchema = z.object({
  projectId: uuidSchema,
  name: z.string().min(1).max(120),
  slug: z.string().max(120).optional().nullable(),
  sortOrder: z.number().int().nonnegative().default(0),
  status: constructionPhaseStatusSchema.default('PLANNED'),
  plannedStart: z.coerce.date().optional().nullable(),
  plannedEnd: z.coerce.date().optional().nullable(),
  actualStart: z.coerce.date().optional().nullable(),
  actualEnd: z.coerce.date().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

/** Replace all phases for a project (timeline planner save). */
export const replaceConstructionProjectPhasesSchema = z.object({
  phases: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        slug: z.string().max(120).optional().nullable(),
        sortOrder: z.number().int().nonnegative().default(0),
        status: constructionPhaseStatusSchema.default('PLANNED'),
        plannedStart: z.coerce.date().optional().nullable(),
        plannedEnd: z.coerce.date().optional().nullable(),
        notes: z.string().max(2000).optional().nullable(),
      }),
    )
    .max(100),
});

export type ReplaceConstructionProjectPhasesInput = z.infer<
  typeof replaceConstructionProjectPhasesSchema
>;

export const createConstructionBudgetItemSchema = z.object({
  projectId: uuidSchema,
  phaseId: uuidSchema.optional().nullable(),
  category: z.string().min(1).max(80),
  name: z.string().min(1).max(150),
  plannedAmount: moneyAmountSchema,
  currency: constructionCurrencySchema,
  notes: z.string().max(2000).optional().nullable(),
});

/** Body for POST /projects/:id/budget-items */
export const saveConstructionBudgetItemSchema = createConstructionBudgetItemSchema.omit({
  projectId: true,
});

export type SaveConstructionBudgetItemInput = z.infer<typeof saveConstructionBudgetItemSchema>;

export const createConstructionExpenseSchema = z.object({
  projectId: uuidSchema,
  budgetItemId: uuidSchema.optional().nullable(),
  phaseId: uuidSchema.optional().nullable(),
  vendorBusinessId: uuidSchema.optional().nullable(),
  name: z.string().min(1).max(150),
  amount: moneyAmountSchema,
  currency: constructionCurrencySchema,
  spentOn: z.coerce.date(),
  notes: z.string().max(2000).optional().nullable(),
  receiptMediaId: uuidSchema.optional().nullable(),
});

/** Body for POST /projects/:id/expenses — includes planner fields stored in notes. */
export const saveConstructionExpenseSchema = z.object({
  budgetItemId: uuidSchema.optional().nullable(),
  phaseId: uuidSchema.optional().nullable(),
  vendorBusinessId: uuidSchema.optional().nullable(),
  name: z.string().min(1).max(150),
  amount: moneyAmountSchema,
  currency: constructionCurrencySchema.default('INR'),
  spentOn: z.coerce.date(),
  notes: z.string().max(2000).optional().nullable(),
  receiptMediaId: uuidSchema.optional().nullable(),
  /** Planner extras — encoded into notes on save */
  category: z.string().min(1).max(80).optional(),
  vendor: z.string().max(200).optional().nullable(),
  paymentStatus: z.enum(['paid', 'pending', 'committed', 'partial']).optional(),
  receiptUrl: z.string().max(500).optional().nullable(),
});

export type SaveConstructionExpenseInput = z.infer<typeof saveConstructionExpenseSchema>;

export const createConstructionPriceAlertSchema = z
  .object({
    materialId: uuidSchema,
    locationId: uuidSchema,
    direction: constructionAlertDirectionSchema.default('BELOW'),
    targetPrice: moneyAmountSchema.optional().nullable(),
    thresholdPercent: z.coerce.number().positive().max(100).optional().nullable(),
    currency: constructionCurrencySchema.default('INR'),
    cooldownHours: z.coerce
      .number()
      .int()
      .min(1)
      .max(24 * 30)
      .optional()
      .default(24),
    name: z.string().min(1).max(120).optional().nullable(),
    status: constructionAlertStatusSchema.optional().default('ACTIVE'),
  })
  .superRefine((val, ctx) => {
    if (val.direction === 'BELOW' || val.direction === 'ABOVE') {
      if (val.targetPrice == null || !(val.targetPrice > 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'targetPrice is required for below/above conditions.',
          path: ['targetPrice'],
        });
      }
    } else if (val.thresholdPercent == null || !(val.thresholdPercent > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'thresholdPercent is required for drop/rise percentage conditions.',
        path: ['thresholdPercent'],
      });
    }
  });

export const updateConstructionPriceAlertSchema = z.object({
  status: constructionAlertStatusSchema.optional(),
  targetPrice: moneyAmountSchema.optional().nullable(),
  thresholdPercent: z.coerce.number().positive().max(100).optional().nullable(),
  cooldownHours: z.coerce
    .number()
    .int()
    .min(1)
    .max(24 * 30)
    .optional(),
  name: z.string().min(1).max(120).optional().nullable(),
});

export type UpdateConstructionPriceAlertInput = z.infer<typeof updateConstructionPriceAlertSchema>;

export const createConstructionSavedComparisonSchema = z.object({
  title: z.string().min(1).max(150),
  entityType: z.string().min(1).max(40).default('materials'),
  entityIds: z.array(uuidSchema).min(2).max(8),
  notes: z.string().max(2000).optional().nullable(),
});

export const createConstructionDocumentSchema = z.object({
  projectId: uuidSchema,
  kind: constructionDocumentKindSchema.default('OTHER'),
  title: z.string().min(1).max(200),
  mediaId: uuidSchema.optional().nullable(),
  /** Legacy/external URL — vault uploads must not rely on public URLs */
  url: z.string().url().max(500).optional().nullable().or(z.literal('')),
  notes: z.string().max(2000).optional().nullable(),
  boqId: uuidSchema.optional().nullable(),
  expenseId: uuidSchema.optional().nullable(),
  phaseId: uuidSchema.optional().nullable(),
  quoteDocumentId: uuidSchema.optional().nullable(),
  metadata: jsonValueSchema.optional().nullable(),
});

/** Multipart upload metadata fields (file is separate). */
export const saveConstructionDocumentMetaSchema = z.object({
  kind: constructionDocumentKindSchema.default('OTHER'),
  title: z.string().min(1).max(200),
  notes: z.string().max(2000).optional().nullable(),
  boqId: uuidSchema.optional().nullable().or(z.literal('')),
  expenseId: uuidSchema.optional().nullable().or(z.literal('')),
  phaseId: uuidSchema.optional().nullable().or(z.literal('')),
  quoteDocumentId: uuidSchema.optional().nullable().or(z.literal('')),
});

export type SaveConstructionDocumentMetaInput = z.infer<typeof saveConstructionDocumentMetaSchema>;

export type CreateConstructionLocationInput = z.infer<typeof createConstructionLocationSchema>;
export type CreateConstructionMaterialPriceInput = z.infer<
  typeof createConstructionMaterialPriceSchema
>;
export type CreateConstructionCostRateInput = z.infer<typeof createConstructionCostRateSchema>;
export type CreateConstructionCalculationInput = z.infer<
  typeof createConstructionCalculationSchema
>;
export type CreateConstructionBoqInput = z.infer<typeof createConstructionBoqSchema>;
export type CreateConstructionBoqItemInput = z.infer<typeof createConstructionBoqItemSchema>;
export type CreateConstructionProjectPhaseInput = z.infer<
  typeof createConstructionProjectPhaseSchema
>;
export type CreateConstructionBudgetItemInput = z.infer<typeof createConstructionBudgetItemSchema>;
export type CreateConstructionExpenseInput = z.infer<typeof createConstructionExpenseSchema>;
export type CreateConstructionPriceAlertInput = z.infer<typeof createConstructionPriceAlertSchema>;
export type CreateConstructionSavedComparisonInput = z.infer<
  typeof createConstructionSavedComparisonSchema
>;
export type CreateConstructionDocumentInput = z.infer<typeof createConstructionDocumentSchema>;

import { applyWastage } from './construction-engine/wastage';
import { multiplyQuantityPrice } from './construction-engine/money';

/** Compute BOQ line amount with optional wastage — keeps money math in one place. */
export function computeBoqLineAmount(input: {
  quantity: number;
  unitRate: number;
  wastagePercent?: number | null;
}): number {
  const wasted = applyWastage(input.quantity, input.wastagePercent ?? 0);
  if (!wasted.ok) return NaN;
  return multiplyQuantityPrice(wasted.value, input.unitRate);
}

/** Mark price freshness from verified age (days). */
export function resolvePriceFreshness(input: {
  claimed: (typeof CONSTRUCTION_PRICE_FRESHNESS)[number];
  verifiedAt?: Date | null;
  now?: Date;
}): (typeof CONSTRUCTION_PRICE_FRESHNESS)[number] {
  if (input.claimed === 'LIVE') return 'LIVE';
  if (!input.verifiedAt) return input.claimed === 'VERIFIED' ? 'ESTIMATED' : input.claimed;
  const now = input.now ?? new Date();
  const ageDays = Math.floor((now.getTime() - input.verifiedAt.getTime()) / (24 * 60 * 60 * 1000));
  if (ageDays > 90) return 'STALE';
  if (input.claimed === 'VERIFIED' && ageDays <= 30) return 'VERIFIED';
  return input.claimed;
}
