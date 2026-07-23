import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PerformanceService } from '../src/modules/performance/performance.service';

describe('PerformanceService', () => {
  const repos = {
    apiRequestLogs: {
      latencyStats: vi.fn(),
      topPathsByVolume: vi.fn(),
    },
    systemMetrics: {
      avg: vi.fn().mockResolvedValue({ _avg: { metricValue: null }, _count: { _all: 0 } }),
    },
  };

  const cache = { store: undefined };
  const healthService = {
    getReadiness: vi.fn().mockResolvedValue({
      status: 'ok',
      redis: 'memory',
      database: 'up',
      environment: 'test',
    }),
  };
  const searchCache = {
    clear: vi.fn().mockResolvedValue({ keysRemoved: 2, backend: 'memory' }),
  };
  const cacheInvalidation = {
    publish: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repos.apiRequestLogs.latencyStats.mockResolvedValue({
      total: 100,
      errors: 2,
      avgDurationMs: 80,
      p50DurationMs: 70,
      p95DurationMs: 150,
      errorRate: 0.02,
    });
    repos.apiRequestLogs.topPathsByVolume.mockResolvedValue([
      { path: '/api/v1/articles', count: 50, avg_ms: 60 },
    ]);
  });

  it('returns metrics snapshot', async () => {
    const service = new PerformanceService(
      repos as never,
      cache as never,
      healthService as never,
      searchCache as never,
      cacheInvalidation as never,
    );
    const metrics = await service.metrics();
    expect(metrics.api_requests_total_24h).toBe(100);
    expect(metrics.api_latency_p95_ms).toBe(150);
  });

  it('evaluates targets in overview', async () => {
    const service = new PerformanceService(
      repos as never,
      cache as never,
      healthService as never,
      searchCache as never,
      cacheInvalidation as never,
    );
    const overview = await service.overview();
    expect(overview.evaluations).toHaveLength(3);
    expect(overview.topPaths[0]?.path).toContain('articles');
  });
});
