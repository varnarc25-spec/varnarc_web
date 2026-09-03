import { z } from 'zod';
import { jsonValueSchema, slugSchema, uuidSchema } from './common';

export const createAiModelSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(150),
  provider: z.string().min(1).max(80),
  metadata: jsonValueSchema.optional().nullable(),
});

export const updateAiModelSchema = createAiModelSchema.partial();

export const createAiPromptSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(150),
  template: z.string().min(1).max(20000),
  modelId: uuidSchema.optional().nullable(),
  variables: jsonValueSchema.optional().nullable(),
});

export const updateAiPromptSchema = createAiPromptSchema.partial();

export const createAiJobSchema = z.object({
  promptId: uuidSchema.optional().nullable(),
  promptSlug: slugSchema.optional().nullable(),
  modelId: uuidSchema.optional().nullable(),
  input: jsonValueSchema,
  runImmediately: z.boolean().optional(),
});

export const runAiPromptTestSchema = z.object({
  promptId: uuidSchema.optional().nullable(),
  promptSlug: slugSchema.optional().nullable(),
  modelId: uuidSchema.optional().nullable(),
  variables: jsonValueSchema.optional().nullable(),
});

export const aiJobListQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  direction: z.enum(['forward', 'backward']).optional(),
  status: z.enum(['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED']).optional(),
  userId: z.string().uuid().optional(),
});

export const aiProviderSchema = z
  .object({
    slug: slugSchema,
    name: z.string().trim().min(1).max(150),
    baseUrl: z
      .string()
      .url()
      .max(500)
      .transform((value) => value.replace(/\/+$/, '')),
    defaultModel: z.string().trim().min(1).max(150),
    imageModel: z.string().trim().min(1).max(150).optional(),
    apiKeyEnvVar: z
      .string()
      .trim()
      .regex(/^[A-Z][A-Z0-9_]*$/, 'Must be an uppercase environment variable name')
      .max(100),
    priority: z.number().int().min(0).max(10000),
    isDefault: z.boolean(),
    isEnabled: z.boolean(),
  })
  .strict();

export const aiProvidersSchema = z
  .array(aiProviderSchema)
  .max(50)
  .superRefine((providers, ctx) => {
    const slugs = new Set<string>();
    let defaults = 0;
    providers.forEach((provider, index) => {
      if (slugs.has(provider.slug)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Provider slugs must be unique',
          path: [index, 'slug'],
        });
      }
      slugs.add(provider.slug);
      if (provider.isDefault) defaults += 1;
    });
    if (defaults > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Only one provider may be the default',
      });
    }
  });

export const createAiProviderSchema = aiProviderSchema;
export const updateAiProviderSchema = aiProviderSchema.partial().omit({ slug: true });

export { newsletterSubscribeSchema } from './newsletter';

export type CreateAiModelInput = z.infer<typeof createAiModelSchema>;
export type UpdateAiModelInput = z.infer<typeof updateAiModelSchema>;
export type CreateAiPromptInput = z.infer<typeof createAiPromptSchema>;
export type UpdateAiPromptInput = z.infer<typeof updateAiPromptSchema>;
export type CreateAiJobInput = z.infer<typeof createAiJobSchema>;
export type RunAiPromptTestInput = z.infer<typeof runAiPromptTestSchema>;
export type AiJobListQuery = z.infer<typeof aiJobListQuerySchema>;
export type AiProvider = z.infer<typeof aiProviderSchema>;
export type CreateAiProviderInput = z.infer<typeof createAiProviderSchema>;
export type UpdateAiProviderInput = z.infer<typeof updateAiProviderSchema>;
