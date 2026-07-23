import { z } from 'zod';

export const analyticsEventTypes = [
  'page_view',
  'search',
  'click',
  'scroll',
  'download',
  'share',
  'bookmark',
  'contact_form',
  'lead_request',
  'affiliate_click',
  'advertisement_click',
  'advertisement_impression',
  'calculator_usage',
  'tool_view',
  'listing_view',
  'phone_click',
  'whatsapp_click',
  'website_click',
  'review_read',
  'rating_submit',
  'comparison_view',
  'custom',
] as const;

export const analyticsAggregationPeriods = ['day', 'week', 'month', 'quarter', 'year', 'custom'] as const;

export const analyticsExportFormats = ['csv', 'excel', 'pdf'] as const;

export const trackAnalyticsEventSchema = z.object({
  eventType: z.enum(analyticsEventTypes),
  entityType: z.string().max(80).optional(),
  entityId: z.string().uuid().optional(),
  sessionId: z.string().max(120).optional(),
  path: z.string().max(500).optional(),
  referrer: z.string().max(1000).optional(),
  metadata: z.record(z.unknown()).optional(),
  source: z.string().max(120).optional(),
  medium: z.string().max(120).optional(),
  campaign: z.string().max(160).optional(),
});

export const trackAnalyticsEventsBatchSchema = z.object({
  events: z.array(trackAnalyticsEventSchema).min(1).max(50),
});

export const analyticsDateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  period: z.enum(analyticsAggregationPeriods).optional().default('month'),
});

export const analyticsDashboardQuerySchema = analyticsDateRangeSchema.extend({
  compare: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => (v === undefined ? false : v === true || v === 'true')),
});

export const analyticsReportsQuerySchema = analyticsDateRangeSchema.extend({
  report: z
    .enum([
      'overview',
      'content',
      'search',
      'ads',
      'affiliates',
      'revenue',
      'executive',
      'directory',
      'ai-tools',
      'calculators',
      'users',
      'system',
    ])
    .default('overview'),
});

export const adsenseRevenueImportSchema = z.object({
  revenue30d: z.coerce.number().min(0),
  impressions30d: z.coerce.number().int().min(0).optional(),
  currency: z.string().max(8).default('INR'),
  source: z.enum(['manual', 'csv', 'api']).default('manual'),
  notes: z.string().max(500).optional().nullable(),
});

export const analyticsExportQuerySchema = analyticsReportsQuerySchema.extend({
  format: z.enum(analyticsExportFormats).default('csv'),
});

export const analyticsEventsQuerySchema = z.object({
  eventType: z.enum(analyticsEventTypes).optional(),
  entityType: z.string().max(80).optional(),
  cursor: z.string().max(500).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const recordSystemMetricSchema = z.object({
  metricName: z.string().min(1).max(120),
  metricValue: z.coerce.number(),
  metadata: z.record(z.unknown()).optional(),
});

export const analyticsIntegrationsSchema = z.object({
  googleAnalyticsId: z.string().max(80).optional().nullable(),
  googleSearchConsole: z.boolean().optional(),
  cloudflareAnalytics: z.boolean().optional(),
  microsoftClarityId: z.string().max(80).optional().nullable(),
  plausibleDomain: z.string().max(160).optional().nullable(),
  openTelemetryEnabled: z.boolean().optional(),
  prometheusEnabled: z.boolean().optional(),
});

export type TrackAnalyticsEventInput = z.infer<typeof trackAnalyticsEventSchema>;
export type AnalyticsDashboardQuery = z.infer<typeof analyticsDashboardQuerySchema>;
export type AnalyticsReportsQuery = z.infer<typeof analyticsReportsQuerySchema>;
export type AnalyticsExportQuery = z.infer<typeof analyticsExportQuerySchema>;
export type AdsenseRevenueImportInput = z.infer<typeof adsenseRevenueImportSchema>;
