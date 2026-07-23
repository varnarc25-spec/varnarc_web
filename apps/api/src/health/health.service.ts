import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@varnarc/database';
import { isOpenSearchEngine } from '@varnarc/config';
import type { HealthResponse } from '@varnarc/types';
import { PRISMA } from '../database/database.module';
import { getOpenSearchConfig, OpenSearchClient } from '../modules/search/opensearch.client';

export type DependencyStatus = 'up' | 'down' | 'unconfigured' | 'memory';

export type ReadinessResponse = HealthResponse & {
  database: DependencyStatus;
  redis: DependencyStatus;
  auth0: DependencyStatus;
  searchEngine: string;
  opensearch: DependencyStatus;
  environment: string;
  version: string;
};

@Injectable()
export class HealthService {
  constructor(@Inject(PRISMA) private readonly db: PrismaClient) {}

  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'varnarc-api',
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<DependencyStatus> {
    if (!process.env.DATABASE_URL?.trim()) return 'unconfigured';
    try {
      await this.db.$queryRaw`SELECT 1`;
      return 'up';
    } catch {
      return 'down';
    }
  }

  private async checkRedis(): Promise<DependencyStatus> {
    const url = process.env.REDIS_URL?.trim();
    if (!url) return 'memory';
    try {
      const { default: Redis } = await import('ioredis');
      const client = new Redis(url, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2_000,
        lazyConnect: true,
      });
      await client.connect();
      await client.ping();
      await client.quit();
      return 'up';
    } catch {
      return 'down';
    }
  }

  private checkAuth0(): DependencyStatus {
    const configured = Boolean(
      process.env.AUTH0_DOMAIN?.trim() && process.env.AUTH0_AUDIENCE?.trim(),
    );
    return configured ? 'up' : 'unconfigured';
  }

  private async checkOpenSearch(): Promise<DependencyStatus> {
    if (!isOpenSearchEngine()) return 'unconfigured';
    const config = getOpenSearchConfig();
    if (!config) return 'unconfigured';
    const client = new OpenSearchClient(config);
    return (await client.ping()) ? 'up' : 'down';
  }

  async getReadiness(): Promise<ReadinessResponse> {
    const [database, redis, opensearch] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkOpenSearch(),
    ]);
    const auth0 = this.checkAuth0();
    const searchEngine = isOpenSearchEngine() ? 'opensearch' : 'postgres-fts';

    const degraded =
      database === 'down' || redis === 'down' || (searchEngine === 'opensearch' && opensearch === 'down');

    return {
      status: degraded ? 'degraded' : 'ok',
      service: 'varnarc-api',
      timestamp: new Date().toISOString(),
      database,
      redis,
      auth0,
      searchEngine,
      opensearch,
      environment: process.env.NODE_ENV ?? 'development',
      version: process.env.APP_VERSION ?? '1.0.0',
    };
  }

  isReady(readiness: ReadinessResponse) {
    if (readiness.database === 'down') return false;
    if (readiness.redis === 'down') return false;
    if (readiness.searchEngine === 'opensearch' && readiness.opensearch === 'down') return false;
    return true;
  }
}
