import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { PrismaClient, Repositories } from '@varnarc/database';
import {
  CONSTRUCTION_SITEMAP_SEGMENTS,
  summarizeConstructionSeoIssues,
  type ConstructionSeoAuditMode,
  type ConstructionSeoDraftIssue,
  type ConstructionSeoInventoryItem,
  type ConstructionSeoPageType,
} from '@varnarc/validation';
import { PRISMA, REPOS } from '../../database/database.module';
import {
  findBrokenInternalLinks,
  mergeConstructionInventory,
  runDeferredConstructionSeoChecks,
  runFastConstructionSeoChecks,
  STALE_PRICE_DAYS,
  type ConstructionSeoCrawlResult,
  type ConstructionSeoVitals,
} from './construction-seo-audit.scanner';

const CRAWL_CONCURRENCY = 4;
const CRAWL_TIMEOUT_MS = 12_000;
const MAX_CRAWL_URLS = 120;
const DEFERRED_BATCH = 20;

@Injectable()
export class ConstructionSeoAuditService {
  private readonly logger = new Logger(ConstructionSeoAuditService.name);
  private readonly processing = new Set<string>();

  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    @Inject(PRISMA) private readonly db: PrismaClient,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private siteUrl() {
    return (
      process.env.PUBLIC_WEB_URL?.replace(/\/$/, '') ||
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
      'http://localhost:3000'
    );
  }

  async enqueueRun(input: {
    mode?: ConstructionSeoAuditMode;
    siteUrl?: string;
    triggeredBy?: string | null;
  }) {
    const run = await this.repos.constructionSeoAuditRuns.create({
      status: 'QUEUED',
      mode: input.mode ?? 'FULL',
      siteUrl: input.siteUrl?.replace(/\/$/, '') || this.siteUrl(),
      triggeredBy: input.triggeredBy ?? null,
    });
    // Kick async processing without blocking the HTTP response.
    setImmediate(() => {
      void this.processRun(run.id).catch((err) =>
        this.logger.warn(
          `SEO audit run ${run.id} failed to start: ${err instanceof Error ? err.message : 'unknown'}`,
        ),
      );
    });
    return run;
  }

  async listRuns(query: { limit?: number; cursor?: string; status?: string }) {
    const rows = await this.repos.constructionSeoAuditRuns.list(query);
    const limit = query.limit ?? 20;
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    return {
      items,
      nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
      hasMore,
    };
  }

  async getRun(id: string) {
    const run = await this.repos.constructionSeoAuditRuns.findById(id);
    if (!run) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'SEO audit run not found.' },
      });
    }
    const severity = await this.repos.constructionSeoAuditIssues.countBySeverity(id);
    return { ...run, severityCounts: severity };
  }

  async listIssues(query: Parameters<Repositories['constructionSeoAuditIssues']['list']>[0]) {
    const rows = await this.repos.constructionSeoAuditIssues.list(query);
    const limit = query.limit ?? 100;
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    return {
      items,
      nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
      hasMore,
    };
  }

  async resolveIssue(id: string, status: 'RESOLVED' | 'IGNORED') {
    try {
      return await this.repos.constructionSeoAuditIssues.updateStatus(id, status);
    } catch {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'SEO audit issue not found.' },
      });
    }
  }

  async dashboardLatest() {
    const { items } = await this.listRuns({ limit: 1 });
    const latest = items[0] ?? null;
    if (!latest) {
      return {
        latestRun: null,
        totals: { totalUrls: 0, healthy: 0, warnings: 0, critical: 0 },
        issueTypes: CONSTRUCTION_SEO_ISSUE_TYPE_OPTIONS,
        pageTypes: CONSTRUCTION_SEO_PAGE_TYPE_OPTIONS,
      };
    }
    const summary = (latest.summary ?? {}) as {
      totalUrls?: number;
      healthy?: number;
      warnings?: number;
      critical?: number;
    };
    return {
      latestRun: latest,
      totals: {
        totalUrls: summary.totalUrls ?? 0,
        healthy: summary.healthy ?? 0,
        warnings: summary.warnings ?? 0,
        critical: summary.critical ?? 0,
      },
      issueTypes: CONSTRUCTION_SEO_ISSUE_TYPE_OPTIONS,
      pageTypes: CONSTRUCTION_SEO_PAGE_TYPE_OPTIONS,
    };
  }

  /** Called by scheduler: drain queued runs and continue deferred batches. */
  async tickQueue() {
    const queued = await this.repos.constructionSeoAuditRuns.findQueued(3);
    for (const run of queued) {
      if (this.processing.has(run.id)) continue;
      void this.processRun(run.id);
    }
  }

  async processRun(runId: string) {
    if (this.processing.has(runId)) return;
    this.processing.add(runId);
    try {
      const run = await this.repos.constructionSeoAuditRuns.findById(runId);
      if (
        !run ||
        run.status === 'COMPLETED' ||
        run.status === 'FAILED' ||
        run.status === 'CANCELLED'
      ) {
        return;
      }

      if (run.status === 'QUEUED') {
        await this.repos.constructionSeoAuditRuns.update(runId, {
          status: 'RUNNING_FAST',
          startedAt: new Date(),
        });
        const inventory = await this.buildInventory();
        const sitemapPaths = await this.loadSitemapPaths(run.siteUrl);
        const hubOutboundLinks = await this.sampleHubOutboundLinks(run.siteUrl);
        const stalePricePaths = await this.findStalePricePaths();

        const fastIssues = runFastConstructionSeoChecks({
          inventory,
          sitemapPaths,
          hubOutboundLinks,
          stalePricePaths,
        });
        await this.persistIssues(runId, fastIssues);

        if (run.mode === 'FAST') {
          await this.finalizeRun(runId, inventory.length);
          return;
        }

        await this.cache.set(this.inventoryCacheKey(runId), inventory, 60 * 60 * 1000);
        await this.cache.set(this.crawlCursorKey(runId), 0, 60 * 60 * 1000);
        await this.repos.constructionSeoAuditRuns.update(runId, { status: 'RUNNING_DEFERRED' });
      }

      if (
        (await this.repos.constructionSeoAuditRuns.findById(runId))?.status === 'RUNNING_DEFERRED'
      ) {
        await this.processDeferredBatch(runId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Construction SEO audit ${runId} failed: ${message}`);
      await this.repos.constructionSeoAuditRuns.update(runId, {
        status: 'FAILED',
        error: message,
        finishedAt: new Date(),
      });
    } finally {
      this.processing.delete(runId);
    }
  }

  private inventoryCacheKey(runId: string) {
    return `construction:seo-audit:inventory:${runId}`;
  }

  private crawlCursorKey(runId: string) {
    return `construction:seo-audit:cursor:${runId}`;
  }

  private async processDeferredBatch(runId: string) {
    const run = await this.repos.constructionSeoAuditRuns.findById(runId);
    if (!run) return;

    let inventory = (await this.cache.get<ConstructionSeoInventoryItem[]>(
      this.inventoryCacheKey(runId),
    )) as ConstructionSeoInventoryItem[] | undefined;
    if (!inventory?.length) {
      inventory = await this.buildInventory();
    }
    inventory = inventory.slice(0, MAX_CRAWL_URLS);

    const cursor = Number((await this.cache.get<number>(this.crawlCursorKey(runId))) ?? 0);
    const batch = inventory.slice(cursor, cursor + DEFERRED_BATCH);
    if (!batch.length) {
      await this.finalizeRun(runId, inventory.length);
      return;
    }

    const vitalsMap = await this.loadVitalsMap(batch.map((b) => b.path));
    const crawls = await this.crawlMany(batch.map((b) => ({ path: b.path, siteUrl: run.siteUrl })));
    const okPaths = new Set<string>();
    const failedPaths = new Set<string>();
    const deferredIssues: ConstructionSeoDraftIssue[] = [];

    for (const item of batch) {
      const crawl = crawls.get(item.path);
      if (!crawl) continue;
      if (crawl.status >= 200 && crawl.status < 400) okPaths.add(item.path);
      else failedPaths.add(item.path);

      deferredIssues.push(
        ...runDeferredConstructionSeoChecks({
          item,
          crawl,
          vitals: vitalsMap.get(item.path) ?? null,
        }),
      );

      if (crawl.html) {
        const { parseConstructionPageHtml } = await import('@varnarc/validation');
        const signals = parseConstructionPageHtml(crawl.html);
        deferredIssues.push(
          ...findBrokenInternalLinks({
            fromPath: item.path,
            pageType: item.pageType,
            links: signals.internalLinks,
            okPaths,
            failedPaths,
          }),
        );
      }
    }

    await this.persistIssues(runId, deferredIssues);
    const next = cursor + batch.length;
    await this.cache.set(this.crawlCursorKey(runId), next, 60 * 60 * 1000);

    if (next >= inventory.length) {
      await this.finalizeRun(runId, inventory.length);
    } else {
      // Continue next batch asynchronously (queue-friendly).
      setImmediate(() => {
        void this.processRun(runId);
      });
    }
  }

  private async finalizeRun(runId: string, inventorySize: number) {
    const severity = await this.repos.constructionSeoAuditIssues.countBySeverity(runId);
    const pathsWithIssues =
      await this.repos.constructionSeoAuditIssues.distinctPathsWithIssues(runId);
    let critical = 0;
    let warnings = 0;
    let info = 0;
    for (const row of severity) {
      if (row.severity === 'CRITICAL') critical = row._count._all;
      else if (row.severity === 'WARNING') warnings = row._count._all;
      else info = row._count._all;
    }
    const summary = {
      totalUrls: inventorySize,
      healthy: Math.max(0, inventorySize - pathsWithIssues.length),
      warnings,
      critical,
      info,
      issueCount: critical + warnings + info,
      scannedAt: new Date().toISOString(),
    };
    await this.repos.constructionSeoAuditRuns.update(runId, {
      status: 'COMPLETED',
      summary,
      finishedAt: new Date(),
      error: null,
    });
  }

  private async persistIssues(runId: string, issues: ConstructionSeoDraftIssue[]) {
    if (!issues.length) return;
    await this.repos.constructionSeoAuditIssues.createMany(
      issues.map((issue) => ({
        runId,
        path: issue.path.slice(0, 500),
        pageType: issue.pageType,
        issueType: issue.issueType,
        severity: issue.severity,
        status: 'OPEN',
        message: issue.message,
        recommendedAction: issue.recommendedAction ?? '',
        evidence: (issue.evidence ?? undefined) as never,
        httpStatus: issue.httpStatus ?? null,
        lcp: issue.lcp ?? null,
        cls: issue.cls ?? null,
        inp: issue.inp ?? null,
      })),
    );
  }

  private async buildInventory(): Promise<ConstructionSeoInventoryItem[]> {
    const published = { deletedAt: null, status: 'PUBLISHED' as const };
    const [materials, brands, guides, checklists] = await Promise.all([
      this.db.constructionMaterial.findMany({
        where: published,
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          seoTitle: true,
          seoDescription: true,
          updatedAt: true,
        },
        take: 500,
      }),
      this.db.constructionBrand.findMany({
        where: published,
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          seoTitle: true,
          seoDescription: true,
          updatedAt: true,
        },
        take: 500,
      }),
      this.db.constructionGuide.findMany({
        where: published,
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          seoTitle: true,
          seoDescription: true,
          updatedAt: true,
        },
        take: 500,
      }),
      this.db.constructionChecklist.findMany({
        where: published,
        select: { id: true, slug: true, title: true, description: true, updatedAt: true },
        take: 200,
      }),
    ]);

    const extras: ConstructionSeoInventoryItem[] = [
      ...materials.map((m) => ({
        path: `/construction/materials/${m.slug}`,
        pageType: 'material' as ConstructionSeoPageType,
        title: m.seoTitle || m.name,
        description: m.seoDescription || m.description,
        indexable: true,
        lastUpdated: m.updatedAt.toISOString(),
        entityType: 'construction_material',
        entityId: m.id,
      })),
      ...brands.map((b) => ({
        path: `/construction/brands/${b.slug}`,
        pageType: 'brand' as ConstructionSeoPageType,
        title: b.seoTitle || b.name,
        description: b.seoDescription || b.description,
        indexable: true,
        lastUpdated: b.updatedAt.toISOString(),
        entityType: 'construction_brand',
        entityId: b.id,
      })),
      ...guides.map((g) => ({
        path: `/construction/guides/${g.slug}`,
        pageType: 'guide' as ConstructionSeoPageType,
        title: g.seoTitle || g.title,
        description: g.seoDescription || g.summary,
        indexable: true,
        lastUpdated: g.updatedAt.toISOString(),
        entityType: 'construction_guide',
        entityId: g.id,
      })),
      ...checklists.map((c) => ({
        path: `/construction/checklists/${c.slug}`,
        pageType: 'checklist' as ConstructionSeoPageType,
        title: c.title,
        description: c.description,
        indexable: true,
        lastUpdated: c.updatedAt.toISOString(),
        entityType: 'construction_checklist',
        entityId: c.id,
      })),
    ];

    return mergeConstructionInventory(extras);
  }

  private async loadSitemapPaths(siteUrl: string): Promise<Set<string>> {
    try {
      const parts = await Promise.all(
        CONSTRUCTION_SITEMAP_SEGMENTS.map((segment) =>
          this.repos.seoSitemap.entriesForConstructionSegment(segment, siteUrl),
        ),
      );
      const paths = new Set<string>();
      for (const e of parts.flat()) {
        try {
          const u = new URL(e.loc);
          paths.add(u.pathname.replace(/\/$/, '') || '/');
        } catch {
          /* ignore */
        }
      }
      return paths;
    } catch {
      return new Set();
    }
  }

  private async sampleHubOutboundLinks(siteUrl: string): Promise<Set<string>> {
    const hubs = [
      '/construction',
      '/construction/materials',
      '/construction/guides',
      '/construction/calc',
    ];
    const links = new Set<string>();
    for (const path of hubs) {
      try {
        const crawl = await this.crawlOne(`${siteUrl}${path}`);
        if (!crawl.html) continue;
        const { parseConstructionPageHtml } = await import('@varnarc/validation');
        for (const href of parseConstructionPageHtml(crawl.html).internalLinks) {
          links.add(href);
        }
      } catch {
        /* ignore hub sample failures in fast phase */
      }
    }
    return links;
  }

  private async findStalePricePaths(): Promise<string[]> {
    const cutoff = new Date(Date.now() - STALE_PRICE_DAYS * 24 * 60 * 60 * 1000);
    const rows = await this.db.constructionMaterialPrice.findMany({
      where: {
        deletedAt: null,
        OR: [{ freshness: 'STALE' }, { effectiveFrom: { lt: cutoff } }],
      },
      select: {
        material: { select: { slug: true } },
        location: { select: { slug: true } },
      },
      take: 100,
    });
    const paths = new Set<string>();
    for (const row of rows) {
      if (row.location?.slug) {
        paths.add(`/construction/prices/${row.material.slug}/${row.location.slug}`);
      } else {
        paths.add(`/construction/prices`);
      }
    }
    return [...paths];
  }

  private async loadVitalsMap(paths: string[]): Promise<Map<string, ConstructionSeoVitals>> {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const pathSet = new Set(paths);
    const rows = await this.db.systemMetric.findMany({
      where: {
        recordedAt: { gte: since },
        metricName: { in: ['web_vitals.lcp', 'web_vitals.cls', 'web_vitals.inp'] },
      },
      select: { metricName: true, metricValue: true, metadata: true },
      take: 5000,
      orderBy: { recordedAt: 'desc' },
    });

    type Acc = {
      lcp: number[];
      cls: number[];
      inp: number[];
    };
    const acc = new Map<string, Acc>();
    for (const row of rows) {
      const meta = (row.metadata ?? {}) as { path?: string };
      const path = meta.path;
      if (!path || !pathSet.has(path)) continue;
      const bucket = acc.get(path) ?? { lcp: [], cls: [], inp: [] };
      if (row.metricName === 'web_vitals.lcp') bucket.lcp.push(row.metricValue);
      if (row.metricName === 'web_vitals.cls') bucket.cls.push(row.metricValue);
      if (row.metricName === 'web_vitals.inp') bucket.inp.push(row.metricValue);
      acc.set(path, bucket);
    }

    const avg = (xs: number[]) =>
      xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 1000) / 1000 : null;

    const out = new Map<string, ConstructionSeoVitals>();
    for (const [path, b] of acc) {
      out.set(path, {
        path,
        lcp: avg(b.lcp),
        cls: avg(b.cls),
        inp: avg(b.inp),
        samples: b.lcp.length + b.cls.length + b.inp.length,
      });
    }
    return out;
  }

  private async crawlMany(
    targets: Array<{ path: string; siteUrl: string }>,
  ): Promise<Map<string, ConstructionSeoCrawlResult>> {
    const out = new Map<string, ConstructionSeoCrawlResult>();
    for (let i = 0; i < targets.length; i += CRAWL_CONCURRENCY) {
      const slice = targets.slice(i, i + CRAWL_CONCURRENCY);
      const results = await Promise.all(
        slice.map(async (t) => {
          const crawl = await this.crawlOne(`${t.siteUrl}${t.path}`);
          return [t.path, crawl] as const;
        }),
      );
      for (const [path, crawl] of results) out.set(path, crawl);
    }
    return out;
  }

  private async crawlOne(url: string): Promise<ConstructionSeoCrawlResult> {
    const redirectChain: string[] = [];
    let current = url;
    let status = 0;
    let html: string | undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CRAWL_TIMEOUT_MS);

    try {
      for (let hop = 0; hop < 6; hop++) {
        const res = await fetch(current, {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'User-Agent': 'VarnarcConstructionSeoAudit/1.0',
            Accept: 'text/html,application/xhtml+xml',
          },
        });
        status = res.status;
        if ([301, 302, 303, 307, 308].includes(res.status)) {
          const loc = res.headers.get('location');
          if (!loc) break;
          redirectChain.push(current);
          current = new URL(loc, current).toString();
          continue;
        }
        if (res.ok) {
          html = await res.text();
        }
        break;
      }
    } catch {
      status = 0;
    } finally {
      clearTimeout(timer);
    }

    return {
      path: new URL(url).pathname,
      status,
      redirectChain,
      finalUrl: current,
      html,
    };
  }
}

const CONSTRUCTION_SEO_ISSUE_TYPE_OPTIONS = [
  'missing_title',
  'duplicate_title',
  'missing_meta_description',
  'duplicate_h1',
  'multiple_h1',
  'missing_h1',
  'missing_canonical',
  'noindex_mistake',
  'broken_internal_link',
  'orphan_page',
  'missing_breadcrumb',
  'invalid_structured_data',
  'missing_alt_text',
  'thin_content',
  'missing_last_updated',
  'stale_price_data',
  'redirect_chain',
  'sitemap_missing',
  'http_status',
  'performance_lcp',
  'performance_cls',
  'performance_inp',
] as const;

const CONSTRUCTION_SEO_PAGE_TYPE_OPTIONS = [
  'hub',
  'calculator',
  'material',
  'brand',
  'guide',
  'checklist',
  'price',
  'faq',
  'glossary',
  'other',
] as const;

// silence unused import if tree-shaken oddly
void summarizeConstructionSeoIssues;
