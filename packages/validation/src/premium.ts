import { z } from 'zod';
import { cursorPaginationQuerySchema, jsonValueSchema, slugSchema, uuidSchema } from './common';

export const billingCycleSchema = z.enum(['monthly', 'yearly']);

export const createPlanSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional().nullable(),
  priceMonthly: z.number().nonnegative().optional().nullable(),
  priceYearly: z.number().nonnegative().optional().nullable(),
  features: jsonValueSchema.optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updatePlanSchema = createPlanSchema.partial();

export const subscribePlanSchema = z.object({
  planId: uuidSchema,
  billingCycle: billingCycleSchema.default('monthly'),
});

export const premiumSubscriptionListQuerySchema = cursorPaginationQuerySchema.extend({
  status: z.enum(['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED']).optional(),
  userId: uuidSchema.optional(),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type SubscribePlanInput = z.infer<typeof subscribePlanSchema>;
export type PremiumSubscriptionListQuery = z.infer<typeof premiumSubscriptionListQuerySchema>;
export type BillingCycle = z.infer<typeof billingCycleSchema>;
