import type { Prisma, PrismaClient } from '@prisma/client';
import { BaseRepository } from '../base.repository';

export class UserPreferenceRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findByUserId(userId: string) {
    return this.db.userPreference.findUnique({ where: { userId } });
  }

  upsert(userId: string, data: Omit<Prisma.UserPreferenceCreateInput, 'user' | 'userId'>) {
    return this.db.userPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }
}

export class BookmarkRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  list(
    userId: string,
    params: {
      entityType?: string;
      entityId?: string;
      collectionName?: string;
      cursor?: string;
      limit?: number;
    },
  ) {
    const limit = Math.min(params.limit ?? 25, 100);
    return this.db.bookmark.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(params.entityType ? { entityType: params.entityType } : {}),
        ...(params.entityId ? { entityId: params.entityId } : {}),
        ...(params.collectionName ? { collectionName: params.collectionName } : {}),
      },
      take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(userId: string, id: string) {
    return this.db.bookmark.findFirst({ where: { id, userId, deletedAt: null } });
  }

  create(data: Prisma.BookmarkCreateInput) {
    return this.db.bookmark.create({ data });
  }

  softDelete(userId: string, id: string) {
    return this.db.bookmark.updateMany({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  findByEntity(userId: string, entityType: string, entityId: string) {
    return this.db.bookmark.findFirst({
      where: { userId, entityType, entityId, deletedAt: null },
    });
  }

  listCollections(userId: string) {
    return this.db.bookmark.findMany({
      where: { userId, deletedAt: null, collectionName: { not: null } },
      distinct: ['collectionName'],
      select: { collectionName: true },
    });
  }
}

export class UserActivityRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  list(userId: string, params: { activityType?: string; cursor?: string; limit?: number }) {
    const limit = Math.min(params.limit ?? 25, 100);
    return this.db.userActivity.findMany({
      where: {
        userId,
        ...(params.activityType ? { activityType: params.activityType } : {}),
      },
      take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
    });
  }

  listAll(params: { cursor?: string; limit?: number }) {
    const limit = Math.min(params.limit ?? 25, 100);
    return this.db.userActivity.findMany({
      take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, email: true, displayName: true } } },
    });
  }

  record(input: {
    userId: string;
    activityType: string;
    entityType?: string | null;
    entityId?: string | null;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.db.userActivity.create({ data: input });
  }

  countRecent(days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return this.db.userActivity.count({ where: { createdAt: { gte: since } } });
  }

  listReadingHistory(
    userId: string,
    params: {
      activityType: string;
      entityType?: string;
      cursor?: string;
      limit?: number;
    },
  ) {
    const limit = Math.min(params.limit ?? 25, 100);
    return this.db.userActivity.findMany({
      where: {
        userId,
        activityType: params.activityType,
        entityType: { not: null },
        entityId: { not: null },
        ...(params.entityType ? { entityType: params.entityType } : {}),
      },
      take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
    });
  }

  findLatestReadingView(
    userId: string,
    activityType: string,
    entityType: string,
    entityId: string,
  ) {
    return this.db.userActivity.findFirst({
      where: { userId, activityType, entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateReadingView(
    id: string,
    data: { metadata?: Prisma.InputJsonValue; createdAt?: Date },
  ) {
    return this.db.userActivity.update({ where: { id }, data });
  }

  deleteForUser(userId: string, id: string) {
    return this.db.userActivity.deleteMany({ where: { id, userId } });
  }

  clearReadingHistory(userId: string, activityType: string) {
    return this.db.userActivity.deleteMany({ where: { userId, activityType } });
  }
}

export class UserContentSubscriptionRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  listByUser(userId: string) {
    return this.db.userContentSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  listAll(params: { cursor?: string; limit?: number }) {
    const limit = Math.min(params.limit ?? 25, 100);
    return this.db.userContentSubscription.findMany({
      take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, email: true, displayName: true } } },
    });
  }

  async replaceForUser(
    userId: string,
    items: Array<{ subscriptionType: string; target: string }>,
  ) {
    await this.db.$transaction([
      this.db.userContentSubscription.deleteMany({ where: { userId } }),
      ...(items.length
        ? [
            this.db.userContentSubscription.createMany({
              data: items.map((item) => ({
                userId,
                subscriptionType: item.subscriptionType,
                target: item.target.trim(),
              })),
            }),
          ]
        : []),
    ]);
    return this.listByUser(userId);
  }

  async toggle(
    userId: string,
    subscriptionType: string,
    target: string,
    subscribed: boolean,
  ) {
    const normalizedTarget = target.trim();
    if (!subscribed) {
      await this.db.userContentSubscription.deleteMany({
        where: { userId, subscriptionType, target: normalizedTarget },
      });
      return { subscribed: false, subscriptionType, target: normalizedTarget };
    }

    await this.db.userContentSubscription.upsert({
      where: {
        userId_subscriptionType_target: {
          userId,
          subscriptionType,
          target: normalizedTarget,
        },
      },
      create: { userId, subscriptionType, target: normalizedTarget },
      update: {},
    });
    return { subscribed: true, subscriptionType, target: normalizedTarget };
  }

  async checkMany(
    userId: string,
    items: Array<{ subscriptionType: string; target: string }>,
  ) {
    if (!items.length) return [];
    const rows = await this.db.userContentSubscription.findMany({
      where: {
        userId,
        OR: items.map((item) => ({
          subscriptionType: item.subscriptionType,
          target: item.target.trim(),
        })),
      },
    });
    const active = new Set(rows.map((row) => `${row.subscriptionType}:${row.target}`));
    return items.map((item) => ({
      subscriptionType: item.subscriptionType,
      target: item.target.trim(),
      subscribed: active.has(`${item.subscriptionType}:${item.target.trim()}`),
    }));
  }

  feedArticles(userId: string, limit = 20) {
    return this.listByUser(userId).then(async (subs) => {
      if (!subs.length) return [];

      const categorySlugs = subs
        .filter((row) => row.subscriptionType === 'category')
        .map((row) => row.target);
      const tagSlugs = subs.filter((row) => row.subscriptionType === 'tag').map((row) => row.target);
      const authorUsernames = subs
        .filter((row) => row.subscriptionType === 'author')
        .map((row) => row.target);
      const topics = subs.filter((row) => row.subscriptionType === 'topic').map((row) => row.target);

      const or: Array<Record<string, unknown>> = [];
      if (categorySlugs.length) {
        or.push({ category: { slug: { in: categorySlugs }, deletedAt: null } });
      }
      if (tagSlugs.length) {
        or.push({
          tags: { some: { tag: { slug: { in: tagSlugs }, deletedAt: null } } },
        });
      }
      if (authorUsernames.length) {
        or.push({ author: { username: { in: authorUsernames } } });
      }
      for (const topic of topics) {
        or.push({
          OR: [
            { title: { contains: topic, mode: 'insensitive' } },
            { excerpt: { contains: topic, mode: 'insensitive' } },
          ],
        });
      }

      if (!or.length) return [];

      return this.db.article.findMany({
        where: {
          deletedAt: null,
          status: 'PUBLISHED',
          OR: or,
        },
        orderBy: { publishedAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          publishedAt: true,
          readingTimeMinutes: true,
          author: { select: { username: true, displayName: true } },
          category: { select: { name: true, slug: true } },
        },
      });
    });
  }
}
