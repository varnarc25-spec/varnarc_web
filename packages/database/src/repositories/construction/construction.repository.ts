import type { Prisma, PrismaClient, PublishStatus } from '@prisma/client';
import {
  BaseRepository,
  listActiveWithCursor,
  softDeleteById,
} from '../base.repository';
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
      include: { items: { include: { material: true } } },
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
