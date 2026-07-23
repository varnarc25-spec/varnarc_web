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
  featured?: boolean;
  manufacturerId?: string;
  category?: string;
  fuelType?: string;
  bodyType?: string;
};

export class AutomobileManufacturerRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.automobileManufacturer.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { vehicles: true } } },
    });
  }

  findBySlug(slug: string) {
    return this.db.automobileManufacturer.findFirst({
      where: { slug, deletedAt: null },
      include: {
        vehicles: { where: { deletedAt: null, status: 'PUBLISHED' }, take: 24, orderBy: { updatedAt: 'desc' } },
        _count: { select: { vehicles: true } },
      },
    });
  }

  list(params: ListParams = {}) {
    return listActiveWithCursor(this.db.automobileManufacturer, {
      ...params,
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.featured != null ? { featured: params.featured } : {}),
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { slug: { contains: params.search, mode: 'insensitive' } },
                { country: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { _count: { select: { vehicles: true } } },
    });
  }

  create(data: Prisma.AutomobileManufacturerCreateInput) {
    return this.db.automobileManufacturer.create({ data });
  }

  update(id: string, data: Prisma.AutomobileManufacturerUpdateInput) {
    return this.db.automobileManufacturer.update({ where: { id }, data });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.automobileManufacturer, id, actorId);
  }
}

export class AutomobileVehicleRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  private include = {
    manufacturer: true,
    maintenanceSchedules: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' as const } },
    images: { where: { deletedAt: null }, orderBy: { displayOrder: 'asc' as const } },
    reviewLinks: {
      where: { review: { deletedAt: null, status: 'PUBLISHED' } },
      include: {
        review: {
          include: { product: true },
        },
      },
    },
  } satisfies Prisma.AutomobileVehicleInclude;

  findById(id: string) {
    return this.db.automobileVehicle.findFirst({
      where: { id, deletedAt: null },
      include: this.include,
    });
  }

  findBySlug(slug: string) {
    return this.db.automobileVehicle.findFirst({
      where: { slug, deletedAt: null },
      include: this.include,
    });
  }

  findByManufacturerModelVariant(manufacturerId: string, model: string, variant: string, excludeId?: string) {
    return this.db.automobileVehicle.findFirst({
      where: {
        manufacturerId,
        model,
        variant: variant || '',
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  async replaceGallery(
    vehicleId: string,
    images: Array<{
      imageUrl?: string | null;
      mediaId?: string | null;
      altText?: string | null;
      displayOrder?: number;
    }>,
  ) {
    await this.db.automobileVehicleImage.deleteMany({ where: { vehicleId } });
    if (!images.length) return [];
    await this.db.automobileVehicleImage.createMany({
      data: images.map((img, index) => ({
        vehicleId,
        imageUrl: img.imageUrl || null,
        mediaId: img.mediaId || null,
        altText: img.altText || null,
        displayOrder: img.displayOrder ?? index,
        updatedAt: new Date(),
      })),
    });
    return this.db.automobileVehicleImage.findMany({
      where: { vehicleId, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async replaceReviewLinks(vehicleId: string, reviewIds: string[]) {
    await this.db.automobileVehicleReview.deleteMany({ where: { vehicleId } });
    if (!reviewIds.length) return [];
    await this.db.automobileVehicleReview.createMany({
      data: reviewIds.map((reviewId) => ({ vehicleId, reviewId })),
      skipDuplicates: true,
    });
    return this.db.automobileVehicleReview.findMany({
      where: { vehicleId },
      include: { review: { include: { product: true } } },
    });
  }

  list(params: ListParams = {}) {
    return listActiveWithCursor(this.db.automobileVehicle, {
      ...params,
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.manufacturerId ? { manufacturerId: params.manufacturerId } : {}),
        ...(params.category ? { category: params.category } : {}),
        ...(params.fuelType ? { fuelType: params.fuelType } : {}),
        ...(params.bodyType ? { bodyType: params.bodyType } : {}),
        ...(params.featured != null ? { featured: params.featured } : {}),
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { slug: { contains: params.search, mode: 'insensitive' } },
                { model: { contains: params.search, mode: 'insensitive' } },
                { variant: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { manufacturer: true },
    });
  }

  create(data: Prisma.AutomobileVehicleCreateInput) {
    return this.db.automobileVehicle.create({ data, include: this.include });
  }

  update(id: string, data: Prisma.AutomobileVehicleUpdateInput) {
    return this.db.automobileVehicle.update({ where: { id }, data, include: this.include });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.automobileVehicle, id, actorId);
  }

  findManyByIds(ids: string[]) {
    return this.db.automobileVehicle.findMany({
      where: { id: { in: ids }, deletedAt: null, status: 'PUBLISHED' },
      include: { manufacturer: true },
    });
  }
}

export class AutomobileMaintenanceRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  listByVehicle(vehicleId: string) {
    return this.db.automobileMaintenanceSchedule.findMany({
      where: { vehicleId, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { vehicle: { select: { id: true, name: true, slug: true } } },
    });
  }

  listAdmin(params: ListParams = {}) {
    return listActiveWithCursor(this.db.automobileMaintenanceSchedule, {
      ...params,
      where: {
        ...(params.search
          ? {
              OR: [
                { title: { contains: params.search, mode: 'insensitive' } },
                { serviceInterval: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { vehicle: { select: { id: true, name: true, slug: true } } },
    });
  }

  create(data: Prisma.AutomobileMaintenanceScheduleCreateInput) {
    return this.db.automobileMaintenanceSchedule.create({
      data,
      include: { vehicle: { select: { id: true, name: true, slug: true } } },
    });
  }

  update(id: string, data: Prisma.AutomobileMaintenanceScheduleUpdateInput) {
    return this.db.automobileMaintenanceSchedule.update({
      where: { id },
      data,
      include: { vehicle: { select: { id: true, name: true, slug: true } } },
    });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.automobileMaintenanceSchedule, id, actorId);
  }
}
