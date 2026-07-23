import { z } from 'zod';
import {
  jsonValueSchema,
  publishStatusSchema,
  seoMetadataSchema,
  slugSchema,
  uuidSchema,
} from './common';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(150),
  slug: slugSchema,
  description: z.string().max(2000).optional().nullable(),
  parentId: uuidSchema.optional().nullable(),
  status: publishStatusSchema.default('DRAFT'),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createTagSchema = z.object({
  name: z.string().min(1).max(100),
  slug: slugSchema,
  description: z.string().max(1000).optional().nullable(),
});

export const updateTagSchema = createTagSchema.partial();

export const createArticleSchema = z.object({
  title: z.string().min(1).max(300),
  slug: slugSchema,
  excerpt: z.string().max(1000).optional().nullable(),
  content: z.string().min(1),
  categoryId: uuidSchema.optional().nullable(),
  featuredImageId: uuidSchema.optional().nullable(),
  status: publishStatusSchema.default('DRAFT'),
  publishedAt: z.coerce.date().optional().nullable(),
  isFeatured: z.boolean().default(false),
  readingTimeMinutes: z.number().int().positive().optional().nullable(),
  tagIds: z.array(uuidSchema).default([]),
  relatedIds: z.array(uuidSchema).default([]),
  metadata: jsonValueSchema.optional().nullable(),
  seo: seoMetadataSchema.optional(),
});

export const updateArticleSchema = createArticleSchema.partial();

export const scheduleContentSchema = z.object({
  publishedAt: z.coerce.date(),
});

export const reviewActionSchema = z.object({
  notes: z.string().max(2000).optional().nullable(),
});

export const createPageSchema = z.object({
  title: z.string().min(1).max(300),
  slug: slugSchema,
  content: z.string().optional().nullable(),
  status: publishStatusSchema.default('DRAFT'),
  publishedAt: z.coerce.date().optional().nullable(),
  metadata: jsonValueSchema.optional().nullable(),
  seo: seoMetadataSchema.optional(),
});

export const updatePageSchema = createPageSchema.partial();

export const createMenuSchema = z.object({
  name: z.string().min(1).max(150),
  slug: slugSchema,
  location: z.enum(['header', 'footer', 'sidebar', 'mobile']).or(z.string().min(1).max(60)),
});

export const updateMenuSchema = createMenuSchema.partial();

export const createMenuItemSchema = z.object({
  label: z.string().min(1).max(150),
  href: z.string().max(500).optional().nullable(),
  parentId: uuidSchema.optional().nullable(),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const reorderMenuItemsSchema = z.object({
  orderedIds: z.array(uuidSchema).min(1),
});

export const createCommentSchema = z.object({
  articleId: uuidSchema,
  body: z.string().min(1).max(5000),
  parentId: uuidSchema.optional().nullable(),
});

export const updateCommentSchema = z.object({
  body: z.string().min(1).max(5000),
});

export const moderateCommentSchema = z.object({
  status: publishStatusSchema,
});

export const bulkModerateCommentsSchema = z.object({
  ids: z.array(uuidSchema).min(1).max(100),
  status: publishStatusSchema,
});

export const commentListQuerySchema = z.object({
  articleId: uuidSchema.optional(),
  status: publishStatusSchema.optional(),
  flagged: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === true || v === 'true')),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const articleVerticalSchema = z.enum([
  'finance',
  'construction',
  'automobile',
  'solar',
  'general',
]);

export const generateArticleDraftSchema = z.object({
  topic: z.string().min(3).max(300),
  vertical: articleVerticalSchema.default('general'),
  tone: z.enum(['informative', 'beginner-friendly', 'expert']).default('informative'),
  audience: z.string().min(1).max(200).default('Indian readers researching practical decisions'),
  categoryHint: z.string().max(150).optional(),
});

export const improveArticleSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(1).max(50000),
  mode: z.enum(['expand', 'simplify', 'seo', 'excerpt']).default('expand'),
});

export const suggestRelatedArticlesSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(1).max(50000),
  limit: z.number().int().min(1).max(10).default(5),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type ScheduleContentInput = z.infer<typeof scheduleContentSchema>;
export type ReviewActionInput = z.infer<typeof reviewActionSchema>;
export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
export type CreateMenuInput = z.infer<typeof createMenuSchema>;
export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type ReorderMenuItemsInput = z.infer<typeof reorderMenuItemsSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type ModerateCommentInput = z.infer<typeof moderateCommentSchema>;
export type BulkModerateCommentsInput = z.infer<typeof bulkModerateCommentsSchema>;
export type CommentListQuery = z.infer<typeof commentListQuerySchema>;
export type GenerateArticleDraftInput = z.infer<typeof generateArticleDraftSchema>;
export type ImproveArticleInput = z.infer<typeof improveArticleSchema>;
export type SuggestRelatedArticlesInput = z.infer<typeof suggestRelatedArticlesSchema>;
