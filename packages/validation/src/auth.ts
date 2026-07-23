import { z } from 'zod';
import { slugSchema, uuidSchema } from './common';

export {
  updateProfileSchema,
  type UpdateProfileInput,
} from './users';

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'DISABLED', 'PENDING']),
});

export const assignUserRolesSchema = z.object({
  roleIds: z.array(uuidSchema).min(0),
});

export const createRoleSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  permissionIds: z.array(uuidSchema).default([]),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional().nullable(),
  permissionIds: z.array(uuidSchema).optional(),
});

export const authSyncSchema = z.object({
  sub: z.string().min(1).optional(),
  email: z.string().email().optional(),
  email_verified: z.boolean().optional(),
  name: z.string().optional(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
  picture: z.string().url().optional().or(z.literal('')),
});

export type AssignUserRolesInput = z.infer<typeof assignUserRolesSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
