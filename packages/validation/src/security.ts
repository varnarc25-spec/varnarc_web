import { z } from 'zod';
import { cursorPaginationQuerySchema } from './common';

export const SECURITY_EVENT_TYPES = {
  AUTH_FAILURE: 'auth.failure',
  AUTH_LOGOUT: 'auth.logout',
  PERMISSION_DENIED: 'permission.denied',
  RATE_LIMIT: 'rate_limit.exceeded',
  SESSION_REVOKED: 'session.revoked',
  SETTINGS_CHANGED: 'settings.changed',
  UPLOAD_REJECTED: 'upload.rejected',
} as const;

export const securityEventSeveritySchema = z.enum(['info', 'low', 'medium', 'high', 'critical']);
export const securityEventStatusSchema = z.enum(['open', 'acknowledged', 'resolved']);

export const securityEventsQuerySchema = cursorPaginationQuerySchema.extend({
  eventType: z.string().max(120).optional(),
  severity: securityEventSeveritySchema.optional(),
  status: securityEventStatusSchema.optional(),
  userId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const revokeSessionsSchema = z.object({
  userId: z.string().uuid().optional(),
  auth0UserId: z.string().min(1).max(200).optional(),
  reason: z.string().max(500).optional(),
}).refine((data) => data.userId || data.auth0UserId, {
  message: 'userId or auth0UserId is required',
});

export type SecurityEventsQuery = z.infer<typeof securityEventsQuerySchema>;
export type RevokeSessionsInput = z.infer<typeof revokeSessionsSchema>;
