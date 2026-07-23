import { z } from 'zod';
import { cursorPaginationQuerySchema, slugSchema, uuidSchema } from './common';

export const newsletterSubscribeSchema = z.object({
  email: z.string().trim().email().max(320),
  source: z.string().trim().max(80).optional(),
});

export const newsletterUnsubscribeSchema = z.object({
  email: z.string().trim().email().max(320),
});

export const newsletterSubscriberListQuerySchema = cursorPaginationQuerySchema.extend({
  status: z.enum(['subscribed', 'unsubscribed', 'all']).default('all'),
  search: z.string().trim().max(200).optional(),
});

export const createNewsletterTemplateSchema = z.object({
  name: z.string().min(1).max(150),
  slug: slugSchema,
  subject: z.string().min(1).max(300),
  bodyHtml: z.string().min(1).max(100_000),
});

export const updateNewsletterTemplateSchema = createNewsletterTemplateSchema.partial();

export const newsletterTemplateListQuerySchema = cursorPaginationQuerySchema.extend({
  search: z.string().trim().max(200).optional(),
});

export const createNewsletterCampaignSchema = z.object({
  name: z.string().min(1).max(150),
  slug: slugSchema,
  templateId: uuidSchema.optional().nullable(),
  scheduledAt: z.coerce.date().optional().nullable(),
});

export const updateNewsletterCampaignSchema = createNewsletterCampaignSchema.partial();

export const newsletterCampaignListQuerySchema = cursorPaginationQuerySchema.extend({
  status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED', 'all']).default('all'),
});

export const sendNewsletterCampaignSchema = z.object({
  dryRun: z.boolean().default(false),
});

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;
export type NewsletterUnsubscribeInput = z.infer<typeof newsletterUnsubscribeSchema>;
export type NewsletterSubscriberListQuery = z.infer<typeof newsletterSubscriberListQuerySchema>;
export type CreateNewsletterTemplateInput = z.infer<typeof createNewsletterTemplateSchema>;
export type UpdateNewsletterTemplateInput = z.infer<typeof updateNewsletterTemplateSchema>;
export type NewsletterTemplateListQuery = z.infer<typeof newsletterTemplateListQuerySchema>;
export type CreateNewsletterCampaignInput = z.infer<typeof createNewsletterCampaignSchema>;
export type UpdateNewsletterCampaignInput = z.infer<typeof updateNewsletterCampaignSchema>;
export type NewsletterCampaignListQuery = z.infer<typeof newsletterCampaignListQuerySchema>;
export type SendNewsletterCampaignInput = z.infer<typeof sendNewsletterCampaignSchema>;
