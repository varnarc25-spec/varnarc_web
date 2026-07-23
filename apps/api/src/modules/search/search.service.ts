import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import type {
  SearchAutocompleteInput,
  SearchQueryInput,
  SearchReindexInput,
} from '@varnarc/validation';
import { searchEntityTypes } from '@varnarc/validation';
import { randomUUID } from 'crypto';
import { REPOS } from '../../database/database.module';
import { SearchCacheService } from './search-cache.service';
import { SEARCH_ENGINE_ADAPTER, type SearchEngineAdapter } from './search-engine.adapter';
import { isOpenSearchReadEnabled, getOpenSearchConfig, OpenSearchClient, resolvedSearchEngine } from './opensearch.client';
import { OpenSearchQueryService } from './opensearch.query';

type SearchEntityType = (typeof searchEntityTypes)[number];

const MODULE_ENTITY_TYPES: Record<string, SearchEntityType[]> = {
  cms: ['ARTICLE', 'PAGE', 'CMS_CATEGORY', 'TAG'],
  finance: ['LOAN', 'BANK', 'CREDIT_CARD', 'INSURANCE'],
  construction: ['MATERIAL', 'BRAND'],
  automobile: ['VEHICLE', 'MANUFACTURER', 'DEALER'],
  directory: ['BUSINESS', 'BUSINESS_SERVICE'],
  'ai-tools': ['AI_TOOL', 'AI_CATEGORY', 'VENDOR'],
  calculators: ['CALCULATOR', 'FORMULA_PAGE'],
  reviews: ['REVIEW'],
  comparisons: ['COMPARISON'],
  media: ['MEDIA'],
  guides: ['GUIDE'],
};

type ReindexJob = {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  module: string;
  summary?: Record<string, number>;
  total?: number;
  error?: string;
  startedAt: string;
  finishedAt?: string;
};

function parseEntityTypes(input?: string, single?: string): SearchEntityType[] | undefined {
  if (single && (searchEntityTypes as readonly string[]).includes(single)) {
    return [single as SearchEntityType];
  }
  if (!input) return undefined;
  const parts = input
    .split(',')
    .map((p) => p.trim().toUpperCase())
    .filter((p): p is SearchEntityType => (searchEntityTypes as readonly string[]).includes(p));
  return parts.length ? parts : undefined;
}

function mapLegacyType(type?: string): SearchEntityType[] | undefined {
  if (!type || type === 'all') return undefined;
  if (type === 'article') return ['ARTICLE'];
  if (type === 'page') return ['PAGE'];
  return parseEntityTypes(type);
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly jobs = new Map<string, ReindexJob>();

  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    private readonly searchCache: SearchCacheService,
    @Inject(SEARCH_ENGINE_ADAPTER) private readonly engine: SearchEngineAdapter,
    @Optional() private readonly openSearchQuery?: OpenSearchQueryService,
  ) {}

  async search(
    query: SearchQueryInput & { type?: string },
    opts?: { userId?: string | null; track?: boolean },
  ) {
    const started = Date.now();
    const q = query.q?.trim() || '';
    const entityTypes =
      parseEntityTypes(undefined, query.entityType) ??
      mapLegacyType(query.type) ??
      parseEntityTypes(query.type);

    let page;
    let facets;

    if (isOpenSearchReadEnabled() && this.openSearchQuery) {
      [page, facets] = await Promise.all([
        this.openSearchQuery.search({ ...query, q, entityTypes }),
        this.openSearchQuery.facets({ q: q || undefined, entityTypes }),
      ]);
    } else {
      [page, facets] = await Promise.all([
        this.repos.searchIndex.search({
          q: q || undefined,
          entityTypes,
          category: query.category,
          language: query.language,
          location: query.location,
          author: query.author,
          publishedFrom: query.publishedFrom,
          publishedTo: query.publishedTo,
          tags: query.tags,
          minRating: query.minRating,
          priceMin: query.priceMin,
          priceMax: query.priceMax,
          brand: query.brand,
          vehicleType: query.vehicleType,
          fuelType: query.fuelType,
          loanType: query.loanType,
          materialType: query.materialType,
          featured: query.featured,
          sponsored: query.sponsored,
          verified: query.verified,
          sort: query.sort,
          limit: query.limit,
          cursor: query.cursor,
        }),
        this.repos.searchIndex.facets({
          q: q || undefined,
          entityTypes,
          location: query.location,
          brand: query.brand,
        }),
      ]);
    }

    const { items, nextCursor, hasMore } = page;
    const latencyMs = Date.now() - started;
    let queryId: string | null = null;

    if (opts?.track !== false && q) {
      const logged = await this.repos.searchQueries.create({
        query: q,
        results: items.length,
        userId: opts?.userId ?? null,
        latencyMs,
      });
      queryId = logged.id;
      void this.repos.popularSearches.increment(q).catch(() => undefined);
    }

    const results = items.map((hit) => ({
      entityType: hit.entity_type,
      entityId: hit.entity_id,
      title: hit.title,
      slug: hit.slug,
      summary: hit.summary,
      thumbnail: hit.thumbnail,
      category: hit.category,
      location: hit.location,
      author: hit.author,
      brand: hit.brand,
      tags: hit.tags,
      publishedAt: hit.published_at,
      rating: hit.rating,
      highlighted: hit.headline,
      url: hit.url,
      seoTitle: hit.seo_title,
      seoDescription: hit.seo_description,
      featured: hit.featured,
      sponsored: hit.sponsored,
      verified: hit.verified,
      viewCount: hit.view_count,
      rank: hit.rank,
    }));

    const articles = results
      .filter((r) => r.entityType === 'ARTICLE')
      .map((r) => ({
        id: r.entityId,
        type: 'article' as const,
        title: r.title,
        slug: r.slug,
        excerpt: r.summary,
        href: r.url,
        publishedAt: r.publishedAt,
      }));
    const pages = results
      .filter((r) => r.entityType === 'PAGE')
      .map((r) => ({
        id: r.entityId,
        type: 'page' as const,
        title: r.title,
        slug: r.slug,
        href: r.url,
        publishedAt: r.publishedAt,
      }));

    return {
      query: q || null,
      queryId,
      latencyMs,
      total: results.length,
      nextCursor,
      hasMore,
      engine: this.engine.name,
      results,
      facets,
      articles,
      pages,
    };
  }

  async autocomplete(input: SearchAutocompleteInput) {
    const key = `search:ac:${input.q.toLowerCase()}:${input.limit}`;
    const cached = await this.searchCache.get<unknown>(key);
    if (cached) return cached;

    const [titles, popular, trending] = await Promise.all([
      this.repos.searchIndex.autocomplete(input.q, input.limit),
      this.repos.popularSearches.top(5),
      this.repos.popularSearches.trending(5),
    ]);

    const payload = {
      keywords: popular
        .filter((p) => p.keyword.includes(input.q.toLowerCase()))
        .slice(0, 5)
        .map((p) => p.keyword),
      titles: titles.map((t) => ({
        title: t.title,
        url: t.url,
        entityType: t.entity_type,
        category: t.category,
      })),
      categories: Array.from(
        new Set(titles.map((t) => t.category).filter((c): c is string => Boolean(c))),
      ).slice(0, 5),
      trending: trending.map((t) => t.keyword),
      popular: popular.map((p) => p.keyword),
    };

    await this.searchCache.set(key, payload, 60_000);
    return payload;
  }

  async suggestions(q?: string, limit = 10) {
    const key = `search:suggestions:${q ?? ''}:${limit}`;
    const cached = await this.searchCache.get<unknown>(key);
    if (cached) return cached;

    const [popular, trending] = await Promise.all([
      this.repos.popularSearches.top(limit),
      this.repos.popularSearches.trending(limit),
    ]);

    let related: string[] = [];
    if (q?.trim()) {
      const hits = await this.repos.searchIndex.autocomplete(q, limit);
      related = hits.map((h) => h.title).slice(0, limit);
    }

    const payload = {
      popular: popular.map((p) => ({ keyword: p.keyword, count: p.searchCount })),
      trending: trending.map((p) => ({ keyword: p.keyword, count: p.searchCount })),
      related,
    };
    await this.searchCache.set(key, payload, 60_000);
    return payload;
  }

  popular(limit = 10) {
    return this.repos.popularSearches.top(limit);
  }

  trending(limit = 10) {
    return this.repos.popularSearches.trending(limit);
  }

  async recent(userId: string, limit = 10) {
    return this.repos.searchQueries.recent(userId, limit);
  }

  async trackClick(input: {
    queryId?: string;
    query?: string;
    entityType?: SearchEntityType;
    entityId?: string;
    url?: string;
  }) {
    if (input.entityType && input.entityId) {
      await this.repos.searchQueries
        .trackClick({
          queryId: input.queryId,
          entityType: input.entityType,
          entityId: input.entityId,
          url: input.url,
        })
        .catch(() => undefined);
    } else if (input.queryId) {
      await this.repos.searchQueries.markClicked(input.queryId).catch(() => undefined);
    }
    return { ok: true };
  }

  async analytics() {
    const [volume, topQueries, failed, latency, ctr, byType, indexTotal, mostClicked] =
      await Promise.all([
        this.repos.searchQueries.volume(30),
        this.repos.searchQueries.topQueries(20),
        this.repos.searchQueries.zeroResultQueries(20),
        this.repos.searchQueries.avgLatency(),
        this.repos.searchQueries.clickRate(),
        this.repos.searchIndex.countsByType(),
        this.repos.searchIndex.count(),
        this.repos.searchQueries.mostClicked(20, 30),
      ]);

    return {
      volume30d: volume,
      avgLatencyMs: latency._avg.latencyMs ?? null,
      ctr: ctr.ctr,
      totalSearches: ctr.total,
      clickedSearches: ctr.clicked,
      indexTotal,
      indexByType: byType.map((r) => ({ entityType: r.entityType, count: r._count._all })),
      topQueries: topQueries.map((r) => ({ query: r.query, count: r._count._all })),
      failedQueries: failed,
      mostClicked,
    };
  }

  async indexHealth() {
    const [total, byType] = await Promise.all([
      this.repos.searchIndex.count(),
      this.repos.searchIndex.countsByType(),
    ]);

    let openSearch: { status: 'up' | 'down' | 'unconfigured'; index?: string } = {
      status: 'unconfigured',
    };
    const osConfig = getOpenSearchConfig();
    if (osConfig) {
      const client = new OpenSearchClient(osConfig);
      openSearch = {
        status: (await client.ping()) ? 'up' : 'down',
        index: osConfig.index,
      };
    }

    return {
      total,
      byType: byType.map((r) => ({ entityType: r.entityType, count: r._count._all })),
      engine: this.engine.name,
      resolvedEngine: resolvedSearchEngine(),
      readFromOpenSearch: isOpenSearchReadEnabled(),
      openSearch,
      vector: 'tsvector+gin',
      cache: process.env.REDIS_URL ? 'redis' : 'memory',
    };
  }

  clearCache() {
    return this.searchCache.clear();
  }

  getReindexJob(jobId: string) {
    return this.jobs.get(jobId) ?? null;
  }

  async reindex(input: SearchReindexInput & { async?: boolean }, actorId?: string) {
    if (input.async) {
      const jobId = randomUUID();
      const job: ReindexJob = {
        id: jobId,
        status: 'queued',
        module: input.module,
        startedAt: new Date().toISOString(),
      };
      this.jobs.set(jobId, job);
      void this.runReindexJob(jobId, input, actorId);
      return { async: true, jobId, status: 'queued' as const };
    }
    return this.runReindex(input, actorId);
  }

  private async runReindexJob(jobId: string, input: SearchReindexInput, actorId?: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    job.status = 'running';
    try {
      const result = await this.runReindex(input, actorId);
      job.status = 'completed';
      job.summary = result.summary;
      job.total = result.total;
      job.finishedAt = new Date().toISOString();
    } catch (err) {
      job.status = 'failed';
      job.error = err instanceof Error ? err.message : String(err);
      job.finishedAt = new Date().toISOString();
    }
  }

  private async runReindex(input: SearchReindexInput, actorId?: string) {
    const modules =
      input.module === 'all'
        ? (Object.keys(MODULE_ENTITY_TYPES) as Array<keyof typeof MODULE_ENTITY_TYPES>)
        : [input.module];

    const summary: Record<string, number> = {};

    for (const mod of modules) {
      const types = MODULE_ENTITY_TYPES[mod];
      if (!types) continue;
      await this.repos.searchIndex.clearModule(types);
      const count = await this.repos.searchIndex.reindexModule(mod);
      summary[mod] = count;
      this.logger.log(`Reindexed ${mod}: ${count} documents (actor=${actorId ?? 'system'})`);
    }

    await this.searchCache.clear().catch(() => undefined);

    await this.repos.auditLogs
      .create({
        action: 'search.reindex',
        userId: actorId ?? null,
        entity: 'search_index',
        entityId: null,
        newValue: { module: input.module, summary },
      })
      .catch(() => undefined);

    return {
      module: input.module,
      summary,
      total: Object.values(summary).reduce((a, b) => a + b, 0),
    };
  }
}
