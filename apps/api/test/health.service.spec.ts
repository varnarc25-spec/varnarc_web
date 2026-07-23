import { describe, expect, it, vi } from 'vitest';
import { HealthService } from '../src/health/health.service';

describe('HealthService', () => {
  const prisma = {
    $queryRaw: vi.fn().mockResolvedValue(1),
  };

  it('reports ok liveness', () => {
    const service = new HealthService(prisma as never);
    const health = service.getHealth();
    expect(health.status).toBe('ok');
    expect(health.service).toBe('varnarc-api');
  });

  it('marks ready when database is up', async () => {
    const service = new HealthService(prisma as never);
    vi.stubEnv('DATABASE_URL', 'postgresql://test');
    delete process.env.REDIS_URL;

    const readiness = await service.getReadiness();
    expect(readiness.database).toBe('up');
    expect(readiness.redis).toBe('memory');
    expect(service.isReady(readiness)).toBe(true);

    vi.unstubAllEnvs();
  });

  it('not ready when database is down', async () => {
    const failing = {
      $queryRaw: vi.fn().mockRejectedValue(new Error('connection refused')),
    };
    const service = new HealthService(failing as never);
    vi.stubEnv('DATABASE_URL', 'postgresql://test');

    const readiness = await service.getReadiness();
    expect(readiness.database).toBe('down');
    expect(service.isReady(readiness)).toBe(false);

    vi.unstubAllEnvs();
  });
});
