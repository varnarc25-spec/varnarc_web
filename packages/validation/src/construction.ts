import { z } from 'zod';
import {
  cursorPaginationQuerySchema,
  jsonValueSchema,
  publishStatusSchema,
  slugSchema,
  uuidSchema,
} from './common';

export const createConstructionCategorySchema = z.object({
  name: z.string().min(1).max(150),
  slug: slugSchema,
  description: z.string().max(2000).optional().nullable(),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const updateConstructionCategorySchema = createConstructionCategorySchema.partial();

export const createConstructionBrandSchema = z.object({
  name: z.string().min(1).max(150),
  slug: slugSchema,
  logoUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  website: z.string().url().max(500).optional().nullable().or(z.literal('')),
  description: z.string().max(5000).optional().nullable(),
  featured: z.boolean().default(false),
  status: publishStatusSchema.default('DRAFT'),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
});

export const updateConstructionBrandSchema = createConstructionBrandSchema.partial();

export const createConstructionMaterialSchema = z.object({
  categoryId: uuidSchema.optional().nullable(),
  brandId: uuidSchema.optional().nullable(),
  name: z.string().min(1).max(150),
  slug: slugSchema,
  description: z.string().max(5000).optional().nullable(),
  specifications: jsonValueSchema.optional().nullable(),
  unit: z.string().min(1).max(40),
  unitCost: z.number().min(0).optional().nullable(),
  approximatePrice: z.number().min(0).optional().nullable(),
  availabilityRegion: z.string().max(120).optional().nullable(),
  affiliateUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  imageUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  featured: z.boolean().default(false),
  sponsored: z.boolean().default(false),
  status: publishStatusSchema.default('DRAFT'),
  rating: z.number().min(0).max(5).optional().nullable(),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
});

export const updateConstructionMaterialSchema = createConstructionMaterialSchema.partial();

export const createCostTemplateSchema = z.object({
  categoryId: uuidSchema.optional().nullable(),
  name: z.string().min(1).max(150),
  slug: slugSchema,
  description: z.string().max(2000).optional().nullable(),
  category: z.string().max(80).optional().nullable(),
  formulaReference: z.string().max(200).optional().nullable(),
  items: jsonValueSchema.optional().nullable(),
  laborPercent: z.number().min(0).max(100).optional().nullable(),
  contingencyPercent: z.number().min(0).max(100).optional().nullable(),
  status: publishStatusSchema.default('DRAFT'),
});

export const updateCostTemplateSchema = createCostTemplateSchema.partial();

export const constructionEstimateRoomSchema = z.object({
  name: z.string().min(1).max(80),
  areaSqft: z.number().positive().optional(),
  lengthFt: z.number().positive().optional(),
  widthFt: z.number().positive().optional(),
  quality: z.enum(['basic', 'standard', 'premium']).optional(),
});

export const constructionEstimateLineItemSchema = z.object({
  name: z.string().min(1).max(120),
  quantity: z.number().positive(),
  unitCost: z.number().min(0),
});

const constructionEstimateBaseSchema = z.object({
  templateSlug: z.string().max(120).optional().nullable(),
  areaSqft: z.number().positive().optional(),
  region: z.string().max(120).optional().nullable(),
  quality: z.enum(['basic', 'standard', 'premium']).default('standard'),
  rooms: z.array(constructionEstimateRoomSchema).optional(),
  lineItems: z.array(constructionEstimateLineItemSchema).optional(),
});

export const constructionEstimateSchema = constructionEstimateBaseSchema.refine(
  (data) => (data.rooms?.length ?? 0) > 0 || (data.areaSqft != null && data.areaSqft > 0),
  { message: 'Provide built-up area or at least one room.' },
);

export const constructionEstimateQuerySchema = z
  .object({
    templateSlug: z.string().max(120).optional().nullable(),
    areaSqft: z.coerce.number().positive().optional(),
    region: z.string().max(120).optional().nullable(),
    quality: z.enum(['basic', 'standard', 'premium']).default('standard'),
    rooms: z
      .string()
      .optional()
      .transform((v) => {
        if (!v) return undefined;
        try {
          const parsed = JSON.parse(v) as unknown;
          return z.array(constructionEstimateRoomSchema).parse(parsed);
        } catch {
          return undefined;
        }
      }),
    lineItems: z
      .string()
      .optional()
      .transform((v) => {
        if (!v) return undefined;
        try {
          const parsed = JSON.parse(v) as unknown;
          return z.array(constructionEstimateLineItemSchema).parse(parsed);
        } catch {
          return undefined;
        }
      }),
  })
  .refine(
    (data) => (data.rooms?.length ?? 0) > 0 || (data.areaSqft != null && data.areaSqft > 0),
    { message: 'Provide built-up area or at least one room.' },
  );

export const createConstructionProjectSchema = z.object({
  name: z.string().min(1).max(150),
  projectType: z.string().min(1).max(80),
  areaSqft: z.number().positive().optional().nullable(),
  region: z.string().max(120).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  items: z
    .array(
      z.object({
        materialId: uuidSchema.optional().nullable(),
        name: z.string().max(150).optional().nullable(),
        quantity: z.number().positive(),
        unitCost: z.number().min(0).optional().nullable(),
      }),
    )
    .default([]),
});

export const updateConstructionProjectSchema = createConstructionProjectSchema.partial();

export const constructionListQuerySchema = cursorPaginationQuerySchema.extend({
  status: publishStatusSchema.optional(),
  categoryId: uuidSchema.optional(),
  brandId: uuidSchema.optional(),
  featured: z.coerce.boolean().optional(),
});

export const constructionCompareQuerySchema = z.object({
  ids: z
    .string()
    .min(1)
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean))
    .pipe(z.array(uuidSchema).min(2).max(6)),
});

export const constructionEstimateSaveSchema = constructionEstimateBaseSchema
  .extend({
    name: z.string().min(1).max(150).optional(),
  })
  .refine(
    (data) => (data.rooms?.length ?? 0) > 0 || (data.areaSqft != null && data.areaSqft > 0),
    { message: 'Provide built-up area or at least one room.' },
  );

export const createConstructionComparisonSchema = z
  .object({
    title: z.string().min(1).max(150),
    slug: slugSchema.optional(),
    type: z.string().max(80).optional(),
    entityType: z.string().max(80).optional(),
    ids: z.array(uuidSchema).min(2).max(6).optional(),
    entityIds: z.array(uuidSchema).min(2).max(6).optional(),
    status: publishStatusSchema.optional(),
  })
  .refine((d) => (d.ids?.length ?? 0) >= 2 || (d.entityIds?.length ?? 0) >= 2, {
    message: 'At least two entity IDs are required.',
  });

export type CreateConstructionCategoryInput = z.infer<typeof createConstructionCategorySchema>;
export type UpdateConstructionCategoryInput = z.infer<typeof updateConstructionCategorySchema>;
export type CreateConstructionBrandInput = z.infer<typeof createConstructionBrandSchema>;
export type UpdateConstructionBrandInput = z.infer<typeof updateConstructionBrandSchema>;
export type CreateConstructionMaterialInput = z.infer<typeof createConstructionMaterialSchema>;
export type UpdateConstructionMaterialInput = z.infer<typeof updateConstructionMaterialSchema>;
export type CreateCostTemplateInput = z.infer<typeof createCostTemplateSchema>;
export type UpdateCostTemplateInput = z.infer<typeof updateCostTemplateSchema>;
export type ConstructionEstimateInput = z.infer<typeof constructionEstimateSchema>;
export type ConstructionEstimateQuery = z.infer<typeof constructionEstimateQuerySchema>;
export type CreateConstructionProjectInput = z.infer<typeof createConstructionProjectSchema>;
export type UpdateConstructionProjectInput = z.infer<typeof updateConstructionProjectSchema>;
export type ConstructionListQuery = z.infer<typeof constructionListQuerySchema>;
export type ConstructionCompareQuery = z.infer<typeof constructionCompareQuerySchema>;
export const createConstructionChecklistSchema = z.object({
  title: z.string().min(1).max(150),
  slug: slugSchema.optional(),
  description: z.string().max(2000).optional().nullable(),
  projectType: z.string().max(80).optional().nullable(),
  items: z
    .array(
      z.object({
        label: z.string().min(1).max(200),
        description: z.string().max(500).optional().nullable(),
        phase: z.string().max(80).optional().nullable(),
      }),
    )
    .min(1)
    .max(100),
  status: publishStatusSchema.default('PUBLISHED'),
});

export const updateConstructionChecklistSchema = createConstructionChecklistSchema.partial();

export type CreateConstructionChecklistInput = z.infer<typeof createConstructionChecklistSchema>;
export type UpdateConstructionChecklistInput = z.infer<typeof updateConstructionChecklistSchema>;
export type ConstructionEstimateSaveInput = z.infer<typeof constructionEstimateSaveSchema>;
export type CreateConstructionComparisonInput = z.infer<typeof createConstructionComparisonSchema>;
