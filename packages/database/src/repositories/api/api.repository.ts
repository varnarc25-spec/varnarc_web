import { createHash, randomBytes } from 'node:crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import { paginateWithCursor, type CursorPageParams } from '../../pagination';
import { BaseRepository, listActiveWithCursor, softDeleteById } from '../base.repository';

export class ApiRequestLogRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  create(data: {
    requestId: string;
    method: string;
    path: string;
    statusCode: number;
    durationMs: number;
    userId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    errorMessage?: string | null;
  }) {
    return this.db.apiRequestLog.create({ data });
  }

  list(params: CursorPageParams & { statusCode?: number; path?: string } = {}) {
    const where: Prisma.ApiRequestLogWhereInput = {};
    if (params.statusCode) where.statusCode = params.statusCode;
    if (params.path) where.path = { contains: params.path, mode: 'insensitive' };

    return paginateWithCursor(
      (args) => this.db.apiRequestLog.findMany(args as never),
      {
        ...params,
        softDelete: false,
        where,
      },
    );
  }

  async summary(since: Date) {
    const stats = await this.latencyStats(since);
    return {
      total: stats.total,
      errors: stats.errors,
      avgDurationMs: stats.avgDurationMs,
      p50DurationMs: stats.p50DurationMs,
      p95DurationMs: stats.p95DurationMs,
      errorRate: stats.errorRate,
    };
  }

  async latencyStats(since: Date) {
    const rows = await this.db.$queryRaw<
      Array<{
        total: number;
        errors: number;
        avg_ms: number | null;
        p50_ms: number | null;
        p95_ms: number | null;
      }>
    >`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status_code >= 400)::int AS errors,
        AVG(duration_ms)::float AS avg_ms,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY duration_ms)::float AS p50_ms,
        percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)::float AS p95_ms
      FROM api_request_logs
      WHERE created_at >= ${since}
    `;

    const row = rows[0];
    const total = row?.total ?? 0;
    const errors = row?.errors ?? 0;

    return {
      total,
      errors,
      avgDurationMs: Math.round(row?.avg_ms ?? 0),
      p50DurationMs: Math.round(row?.p50_ms ?? 0),
      p95DurationMs: Math.round(row?.p95_ms ?? 0),
      errorRate: total > 0 ? errors / total : 0,
    };
  }

  async topPathsByVolume(since: Date, limit = 10) {
    return this.db.$queryRaw<
      Array<{ path: string; count: number; avg_ms: number }>
    >`
      SELECT
        path,
        COUNT(*)::int AS count,
        ROUND(AVG(duration_ms))::int AS avg_ms
      FROM api_request_logs
      WHERE created_at >= ${since}
      GROUP BY path
      ORDER BY count DESC
      LIMIT ${limit}
    `;
  }

  pruneOlderThan(date: Date) {
    return this.db.apiRequestLog.deleteMany({ where: { createdAt: { lt: date } } });
  }
}

export class ApiKeyRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.apiKey.findFirst({ where: { id, deletedAt: null } });
  }

  findByHash(keyHash: string) {
    return this.db.apiKey.findFirst({ where: { keyHash, deletedAt: null, enabled: true } });
  }

  list(params: CursorPageParams = {}) {
    return listActiveWithCursor(this.db.apiKey, params);
  }

  create(data: {
    name: string;
    keyPrefix: string;
    keyHash: string;
    scopes: string[];
    expiresAt?: Date | null;
    createdBy?: string | null;
  }) {
    return this.db.apiKey.create({ data });
  }

  update(id: string, data: Prisma.ApiKeyUpdateInput) {
    return this.db.apiKey.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return softDeleteById(this.db.apiKey, id);
  }

  touchLastUsed(id: string) {
    return this.db.apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }
}

export class WebhookEndpointRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.webhookEndpoint.findFirst({ where: { id, deletedAt: null } });
  }

  list(params: CursorPageParams = {}) {
    return listActiveWithCursor(this.db.webhookEndpoint, params);
  }

  listEnabledForEvent(event: string) {
    return this.db.webhookEndpoint.findMany({
      where: {
        deletedAt: null,
        enabled: true,
        events: { has: event },
      },
    });
  }

  create(data: {
    name: string;
    url: string;
    secret?: string | null;
    events: string[];
    enabled?: boolean;
    createdBy?: string | null;
  }) {
    return this.db.webhookEndpoint.create({ data });
  }

  update(id: string, data: Prisma.WebhookEndpointUpdateInput) {
    return this.db.webhookEndpoint.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return softDeleteById(this.db.webhookEndpoint, id);
  }
}

export class WebhookDeliveryRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  create(data: {
    endpointId: string;
    event: string;
    payload: Prisma.InputJsonValue;
    statusCode?: number | null;
    success: boolean;
    errorMessage?: string | null;
    attempt?: number;
  }) {
    return this.db.webhookDelivery.create({ data });
  }

  listForEndpoint(endpointId: string, params: CursorPageParams = {}) {
    return paginateWithCursor(
      (args) => this.db.webhookDelivery.findMany(args as never),
      {
        ...params,
        softDelete: false,
        where: { endpointId },
      },
    );
  }

  async statsSince(since: Date) {
    const [total, failed, recent] = await Promise.all([
      this.db.webhookDelivery.count({ where: { createdAt: { gte: since } } }),
      this.db.webhookDelivery.count({
        where: { createdAt: { gte: since }, success: false },
      }),
      this.db.webhookDelivery.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: { createdAt: { gte: since } },
        include: { endpoint: { select: { name: true, url: true } } },
      }),
    ]);
    return { total, failed, successRate: total ? (total - failed) / total : 1, recent };
  }
}

export function hashApiKey(rawKey: string) {
  return createHash('sha256').update(rawKey).digest('hex');
}

export function generateApiKey() {
  const raw = `vrk_${randomBytes(24).toString('base64url')}`;
  return { raw, prefix: raw.slice(0, 12), hash: hashApiKey(raw) };
}
