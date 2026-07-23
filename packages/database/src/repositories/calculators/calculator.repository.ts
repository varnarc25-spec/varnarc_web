import type { Prisma, PrismaClient, PublishStatus } from '@prisma/client';
import {
  BaseRepository,
  findActiveById,
  listActiveWithCursor,
  softDeleteById,
} from '../base.repository';
import type { CursorPageParams } from '../../pagination';

const calculatorInclude = {
  fields: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' as const } },
  category: true,
  versions: { orderBy: { version: 'desc' as const }, take: 10 },
} satisfies Prisma.CalculatorInclude;

export class CalculatorCategoryRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return findActiveById(this.db.calculatorCategory, id);
  }

  findBySlug(slug: string) {
    return this.db.calculatorCategory.findFirst({ where: { slug, deletedAt: null } });
  }

  list() {
    return this.db.calculatorCategory.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { calculators: true } } },
    });
  }

  create(data: Prisma.CalculatorCategoryCreateInput) {
    return this.db.calculatorCategory.create({ data });
  }

  update(id: string, data: Prisma.CalculatorCategoryUpdateInput) {
    return this.db.calculatorCategory.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return softDeleteById(this.db.calculatorCategory, id);
  }
}

export class CalculatorRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.calculator.findFirst({
      where: { id, deletedAt: null },
      include: calculatorInclude,
    });
  }

  findBySlug(slug: string) {
    return this.db.calculator.findFirst({
      where: { slug, deletedAt: null },
      include: calculatorInclude,
    });
  }

  list(
    params: CursorPageParams & {
      status?: PublishStatus;
      search?: string;
      categoryId?: string;
    } = {},
  ) {
    return listActiveWithCursor(this.db.calculator, {
      ...params,
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.categoryId ? { categoryId: params.categoryId } : {}),
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { slug: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        category: true,
        _count: { select: { fields: true, history: true } },
      },
    });
  }

  create(data: Prisma.CalculatorCreateInput) {
    return this.db.calculator.create({ data, include: calculatorInclude });
  }

  update(id: string, data: Prisma.CalculatorUpdateInput) {
    return this.db.calculator.update({ where: { id }, data, include: calculatorInclude });
  }

  async replaceFields(
    calculatorId: string,
    fields: Array<{
      key: string;
      label: string;
      fieldType: string;
      defaultValue?: string | null;
      sortOrder: number;
      required: boolean;
      options?: unknown;
      validation?: unknown;
    }>,
  ) {
    await this.db.$transaction([
      this.db.calculatorField.updateMany({
        where: { calculatorId, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
      ...fields.map((f) =>
        this.db.calculatorField.create({
          data: {
            calculatorId,
            key: f.key,
            label: f.label,
            fieldType: f.fieldType,
            defaultValue: f.defaultValue ?? null,
            sortOrder: f.sortOrder,
            required: f.required,
            options: f.options as never,
            validation: f.validation as never,
          },
        }),
      ),
    ]);
  }

  async publish(id: string, actorId?: string | null) {
    const current = await this.findById(id);
    if (!current) return null;
    const version = current.version + 1;
    await this.db.calculatorVersion.create({
      data: {
        calculatorId: id,
        version: current.version,
        formula: current.formula,
        settings: current.settings as never,
        snapshot: {
          fields: current.fields,
          resultTemplate: current.resultTemplate,
        } as never,
        createdBy: actorId ?? null,
      },
    });
    return this.db.calculator.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        version,
        ...(actorId ? { updatedBy: actorId } : {}),
      },
      include: calculatorInclude,
    });
  }

  recordHistory(data: Prisma.CalculationHistoryCreateInput) {
    return this.db.calculationHistory.create({ data });
  }

  recordAnalytics(data: Prisma.CalculatorAnalyticsEventCreateInput) {
    return this.db.calculatorAnalyticsEvent.create({ data });
  }

  async analyticsSummary() {
    const [views, executions, top] = await Promise.all([
      this.db.calculatorAnalyticsEvent.groupBy({
        by: ['calculatorId'],
        where: { eventType: 'view' },
        _count: { _all: true },
      }),
      this.db.calculatorAnalyticsEvent.groupBy({
        by: ['calculatorId'],
        where: { eventType: 'execute' },
        _count: { _all: true },
        _avg: { durationMs: true },
      }),
      this.db.calculatorAnalyticsEvent.groupBy({
        by: ['calculatorId'],
        where: { eventType: 'execute' },
        _count: { _all: true },
        orderBy: { _count: { calculatorId: 'desc' } },
        take: 10,
      }),
    ]);

    const ids = [...new Set([...views, ...executions, ...top].map((r) => r.calculatorId))];
    const calcs = ids.length
      ? await this.db.calculator.findMany({
          where: { id: { in: ids }, deletedAt: null },
          select: { id: true, name: true, slug: true },
        })
      : [];
    const byId = Object.fromEntries(calcs.map((c) => [c.id, c]));

    return {
      totals: {
        views: views.reduce((s, r) => s + r._count._all, 0),
        executions: executions.reduce((s, r) => s + r._count._all, 0),
        avgDurationMs:
          executions.length === 0
            ? null
            : executions.reduce((s, r) => s + (r._avg.durationMs ?? 0), 0) / executions.length,
      },
      byCalculator: ids.map((id) => ({
        calculator: byId[id] ?? { id, name: 'Unknown', slug: id },
        views: views.find((v) => v.calculatorId === id)?._count._all ?? 0,
        executions: executions.find((v) => v.calculatorId === id)?._count._all ?? 0,
        avgDurationMs: executions.find((v) => v.calculatorId === id)?._avg.durationMs ?? null,
      })),
    };
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.calculator, id, actorId);
  }
}

export class SavedCalculationRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findByIdForUser(id: string, userId: string) {
    return this.db.savedCalculation.findFirst({
      where: { id, userId, deletedAt: null },
      include: { calculator: true },
    });
  }

  listByUser(userId: string, params: CursorPageParams = {}) {
    return listActiveWithCursor(this.db.savedCalculation, {
      ...params,
      where: { userId },
      include: { calculator: true },
    });
  }

  create(data: Prisma.SavedCalculationCreateInput) {
    return this.db.savedCalculation.create({ data, include: { calculator: true } });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.savedCalculation, id, actorId);
  }
}
