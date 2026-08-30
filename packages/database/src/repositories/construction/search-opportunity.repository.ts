import type { ConstructionSearchOpportunityStatus, Prisma, PrismaClient } from '@prisma/client';
import { BaseRepository } from '../base.repository';

export class ConstructionSearchEventRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  create(data: Prisma.ConstructionSearchEventUncheckedCreateInput) {
    return this.db.constructionSearchEvent.create({ data });
  }

  markRecentClick(queryHash: string, since: Date) {
    return this.db.constructionSearchEvent.updateMany({
      where: {
        queryHash,
        createdAt: { gte: since },
        clicked: false,
      },
      data: { clicked: true },
    });
  }

  async aggregate(since: Date) {
    const rows = await this.db.constructionSearchEvent.groupBy({
      by: ['queryHash', 'displayQuery', 'intent'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      _avg: { resultCount: true },
      _min: { createdAt: true },
      _max: { createdAt: true },
      orderBy: { _count: { queryHash: 'desc' } },
      take: 500,
    });

    const zeroCounts = await this.db.constructionSearchEvent.groupBy({
      by: ['queryHash'],
      where: { createdAt: { gte: since }, resultCount: 0 },
      _count: { _all: true },
    });
    const clickCounts = await this.db.constructionSearchEvent.groupBy({
      by: ['queryHash'],
      where: { createdAt: { gte: since }, clicked: true },
      _count: { _all: true },
    });

    const zeroMap = new Map(zeroCounts.map((r) => [r.queryHash, r._count._all]));
    const clickMap = new Map(clickCounts.map((r) => [r.queryHash, r._count._all]));

    return rows.map((r) => ({
      queryHash: r.queryHash,
      displayQuery: r.displayQuery,
      intent: r.intent,
      searchCount: r._count._all,
      zeroResultCount: zeroMap.get(r.queryHash) ?? 0,
      clickCount: clickMap.get(r.queryHash) ?? 0,
      avgResultCount: r._avg.resultCount ?? 0,
      firstSeenAt: r._min.createdAt ?? since,
      lastSeenAt: r._max.createdAt ?? since,
    }));
  }
}

export class ConstructionSearchOpportunityRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  upsert(data: Prisma.ConstructionSearchOpportunityUncheckedCreateInput) {
    return this.db.constructionSearchOpportunity.upsert({
      where: {
        queryHash_windowDays: {
          queryHash: data.queryHash,
          windowDays: data.windowDays,
        },
      },
      create: data,
      update: {
        displayQuery: data.displayQuery,
        intent: data.intent,
        opportunityType: data.opportunityType,
        searchCount: data.searchCount,
        zeroResultCount: data.zeroResultCount,
        clickCount: data.clickCount,
        avgResultCount: data.avgResultCount,
        ctr: data.ctr,
        zeroResultRate: data.zeroResultRate,
        evidence: data.evidence ?? undefined,
        firstSeenAt: data.firstSeenAt,
        lastSeenAt: data.lastSeenAt,
        // Preserve human status if already decided
      },
    });
  }

  list(params: {
    windowDays: number;
    status?: ConstructionSearchOpportunityStatus | 'all';
    opportunityType?: string;
    intent?: string;
    limit?: number;
    cursor?: string;
  }) {
    const take = (params.limit ?? 50) + 1;
    return this.db.constructionSearchOpportunity.findMany({
      where: {
        windowDays: params.windowDays,
        ...(params.status && params.status !== 'all'
          ? { status: params.status as ConstructionSearchOpportunityStatus }
          : {}),
        ...(params.opportunityType ? { opportunityType: params.opportunityType } : {}),
        ...(params.intent ? { intent: params.intent } : {}),
      },
      orderBy: [{ searchCount: 'desc' }, { lastSeenAt: 'desc' }],
      take,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    });
  }

  findById(id: string) {
    return this.db.constructionSearchOpportunity.findUnique({ where: { id } });
  }

  updateStatus(
    id: string,
    data: {
      status: ConstructionSearchOpportunityStatus;
      notes?: string | null;
      statusUpdatedBy?: string | null;
    },
  ) {
    return this.db.constructionSearchOpportunity.update({
      where: { id },
      data: {
        status: data.status,
        notes: data.notes === undefined ? undefined : data.notes,
        statusUpdatedAt: new Date(),
        statusUpdatedBy: data.statusUpdatedBy ?? null,
      },
    });
  }

  countByStatus(windowDays: number) {
    return this.db.constructionSearchOpportunity.groupBy({
      by: ['status'],
      where: { windowDays },
      _count: { _all: true },
    });
  }

  countByOpportunityType(windowDays: number) {
    return this.db.constructionSearchOpportunity.groupBy({
      by: ['opportunityType'],
      where: { windowDays, status: { in: ['OPEN', 'PLANNED'] } },
      _count: { _all: true },
    });
  }
}
