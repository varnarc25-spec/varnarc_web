import type { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../base.repository';
import { paginateWithCursor, type CursorPageParams } from '../../pagination';

export type SecurityEventSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type SecurityEventStatus = 'open' | 'acknowledged' | 'resolved';

export class SecurityEventRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  create(data: {
    eventType: string;
    severity?: SecurityEventSeverity;
    description: string;
    status?: SecurityEventStatus;
    userId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.db.securityEvent.create({
      data: {
        eventType: data.eventType,
        severity: data.severity ?? 'info',
        description: data.description,
        status: data.status ?? 'open',
        userId: data.userId ?? null,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        metadata: data.metadata,
      },
    });
  }

  list(
    params: CursorPageParams & {
      eventType?: string;
      severity?: string;
      status?: string;
      userId?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {},
  ) {
    return paginateWithCursor((args) => this.db.securityEvent.findMany(args), {
      ...params,
      softDelete: false,
      where: {
        ...(params.eventType ? { eventType: params.eventType } : {}),
        ...(params.severity ? { severity: params.severity } : {}),
        ...(params.status ? { status: params.status } : {}),
        ...(params.userId ? { userId: params.userId } : {}),
        ...(params.dateFrom || params.dateTo
          ? {
              createdAt: {
                ...(params.dateFrom ? { gte: params.dateFrom } : {}),
                ...(params.dateTo ? { lte: params.dateTo } : {}),
              },
            }
          : {}),
      },
      include: {
        user: { select: { id: true, email: true, displayName: true } },
      },
    });
  }

  async summary(since: Date) {
    const [total, bySeverity, byType] = await Promise.all([
      this.db.securityEvent.count({ where: { createdAt: { gte: since } } }),
      this.db.securityEvent.groupBy({
        by: ['severity'],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      }),
      this.db.securityEvent.groupBy({
        by: ['eventType'],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { eventType: 'desc' } },
      }),
    ]);

    return {
      total,
      bySeverity: Object.fromEntries(bySeverity.map((row) => [row.severity, row._count._all])),
      topEventTypes: byType.slice(0, 10).map((row) => ({
        eventType: row.eventType,
        count: row._count._all,
      })),
    };
  }
}
