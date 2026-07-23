export type RoleSlug =
  | 'super_admin'
  | 'admin'
  | 'editor'
  | 'author'
  | 'reviewer'
  | 'moderator'
  | 'premium_user'
  | 'user'
  | 'guest';

export type UserStatus = 'ACTIVE' | 'DISABLED' | 'PENDING' | 'DELETED';

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

export interface ApiSuccessBody<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface PaginatedMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CursorPaginatedMeta {
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export interface CursorPaginatedBody<T> {
  success: true;
  data: T[];
  meta: CursorPaginatedMeta;
}

export interface CurrentUser {
  id: string;
  auth0UserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  emailVerified: boolean;
  roles: RoleSlug[];
  permissions: string[];
}

export interface Auth0TokenClaims {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  aud?: string | string[];
  iss?: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  timestamp: string;
}
