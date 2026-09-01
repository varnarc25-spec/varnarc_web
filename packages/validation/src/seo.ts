import { z } from 'zod';
import { jsonValueSchema } from './common';

export const seoMetadataUpdateSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  metaKeywords: z.string().max(500).optional().nullable(),
  canonicalUrl: z.string().url().optional().nullable().or(z.literal('')),
  ogImage: z.string().url().optional().nullable().or(z.literal('')),
  robots: z.string().max(120).optional().nullable(),
  twitterCard: z.enum(['summary', 'summary_large_image']).optional().nullable(),
  schemaType: z.string().max(80).optional().nullable(),
  language: z.string().max(12).optional().nullable(),
  structuredData: jsonValueSchema.optional().nullable(),
});

export const seoListQuerySchema = z.object({
  search: z.string().optional(),
  entityType: z.string().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const seoRedirectListQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const createSeoRedirectSchema = z.object({
  sourcePath: z.string().min(1).max(500),
  targetPath: z.string().min(1).max(1000),
  redirectType: z.union([z.literal(301), z.literal(302)]).default(301),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE'),
});

export const updateSeoRedirectSchema = createSeoRedirectSchema.partial();

export const bulkSeoRedirectImportSchema = z.object({
  redirects: z.array(createSeoRedirectSchema).min(1).max(500),
});

export const seoAuditListQuerySchema = z.object({
  resolved: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  severity: z.enum(['info', 'warning', 'error']).optional(),
  issueType: z.string().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const seoRobotsSettingsSchema = z.object({
  disallow: z.array(z.string()).default([]),
  allow: z.array(z.string()).default(['/']),
  crawlDelay: z.number().int().min(0).optional().nullable(),
});

export const seoIntegrationsSchema = z.object({
  googleSearchConsoleVerified: z.boolean().optional(),
  googleSearchConsoleSiteUrl: z.string().url().optional().nullable().or(z.literal('')),
  bingWebmasterVerified: z.boolean().optional(),
});

export type SeoMetadataUpdateInput = z.infer<typeof seoMetadataUpdateSchema>;
export type CreateSeoRedirectInput = z.infer<typeof createSeoRedirectSchema>;
export type UpdateSeoRedirectInput = z.infer<typeof updateSeoRedirectSchema>;
export type BulkSeoRedirectImportInput = z.infer<typeof bulkSeoRedirectImportSchema>;
export type SeoListQuery = z.infer<typeof seoListQuerySchema>;
export type SeoRedirectListQuery = z.infer<typeof seoRedirectListQuerySchema>;
export type SeoAuditListQuery = z.infer<typeof seoAuditListQuerySchema>;
export type SeoRobotsSettingsInput = z.infer<typeof seoRobotsSettingsSchema>;
export type SeoIntegrationsInput = z.infer<typeof seoIntegrationsSchema>;

/** Root sitemap types listed in `/sitemap.xml` (shared web + API). */
export const SITEMAP_TYPES = [
  'articles',
  'pages',
  'reviews',
  'calculators',
  'ai-tools',
  'directory',
  'comparisons',
  'finance',
  'construction',
  'automobile',
  'images',
] as const;

export type SitemapType = (typeof SITEMAP_TYPES)[number];

/**
 * Paths that must always be Disallowed for Google indexing (private / user-specific).
 * Merged into robots.txt even if admin settings try to clear disallow.
 */
export const SEO_REQUIRED_DISALLOW_PATHS = [
  '/profile',
  '/bookmarks',
  '/saved-calculations',
  '/construction/projects',
  '/construction/project/',
  '/construction/saved-calculations',
  '/construction/price-alerts',
  '/construction/document-vault',
  '/notifications',
  '/preferences',
  '/subscriptions',
  '/membership',
  '/activity',
  '/reading-history',
  '/api/',
  '/newsletter/unsubscribe',
  '/admin',
] as const;

export const SEO_DEFAULT_ALLOW_PATHS = ['/'] as const;

/** Merge admin/custom disallow with required private paths (deduped, required always kept). */
export function mergeSeoDisallowPaths(custom?: string[] | null): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const path of [...(custom ?? []), ...SEO_REQUIRED_DISALLOW_PATHS]) {
    const p = path.trim();
    if (!p || seen.has(p)) continue;
    seen.add(p);
    out.push(p);
  }
  return out;
}
