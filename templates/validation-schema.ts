import { z } from 'zod';
import { cursorPaginationQuerySchema, uuidSchema } from './common';

/** Example list query — extend shared pagination helpers. */
export const exampleListQuerySchema = cursorPaginationQuerySchema.extend({
  status: z.enum(['active', 'archived']).optional(),
  ownerId: uuidSchema.optional(),
});

export const createExampleSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional().nullable(),
});

export type ExampleListQuery = z.infer<typeof exampleListQuerySchema>;
export type CreateExampleInput = z.infer<typeof createExampleSchema>;
