import { z } from 'zod';
import { cursorPaginationQuerySchema } from './common';

const optionalEmail = z.union([z.string().email(), z.literal(''), z.null()]).optional();

export const contactSettingsSchema = z.object({
  emailEnabled: z.boolean().default(true),
  emailProvider: z.enum(['resend', 'smtp']).default('resend'),
  fromEmail: z.string().max(200).optional().nullable(),
  toGeneral: optionalEmail,
  toEditorial: optionalEmail,
  toBusiness: optionalEmail,
  toSupport: optionalEmail,
  toPrivacy: optionalEmail,
  publicContactEmail: optionalEmail,
  /** Write-only on PUT. Never returned in GET payloads. */
  resendApiKey: z.string().max(200).optional().nullable(),
  smtpHost: z.string().max(255).optional().nullable(),
  smtpPort: z.coerce.number().int().min(1).max(65535).default(587),
  smtpSecure: z.boolean().default(false),
  smtpUsername: z.string().max(255).optional().nullable(),
  /** Write-only on PUT. Never returned in GET payloads. */
  smtpPassword: z.string().max(500).optional().nullable(),
});

export const contactSettingsPublicSchema = contactSettingsSchema
  .omit({ resendApiKey: true, smtpPassword: true })
  .extend({
    resendApiKeyConfigured: z.boolean().default(false),
    envApiKeyConfigured: z.boolean().default(false),
    smtpPasswordConfigured: z.boolean().default(false),
  });

export const createContactMessageSchema = z.object({
  topic: z.string().min(1).max(80),
  name: z.string().min(2).max(120),
  email: z.string().email().max(254),
  subject: z.string().min(1).max(160),
  message: z.string().min(10).max(5000),
  company: z.string().max(160).optional().nullable(),
  orgWebsite: z.string().max(500).optional().nullable(),
  pageUrl: z.string().max(500).optional().nullable(),
  correctionIssue: z.string().max(80).optional().nullable(),
  supportIssue: z.string().max(80).optional().nullable(),
  supportFeature: z.string().max(200).optional().nullable(),
  faxNumber: z.string().max(200).optional().nullable(),
  formStartedAt: z.coerce.number().optional().nullable(),
});

export const contactMessageListQuerySchema = cursorPaginationQuerySchema.extend({
  status: z.enum(['NEW', 'SENT', 'FAILED', 'SPAM', 'ARCHIVED']).optional(),
  topic: z.string().max(80).optional(),
  search: z.string().max(120).optional(),
});

export const updateContactMessageStatusSchema = z.object({
  status: z.enum(['NEW', 'SENT', 'FAILED', 'SPAM', 'ARCHIVED']),
});

export type ContactDestination = 'general' | 'editorial' | 'business' | 'support' | 'privacy';

export function contactDestinationForTopic(topic: string): ContactDestination {
  switch (topic) {
    case 'content-correction':
    case 'editorial':
    case 'feedback':
      return 'editorial';
    case 'partnership':
    case 'advertising':
    case 'business-listing':
    case 'service-provider':
    case 'other-commercial':
      return 'business';
    case 'technical-support':
    case 'support':
      return 'support';
    case 'privacy':
    case 'privacy-request':
    case 'data-request':
      return 'privacy';
    default:
      return 'general';
  }
}

export type ContactSettingsInput = z.infer<typeof contactSettingsSchema>;
export type ContactSettingsPublic = z.infer<typeof contactSettingsPublicSchema>;
export type CreateContactMessageInput = z.infer<typeof createContactMessageSchema>;
export type ContactMessageListQuery = z.infer<typeof contactMessageListQuerySchema>;
export type UpdateContactMessageStatusInput = z.infer<typeof updateContactMessageStatusSchema>;
