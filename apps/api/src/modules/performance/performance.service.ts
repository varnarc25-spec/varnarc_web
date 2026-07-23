import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PERFORMANCE_TARGETS, evaluateLatency } from '@varnarc/config';
import type { Repositories } from '@varnarc/database';
import { REPOS } from '../../database/database.module';
import { HealthService } from '../../health/health.service';
import { SearchCacheService } from '../search/search-cache.service';
import { CacheInvalidationService } from '../../cache/cache-invalidation.service';

const CACHE_NAMESPACES = [
  { prefix: 'cms:', label: 'CMS (articles, pages, menus)' },
  { prefix: 'search:', label: 'Search autocomplete & suggestions' },
  { prefix: 'settings:', label: 'Platform settings' },
  { prefix: 'seo:', label: 'SEO redirects & sitemaps' },
  { prefix: 'analytics:', label: 'Analytics dashboards' },
  { prefix: 'feature-flag:', label: 'Feature flags' },
] as const;

const WEB_VITALS_METRICS = ['lcp', 'inp', 'cls', 'fcp', 'ttfb'] as const;

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);

  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly healthService: HealthService,
    private readonly searchCache: SearchCacheService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  private since24h() {
    return new Date(Date.now() - 24 * 60 * 60 * 1000);
  }

  async overview() {
    const since = this.since24h();
    const [latency, topPaths, readiness] = await Promise.all([
      this.repos.apiRequestLogs.latencyStats(since).catch(() => ({
        total: 0,
        errors: 0,
        avgDurationMs: 0,
        p50DurationMs: 0,
        p95DurationMs: 0,
        errorRate: 0,
      })),
      this.repos.apiRequestLogs.topPathsByVolume(since, 8).catch(() => []),
      this.healthService.getReadiness(),
    ]);

    const hasRedis = Boolean(process.env.REDIS_URL?.trim());
    const webVitals = await this.webVitalsSummary(since);

    return {
      targets: PERFORMANCE_TARGETS,
      evaluations: [
        evaluateLatency('api.avg_ms', latency.avgDurationMs, PERFORMANCE_TARGETS.api.avgResponseMs),
        evaluateLatency('api.p95_ms', latency.p95DurationMs, PERFORMANCE_TARGETS.api.p95ResponseMs),
        evaluateLatency(
          'api.error_rate',
          latency.errorRate,
          PERFORMANCE_TARGETS.api.errorRate,
          'ratio',
        ),
        ...(webVitals.lcp != null
          ? [evaluateLatency('web.lcp_ms', webVitals.lcp, PERFORMANCE_TARGETS.web.lcpMs)]
          : []),
        ...(webVitals.inp != null
          ? [evaluateLatency('web.inp_ms', webVitals.inp, PERFORMANCE_TARGETS.web.inpMs)]
          : []),
        ...(webVitals.cls != null
          ? [
              evaluateLatency(
                'web.cls',
                webVitals.cls,
                PERFORMANCE_TARGETS.web.cls,
                'ratio',
              ),
            ]
          : []),
      ],
      latency24h: latency,
      webVitals24h: webVitals,
      topPaths: topPaths.map((row) => ({
        path: row.path,
        count: row.count,
        avgDurationMs: row.avg_ms,
      })),
      infrastructure: {
        cache: hasRedis ? readiness.redis : 'memory',
        database: readiness.database,
        environment: readiness.environment,
        compression: true,
        openTelemetry: Boolean(
          process.env.OTEL_ENABLED === 'true' || process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
        ),
        prometheus: process.env.PROMETHEUS_ENABLED === 'true' || process.env.NODE_ENV === 'production',
      },
      timestamp: new Date().toISOString(),
    };
  }

  async metrics() {
    const since = this.since24h();
    const latency = await this.repos.apiRequestLogs.latencyStats(since).catch(() => ({
      total: 0,
      errors: 0,
      avgDurationMs: 0,
      p50DurationMs: 0,
      p95DurationMs: 0,
      errorRate: 0,
    }));

    const hasRedis = Boolean(process.env.REDIS_URL?.trim());

    return {
      api_requests_total_24h: latency.total,
      api_errors_total_24h: latency.errors,
      api_latency_avg_ms: latency.avgDurationMs,
      api_latency_p50_ms: latency.p50DurationMs,
      api_latency_p95_ms: latency.p95DurationMs,
      api_error_rate: latency.errorRate,
      cache_backend: hasRedis ? 'redis' : 'memory',
      targets: PERFORMANCE_TARGETS.api,
      collectedAt: new Date().toISOString(),
    };
  }

  cacheStatus() {
    const hasRedis = Boolean(process.env.REDIS_URL?.trim());
    const multiRegion =
      Boolean(process.env.CACHE_PUBSUB_TOPIC) ||
      (hasRedis && process.env.CACHE_INVALIDATION_SUBSCRIBE !== 'false');
    return {
      backend: hasRedis ? 'redis' : 'memory',
      defaultTtlMs: 30_000,
      multiRegionInvalidation: multiRegion,
      invalidationChannels: [
        ...(hasRedis ? ['redis:varnarc:cache:invalidate'] : []),
        ...(process.env.CACHE_PUBSUB_TOPIC ? [`pubsub:${process.env.CACHE_PUBSUB_TOPIC}`] : []),
      ],
      namespaces: CACHE_NAMESPACES.map((ns) => ({
        prefix: ns.prefix,
        label: ns.label,
      })),
      notes: hasRedis
        ? 'Redis shared for cache and optional BullMQ queues.'
        : 'In-memory cache — not shared across Cloud Run instances.',
    };
  }

  async clearCache(scope?: string) {
    let keysRemoved = 0;

    if (!scope || scope === 'search') {
      const result = await this.searchCache.clear();
      keysRemoved += result.keysRemoved;
    }

    if (!scope || scope === 'all' || scope === 'platform') {
      keysRemoved += await this.clearByPrefixes(
        CACHE_NAMESPACES.map((ns) => ns.prefix).filter((p) => p !== 'search:'),
      );
    }

    if (scope && scope !== 'search' && scope !== 'all' && scope !== 'platform') {
      const prefix = scope.endsWith(':') ? scope : `${scope}:`;
      keysRemoved += await this.clearByPrefixes([prefix]);
    }

    const prefixes =
      scope === 'search'
        ? ['search:']
        : scope === 'platform'
          ? CACHE_NAMESPACES.map((ns) => ns.prefix).filter((p) => p !== 'search:')
          : scope && scope !== 'all'
            ? [`${scope.endsWith(':') ? scope : `${scope}:`}`]
            : CACHE_NAMESPACES.map((ns) => ns.prefix);

    await this.cacheInvalidation
      .publish({ prefixes, scope: scope ?? 'all', source: 'performance-api' })
      .catch(() => undefined);

    return {
      cleared: true,
      keysRemoved,
      scope: scope ?? 'all',
      backend: process.env.REDIS_URL ? 'redis' : 'memory',
    };
  }

  private async clearByPrefixes(prefixes: string[]) {
    let removed = 0;
    const store = (
      this.cache as unknown as {
        store?: { client?: { keys: (p: string) => Promise<string[]>; del: (...k: string[]) => Promise<number> } };
      }
    ).store;
    const client = store?.client;

    if (client?.keys && client?.del) {
      for (const prefix of prefixes) {
        try {
          const found = await client.keys(`${prefix}*`);
          if (found.length) {
            await client.del(...found);
            removed += found.length;
          }
        } catch (err) {
          this.logger.warn(
            `Cache clear failed for ${prefix}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
      return removed;
    }

    // In-memory: best-effort reset via cache-manager reset if available
    const reset = (this.cache as unknown as { reset?: () => Promise<void> }).reset;
    if (reset && prefixes.length > 1) {
      await reset().catch(() => undefined);
      return 1;
    }

    return removed;
  }

  private async webVitalsSummary(since: Date) {
    const to = new Date();
    const entries = await Promise.all(
      WEB_VITALS_METRICS.map(async (name) => {
        const metricName = `web_vitals.${name}`;
        const agg = await this.repos.systemMetrics.avg(metricName, since, to).catch(() => null);
        return [name, agg?._avg.metricValue ?? null, agg?._count._all ?? 0] as const;
      }),
    );

    const result: {
      lcp: number | null;
      inp: number | null;
      cls: number | null;
      fcp: number | null;
      ttfb: number | null;
      samples: Record<string, number>;
    } = {
      lcp: null,
      inp: null,
      cls: null,
      fcp: null,
      ttfb: null,
      samples: {},
    };

    for (const [name, avg, count] of entries) {
      result[name] = avg != null ? Math.round(avg * 1000) / 1000 : null;
      result.samples[name] = count;
    }

    return result;
  }
}
