import { Inject, Injectable } from '@nestjs/common';
import { API_VERSION } from '@varnarc/validation';
import type { Repositories } from '@varnarc/database';
import { REPOS } from '../../database/database.module';
import { HealthService } from '../../health/health.service';
import { PerformanceService } from '../performance/performance.service';
import { isLlmConfigured } from '../ai/llm.client';

@Injectable()
export class MonitoringService {
  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    private readonly healthService: HealthService,
    private readonly performanceService: PerformanceService,
  ) {}

  private since24h() {
    return new Date(Date.now() - 24 * 60 * 60 * 1000);
  }

  async overview() {
    const since = this.since24h();
    const hasRedis = Boolean(process.env.REDIS_URL?.trim());

    const [readiness, latency, aiJobs, webhooks, newsletter, notifications] =
      await Promise.all([
        this.healthService.getReadiness(),
        this.repos.apiRequestLogs.summary(since).catch(() => ({
          total: 0,
          errors: 0,
          avgDurationMs: 0,
          p95DurationMs: 0,
          errorRate: 0,
        })),
        this.repos.aiJobs.getStats().catch(() => ({
          total: 0,
          failed: 0,
          last24h: 0,
          byStatus: [],
        })),
        this.repos.webhookDeliveries.statsSince(since).catch(() => ({
          total: 0,
          failed: 0,
          successRate: 1,
          recent: [],
        })),
        this.repos.newsletterSubscribers.summary().catch(() => ({
          total: 0,
          subscribed: 0,
        })),
        this.repos.notifications.summary().catch(() => ({
          notificationCount: 0,
          templateCount: 0,
          unreadCount: 0,
        })),
      ]);

    const cache = hasRedis ? readiness.redis : 'memory';
    const errorRate = latency.total ? latency.errors / latency.total : 0;

    return {
      timestamp: new Date().toISOString(),
      version: {
        version: API_VERSION,
        apiPrefix: '/api/v1',
        environment: process.env.NODE_ENV ?? 'development',
        node: process.version,
        appVersion: process.env.APP_VERSION ?? '1.0.0',
      },
      health: {
        liveness: this.healthService.getHealth(),
        readiness,
        overall: readiness.status,
      },
      infrastructure: {
        database: readiness.database,
        cache,
        auth0: readiness.auth0,
        redis: readiness.redis,
        prometheus: process.env.PROMETHEUS_ENABLED === 'true' || process.env.NODE_ENV === 'production',
        openTelemetry: Boolean(
          process.env.OTEL_ENABLED === 'true' || process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
        ),
      },
      api: {
        last24h: { ...latency, errorRate },
        throttler: { ttlMs: 60_000, limit: Number(process.env.RATE_LIMIT_PER_MINUTE ?? 120) },
        docsUrl: '/api/v1/docs',
      },
      queues: {
        aiJobs,
        webhooks,
      },
      modules: [
        { key: 'database', label: 'Database', status: readiness.database },
        { key: 'cache', label: 'Cache', status: cache },
        { key: 'auth0', label: 'Auth0', status: readiness.auth0 },
        { key: 'ai', label: 'AI / LLM', status: isLlmConfigured() ? 'up' : 'unconfigured' },
        { key: 'newsletter', label: 'Newsletter', status: 'up', meta: `${newsletter.subscribed ?? 0} subscribers` },
        { key: 'notifications', label: 'Notifications', status: 'up', meta: `${notifications.unreadCount ?? 0} unread` },
        { key: 'search', label: 'Search', status: 'up' },
        { key: 'analytics', label: 'Analytics', status: 'up' },
      ],
    };
  }

  async probes() {
    const [readiness, health] = await Promise.all([
      this.healthService.getReadiness(),
      Promise.resolve(this.healthService.getHealth()),
    ]);
    return {
      timestamp: new Date().toISOString(),
      ready: this.healthService.isReady(readiness),
      health,
      readiness,
    };
  }

  cacheStatus() {
    return this.performanceService.cacheStatus();
  }

  async metrics() {
    return this.performanceService.metrics();
  }
}
