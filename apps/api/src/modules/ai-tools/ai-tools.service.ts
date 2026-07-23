import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { Repositories } from '@varnarc/database';
import type {
  AiToolsBulkActionInput,
  AiToolsCompareQuery,
  AiToolsQuery,
  AiToolTrackEventInput,
  AiUtilityRunInput,
  CreateAiCategoryInput,
  CreateAiToolBookmarkInput,
  CreateAiToolInput,
  CursorPaginationQuery,
  FollowAiCategoryInput,
  RenameAiFeatureInput,
  UpdateAiCategoryInput,
  UpdateAiToolInput,
} from '@varnarc/validation';
import { REPOS } from '../../database/database.module';
import { SearchIndexerService } from '../search/search-indexer.service';

const CACHE_TTL = 60_000;
const AI_TOOL_ENTITY = 'ai_tool';

@Injectable()
export class AiToolsService {
  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly searchIndexer: SearchIndexerService,
  ) {}

  private async audit(actorId: string, action: string, entityId: string, newValue?: object) {
    await this.repos.auditLogs.create({
      userId: actorId,
      action,
      entity: AI_TOOL_ENTITY,
      entityId,
      newValue: newValue as never,
    });
  }

  private async bustCache(slug?: string) {
    await Promise.all([
      this.cache.del('ai-tools:categories'),
      this.cache.del('ai-tools:published'),
      this.cache.del('ai-tools:analytics'),
      ...(slug ? [this.cache.del(`ai-tools:slug:${slug}`)] : []),
    ]);
  }

  // ── Categories ──────────────────────────────────────────────

  async listCategories(query: CursorPaginationQuery) {
    const cacheKey = !query.cursor && !query.search ? 'ai-tools:categories' : null;
    if (cacheKey) {
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached as Awaited<ReturnType<typeof this.repos.aiCategories.list>>;
    }
    const page = await this.repos.aiCategories.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      search: query.search,
    });
    if (cacheKey) await this.cache.set(cacheKey, page, CACHE_TTL);
    return page;
  }

  async getCategoryBySlug(slug: string) {
    const row = await this.repos.aiCategories.findBySlug(slug);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Category not found.' },
      });
    }
    return row;
  }

  async createCategory(input: CreateAiCategoryInput, actorId: string) {
    const existing = await this.repos.aiCategories.findBySlug(input.slug);
    if (existing) {
      throw new ConflictException({
        success: false,
        error: { code: 'DUPLICATE', message: 'A category with this slug already exists.' },
      });
    }
    const row = await this.repos.aiCategories.create({
      name: input.name,
      slug: input.slug,
      icon: input.icon ?? null,
      description: input.description ?? null,
      sortOrder: input.sortOrder ?? 0,
      ...(input.parentId ? { parent: { connect: { id: input.parentId } } } : {}),
    });
    await this.audit(actorId, 'ai-tools.category.create', row.id, row);
    await this.bustCache();
    return row;
  }

  async updateCategory(id: string, input: UpdateAiCategoryInput, actorId: string) {
    const existing = await this.repos.aiCategories.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Category not found.' },
      });
    }
    const row = await this.repos.aiCategories.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.parentId !== undefined
        ? input.parentId
          ? { parent: { connect: { id: input.parentId } } }
          : { parent: { disconnect: true } }
        : {}),
    });
    await this.audit(actorId, 'ai-tools.category.update', id, row);
    await this.bustCache();
    return row;
  }

  async deleteCategory(id: string, actorId: string) {
    const existing = await this.repos.aiCategories.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Category not found.' },
      });
    }
    await this.repos.aiCategories.softDelete(id);
    await this.audit(actorId, 'ai-tools.category.delete', id);
    await this.bustCache();
    return { id, deleted: true };
  }

  // ── Tools ───────────────────────────────────────────────────

  async list(query: AiToolsQuery, publishedOnly = true) {
    const cacheKey =
      publishedOnly &&
      !query.cursor &&
      !query.search &&
      !query.category &&
      !query.pricingModel &&
      query.featured === undefined &&
      query.sponsored === undefined &&
      query.freePlan === undefined &&
      query.freeTrial === undefined &&
      query.apiAvailable === undefined &&
      !query.feature &&
      !query.sort
        ? 'ai-tools:published'
        : null;

    if (cacheKey) {
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached as Awaited<ReturnType<typeof this.repos.aiTools.list>>;
    }

    const page = await this.repos.aiTools.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      search: query.search,
      status: query.status ?? (publishedOnly ? 'PUBLISHED' : undefined),
      categorySlug: query.category,
      pricingModel: query.pricingModel,
      featured: query.featured,
      sponsored: query.sponsored,
      freePlan: query.freePlan,
      freeTrial: query.freeTrial,
      apiAvailable: query.apiAvailable,
      feature: query.feature,
      sort: query.sort,
    });

    if (cacheKey) await this.cache.set(cacheKey, page, CACHE_TTL);
    return page;
  }

  adminList(query: AiToolsQuery) {
    return this.list(query, false);
  }

  async getById(id: string, publishedOnly = true) {
    const row = await this.repos.aiTools.findById(id);
    if (!row || (publishedOnly && row.status !== 'PUBLISHED')) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'AI tool not found.' },
      });
    }
    return row;
  }

  async getBySlug(slug: string, publishedOnly = true, userId?: string) {
    const cacheKey = publishedOnly ? `ai-tools:slug:${slug}` : null;
    if (cacheKey) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        const row = cached as NonNullable<Awaited<ReturnType<typeof this.repos.aiTools.findBySlug>>>;
        if (userId) await this.recordView(userId, row.id).catch(() => undefined);
        return row;
      }
    }
    const row = await this.repos.aiTools.findBySlug(slug);
    if (!row || (publishedOnly && row.status !== 'PUBLISHED')) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'AI tool not found.' },
      });
    }
    if (cacheKey) await this.cache.set(cacheKey, row, CACHE_TTL);
    if (userId) await this.recordView(userId, row.id).catch(() => undefined);
    return row;
  }

  private mapCreateInput(input: CreateAiToolInput, actorId: string) {
    return {
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      shortDescription: input.shortDescription ?? null,
      logoUrl: input.logoUrl || null,
      coverImageUrl: input.coverImageUrl || null,
      pricingModel: input.pricingModel,
      pricingDetails: input.pricingDetails ?? null,
      monthlyPrice: input.monthlyPrice ?? null,
      annualPrice: input.annualPrice ?? null,
      freePlan: input.freePlan ?? false,
      freeTrial: input.freeTrial ?? false,
      apiAvailable: input.apiAvailable ?? false,
      website: input.website || null,
      documentation: input.documentation || null,
      affiliateUrl: input.affiliateUrl || null,
      platforms: input.platforms as never,
      languages: input.languages as never,
      faqs: input.faqs as never,
      featured: input.featured ?? false,
      sponsored: input.sponsored ?? false,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      status: input.status,
      metadata: input.metadata as never,
      ...(input.categoryId ? { category: { connect: { id: input.categoryId } } } : {}),
      ...(input.companyId ? { company: { connect: { id: input.companyId } } } : {}),
      features: {
        create: input.features.map((f) => ({
          name: f.name,
          sortOrder: f.sortOrder ?? 0,
        })),
      },
      integrations: {
        create: input.integrations.map((i) => ({
          name: i.name,
          sortOrder: i.sortOrder ?? 0,
        })),
      },
      screenshots: {
        create: input.screenshots.map((s) => ({
          mediaId: s.mediaId ?? null,
          url: s.url || null,
          caption: s.caption ?? null,
          sortOrder: s.sortOrder ?? 0,
        })),
      },
      createdBy: actorId,
      updatedBy: actorId,
      ...(input.status === 'PUBLISHED' ? { publishedAt: new Date() } : {}),
    };
  }

  async create(input: CreateAiToolInput, actorId: string) {
    const existingSlug = await this.repos.aiTools.findBySlug(input.slug);
    if (existingSlug) {
      throw new ConflictException({
        success: false,
        error: { code: 'DUPLICATE', message: 'An AI tool with this slug already exists.' },
      });
    }
    const duplicate = await this.repos.aiTools.findDuplicate(input.name);
    if (duplicate) {
      throw new ConflictException({
        success: false,
        error: { code: 'DUPLICATE', message: 'An AI tool with this name already exists.' },
      });
    }
    const row = await this.repos.aiTools.create(this.mapCreateInput(input, actorId));
    await this.audit(actorId, 'ai-tools.tool.create', row.id, { name: row.name, slug: row.slug });
    await this.bustCache(row.slug);
    return row;
  }

  async update(id: string, input: UpdateAiToolInput, actorId: string) {
    const existing = await this.repos.aiTools.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'AI tool not found.' },
      });
    }

    const hasNested =
      input.features !== undefined ||
      input.integrations !== undefined ||
      input.screenshots !== undefined;

    const toolPatch = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.shortDescription !== undefined ? { shortDescription: input.shortDescription } : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl || null } : {}),
      ...(input.coverImageUrl !== undefined ? { coverImageUrl: input.coverImageUrl || null } : {}),
      ...(input.pricingModel !== undefined ? { pricingModel: input.pricingModel } : {}),
      ...(input.pricingDetails !== undefined ? { pricingDetails: input.pricingDetails } : {}),
      ...(input.monthlyPrice !== undefined ? { monthlyPrice: input.monthlyPrice } : {}),
      ...(input.annualPrice !== undefined ? { annualPrice: input.annualPrice } : {}),
      ...(input.freePlan !== undefined ? { freePlan: input.freePlan } : {}),
      ...(input.freeTrial !== undefined ? { freeTrial: input.freeTrial } : {}),
      ...(input.apiAvailable !== undefined ? { apiAvailable: input.apiAvailable } : {}),
      ...(input.website !== undefined ? { website: input.website || null } : {}),
      ...(input.documentation !== undefined ? { documentation: input.documentation || null } : {}),
      ...(input.affiliateUrl !== undefined ? { affiliateUrl: input.affiliateUrl || null } : {}),
      ...(input.platforms !== undefined ? { platforms: input.platforms as never } : {}),
      ...(input.languages !== undefined ? { languages: input.languages as never } : {}),
      ...(input.faqs !== undefined ? { faqs: input.faqs as never } : {}),
      ...(input.featured !== undefined ? { featured: input.featured } : {}),
      ...(input.sponsored !== undefined ? { sponsored: input.sponsored } : {}),
      ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
      ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata as never } : {}),
      ...(input.categoryId !== undefined
        ? input.categoryId
          ? { category: { connect: { id: input.categoryId } } }
          : { category: { disconnect: true } }
        : {}),
      ...(input.companyId !== undefined
        ? input.companyId
          ? { company: { connect: { id: input.companyId } } }
          : { company: { disconnect: true } }
        : {}),
      updatedBy: actorId,
    };

    const row = hasNested
      ? await this.repos.aiTools.replaceNested(id, {
          tool: toolPatch,
          features: input.features?.map((f) => ({
            name: f.name,
            sortOrder: f.sortOrder ?? 0,
          })),
          integrations: input.integrations?.map((i) => ({
            name: i.name,
            sortOrder: i.sortOrder ?? 0,
          })),
          screenshots: input.screenshots?.map((s) => ({
            mediaId: s.mediaId ?? null,
            url: s.url || null,
            caption: s.caption ?? null,
            sortOrder: s.sortOrder ?? 0,
          })),
        })
      : await this.repos.aiTools.update(id, toolPatch);

    await this.audit(actorId, 'ai-tools.tool.update', id, { name: row.name, slug: row.slug });
    await this.bustCache(row.slug);
    if (existing.slug !== row.slug) await this.cache.del(`ai-tools:slug:${existing.slug}`);
    return row;
  }

  async delete(id: string, actorId: string) {
    const existing = await this.repos.aiTools.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'AI tool not found.' },
      });
    }
    await this.repos.aiTools.softDelete(id);
    await this.audit(actorId, 'ai-tools.tool.delete', id);
    await this.bustCache(existing.slug);
    return { id, deleted: true };
  }

  async publish(id: string, actorId: string) {
    const existing = await this.repos.aiTools.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'AI tool not found.' },
      });
    }
    const row = await this.repos.aiTools.publish(id, actorId);
    await this.audit(actorId, 'ai-tools.tool.publish', id, { slug: row.slug });
    await this.bustCache(row.slug);
    void this.searchIndexer.indexAiTool(id);
    return row;
  }

  async unpublish(id: string, actorId: string) {
    const existing = await this.repos.aiTools.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'AI tool not found.' },
      });
    }
    const row = await this.repos.aiTools.unpublish(id, actorId);
    await this.audit(actorId, 'ai-tools.tool.unpublish', id, { slug: row.slug });
    await this.bustCache(row.slug);
    void this.searchIndexer.remove('AI_TOOL', id);
    return row;
  }

  async feature(id: string, actorId: string, featured = true) {
    const row = await this.update(id, { featured }, actorId);
    await this.audit(actorId, featured ? 'ai-tools.tool.feature' : 'ai-tools.tool.unfeature', id);
    return row;
  }

  async sponsor(id: string, actorId: string, sponsored = true) {
    const row = await this.update(id, { sponsored }, actorId);
    await this.audit(actorId, sponsored ? 'ai-tools.tool.sponsor' : 'ai-tools.tool.unsponsor', id);
    return row;
  }

  async bulkPublish(body: AiToolsBulkActionInput, actorId: string) {
    const results = [];
    for (const id of body.ids) {
      results.push(await this.publish(id, actorId));
    }
    return { count: results.length, items: results };
  }

  async bulkDelete(body: AiToolsBulkActionInput, actorId: string) {
    for (const id of body.ids) {
      await this.delete(id, actorId);
    }
    return { count: body.ids.length };
  }

  // ── Events & related ────────────────────────────────────────

  async trackEvent(toolId: string, input: AiToolTrackEventInput) {
    if (input.eventType === 'VIEW') {
      await this.repos.aiTools.incrementViews(toolId).catch(() => undefined);
    }
    return this.repos.aiToolEvents.create({
      toolId,
      eventType: input.eventType,
      metadata: input.metadata as never,
    });
  }

  async getRelated(slug: string) {
    const tool = await this.getBySlug(slug, true);
    const categoryId = tool.categoryId;

    const [userReviewSummary, userReviews, editorialReviews, comparisons, relatedInCategory] =
      await Promise.all([
        this.repos.userReviews.entityRatingSummary(AI_TOOL_ENTITY, tool.id),
        this.repos.userReviews.listByEntity(AI_TOOL_ENTITY, tool.id, { limit: 5 }),
        this.repos.reviews.list({
          entityType: AI_TOOL_ENTITY,
          entityId: tool.id,
          limit: 5,
          status: 'PUBLISHED',
        }),
        this.repos.comparisons.findByEntity(AI_TOOL_ENTITY, tool.id, 5),
        categoryId
          ? this.repos.aiTools.relatedInCategory(tool.id, categoryId, 6)
          : Promise.resolve([]),
      ]);

    return {
      tool: { id: tool.id, name: tool.name, slug: tool.slug },
      ratingSummary: userReviewSummary,
      userReviews: userReviews.items,
      editorialReviews: editorialReviews.items,
      comparisons,
      relatedInCategory,
    };
  }

  async compare(query: AiToolsCompareQuery) {
    const slugs = query.slugs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 10);
    if (slugs.length < 2) {
      throw new BadRequestException({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Provide at least two tool slugs to compare.' },
      });
    }
    const tools = await this.repos.aiTools.findBySlugs(slugs);
    const bySlug = new Map(tools.map((t) => [t.slug, t]));
    const ordered = slugs.map((slug) => bySlug.get(slug)).filter(Boolean);
    await this.repos.aiToolEvents
      .create({
        eventType: 'COMPARE',
        metadata: { slugs },
      })
      .catch(() => undefined);
    return { slugs, tools: ordered };
  }

  // ── Bookmarks & recently viewed ─────────────────────────────

  listBookmarks(userId: string, query: CursorPaginationQuery & { collectionName?: string }) {
    return this.repos.aiToolBookmarks.listByUser(userId, {
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      collectionName: query.collectionName,
    });
  }

  async createBookmark(userId: string, input: CreateAiToolBookmarkInput) {
    const tool = await this.repos.aiTools.findById(input.toolId);
    if (!tool || tool.status !== 'PUBLISHED') {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'AI tool not found.' },
      });
    }
    const row = await this.repos.aiToolBookmarks.create(userId, input.toolId, input.collectionName);
    await this.repos.aiToolEvents
      .create({ toolId: input.toolId, eventType: 'BOOKMARK' })
      .catch(() => undefined);
    return row;
  }

  async deleteBookmark(id: string, userId: string) {
    const row = await this.repos.aiToolBookmarks.softDelete(id, userId);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Bookmark not found.' },
      });
    }
    return { id, deleted: true };
  }

  async listCollections(userId: string) {
    const rows = await this.repos.aiToolBookmarks.collections(userId);
    return rows.map((r) => r.collectionName).filter(Boolean);
  }

  recentlyViewed(userId: string, limit = 12) {
    return this.repos.aiToolRecentlyViewed.list(userId, limit);
  }

  recordView(userId: string, toolId: string) {
    return this.repos.aiToolRecentlyViewed.upsert(userId, toolId);
  }

  async listFollows(userId: string) {
    return this.repos.aiCategoryFollows.listByUser(userId);
  }

  async followCategory(userId: string, input: FollowAiCategoryInput) {
    const category = await this.repos.aiCategories.findById(input.categoryId);
    if (!category) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Category not found.' },
      });
    }
    return this.repos.aiCategoryFollows.follow(userId, input.categoryId);
  }

  async unfollowCategory(userId: string, categoryId: string) {
    const row = await this.repos.aiCategoryFollows.unfollow(userId, categoryId);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Follow not found.' },
      });
    }
    return row;
  }

  recommendations(userId: string, limit = 12) {
    return this.repos.aiTools.recommendForUser(userId, limit);
  }

  featureCatalog() {
    return this.repos.aiTools.featureCatalog();
  }

  async renameFeature(input: RenameAiFeatureInput, actorId: string) {
    if (input.fromName === input.toName) {
      throw new BadRequestException({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'fromName and toName must differ.' },
      });
    }
    const result = await this.repos.aiTools.renameFeature(input.fromName, input.toName);
    await this.audit(actorId, 'ai-tools.feature.rename', actorId, { ...input, ...result });
    await this.bustCache();
    return result;
  }

  async deleteFeature(name: string, actorId: string) {
    const result = await this.repos.aiTools.deleteFeatureByName(name);
    await this.audit(actorId, 'ai-tools.feature.delete', actorId, { name, ...result });
    await this.bustCache();
    return result;
  }

  bookmarkAdminStats() {
    return this.repos.aiToolBookmarks.adminStats();
  }

  // ── Analytics / CSV / history ───────────────────────────────

  async analytics() {
    const cached = await this.cache.get('ai-tools:analytics');
    if (cached) {
      return cached as Awaited<ReturnType<Repositories['aiTools']['analyticsSummary']>> & {
        events: Awaited<ReturnType<Repositories['aiToolEvents']['countsByType']>>;
      };
    }
    const [summary, events, bookmarkStats] = await Promise.all([
      this.repos.aiTools.analyticsSummary(),
      this.repos.aiToolEvents.countsByType(),
      this.repos.aiToolBookmarks.adminStats(),
    ]);
    const merged = { ...summary, events, bookmarkStats };
    await this.cache.set('ai-tools:analytics', merged, CACHE_TTL);
    return merged;
  }

  async exportCsv() {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = await this.repos.aiTools.exportRows();
    return [
      'id,name,slug,description,pricingModel,freePlan,freeTrial,apiAvailable,website,documentation,affiliateUrl,featured,sponsored,status,category',
      ...rows.map((r) =>
        [
          r.id,
          r.name,
          r.slug,
          r.description,
          r.pricingModel,
          r.freePlan,
          r.freeTrial,
          r.apiAvailable,
          r.website,
          r.documentation,
          r.affiliateUrl,
          r.featured,
          r.sponsored,
          r.status,
          r.category?.slug ?? '',
        ]
          .map(esc)
          .join(','),
      ),
    ].join('\n');
  }

  async importCsv(csvText: string, actorId: string) {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'CSV must include a header row and at least one data row.',
        },
      });
    }
    const headers = lines[0]!.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map((line) => {
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = cols[i] ?? '';
      });
      return row;
    });

    let imported = 0;
    let updated = 0;
    for (const row of rows) {
      if (!row.name || !row.slug) continue;
      const existing = await this.repos.aiTools.findBySlug(row.slug);
      let categoryId: string | undefined;
      if (row.category) {
        const cat = await this.repos.aiCategories.findBySlug(row.category);
        categoryId = cat?.id;
      }
      const payload = {
        name: row.name,
        slug: row.slug,
        description: row.description || null,
        pricingModel: (row.pricingModel as never) || 'FREEMIUM',
        freePlan: row.freePlan === 'true',
        freeTrial: row.freeTrial === 'true',
        apiAvailable: row.apiAvailable === 'true',
        website: row.website || null,
        documentation: row.documentation || null,
        affiliateUrl: row.affiliateUrl || null,
        featured: row.featured === 'true',
        sponsored: row.sponsored === 'true',
        status: (row.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
        updatedBy: actorId,
        ...(categoryId
          ? { category: { connect: { id: categoryId } } }
          : {}),
      };

      if (existing) {
        await this.repos.aiTools.update(existing.id, payload);
        updated += 1;
      } else {
        await this.repos.aiTools.create({
          ...payload,
          createdBy: actorId,
        });
        imported += 1;
      }
    }
    await this.bustCache();
    await this.audit(actorId, 'ai-tools.import', actorId, { imported, updated });
    return { imported, updated };
  }

  history(id: string) {
    return this.repos.auditLogs.list({
      entity: AI_TOOL_ENTITY,
      entityId: id,
      limit: 50,
      direction: 'desc',
    });
  }

  // ── Embedded utilities (deterministic, no LLM) ──────────────

  runUtility(input: AiUtilityRunInput) {
    const text = input.input.trim();
    const options = input.options ?? {};

    switch (input.utility) {
      case 'prompt-generator': {
        const role = typeof options.role === 'string' ? options.role : 'expert assistant';
        const output = [
          `You are a ${role}.`,
          '',
          'Task:',
          text,
          '',
          'Constraints:',
          '- Be clear and specific',
          '- Use concrete examples where helpful',
          '- Return structured output when appropriate',
        ].join('\n');
        return { utility: input.utility, output };
      }
      case 'text-summarizer': {
        const maxWords = typeof options.maxWords === 'number' ? options.maxWords : 60;
        const words = text.split(/\s+/).filter(Boolean);
        const summary =
          words.length <= maxWords
            ? text
            : `${words.slice(0, maxWords).join(' ')}…`;
        return { utility: input.utility, output: summary, wordCount: Math.min(words.length, maxWords) };
      }
      case 'seo-title': {
        const title = text
          .replace(/\s+/g, ' ')
          .replace(/[^\w\s|:-]/g, '')
          .trim()
          .slice(0, 60);
        return { utility: input.utility, output: title, length: title.length };
      }
      case 'meta-description': {
        const desc = text.replace(/\s+/g, ' ').trim().slice(0, 155);
        return { utility: input.utility, output: desc, length: desc.length };
      }
      case 'keyword-cluster': {
        const stop = new Set([
          'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
          'is', 'are', 'was', 'were', 'be', 'this', 'that', 'it', 'as', 'from', 'your', 'you',
        ]);
        const freq = new Map<string, number>();
        for (const raw of text.toLowerCase().match(/[a-z0-9][a-z0-9-]+/g) ?? []) {
          if (raw.length < 3 || stop.has(raw)) continue;
          freq.set(raw, (freq.get(raw) ?? 0) + 1);
        }
        const clusters = [...freq.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([term, count]) => ({ term, count }));
        return { utility: input.utility, output: clusters.map((c) => c.term).join(', '), clusters };
      }
      case 'regex-generator': {
        const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = `\\b${escaped}\\b`;
        return { utility: input.utility, output: pattern, flags: 'i' };
      }
      case 'json-formatter': {
        try {
          const parsed = JSON.parse(text) as unknown;
          const output = JSON.stringify(parsed, null, 2);
          return { utility: input.utility, output, valid: true };
        } catch (err) {
          throw new BadRequestException({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: err instanceof Error ? err.message : 'Invalid JSON input.',
            },
          });
        }
      }
      case 'markdown-converter': {
        let html = text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        html = html
          .replace(/^### (.+)$/gm, '<h3>$1</h3>')
          .replace(/^## (.+)$/gm, '<h2>$1</h2>')
          .replace(/^# (.+)$/gm, '<h1>$1</h1>')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/`([^`]+)`/g, '<code>$1</code>')
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
          .replace(/\n\n+/g, '</p><p>')
          .replace(/\n/g, '<br/>');
        return { utility: input.utility, output: `<p>${html}</p>` };
      }
      default:
        throw new BadRequestException({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Unknown utility.' },
        });
    }
  }
}
