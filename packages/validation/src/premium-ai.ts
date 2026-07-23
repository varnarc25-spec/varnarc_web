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

export { newsletterSubscribeSchema } from './newsletter';

export type CreateAiModelInput = z.infer<typeof createAiModelSchema>;
export type UpdateAiModelInput = z.infer<typeof updateAiModelSchema>;
export type CreateAiPromptInput = z.infer<typeof createAiPromptSchema>;
export type UpdateAiPromptInput = z.infer<typeof updateAiPromptSchema>;
export type CreateAiJobInput = z.infer<typeof createAiJobSchema>;
export type RunAiPromptTestInput = z.infer<typeof runAiPromptTestSchema>;
export type AiJobListQuery = z.infer<typeof aiJobListQuerySchema>;
