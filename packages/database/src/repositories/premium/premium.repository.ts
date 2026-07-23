import type { Plan, Prisma, PrismaClient, SubscriptionStatus } from '@prisma/client';
import {
  BaseRepository,
  findActiveById,
  listActiveWithCursor,
  softDeleteById,
} from '../base.repository';
import type { CursorPageParams } from '../../pagination';
import { paginateWithCursor } from '../../pagination';

export class PlanRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string): Promise<Plan | null> {
    return findActiveById<Plan>(this.db.plan, id);
  }

  findBySlug(slug: string) {
    return this.db.plan.findFirst({ where: { slug, deletedAt: null } });
  }

  listActive(params: CursorPageParams = {}) {
    return listActiveWithCursor<Plan>(this.db.plan, {
      ...params,
      where: { isActive: true },
    });
  }

  listAll(params: CursorPageParams = {}) {
    return listActiveWithCursor<Plan>(this.db.plan, params);
  }

  create(data: Prisma.PlanCreateInput) {
    return this.db.plan.create({ data });
  }

  update(id: string, data: Prisma.PlanUpdateInput) {
    return this.db.plan.update({ where: { id }, data });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.plan, id, actorId);
  }
}

type SubscriptionWithRelations = Prisma.SubscriptionGetPayload<{
  include: { plan: true; user: { select: { id: true; email: true; displayName: true } } };
}>;

export class SubscriptionRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string): Promise<SubscriptionWithRelations | null> {
    return findActiveById<SubscriptionWithRelations>(this.db.subscription, id, {
      plan: true,
      user: true,
    });
  }

  findActiveForUser(userId: string): Promise<Prisma.SubscriptionGetPayload<{ include: { plan: true } }> | null> {
    return this.db.subscription.findFirst({
      where: {
        userId,
        deletedAt: null,
        status: { in: ['TRIALING', 'ACTIVE', 'PAST_DUE'] },
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  listByUser(
    userId: string,
    params: CursorPageParams & { status?: SubscriptionStatus } = {},
  ) {
    return listActiveWithCursor(this.db.subscription, {
      ...params,
      where: {
        userId,
        ...(params.status ? { status: params.status } : {}),
      },
      include: { plan: true },
    });
  }

  listAll(params: CursorPageParams & { status?: SubscriptionStatus; userId?: string } = {}) {
    const where: Prisma.SubscriptionWhereInput = { deletedAt: null };
    if (params.status) where.status = params.status;
    if (params.userId) where.userId = params.userId;

    return paginateWithCursor<SubscriptionWithRelations>(
      (args) =>
        this.db.subscription.findMany({
          ...(args as object),
          include: { plan: true, user: { select: { id: true, email: true, displayName: true } } },
        }) as Promise<SubscriptionWithRelations[]>,
      {
        ...params,
        softDelete: false,
        where,
      },
    );
  }

  create(data: Prisma.SubscriptionCreateInput) {
    return this.db.subscription.create({ data });
  }

  update(id: string, data: Prisma.SubscriptionUpdateInput) {
    return this.db.subscription.update({ where: { id }, data });
  }

  cancelActiveForUser(userId: string) {
    return this.db.subscription.updateMany({
      where: {
        userId,
        deletedAt: null,
        status: { in: ['TRIALING', 'ACTIVE', 'PAST_DUE'] },
      },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    });
  }
}

export class InvoiceRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  create(data: Prisma.InvoiceCreateInput) {
    return this.db.invoice.create({ data });
  }

  async nextNumber() {
    const count = await this.db.invoice.count();
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `INV-${stamp}-${String(count + 1).padStart(5, '0')}`;
  }
}

export class PaymentRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  create(data: Prisma.PaymentCreateInput) {
    return this.db.payment.create({ data });
  }

  async sumSucceededBetween(from: Date, to: Date) {
    const result = await this.db.payment.aggregate({
      where: {
        status: 'SUCCEEDED',
        deletedAt: null,
        paidAt: { gte: from, lte: to },
      },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }
}
