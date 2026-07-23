import { SetMetadata } from '@nestjs/common';
import type { RoleSlug } from '@varnarc/types';

export const ROLES_KEY = 'roles';
export const RequireRoles = (...roles: RoleSlug[]) => SetMetadata(ROLES_KEY, roles);
