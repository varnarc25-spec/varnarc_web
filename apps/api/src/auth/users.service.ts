import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ProfileVisibility, UserStatus } from '@varnarc/database';
import type { Repositories, UserWithRoles } from '@varnarc/database';
import type { Auth0TokenClaims, CurrentUser, RoleSlug } from '@varnarc/types';
import { AUTH_ERROR_CODES } from '@varnarc/auth';
import type {
  AssignUserRolesInput,
  PaginationQuery,
  UpdateProfileInput,
} from '@varnarc/validation';
import { REPOS } from '../database/database.module';

@Injectable()
export class UsersService {
  constructor(@Inject(REPOS) private readonly repos: Repositories) {}

  async findCurrentUserByAuth0Sub(auth0UserId: string): Promise<CurrentUser> {
    const user = await this.repos.users.findByAuth0UserId(auth0UserId);

    if (!user) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: AUTH_ERROR_CODES.UNAUTHORIZED,
          message: 'User profile not synchronized. Call POST /api/v1/auth/sync.',
        },
      });
    }

    this.assertActive(user);
    return this.toCurrentUser(user);
  }

  /**
   * Ensures a local user exists for Auth0 claims (first login / every JWT validation).
   * Does not write login_history — use syncFromAuth0 for that.
   */
  async ensureFromAuth0Claims(claims: Auth0TokenClaims): Promise<CurrentUser> {
    if (!claims.sub) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: AUTH_ERROR_CODES.TOKEN_INVALID,
          message: 'Invalid Auth0 token claims.',
        },
      });
    }

    const existing = await this.repos.users.findByAuth0UserId(claims.sub);

    if (existing) {
      this.assertActive(existing);
      return this.toCurrentUser(existing);
    }

    return this.syncFromAuth0(claims, undefined, { recordLogin: false });
  }

  async syncFromAuth0(
    claims: Auth0TokenClaims,
    meta?: {
      ipAddress?: string;
      device?: string;
      browser?: string;
      operatingSystem?: string;
      country?: string;
    },
    options: { recordLogin?: boolean } = { recordLogin: true },
  ): Promise<CurrentUser> {
    if (!claims.sub) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: AUTH_ERROR_CODES.TOKEN_INVALID,
          message: 'Invalid Auth0 token claims.',
        },
      });
    }

    const email = claims.email ?? `${claims.sub.replace('|', '_')}@users.auth0.local`;
    const displayName = claims.name ?? claims.given_name ?? email.split('@')[0] ?? null;
    const existing = await this.repos.users.findByAuth0UserIdAny(claims.sub);

    const user = await this.repos.users.upsertFromAuth0({
      auth0UserId: claims.sub,
      email,
      firstName: claims.given_name ?? null,
      lastName: claims.family_name ?? null,
      displayName,
      avatarUrl: claims.picture || null,
      emailVerified: Boolean(claims.email_verified),
    });

    if (!existing) {
      await this.repos.users.ensureRole(user.id, 'user');

      const bootstrapEmails = (process.env.BOOTSTRAP_ADMIN_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      if (email && bootstrapEmails.includes(email.toLowerCase())) {
        await this.repos.users.ensureRole(user.id, 'admin');
      }

      await this.repos.auditLogs.create({
        userId: user.id,
        action: 'user.sync.create',
        entity: 'user',
        entityId: user.id,
        newValue: { auth0UserId: claims.sub, email },
      });
    } else if (options.recordLogin !== false) {
      await this.repos.auditLogs.create({
        userId: user.id,
        action: 'user.sync.update',
        entity: 'user',
        entityId: user.id,
        newValue: { lastLoginAt: new Date().toISOString() },
      });
    }

    if (options.recordLogin !== false) {
      await this.repos.users.recordLogin(user.id, meta);
    }

    return this.findCurrentUserByAuth0Sub(claims.sub);
  }

  async list(query: PaginationQuery) {
    const { total, rows } = await this.repos.users.listOffset({
      page: query.page,
      pageSize: query.pageSize,
      order: query.order,
      search: query.search,
    });

    return {
      data: rows.map((u) => this.toAdminUser(u)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async getById(id: string) {
    const user = await this.repos.users.findById(id);
    if (!user) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found.' },
      });
    }
    return this.toAdminUser(user);
  }

  async getPublicProfileByUsername(username: string) {
    const user = await this.repos.users.findByUsername(username);
    if (
      !user ||
      user.profileVisibility !== ProfileVisibility.PUBLIC ||
      user.status !== UserStatus.ACTIVE
    ) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Author profile not found.' },
      });
    }

    const articles = await this.repos.articles.list({
      authorId: user.id,
      status: 'PUBLISHED',
      limit: 12,
      direction: 'desc',
    });

    type ArticleRow = {
      id: string;
      title: string;
      slug: string;
      excerpt: string | null;
      publishedAt: Date | null;
      readingTimeMinutes: number | null;
    };

    return {
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      website: user.website,
      socialLinks: user.socialLinks,
      articles: (articles.items as unknown as ArticleRow[]).map((article) => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        publishedAt: article.publishedAt,
        readingTimeMinutes: article.readingTimeMinutes,
      })),
    };
  }

  async updateProfile(userId: string, input: UpdateProfileInput, actorId: string) {
    const user = await this.repos.users.updateProfile(userId, {
      firstName: input.firstName === undefined ? undefined : input.firstName,
      lastName: input.lastName === undefined ? undefined : input.lastName,
      displayName: input.displayName === undefined ? undefined : input.displayName,
      username: input.username === undefined ? undefined : input.username,
      phone: input.phone === undefined ? undefined : input.phone,
      bio: input.bio === undefined ? undefined : input.bio,
      country: input.country === undefined ? undefined : input.country,
      state: input.state === undefined ? undefined : input.state,
      city: input.city === undefined ? undefined : input.city,
      language: input.language === undefined ? undefined : input.language,
      timezone: input.timezone === undefined ? undefined : input.timezone,
      website:
        input.website === undefined ? undefined : input.website === '' ? null : input.website,
      socialLinks:
        input.socialLinks === undefined
          ? undefined
          : input.socialLinks === null
            ? ({ set: null } as const)
            : input.socialLinks,
      profileVisibility: input.profileVisibility === undefined ? undefined : input.profileVisibility,
      avatarUrl:
        input.avatarUrl === undefined
          ? undefined
          : input.avatarUrl === ''
            ? null
            : input.avatarUrl,
      updatedBy: actorId,
    });

    await this.repos.auditLogs.create({
      userId: actorId,
      action: 'user.profile.update',
      entity: 'user',
      entityId: userId,
      newValue: input as object,
    });

    await this.repos.userActivity
      .record({
        userId,
        activityType: 'profile.updated',
        entityType: 'user',
        entityId: userId,
      })
      .catch(() => undefined);

    return this.toCurrentUser(user);
  }

  async updateStatus(userId: string, status: 'ACTIVE' | 'DISABLED' | 'PENDING', actorId: string) {
    const existing = await this.repos.users.findById(userId);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found.' },
      });
    }

    const user = await this.repos.users.updateStatus(userId, status as UserStatus);

    await this.repos.auditLogs.create({
      userId: actorId,
      action: 'user.status.update',
      entity: 'user',
      entityId: userId,
      oldValue: { status: existing.status },
      newValue: { status },
    });

    return this.toAdminUser(user);
  }

  async assignRoles(userId: string, input: AssignUserRolesInput, actorId: string) {
    const existing = await this.repos.users.findById(userId);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found.' },
      });
    }

    const result = await this.repos.users.assignRoles(userId, input.roleIds);
    if (!result.ok) {
      throw new BadRequestException({
        success: false,
        error: { code: 'INVALID_ROLES', message: 'One or more roles are invalid.' },
      });
    }

    await this.repos.auditLogs.create({
      userId: actorId,
      action: 'user.roles.assign',
      entity: 'user',
      entityId: userId,
      newValue: { roleIds: input.roleIds },
    });

    return this.getById(userId);
  }

  async softDelete(userId: string, actorId: string) {
    const deleted = await this.repos.users.softDelete(userId, actorId);
    if (!deleted) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found.' },
      });
    }
    await this.repos.auditLogs.create({
      userId: actorId,
      action: 'user.delete',
      entity: 'user',
      entityId: userId,
    });
    return { deleted: true };
  }

  async loginHistory(userId: string, query: PaginationQuery): Promise<{
    data: Array<{
      id: string;
      userId: string;
      ipAddress: string | null;
      device: string | null;
      browser: string | null;
      operatingSystem: string | null;
      country: string | null;
      loginTime: Date;
    }>;
    meta: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { total, rows } = await this.repos.users.listLoginHistory(
      userId,
      query.page,
      query.pageSize,
    );

    return {
      data: rows,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async auditLogs(userId: string, query: PaginationQuery): Promise<{
    data: Array<{
      id: string;
      userId: string | null;
      action: string;
      entity: string;
      entityId: string | null;
      oldValue: unknown;
      newValue: unknown;
      createdAt: Date;
    }>;
    meta: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { total, rows } = await this.repos.auditLogs.listOffset(
      userId,
      query.page,
      query.pageSize,
    );

    return {
      data: rows,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  buildStubCurrentUser(claims: Auth0TokenClaims): CurrentUser {
    return {
      id: '00000000-0000-4000-8000-000000000001',
      auth0UserId: claims.sub,
      email: claims.email ?? 'dev@varnarc.local',
      firstName: claims.given_name ?? 'Dev',
      lastName: claims.family_name ?? 'User',
      displayName: claims.name ?? 'Dev User',
      avatarUrl: claims.picture ?? null,
      status: 'ACTIVE',
      emailVerified: true,
      roles: ['admin'],
      permissions: [],
    };
  }

  private assertActive(user: { status: UserStatus }) {
    if (user.status === UserStatus.DISABLED) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: AUTH_ERROR_CODES.ACCOUNT_DISABLED,
          message: 'Account is disabled.',
        },
      });
    }
  }

  private toCurrentUser(user: UserWithRoles): CurrentUser {
    const roles = user.roles.map((ur) => ur.role.slug as RoleSlug);
    const permissions = [
      ...new Set(user.roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.slug))),
    ];

    return {
      id: user.id,
      auth0UserId: user.auth0UserId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      emailVerified: user.emailVerified,
      roles,
      permissions,
    };
  }

  private toAdminUser(user: UserWithRoles) {
    return {
      ...this.toCurrentUser(user),
      username: user.username,
      bio: user.bio,
      phone: user.phone,
      country: user.country,
      state: user.state,
      city: user.city,
      language: user.language,
      timezone: user.timezone,
      website: user.website,
      socialLinks: user.socialLinks,
      profileVisibility: user.profileVisibility,
      avatarMediaId: user.avatarMediaId,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roleDetails: user.roles.map((ur) => ({
        id: ur.role.id,
        slug: ur.role.slug,
        name: ur.role.name,
      })),
    };
  }
}
