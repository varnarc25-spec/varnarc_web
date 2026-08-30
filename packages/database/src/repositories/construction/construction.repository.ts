import type { Prisma, PrismaClient, PublishStatus } from '@prisma/client';
import { BaseRepository, listActiveWithCursor, softDeleteById } from '../base.repository';
import type { CursorPageParams } from '../../pagination';

type ListParams = CursorPageParams & {
  status?: PublishStatus;
  search?: string;
  categoryId?: string;
  brandId?: string;
  featured?: boolean;
};

export class ConstructionCategoryRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  list() {
    return this.db.constructionCategory.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  findBySlug(slug: string) {
    return this.db.constructionCategory.findFirst({ where: { slug, deletedAt: null } });
  }

  create(data: Prisma.ConstructionCategoryCreateInput) {
    return this.db.constructionCategory.create({ data });
  }

  update(id: string, data: Prisma.ConstructionCategoryUpdateInput) {
    return this.db.constructionCategory.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return softDeleteById(this.db.constructionCategory, id);
  }
}

export class ConstructionBrandRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.constructionBrand.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { materials: true } } },
    });
  }

  findBySlug(slug: string) {
    return this.db.constructionBrand.findFirst({
      where: { slug, deletedAt: null },
      include: {
        materials: { where: { deletedAt: null, status: 'PUBLISHED' }, take: 24 },
        _count: { select: { materials: true } },
      },
    });
  }

  list(params: ListParams = {}) {
    return listActiveWithCursor(this.db.constructionBrand, {
      ...params,
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.featured != null ? { featured: params.featured } : {}),
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { slug: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { _count: { select: { materials: true } } },
    });
  }

  create(data: Prisma.ConstructionBrandCreateInput) {
    return this.db.constructionBrand.create({ data });
  }

  update(id: string, data: Prisma.ConstructionBrandUpdateInput) {
    return this.db.constructionBrand.update({ where: { id }, data });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.constructionBrand, id, actorId);
  }
}

export class ConstructionMaterialRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  private include = {
    category: true,
    brand: true,
  } satisfies Prisma.ConstructionMaterialInclude;

  findById(id: string) {
    return this.db.constructionMaterial.findFirst({
      where: { id, deletedAt: null },
      include: this.include,
    });
  }

  findBySlug(slug: string) {
    return this.db.constructionMaterial.findFirst({
      where: { slug, deletedAt: null },
      include: this.include,
    });
  }

  list(params: ListParams = {}) {
    return listActiveWithCursor(this.db.constructionMaterial, {
      ...params,
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.categoryId ? { categoryId: params.categoryId } : {}),
        ...(params.brandId ? { brandId: params.brandId } : {}),
        ...(params.featured != null ? { featured: params.featured } : {}),
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { slug: { contains: params.search, mode: 'insensitive' } },
                { unit: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: this.include,
    });
  }

  create(data: Prisma.ConstructionMaterialCreateInput) {
    return this.db.constructionMaterial.create({ data, include: this.include });
  }

  update(id: string, data: Prisma.ConstructionMaterialUpdateInput) {
    return this.db.constructionMaterial.update({ where: { id }, data, include: this.include });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.constructionMaterial, id, actorId);
  }

  findManyByIds(ids: string[]) {
    return this.db.constructionMaterial.findMany({
      where: { id: { in: ids }, deletedAt: null, status: 'PUBLISHED' },
      include: this.include,
    });
  }
}

export class CostTemplateRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.costTemplate.findFirst({
      where: { id, deletedAt: null },
      include: { constructionCategory: true },
    });
  }

  findBySlug(slug: string) {
    return this.db.costTemplate.findFirst({ where: { slug, deletedAt: null } });
  }

  list(params: ListParams = {}) {
    return listActiveWithCursor(this.db.costTemplate, {
      ...params,
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { slug: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { constructionCategory: true },
    });
  }

  create(data: Prisma.CostTemplateCreateInput) {
    return this.db.costTemplate.create({ data });
  }

  update(id: string, data: Prisma.CostTemplateUpdateInput) {
    return this.db.costTemplate.update({ where: { id }, data });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.costTemplate, id, actorId);
  }
}

export class ConstructionProjectRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string, userId?: string) {
    return this.db.constructionProject.findFirst({
      where: { id, deletedAt: null, ...(userId ? { userId } : {}) },
      include: {
        items: { include: { material: true } },
        location: true,
        phases: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
        boqs: { where: { deletedAt: null }, orderBy: { updatedAt: 'desc' }, take: 10 },
        budgetItems: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' }, take: 50 },
        expenses: { where: { deletedAt: null }, orderBy: { spentOn: 'desc' }, take: 50 },
        documents: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 50 },
        calculations: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            calculatorSlug: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            calculations: { where: { deletedAt: null } },
            boqs: { where: { deletedAt: null } },
            phases: { where: { deletedAt: null } },
            budgetItems: { where: { deletedAt: null } },
            expenses: { where: { deletedAt: null } },
            documents: { where: { deletedAt: null } },
            items: true,
          },
        },
      },
    });
  }

  listForUser(userId: string) {
    return this.db.constructionProject.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  listAdmin(params: ListParams = {}) {
    return listActiveWithCursor(this.db.constructionProject, {
      ...params,
      where: {
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { projectType: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { items: true },
    });
  }

  create(data: Prisma.ConstructionProjectCreateInput) {
    return this.db.constructionProject.create({
      data,
      include: { items: true },
    });
  }

  update(id: string, data: Prisma.ConstructionProjectUpdateInput) {
    return this.db.constructionProject.update({
      where: { id },
      data,
      include: { items: true },
    });
  }

  softDelete(id: string) {
    return softDeleteById(this.db.constructionProject, id);
  }
}

export class ConstructionChecklistRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  listPublished() {
    return this.db.constructionChecklist.findMany({
      where: { deletedAt: null, status: 'PUBLISHED' },
      orderBy: [{ projectType: 'asc' }, { title: 'asc' }],
    });
  }

  findBySlug(slug: string) {
    return this.db.constructionChecklist.findFirst({
      where: { slug, deletedAt: null, status: 'PUBLISHED' },
    });
  }
}

export class ConstructionComparisonRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  list() {
    return this.db.constructionComparison.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: Prisma.ConstructionComparisonCreateInput) {
    return this.db.constructionComparison.create({ data });
  }
}

export class ConstructionLocationRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findBySlug(slug: string) {
    return this.db.constructionLocation.findFirst({
      where: { slug, deletedAt: null },
      include: { parent: true, children: { where: { deletedAt: null } } },
    });
  }

  findById(id: string) {
    return this.db.constructionLocation.findFirst({
      where: { id, deletedAt: null },
    });
  }

  listByType(type: Prisma.EnumConstructionLocationTypeFilter['equals']) {
    return this.db.constructionLocation.findMany({
      where: { deletedAt: null, type },
      orderBy: { name: 'asc' },
    });
  }

  listCities(slugs?: string[]) {
    return this.db.constructionLocation.findMany({
      where: {
        deletedAt: null,
        type: 'CITY',
        ...(slugs?.length ? { slug: { in: slugs } } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  create(data: Prisma.ConstructionLocationCreateInput) {
    return this.db.constructionLocation.create({ data });
  }
}

export class ConstructionMaterialPriceRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  listForMaterial(materialId: string, locationId?: string) {
    return this.db.constructionMaterialPrice.findMany({
      where: {
        materialId,
        deletedAt: null,
        ...(locationId ? { locationId } : {}),
      },
      orderBy: { effectiveFrom: 'desc' },
      take: 50,
    });
  }

  listFiltered(input?: {
    materialId?: string;
    locationId?: string;
    materialSlugs?: string[];
    locationSlugs?: string[];
    take?: number;
  }) {
    return this.db.constructionMaterialPrice.findMany({
      where: {
        deletedAt: null,
        ...(input?.materialId ? { materialId: input.materialId } : {}),
        ...(input?.locationId ? { locationId: input.locationId } : {}),
        ...(input?.materialSlugs?.length
          ? { material: { slug: { in: input.materialSlugs }, deletedAt: null } }
          : {}),
        ...(input?.locationSlugs?.length
          ? { location: { slug: { in: input.locationSlugs }, deletedAt: null } }
          : {}),
      },
      include: {
        material: { select: { id: true, name: true, slug: true, unit: true } },
        location: { select: { id: true, name: true, slug: true, type: true } },
        brand: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { effectiveFrom: 'desc' },
      take: input?.take ?? 200,
    });
  }

  create(data: Prisma.ConstructionMaterialPriceCreateInput) {
    return this.db.constructionMaterialPrice.create({ data });
  }
}

export class ConstructionCostRateRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  listActive(workType?: string, locationId?: string) {
    const now = new Date();
    return this.db.constructionCostRate.findMany({
      where: {
        deletedAt: null,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
        ...(workType ? { workType } : {}),
        ...(locationId ? { locationId } : {}),
      },
      orderBy: [{ workType: 'asc' }, { effectiveFrom: 'desc' }],
    });
  }

  create(data: Prisma.ConstructionCostRateCreateInput) {
    return this.db.constructionCostRate.create({ data });
  }
}

export class ConstructionCalculationRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  listForUser(userId: string, projectId?: string) {
    return this.db.constructionCalculation.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        project: { select: { id: true, name: true } },
      },
    });
  }

  findByIdForUser(id: string, userId: string) {
    return this.db.constructionCalculation.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        project: { select: { id: true, name: true } },
      },
    });
  }

  create(data: Prisma.ConstructionCalculationUncheckedCreateInput) {
    return this.db.constructionCalculation.create({
      data,
      include: {
        project: { select: { id: true, name: true } },
      },
    });
  }

  updateForUser(id: string, userId: string, data: Prisma.ConstructionCalculationUpdateInput) {
    return this.db.constructionCalculation.updateMany({
      where: { id, userId, deletedAt: null },
      data,
    });
  }

  async renameForUser(id: string, userId: string, name: string) {
    await this.updateForUser(id, userId, { name });
    return this.findByIdForUser(id, userId);
  }

  async attachProjectForUser(id: string, userId: string, projectId: string | null) {
    await this.db.constructionCalculation.updateMany({
      where: { id, userId, deletedAt: null },
      data: { projectId },
    });
    return this.findByIdForUser(id, userId);
  }

  softDeleteForUser(id: string, userId: string) {
    return this.db.constructionCalculation.updateMany({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  softDelete(id: string) {
    return softDeleteById(this.db.constructionCalculation, id);
  }
}

export class ConstructionBoqRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.constructionBoq.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          include: { material: true, phase: true },
        },
      },
    });
  }

  listForProject(projectId: string) {
    return this.db.constructionBoq.findMany({
      where: { projectId, deletedAt: null },
      orderBy: [{ name: 'asc' }, { version: 'desc' }],
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { items: true } },
      },
    });
  }

  create(data: Prisma.ConstructionBoqCreateInput) {
    return this.db.constructionBoq.create({ data, include: { items: true } });
  }

  async nextVersion(projectId: string, name: string) {
    const latest = await this.db.constructionBoq.findFirst({
      where: { projectId, name, deletedAt: null },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    return (latest?.version ?? 0) + 1;
  }

  softDelete(id: string) {
    return softDeleteById(this.db.constructionBoq, id);
  }
}

export class ConstructionProjectPhaseRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  listForProject(projectId: string) {
    return this.db.constructionProjectPhase.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  create(data: Prisma.ConstructionProjectPhaseCreateInput) {
    return this.db.constructionProjectPhase.create({ data });
  }

  softDelete(id: string) {
    return softDeleteById(this.db.constructionProjectPhase, id);
  }

  async softDeleteAllForProject(projectId: string) {
    return this.db.constructionProjectPhase.updateMany({
      where: { projectId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async replaceForProject(
    projectId: string,
    phases: Array<{
      name: string;
      slug?: string | null;
      sortOrder: number;
      status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
      plannedStart?: Date | null;
      plannedEnd?: Date | null;
      notes?: string | null;
    }>,
  ) {
    await this.softDeleteAllForProject(projectId);
    if (!phases.length) return [];
    await this.db.constructionProjectPhase.createMany({
      data: phases.map((p) => ({
        projectId,
        name: p.name,
        slug: p.slug ?? null,
        sortOrder: p.sortOrder,
        status: p.status,
        plannedStart: p.plannedStart ?? null,
        plannedEnd: p.plannedEnd ?? null,
        notes: p.notes ?? null,
      })),
    });
    return this.listForProject(projectId);
  }
}

export class ConstructionBudgetItemRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  listForProject(projectId: string) {
    return this.db.constructionBudgetItem.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  findById(id: string) {
    return this.db.constructionBudgetItem.findFirst({
      where: { id, deletedAt: null },
    });
  }

  create(data: Prisma.ConstructionBudgetItemCreateInput) {
    return this.db.constructionBudgetItem.create({ data });
  }

  softDelete(id: string) {
    return softDeleteById(this.db.constructionBudgetItem, id);
  }
}

export class ConstructionExpenseRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  listForProject(projectId: string) {
    return this.db.constructionExpense.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { spentOn: 'desc' },
    });
  }

  findById(id: string) {
    return this.db.constructionExpense.findFirst({
      where: { id, deletedAt: null },
    });
  }

  create(data: Prisma.ConstructionExpenseCreateInput) {
    return this.db.constructionExpense.create({ data });
  }

  softDelete(id: string) {
    return softDeleteById(this.db.constructionExpense, id);
  }
}

export class ConstructionPriceAlertRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  listForUser(userId: string, status?: string) {
    return this.db.constructionPriceAlert.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(status ? { status: status as never } : {}),
      },
      include: {
        material: { select: { id: true, name: true, slug: true, unit: true } },
        location: { select: { id: true, name: true, slug: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  countForUser(userId: string) {
    return this.db.constructionPriceAlert.count({
      where: { userId, deletedAt: null, status: { not: 'CANCELLED' } },
    });
  }

  findByIdForUser(id: string, userId: string) {
    return this.db.constructionPriceAlert.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        material: { select: { id: true, name: true, slug: true, unit: true } },
        location: { select: { id: true, name: true, slug: true, type: true } },
      },
    });
  }

  listActive(take = 200) {
    return this.db.constructionPriceAlert.findMany({
      where: { deletedAt: null, status: 'ACTIVE' },
      include: {
        material: { select: { id: true, name: true, slug: true, unit: true } },
        location: { select: { id: true, name: true, slug: true, type: true } },
      },
      orderBy: { updatedAt: 'asc' },
      take,
    });
  }

  create(data: Prisma.ConstructionPriceAlertUncheckedCreateInput) {
    return this.db.constructionPriceAlert.create({
      data,
      include: {
        material: { select: { id: true, name: true, slug: true, unit: true } },
        location: { select: { id: true, name: true, slug: true, type: true } },
      },
    });
  }

  update(id: string, data: Prisma.ConstructionPriceAlertUncheckedUpdateInput) {
    return this.db.constructionPriceAlert.update({
      where: { id },
      data,
      include: {
        material: { select: { id: true, name: true, slug: true, unit: true } },
        location: { select: { id: true, name: true, slug: true, type: true } },
      },
    });
  }

  softDelete(id: string) {
    return this.db.constructionPriceAlert.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CANCELLED' },
    });
  }
}

export class ConstructionPriceAlertTriggerRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  listForAlert(alertId: string, take = 50) {
    return this.db.constructionPriceAlertTrigger.findMany({
      where: { alertId },
      orderBy: { triggeredAt: 'desc' },
      take,
    });
  }

  listForUser(userId: string, take = 100) {
    return this.db.constructionPriceAlertTrigger.findMany({
      where: { alert: { userId, deletedAt: null } },
      include: {
        alert: {
          select: {
            id: true,
            name: true,
            direction: true,
            material: { select: { id: true, name: true, slug: true } },
            location: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { triggeredAt: 'desc' },
      take,
    });
  }

  create(data: Prisma.ConstructionPriceAlertTriggerUncheckedCreateInput) {
    return this.db.constructionPriceAlertTrigger.create({ data });
  }
}

export class ConstructionSavedComparisonRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  listForUser(userId: string) {
    return this.db.constructionSavedComparison.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: Prisma.ConstructionSavedComparisonCreateInput) {
    return this.db.constructionSavedComparison.create({ data });
  }
}

export class ConstructionDocumentRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  listForProject(projectId: string, filters?: { kind?: string }) {
    return this.db.constructionDocument.findMany({
      where: {
        projectId,
        deletedAt: null,
        ...(filters?.kind ? { kind: filters.kind as never } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.db.constructionDocument.findFirst({
      where: { id, deletedAt: null },
    });
  }

  create(data: Prisma.ConstructionDocumentUncheckedCreateInput) {
    return this.db.constructionDocument.create({ data });
  }

  softDelete(id: string) {
    return softDeleteById(this.db.constructionDocument, id);
  }
}

export class ConstructionVcciMethodologyRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findActive() {
    return this.db.constructionVcciMethodology.findFirst({
      where: { deletedAt: null, isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findByVersion(version: string) {
    return this.db.constructionVcciMethodology.findFirst({
      where: { version, deletedAt: null },
    });
  }
}

export class ConstructionVcciSnapshotRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  listPublished(input?: {
    scope?: string;
    locationSlug?: string;
    componentKey?: string;
    take?: number;
  }) {
    return this.db.constructionVcciSnapshot.findMany({
      where: {
        deletedAt: null,
        status: 'PUBLISHED',
        qualityPassed: true,
        ...(input?.scope ? { scope: input.scope } : {}),
        ...(input?.componentKey ? { componentKey: input.componentKey } : {}),
        ...(input?.locationSlug ? { location: { slug: input.locationSlug, deletedAt: null } } : {}),
      },
      include: {
        location: { select: { id: true, name: true, slug: true, type: true } },
        methodology: {
          select: {
            id: true,
            version: true,
            label: true,
            baselineLabel: true,
            baselineStart: true,
            baselineEnd: true,
            baselineIndex: true,
            weights: true,
          },
        },
      },
      orderBy: { calculationDate: 'desc' },
      take: input?.take ?? 120,
    });
  }

  latestPublished(input?: { scope?: string; locationSlug?: string; componentKey?: string }) {
    return this.db.constructionVcciSnapshot.findFirst({
      where: {
        deletedAt: null,
        status: 'PUBLISHED',
        qualityPassed: true,
        ...(input?.scope ? { scope: input.scope } : {}),
        ...(input?.componentKey ? { componentKey: input.componentKey } : {}),
        ...(input?.locationSlug ? { location: { slug: input.locationSlug, deletedAt: null } } : {}),
      },
      include: {
        location: { select: { id: true, name: true, slug: true, type: true } },
        methodology: {
          select: {
            id: true,
            version: true,
            label: true,
            baselineLabel: true,
            baselineStart: true,
            baselineEnd: true,
            baselineIndex: true,
            weights: true,
          },
        },
      },
      orderBy: { calculationDate: 'desc' },
    });
  }
}

export class ConstructionCommunityPriceReportRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  private include = {
    material: { select: { id: true, name: true, slug: true, unit: true } },
    location: { select: { id: true, name: true, slug: true, type: true } },
    brand: { select: { id: true, name: true, slug: true } },
  } as const;

  listForUser(userId: string, status?: string) {
    return this.db.constructionCommunityPriceReport.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(status ? { status: status as never } : {}),
      },
      include: this.include,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  countSubmittedSince(userId: string, since: Date) {
    return this.db.constructionCommunityPriceReport.count({
      where: { userId, deletedAt: null, createdAt: { gte: since } },
    });
  }

  countPendingForUser(userId: string) {
    return this.db.constructionCommunityPriceReport.count({
      where: { userId, deletedAt: null, status: 'PENDING' },
    });
  }

  countVerifiedForUser(userId: string) {
    return this.db.constructionCommunityPriceReport.count({
      where: { userId, deletedAt: null, status: 'VERIFIED' },
    });
  }

  findById(id: string) {
    return this.db.constructionCommunityPriceReport.findFirst({
      where: { id, deletedAt: null },
      include: this.include,
    });
  }

  findByIdForUser(id: string, userId: string) {
    return this.db.constructionCommunityPriceReport.findFirst({
      where: { id, userId, deletedAt: null },
      include: this.include,
    });
  }

  findRecentDuplicates(input: {
    userId: string;
    materialId: string;
    locationId: string;
    unit: string;
    price: number;
    since: Date;
    priceTolerance: number;
  }) {
    const low = input.price - input.priceTolerance;
    const high = input.price + input.priceTolerance;
    return this.db.constructionCommunityPriceReport.findMany({
      where: {
        userId: input.userId,
        materialId: input.materialId,
        locationId: input.locationId,
        unit: input.unit,
        deletedAt: null,
        status: { not: 'REJECTED' },
        createdAt: { gte: input.since },
        price: { gte: low, lte: high },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }

  listEligibleForAggregate(input: {
    materialId: string;
    locationId: string;
    unit: string;
    since: Date;
    minTrust: number;
  }) {
    return this.db.constructionCommunityPriceReport.findMany({
      where: {
        materialId: input.materialId,
        locationId: input.locationId,
        unit: input.unit,
        deletedAt: null,
        status: 'VERIFIED',
        isOutlier: false,
        trustScore: { gte: input.minTrust },
        purchaseDate: { gte: input.since },
      },
      orderBy: { purchaseDate: 'desc' },
      take: 500,
    });
  }

  listForModeration(status?: string, take = 100) {
    return this.db.constructionCommunityPriceReport.findMany({
      where: {
        deletedAt: null,
        ...(status ? { status: status as never } : { status: { in: ['PENDING', 'FLAGGED'] } }),
      },
      include: this.include,
      orderBy: { createdAt: 'asc' },
      take,
    });
  }

  create(data: Prisma.ConstructionCommunityPriceReportUncheckedCreateInput) {
    return this.db.constructionCommunityPriceReport.create({
      data,
      include: this.include,
    });
  }

  update(id: string, data: Prisma.ConstructionCommunityPriceReportUncheckedUpdateInput) {
    return this.db.constructionCommunityPriceReport.update({
      where: { id },
      data,
      include: this.include,
    });
  }

  softDelete(id: string) {
    return this.db.constructionCommunityPriceReport.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
