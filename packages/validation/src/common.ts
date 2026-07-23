import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const jsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ]),
);

/** Offset pagination (admin tables, reporting). */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

/** Cursor / keyset pagination (high-read lists). */
export const cursorPaginationQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  direction: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

export const publishStatusSchema = z.enum([
  'DRAFT',
  'REVIEW',
  'SCHEDULED',
  'PUBLISHED',
  'ARCHIVED',
]);

export const adStatusSchema = z.enum([
  'DRAFT',
  'SCHEDULED',
  'ACTIVE',
  'PAUSED',
  'ENDED',
  'ARCHIVED',
]);

export const adTypeSchema = z.enum([
  'ADSENSE',
  'BANNER',
  'HTML',
  'JAVASCRIPT',
  'AFFILIATE',
  'SPONSORED',
  'NATIVE',
  'CTA',
  'INTERNAL',
]);

export const adProviderSchema = z.enum([
  'GOOGLE_ADSENSE',
  'DIRECT',
  'AFFILIATE',
  'INTERNAL',
]);

export const adContentTypeSchema = z.enum([
  'IMAGE',
  'HTML',
  'JAVASCRIPT',
  'TEXT',
  'SCRIPT_SLOT',
]);

export const adRotationModeSchema = z.enum([
  'SEQUENTIAL',
  'RANDOM',
  'WEIGHTED',
  'PRIORITY',
]);

export const businessStatusSchema = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'SUSPENDED',
]);

export const mediaResourceTypeSchema = z.enum([
  'IMAGE',
  'VIDEO',
  'RAW',
  'DOCUMENT',
]);

export const seoMetadataSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  canonicalUrl: z.string().url().optional().nullable().or(z.literal('')),
  ogImage: z.string().url().optional().nullable().or(z.literal('')),
  robots: z.string().max(120).optional().nullable(),
  metaKeywords: z.string().max(500).optional().nullable(),
  twitterCard: z.enum(['summary', 'summary_large_image']).optional().nullable(),
  schemaType: z.string().max(80).optional().nullable(),
  language: z.string().max(12).optional().nullable(),
  structuredData: jsonValueSchema.optional().nullable(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type CursorPaginationQuery = z.infer<typeof cursorPaginationQuerySchema>;
