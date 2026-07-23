import type { AiJobStatus, Prisma, PrismaClient } from '@prisma/client';
import {
  BaseRepository,
  listActiveWithCursor,
  softDeleteById,
} from '../base.repository';
import { paginateWithCursor, type CursorPageParams } from '../../pagination';

export class AiJobRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.aiJob.findUnique({
      where: { id },
      include: { model: true, prompt: { include: { model: true } }, content: true },
    });
  }

  list(
    params: CursorPageParams & {
      userId?: string;
      status?: AiJobStatus;
    } = {},
  ) {
    return paginateWithCursor((args) => this.db.aiJob.findMany(args), {
      ...params,
      softDelete: false,
      where: {
        ...(params.userId ? { userId: params.userId } : {}),
        ...(params.status ? { status: params.status } : {}),
      },
      include: { model: true, prompt: true },
    });
  }

  create(data: Prisma.AiJobCreateInput) {
    return this.db.aiJob.create({ data });
  }

  update(id: string, data: Prisma.AiJobUpdateInput) {
    return this.db.aiJob.update({ where: { id }, data });
  }

  async getStats() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const [total, failed, last24h, today, byStatus, recent] = await Promise.all([
      this.db.aiJob.count(),
      this.db.aiJob.count({ where: { status: 'FAILED' } }),
      this.db.aiJob.count({ where: { createdAt: { gte: since } } }),
      this.db.aiJob.count({ where: { createdAt: { gte: dayStart } } }),
      this.db.aiJob.groupBy({ by: ['status'], _count: { _all: true } }),
      this.db.aiJob.findMany({
        orderBy: { createdAt: 'desc' },
        take: 2000,
        select: { input: true, status: true },
      }),
    ]);

    const byFeature = new Map<string, { total: number; failed: number }>();
    for (const row of recent) {
      const input = row.input as { feature?: string } | null;
      const feature = typeof input?.feature === 'string' ? input.feature : 'unknown';
      const current = byFeature.get(feature) ?? { total: 0, failed: 0 };
      current.total += 1;
      if (row.status === 'FAILED') current.failed += 1;
      byFeature.set(feature, current);
    }

    const dailyLimit = Number(process.env.AI_DAILY_JOB_LIMIT ?? 0) || null;

    return {
      total,
      failed,
      last24h,
      today,
      dailyLimit,
      quotaRemaining: dailyLimit ? Math.max(0, dailyLimit - today) : null,
      byStatus: byStatus.map((row) => ({ status: row.status, count: row._count._all })),
      byFeature: [...byFeature.entries()]
        .map(([feature, stats]) => ({ feature, ...stats }))
        .sort((a, b) => b.total - a.total),
    };
  }

  countSince(since: Date) {
    return this.db.aiJob.count({ where: { createdAt: { gte: since } } });
  }
}

export class AiPromptRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findBySlug(slug: string) {
    return this.db.aiPrompt.findFirst({
      where: { slug, deletedAt: null },
      include: { model: true },
    });
  }

  list(params: CursorPageParams = {}) {
    return listActiveWithCursor(this.db.aiPrompt, {
      ...params,
      include: { model: true },
    });
  }

  create(data: Prisma.AiPromptCreateInput) {
    return this.db.aiPrompt.create({ data });
  }

  findById(id: string) {
    return this.db.aiPrompt.findFirst({
      where: { id, deletedAt: null },
      include: { model: true },
    });
  }

  update(id: string, data: Prisma.AiPromptUpdateInput) {
    return this.db.aiPrompt.update({ where: { id }, data });
  }

  countActive() {
    return this.db.aiPrompt.count({ where: { deletedAt: null } });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.aiPrompt, id, actorId);
  }
}

export class AiModelRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findBySlug(slug: string) {
    return this.db.aiModel.findFirst({ where: { slug, deletedAt: null } });
  }

  findById(id: string) {
    return this.db.aiModel.findFirst({ where: { id, deletedAt: null } });
  }

  list(params: CursorPageParams = {}) {
    return listActiveWithCursor(this.db.aiModel, params);
  }

  create(data: Prisma.AiModelCreateInput) {
    return this.db.aiModel.create({ data });
  }

  update(id: string, data: Prisma.AiModelUpdateInput) {
    return this.db.aiModel.update({ where: { id }, data });
  }

  countActive() {
    return this.db.aiModel.count({ where: { deletedAt: null } });
  }

  softDelete(id: string) {
    return this.db.aiModel.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
