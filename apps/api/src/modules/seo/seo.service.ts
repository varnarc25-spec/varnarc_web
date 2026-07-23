import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { Repositories } from '@varnarc/database';
import type {
  BulkSeoRedirectImportInput,
  CreateSeoRedirectInput,
  SeoAuditListQuery,
  SeoIntegrationsInput,
  SeoListQuery,
  SeoMetadataUpdateInput,
  SeoRedirectListQuery,
  SeoRobotsSettingsInput,
  UpdateSeoRedirectInput,
} from '@varnarc/validation';
import { REPOS } from '../../database/database.module';
import {
  buildRobotsTxt,
  buildSitemapIndexXml,
  buildUrlSetXml,
  normalizePath,
  SITEMAP_TYPES,
  type SitemapType,
} from './seo-xml.util';

const ROBOTS_KEY = 'seo.robots';
const INTEGRATIONS_KEY = 'seo.integrations';
const SITEMAP_CACHE_TTL = 300_000;
const META_CACHE_TTL = 120_000;

const DEFAULT_ROBOTS: SeoRobotsSettingsInput = {
  disallow: ['/profile', '/bookmarks', '/saved-calculations', '/notifications', '/api/'],
  allow: ['/'],
  crawlDelay: null,
};

const DEFAULT_INTEGRATIONS: SeoIntegrationsInput = {
  googleSearchConsoleVerified: false,
  googleSearchConsoleSiteUrl: null,
  bingWebmasterVerified: false,
};

@Injectable()
export class SeoService {
  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private siteUrl() {
    return process.env.PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  }

  private isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  private async audit(
    action: string,
    entityType: string,
    entityId: string | null,
    actorId?: string | null,
    metadata?: Record<string, unknown>,
  ) {
    await this.repos.auditLogs
      .create({
        action,
        entity: entityType,
        entityId,
        userId: actorId ?? null,
        newValue: metadata as never,
      })
      .catch(() => undefined);
  }

  // --- Metadata ---

  async getMetadata(entityType: string, entityId: string) {
    const row = await this.repos.seo.findByEntity(entityType, entityId);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'SEO metadata not found.' },
      });
    }
    return row;
  }

  getMetadataOptional(entityType: string, entityId: string) {
    return this.repos.seo.findByEntity(entityType, entityId);
  }

  async listMetadata(query: SeoListQuery) {
    const limit = query.limit ?? 25;
    const rows = await this.repos.seo.list(query);
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    return {
      items,
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
      hasMore,
    };
  }

  async upsertMetadata(
    entityType: string,
    entityId: string,
    data: SeoMetadataUpdateInput,
    actorId?: string | null,
  ) {
    if (data.canonicalUrl) this.assertSafeUrl(data.canonicalUrl);
    if (data.ogImage) this.assertSafeUrl(data.ogImage);

    const row = await this.repos.seo.upsert(entityType, entityId, {
      title: data.title ?? undefined,
      description: data.description ?? undefined,
      metaKeywords: data.metaKeywords ?? undefined,
      canonicalUrl: data.canonicalUrl || undefined,
      ogImage: data.ogImage || undefined,
      robots: data.robots ?? undefined,
      twitterCard: data.twitterCard ?? undefined,
      schemaType: data.schemaType ?? undefined,
      language: data.language ?? undefined,
      structuredData: data.structuredData as never,
    });

    await this.cache.del(`seo:meta:${entityType}:${entityId}`).catch(() => undefined);
    await this.audit('seo.metadata.upsert', entityType, entityId, actorId, { entityType, entityId });
    return row;
  }

  // --- Redirects ---

  async listRedirects(query: SeoRedirectListQuery) {
    const limit = query.limit ?? 25;
    const rows = await this.repos.seoRedirects.list(query);
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    return { items, nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null, hasMore };
  }

  async createRedirect(input: CreateSeoRedirectInput, actorId?: string | null) {
    const sourcePath = normalizePath(input.sourcePath);
    const targetPath = input.targetPath.startsWith('http')
      ? input.targetPath
      : normalizePath(input.targetPath);
    if (sourcePath === targetPath) {
      throw new BadRequestException({
        success: false,
        error: { code: 'REDIRECT_LOOP', message: 'Source and target cannot be the same.' },
      });
    }
    await this.assertNoRedirectLoop(sourcePath, targetPath);

    const row = await this.repos.seoRedirects.create({
      sourcePath,
      targetPath,
      redirectType: input.redirectType,
      status: input.status,
    });
    await this.cache.del('seo:redirects:active').catch(() => undefined);
    await this.audit('seo.redirect.create', 'seo_redirect', row.id, actorId, { sourcePath });
    return row;
  }

  async updateRedirect(id: string, input: UpdateSeoRedirectInput, actorId?: string | null) {
    const existing = await this.repos.seoRedirects.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Redirect not found.' },
      });
    }
    const sourcePath = input.sourcePath ? normalizePath(input.sourcePath) : existing.sourcePath;
    const targetPath = input.targetPath
      ? input.targetPath.startsWith('http')
        ? input.targetPath
        : normalizePath(input.targetPath)
      : existing.targetPath;
    if (sourcePath === targetPath) {
      throw new BadRequestException({
        success: false,
        error: { code: 'REDIRECT_LOOP', message: 'Source and target cannot be the same.' },
      });
    }
    await this.assertNoRedirectLoop(sourcePath, targetPath, id);

    const row = await this.repos.seoRedirects.update(id, {
      ...(input.sourcePath ? { sourcePath } : {}),
      ...(input.targetPath ? { targetPath } : {}),
      ...(input.redirectType ? { redirectType: input.redirectType } : {}),
      ...(input.status ? { status: input.status } : {}),
    });
    await this.cache.del('seo:redirects:active').catch(() => undefined);
    await this.audit('seo.redirect.update', 'seo_redirect', id, actorId);
    return row;
  }

  async deleteRedirect(id: string, actorId?: string | null) {
    const existing = await this.repos.seoRedirects.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Redirect not found.' },
      });
    }
    await this.repos.seoRedirects.delete(id);
    await this.cache.del('seo:redirects:active').catch(() => undefined);
    await this.audit('seo.redirect.delete', 'seo_redirect', id, actorId);
    return { deleted: true };
  }

  async importRedirects(input: BulkSeoRedirectImportInput, actorId?: string | null) {
    const created = [];
    for (const item of input.redirects) {
      try {
        created.push(await this.createRedirect(item, actorId));
      } catch {
        // skip conflicting rows during bulk import
      }
    }
    return { imported: created.length, items: created };
  }

  async exportRedirects() {
    const rows = await this.repos.seoRedirects.list({ limit: 1000 });
    return rows.slice(0, 1000);
  }

  async resolveRedirect(path: string) {
    const normalized = normalizePath(path);
    const row = await this.repos.seoRedirects.findActiveBySource(normalized);
    if (!row) return null;
    void this.repos.seoRedirects.incrementHit(row.id).catch(() => undefined);
    return {
      sourcePath: row.sourcePath,
      targetPath: row.targetPath,
      redirectType: row.redirectType,
    };
  }

  async listActiveRedirects() {
    const cached = await this.cache.get<Array<{ sourcePath: string; targetPath: string; redirectType: number }>>(
      'seo:redirects:active',
    );
    if (cached) return cached;
    const rows = await this.repos.seoRedirects.listActive();
    const mapped = rows.map((r) => ({
      sourcePath: r.sourcePath,
      targetPath: r.targetPath,
      redirectType: r.redirectType,
    }));
    await this.cache.set('seo:redirects:active', mapped, META_CACHE_TTL);
    return mapped;
  }

  private async assertNoRedirectLoop(source: string, target: string, excludeId?: string) {
    if (target.startsWith('http')) return;
    const redirects = await this.repos.seoRedirects.listActive();
    let current = target;
    const visited = new Set<string>([source]);
    for (let i = 0; i < 20; i++) {
      if (visited.has(current)) {
        throw new BadRequestException({
          success: false,
          error: { code: 'REDIRECT_LOOP', message: 'Redirect would create a loop.' },
        });
      }
      visited.add(current);
      const next = redirects.find((r) => r.id !== excludeId && r.sourcePath === current);
      if (!next) break;
      current = next.targetPath.startsWith('http') ? next.targetPath : normalizePath(next.targetPath);
    }
  }

  // --- Sitemaps ---

  async sitemapIndexXml() {
    const cacheKey = 'seo:sitemap:index';
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) return cached;
    const xml = buildSitemapIndexXml(this.siteUrl());
    await this.cache.set(cacheKey, xml, SITEMAP_CACHE_TTL);
    return xml;
  }

  async sitemapTypeXml(type: string) {
    if (!SITEMAP_TYPES.includes(type as SitemapType)) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Unknown sitemap type.' },
      });
    }
    const cacheKey = `seo:sitemap:${type}`;
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) return cached;

    const entries = await this.repos.seoSitemap.entriesForType(type, this.siteUrl());
    const xml = buildUrlSetXml(
      entries.map((e) => ({
        loc: e.loc,
        lastmod: e.lastmod,
        changefreq: 'weekly',
        priority: 0.7,
      })),
    );
    await this.cache.set(cacheKey, xml, SITEMAP_CACHE_TTL);
    return xml;
  }

  async sitemapStatus() {
    const siteUrl = this.siteUrl();
    const counts = await Promise.all(
      SITEMAP_TYPES.map(async (type) => ({
        type,
        count: (await this.repos.seoSitemap.entriesForType(type, siteUrl)).length,
        url: `${siteUrl}/sitemap/${type}.xml`,
      })),
    );
    return {
      siteUrl,
      indexUrl: `${siteUrl}/sitemap.xml`,
      types: counts,
      lastRebuild: new Date().toISOString(),
    };
  }

  async rebuildSitemaps() {
    for (const type of SITEMAP_TYPES) {
      await this.cache.del(`seo:sitemap:${type}`).catch(() => undefined);
    }
    await this.cache.del('seo:sitemap:index').catch(() => undefined);
    return this.sitemapStatus();
  }

  // --- Robots ---

  async getRobotsSettings() {
    const row = await this.repos.settings.findByKey(ROBOTS_KEY).catch(() => null);
    if (!row?.value || typeof row.value !== 'object') return { ...DEFAULT_ROBOTS };
    return { ...DEFAULT_ROBOTS, ...(row.value as Record<string, unknown>) } as SeoRobotsSettingsInput;
  }

  async setRobotsSettings(input: SeoRobotsSettingsInput, actorId?: string | null) {
    const merged = { ...DEFAULT_ROBOTS, ...input };
    await this.repos.settings.upsert(ROBOTS_KEY, merged as never, 'seo', actorId);
    await this.cache.del('seo:robots').catch(() => undefined);
    await this.audit('seo.robots.update', 'seo_settings', null, actorId);
    return merged;
  }

  async robotsTxt() {
    if (!this.isProduction()) {
      return 'User-agent: *\nDisallow: /\n';
    }
    const cached = await this.cache.get<string>('seo:robots');
    if (cached) return cached;

    const settings = await this.getRobotsSettings();
    const txt = buildRobotsTxt({
      siteUrl: this.siteUrl(),
      disallow: [...(settings.disallow ?? []), '/admin'],
      allow: settings.allow,
      crawlDelay: settings.crawlDelay,
    });
    await this.cache.set('seo:robots', txt, SITEMAP_CACHE_TTL);
    return txt;
  }

  // --- Audit ---

  async listAuditIssues(query: SeoAuditListQuery) {
    const limit = query.limit ?? 50;
    const rows = await this.repos.seoAudits.list(query);
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    return { items, nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null, hasMore };
  }

  async resolveAuditIssue(id: string, actorId?: string | null) {
    const row = await this.repos.seoAudits.resolve(id);
    await this.audit('seo.audit.resolve', 'seo_audit', id, actorId);
    return row;
  }

  async runAudit(actorId?: string | null) {
    await this.repos.seoAudits.clearUnresolved();
    const issues: Array<{
      entityType: string | null;
      entityId: string | null;
      issueType: string;
      severity: string;
      message: string;
    }> = [];

    const [articlesResult, pagesResult, metadataRows, redirects] = await Promise.all([
      this.repos.articles.list({ status: 'PUBLISHED', limit: 500 }),
      this.repos.pages.list({ status: 'PUBLISHED', limit: 500 }),
      this.repos.seo.list({ limit: 500 }),
      this.repos.seoRedirects.listActive(),
    ]);

    const titleMap = new Map<string, string[]>();
    const descMap = new Map<string, string[]>();

    const articleItems = articlesResult.items as unknown as Array<{
      id: string;
      title: string;
      slug: string;
      excerpt?: string | null;
    }>;
    for (const a of articleItems) {
      const title = a.title;
      const desc = a.excerpt;
      if (!title?.trim()) {
        issues.push({
          entityType: 'article',
          entityId: a.id,
          issueType: 'missing_title',
          severity: 'error',
          message: `Article "${a.slug}" is missing a meta title.`,
        });
      }
      if (!desc?.trim()) {
        issues.push({
          entityType: 'article',
          entityId: a.id,
          issueType: 'missing_description',
          severity: 'warning',
          message: `Article "${a.slug}" is missing a meta description.`,
        });
      }
      if (title) {
        const key = title.toLowerCase();
        titleMap.set(key, [...(titleMap.get(key) ?? []), `article:${a.slug}`]);
      }
      if (desc) {
        const key = desc.toLowerCase();
        descMap.set(key, [...(descMap.get(key) ?? []), `article:${a.slug}`]);
      }
    }

    const pageItems = pagesResult.items as unknown as Array<{ id: string; title: string; slug: string }>;
    for (const p of pageItems) {
      if (!p.title?.trim()) {
        issues.push({
          entityType: 'page',
          entityId: p.id,
          issueType: 'missing_title',
          severity: 'error',
          message: `Page "${p.slug}" is missing a meta title.`,
        });
      }
    }

    const modules = await this.repos.seoSitemap.listAuditCandidates();
    const auditModule = (
      entityType: string,
      slug: string,
      id: string,
      title: string | null | undefined,
      description: string | null | undefined,
    ) => {
      if (!title?.trim()) {
        issues.push({
          entityType,
          entityId: id,
          issueType: 'missing_title',
          severity: 'error',
          message: `${entityType} "${slug}" is missing a meta title.`,
        });
      }
      if (!description?.trim()) {
        issues.push({
          entityType,
          entityId: id,
          issueType: 'missing_description',
          severity: 'warning',
          message: `${entityType} "${slug}" is missing a meta description.`,
        });
      }
      if (title) {
        const key = title.toLowerCase();
        titleMap.set(key, [...(titleMap.get(key) ?? []), `${entityType}:${slug}`]);
      }
      if (description) {
        const key = description.toLowerCase();
        descMap.set(key, [...(descMap.get(key) ?? []), `${entityType}:${slug}`]);
      }
    };

    for (const c of modules.calculators) {
      auditModule('calculator', c.slug, c.id, c.seoTitle || c.name, c.seoDescription);
    }
    for (const t of modules.aiTools) {
      auditModule('ai_tool', t.slug, t.id, t.seoTitle || t.name, t.seoDescription);
    }
    for (const b of modules.businesses) {
      auditModule('business', b.slug, b.id, b.seoTitle || b.name, b.seoDescription);
    }
    for (const c of modules.comparisons) {
      auditModule('comparison', c.slug, c.id, c.seoTitle || c.title, c.seoDescription);
    }

    for (const meta of metadataRows) {
      if (meta.canonicalUrl && !meta.canonicalUrl.startsWith('http')) {
        issues.push({
          entityType: meta.entityType,
          entityId: meta.entityId,
          issueType: 'invalid_canonical',
          severity: 'error',
          message: `Invalid canonical URL for ${meta.entityType}:${meta.entityId}.`,
        });
      }
    }

    for (const [title, refs] of titleMap) {
      if (refs.length > 1) {
        issues.push({
          entityType: null,
          entityId: null,
          issueType: 'duplicate_title',
          severity: 'warning',
          message: `Duplicate title "${title}" on: ${refs.join(', ')}`,
        });
      }
    }

    for (const [desc, refs] of descMap) {
      if (refs.length > 1) {
        issues.push({
          entityType: null,
          entityId: null,
          issueType: 'duplicate_description',
          severity: 'warning',
          message: `Duplicate description on: ${refs.join(', ')}`,
        });
      }
    }

    for (const r of redirects) {
      if (!r.targetPath || r.targetPath === r.sourcePath) {
        issues.push({
          entityType: 'redirect',
          entityId: null,
          issueType: 'broken_redirect',
          severity: 'error',
          message: `Broken redirect from ${r.sourcePath}.`,
        });
      }
    }

    if (issues.length) {
      await this.repos.seoAudits.createMany(
        issues.map((i) => ({
          entityType: i.entityType,
          entityId: i.entityId,
          issueType: i.issueType,
          severity: i.severity,
          message: i.message,
        })),
      );
    }

    await this.audit('seo.audit.run', 'seo_audit', null, actorId, { issues: issues.length });
    return this.dashboard();
  }

  async dashboard() {
    const summary = await this.repos.seoAudits.summary();
    const openIssues = summary
      .filter((s) => !s.resolved)
      .reduce((acc, s) => acc + s._count._all, 0);
    const errors = summary
      .filter((s) => !s.resolved && s.severity === 'error')
      .reduce((acc, s) => acc + s._count._all, 0);
    const warnings = summary
      .filter((s) => !s.resolved && s.severity === 'warning')
      .reduce((acc, s) => acc + s._count._all, 0);

    const [redirectCount, metadataCount, sitemap] = await Promise.all([
      this.repos.seoRedirects.list({ limit: 1 }).then((r) => r.length),
      this.repos.seo.list({ limit: 1 }).then((r) => r.length),
      this.sitemapStatus(),
    ]);

    return {
      healthScore: Math.max(0, 100 - errors * 5 - warnings * 2),
      openIssues,
      errors,
      warnings,
      redirectCount,
      metadataCount,
      sitemap,
      integrations: await this.getIntegrations(),
    };
  }

  // --- Integrations & analytics ---

  async getIntegrations() {
    const row = await this.repos.settings.findByKey(INTEGRATIONS_KEY).catch(() => null);
    if (!row?.value || typeof row.value !== 'object') return { ...DEFAULT_INTEGRATIONS };
    return { ...DEFAULT_INTEGRATIONS, ...(row.value as Record<string, unknown>) };
  }

  async setIntegrations(input: SeoIntegrationsInput, actorId?: string | null) {
    const merged = { ...DEFAULT_INTEGRATIONS, ...input };
    await this.repos.settings.upsert(INTEGRATIONS_KEY, merged as never, 'seo', actorId);
    await this.audit('seo.integrations.update', 'seo_settings', null, actorId);
    return merged;
  }

  async analytics() {
    const integrations = await this.getIntegrations();
    return {
      organicTraffic: null,
      impressions: null,
      clicks: null,
      ctr: null,
      averagePosition: null,
      indexedPages: (await this.sitemapStatus()).types.reduce((n, t) => n + t.count, 0),
      topLandingPages: [],
      searchQueries: [],
      integrations,
      note: 'Connect Google Search Console in SEO integrations for live search analytics.',
    };
  }

  private assertSafeUrl(url: string) {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('bad protocol');
    } catch {
      throw new BadRequestException({
        success: false,
        error: { code: 'INVALID_URL', message: 'Invalid URL.' },
      });
    }
  }
}
