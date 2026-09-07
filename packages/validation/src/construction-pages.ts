import { z } from 'zod';
import { uuidSchema } from './common';

export const CONSTRUCTION_PAGE_ENTITY_TYPE = 'construction_page';

export const constructionPageKeySchema = z.enum(['hub']);

export type ConstructionPageKey = z.infer<typeof constructionPageKeySchema>;

export const CONSTRUCTION_PAGE_IDS: Record<ConstructionPageKey, string> = {
  hub: 'c0000001-0000-4000-8000-000000000001',
};

export type ConstructionPageDefaults = {
  path: string;
  label: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  canonicalUrl?: string;
};

export const CONSTRUCTION_CMS_PAGE_DEFAULTS: Record<ConstructionPageKey, ConstructionPageDefaults> =
  {
    hub: {
      path: '/construction',
      label: 'Construction home',
      title: 'Plan Construction with Cost Estimators & Material Calculators | Varnarc',
      description:
        'Estimate construction costs, calculate materials, compare options and plan your project with transparent Varnarc construction tools.',
      h1: 'Plan your construction with confidence',
      intro:
        'Estimate costs, calculate materials, compare options and plan your project with transparent construction tools.',
      canonicalUrl: 'https://varnarc.com/construction',
    },
  };

export const CONSTRUCTION_CMS_PAGE_KEYS = constructionPageKeySchema.options;

export const updateConstructionPageSeoSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  h1: z.string().max(200).optional().nullable(),
  intro: z.string().max(500).optional().nullable(),
  metaKeywords: z.string().max(500).optional().nullable(),
  canonicalUrl: z.string().max(500).optional().nullable().or(z.literal('')),
  heroImageUrl: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .or(z.literal(''))
    .refine(
      (v) => !v || v.startsWith('/') || /^https?:\/\//i.test(v),
      'Must be a site path or absolute URL',
    ),
  heroImageMediaId: uuidSchema.optional().nullable(),
  heroImageAlt: z.string().max(300).optional().nullable(),
  heroImageTitle: z.string().max(200).optional().nullable(),
  heroImageWidth: z.coerce.number().int().min(120).max(800).optional().nullable(),
});

export type UpdateConstructionPageSeoInput = z.infer<typeof updateConstructionPageSeoSchema>;
