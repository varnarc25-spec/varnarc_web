import type { Category, Prisma, PrismaClient, PublishStatus, Tag } from '@prisma/client';
import {
  BaseRepository,
  findActiveById,
  listActiveWithCursor,
  softDeleteById,
} from '../base.repository';
import type { CursorPageParams } from '../../pagination';

export class ArticleRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.article.findFirst({
      where: { id, deletedAt: null },
      include: {
        author: true,
        category: true,
        featuredImage: true,
        tags: { include: { tag: true } },
        relatedFrom: {
          orderBy: { sortOrder: 'asc' },
          include: {
            related: {
              select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                status: true,
                publishedAt: true,
              },
            },
          },
        },
      },
    });
  }

  findBySlug(slug: string) {
    return this.db.article.findFirst({
      where: { slug, deletedAt: null },
      include: {
        author: true,
        category: true,
        featuredImage: true,
        tags: { include: { tag: true } },
        relatedFrom: {
          orderBy: { sortOrder: 'asc' },
          include: {
            related: {
              select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                status: true,
                publishedAt: true,
              },
            },
          },
        },
      },
    });
  }

  list(
    params: CursorPageParams & {
      status?: PublishStatus;
      categoryId?: string;
      categorySlug?: string;
      parentCategorySlug?: string;
      authorId?: string;
      tagId?: string;
      tagSlug?: string;
      search?: string;
      featured?: boolean;
    } = {},
  ) {
    const categoryFilter: Prisma.CategoryWhereInput | undefined = params.categorySlug
      ? { slug: params.categorySlug, deletedAt: null }
      : params.parentCategorySlug
        ? {
            deletedAt: null,
            OR: [
              { slug: params.parentCategorySlug },
              { parent: { slug: params.parentCategorySlug, deletedAt: null } },
            ],
          }
        : undefined;

    const where: Prisma.ArticleWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      ...(categoryFilter ? { category: categoryFilter } : {}),
      ...(params.authorId ? { authorId: params.authorId } : {}),
      ...(params.featured !== undefined ? { isFeatured: params.featured } : {}),
      ...(params.tagId
        ? { tags: { some: { tagId: params.tagId } } }
        : params.tagSlug
          ? { tags: { some: { tag: { slug: params.tagSlug, deletedAt: null } } } }
          : {}),
      ...(params.search
        ? {
            OR: [
              { title: { contains: params.search, mode: 'insensitive' } },
              { excerpt: { contains: params.search, mode: 'insensitive' } },
              { slug: { contains: params.search, mode: 'insensitive' } },
              { content: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return listActiveWithCursor(this.db.article, {
      ...params,
      where,
      include: {
        author: true,
        category: {
          include: {
            parent: { select: { id: true, name: true, slug: true } },
          },
        },
        featuredImage: true,
        tags: { include: { tag: true } },
      },
    });
  }

  create(data: Prisma.ArticleCreateInput) {
    return this.db.article.create({ data });
  }

  update(id: string, data: Prisma.ArticleUpdateInput) {
    return this.db.article.update({ where: { id }, data });
  }

  async publish(id: string, actorId?: string | null) {
    return this.db.$transaction(async (tx) => {
      const article = await tx.article.findFirst({
        where: { id, deletedAt: null },
      });
      if (!article) return null;

      const updated = await tx.article.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          publishedAt: article.publishedAt ?? new Date(),
          ...(actorId ? { updatedBy: actorId } : {}),
        },
      });

      const latest = await tx.articleVersion.findFirst({
        where: { articleId: id },
        orderBy: { version: 'desc' },
      });

      await tx.articleVersion.create({
        data: {
          articleId: id,
          title: updated.title,
          content: updated.content,
          version: (latest?.version ?? 0) + 1,
          createdBy: actorId ?? undefined,
        },
      });

      return updated;
    });
  }

  async schedule(id: string, publishedAt: Date, actorId?: string | null) {
    const article = await this.db.article.findFirst({ where: { id, deletedAt: null } });
    if (!article) return null;
    return this.db.article.update({
      where: { id },
      data: {
        status: 'SCHEDULED',
        publishedAt,
        ...(actorId ? { updatedBy: actorId } : {}),
      },
    });
  }

  async submitReview(id: string, actorId?: string | null) {
    const article = await this.db.article.findFirst({ where: { id, deletedAt: null } });
    if (!article) return null;
    return this.db.article.update({
      where: { id },
      data: {
        status: 'REVIEW',
        ...(actorId ? { updatedBy: actorId } : {}),
      },
    });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.article, id, actorId);
  }

  countAll() {
    return this.db.article.count({ where: { deletedAt: null } });
  }

  countByStatus(status: PublishStatus) {
    return this.db.article.count({ where: { deletedAt: null, status } });
  }

  listVersions(articleId: string) {
    return this.db.articleVersion.findMany({
      where: { articleId },
      orderBy: { version: 'desc' },
    });
  }

  findVersion(articleId: string, versionId: string) {
    return this.db.articleVersion.findFirst({
      where: { id: versionId, articleId },
    });
  }

  async restoreVersion(articleId: string, versionId: string, actorId?: string | null) {
    const version = await this.findVersion(articleId, versionId);
    if (!version) return null;

    return this.db.article.update({
      where: { id: articleId },
      data: {
        title: version.title,
        content: version.content,
        ...(actorId ? { updatedBy: actorId } : {}),
      },
    });
  }

  async approveReview(id: string, actorId?: string | null) {
    const article = await this.db.article.findFirst({ where: { id, deletedAt: null } });
    if (!article || article.status !== 'REVIEW') return null;
    const metadata = {
      ...((article.metadata as Record<string, unknown> | null) ?? {}),
      review: {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: actorId ?? null,
      },
    };
    return this.db.article.update({
      where: { id },
      data: { status: 'DRAFT', metadata, ...(actorId ? { updatedBy: actorId } : {}) },
    });
  }

  async rejectReview(id: string, notes?: string | null, actorId?: string | null) {
    const article = await this.db.article.findFirst({ where: { id, deletedAt: null } });
    if (!article || article.status !== 'REVIEW') return null;
    const metadata = {
      ...((article.metadata as Record<string, unknown> | null) ?? {}),
      review: {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectedBy: actorId ?? null,
        notes: notes ?? null,
      },
    };
    return this.db.article.update({
      where: { id },
      data: { status: 'DRAFT', metadata, ...(actorId ? { updatedBy: actorId } : {}) },
    });
  }

  async setRelated(articleId: string, relatedIds: string[]) {
    await this.db.$transaction([
      this.db.articleRelated.deleteMany({ where: { articleId } }),
      ...(relatedIds.length
        ? [
            this.db.articleRelated.createMany({
              data: relatedIds.map((relatedId, index) => ({
                articleId,
                relatedId,
                sortOrder: index,
              })),
            }),
          ]
        : []),
    ]);
  }

  async publishDue(now = new Date()) {
    const due = await this.db.article.findMany({
      where: {
        deletedAt: null,
        status: 'SCHEDULED',
        publishedAt: { lte: now },
      },
      select: { id: true, slug: true },
    });
    if (!due.length) return { count: 0, slugs: [] as string[] };
    await this.db.article.updateMany({
      where: { id: { in: due.map((row) => row.id) } },
      data: { status: 'PUBLISHED' },
    });
    return { count: due.length, slugs: due.map((row) => row.slug) };
  }

  recent(limit = 10) {
    return this.db.article.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        updatedAt: true,
        publishedAt: true,
      },
    });
  }

  coverageIndex(limit = 500) {
    return this.db.article.findMany({
      where: { deletedAt: null },
      select: { title: true, slug: true },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });
  }
}

export class CategoryRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return findActiveById(this.db.category, id);
  }

  findBySlug(slug: string) {
    return this.db.category.findFirst({
      where: { slug, deletedAt: null },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: {
          where: { deletedAt: null },
          orderBy: { name: 'asc' },
          select: { id: true, name: true, slug: true, status: true, parentId: true },
        },
      },
    });
  }

  list(params: CursorPageParams & { status?: PublishStatus; search?: string; parentId?: string | null } = {}) {
    return listActiveWithCursor<Category>(this.db.category, {
      ...params,
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.parentId !== undefined
          ? params.parentId === null
            ? { parentId: null }
            : { parentId: params.parentId }
          : {}),
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
        parent: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  listTree(params: { status?: PublishStatus } = {}) {
    return this.db.category.findMany({
      where: {
        deletedAt: null,
        parentId: null,
        ...(params.status ? { status: params.status } : {}),
      },
      include: {
        children: {
          where: {
            deletedAt: null,
            ...(params.status ? { status: params.status } : {}),
          },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            status: true,
            parentId: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  create(data: Prisma.CategoryCreateInput) {
    return this.db.category.create({ data });
  }

  update(id: string, data: Prisma.CategoryUpdateInput) {
    return this.db.category.update({ where: { id }, data });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.category, id, actorId);
  }
}

export class PageRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.page.findFirst({ where: { id, deletedAt: null } });
  }

  findBySlug(slug: string) {
    return this.db.page.findFirst({ where: { slug, deletedAt: null } });
  }

  list(params: CursorPageParams & { status?: PublishStatus; search?: string } = {}) {
    return listActiveWithCursor(this.db.page, {
      ...params,
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.search
          ? {
              OR: [
                { title: { contains: params.search, mode: 'insensitive' } },
                { slug: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
    });
  }

  create(data: Prisma.PageCreateInput) {
    return this.db.page.create({ data });
  }

  update(id: string, data: Prisma.PageUpdateInput) {
    return this.db.page.update({ where: { id }, data });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.page, id, actorId);
  }

  countAll() {
    return this.db.page.count({ where: { deletedAt: null } });
  }

  countByStatus(status: PublishStatus) {
    return this.db.page.count({ where: { deletedAt: null, status } });
  }

  async publish(id: string, actorId?: string | null) {
    return this.db.$transaction(async (tx) => {
      const page = await tx.page.findFirst({ where: { id, deletedAt: null } });
      if (!page) return null;

      const updated = await tx.page.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          publishedAt: page.publishedAt ?? new Date(),
          ...(actorId ? { updatedBy: actorId } : {}),
        },
      });

      const latest = await tx.pageVersion.findFirst({
        where: { pageId: id },
        orderBy: { version: 'desc' },
      });

      await tx.pageVersion.create({
        data: {
          pageId: id,
          title: updated.title,
          content: updated.content,
          version: (latest?.version ?? 0) + 1,
          createdBy: actorId ?? undefined,
        },
      });

      return updated;
    });
  }

  async schedule(id: string, publishedAt: Date, actorId?: string | null) {
    const page = await this.db.page.findFirst({ where: { id, deletedAt: null } });
    if (!page) return null;
    return this.db.page.update({
      where: { id },
      data: {
        status: 'SCHEDULED',
        publishedAt,
        ...(actorId ? { updatedBy: actorId } : {}),
      },
    });
  }

  async submitReview(id: string, actorId?: string | null) {
    const page = await this.db.page.findFirst({ where: { id, deletedAt: null } });
    if (!page) return null;
    return this.db.page.update({
      where: { id },
      data: {
        status: 'REVIEW',
        ...(actorId ? { updatedBy: actorId } : {}),
      },
    });
  }

  listVersions(pageId: string) {
    return this.db.pageVersion.findMany({
      where: { pageId },
      orderBy: { version: 'desc' },
    });
  }

  findVersion(pageId: string, versionId: string) {
    return this.db.pageVersion.findFirst({
      where: { id: versionId, pageId },
    });
  }

  async restoreVersion(pageId: string, versionId: string, actorId?: string | null) {
    const version = await this.findVersion(pageId, versionId);
    if (!version) return null;
    return this.db.page.update({
      where: { id: pageId },
      data: {
        title: version.title,
        content: version.content,
        ...(actorId ? { updatedBy: actorId } : {}),
      },
    });
  }

  async approveReview(id: string, actorId?: string | null) {
    const page = await this.db.page.findFirst({ where: { id, deletedAt: null } });
    if (!page || page.status !== 'REVIEW') return null;
    const metadata = {
      ...((page.metadata as Record<string, unknown> | null) ?? {}),
      review: {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: actorId ?? null,
      },
    };
    return this.db.page.update({
      where: { id },
      data: { status: 'DRAFT', metadata, ...(actorId ? { updatedBy: actorId } : {}) },
    });
  }

  async rejectReview(id: string, notes?: string | null, actorId?: string | null) {
    const page = await this.db.page.findFirst({ where: { id, deletedAt: null } });
    if (!page || page.status !== 'REVIEW') return null;
    const metadata = {
      ...((page.metadata as Record<string, unknown> | null) ?? {}),
      review: {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectedBy: actorId ?? null,
        notes: notes ?? null,
      },
    };
    return this.db.page.update({
      where: { id },
      data: { status: 'DRAFT', metadata, ...(actorId ? { updatedBy: actorId } : {}) },
    });
  }

  async publishDue(now = new Date()) {
    const due = await this.db.page.findMany({
      where: {
        deletedAt: null,
        status: 'SCHEDULED',
        publishedAt: { lte: now },
      },
      select: { id: true, slug: true },
    });
    if (!due.length) return { count: 0, slugs: [] as string[] };
    await this.db.page.updateMany({
      where: { id: { in: due.map((row) => row.id) } },
      data: { status: 'PUBLISHED' },
    });
    return { count: due.length, slugs: due.map((row) => row.slug) };
  }

  recent(limit = 10) {
    return this.db.page.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        updatedAt: true,
        publishedAt: true,
      },
    });
  }
}

export class MenuRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.menu.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  findByLocation(location: string) {
    return this.db.menu.findFirst({
      where: { location, deletedAt: null },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  findBySlug(slug: string) {
    return this.db.menu.findFirst({
      where: { slug, deletedAt: null },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  list(params: CursorPageParams & { location?: string; search?: string } = {}) {
    return listActiveWithCursor(this.db.menu, {
      ...params,
      where: {
        ...(params.location ? { location: params.location } : {}),
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { slug: { contains: params.search, mode: 'insensitive' } },
                { location: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { items: true } },
      },
    });
  }

  create(data: Prisma.MenuCreateInput) {
    return this.db.menu.create({
      data,
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  update(id: string, data: Prisma.MenuUpdateInput) {
    return this.db.menu.update({
      where: { id },
      data,
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.menu, id, actorId);
  }

  createItem(data: Prisma.MenuItemCreateInput) {
    return this.db.menuItem.create({ data });
  }

  updateItem(id: string, data: Prisma.MenuItemUpdateInput) {
    return this.db.menuItem.update({ where: { id }, data });
  }

  softDeleteItem(id: string, actorId?: string | null) {
    return softDeleteById(this.db.menuItem, id, actorId);
  }

  async reorderItems(menuId: string, orderedIds: string[]) {
    await this.db.$transaction(
      orderedIds.map((id, index) =>
        this.db.menuItem.updateMany({
          where: { id, menuId, deletedAt: null },
          data: { sortOrder: index },
        }),
      ),
    );
    return this.findById(menuId);
  }
}

export class TagRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findBySlug(slug: string) {
    return this.db.tag.findFirst({
      where: { slug, deletedAt: null },
      include: {
        _count: { select: { articles: true } },
      },
    });
  }

  findById(id: string) {
    return this.db.tag.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { articles: true } },
      },
    });
  }

  list(params: CursorPageParams & { search?: string } = {}) {
    return listActiveWithCursor<Tag>(this.db.tag, {
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
        _count: { select: { articles: true } },
      },
    });
  }

  create(data: Prisma.TagCreateInput) {
    return this.db.tag.create({ data });
  }

  update(id: string, data: Prisma.TagUpdateInput) {
    return this.db.tag.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return softDeleteById(this.db.tag, id);
  }
}

export class CommentRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.comment.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
            email: true,
          },
        },
        article: { select: { id: true, title: true, slug: true, status: true } },
      },
    });
  }

  listByArticle(
    articleId: string,
    params: { status?: PublishStatus; cursor?: string; limit?: number } = {},
  ) {
    const limit = Math.min(params.limit ?? 50, 100);
    return this.db.comment.findMany({
      where: {
        articleId,
        deletedAt: null,
        ...(params.status ? { status: params.status } : {}),
      },
      take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  listModeration(params: {
    status?: PublishStatus;
    cursor?: string;
    limit?: number;
    articleId?: string;
  }) {
    const limit = Math.min(params.limit ?? 25, 100);
    return this.db.comment.findMany({
      where: {
        deletedAt: null,
        ...(params.status ? { status: params.status } : {}),
        ...(params.articleId ? { articleId: params.articleId } : {}),
      },
      take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            email: true,
          },
        },
        article: { select: { id: true, title: true, slug: true } },
      },
    });
  }

  create(data: Prisma.CommentCreateInput) {
    return this.db.comment.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  update(id: string, data: Prisma.CommentUpdateInput) {
    return this.db.comment.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  softDelete(id: string) {
    return softDeleteById(this.db.comment, id);
  }

  countByArticle(articleId: string, status: PublishStatus = 'PUBLISHED') {
    return this.db.comment.count({
      where: { articleId, status, deletedAt: null },
    });
  }
}
