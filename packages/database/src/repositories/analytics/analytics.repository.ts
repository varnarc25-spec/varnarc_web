import type { Prisma, PrismaClient } from '@prisma/client';
import { BaseRepository } from '../base.repository';
import {
  decodeCursor,
  encodeCursor,
  normalizeLimit,
  toCursorPayload,
} from '../../pagination';

export type AnalyticsEventCreate = {
  userId?: string | null;
  sessionId?: string | null;
  eventType: string;
  entityType?: string | null;
  entityId?: string | null;
  path?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setUTCHours(23, 59, 59, 999);
  return x;
}

export function resolveDateRange(input?: { from?: Date; to?: Date; period?: string }) {
  const to = input?.to ? endOfDay(input.to) : endOfDay(new Date());
  if (input?.from) {
    return { from: startOfDay(input.from), to, period: input.period ?? 'custom' };
  }
  const from = startOfDay(new Date(to));
  switch (input?.period) {
    case 'day':
      break;
    case 'week':
      from.setUTCDate(from.getUTCDate() - 6);
      break;
    case 'quarter':
      from.setUTCDate(from.getUTCDate() - 89);
      break;
    case 'year':
      from.setUTCFullYear(from.getUTCFullYear() - 1);
      break;
    case 'month':
    default:
      from.setUTCDate(from.getUTCDate() - 29);
      break;
  }
  return { from, to, period: input?.period ?? 'month' };
}

export class AnalyticsEventRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  create(data: AnalyticsEventCreate) {
    return this.db.analyticsEvent.create({
      data: {
        userId: data.userId ?? null,
        sessionId: data.sessionId ?? null,
        eventType: data.eventType,
        entityType: data.entityType ?? null,
        entityId: data.entityId ?? null,
        path: data.path ?? null,
        metadata: data.metadata,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
  }

  createMany(rows: AnalyticsEventCreate[]) {
    return this.db.analyticsEvent.createMany({
      data: rows.map((data) => ({
        userId: data.userId ?? null,
        sessionId: data.sessionId ?? null,
        eventType: data.eventType,
        entityType: data.entityType ?? null,
        entityId: data.entityId ?? null,
        path: data.path ?? null,
        metadata: data.metadata,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      })),
    });
  }

  async list(params: {
    eventType?: string;
    entityType?: string;
    from?: Date;
    to?: Date;
    cursor?: string;
    limit?: number;
  }) {
    const limit = normalizeLimit(params.limit, 50);
    const where: Prisma.AnalyticsEventWhereInput = {
      ...(params.eventType ? { eventType: params.eventType } : {}),
      ...(params.entityType ? { entityType: params.entityType } : {}),
      ...(params.from || params.to
        ? {
            createdAt: {
              ...(params.from ? { gte: params.from } : {}),
              ...(params.to ? { lte: params.to } : {}),
            },
          }
        : {}),
    };

    if (params.cursor) {
      const c = decodeCursor(params.cursor);
      where.OR = [
        { createdAt: { lt: new Date(c.createdAt) } },
        { createdAt: new Date(c.createdAt), id: { lt: c.id } },
      ];
    }

    const rows = await this.db.analyticsEvent.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    return {
      items,
      nextCursor: hasMore && last ? encodeCursor(toCursorPayload(last)) : null,
      hasMore,
    };
  }

  countByType(from: Date, to: Date) {
    return this.db.analyticsEvent.groupBy({
      by: ['eventType'],
      where: { createdAt: { gte: from, lte: to } },
      _count: { _all: true },
      orderBy: { _count: { eventType: 'desc' } },
    });
  }

  count(from: Date, to: Date, eventType?: string) {
    return this.db.analyticsEvent.count({
      where: {
        createdAt: { gte: from, lte: to },
        ...(eventType ? { eventType } : {}),
      },
    });
  }

  topPaths(from: Date, to: Date, limit = 10) {
    return this.db.analyticsEvent.groupBy({
      by: ['path'],
      where: {
        createdAt: { gte: from, lte: to },
        eventType: 'page_view',
        path: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { path: 'desc' } },
      take: limit,
    });
  }

  uniqueSessions(from: Date, to: Date) {
    return this.db.analyticsEvent.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        sessionId: { not: null },
      },
      distinct: ['sessionId'],
      select: { sessionId: true },
    });
  }
}

export class AnalyticsSessionRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  async upsertByKey(input: {
    sessionKey: string;
    userId?: string | null;
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    device?: string | null;
  }) {
    return this.db.analyticsSession.upsert({
      where: { sessionKey: input.sessionKey },
      create: {
        sessionKey: input.sessionKey,
        userId: input.userId ?? null,
        source: input.source ?? null,
        medium: input.medium ?? null,
        campaign: input.campaign ?? null,
        device: input.device ?? null,
      },
      update: {
        ...(input.userId ? { userId: input.userId } : {}),
        ...(input.source ? { source: input.source } : {}),
        ...(input.medium ? { medium: input.medium } : {}),
        ...(input.campaign ? { campaign: input.campaign } : {}),
      },
    });
  }

  countActive(from: Date, to: Date) {
    return this.db.analyticsSession.count({
      where: { startedAt: { gte: from, lte: to } },
    });
  }
}

export class AnalyticsAggregateRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  async upsertMetric(input: {
    metricName: string;
    metricValue: number;
    period: string;
    periodStart: Date;
    periodEnd: Date;
    entityType?: string | null;
    entityId?: string | null;
  }) {
    const existing = await this.db.analyticsAggregate.findFirst({
      where: {
        metricName: input.metricName,
        period: input.period,
        periodStart: input.periodStart,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
      },
    });
    if (existing) {
      return this.db.analyticsAggregate.update({
        where: { id: existing.id },
        data: { metricValue: input.metricValue, periodEnd: input.periodEnd },
      });
    }
    return this.db.analyticsAggregate.create({
      data: {
        metricName: input.metricName,
        metricValue: input.metricValue,
        period: input.period,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
      },
    });
  }

  list(params: { metricName?: string; period?: string; from?: Date; to?: Date; limit?: number }) {
    return this.db.analyticsAggregate.findMany({
      where: {
        ...(params.metricName ? { metricName: params.metricName } : {}),
        ...(params.period ? { period: params.period } : {}),
        ...(params.from || params.to
          ? {
              periodStart: {
                ...(params.from ? { gte: params.from } : {}),
                ...(params.to ? { lte: params.to } : {}),
              },
            }
          : {}),
      },
      orderBy: { periodStart: 'desc' },
      take: params.limit ?? 100,
    });
  }
}

export class TrafficSourceRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  create(data: {
    sessionId?: string | null;
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    referrer?: string | null;
  }) {
    return this.db.trafficSource.create({
      data: {
        sessionId: data.sessionId ?? null,
        source: data.source ?? null,
        medium: data.medium ?? null,
        campaign: data.campaign ?? null,
        referrer: data.referrer ?? null,
      },
    });
  }

  topSources(from: Date, to: Date, limit = 10) {
    return this.db.trafficSource.groupBy({
      by: ['source'],
      where: { createdAt: { gte: from, lte: to } },
      _count: { _all: true },
      orderBy: { _count: { source: 'desc' } },
      take: limit,
    });
  }
}

export class SystemMetricRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  create(data: { metricName: string; metricValue: number; metadata?: Prisma.InputJsonValue }) {
    return this.db.systemMetric.create({
      data: {
        metricName: data.metricName,
        metricValue: data.metricValue,
        metadata: data.metadata,
      },
    });
  }

  latest(metricName?: string, limit = 50) {
    return this.db.systemMetric.findMany({
      where: metricName ? { metricName } : undefined,
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
  }

  avg(metricName: string, from: Date, to: Date) {
    return this.db.systemMetric.aggregate({
      where: { metricName, recordedAt: { gte: from, lte: to } },
      _avg: { metricValue: true },
      _count: { _all: true },
    });
  }
}

export class AffiliateConversionRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  list(limit = 50) {
    return this.db.affiliateConversion.findMany({
      orderBy: { revenue: 'desc' },
      take: limit,
    });
  }

  async incrementClick(partner: string, entityType?: string, entityId?: string) {
    const existing = await this.db.affiliateConversion.findFirst({
      where: {
        partner,
        entityType: entityType ?? null,
        entityId: entityId ?? null,
      },
    });
    if (existing) {
      return this.db.affiliateConversion.update({
        where: { id: existing.id },
        data: { clicks: { increment: 1 } },
      });
    }
    return this.db.affiliateConversion.create({
      data: {
        partner,
        entityType: entityType ?? null,
        entityId: entityId ?? null,
        clicks: 1,
      },
    });
  }

  totals() {
    return this.db.affiliateConversion.aggregate({
      _sum: { clicks: true, conversions: true, revenue: true },
    });
  }
}

export class AnalyticsSavedReportRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  list(createdBy?: string) {
    return this.db.analyticsSavedReport.findMany({
      where: createdBy ? { createdBy } : undefined,
      orderBy: { updatedAt: 'desc' },
    });
  }

  create(data: {
    name: string;
    reportType: string;
    filters?: Prisma.InputJsonValue;
    createdBy?: string | null;
  }) {
    return this.db.analyticsSavedReport.create({
      data: {
        name: data.name,
        reportType: data.reportType,
        filters: data.filters,
        createdBy: data.createdBy ?? null,
      },
    });
  }

  delete(id: string) {
    return this.db.analyticsSavedReport.delete({ where: { id } });
  }
}

export class PageViewRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  create(data: {
    sessionId?: string | null;
    userId?: string | null;
    path: string;
    referrer?: string | null;
  }) {
    return this.db.pageView.create({ data });
  }

  count(from: Date, to: Date) {
    return this.db.pageView.count({ where: { createdAt: { gte: from, lte: to } } });
  }

  topPaths(from: Date, to: Date, limit = 10) {
    return this.db.pageView.groupBy({
      by: ['path'],
      where: { createdAt: { gte: from, lte: to } },
      _count: { _all: true },
      orderBy: { _count: { path: 'desc' } },
      take: limit,
    });
  }
}
