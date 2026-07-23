import { z } from 'zod';
import { jsonValueSchema, uuidSchema } from './common';

export const profileVisibilitySchema = z.enum(['PUBLIC', 'PRIVATE']);

export const updateProfileSchema = z.object({
  firstName: z.string().max(100).optional().nullable(),
  lastName: z.string().max(100).optional().nullable(),
  displayName: z.string().max(150).optional().nullable(),
  username: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9._-]+$/i)
    .optional()
    .nullable(),
  phone: z.string().max(30).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable().or(z.literal('')),
  bio: z.string().max(2000).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  language: z.string().max(12).optional().nullable(),
  timezone: z.string().max(80).optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal('')),
  socialLinks: z.record(z.string().url().or(z.literal(''))).optional().nullable(),
  profileVisibility: profileVisibilitySchema.optional(),
});

export const setAvatarSchema = z.object({
  mediaAssetId: uuidSchema,
});

export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional().nullable(),
  language: z.string().max(12).optional().nullable(),
  timezone: z.string().max(80).optional().nullable(),
  notificationSettings: jsonValueSchema.optional().nullable(),
  privacySettings: jsonValueSchema.optional().nullable(),
  newsletterOptIn: z.boolean().optional(),
});

export const bookmarkListQuerySchema = z.object({
  entityType: z.string().optional(),
  entityId: uuidSchema.optional(),
  collectionName: z.string().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const createBookmarkSchema = z.object({
  entityType: z.string().min(1).max(80),
  entityId: uuidSchema,
  collectionName: z.string().max(120).optional().nullable(),
});

export const activityListQuerySchema = z.object({
  activityType: z.string().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

/** Stored in `user_activity.activity_type` for reading history rows. */
export const READING_HISTORY_ACTIVITY_TYPE = 'content.viewed';

export const recordReadingHistorySchema = z.object({
  entityType: z.string().min(1).max(80),
  entityId: uuidSchema,
  metadata: jsonValueSchema.optional().nullable(),
});

export const readingHistoryListQuerySchema = z.object({
  entityType: z.string().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type RecordReadingHistoryInput = z.infer<typeof recordReadingHistorySchema>;
export type ReadingHistoryListQuery = z.infer<typeof readingHistoryListQuerySchema>;

export const contentSubscriptionTypeSchema = z.enum([
  'newsletter',
  'category',
  'topic',
  'tag',
  'author',
]);

export const contentSubscriptionSchema = z.object({
  subscriptionType: contentSubscriptionTypeSchema,
  target: z.string().min(1).max(200),
});

export const updateContentSubscriptionsSchema = z.object({
  subscriptions: z.array(contentSubscriptionSchema).max(200),
});

export const toggleContentSubscriptionSchema = z.object({
  subscriptionType: contentSubscriptionTypeSchema,
  target: z.string().min(1).max(200),
  subscribed: z.boolean(),
});

export const checkContentSubscriptionsSchema = z.object({
  items: z.array(contentSubscriptionSchema).max(50),
});

export const subscriptionFeedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export type ContentSubscriptionType = z.infer<typeof contentSubscriptionTypeSchema>;
export type ContentSubscriptionInput = z.infer<typeof contentSubscriptionSchema>;
export type ToggleContentSubscriptionInput = z.infer<typeof toggleContentSubscriptionSchema>;

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SetAvatarInput = z.infer<typeof setAvatarSchema>;
export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;
export type BookmarkListQuery = z.infer<typeof bookmarkListQuerySchema>;
export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;
export type ActivityListQuery = z.infer<typeof activityListQuerySchema>;
export type UpdateContentSubscriptionsInput = z.infer<typeof updateContentSubscriptionsSchema>;
export type CheckContentSubscriptionsInput = z.infer<typeof checkContentSubscriptionsSchema>;
