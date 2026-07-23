import { z } from 'zod';

export const searchEntityTypes = [
  'ARTICLE',
  'PAGE',
  'CMS_CATEGORY',
  'TAG',
  'GUIDE',
  'LOAN',
  'BANK',
  'CREDIT_CARD',
  'INSURANCE',
  'MATERIAL',
  'BRAND',
  'VEHICLE',
  'MANUFACTURER',
  'DEALER',
  'BUSINESS',
  'BUSINESS_SERVICE',
  'VENDOR',
  'AI_TOOL',
  'AI_CATEGORY',
  'CALCULATOR',
  'FORMULA_PAGE',
  'REVIEW',
  'COMPARISON',
  'MEDIA',
] as const;

export const searchEntityTypeSchema = z.enum(searchEntityTypes);

export const searchSortSchema = z.enum([
  'relevance',
  'newest',
  'oldest',
  'most_viewed',
  'most_popular',
  'highest_rated',
  'alphabetical',
]);

const boolQuery = z
  .union([z.literal('true'), z.literal('false'), z.boolean()])
  .optional()
  .transform((v) => (v === undefined ? undefined : v === true || v === 'true'));

export const searchQuerySchema = z.object({
  q: z.string().max(200).optional(),
  entityType: searchEntityTypeSchema.optional(),
  type: z.string().max(40).optional(), // alias / comma-separated entity types
  category: z.string().max(120).optional(),
  language: z.string().max(16).optional(),
  location: z.string().max(160).optional(),
  author: z.string().max(160).optional(),
  publishedFrom: z.coerce.date().optional(),
  publishedTo: z.coerce.date().optional(),
  tags: z.string().max(300).optional(),
  minRating: z.coerce.number().min(0).max(10).optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  brand: z.string().max(120).optional(),
  vehicleType: z.string().max(80).optional(),
  fuelType: z.string().max(80).optional(),
  loanType: z.string().max(80).optional(),
  materialType: z.string().max(80).optional(),
  featured: boolQuery,
  sponsored: boolQuery,
  verified: boolQuery,
  sort: searchSortSchema.default('relevance'),
  cursor: z.string().max(500).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const searchAutocompleteSchema = z.object({
  q: z.string().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export const searchSuggestionsSchema = z.object({
  q: z.string().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export const searchClickSchema = z.object({
  queryId: z.string().uuid().optional(),
  query: z.string().max(200).optional(),
  entityType: searchEntityTypeSchema.optional(),
  entityId: z.string().uuid().optional(),
  url: z.string().max(500).optional(),
});

export const searchReindexSchema = z.object({
  module: z
    .enum([
      'all',
      'cms',
      'finance',
      'construction',
      'automobile',
      'directory',
      'ai-tools',
      'calculators',
      'reviews',
      'comparisons',
      'media',
      'guides',
    ])
    .default('all'),
  async: z.boolean().optional().default(false),
});

export const searchAiQuerySchema = z.object({
  q: z.string().min(3).max(500),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(500).optional(),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type SearchAutocompleteInput = z.infer<typeof searchAutocompleteSchema>;
export type SearchReindexInput = z.infer<typeof searchReindexSchema>;
export type SearchClickInput = z.infer<typeof searchClickSchema>;
export type SearchAiQueryInput = z.infer<typeof searchAiQuerySchema>;
