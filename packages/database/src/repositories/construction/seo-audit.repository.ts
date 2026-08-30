import type {
  ConstructionSeoAuditIssueStatus,
  ConstructionSeoAuditRunStatus,
  ConstructionSeoAuditSeverity,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { BaseRepository } from '../base.repository';

export class ConstructionSeoAuditRunRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  create(data: Prisma.ConstructionSeoAuditRunUncheckedCreateInput) {
    return this.db.constructionSeoAuditRun.create({ data });
  }

  findById(id: string) {
    return this.db.constructionSeoAuditRun.findUnique({
      where: { id },
      include: { _count: { select: { issues: true } } },
    });
  }

  list(params: {
    limit?: number;
    cursor?: string;
    status?: ConstructionSeoAuditRunStatus | string;
  }) {
    const take = (params.limit ?? 20) + 1;
    return this.db.constructionSeoAuditRun.findMany({
      where: {
        ...(params.status ? { status: params.status as ConstructionSeoAuditRunStatus } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      include: { _count: { select: { issues: true } } },
    });
  }

  update(id: string, data: Prisma.ConstructionSeoAuditRunUncheckedUpdateInput) {
    return this.db.constructionSeoAuditRun.update({ where: { id }, data });
  }

  findQueued(limit = 5) {
    return this.db.constructionSeoAuditRun.findMany({
      where: { status: 'QUEUED' },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  findDeferredInProgress(limit = 3) {
    return this.db.constructionSeoAuditRun.findMany({
      where: { status: 'RUNNING_DEFERRED' },
      orderBy: { updatedAt: 'asc' },
      take: limit,
    });
  }
}

export class ConstructionSeoAuditIssueRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  createMany(data: Prisma.ConstructionSeoAuditIssueCreateManyInput[]) {
    if (!data.length) return Promise.resolve({ count: 0 });
    return this.db.constructionSeoAuditIssue.createMany({ data });
  }

  list(params: {
    runId?: string;
    pageType?: string;
    issueType?: string;
    status?: ConstructionSeoAuditIssueStatus | 'all';
    severity?: ConstructionSeoAuditSeverity | 'all';
    path?: string;
    scannedAfter?: Date;
    scannedBefore?: Date;
    limit?: number;
    cursor?: string;
  }) {
    const take = (params.limit ?? 100) + 1;
    const runFilter =
      params.scannedAfter || params.scannedBefore
        ? {
            run: {
              ...(params.scannedAfter ? { finishedAt: { gte: params.scannedAfter } } : {}),
              ...(params.scannedBefore
                ? {
                    finishedAt: {
                      ...(params.scannedAfter ? { gte: params.scannedAfter } : {}),
                      lte: params.scannedBefore,
                    },
                  }
                : {}),
            },
          }
        : {};

    return this.db.constructionSeoAuditIssue.findMany({
      where: {
        ...(params.runId ? { runId: params.runId } : {}),
        ...(params.pageType ? { pageType: params.pageType } : {}),
        ...(params.issueType ? { issueType: params.issueType } : {}),
        ...(params.status && params.status !== 'all'
          ? { status: params.status as ConstructionSeoAuditIssueStatus }
          : {}),
        ...(params.severity && params.severity !== 'all'
          ? { severity: params.severity as ConstructionSeoAuditSeverity }
          : {}),
        ...(params.path ? { path: { contains: params.path, mode: 'insensitive' } } : {}),
        ...runFilter,
      },
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
      take,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      include: {
        run: { select: { id: true, status: true, finishedAt: true, createdAt: true, mode: true } },
      },
    });
  }

  updateStatus(id: string, status: ConstructionSeoAuditIssueStatus) {
    return this.db.constructionSeoAuditIssue.update({
      where: { id },
      data: {
        status,
        resolvedAt: status === 'OPEN' ? null : new Date(),
      },
    });
  }

  countBySeverity(runId: string) {
    return this.db.constructionSeoAuditIssue.groupBy({
      by: ['severity'],
      where: { runId, status: 'OPEN' },
      _count: { _all: true },
    });
  }

  distinctPathsWithIssues(runId: string) {
    return this.db.constructionSeoAuditIssue.findMany({
      where: { runId, status: 'OPEN' },
      distinct: ['path'],
      select: { path: true },
    });
  }
}
