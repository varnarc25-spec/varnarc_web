import { z } from 'zod';
import {
  cursorPaginationQuerySchema,
  jsonValueSchema,
  publishStatusSchema,
  slugSchema,
  uuidSchema,
} from './common';

export const createAutomobileManufacturerSchema = z.object({
  name: z.string().min(1).max(150),
  slug: slugSchema,
  logoUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  logoMediaId: uuidSchema.optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  foundedYear: z.number().int().min(1800).max(2100).optional().nullable(),
  website: z.string().url().max(500).optional().nullable().or(z.literal('')),
  description: z.string().max(5000).optional().nullable(),
  featured: z.boolean().default(false),
  status: publishStatusSchema.default('DRAFT'),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
});

export const updateAutomobileManufacturerSchema = createAutomobileManufacturerSchema.partial();

export const automobileGalleryImageSchema = z.object({
  imageUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  mediaId: uuidSchema.optional().nullable(),
  altText: z.string().max(200).optional().nullable(),
  displayOrder: z.number().int().nonnegative().optional(),
});

export const createAutomobileVehicleSchema = z.object({
  manufacturerId: uuidSchema,
  name: z.string().min(1).max(150),
  slug: slugSchema,
  model: z.string().min(1).max(120),
  variant: z.string().max(120).optional().nullable(),
  modelYear: z.number().int().min(1950).max(2100).optional().nullable(),
  category: z.string().max(80).optional().nullable(),
  bodyType: z.string().max(80).optional().nullable(),
  fuelType: z.string().max(80).optional().nullable(),
  transmission: z.string().max(80).optional().nullable(),
  engineCapacity: z.string().max(40).optional().nullable(),
  horsepower: z.number().min(0).optional().nullable(),
  torque: z.number().min(0).optional().nullable(),
  mileage: z.number().min(0).optional().nullable(),
  seatingCapacity: z.number().int().min(1).max(60).optional().nullable(),
  groundClearance: z.number().min(0).optional().nullable(),
  bootSpace: z.number().min(0).optional().nullable(),
  safetyRating: z.number().min(0).max(5).optional().nullable(),
  exShowroomPrice: z.number().min(0).optional().nullable(),
  estimatedOnRoadPrice: z.number().min(0).optional().nullable(),
  warranty: z.string().max(200).optional().nullable(),
  description: z.string().max(10000).optional().nullable(),
  specifications: jsonValueSchema.optional().nullable(),
  pros: jsonValueSchema.optional().nullable(),
  cons: jsonValueSchema.optional().nullable(),
  imageUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  brochureUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  brochureMediaId: uuidSchema.optional().nullable(),
  videoUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  affiliateUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  expertRating: z.number().min(0).max(5).optional().nullable(),
  featured: z.boolean().default(false),
  sponsored: z.boolean().default(false),
  status: publishStatusSchema.default('DRAFT'),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
  galleryImages: z.array(automobileGalleryImageSchema).max(24).optional(),
  reviewIds: z.array(uuidSchema).max(20).optional(),
});

export const updateAutomobileVehicleSchema = createAutomobileVehicleSchema.partial();

export const automobileAffiliateClickSchema = z.object({
  entityType: z.string().min(1).max(80).default('automobile_vehicle'),
  entityId: uuidSchema,
  affiliateUrl: z.string().url().max(500),
  sessionId: z.string().max(120).optional().nullable(),
  referrer: z.string().max(500).optional().nullable(),
});

export const automobileAffiliateLeadSchema = z.object({
  entityType: z.string().min(1).max(80).default('automobile_vehicle'),
  entityId: uuidSchema,
  affiliateUrl: z.string().url().max(500).optional().nullable(),
  leadType: z.string().max(80).default('interest'),
  name: z.string().max(120).optional().nullable(),
  email: z.string().email().max(200).optional().nullable().or(z.literal('')),
  phone: z.string().max(40).optional().nullable(),
  sessionId: z.string().max(120).optional().nullable(),
  referrer: z.string().max(500).optional().nullable(),
});

export const automobileLinkReviewSchema = z.object({
  reviewId: uuidSchema,
});

export const createAutomobileMaintenanceSchema = z.object({
  vehicleId: uuidSchema,
  title: z.string().min(1).max(150),
  serviceInterval: z.string().min(1).max(120),
  estimatedCost: z.number().min(0).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const updateAutomobileMaintenanceSchema = createAutomobileMaintenanceSchema.partial().omit({ vehicleId: true });

export const automobileListQuerySchema = cursorPaginationQuerySchema.extend({
  status: publishStatusSchema.optional(),
  manufacturerId: uuidSchema.optional(),
  category: z.string().max(80).optional(),
  fuelType: z.string().max(80).optional(),
  featured: z.coerce.boolean().optional(),
  bodyType: z.string().max(80).optional(),
});

export const automobileCompareQuerySchema = z.object({
  ids: z
    .string()
    .min(1)
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean))
    .pipe(z.array(uuidSchema).min(2).max(6)),
});

export const createAutomobileComparisonSchema = z
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
    message: 'At least two vehicle IDs are required.',
  });

export type CreateAutomobileManufacturerInput = z.infer<typeof createAutomobileManufacturerSchema>;
export type UpdateAutomobileManufacturerInput = z.infer<typeof updateAutomobileManufacturerSchema>;
export type CreateAutomobileVehicleInput = z.infer<typeof createAutomobileVehicleSchema>;
export type UpdateAutomobileVehicleInput = z.infer<typeof updateAutomobileVehicleSchema>;
export type CreateAutomobileMaintenanceInput = z.infer<typeof createAutomobileMaintenanceSchema>;
export type UpdateAutomobileMaintenanceInput = z.infer<typeof updateAutomobileMaintenanceSchema>;
export type AutomobileListQuery = z.infer<typeof automobileListQuerySchema>;
export type AutomobileCompareQuery = z.infer<typeof automobileCompareQuerySchema>;
export type CreateAutomobileComparisonInput = z.infer<typeof createAutomobileComparisonSchema>;
export type AutomobileAffiliateClickInput = z.infer<typeof automobileAffiliateClickSchema>;
export type AutomobileAffiliateLeadInput = z.infer<typeof automobileAffiliateLeadSchema>;
export type AutomobileGalleryImageInput = z.infer<typeof automobileGalleryImageSchema>;
