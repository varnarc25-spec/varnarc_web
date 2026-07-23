import { z } from 'zod';
import { jsonValueSchema } from './common';

export const notificationChannelSchema = z.enum(['IN_APP', 'EMAIL', 'PUSH']);

export const notificationListQuerySchema = z.object({
  unreadOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const notificationTemplateListQuerySchema = z.object({
  search: z.string().optional(),
  channel: notificationChannelSchema.optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const createNotificationTemplateSchema = z.object({
  slug: z.string().min(1).max(80).regex(/^[a-z0-9._-]+$/),
  name: z.string().min(1).max(200),
  channel: notificationChannelSchema.default('IN_APP'),
  subject: z.string().max(200).optional().nullable(),
  body: z.string().min(1).max(10000),
});

export const updateNotificationTemplateSchema = createNotificationTemplateSchema.partial();

export const broadcastNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  channel: notificationChannelSchema.default('IN_APP'),
  templateSlug: z.string().optional(),
  variables: z.record(z.string()).optional(),
  audience: z.enum(['all', 'role', 'users']).default('all'),
  roleSlug: z.string().optional(),
  userIds: z.array(z.string().uuid()).max(500).optional(),
  metadata: jsonValueSchema.optional(),
});

export const notificationProvidersSchema = z.object({
  emailProvider: z.enum(['none', 'smtp', 'sendgrid', 'ses', 'resend']).default('none'),
  smtpHost: z.string().max(200).optional().nullable(),
  smtpPort: z.coerce.number().int().min(1).max(65535).optional().nullable(),
  smtpUser: z.string().max(200).optional().nullable(),
  sendgridApiKeySet: z.boolean().optional(),
  sesRegion: z.string().max(80).optional().nullable(),
  resendApiKeySet: z.boolean().optional(),
  pushProvider: z.enum(['none', 'fcm']).default('none'),
  queueEnabled: z.boolean().optional(),
});

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
export type NotificationTemplateListQuery = z.infer<typeof notificationTemplateListQuerySchema>;
export type CreateNotificationTemplateInput = z.infer<typeof createNotificationTemplateSchema>;
export type UpdateNotificationTemplateInput = z.infer<typeof updateNotificationTemplateSchema>;
export type BroadcastNotificationInput = z.infer<typeof broadcastNotificationSchema>;
export type NotificationProvidersInput = z.infer<typeof notificationProvidersSchema>;
