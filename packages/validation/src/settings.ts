import { z } from 'zod';
import { jsonValueSchema, publishStatusSchema, slugSchema, uuidSchema } from './common';

const optionalUrl = z.union([z.string().url(), z.literal(''), z.null()]).optional();
const optionalEmail = z.union([z.string().email(), z.literal(''), z.null()]).optional();

export const generalSettingsSchema = z.object({
  siteName: z.string().min(1).max(120).default('Varnarc'),
  siteTagline: z.string().max(200).optional().nullable(),
  logoUrl: optionalUrl,
  faviconUrl: optionalUrl,
  contactEmail: optionalEmail,
  contactPhone: z.string().max(40).optional().nullable(),
  copyrightText: z.string().max(300).optional().nullable(),
  companyName: z.string().max(150).optional().nullable(),
  companyAddress: z.string().max(500).optional().nullable(),
  timezone: z.string().max(60).default('UTC'),
  locale: z.string().max(10).default('en'),
});

export const maintenanceSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  message: z.string().max(1000).optional().nullable(),
  readOnly: z.boolean().default(false),
  scheduledFrom: z.string().datetime().optional().nullable(),
  scheduledUntil: z.string().datetime().optional().nullable(),
  allowedIps: z.array(z.string()).default([]),
  bypassRoles: z.array(z.string()).default([]),
});

export const securitySettingsSchema = z.object({
  rateLimitPerMinute: z.number().int().min(1).max(10000).default(120),
  corsOrigins: z.array(z.string()).default([]),
  cspEnabled: z.boolean().default(false),
  cspReportOnly: z.boolean().default(true),
  allowedOrigins: z.array(z.string()).default([]),
  apiKeyRequired: z.boolean().default(false),
  passwordMinLength: z.number().int().min(6).max(128).default(8),
});

export const cmsDefaultsSettingsSchema = z.object({
  defaultArticleStatus: publishStatusSchema.default('DRAFT'),
  autoSaveEnabled: z.boolean().default(true),
  autoSaveIntervalSeconds: z.number().int().min(10).max(600).default(60),
  revisionLimit: z.number().int().min(0).max(500).default(50),
});

export const seoDefaultsSettingsSchema = z.object({
  defaultTitle: z.string().max(70).optional().nullable(),
  defaultDescription: z.string().max(160).optional().nullable(),
  defaultOgImage: optionalUrl,
  titleSeparator: z.string().max(10).default('|'),
  robotsIndexDefault: z.boolean().default(true),
});

export const upsertSettingSchema = z.object({
  key: z.string().min(1).max(120),
  value: jsonValueSchema,
  group: z.string().min(1).max(60).default('general'),
});

export const upsertFeatureFlagSchema = z.object({
  key: z.string().min(1).max(120),
  name: z.string().min(1).max(150),
  description: z.string().max(500).optional().nullable(),
  enabled: z.boolean().default(false),
  metadata: jsonValueSchema.optional().nullable(),
});

export const createHomepageLayoutSchema = z.object({
  name: z.string().min(1).max(150),
  slug: slugSchema,
  isDefault: z.boolean().default(false),
  sections: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        sortOrder: z.number().int().nonnegative().default(0),
        settings: jsonValueSchema.optional().nullable(),
        widgets: z
          .array(
            z.object({
              widgetId: uuidSchema,
              sortOrder: z.number().int().nonnegative().default(0),
              settings: jsonValueSchema.optional().nullable(),
            }),
          )
          .default([]),
      }),
    )
    .default([]),
});

export const updateHomepageLayoutSchema = createHomepageLayoutSchema;

export type GeneralSettingsInput = z.infer<typeof generalSettingsSchema>;
export type MaintenanceSettingsInput = z.infer<typeof maintenanceSettingsSchema>;
export type SecuritySettingsInput = z.infer<typeof securitySettingsSchema>;
export type CmsDefaultsSettingsInput = z.infer<typeof cmsDefaultsSettingsSchema>;
export type SeoDefaultsSettingsInput = z.infer<typeof seoDefaultsSettingsSchema>;
export type UpsertSettingInput = z.infer<typeof upsertSettingSchema>;
export type UpsertFeatureFlagInput = z.infer<typeof upsertFeatureFlagSchema>;
export type CreateHomepageLayoutInput = z.infer<typeof createHomepageLayoutSchema>;
export type UpdateHomepageLayoutInput = z.infer<typeof updateHomepageLayoutSchema>;
