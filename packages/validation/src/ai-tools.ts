import { z } from 'zod';
import { cursorPaginationQuerySchema, jsonValueSchema, publishStatusSchema, slugSchema, uuidSchema } from './common';

export const aiPricingModelSchema = z.enum([
  'FREE',
  'FREEMIUM',
  'SUBSCRIPTION',
  'PAY_AS_YOU_GO',
  'ENTERPRISE',
  'LIFETIME',
]);

export const aiToolEventTypeSchema = z.enum([
  'VIEW',
  'OUTBOUND_CLICK',
  'AFFILIATE_CLICK',
  'BOOKMARK',
  'SEARCH',
  'COMPARE',
]);

export const createAiCategorySchema = z.object({
  name: z.string().min(1).max(150),
  slug: slugSchema,
  parentId: uuidSchema.optional().nullable(),
  icon: z.string().max(120).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateAiCategorySchema = createAiCategorySchema.partial();

export const aiToolFeatureSchema = z.object({
  name: z.string().min(1).max(150),
  sortOrder: z.number().int().min(0).optional(),
});

export const aiToolIntegrationSchema = z.object({
  name: z.string().min(1).max(150),
  sortOrder: z.number().int().min(0).optional(),
});

export const aiToolScreenshotSchema = z.object({
  mediaId: uuidSchema.optional().nullable(),
  url: z.string().url().optional().nullable().or(z.literal('')),
  caption: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export const aiToolFaqSchema = z.object({
  question: z.string().min(1).max(300),
  answer: z.string().min(1).max(2000),
});

export const createAiToolSchema = z.object({
  name: z.string().min(1).max(200),
  slug: slugSchema,
  categoryId: uuidSchema.optional().nullable(),
  companyId: uuidSchema.optional().nullable(),
  description: z.string().max(10000).optional().nullable(),
  shortDescription: z.string().max(500).optional().nullable(),
  logoUrl: z.string().url().optional().nullable().or(z.literal('')),
  coverImageUrl: z.string().url().optional().nullable().or(z.literal('')),
  pricingModel: aiPricingModelSchema.default('FREEMIUM'),
  pricingDetails: z.string().max(2000).optional().nullable(),
  monthlyPrice: z.string().max(80).optional().nullable(),
  annualPrice: z.string().max(80).optional().nullable(),
  freePlan: z.boolean().optional(),
  freeTrial: z.boolean().optional(),
  apiAvailable: z.boolean().optional(),
  website: z.string().url().optional().nullable().or(z.literal('')),
  documentation: z.string().url().optional().nullable().or(z.literal('')),
  affiliateUrl: z.string().url().optional().nullable().or(z.literal('')),
  platforms: z.array(z.string().max(80)).optional().nullable(),
  languages: z.array(z.string().max(80)).optional().nullable(),
  faqs: z.array(aiToolFaqSchema).optional().nullable(),
  featured: z.boolean().optional(),
  sponsored: z.boolean().optional(),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
  status: publishStatusSchema.default('DRAFT'),
  features: z.array(aiToolFeatureSchema).default([]),
  integrations: z.array(aiToolIntegrationSchema).default([]),
  screenshots: z.array(aiToolScreenshotSchema).default([]),
  metadata: jsonValueSchema.optional().nullable(),
});

export const updateAiToolSchema = createAiToolSchema.partial();

export const aiToolsQuerySchema = cursorPaginationQuerySchema.extend({
  search: z.string().optional(),
  status: publishStatusSchema.optional(),
  category: z.string().optional(),
  pricingModel: aiPricingModelSchema.optional(),
  featured: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === true || v === 'true')),
  sponsored: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === true || v === 'true')),
  freePlan: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === true || v === 'true')),
  freeTrial: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === true || v === 'true')),
  apiAvailable: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === true || v === 'true')),
  feature: z.string().optional(),
  sort: z.enum(['recent', 'popular', 'name', 'bookmarked']).optional(),
});

export const aiToolBookmarksQuerySchema = cursorPaginationQuerySchema.extend({
  collectionName: z.string().max(120).optional(),
});

export const createAiToolBookmarkSchema = z.object({
  toolId: uuidSchema,
  collectionName: z.string().max(120).optional().nullable(),
});

export const followAiCategorySchema = z.object({
  categoryId: uuidSchema,
});

export const renameAiFeatureSchema = z.object({
  fromName: z.string().min(1).max(150),
  toName: z.string().min(1).max(150),
});

export const aiToolTrackEventSchema = z.object({
  eventType: aiToolEventTypeSchema,
  metadata: jsonValueSchema.optional().nullable(),
});

export const aiToolsBulkActionSchema = z.object({
  ids: z.array(uuidSchema).min(1).max(100),
});

export const aiUtilityRunSchema = z.object({
  utility: z.enum([
    'prompt-generator',
    'text-summarizer',
    'seo-title',
    'meta-description',
    'keyword-cluster',
    'regex-generator',
    'json-formatter',
    'markdown-converter',
  ]),
  input: z.string().min(1).max(20000),
  options: z.record(z.string(), z.unknown()).optional(),
});

export const aiToolsCompareQuerySchema = z.object({
  slugs: z.string().min(1),
});

export type CreateAiCategoryInput = z.infer<typeof createAiCategorySchema>;
export type UpdateAiCategoryInput = z.infer<typeof updateAiCategorySchema>;
export type CreateAiToolInput = z.infer<typeof createAiToolSchema>;
export type UpdateAiToolInput = z.infer<typeof updateAiToolSchema>;
export type AiToolsQuery = z.infer<typeof aiToolsQuerySchema>;
export type CreateAiToolBookmarkInput = z.infer<typeof createAiToolBookmarkSchema>;
export type FollowAiCategoryInput = z.infer<typeof followAiCategorySchema>;
export type RenameAiFeatureInput = z.infer<typeof renameAiFeatureSchema>;
export type AiToolTrackEventInput = z.infer<typeof aiToolTrackEventSchema>;
export type AiToolsBulkActionInput = z.infer<typeof aiToolsBulkActionSchema>;
export type AiUtilityRunInput = z.infer<typeof aiUtilityRunSchema>;
export type AiToolsCompareQuery = z.infer<typeof aiToolsCompareQuerySchema>;
