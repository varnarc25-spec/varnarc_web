import { createHash } from 'crypto';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { PrismaClient, Repositories } from '@varnarc/database';
import {
  detectConstructionSearchIntent,
  detectConstructionSearchOpportunities,
  normalizeConstructionSearchQuery,
  OPPORTUNITY_TYPE_LABELS,
  type ConstructionSearchOpportunityType,
} from '@varnarc/validation';
import { PRISMA, REPOS } from '../../database/database.module';

function hashQuery(normalized: string): string {
  return createHash('sha256').update(normalized).digest('hex');
}

@Injectable()
export class ConstructionSearchOpportunityService {
  private readonly logger = new Logger(ConstructionSearchOpportunityService.name);
  private aggregating = false;

  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    @Inject(PRISMA) private readonly db: PrismaClient,
  ) {}

  /**
   * Public log endpoint — stores scrubbed display query + hash only.
   * Never persists userId, sessionId, email, or phone.
   */
  async logSearch(input: {
    query: string;
    surface: string;
    resultCount: number;
    clicked?: boolean;
    path?: string;
  }) {
    const displayQuery = normalizeConstructionSearchQuery(input.query);
    if (displayQuery.length < 2) {
      return { ok: true, skipped: true as const };
    }
    const queryHash = hashQuery(displayQuery);
    const intent = detectConstructionSearchIntent(displayQuery);
    const pathPrefix = input.path?.startsWith('/construction')
      ? input.path.split('?')[0]!.slice(0, 120)
      : null;

    await this.repos.constructionSearchEvents.create({
      queryHash,
      displayQuery,
      surface: input.surface.slice(0, 40),
      intent,
      resultCount: input.resultCount,
      clicked: Boolean(input.clicked),
      pathPrefix,
    });

    return { ok: true, skipped: false as const, intent };
  }

  async markClick(input: { query: string; surface?: string }) {
    const displayQuery = normalizeConstructionSearchQuery(input.query);
    if (displayQuery.length < 2) return { ok: true, updated: 0 };
    const queryHash = hashQuery(displayQuery);
    const since = new Date(Date.now() - 30 * 60 * 1000);
    const result = await this.repos.constructionSearchEvents.markRecentClick(queryHash, since);
    return { ok: true, updated: result.count };
  }

  async listOpportunities(query: {
    windowDays: number;
    status?: 'OPEN' | 'PLANNED' | 'IMPLEMENTED' | 'IGNORED' | 'all';
    opportunityType?: string;
    intent?: string;
    limit?: number;
    cursor?: string;
  }) {
    const rows = await this.repos.constructionSearchOpportunities.list(query);
    const limit = query.limit ?? 50;
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    return {
      items: items.map((row) => ({
        ...row,
        opportunityTypeLabel:
          OPPORTUNITY_TYPE_LABELS[row.opportunityType as ConstructionSearchOpportunityType] ??
          row.opportunityType,
      })),
      nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
      hasMore,
    };
  }

  async dashboard(windowDays: 7 | 30 | 90) {
    const [statusCounts, typeCounts, { items }] = await Promise.all([
      this.repos.constructionSearchOpportunities.countByStatus(windowDays),
      this.repos.constructionSearchOpportunities.countByOpportunityType(windowDays),
      this.listOpportunities({ windowDays, status: 'all', limit: 10 }),
    ]);

    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
    const eventCount = await this.db.constructionSearchEvent.count({
      where: { createdAt: { gte: since } },
    });

    return {
      windowDays,
      eventCount,
      statusCounts: Object.fromEntries(statusCounts.map((r) => [r.status, r._count._all])),
      opportunityTypeCounts: Object.fromEntries(
        typeCounts.map((r) => [r.opportunityType, r._count._all]),
      ),
      highlights: items.slice(0, 8),
      opportunityTypes: Object.entries(OPPORTUNITY_TYPE_LABELS).map(([id, label]) => ({
        id,
        label,
      })),
      intents: ['calculator', 'guide', 'material', 'cost', 'price', 'boq', 'contractor', 'general'],
    };
  }

  async updateOpportunity(
    id: string,
    input: {
      status: 'OPEN' | 'PLANNED' | 'IMPLEMENTED' | 'IGNORED';
      notes?: string | null;
      actorId?: string | null;
    },
  ) {
    const existing = await this.repos.constructionSearchOpportunities.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Search opportunity not found.' },
      });
    }
    return this.repos.constructionSearchOpportunities.updateStatus(id, {
      status: input.status,
      notes: input.notes,
      statusUpdatedBy: input.actorId ?? null,
    });
  }

  /** Aggregate events → opportunities for 7/30/90 day windows. */
  async aggregateAllWindows() {
    if (this.aggregating) return { skipped: true };
    this.aggregating = true;
    try {
      const windows: Array<7 | 30 | 90> = [7, 30, 90];
      let upserted = 0;
      for (const windowDays of windows) {
        upserted += await this.aggregateWindow(windowDays);
      }
      return { skipped: false, upserted };
    } finally {
      this.aggregating = false;
    }
  }

  async aggregateWindow(windowDays: 7 | 30 | 90) {
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
    const aggregates = await this.repos.constructionSearchEvents.aggregate(since);
    const detected = detectConstructionSearchOpportunities(aggregates, windowDays);

    // Also merge construction-flavoured platform SearchQuery rows (scrubbed) as a secondary signal.
    const platformExtras = await this.aggregatePlatformConstructionQueries(since);
    const merged = detectConstructionSearchOpportunities(
      [...aggregates, ...platformExtras],
      windowDays,
    );

    // Dedupe by queryHash preferring higher searchCount
    const byHash = new Map<string, (typeof merged)[number]>();
    for (const row of [...detected, ...merged]) {
      const prev = byHash.get(row.queryHash);
      if (!prev || row.searchCount > prev.searchCount) byHash.set(row.queryHash, row);
    }

    let count = 0;
    for (const row of byHash.values()) {
      const existing = await this.db.constructionSearchOpportunity.findUnique({
        where: {
          queryHash_windowDays: { queryHash: row.queryHash, windowDays },
        },
        select: { status: true },
      });

      await this.repos.constructionSearchOpportunities.upsert({
        queryHash: row.queryHash,
        displayQuery: row.displayQuery,
        intent: row.intent,
        opportunityType: row.opportunityType,
        searchCount: row.searchCount,
        zeroResultCount: row.zeroResultCount,
        clickCount: row.clickCount,
        avgResultCount: row.avgResultCount,
        ctr: row.ctr,
        zeroResultRate: row.zeroResultRate,
        windowDays,
        firstSeenAt: row.firstSeenAt,
        lastSeenAt: row.lastSeenAt,
        evidence: row.evidence as never,
        // Keep status if already set; upsert update path preserves status
        status: existing?.status ?? 'OPEN',
      });
      count += 1;
    }

    this.logger.log(`Aggregated ${count} construction search opportunities (${windowDays}d)`);
    return count;
  }

  /**
   * Secondary source: platform SearchQuery rows that look construction-related.
   * Scrubs display text; never returns userId.
   */
  private async aggregatePlatformConstructionQueries(since: Date) {
    const rows = await this.db.searchQuery.findMany({
      where: {
        createdAt: { gte: since },
        OR: [
          { query: { contains: 'construction', mode: 'insensitive' } },
          { query: { contains: 'cement', mode: 'insensitive' } },
          { query: { contains: 'concrete', mode: 'insensitive' } },
          { query: { contains: 'waterproof', mode: 'insensitive' } },
          { query: { contains: 'boq', mode: 'insensitive' } },
          { query: { contains: 'calculator', mode: 'insensitive' } },
          { query: { contains: 'steel', mode: 'insensitive' } },
          { query: { contains: 'brick', mode: 'insensitive' } },
        ],
      },
      select: {
        query: true,
        results: true,
        clicked: true,
        createdAt: true,
      },
      take: 5000,
    });

    type Acc = {
      displayQuery: string;
      intent: string;
      searchCount: number;
      zeroResultCount: number;
      clickCount: number;
      resultSum: number;
      firstSeenAt: Date;
      lastSeenAt: Date;
    };
    const map = new Map<string, Acc>();

    for (const row of rows) {
      const displayQuery = normalizeConstructionSearchQuery(row.query);
      if (displayQuery.length < 2) continue;
      const queryHash = hashQuery(displayQuery);
      const prev = map.get(queryHash);
      const intent = detectConstructionSearchIntent(displayQuery);
      if (!prev) {
        map.set(queryHash, {
          displayQuery,
          intent,
          searchCount: 1,
          zeroResultCount: (row.results ?? 0) === 0 ? 1 : 0,
          clickCount: row.clicked ? 1 : 0,
          resultSum: row.results ?? 0,
          firstSeenAt: row.createdAt,
          lastSeenAt: row.createdAt,
        });
      } else {
        prev.searchCount += 1;
        if ((row.results ?? 0) === 0) prev.zeroResultCount += 1;
        if (row.clicked) prev.clickCount += 1;
        prev.resultSum += row.results ?? 0;
        if (row.createdAt < prev.firstSeenAt) prev.firstSeenAt = row.createdAt;
        if (row.createdAt > prev.lastSeenAt) prev.lastSeenAt = row.createdAt;
      }
    }

    return [...map.entries()].map(([queryHash, a]) => ({
      queryHash,
      displayQuery: a.displayQuery,
      intent: a.intent,
      searchCount: a.searchCount,
      zeroResultCount: a.zeroResultCount,
      clickCount: a.clickCount,
      avgResultCount: a.searchCount ? a.resultSum / a.searchCount : 0,
      firstSeenAt: a.firstSeenAt,
      lastSeenAt: a.lastSeenAt,
    }));
  }
}
