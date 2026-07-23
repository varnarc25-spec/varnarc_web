import { z } from 'zod';
import { cursorPaginationQuerySchema, jsonValueSchema, publishStatusSchema, slugSchema, uuidSchema } from './common';

export const comparisonEntityTypeSchema = z.enum([
  'vehicle',
  'loan_product',
  'insurance_plan',
  'credit_card',
  'construction_material',
  'building_brand',
  'ai_tool',
  'software',
  'business',
  'service',
  'calculator',
  'product',
  'investment_product',
]);

export const comparisonRecommendationSchema = z.enum([
  'best_overall',
  'best_budget',
  'best_premium',
  'best_performance',
  'editors_choice',
  'best_value',
  'most_popular',
]);

export const comparisonValueTypeSchema = z.enum([
  'text',
  'number',
  'currency',
  'rating',
  'percentage',
  'boolean',
  'icon',
  'feature',
  'richtext',
]);

export const templateAttributeSchema = z.object({
  key: z.string().min(1).max(80),
  label: z.string().min(1).max(150),
  valueType: comparisonValueTypeSchema.default('text'),
  groupKey: z.string().max(80).optional().nullable(),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const createComparisonTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  entityType: comparisonEntityTypeSchema,
  description: z.string().max(2000).optional().nullable(),
  attributes: z.array(templateAttributeSchema).default([]),
});

export const updateComparisonTemplateSchema = createComparisonTemplateSchema.partial();

export const comparisonItemSchema = z.object({
  productId: uuidSchema,
  entityType: comparisonEntityTypeSchema.optional().nullable(),
  entityId: uuidSchema.optional().nullable(),
  label: z.string().max(200).optional().nullable(),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const comparisonAttributeSchema = z.object({
  key: z.string().min(1).max(80),
  label: z.string().min(1).max(150),
  valueType: comparisonValueTypeSchema.default('text'),
  groupKey: z.string().max(80).optional().nullable(),
  values: jsonValueSchema,
  sortOrder: z.number().int().nonnegative().default(0),
  highlights: z.array(z.string().max(50)).optional(),
});

export const createComparisonSchema = z.object({
  templateId: uuidSchema.optional().nullable(),
  title: z.string().min(1).max(300),
  slug: slugSchema,
  description: z.string().max(5000).optional().nullable(),
  comparisonType: z.string().max(80).optional().nullable(),
  entityType: comparisonEntityTypeSchema.optional().nullable(),
  recommendation: comparisonRecommendationSchema.optional().nullable(),
  winnerEntityType: comparisonEntityTypeSchema.optional().nullable(),
  winnerEntityId: uuidSchema.optional().nullable(),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
  status: publishStatusSchema.default('DRAFT'),
  items: z.array(comparisonItemSchema).min(2).max(10),
  attributes: z.array(comparisonAttributeSchema).default([]),
});

export const updateComparisonSchema = createComparisonSchema.partial();

export const comparisonsListQuerySchema = cursorPaginationQuerySchema.extend({
  status: publishStatusSchema.optional(),
  entityType: comparisonEntityTypeSchema.optional(),
  comparisonType: z.string().max(80).optional(),
});

export type CreateComparisonTemplateInput = z.infer<typeof createComparisonTemplateSchema>;
export type UpdateComparisonTemplateInput = z.infer<typeof updateComparisonTemplateSchema>;
export type CreateComparisonInput = z.infer<typeof createComparisonSchema>;
export type UpdateComparisonInput = z.infer<typeof updateComparisonSchema>;
export type ComparisonsListQuery = z.infer<typeof comparisonsListQuerySchema>;

export const comparisonBulkActionSchema = z.object({
  ids: z.array(uuidSchema).min(1).max(50),
});

export const comparisonAffiliateClickSchema = z.object({
  affiliateUrl: z.string().url().max(2000),
  itemEntityType: z.string().max(80).optional().nullable(),
  itemEntityId: uuidSchema.optional().nullable(),
  sessionId: z.string().max(120).optional().nullable(),
  referrer: z.string().max(500).optional().nullable(),
});

export type ComparisonBulkActionInput = z.infer<typeof comparisonBulkActionSchema>;
export type ComparisonAffiliateClickInput = z.infer<typeof comparisonAffiliateClickSchema>;
