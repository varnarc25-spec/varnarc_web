import type { NotificationChannel, Prisma, PrismaClient } from '@prisma/client';
import { BaseRepository } from '../base.repository';

export class NotificationTemplateRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  list(params: { search?: string; channel?: NotificationChannel; cursor?: string; limit?: number }) {
    const limit = Math.min(params.limit ?? 25, 100);
    const where: Prisma.NotificationTemplateWhereInput = {
      deletedAt: null,
      ...(params.channel ? { channel: params.channel } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { slug: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    return this.db.notificationTemplate.findMany({
      where,
      take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      orderBy: { updatedAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.db.notificationTemplate.findFirst({ where: { id, deletedAt: null } });
  }

  findBySlug(slug: string) {
    return this.db.notificationTemplate.findFirst({ where: { slug, deletedAt: null } });
  }

  create(data: Prisma.NotificationTemplateCreateInput) {
    return this.db.notificationTemplate.create({ data });
  }

  update(id: string, data: Prisma.NotificationTemplateUpdateInput) {
    return this.db.notificationTemplate.update({ where: { id }, data });
  }

  softDelete(id: string, actorId?: string | null) {
    return this.db.notificationTemplate.update({
      where: { id },
      data: { deletedAt: new Date(), ...this.withAuditUpdate(actorId) },
    });
  }
}

export class NotificationRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  list(params: { cursor?: string; limit?: number }) {
    const limit = Math.min(params.limit ?? 25, 100);
    return this.db.notification.findMany({
      where: { deletedAt: null },
      take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { users: true } }, template: true },
    });
  }

  findById(id: string) {
    return this.db.notification.findFirst({
      where: { id, deletedAt: null },
      include: { template: true, _count: { select: { users: true } } },
    });
  }

  create(data: Prisma.NotificationCreateInput) {
    return this.db.notification.create({ data });
  }

  async createForUsers(input: {
    userIds: string[];
    channel: NotificationChannel;
    title: string;
    body: string;
    templateId?: string | null;
    metadata?: Prisma.InputJsonValue;
  }) {
    if (!input.userIds.length) return null;
    const notification = await this.db.notification.create({
      data: {
        channel: input.channel,
        title: input.title,
        body: input.body,
        templateId: input.templateId ?? null,
        metadata: input.metadata ?? undefined,
      },
    });
    await this.db.userNotification.createMany({
      data: input.userIds.map((userId) => ({ userId, notificationId: notification.id })),
      skipDuplicates: true,
    });
    return notification;
  }

  summary() {
    return Promise.all([
      this.db.notification.count({ where: { deletedAt: null } }),
      this.db.notificationTemplate.count({ where: { deletedAt: null } }),
      this.db.userNotification.count({ where: { readAt: null } }),
    ]).then(([notificationCount, templateCount, unreadCount]) => ({
      notificationCount,
      templateCount,
      unreadCount,
    }));
  }

  listActiveUserIds(limit = 500) {
    return this.db.user
      .findMany({
        where: { deletedAt: null, status: 'ACTIVE' },
        select: { id: true },
        take: limit,
      })
      .then((rows) => rows.map((r) => r.id));
  }

  listUserIdsByRole(roleId: string, limit = 500) {
    return this.db.user
      .findMany({
        where: {
          deletedAt: null,
          status: 'ACTIVE',
          roles: { some: { roleId } },
        },
        select: { id: true },
        take: limit,
      })
      .then((rows) => rows.map((r) => r.id));
  }
}

export class UserNotificationRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  listForUser(
    userId: string,
    params: { unreadOnly?: boolean; cursor?: string; limit?: number },
  ) {
    const limit = Math.min(params.limit ?? 25, 100);
    return this.db.userNotification.findMany({
      where: {
        userId,
        notification: { deletedAt: null },
        ...(params.unreadOnly ? { readAt: null } : {}),
      },
      take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        notification: {
          select: {
            id: true,
            title: true,
            body: true,
            channel: true,
            metadata: true,
            createdAt: true,
          },
        },
      },
    });
  }

  unreadCount(userId: string) {
    return this.db.userNotification.count({
      where: { userId, readAt: null, notification: { deletedAt: null } },
    });
  }

  findForUser(userId: string, id: string) {
    return this.db.userNotification.findFirst({
      where: { id, userId, notification: { deletedAt: null } },
    });
  }

  markRead(userId: string, id: string) {
    return this.db.userNotification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  markAllRead(userId: string) {
    return this.db.userNotification.updateMany({
      where: { userId, readAt: null, notification: { deletedAt: null } },
      data: { readAt: new Date() },
    });
  }
}
