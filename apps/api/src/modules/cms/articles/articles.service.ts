import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import {
  hasPermission,
  isAdminRole,
  PERMISSIONS,
} from '@varnarc/auth';
import type {
  CreateArticleInput,
  CursorPaginationQuery,
  ScheduleContentInput,
  UpdateArticleInput,
} from '@varnarc/validation';
import type { CurrentUser } from '@varnarc/types';
import { REPOS } from '../../../database/database.module';
import {
  CACHE_MANAGER,
  cmsCacheKeys,
  estimateReadingTimeMinutes,
  invalidateCmsCache,
  type Cache,
} from '../cms-cache';
import { SearchIndexerService } from '../../search/search-indexer.service';
import { buildEditorialSuggestions } from './article-editorial-suggestions';

@Injectable()
export class ArticlesService {
  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly searchIndexer: SearchIndexerService,
  ) {}

  list(
    query: CursorPaginationQuery & {
      status?: string;
      categoryId?: string;
      categorySlug?: string;
      parentCategorySlug?: string;
      featured?: boolean;
    },
  ) {
    return this.repos.articles.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      search: query.search,
      status: query.status as never,
      categoryId: query.categoryId,
      categorySlug: query.categorySlug,
      parentCategorySlug: query.parentCategorySlug,
      featured: query.featured,
    });
  }

  async editorialSuggestions(
    limit = 12,
    filters: {
      parentCategorySlug?: string;
      categorySlug?: string;
      source?: 'trending' | 'popular' | 'search_demand' | 'content_gap' | 'editorial' | 'all';
    } = {},
  ) {
    const [articles, trending, popular, topQueries, zeroResults] = await Promise.all([
      this.repos.articles.coverageIndex(),
      this.repos.popularSearches.trending(15),
      this.repos.popularSearches.top(15),
      this.repos.searchQueries.topQueries(20),
      this.repos.searchQueries.zeroResultQueries(20),
    ]);

    return buildEditorialSuggestions({
      articles,
      trending: trending.map((row) => ({ keyword: row.keyword, searchCount: row.searchCount })),
      popular: popular.map((row) => ({ keyword: row.keyword, searchCount: row.searchCount })),
      topQueries: topQueries.map((row) => ({ query: row.query, count: row._count._all })),
      zeroResultQueries: zeroResults.map((row) => ({ query: row.query })),
      limit,
      parentCategorySlug: filters.parentCategorySlug,
      categorySlug: filters.categorySlug,
      source: filters.source ?? 'all',
    });
  }

  async getById(id: string) {
    const row = await this.repos.articles.findById(id);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Article not found.' },
      });
    }
    const seo = await this.repos.seo.findByEntity('article', id);
    return { ...row, seo };
  }

  async getPublishedBySlug(slug: string) {
    const cacheKey = cmsCacheKeys.articleSlug(slug);
    const cached = await this.cache.get<unknown>(cacheKey);
    if (cached) return cached;

    const row = await this.repos.articles.findBySlug(slug);
    if (!row || row.status !== 'PUBLISHED') {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Article not found.' },
      });
    }
    const seo = await this.repos.seo.findByEntity('article', row.id);
    const relatedFrom = (
      row as typeof row & {
        relatedFrom?: Array<{ related: { id: string; status: string } }>;
      }
    ).relatedFrom;
    const related = (relatedFrom || [])
      .map((r) => r.related)
      .filter((a) => a.status === 'PUBLISHED');
    const payload = { ...row, seo, related };
    await this.cache.set(cacheKey, payload, 60_000);
    return payload;
  }

  private assertCanEdit(article: { authorId: string }, user: CurrentUser) {
    if (isAdminRole(user.roles)) return;
    if (hasPermission(user.permissions, PERMISSIONS.ARTICLE_PUBLISH)) return;
    if (article.authorId === user.id) return;
    throw new ForbiddenException({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Authors can only edit their own content.',
      },
    });
  }

  private async audit(
    actorId: string,
    action: string,
    entityId: string,
    oldValue?: object,
    newValue?: object,
  ) {
    await this.repos.auditLogs.create({
      userId: actorId,
      action,
      entity: 'article',
      entityId,
      oldValue: oldValue as never,
      newValue: newValue as never,
    });
  }

  private async bust(slug?: string | null) {
    const keys = [cmsCacheKeys.articlesList('published')];
    if (slug) keys.push(cmsCacheKeys.articleSlug(slug));
    await invalidateCmsCache(this.cache, keys);
  }

  async create(input: CreateArticleInput, authorId: string) {
    const { tagIds, relatedIds, seo, ...rest } = input;
    const readingTimeMinutes =
      rest.readingTimeMinutes ?? estimateReadingTimeMinutes(rest.content);

    const article = await this.repos.articles.create({
      title: rest.title,
      slug: rest.slug,
      excerpt: rest.excerpt ?? null,
      content: rest.content,
      status: rest.status,
      publishedAt: rest.publishedAt ?? undefined,
      isFeatured: rest.isFeatured ?? false,
      readingTimeMinutes,
      metadata: rest.metadata as never,
      author: { connect: { id: authorId } },
      ...(rest.categoryId ? { category: { connect: { id: rest.categoryId } } } : {}),
      ...(rest.featuredImageId
        ? { featuredImage: { connect: { id: rest.featuredImageId } } }
        : {}),
      ...(tagIds?.length
        ? { tags: { create: tagIds.map((tagId) => ({ tagId })) } }
        : {}),
      createdBy: authorId,
      updatedBy: authorId,
    });

    if (relatedIds?.length) {
      await this.repos.articles.setRelated(article.id, relatedIds);
    }

    if (seo) {
      await this.repos.seo.upsert('article', article.id, {
        title: seo.title ?? undefined,
        description: seo.description ?? undefined,
        canonicalUrl: seo.canonicalUrl || undefined,
        ogImage: seo.ogImage || undefined,
        robots: seo.robots ?? undefined,
        structuredData: seo.structuredData as never,
      });
    }

    await this.audit(authorId, 'article.create', article.id, undefined, {
      title: article.title,
      slug: article.slug,
      status: article.status,
    });
    await this.bust(article.slug);

    return this.getById(article.id);
  }

  async update(id: string, input: UpdateArticleInput, user: CurrentUser) {
    const existing = await this.getById(id);
    this.assertCanEdit(existing, user);
    const { tagIds, relatedIds, seo, categoryId, featuredImageId, ...rest } = input;

    if (tagIds) {
      await this.repos.articles.update(id, { tags: { deleteMany: {} } });
      if (tagIds.length) {
        await this.repos.articles.update(id, {
          tags: { create: tagIds.map((tagId) => ({ tagId })) },
        });
      }
    }

    if (relatedIds) {
      await this.repos.articles.setRelated(id, relatedIds);
    }

    const content = rest.content ?? existing.content;
    const readingTimeMinutes =
      rest.readingTimeMinutes !== undefined
        ? rest.readingTimeMinutes
        : estimateReadingTimeMinutes(content);

    await this.repos.articles.update(id, {
      ...rest,
      readingTimeMinutes,
      metadata: rest.metadata as never,
      ...(categoryId !== undefined
        ? categoryId
          ? { category: { connect: { id: categoryId } } }
          : { category: { disconnect: true } }
        : {}),
      ...(featuredImageId !== undefined
        ? featuredImageId
          ? { featuredImage: { connect: { id: featuredImageId } } }
          : { featuredImage: { disconnect: true } }
        : {}),
      updatedBy: user.id,
    });

    if (seo) {
      await this.repos.seo.upsert('article', id, {
        title: seo.title ?? undefined,
        description: seo.description ?? undefined,
        canonicalUrl: seo.canonicalUrl || undefined,
        ogImage: seo.ogImage || undefined,
        robots: seo.robots ?? undefined,
        structuredData: seo.structuredData as never,
      });
    }

    const updated = await this.getById(id);
    await this.audit(user.id, 'article.update', id, { status: existing.status }, {
      status: updated.status,
      title: updated.title,
    });
    await this.bust(existing.slug);
    await this.bust(updated.slug);
    void this.searchIndexer.indexArticle(id);
    return updated;
  }

  async publish(id: string, user: CurrentUser) {
    const existing = await this.getById(id);
    this.assertCanEdit(existing, user);
    const row = await this.repos.articles.publish(id, user.id);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Article not found.' },
      });
    }
    await this.audit(user.id, 'article.publish', id, { status: existing.status }, {
      status: 'PUBLISHED',
    });
    await this.bust(existing.slug);
    void this.searchIndexer.indexArticle(id);
    return this.getById(id);
  }

  async schedule(id: string, input: ScheduleContentInput, user: CurrentUser) {
    const existing = await this.getById(id);
    this.assertCanEdit(existing, user);
    const row = await this.repos.articles.schedule(id, input.publishedAt, user.id);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Article not found.' },
      });
    }
    await this.audit(user.id, 'article.schedule', id, { status: existing.status }, {
      status: 'SCHEDULED',
      publishedAt: input.publishedAt.toISOString(),
    });
    await this.bust(existing.slug);
    return this.getById(id);
  }

  async submitReview(id: string, user: CurrentUser) {
    const existing = await this.getById(id);
    this.assertCanEdit(existing, user);
    const row = await this.repos.articles.submitReview(id, user.id);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Article not found.' },
      });
    }
    await this.audit(user.id, 'article.submit_review', id, { status: existing.status }, {
      status: 'REVIEW',
    });
    return this.getById(id);
  }

  async approveReview(id: string, user: CurrentUser) {
    const existing = await this.getById(id);
    if (existing.status !== 'REVIEW') {
      throw new BadRequestException('Article is not in review');
    }
    const row = await this.repos.articles.approveReview(id, user.id);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Article not found.' },
      });
    }
    await this.audit(user.id, 'article.approve_review', id, { status: existing.status }, {
      status: 'DRAFT',
    });
    return this.getById(id);
  }

  async rejectReview(id: string, notes: string | null | undefined, user: CurrentUser) {
    const existing = await this.getById(id);
    if (existing.status !== 'REVIEW') {
      throw new BadRequestException('Article is not in review');
    }
    const row = await this.repos.articles.rejectReview(id, notes, user.id);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Article not found.' },
      });
    }
    await this.audit(user.id, 'article.reject_review', id, { status: existing.status }, {
      status: 'DRAFT',
      notes: notes ?? null,
    });
    return this.getById(id);
  }

  async duplicate(id: string, user: CurrentUser) {
    const source = await this.getById(id);
    this.assertCanEdit(source, user);
    const slug = `${source.slug}-copy-${Date.now().toString(36)}`;
    const sourceAny = source as typeof source & {
      tags?: Array<{ tagId?: string; tag?: { id: string } }>;
      relatedFrom?: Array<{ relatedId?: string; related?: { id: string } }>;
    };
    const tagIds = (sourceAny.tags || [])
      .map((t) => t.tagId || t.tag?.id)
      .filter(Boolean) as string[];
    const relatedIds = (sourceAny.relatedFrom || [])
      .map((r) => r.relatedId || r.related?.id)
      .filter(Boolean) as string[];

    return this.create(
      {
        title: `${source.title} (Copy)`,
        slug,
        excerpt: source.excerpt,
        content: source.content,
        status: 'DRAFT',
        isFeatured: false,
        categoryId: source.categoryId,
        featuredImageId: source.featuredImageId,
        tagIds,
        relatedIds,
        metadata: source.metadata as never,
        seo: source.seo
          ? {
              title: source.seo.title,
              description: source.seo.description,
              canonicalUrl: source.seo.canonicalUrl,
              ogImage: source.seo.ogImage,
              robots: source.seo.robots,
              structuredData: source.seo.structuredData,
            }
          : undefined,
      },
      user.id,
    );
  }

  async versions(id: string) {
    await this.getById(id);
    return this.repos.articles.listVersions(id);
  }

  async getVersion(articleId: string, versionId: string) {
    await this.getById(articleId);
    const version = await this.repos.articles.findVersion(articleId, versionId);
    if (!version) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Article version not found.' },
      });
    }
    return version;
  }

  async restoreVersion(articleId: string, versionId: string, user: CurrentUser) {
    const existing = await this.getById(articleId);
    this.assertCanEdit(existing, user);
    const version = await this.repos.articles.findVersion(articleId, versionId);
    if (!version) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Article version not found.' },
      });
    }
    await this.repos.articles.restoreVersion(articleId, versionId, user.id);
    await this.audit(user.id, 'article.version.restore', articleId, undefined, {
      versionId,
      version: version.version,
    });
    await this.bust(existing.slug);
    void this.searchIndexer.indexArticle(articleId);
    return this.getById(articleId);
  }

  async remove(id: string, user: CurrentUser) {
    const existing = await this.getById(id);
    this.assertCanEdit(existing, user);
    const ok = await this.repos.articles.softDelete(id, user.id);
    if (!ok) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Article not found.' },
      });
    }
    await this.audit(user.id, 'article.delete', id, { slug: existing.slug });
    await this.bust(existing.slug);
    void this.searchIndexer.remove('ARTICLE', id);
    return { deleted: true };
  }
}
