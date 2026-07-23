import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import {
  resolveDateRange,
  type Repositories,
} from '@varnarc/database';
import type {
  AnalyticsDashboardQuery,
  AnalyticsExportQuery,
  AnalyticsReportsQuery,
  RecordWebVitalsInput,
  TrackAnalyticsEventInput,
} from '@varnarc/validation';
import type { analyticsIntegrationsSchema } from '@varnarc/validation';
import type { z } from 'zod';
import { REPOS } from '../../database/database.module';
import {
  createBullMqAnalyticsBackend,
  type BullMqAnalyticsBackend,
} from './analytics-bullmq';
import {
  buildCsv,
  buildExcelCsv,
  buildMinimalPdf,
  flattenReportForCsv,
} from './analytics-export.util';
import {
  AnalyticsEventQueue,
  type QueuedAnalyticsEvent,
} from './analytics-queue';
import { AdsenseApiService } from './adsense-api.service';

const DASHBOARD_CACHE_TTL = 60_000;
const QUEUE_FLUSH_MS = 2_000;
const QUEUE_BATCH = 50;
const AGGREGATE_EVERY_N_FLUSHES = 5;
const INTEGRATIONS_KEY = 'analytics.integrations';
const ADSENSE_KEY = 'analytics.adsense';

type AnalyticsIntegrations = z.infer<typeof analyticsIntegrationsSchema>;

const DEFAULT_INTEGRATIONS: AnalyticsIntegrations = {
  googleAnalyticsId: null,
  googleSearchConsole: false,
  cloudflareAnalytics: false,
  microsoftClarityId: null,
  plausibleDomain: null,
  openTelemetryEnabled: false,
  prometheusEnabled: false,
};

type TrackMeta = {
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

type DateRangeQuery = { from?: Date; to?: Date; period?: string };

@Injectable()
export class AnalyticsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AnalyticsService.name);
  private flushTimer: NodeJS.Timeout | null = null;
  private flushCount = 0;
  private bullMq: BullMqAnalyticsBackend | null = null;
  private readonly queue: AnalyticsEventQueue<TrackAnalyticsEventInput>;

  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly adsenseApi: AdsenseApiService,
  ) {
    this.queue = new AnalyticsEventQueue<TrackAnalyticsEventInput>(
      QUEUE_BATCH,
      (batch) => this.dispatchBatch(batch),
    );
  }

  async onModuleInit() {
    this.bullMq = await createBullMqAnalyticsBackend((batch) => this.processBatch(batch));
    this.flushTimer = setInterval(() => {
      void this.queue.flush().then(async (result) => {
        if (result.flushed > 0) {
          this.flushCount += 1;
          if (this.flushCount % AGGREGATE_EVERY_N_FLUSHES === 0) {
            await this.aggregateNow().catch((err) =>
              this.logger.warn(
                `Periodic aggregate failed: ${err instanceof Error ? err.message : String(err)}`,
              ),
            );
          }
        }
      });
    }, QUEUE_FLUSH_MS);
  }

  async onModuleDestroy() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    await this.queue.flush().catch(() => undefined);
    if (this.bullMq) await this.bullMq.close().catch(() => undefined);
  }

  status() {
    return {
      module: 'analytics',
      status: 'ready',
      queueSize: this.queue.size,
      cacheBackend: process.env.REDIS_URL ? 'redis' : 'memory',
      queueBackend: this.bullMq ? 'bullmq' : 'memory',
    };
  }

  private async dispatchBatch(batch: QueuedAnalyticsEvent<TrackAnalyticsEventInput>[]) {
    if (this.bullMq) {
      await this.bullMq.enqueueBatch(batch);
      return;
    }
    await this.processBatch(batch);
  }

  trackEvent(input: TrackAnalyticsEventInput, meta?: TrackMeta) {
    this.queue.push(input, meta);
    return { queued: true, count: 1, queueSize: this.queue.size };
  }

  trackBatch(events: TrackAnalyticsEventInput[], meta?: TrackMeta) {
    this.queue.pushMany(events, meta);
    return { queued: true, count: events.length, queueSize: this.queue.size };
  }

  private async processBatch(batch: QueuedAnalyticsEvent<TrackAnalyticsEventInput>[]) {
    for (const item of batch) {
      try {
        await this.persistEvent(item.payload, item.meta);
      } catch (err) {
        this.logger.warn(
          `Failed to persist analytics event ${item.payload.eventType}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }
  }

  private async persistEvent(input: TrackAnalyticsEventInput, meta?: TrackMeta) {
    let sessionDbId: string | null = null;

    if (input.sessionId) {
      const session = await this.repos.analyticsSessions.upsertByKey({
        sessionKey: input.sessionId,
        userId: meta?.userId,
        source: input.source,
        medium: input.medium,
        campaign: input.campaign,
        device:
          typeof input.metadata?.device === 'string' ? input.metadata.device : undefined,
      });
      sessionDbId = session.id;
    }

    const event = await this.repos.analyticsEvents.create({
      userId: meta?.userId ?? null,
      sessionId: sessionDbId,
      eventType: input.eventType,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      path: input.path ?? null,
      metadata: (input.metadata ?? undefined) as never,
      ipAddress: meta?.ipAddress ?? null,
      userAgent: meta?.userAgent ?? null,
    });

    if (input.eventType === 'page_view' && input.path) {
      await this.repos.pageViews
        .create({
          sessionId: sessionDbId,
          userId: meta?.userId ?? null,
          path: input.path,
          referrer: input.referrer ?? null,
        })
        .catch(() => undefined);
    }

    if (input.source || input.medium) {
      await this.repos.trafficSources
        .create({
          sessionId: sessionDbId,
          source: input.source ?? null,
          medium: input.medium ?? null,
          campaign: input.campaign ?? null,
          referrer: input.referrer ?? null,
        })
        .catch(() => undefined);
    }

    if (input.eventType === 'affiliate_click') {
      const partner =
        (typeof input.metadata?.partner === 'string' && input.metadata.partner) ||
        input.entityType ||
        'unknown';
      await this.repos.affiliateConversions
        .incrementClick(partner, input.entityType, input.entityId)
        .catch(() => undefined);
    }

    return event;
  }

  private cacheKey(prefix: string, query: DateRangeQuery & Record<string, unknown>) {
    return `analytics:${prefix}:${JSON.stringify(query)}`;
  }

  async dashboard(query: AnalyticsDashboardQuery) {
    const key = this.cacheKey('dashboard', query);
    const cached = await this.cache.get(key);
    if (cached) return cached;

    const { from, to, period } = resolveDateRange(query);
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);
    const monthStart = new Date(todayEnd);
    monthStart.setUTCDate(monthStart.getUTCDate() - 29);
    monthStart.setUTCHours(0, 0, 0, 0);

    const activeFrom = new Date(Date.now() - 30 * 60_000);

    const [
      visitorsTodayEvents,
      visitorsTodayPages,
      visitorsMonthEvents,
      visitorsMonthPages,
      activeSessions,
      topPathsEvents,
      topPathsPages,
      topSearches,
      affiliateTotals,
      eventCounts,
    ] = await Promise.all([
      this.repos.analyticsEvents.count(todayStart, todayEnd, 'page_view'),
      this.repos.pageViews.count(todayStart, todayEnd),
      this.repos.analyticsEvents.count(monthStart, todayEnd, 'page_view'),
      this.repos.pageViews.count(monthStart, todayEnd),
      this.repos.analyticsSessions.countActive(activeFrom, todayEnd),
      this.repos.analyticsEvents.topPaths(from, to, 10),
      this.repos.pageViews.topPaths(from, to, 10),
      this.repos.popularSearches.top(10),
      this.repos.affiliateConversions.totals(),
      this.repos.analyticsEvents.countByType(from, to),
    ]);

    const siloed = await this.collectSiloed();

    const pathMap = new Map<string, number>();
    for (const row of [...topPathsEvents, ...topPathsPages]) {
      if (!row.path) continue;
      pathMap.set(row.path, (pathMap.get(row.path) ?? 0) + row._count._all);
    }
    const topPaths = [...pathMap.entries()]
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const data = {
      period,
      from,
      to,
      visitorsToday: visitorsTodayEvents + visitorsTodayPages,
      visitorsMonth: visitorsMonthEvents + visitorsMonthPages,
      activeSessions,
      topPaths,
      topSearches: topSearches.map((s) => ({
        keyword: s.keyword,
        searchCount: s.searchCount,
      })),
      affiliates: {
        clicks: affiliateTotals._sum.clicks ?? 0,
        conversions: affiliateTotals._sum.conversions ?? 0,
        revenue: Number(affiliateTotals._sum.revenue ?? 0),
      },
      ads: siloed.ads,
      systemHealth: {
        status: 'ok',
        queueSize: this.queue.size,
        cacheBackend: process.env.REDIS_URL ? 'redis' : 'memory',
        queueBackend: this.bullMq ? 'bullmq' : 'memory',
      },
      eventCounts: eventCounts.map((r) => ({
        eventType: r.eventType,
        count: r._count._all,
      })),
      siloed: {
        search: siloed.search,
        directory: siloed.directory,
        aiTools: siloed.aiTools,
        calculators: siloed.calculators,
        reviews: siloed.reviews,
        comparisons: siloed.comparisons,
      },
      compare: query.compare ?? false,
    };

    await this.cache.set(key, data, DASHBOARD_CACHE_TTL);
    return data;
  }

  private async safe<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch {
      return null;
    }
  }

  private async collectSiloed() {
    const [ads, search, directory, aiTools, calculators, reviews, comparisons] =
      await Promise.all([
        this.safe(() => this.repos.advertisements.analyticsSummary()),
        this.safe(async () => ({
          popular: await this.repos.popularSearches.top(10),
          trending: await this.repos.popularSearches.trending(10),
        })),
        this.safe(() => this.repos.businesses.analytics()),
        this.safe(() => this.repos.aiTools.analyticsSummary()),
        this.safe(() => this.repos.calculators.analyticsSummary()),
        this.safe(() => this.repos.reviews.analytics()),
        this.safe(() => this.repos.comparisons.analytics()),
      ]);
    return { ads, search, directory, aiTools, calculators, reviews, comparisons };
  }

  async traffic(query: DateRangeQuery = {}) {
    const { from, to, period } = resolveDateRange(query);
    const [sources, uniqueSessions, pageViews] = await Promise.all([
      this.repos.trafficSources.topSources(from, to, 20),
      this.repos.analyticsEvents.uniqueSessions(from, to),
      this.repos.pageViews.count(from, to),
    ]);
    return {
      period,
      from,
      to,
      uniqueSessions: uniqueSessions.length,
      pageViews,
      topSources: sources.map((s) => ({
        source: s.source,
        count: s._count._all,
      })),
    };
  }

  async searchAnalytics(query: DateRangeQuery = {}) {
    const { from, to, period } = resolveDateRange(query);
    const [popular, trending, volume, topQueries, zeroResults] = await Promise.all([
      this.repos.popularSearches.top(20),
      this.repos.popularSearches.trending(20),
      this.safe(() => this.repos.searchQueries.volume(30)),
      this.safe(() => this.repos.searchQueries.topQueries(20)),
      this.safe(() => this.repos.searchQueries.zeroResultQueries(20)),
    ]);
    return {
      period,
      from,
      to,
      popular,
      trending,
      volume30d: volume,
      topQueries: topQueries?.map((r) => ({ query: r.query, count: r._count._all })) ?? [],
      zeroResults: zeroResults ?? [],
    };
  }

  async adsAnalytics() {
    return (
      (await this.safe(() => this.repos.advertisements.analyticsSummary())) ?? {
        impressions: 0,
        clicks: 0,
        ctr: 0,
        topAds: [],
        impressionLeaders: [],
      }
    );
  }

  async affiliatesAnalytics() {
    const [totals, list] = await Promise.all([
      this.repos.affiliateConversions.totals(),
      this.repos.affiliateConversions.list(50),
    ]);
    return {
      totals: {
        clicks: totals._sum.clicks ?? 0,
        conversions: totals._sum.conversions ?? 0,
        revenue: Number(totals._sum.revenue ?? 0),
      },
      partners: list,
    };
  }

  async getAdsenseSnapshot() {
    const row = await this.repos.settings.findByKey(ADSENSE_KEY);
    const value = (row?.value ?? {}) as {
      revenue30d?: number;
      impressions30d?: number;
      currency?: string;
      source?: string;
      lastImportedAt?: string;
      notes?: string | null;
    };
    return {
      revenue30d: Number(value.revenue30d ?? 0),
      impressions30d: Number(value.impressions30d ?? 0),
      currency: value.currency ?? 'INR',
      source: value.source ?? null,
      lastImportedAt: value.lastImportedAt ?? null,
      notes: value.notes ?? null,
    };
  }

  async importAdsenseRevenue(
    input: {
      revenue30d: number;
      impressions30d?: number;
      currency?: string;
      source?: string;
      notes?: string | null;
    },
    actorId?: string,
  ) {
    const snapshot = {
      revenue30d: input.revenue30d,
      impressions30d: input.impressions30d ?? 0,
      currency: input.currency ?? 'INR',
      source: input.source ?? 'manual',
      lastImportedAt: new Date().toISOString(),
      notes: input.notes ?? null,
    };
    await this.repos.settings.upsert(ADSENSE_KEY, snapshot, 'analytics', actorId);
    return snapshot;
  }

  getAdsenseSyncStatus() {
    return this.adsenseApi.getStatus();
  }

  async syncAdsenseFromApi(actorId?: string) {
    const report = await this.adsenseApi.fetchLast30DaysReport();
    return this.importAdsenseRevenue(
      {
        revenue30d: report.revenue,
        impressions30d: report.impressions,
        currency: report.currency,
        source: 'api',
        notes: `Google AdSense API sync (${new Date().toISOString()})`,
      },
      actorId,
    );
  }

  async revenueReport(query: DateRangeQuery = {}) {
    const range = resolveDateRange(query);
    const [affiliates, ads, adsense, premiumFlag, premiumRevenue] = await Promise.all([
      this.affiliatesAnalytics(),
      this.adsAnalytics(),
      this.getAdsenseSnapshot(),
      this.repos.featureFlags.findByKey('premium.enabled'),
      this.repos.payments.sumSucceededBetween(range.from, range.to),
    ]);

    const affiliateRevenue = affiliates.totals.revenue;
    const adsenseRevenue = adsense.revenue30d;
    const estimatedDirectAdRevenue = 0;

    return {
      report: 'revenue' as const,
      ...range,
      currency: adsense.currency ?? 'INR',
      totals: {
        affiliateRevenue,
        adsenseRevenue,
        estimatedDirectAdRevenue,
        premiumRevenue,
        combined: affiliateRevenue + adsenseRevenue + estimatedDirectAdRevenue + premiumRevenue,
      },
      affiliates: affiliates.totals,
      ads: {
        impressions: ads.impressions ?? 0,
        clicks: ads.clicks ?? 0,
        ctr: ads.ctr ?? 0,
      },
      adsense,
      premium: { enabled: premiumFlag?.enabled ?? false, revenue: premiumRevenue },
    };
  }

  async executiveReport(query: AnalyticsReportsQuery) {
    const range = resolveDateRange(query);
    const dashboard = (await this.dashboard({
      ...query,
      compare: false,
    } as AnalyticsDashboardQuery)) as {
      visitorsToday: number;
      visitorsMonth: number;
      activeSessions: number;
      affiliates: { clicks: number; conversions: number; revenue: number };
      topPaths: Array<{ path: string; count: number }>;
      topSearches: Array<{ keyword: string; searchCount: number }>;
      systemHealth: Record<string, unknown>;
    };
    const [revenue, siloed] = await Promise.all([
      this.revenueReport(query),
      this.collectSiloed(),
    ]);

    return {
      report: 'executive' as const,
      ...range,
      kpis: {
        visitorsToday: dashboard.visitorsToday,
        visitorsMonth: dashboard.visitorsMonth,
        activeSessions: dashboard.activeSessions,
        affiliateClicks: dashboard.affiliates.clicks,
        affiliateRevenue: dashboard.affiliates.revenue,
        combinedRevenue: revenue.totals.combined,
      },
      topPaths: dashboard.topPaths,
      topSearches: dashboard.topSearches,
      revenue: revenue.totals,
      siloed: {
        search: siloed.search,
        directory: siloed.directory,
        aiTools: siloed.aiTools,
        calculators: siloed.calculators,
        reviews: siloed.reviews,
        comparisons: siloed.comparisons,
        ads: siloed.ads,
      },
      systemHealth: dashboard.systemHealth,
    };
  }

  async systemAnalytics(query: DateRangeQuery = {}) {
    const { from, to, period } = resolveDateRange(query);
    const [latest, apiLatency, errorRate] = await Promise.all([
      this.repos.systemMetrics.latest(undefined, 50),
      this.safe(() => this.repos.systemMetrics.avg('api_latency_ms', from, to)),
      this.safe(() => this.repos.systemMetrics.avg('error_rate', from, to)),
    ]);
    return {
      period,
      from,
      to,
      latest,
      averages: {
        apiLatencyMs: apiLatency?._avg.metricValue ?? null,
        errorRate: errorRate?._avg.metricValue ?? null,
      },
      health: {
        status: 'ok',
        queueSize: this.queue.size,
        cacheBackend: process.env.REDIS_URL ? 'redis' : 'memory',
        queueBackend: this.bullMq ? 'bullmq' : 'memory',
      },
    };
  }

  async contentReport(query: DateRangeQuery = {}) {
    const { from, to, period } = resolveDateRange(query);
    const [eventPaths, pagePaths, eventCounts] = await Promise.all([
      this.repos.analyticsEvents.topPaths(from, to, 25),
      this.repos.pageViews.topPaths(from, to, 25),
      this.repos.analyticsEvents.countByType(from, to),
    ]);
    const pathMap = new Map<string, number>();
    for (const row of [...eventPaths, ...pagePaths]) {
      if (!row.path) continue;
      pathMap.set(row.path, (pathMap.get(row.path) ?? 0) + row._count._all);
    }
    return {
      period,
      from,
      to,
      topPaths: [...pathMap.entries()]
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 25),
      eventCounts: eventCounts.map((r) => ({
        eventType: r.eventType,
        count: r._count._all,
      })),
    };
  }

  async reports(query: AnalyticsReportsQuery) {
    const range = resolveDateRange(query);
    switch (query.report) {
      case 'content':
        return { report: 'content', ...(await this.contentReport(query)) };
      case 'search':
        return { report: 'search', ...(await this.searchAnalytics(query)) };
      case 'ads':
        return { report: 'ads', ...(await this.adsAnalytics()), ...range };
      case 'affiliates':
        return { report: 'affiliates', ...(await this.affiliatesAnalytics()), ...range };
      case 'revenue':
        return this.revenueReport(query);
      case 'executive':
        return this.executiveReport(query);
      case 'directory':
        return {
          report: 'directory',
          data: await this.safe(() => this.repos.businesses.analytics()),
          ...range,
        };
      case 'ai-tools':
        return {
          report: 'ai-tools',
          data: await this.safe(() => this.repos.aiTools.analyticsSummary()),
          ...range,
        };
      case 'calculators':
        return {
          report: 'calculators',
          data: await this.safe(() => this.repos.calculators.analyticsSummary()),
          ...range,
        };
      case 'users': {
        const sessions = await this.repos.analyticsSessions.countActive(range.from, range.to);
        const unique = await this.repos.analyticsEvents.uniqueSessions(range.from, range.to);
        return {
          report: 'users',
          sessions,
          uniqueSessions: unique.length,
          ...range,
        };
      }
      case 'system':
        return { report: 'system', ...(await this.systemAnalytics(query)) };
      case 'overview':
      default:
        return {
          report: 'overview' as const,
          ...(await this.dashboard({ ...query, compare: false })),
        };
    }
  }

  async export(query: AnalyticsExportQuery) {
    const range = resolveDateRange(query);
    const report = await this.reports(query);
    const stamp = new Date().toISOString().slice(0, 10);
    const baseName = `analytics-${query.report}-${stamp}`;

    if (query.format === 'pdf') {
      const lines = [
        `Varnarc Analytics Report: ${query.report}`,
        `Generated: ${new Date().toISOString()}`,
        `Period: ${range.from.toISOString()} to ${range.to.toISOString()}`,
        '',
        ...JSON.stringify(report, null, 2).split('\n'),
      ];
      return {
        format: 'pdf' as const,
        filename: `${baseName}.pdf`,
        contentType: 'application/pdf',
        content: buildMinimalPdf(lines),
      };
    }

    const flat = flattenReportForCsv(report as Record<string, unknown>);
    const csv = buildCsv(flat);
    const isExcel = query.format === 'excel';
    return {
      format: query.format,
      filename: isExcel ? `${baseName}.csv` : `${baseName}.csv`,
      contentType: isExcel
        ? 'text/csv; charset=utf-8'
        : 'text/csv; charset=utf-8',
      content: isExcel ? buildExcelCsv(csv) : csv,
    };
  }

  async aggregateNow(query: DateRangeQuery = {}) {
    const { from, to, period } = resolveDateRange(query);
    const counts = await this.repos.analyticsEvents.countByType(from, to);
    const upserts = await Promise.all(
      counts.map((row) =>
        this.repos.analyticsAggregates.upsertMetric({
          metricName: `event.${row.eventType}`,
          metricValue: row._count._all,
          period,
          periodStart: from,
          periodEnd: to,
        }),
      ),
    );

    const pageViewCount = await this.repos.pageViews.count(from, to);
    await this.repos.analyticsAggregates.upsertMetric({
      metricName: 'page_views.total',
      metricValue: pageViewCount,
      period,
      periodStart: from,
      periodEnd: to,
    });

    await this.cache.del(this.cacheKey('dashboard', query)).catch(() => undefined);

    return {
      period,
      from,
      to,
      metricsUpserted: upserts.length + 1,
      eventTypes: counts.map((r) => ({
        eventType: r.eventType,
        count: r._count._all,
      })),
      pageViews: pageViewCount,
    };
  }

  recordSystemMetric(input: {
    metricName: string;
    metricValue: number;
    metadata?: Record<string, unknown>;
  }) {
    return this.repos.systemMetrics.create({
      metricName: input.metricName,
      metricValue: input.metricValue,
      metadata: (input.metadata ?? undefined) as never,
    });
  }

  async recordWebVitals(input: RecordWebVitalsInput, meta?: TrackMeta) {
    for (const metric of input.metrics) {
      await this.repos.systemMetrics.create({
        metricName: `web_vitals.${metric.name.toLowerCase()}`,
        metricValue: metric.value,
        metadata: {
          path: input.path,
          rating: metric.rating,
          navigationType: metric.navigationType,
          sessionId: input.sessionId,
          connectionType: input.connectionType,
          userId: meta?.userId ?? null,
        } as never,
      });
    }

    this.trackEvent(
      {
        eventType: 'custom',
        path: input.path,
        sessionId: input.sessionId,
        metadata: {
          kind: 'web_vitals',
          metrics: input.metrics,
          connectionType: input.connectionType,
        },
      },
      meta,
    );

    return { recorded: input.metrics.length };
  }

  listEvents(query: {
    eventType?: string;
    entityType?: string;
    cursor?: string;
    limit?: number;
    from?: Date;
    to?: Date;
  }) {
    return this.repos.analyticsEvents.list(query);
  }

  listSavedReports(createdBy?: string) {
    return this.repos.analyticsSavedReports.list(createdBy);
  }

  createSavedReport(input: {
    name: string;
    reportType: string;
    filters?: Record<string, unknown>;
    createdBy?: string | null;
  }) {
    return this.repos.analyticsSavedReports.create({
      name: input.name,
      reportType: input.reportType,
      filters: (input.filters ?? undefined) as never,
      createdBy: input.createdBy ?? null,
    });
  }

  deleteSavedReport(id: string) {
    return this.repos.analyticsSavedReports.delete(id);
  }

  async getIntegrations() {
    const row = await this.repos.settings.findByKey(INTEGRATIONS_KEY).catch(() => null);
    if (!row?.value || typeof row.value !== 'object') {
      return { ...DEFAULT_INTEGRATIONS };
    }
    return { ...DEFAULT_INTEGRATIONS, ...(row.value as Record<string, unknown>) };
  }

  async getPublicIntegrations() {
    const config = await this.getIntegrations();
    return {
      googleAnalyticsId: config.googleAnalyticsId ?? null,
      microsoftClarityId: config.microsoftClarityId ?? null,
      plausibleDomain: config.plausibleDomain ?? null,
    };
  }

  async setIntegrations(input: AnalyticsIntegrations, actorId?: string | null) {
    const current = await this.getIntegrations();
    const merged = { ...current, ...input };
    await this.repos.settings.upsert(
      INTEGRATIONS_KEY,
      merged as never,
      'analytics',
      actorId,
    );
    return merged;
  }
}
