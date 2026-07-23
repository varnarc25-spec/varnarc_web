import { z } from 'zod';
import {
  adContentTypeSchema,
  adProviderSchema,
  adRotationModeSchema,
  adStatusSchema,
  adTypeSchema,
  jsonValueSchema,
  slugSchema,
  uuidSchema,
} from './common';

const optionalUrl = z.string().url().optional().nullable().or(z.literal(''));

export const adTargetingSchema = z
  .object({
    pageTypes: z.array(z.string().min(1).max(60)).optional(),
    categoryIds: z.array(uuidSchema).optional(),
    articleIds: z.array(uuidSchema).optional(),
    reviewIds: z.array(uuidSchema).optional(),
    directoryIds: z.array(uuidSchema).optional(),
    calculatorIds: z.array(uuidSchema).optional(),
    devices: z.array(z.enum(['desktop', 'mobile', 'tablet'])).optional(),
  })
  .optional()
  .nullable();

export const createSponsorSchema = z.object({
  name: z.string().min(1).max(150),
  slug: slugSchema,
  website: optionalUrl,
  logoUrl: optionalUrl,
});

export const updateSponsorSchema = createSponsorSchema.partial();

export const createAdCampaignSchema = z.object({
  name: z.string().min(1).max(150),
  slug: slugSchema,
  description: z.string().max(2000).optional().nullable(),
  sponsorId: uuidSchema.optional().nullable(),
  status: adStatusSchema.default('DRAFT'),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  budget: z.number().nonnegative().optional().nullable(),
  priority: z.number().int().default(0),
  maxImpressions: z.number().int().positive().optional().nullable(),
  maxClicks: z.number().int().positive().optional().nullable(),
  utmSource: z.string().max(100).optional().nullable(),
  utmMedium: z.string().max(100).optional().nullable(),
  utmCampaign: z.string().max(100).optional().nullable(),
});

export const updateAdCampaignSchema = createAdCampaignSchema.partial();

export const createAdvertisementSchema = z.object({
  campaignId: uuidSchema,
  placementId: uuidSchema.optional().nullable(),
  name: z.string().min(1).max(150),
  slug: slugSchema,
  type: adTypeSchema.default('BANNER'),
  provider: adProviderSchema.default('DIRECT'),
  contentType: adContentTypeSchema.default('IMAGE'),
  status: adStatusSchema.default('DRAFT'),
  creativeUrl: optionalUrl,
  htmlContent: z.string().max(50_000).optional().nullable(),
  javascriptCode: z.string().max(20_000).optional().nullable(),
  targetUrl: optionalUrl,
  adsenseSlot: z.string().max(120).optional().nullable(),
  adsenseClient: z.string().max(120).optional().nullable(),
  priority: z.number().int().default(0),
  weight: z.number().int().positive().default(1),
  maxImpressions: z.number().int().positive().optional().nullable(),
  maxClicks: z.number().int().positive().optional().nullable(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  targeting: adTargetingSchema,
  metadata: jsonValueSchema.optional().nullable(),
});

export const updateAdvertisementSchema = createAdvertisementSchema
  .omit({ campaignId: true })
  .partial();

export const createAdPlacementSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  location: z.string().max(120).optional().nullable(),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  rotationMode: adRotationModeSchema.default('PRIORITY'),
});

export const updateAdPlacementSchema = createAdPlacementSchema.partial();

export const trackAdEventSchema = z.object({
  sessionId: z.string().max(120).optional().nullable(),
  pagePath: z.string().max(500).optional().nullable(),
  referrer: z.string().max(1000).optional().nullable(),
  userAgent: z.string().max(500).optional().nullable(),
  device: z.enum(['desktop', 'mobile', 'tablet']).optional().nullable(),
  destinationUrl: z.string().url().optional().nullable(),
});

export const placementQuerySchema = z.object({
  pageType: z.string().max(60).optional(),
  categoryId: uuidSchema.optional(),
  articleId: uuidSchema.optional(),
  reviewId: uuidSchema.optional(),
  directoryId: uuidSchema.optional(),
  calculatorId: uuidSchema.optional(),
  device: z.enum(['desktop', 'mobile', 'tablet']).optional(),
  limit: z.coerce.number().int().min(1).max(10).default(1),
});

export type CreateAdCampaignInput = z.infer<typeof createAdCampaignSchema>;
export type UpdateAdCampaignInput = z.infer<typeof updateAdCampaignSchema>;
export type CreateAdvertisementInput = z.infer<typeof createAdvertisementSchema>;
export type UpdateAdvertisementInput = z.infer<typeof updateAdvertisementSchema>;
export type CreateAdPlacementInput = z.infer<typeof createAdPlacementSchema>;
export type UpdateAdPlacementInput = z.infer<typeof updateAdPlacementSchema>;
export type TrackAdEventInput = z.infer<typeof trackAdEventSchema>;
export type PlacementQueryInput = z.infer<typeof placementQuerySchema>;
export type CreateSponsorInput = z.infer<typeof createSponsorSchema>;
