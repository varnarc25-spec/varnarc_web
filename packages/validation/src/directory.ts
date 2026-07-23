import { z } from 'zod';
import { businessStatusSchema, jsonValueSchema, slugSchema, uuidSchema } from './common';

export const listingTypeSchema = z.enum(['FREE', 'VERIFIED', 'FEATURED', 'SPONSORED', 'PREMIUM']);
export const verificationStatusSchema = z.enum(['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED']);
export const leadStatusSchema = z.enum(['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED']);
export const directoryEventTypeSchema = z.enum([
  'VIEW',
  'PROFILE_CLICK',
  'WEBSITE_CLICK',
  'PHONE_CLICK',
  'WHATSAPP_CLICK',
  'EMAIL_CLICK',
  'LEAD_REQUEST',
  'SEARCH',
]);

export const createBusinessCategorySchema = z.object({
  name: z.string().min(1).max(150),
  slug: slugSchema,
  parentId: uuidSchema.optional().nullable(),
  icon: z.string().max(120).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateBusinessCategorySchema = createBusinessCategorySchema.partial();

export const businessLocationSchema = z.object({
  label: z.string().max(100).optional().nullable(),
  address1: z.string().min(1).max(255),
  address2: z.string().max(255).optional().nullable(),
  city: z.string().min(1).max(120),
  state: z.string().max(120).optional().nullable(),
  district: z.string().max(120).optional().nullable(),
  locality: z.string().max(120).optional().nullable(),
  postalCode: z.string().max(40).optional().nullable(),
  country: z.string().min(2).max(80),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  googleMapsUrl: z.string().url().optional().nullable().or(z.literal('')),
});

export const businessHoursSchema = z.object({
  day: z.number().int().min(0).max(6),
  openTime: z.string().max(10).optional().nullable(),
  closeTime: z.string().max(10).optional().nullable(),
  isClosed: z.boolean().optional(),
});

export const businessMediaSchema = z.object({
  mediaId: uuidSchema.optional().nullable(),
  url: z.string().url().optional().nullable().or(z.literal('')),
  kind: z.string().max(40).default('gallery'),
  sortOrder: z.number().int().min(0).optional(),
  caption: z.string().max(500).optional().nullable(),
});

export const businessFaqSchema = z.object({
  question: z.string().min(1).max(300),
  answer: z.string().min(1).max(2000),
});

export const createBusinessSchema = z.object({
  name: z.string().min(1).max(200),
  slug: slugSchema,
  description: z.string().max(5000).optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal('')),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  whatsapp: z.string().max(40).optional().nullable(),
  contactPerson: z.string().max(150).optional().nullable(),
  socialLinks: jsonValueSchema.optional().nullable(),
  logoUrl: z.string().url().optional().nullable().or(z.literal('')),
  coverImageUrl: z.string().url().optional().nullable().or(z.literal('')),
  pricing: z.string().max(500).optional().nullable(),
  certifications: jsonValueSchema.optional().nullable(),
  faqs: z.array(businessFaqSchema).optional().nullable(),
  listingType: listingTypeSchema.default('FREE'),
  verificationStatus: verificationStatusSchema.optional(),
  featured: z.boolean().optional(),
  sponsored: z.boolean().optional(),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
  status: businessStatusSchema.default('PENDING'),
  categoryIds: z.array(uuidSchema).default([]),
  locations: z.array(businessLocationSchema).default([]),
  services: z
    .array(
      z.object({
        name: z.string().min(1).max(150),
        description: z.string().max(1000).optional().nullable(),
      }),
    )
    .default([]),
  products: z
    .array(
      z.object({
        name: z.string().min(1).max(150),
        description: z.string().max(1000).optional().nullable(),
        price: z.string().max(80).optional().nullable(),
      }),
    )
    .default([]),
  hours: z.array(businessHoursSchema).default([]),
  media: z.array(businessMediaSchema).default([]),
  metadata: jsonValueSchema.optional().nullable(),
});

export const updateBusinessSchema = createBusinessSchema.partial();

export const directoryListingsQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  direction: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  status: businessStatusSchema.optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  featured: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === true || v === 'true')),
  sponsored: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === true || v === 'true')),
  verified: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === true || v === 'true')),
  listingType: listingTypeSchema.optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(0.1).max(500).optional(),
  openNow: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === true || v === 'true')),
  topRated: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === true || v === 'true')),
  mostReviewed: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === true || v === 'true')),
  minRating: z.coerce.number().min(1).max(5).optional(),
  sort: z.enum(['recent', 'popular', 'rating', 'reviews', 'name']).optional(),
});

export const directorySearchQuerySchema = directoryListingsQuerySchema;

export const createLeadRequestSchema = z.object({
  listingId: uuidSchema.optional(),
  businessId: uuidSchema.optional(),
  name: z.string().min(1).max(150),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  message: z.string().max(5000).optional().nullable(),
  leadType: z.enum(['contact', 'quote', 'appointment', 'whatsapp', 'call', 'email']).default('contact'),
}).refine((v) => Boolean(v.listingId || v.businessId), {
  message: 'listingId or businessId is required',
});

export const updateLeadStatusSchema = z.object({
  status: leadStatusSchema,
});

export const directoryTrackEventSchema = z.object({
  eventType: directoryEventTypeSchema,
  metadata: jsonValueSchema.optional().nullable(),
});

export const directoryBulkActionSchema = z.object({
  ids: z.array(uuidSchema).min(1).max(100),
});

export const createBusinessReviewSchema = z.object({
  businessId: uuidSchema,
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional().nullable(),
  body: z.string().max(5000).optional().nullable(),
});

export type CreateBusinessCategoryInput = z.infer<typeof createBusinessCategorySchema>;
export type UpdateBusinessCategoryInput = z.infer<typeof updateBusinessCategorySchema>;
export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
export type DirectoryListingsQuery = z.infer<typeof directoryListingsQuerySchema>;
export type DirectorySearchQuery = z.infer<typeof directorySearchQuerySchema>;
export type CreateLeadRequestInput = z.infer<typeof createLeadRequestSchema>;
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;
export type DirectoryTrackEventInput = z.infer<typeof directoryTrackEventSchema>;
export type DirectoryBulkActionInput = z.infer<typeof directoryBulkActionSchema>;
export type CreateBusinessReviewInput = z.infer<typeof createBusinessReviewSchema>;
