import type { Prisma, PrismaClient, UserStatus } from '@prisma/client';
import {
  BaseRepository,
  findActiveById,
  listActiveWithCursor,
  softDeleteById,
} from '../base.repository';
import {
  paginateWithCursor,
  type CursorPage,
  type CursorPageParams,
} from '../../pagination';

const userInclude = {
  roles: {
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  },
} satisfies Prisma.UserInclude;

export type UserWithRoles = Prisma.UserGetPayload<{ include: typeof userInclude }>;
export { userInclude };

export class UserRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return findActiveById<UserWithRoles>(this.db.user, id, userInclude);
  }

  findByAuth0UserId(auth0UserId: string) {
    return this.db.user.findFirst({
      where: { auth0UserId, deletedAt: null },
      include: userInclude,
    });
  }

  countAll() {
    return this.db.user.count({ where: { deletedAt: null } });
  }

  countByStatus(status: UserStatus) {
    return this.db.user.count({ where: { deletedAt: null, status } });
  }

  countLoggedInSince(since: Date) {
    return this.db.user.count({
      where: { deletedAt: null, lastLoginAt: { gte: since } },
    });
  }

  /** Includes soft-deleted rows (Auth0 sync / reactivation). */
  findByAuth0UserIdAny(auth0UserId: string) {
    return this.db.user.findUnique({
      where: { auth0UserId },
      include: userInclude,
    });
  }

  findByEmail(email: string) {
    return this.db.user.findFirst({
      where: { email, deletedAt: null },
      include: userInclude,
    });
  }

  findByUsername(username: string) {
    return this.db.user.findFirst({
      where: { username, deletedAt: null },
      include: userInclude,
    });
  }

  list(
    params: CursorPageParams & {
      status?: UserStatus;
      search?: string;
    } = {},
  ): Promise<CursorPage<UserWithRoles>> {
    const where: Prisma.UserWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { email: { contains: params.search, mode: 'insensitive' } },
              { displayName: { contains: params.search, mode: 'insensitive' } },
              { firstName: { contains: params.search, mode: 'insensitive' } },
              { lastName: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return listActiveWithCursor(this.db.user, {
      ...params,
      where,
      include: userInclude,
    }) as Promise<CursorPage<UserWithRoles>>;
  }

  async listOffset(params: {
    page: number;
    pageSize: number;
    order?: 'asc' | 'desc';
    search?: string;
  }) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(params.search
        ? {
            OR: [
              { email: { contains: params.search, mode: 'insensitive' } },
              { displayName: { contains: params.search, mode: 'insensitive' } },
              { firstName: { contains: params.search, mode: 'insensitive' } },
              { lastName: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.db.user.count({ where }),
      this.db.user.findMany({
        where,
        include: userInclude,
        orderBy: { createdAt: params.order === 'asc' ? 'asc' : 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
    ]);

    return { total, rows: rows as UserWithRoles[] };
  }

  upsertFromAuth0(data: {
    auth0UserId: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
    emailVerified: boolean;
  }) {
    return this.db.user.upsert({
      where: { auth0UserId: data.auth0UserId },
      create: {
        auth0UserId: data.auth0UserId,
        email: data.email,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        displayName: data.displayName ?? null,
        avatarUrl: data.avatarUrl ?? null,
        emailVerified: data.emailVerified,
        status: 'ACTIVE',
        lastLoginAt: new Date(),
      },
      update: {
        email: data.email,
        firstName: data.firstName ?? undefined,
        lastName: data.lastName ?? undefined,
        displayName: data.displayName ?? undefined,
        avatarUrl: data.avatarUrl ?? undefined,
        emailVerified: data.emailVerified,
        lastLoginAt: new Date(),
        deletedAt: null,
      },
      include: userInclude,
    });
  }

  async ensureRole(userId: string, roleSlug: string) {
    const role = await this.db.role.findUnique({ where: { slug: roleSlug } });
    if (!role || role.deletedAt) return null;
    await this.db.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      update: {},
      create: { userId, roleId: role.id },
    });
    return role;
  }

  updateProfile(userId: string, data: Prisma.UserUpdateInput) {
    return this.db.user.update({
      where: { id: userId },
      data,
      include: userInclude,
    });
  }

  updateStatus(userId: string, status: UserStatus) {
    return this.db.user.update({
      where: { id: userId },
      data: { status },
      include: userInclude,
    });
  }

  async assignRoles(userId: string, roleIds: string[]) {
    if (roleIds.length) {
      const roles = await this.db.role.findMany({
        where: { id: { in: roleIds }, deletedAt: null },
      });
      if (roles.length !== roleIds.length) {
        return { ok: false as const, reason: 'INVALID_ROLES' as const };
      }
    }

    await this.db.$transaction([
      this.db.userRole.deleteMany({ where: { userId } }),
      ...(roleIds.length
        ? [
            this.db.userRole.createMany({
              data: roleIds.map((roleId) => ({ userId, roleId })),
            }),
          ]
        : []),
    ]);

    return { ok: true as const };
  }

  async softDelete(id: string, actorId?: string | null) {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.db.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'DELETED',
        ...(actorId ? { updatedBy: actorId } : {}),
      },
    });
    return true;
  }

  recordLogin(
    userId: string,
    meta?: {
      ipAddress?: string;
      device?: string;
      browser?: string;
      operatingSystem?: string;
      country?: string;
    },
  ) {
    return this.db.loginHistory.create({
      data: {
        userId,
        ipAddress: meta?.ipAddress,
        device: meta?.device,
        browser: meta?.browser,
        operatingSystem: meta?.operatingSystem,
        country: meta?.country,
      },
    });
  }

  async listLoginHistory(userId: string, page: number, pageSize: number) {
    const where = { userId };
    const [total, rows] = await Promise.all([
      this.db.loginHistory.count({ where }),
      this.db.loginHistory.findMany({
        where,
        orderBy: { loginTime: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { total, rows };
  }

  listRecentLogins(limit = 25) {
    return this.db.loginHistory.findMany({
      take: limit,
      orderBy: { loginTime: 'desc' },
      include: {
        user: { select: { id: true, email: true, displayName: true, auth0UserId: true } },
      },
    });
  }

  findAuthorsWithPublishedArticles(limit = 30) {
    return this.db.user.findMany({
      where: {
        deletedAt: null,
        username: { not: null },
        articles: {
          some: { deletedAt: null, status: 'PUBLISHED' },
        },
      },
      select: {
        username: true,
        displayName: true,
      },
      orderBy: { displayName: 'asc' },
      take: limit,
    });
  }
}

export class RoleRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.role.findFirst({
      where: { id, deletedAt: null },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });
  }

  findBySlug(slug: string) {
    return this.db.role.findFirst({
      where: { slug, deletedAt: null },
      include: {
        permissions: { include: { permission: true } },
      },
    });
  }

  list(params: CursorPageParams & { search?: string } = {}) {
    return listActiveWithCursor(this.db.role, {
      ...params,
      where: params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { slug: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });
  }

  async listOffset(params: { page: number; pageSize: number; search?: string }) {
    const where = {
      deletedAt: null as Date | null,
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' as const } },
              { slug: { contains: params.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.db.role.count({ where }),
      this.db.role.findMany({
        where,
        include: {
          permissions: { include: { permission: true } },
          _count: { select: { users: true } },
        },
        orderBy: { name: 'asc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
    ]);

    return { total, rows };
  }

  async create(input: {
    slug: string;
    name: string;
    description?: string | null;
    permissionIds: string[];
  }) {
    if (input.permissionIds.length) {
      const count = await this.db.permission.count({
        where: { id: { in: input.permissionIds }, deletedAt: null },
      });
      if (count !== input.permissionIds.length) {
        return { ok: false as const, reason: 'INVALID_PERMISSIONS' as const };
      }
    }

    const role = await this.db.role.create({
      data: {
        slug: input.slug,
        name: input.name,
        description: input.description ?? null,
        permissions: {
          create: input.permissionIds.map((permissionId) => ({ permissionId })),
        },
      },
    });

    return { ok: true as const, role };
  }

  async update(
    id: string,
    input: {
      name?: string;
      description?: string | null;
      permissionIds?: string[];
    },
  ) {
    if (input.permissionIds) {
      const count = await this.db.permission.count({
        where: { id: { in: input.permissionIds }, deletedAt: null },
      });
      if (count !== input.permissionIds.length) {
        return { ok: false as const, reason: 'INVALID_PERMISSIONS' as const };
      }

      await this.db.$transaction([
        this.db.rolePermission.deleteMany({ where: { roleId: id } }),
        ...(input.permissionIds.length
          ? [
              this.db.rolePermission.createMany({
                data: input.permissionIds.map((permissionId) => ({
                  roleId: id,
                  permissionId,
                })),
              }),
            ]
          : []),
      ]);
    }

    await this.db.role.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description === undefined ? undefined : input.description,
      },
    });

    return { ok: true as const };
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.role, id, actorId);
  }
}

export class PermissionRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return findActiveById(this.db.permission, id);
  }

  list(params: CursorPageParams & { module?: string; search?: string } = {}) {
    return listActiveWithCursor(this.db.permission, {
      ...params,
      where: {
        ...(params.module ? { module: params.module } : {}),
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { slug: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
    });
  }

  async listOffset(params: { page: number; pageSize: number; search?: string }) {
    const where = {
      deletedAt: null as Date | null,
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' as const } },
              { slug: { contains: params.search, mode: 'insensitive' as const } },
              { module: { contains: params.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.db.permission.count({ where }),
      this.db.permission.findMany({
        where,
        orderBy: [{ module: 'asc' }, { name: 'asc' }],
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
    ]);

    return { total, rows };
  }
}

export class AuditLogRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  create(data: {
    userId?: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    oldValue?: Prisma.InputJsonValue;
    newValue?: Prisma.InputJsonValue;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.db.auditLog.create({ data });
  }

  list(
    params: CursorPageParams & {
      userId?: string;
      entity?: string;
      entityId?: string;
      action?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {},
  ) {
    return paginateWithCursor((args) => this.db.auditLog.findMany(args), {
      ...params,
      softDelete: false,
      where: {
        ...(params.userId ? { userId: params.userId } : {}),
        ...(params.entity ? { entity: params.entity } : {}),
        ...(params.entityId ? { entityId: params.entityId } : {}),
        ...(params.action ? { action: params.action } : {}),
        ...(params.dateFrom || params.dateTo
          ? {
              createdAt: {
                ...(params.dateFrom ? { gte: params.dateFrom } : {}),
                ...(params.dateTo ? { lte: params.dateTo } : {}),
              },
            }
          : {}),
      },
      include: {
        user: { select: { id: true, email: true, displayName: true } },
      },
    });
  }

  recent(limit = 10) {
    return this.db.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, displayName: true } },
      },
    });
  }

  async listOffset(userId: string, page: number, pageSize: number) {
    const where = { userId };
    const [total, rows] = await Promise.all([
      this.db.auditLog.count({ where }),
      this.db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { total, rows };
  }
}
