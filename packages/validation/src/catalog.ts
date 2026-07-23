import { z } from 'zod';

export const catalogVerticalSchema = z.enum(['finance', 'construction', 'automobile']);

export const CATALOG_ENTITIES: Record<z.infer<typeof catalogVerticalSchema>, string[]> = {
  finance: ['banks', 'loans', 'credit-cards', 'insurance', 'investments', 'interest-rates'],
  construction: ['brands', 'materials'],
  automobile: ['manufacturers', 'vehicles'],
};

export const catalogImportQuerySchema = z.object({
  vertical: catalogVerticalSchema,
  entity: z.string().min(1).max(60),
  batchSize: z.coerce.number().int().min(50).max(2000).default(500),
  reindex: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => v === true || v === 'true'),
});

export const catalogReindexSchema = z.object({
  modules: z
    .array(z.enum(['finance', 'construction', 'automobile', 'directory', 'ai-tools', 'calculators']))
    .optional(),
});

export type CatalogVertical = z.infer<typeof catalogVerticalSchema>;
export type CatalogImportQuery = z.infer<typeof catalogImportQuerySchema>;
export type CatalogReindexInput = z.infer<typeof catalogReindexSchema>;
