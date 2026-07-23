import { z } from 'zod';
import { cursorPaginationQuerySchema, uuidSchema } from './common';

export const API_VERSION = '1.0.0';

export const WEBHOOK_EVENTS = [
  'article.published',
  'review.approved',
  'user.registered',
  'lead.created',
  'notification.delivered',
] as const;

export const apiLogListQuerySchema = cursorPaginationQuerySchema.extend({
  statusCode: z.coerce.number().int().optional(),
  path: z.string().optional(),
});

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(120),
  scopes: z.array(z.string().min(1).max(60)).default([]),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const updateApiKeySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  scopes: z.array(z.string().min(1).max(60)).optional(),
  enabled: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const createWebhookSchema = z.object({
  name: z.string().min(1).max(120),
  url: z.string().url(),
  secret: z.string().min(8).max(200).optional().nullable(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
  enabled: z.boolean().default(true),
});

export const updateWebhookSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  url: z.string().url().optional(),
  secret: z.string().min(8).max(200).optional().nullable(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1).optional(),
  enabled: z.boolean().optional(),
});

export const webhookTestSchema = z.object({
  event: z.enum(WEBHOOK_EVENTS).default('lead.created'),
  payload: z.record(z.unknown()).optional(),
});

export type ApiLogListQuery = z.infer<typeof apiLogListQuerySchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type UpdateApiKeyInput = z.infer<typeof updateApiKeySchema>;
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;
export type WebhookTestInput = z.infer<typeof webhookTestSchema>;
