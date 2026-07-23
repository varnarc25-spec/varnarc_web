import { z } from 'zod';
import { jsonValueSchema, publishStatusSchema, slugSchema, uuidSchema, cursorPaginationQuerySchema } from './common';

export const reviewEntityTypeSchema = z.enum([
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
  'directory_listing',
  'product',
]);

export const reviewTypeSchema = z.enum(['editorial', 'user', 'business', 'product', 'service', 'tool', 'vehicle', 'material', 'software']);

export const reviewRecommendationSchema = z.enum([
  'best_overall',
  'best_budget',
  'best_premium',
  'best_performance',
  'editors_choice',
]);

export const reviewMediaItemSchema = z.object({
  mediaId: uuidSchema.optional().nullable(),
  url: z.string().url().max(500).optional().nullable().or(z.literal('')),
  caption: z.string().max(300).optional().nullable(),
});

export const reviewMediaMetadataSchema = z.object({
  gallery: z.array(reviewMediaItemSchema).default([]),
  videoUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  slug: slugSchema,
  category: z.string().max(120).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  metadata: jsonValueSchema.optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial();

export const reviewScoreSchema = z.object({
  label: z.string().min(1).max(80),
  score: z.number().min(0).max(100),
  maxScore: z.number().min(1).max(100).default(10),
});

export const createReviewSchema = z.object({
  productId: uuidSchema,
  reviewType: reviewTypeSchema.default('editorial'),
  entityType: reviewEntityTypeSchema.optional().nullable(),
  entityId: uuidSchema.optional().nullable(),
  title: z.string().min(1).max(300),
  slug: slugSchema,
  summary: z.string().max(1000).optional().nullable(),
  body: z.string().max(50000).optional().nullable(),
  verdict: z.string().max(2000).optional().nullable(),
  recommendation: reviewRecommendationSchema.optional().nullable(),
  status: publishStatusSchema.default('DRAFT'),
  overallScore: z.number().min(0).max(100).optional().nullable(),
  featuredMediaId: uuidSchema.optional().nullable(),
  metadata: reviewMediaMetadataSchema.optional().nullable(),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
  sections: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        body: z.string().max(20000).optional().nullable(),
        sortOrder: z.number().int().nonnegative().default(0),
      }),
    )
    .default([]),
  scores: z.array(reviewScoreSchema).default([]),
  pros: z.array(z.string().min(1).max(300)).default([]),
  cons: z.array(z.string().min(1).max(300)).default([]),
});

export const updateReviewSchema = createReviewSchema
  .omit({ productId: true })
  .partial()
  .extend({
    productId: uuidSchema.optional(),
  });

export const reviewsListQuerySchema = cursorPaginationQuerySchema.extend({
  status: publishStatusSchema.optional(),
  productId: uuidSchema.optional(),
  entityType: reviewEntityTypeSchema.optional(),
  entityId: uuidSchema.optional(),
  reviewType: reviewTypeSchema.optional(),
});

export const createUserReviewSchema = z.object({
  entityType: reviewEntityTypeSchema,
  entityId: uuidSchema,
  productId: uuidSchema.optional().nullable(),
  reviewId: uuidSchema.optional().nullable(),
  rating: z.number().min(1).max(5),
  title: z.string().max(200).optional().nullable(),
  comment: z.string().max(5000).optional().nullable(),
});

export const updateUserReviewSchema = createUserReviewSchema
  .omit({ entityType: true, entityId: true })
  .partial();

export const moderationActionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'PUBLISHED', 'ARCHIVED']),
  note: z.string().max(500).optional().nullable(),
});

export const reviewHelpfulnessSchema = z.object({
  vote: z.union([z.literal(1), z.literal(-1)]),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ReviewsListQuery = z.infer<typeof reviewsListQuerySchema>;
export type CreateUserReviewInput = z.infer<typeof createUserReviewSchema>;
export type UpdateUserReviewInput = z.infer<typeof updateUserReviewSchema>;
export type ModerationActionInput = z.infer<typeof moderationActionSchema>;
