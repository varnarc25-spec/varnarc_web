import type {
  AiPricingModel,
  AiToolEventType,
  Prisma,
  PrismaClient,
  PublishStatus,
} from '@prisma/client';
import {
  BaseRepository,
  findActiveById,
  listActiveWithCursor,
  softDeleteById,
} from '../base.repository';
import type { CursorPageParams } from '../../pagination';

const toolInclude = {
  category: true,
  company: { select: { id: true, name: true, slug: true, website: true } },
  features: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' as const } },
  integrations: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' as const } },
  screenshots: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' as const } },
  _count: { select: { bookmarks: true } },
} satisfies Prisma.AiToolInclude;

export class AiCategoryRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return findActiveById(this.db.aiCategory, id, {
      include: {
        parent: true,
        children: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
        _count: { select: { tools: true } },
      },
    });
  }

  findBySlug(slug: string) {
    return this.db.aiCategory.findFirst({
      where: { slug, deletedAt: null },
      include: {
        parent: true,
        children: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
        _count: { select: { tools: true } },
      },
    });
  }

  list(params: CursorPageParams & { search?: string } = {}) {
    return listActiveWithCursor(this.db.aiCategory, {
      ...params,
      where: {
        parentId: null,
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { slug: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        children: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
        _count: { select: { tools: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  create(data: Prisma.AiCategoryCreateInput) {
    return this.db.aiCategory.create({ data });
  }

  update(id: string, data: Prisma.AiCategoryUpdateInput) {
    return this.db.aiCategory.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return softDeleteById(this.db.aiCategory, id);
  }
}

export class AiToolRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.aiTool.findFirst({
      where: { id, deletedAt: null },
      include: toolInclude,
    });
  }

  findBySlug(slug: string) {
    return this.db.aiTool.findFirst({
      where: { slug, deletedAt: null },
      include: toolInclude,
    });
  }

  findDuplicate(name: string) {
    return this.db.aiTool.findFirst({
      where: {
        deletedAt: null,
        name: { equals: name, mode: 'insensitive' },
      },
      select: { id: true, slug: true, name: true },
    });
  }

  list(
    params: CursorPageParams & {
      status?: PublishStatus;
      search?: string;
      categorySlug?: string;
      pricingModel?: AiPricingModel;
      featured?: boolean;
      sponsored?: boolean;
      freePlan?: boolean;
      freeTrial?: boolean;
      apiAvailable?: boolean;
      feature?: string;
      sort?: 'recent' | 'popular' | 'name' | 'bookmarked';
    } = {},
  ) {
    const orderBy =
      params.sort === 'popular'
        ? { viewCount: 'desc' as const }
        : params.sort === 'name'
          ? { name: 'asc' as const }
          : params.sort === 'bookmarked'
            ? { bookmarkCount: 'desc' as const }
            : { createdAt: 'desc' as const };

    return listActiveWithCursor(this.db.aiTool, {
      ...params,
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.featured !== undefined ? { featured: params.featured } : {}),
        ...(params.sponsored !== undefined ? { sponsored: params.sponsored } : {}),
        ...(params.freePlan !== undefined ? { freePlan: params.freePlan } : {}),
        ...(params.freeTrial !== undefined ? { freeTrial: params.freeTrial } : {}),
        ...(params.apiAvailable !== undefined ? { apiAvailable: params.apiAvailable } : {}),
        ...(params.pricingModel ? { pricingModel: params.pricingModel } : {}),
        ...(params.categorySlug
          ? {
              category: { slug: params.categorySlug, deletedAt: null },
            }
          : {}),
        ...(params.feature
          ? {
              features: {
                some: {
                  deletedAt: null,
                  name: { contains: params.feature, mode: 'insensitive' },
                },
              },
            }
          : {}),
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { slug: { contains: params.search, mode: 'insensitive' } },
                { description: { contains: params.search, mode: 'insensitive' } },
                { shortDescription: { contains: params.search, mode: 'insensitive' } },
                {
                  features: {
                    some: { name: { contains: params.search, mode: 'insensitive' }, deletedAt: null },
                  },
                },
                {
                  integrations: {
                    some: { name: { contains: params.search, mode: 'insensitive' }, deletedAt: null },
                  },
                },
              ],
            }
          : {}),
      },
      include: toolInclude,
      orderBy,
    });
  }

  create(data: Prisma.AiToolCreateInput) {
    return this.db.aiTool.create({ data, include: toolInclude });
  }

  update(id: string, data: Prisma.AiToolUpdateInput) {
    return this.db.aiTool.update({ where: { id }, data, include: toolInclude });
  }

  async replaceNested(
    id: string,
    data: {
      tool: Prisma.AiToolUpdateInput;
      features?: Prisma.AiToolFeatureCreateWithoutToolInput[];
      integrations?: Prisma.AiToolIntegrationCreateWithoutToolInput[];
      screenshots?: Prisma.AiToolScreenshotCreateWithoutToolInput[];
    },
  ) {
    return this.db.$transaction(async (tx) => {
      if (data.features) {
        await tx.aiToolFeature.deleteMany({ where: { toolId: id } });
      }
      if (data.integrations) {
        await tx.aiToolIntegration.deleteMany({ where: { toolId: id } });
      }
      if (data.screenshots) {
        await tx.aiToolScreenshot.deleteMany({ where: { toolId: id } });
      }

      return tx.aiTool.update({
        where: { id },
        data: {
          ...data.tool,
          ...(data.features ? { features: { create: data.features } } : {}),
          ...(data.integrations ? { integrations: { create: data.integrations } } : {}),
          ...(data.screenshots ? { screenshots: { create: data.screenshots } } : {}),
        },
        include: toolInclude,
      });
    });
  }

  publish(id: string, actorId?: string | null) {
    return this.db.aiTool.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        updatedBy: actorId ?? undefined,
      },
      include: toolInclude,
    });
  }

  unpublish(id: string, actorId?: string | null) {
    return this.db.aiTool.update({
      where: { id },
      data: {
        status: 'DRAFT',
        updatedBy: actorId ?? undefined,
      },
      include: toolInclude,
    });
  }

  softDelete(id: string) {
    return softDeleteById(this.db.aiTool, id);
  }

  incrementViews(id: string) {
    return this.db.aiTool.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  relatedInCategory(toolId: string, categoryId: string, limit = 6) {
    return this.db.aiTool.findMany({
      where: {
        deletedAt: null,
        status: 'PUBLISHED',
        categoryId,
        id: { not: toolId },
      },
      take: limit,
      orderBy: [{ featured: 'desc' }, { viewCount: 'desc' }],
      include: toolInclude,
    });
  }

  findBySlugs(slugs: string[]) {
    return this.db.aiTool.findMany({
      where: { slug: { in: slugs }, deletedAt: null, status: 'PUBLISHED' },
      include: toolInclude,
    });
  }

  exportRows() {
    return this.db.aiTool.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        pricingModel: true,
        freePlan: true,
        freeTrial: true,
        apiAvailable: true,
        website: true,
        documentation: true,
        affiliateUrl: true,
        featured: true,
        sponsored: true,
        status: true,
        category: { select: { slug: true } },
      },
    });
  }

  async analyticsSummary() {
    const [total, published, featured, sponsored, topViewed, topBookmarked, byCategory, byPricing] =
      await Promise.all([
        this.db.aiTool.count({ where: { deletedAt: null } }),
        this.db.aiTool.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
        this.db.aiTool.count({ where: { deletedAt: null, featured: true } }),
        this.db.aiTool.count({ where: { deletedAt: null, sponsored: true } }),
        this.db.aiTool.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          orderBy: { viewCount: 'desc' },
          take: 10,
          select: { id: true, name: true, slug: true, viewCount: true, bookmarkCount: true },
        }),
        this.db.aiTool.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          orderBy: { bookmarkCount: 'desc' },
          take: 10,
          select: { id: true, name: true, slug: true, viewCount: true, bookmarkCount: true },
        }),
        this.db.aiTool.groupBy({
          by: ['categoryId'],
          where: { deletedAt: null, status: 'PUBLISHED' },
          _count: { _all: true },
          orderBy: { _count: { categoryId: 'desc' } },
          take: 10,
        }),
        this.db.aiTool.groupBy({
          by: ['pricingModel'],
          where: { deletedAt: null },
          _count: { _all: true },
        }),
      ]);

    const categoryIds = byCategory.map((r) => r.categoryId).filter(Boolean) as string[];
    const categories = categoryIds.length
      ? await this.db.aiCategory.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true, slug: true },
        })
      : [];
    const catMap = new Map(categories.map((c) => [c.id, c]));

    return {
      totals: { total, published, featured, sponsored },
      topViewed,
      topBookmarked,
      byCategory: byCategory.map((r) => ({
        categoryId: r.categoryId,
        count: r._count._all,
        category: r.categoryId ? catMap.get(r.categoryId) ?? null : null,
      })),
      byPricing: byPricing.map((r) => ({ pricingModel: r.pricingModel, count: r._count._all })),
    };
  }

  async featureCatalog() {
    const rows = await this.db.aiToolFeature.groupBy({
      by: ['name'],
      where: { deletedAt: null },
      _count: { _all: true },
      orderBy: { _count: { name: 'desc' } },
    });
    return rows.map((r) => ({ name: r.name, toolCount: r._count._all }));
  }

  async renameFeature(fromName: string, toName: string) {
    const existing = await this.db.aiToolFeature.findMany({
      where: { name: fromName, deletedAt: null },
      select: { id: true, toolId: true },
    });
    let renamed = 0;
    let skipped = 0;
    for (const row of existing) {
      const clash = await this.db.aiToolFeature.findFirst({
        where: { toolId: row.toolId, name: toName, deletedAt: null },
      });
      if (clash) {
        await this.db.aiToolFeature.update({
          where: { id: row.id },
          data: { deletedAt: new Date() },
        });
        skipped += 1;
        continue;
      }
      await this.db.aiToolFeature.update({
        where: { id: row.id },
        data: { name: toName },
      });
      renamed += 1;
    }
    return { renamed, skipped, total: existing.length };
  }

  async deleteFeatureByName(name: string) {
    const result = await this.db.aiToolFeature.updateMany({
      where: { name, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return { deleted: result.count };
  }

  async recommendForUser(userId: string, limit = 12) {
    const [follows, bookmarks, recent] = await Promise.all([
      this.db.aiCategoryFollow.findMany({ where: { userId }, select: { categoryId: true } }),
      this.db.aiToolBookmark.findMany({
        where: { userId, deletedAt: null },
        select: { toolId: true, tool: { select: { categoryId: true } } },
      }),
      this.db.aiToolRecentlyViewed.findMany({
        where: { userId },
        take: 20,
        orderBy: { viewedAt: 'desc' },
        select: { toolId: true, tool: { select: { categoryId: true } } },
      }),
    ]);

    const excludeIds = new Set<string>([
      ...bookmarks.map((b) => b.toolId),
      ...recent.map((r) => r.toolId),
    ]);
    const categoryIds = new Set<string>();
    for (const f of follows) categoryIds.add(f.categoryId);
    for (const b of bookmarks) if (b.tool?.categoryId) categoryIds.add(b.tool.categoryId);
    for (const r of recent) if (r.tool?.categoryId) categoryIds.add(r.tool.categoryId);

    const cats = [...categoryIds];
    if (!cats.length) {
      return this.db.aiTool.findMany({
        where: {
          deletedAt: null,
          status: 'PUBLISHED',
          ...(excludeIds.size ? { id: { notIn: [...excludeIds] } } : {}),
        },
        take: limit,
        orderBy: [{ featured: 'desc' }, { viewCount: 'desc' }],
        include: toolInclude,
      });
    }

    return this.db.aiTool.findMany({
      where: {
        deletedAt: null,
        status: 'PUBLISHED',
        categoryId: { in: cats },
        ...(excludeIds.size ? { id: { notIn: [...excludeIds] } } : {}),
      },
      take: limit,
      orderBy: [{ sponsored: 'desc' }, { featured: 'desc' }, { viewCount: 'desc' }],
      include: toolInclude,
    });
  }
}

export class AiToolBookmarkRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  listByUser(userId: string, params: CursorPageParams & { collectionName?: string } = {}) {
    return listActiveWithCursor(this.db.aiToolBookmark, {
      ...params,
      where: {
        userId,
        ...(params.collectionName ? { collectionName: params.collectionName } : {}),
      },
      include: { tool: { include: toolInclude } },
      orderBy: { createdAt: 'desc' },
    });
  }

  find(userId: string, toolId: string) {
    return this.db.aiToolBookmark.findFirst({
      where: { userId, toolId, deletedAt: null },
    });
  }

  async create(userId: string, toolId: string, collectionName?: string | null) {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.aiToolBookmark.findUnique({
        where: { userId_toolId: { userId, toolId } },
      });
      if (existing && !existing.deletedAt) {
        return tx.aiToolBookmark.update({
          where: { id: existing.id },
          data: { collectionName: collectionName ?? existing.collectionName },
          include: { tool: { include: toolInclude } },
        });
      }
      if (existing?.deletedAt) {
        const row = await tx.aiToolBookmark.update({
          where: { id: existing.id },
          data: { deletedAt: null, collectionName: collectionName ?? null },
          include: { tool: { include: toolInclude } },
        });
        await tx.aiTool.update({ where: { id: toolId }, data: { bookmarkCount: { increment: 1 } } });
        return row;
      }
      const row = await tx.aiToolBookmark.create({
        data: { userId, toolId, collectionName: collectionName ?? null },
        include: { tool: { include: toolInclude } },
      });
      await tx.aiTool.update({ where: { id: toolId }, data: { bookmarkCount: { increment: 1 } } });
      return row;
    });
  }

  async softDelete(id: string, userId: string) {
    const existing = await this.db.aiToolBookmark.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!existing) return null;
    return this.db.$transaction(async (tx) => {
      const row = await tx.aiToolBookmark.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await tx.aiTool.update({
        where: { id: existing.toolId },
        data: { bookmarkCount: { decrement: 1 } },
      });
      return row;
    });
  }

  collections(userId: string) {
    return this.db.aiToolBookmark.findMany({
      where: { userId, deletedAt: null, collectionName: { not: null } },
      distinct: ['collectionName'],
      select: { collectionName: true },
      orderBy: { collectionName: 'asc' },
    });
  }

  async adminStats() {
    const [total, byCollection] = await Promise.all([
      this.db.aiToolBookmark.count({ where: { deletedAt: null } }),
      this.db.aiToolBookmark.groupBy({
        by: ['collectionName'],
        where: { deletedAt: null },
        _count: { _all: true },
        orderBy: { _count: { collectionName: 'desc' } },
        take: 20,
      }),
    ]);
    return {
      total,
      byCollection: byCollection.map((r) => ({
        collectionName: r.collectionName || 'Uncategorized',
        count: r._count._all,
      })),
    };
  }
}

export class AiCategoryFollowRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  listByUser(userId: string) {
    return this.db.aiCategoryFollow.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          include: { _count: { select: { tools: true } } },
        },
      },
    });
  }

  find(userId: string, categoryId: string) {
    return this.db.aiCategoryFollow.findUnique({
      where: { userId_categoryId: { userId, categoryId } },
    });
  }

  follow(userId: string, categoryId: string) {
    return this.db.aiCategoryFollow.upsert({
      where: { userId_categoryId: { userId, categoryId } },
      update: {},
      create: { userId, categoryId },
      include: { category: true },
    });
  }

  async unfollow(userId: string, categoryId: string) {
    const existing = await this.find(userId, categoryId);
    if (!existing) return null;
    await this.db.aiCategoryFollow.delete({ where: { id: existing.id } });
    return { id: existing.id, deleted: true };
  }
}

export class AiToolEventRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  create(data: { toolId?: string | null; eventType: AiToolEventType; metadata?: Prisma.InputJsonValue }) {
    return this.db.aiToolEvent.create({
      data: {
        toolId: data.toolId ?? null,
        eventType: data.eventType,
        metadata: data.metadata,
      },
    });
  }

  async countsByType() {
    const rows = await this.db.aiToolEvent.groupBy({
      by: ['eventType'],
      _count: { _all: true },
    });
    return rows.map((r) => ({ eventType: r.eventType, count: r._count._all }));
  }
}

export class AiToolRecentlyViewedRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  async upsert(userId: string, toolId: string) {
    return this.db.aiToolRecentlyViewed.upsert({
      where: { userId_toolId: { userId, toolId } },
      update: { viewedAt: new Date() },
      create: { userId, toolId },
    });
  }

  list(userId: string, limit = 12) {
    return this.db.aiToolRecentlyViewed.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      take: limit,
      include: { tool: { include: toolInclude } },
    });
  }
}
