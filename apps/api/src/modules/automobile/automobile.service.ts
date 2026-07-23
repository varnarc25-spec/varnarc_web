import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { PrismaClient, Repositories } from '@varnarc/database';
import type {
  AutomobileAffiliateClickInput,
  AutomobileAffiliateLeadInput,
  AutomobileCompareQuery,
  AutomobileListQuery,
  CreateAutomobileComparisonInput,
  CreateAutomobileMaintenanceInput,
  CreateAutomobileManufacturerInput,
  CreateAutomobileVehicleInput,
  UpdateAutomobileMaintenanceInput,
  UpdateAutomobileManufacturerInput,
  UpdateAutomobileVehicleInput,
} from '@varnarc/validation';
import { PRISMA, REPOS } from '../../database/database.module';

const CACHE_TTL = 60_000;

const DEALER_CATEGORY_SLUGS = [
  'car-dealers',
  'showrooms',
  'service-centers',
  'charging-stations',
  'spare-parts',
] as const;

function slugifyTitle(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'item'
  );
}

@Injectable()
export class AutomobileService {
  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    @Inject(PRISMA) private readonly db: PrismaClient,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private notFound(message = 'Automobile resource not found.') {
    return new NotFoundException({ success: false, error: { code: 'NOT_FOUND', message } });
  }

  private emptyUrl(v?: string | null) {
    return v === '' ? null : v;
  }

  private normalizeVariant(v?: string | null) {
    return (v ?? '').trim();
  }

  private async mediaUrl(mediaId?: string | null) {
    if (!mediaId) return null;
    const asset = await this.db.mediaAsset.findFirst({
      where: { id: mediaId, deletedAt: null },
      select: { secureUrl: true, url: true },
    });
    return asset?.secureUrl || asset?.url || null;
  }

  private async enrichVehicle(row: Record<string, unknown>) {
    const brochureMediaId = row.brochureMediaId as string | null | undefined;
    if (brochureMediaId && !row.brochureUrl) {
      const url = await this.mediaUrl(brochureMediaId);
      if (url) row.brochureUrl = url;
    }
    const images = row.images as Array<{ mediaId?: string | null; imageUrl?: string | null }> | undefined;
    if (images?.length) {
      for (const img of images) {
        if (img.mediaId && !img.imageUrl) {
          const url = await this.mediaUrl(img.mediaId);
          if (url) img.imageUrl = url;
        }
      }
    }
    const manufacturer = row.manufacturer as { logoMediaId?: string | null; logoUrl?: string | null } | null | undefined;
    if (manufacturer?.logoMediaId && !manufacturer.logoUrl) {
      const url = await this.mediaUrl(manufacturer.logoMediaId);
      if (url) manufacturer.logoUrl = url;
    }
    return row;
  }

  private async assertVehicleIdentityUnique(
    manufacturerId: string,
    model: string,
    variant: string,
    excludeId?: string,
  ) {
    const clash = await this.repos.automobileVehicles.findByManufacturerModelVariant(
      manufacturerId,
      model,
      variant,
      excludeId,
    );
    if (clash) {
      throw new ConflictException({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'A vehicle with this manufacturer, model, and variant already exists.',
        },
      });
    }
  }

  private async applyVehicleExtras(
    vehicleId: string,
    input: { galleryImages?: CreateAutomobileVehicleInput['galleryImages']; reviewIds?: string[] },
  ) {
    if (input.galleryImages) {
      await this.repos.automobileVehicles.replaceGallery(
        vehicleId,
        input.galleryImages.map((img) => ({
          imageUrl: this.emptyUrl(img.imageUrl),
          mediaId: img.mediaId,
          altText: img.altText,
          displayOrder: img.displayOrder,
        })),
      );
    }
    if (input.reviewIds) {
      await this.repos.automobileVehicles.replaceReviewLinks(vehicleId, input.reviewIds);
    }
  }

  private async audit(actorId: string, action: string, entity: string, entityId: string, newValue?: object) {
    await this.repos.auditLogs.create({
      userId: actorId,
      action,
      entity,
      entityId,
      newValue: newValue as never,
    });
  }

  private async bust() {
    await Promise.all([
      this.cache.del('automobile:dashboard'),
      this.cache.del('automobile:manufacturers:published'),
    ]);
  }

  async dashboard() {
    const cached = await this.cache.get('automobile:dashboard');
    if (cached) return cached;
    const [manufacturers, vehicles, maintenance, faqs, guides, comparisons] = await Promise.all([
      this.db.automobileManufacturer.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.db.automobileVehicle.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.db.automobileMaintenanceSchedule.count({ where: { deletedAt: null } }),
      this.db.automobileFaq.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.db.automobileGuide.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.db.automobileComparison.count({ where: { deletedAt: null } }),
    ]);
    const data = {
      manufacturersPublished: manufacturers,
      vehiclesPublished: vehicles,
      maintenanceSchedules: maintenance,
      faqs,
      guides,
      comparisons,
      relatedCalculators: [
        { slug: 'car-loan', name: 'Car Loan Calculator' },
        { slug: 'fuel', name: 'Fuel Cost Calculator' },
        { slug: 'mileage', name: 'Mileage Calculator' },
        { slug: 'car-insurance', name: 'Car Insurance Estimator' },
        { slug: 'depreciation', name: 'Depreciation Calculator' },
        { slug: 'maintenance-cost', name: 'Maintenance Cost Estimator' },
      ],
      dealerDirectory: { href: '/directory?vertical=automobile', label: 'Find dealers & service centers' },
    };
    await this.cache.set('automobile:dashboard', data, CACHE_TTL);
    return data;
  }

  listManufacturers(query: AutomobileListQuery) {
    return this.repos.automobileManufacturers.list(query);
  }

  async getManufacturer(id: string) {
    const row = await this.repos.automobileManufacturers.findById(id);
    if (!row) throw this.notFound('Manufacturer not found.');
    return row;
  }

  async getManufacturerBySlug(slug: string) {
    const row = await this.repos.automobileManufacturers.findBySlug(slug);
    if (!row || row.status !== 'PUBLISHED') throw this.notFound('Manufacturer not found.');
    return row;
  }

  async createManufacturer(input: CreateAutomobileManufacturerInput, actorId: string) {
    const clash = await this.repos.automobileManufacturers.findBySlug(input.slug);
    if (clash) throw new ConflictException({ success: false, error: { code: 'CONFLICT', message: 'Slug exists.' } });
    const row = await this.repos.automobileManufacturers.create({
      name: input.name,
      slug: input.slug,
      logoUrl: this.emptyUrl(input.logoUrl) ?? (await this.mediaUrl(input.logoMediaId)),
      logoMediaId: input.logoMediaId,
      country: input.country,
      foundedYear: input.foundedYear,
      website: this.emptyUrl(input.website),
      description: input.description,
      featured: input.featured ?? false,
      status: input.status ?? 'DRAFT',
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await this.audit(actorId, 'automobile.manufacturer.create', 'automobile_manufacturer', row.id, row);
    await this.bust();
    return row;
  }

  async updateManufacturer(id: string, input: UpdateAutomobileManufacturerInput, actorId: string) {
    const existing = await this.repos.automobileManufacturers.findById(id);
    if (!existing) throw this.notFound('Manufacturer not found.');
    const row = await this.repos.automobileManufacturers.update(id, {
      ...(input.name != null ? { name: input.name } : {}),
      ...(input.slug != null ? { slug: input.slug } : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: this.emptyUrl(input.logoUrl) } : {}),
      ...(input.logoMediaId !== undefined
        ? {
            logoMediaId: input.logoMediaId,
            ...(input.logoUrl === undefined
              ? { logoUrl: (await this.mediaUrl(input.logoMediaId)) ?? undefined }
              : {}),
          }
        : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.foundedYear !== undefined ? { foundedYear: input.foundedYear } : {}),
      ...(input.website !== undefined ? { website: this.emptyUrl(input.website) } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.featured != null ? { featured: input.featured } : {}),
      ...(input.status != null ? { status: input.status } : {}),
      ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
      ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
      updatedBy: actorId,
    });
    await this.audit(actorId, 'automobile.manufacturer.update', 'automobile_manufacturer', id, row);
    await this.bust();
    return row;
  }

  async publishManufacturer(id: string, actorId: string) {
    return this.updateManufacturer(id, { status: 'PUBLISHED' }, actorId);
  }

  listVehicles(query: AutomobileListQuery) {
    return this.repos.automobileVehicles.list(query);
  }

  async getVehicle(id: string) {
    const row = await this.repos.automobileVehicles.findById(id);
    if (!row) throw this.notFound('Vehicle not found.');
    return this.enrichVehicle(row as unknown as Record<string, unknown>);
  }

  async getVehicleBySlug(slug: string) {
    const row = await this.repos.automobileVehicles.findBySlug(slug);
    if (!row || row.status !== 'PUBLISHED') throw this.notFound('Vehicle not found.');
    return this.enrichVehicle(row as unknown as Record<string, unknown>);
  }

  async createVehicle(input: CreateAutomobileVehicleInput, actorId: string) {
    const clash = await this.repos.automobileVehicles.findBySlug(input.slug);
    if (clash) throw new ConflictException({ success: false, error: { code: 'CONFLICT', message: 'Slug exists.' } });
    const mfr = await this.repos.automobileManufacturers.findById(input.manufacturerId);
    if (!mfr) throw this.notFound('Manufacturer not found.');
    const variant = this.normalizeVariant(input.variant);
    await this.assertVehicleIdentityUnique(input.manufacturerId, input.model, variant);
    const row = await this.repos.automobileVehicles.create({
      manufacturer: { connect: { id: input.manufacturerId } },
      name: input.name,
      slug: input.slug,
      model: input.model,
      variant,
      modelYear: input.modelYear,
      category: input.category,
      bodyType: input.bodyType,
      fuelType: input.fuelType,
      transmission: input.transmission,
      engineCapacity: input.engineCapacity,
      horsepower: input.horsepower,
      torque: input.torque,
      mileage: input.mileage,
      seatingCapacity: input.seatingCapacity,
      groundClearance: input.groundClearance,
      bootSpace: input.bootSpace,
      safetyRating: input.safetyRating,
      exShowroomPrice: input.exShowroomPrice,
      estimatedOnRoadPrice: input.estimatedOnRoadPrice,
      warranty: input.warranty,
      description: input.description,
      specifications: input.specifications as never,
      pros: input.pros as never,
      cons: input.cons as never,
      imageUrl: this.emptyUrl(input.imageUrl),
      brochureUrl: this.emptyUrl(input.brochureUrl),
      brochureMediaId: input.brochureMediaId,
      videoUrl: this.emptyUrl(input.videoUrl),
      affiliateUrl: this.emptyUrl(input.affiliateUrl),
      expertRating: input.expertRating,
      featured: input.featured ?? false,
      sponsored: input.sponsored ?? false,
      status: input.status ?? 'DRAFT',
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await this.applyVehicleExtras(row.id, input);
    const full = await this.repos.automobileVehicles.findById(row.id);
    await this.audit(actorId, 'automobile.vehicle.create', 'automobile_vehicle', row.id, full ?? row);
    await this.bust();
    return full ?? row;
  }

  async updateVehicle(id: string, input: UpdateAutomobileVehicleInput, actorId: string) {
    const existing = await this.repos.automobileVehicles.findById(id);
    if (!existing) throw this.notFound('Vehicle not found.');
    const manufacturerId = input.manufacturerId ?? existing.manufacturerId;
    const model = input.model ?? existing.model;
    const variant =
      input.variant !== undefined ? this.normalizeVariant(input.variant) : existing.variant;
    if (
      manufacturerId !== existing.manufacturerId ||
      model !== existing.model ||
      variant !== existing.variant
    ) {
      await this.assertVehicleIdentityUnique(manufacturerId, model, variant, id);
    }
    if (input.slug && input.slug !== existing.slug) {
      const clash = await this.repos.automobileVehicles.findBySlug(input.slug);
      if (clash) {
        throw new ConflictException({ success: false, error: { code: 'CONFLICT', message: 'Slug exists.' } });
      }
    }
    await this.repos.automobileVehicles.update(id, {
      ...(input.manufacturerId ? { manufacturer: { connect: { id: input.manufacturerId } } } : {}),
      ...(input.name != null ? { name: input.name } : {}),
      ...(input.slug != null ? { slug: input.slug } : {}),
      ...(input.model != null ? { model: input.model } : {}),
      ...(input.variant !== undefined ? { variant } : {}),
      ...(input.modelYear !== undefined ? { modelYear: input.modelYear } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.bodyType !== undefined ? { bodyType: input.bodyType } : {}),
      ...(input.fuelType !== undefined ? { fuelType: input.fuelType } : {}),
      ...(input.transmission !== undefined ? { transmission: input.transmission } : {}),
      ...(input.engineCapacity !== undefined ? { engineCapacity: input.engineCapacity } : {}),
      ...(input.horsepower !== undefined ? { horsepower: input.horsepower } : {}),
      ...(input.torque !== undefined ? { torque: input.torque } : {}),
      ...(input.mileage !== undefined ? { mileage: input.mileage } : {}),
      ...(input.seatingCapacity !== undefined ? { seatingCapacity: input.seatingCapacity } : {}),
      ...(input.groundClearance !== undefined ? { groundClearance: input.groundClearance } : {}),
      ...(input.bootSpace !== undefined ? { bootSpace: input.bootSpace } : {}),
      ...(input.safetyRating !== undefined ? { safetyRating: input.safetyRating } : {}),
      ...(input.exShowroomPrice !== undefined ? { exShowroomPrice: input.exShowroomPrice } : {}),
      ...(input.estimatedOnRoadPrice !== undefined ? { estimatedOnRoadPrice: input.estimatedOnRoadPrice } : {}),
      ...(input.warranty !== undefined ? { warranty: input.warranty } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.specifications !== undefined ? { specifications: input.specifications as never } : {}),
      ...(input.pros !== undefined ? { pros: input.pros as never } : {}),
      ...(input.cons !== undefined ? { cons: input.cons as never } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: this.emptyUrl(input.imageUrl) } : {}),
      ...(input.brochureUrl !== undefined ? { brochureUrl: this.emptyUrl(input.brochureUrl) } : {}),
      ...(input.brochureMediaId !== undefined ? { brochureMediaId: input.brochureMediaId } : {}),
      ...(input.videoUrl !== undefined ? { videoUrl: this.emptyUrl(input.videoUrl) } : {}),
      ...(input.affiliateUrl !== undefined ? { affiliateUrl: this.emptyUrl(input.affiliateUrl) } : {}),
      ...(input.expertRating !== undefined ? { expertRating: input.expertRating } : {}),
      ...(input.featured != null ? { featured: input.featured } : {}),
      ...(input.sponsored != null ? { sponsored: input.sponsored } : {}),
      ...(input.status != null
        ? {
            status: input.status,
            publishedAt: input.status === 'PUBLISHED' ? existing.publishedAt ?? new Date() : existing.publishedAt,
          }
        : {}),
      ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
      ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
      updatedBy: actorId,
    });
    await this.applyVehicleExtras(id, input);
    const full = await this.repos.automobileVehicles.findById(id);
    await this.audit(actorId, 'automobile.vehicle.update', 'automobile_vehicle', id, full ?? undefined);
    await this.bust();
    return full;
  }

  async publishVehicle(id: string, actorId: string) {
    return this.updateVehicle(id, { status: 'PUBLISHED' }, actorId);
  }

  async deleteVehicle(id: string, actorId: string) {
    const ok = await this.repos.automobileVehicles.softDelete(id, actorId);
    if (!ok) throw this.notFound('Vehicle not found.');
    await this.audit(actorId, 'automobile.vehicle.delete', 'automobile_vehicle', id);
    await this.bust();
    return { id, deleted: true };
  }

  async duplicateVehicle(id: string, actorId: string) {
    const existing = await this.repos.automobileVehicles.findById(id);
    if (!existing) throw this.notFound('Vehicle not found.');
    const baseSlug = `${existing.slug}-copy`;
    let slug = baseSlug;
    let n = 1;
    while (await this.repos.automobileVehicles.findBySlug(slug)) {
      n += 1;
      slug = `${baseSlug}-${n}`;
    }
    let variant = `${existing.variant || 'base'}-copy`;
    let variantN = 1;
    while (
      await this.repos.automobileVehicles.findByManufacturerModelVariant(
        existing.manufacturerId,
        existing.model,
        variant,
      )
    ) {
      variantN += 1;
      variant = `${existing.variant || 'base'}-copy-${variantN}`;
    }
    const row = await this.repos.automobileVehicles.create({
      manufacturer: { connect: { id: existing.manufacturerId } },
      name: `${existing.name} (copy)`,
      slug,
      model: existing.model,
      variant,
      modelYear: existing.modelYear,
      category: existing.category,
      bodyType: existing.bodyType,
      fuelType: existing.fuelType,
      transmission: existing.transmission,
      engineCapacity: existing.engineCapacity,
      horsepower: existing.horsepower,
      torque: existing.torque,
      mileage: existing.mileage,
      seatingCapacity: existing.seatingCapacity,
      groundClearance: existing.groundClearance,
      bootSpace: existing.bootSpace,
      safetyRating: existing.safetyRating,
      exShowroomPrice: existing.exShowroomPrice,
      estimatedOnRoadPrice: existing.estimatedOnRoadPrice,
      warranty: existing.warranty,
      description: existing.description,
      specifications: existing.specifications as never,
      pros: existing.pros as never,
      cons: existing.cons as never,
      imageUrl: existing.imageUrl,
      brochureUrl: existing.brochureUrl,
      brochureMediaId: existing.brochureMediaId,
      videoUrl: existing.videoUrl,
      affiliateUrl: existing.affiliateUrl,
      expertRating: existing.expertRating,
      featured: false,
      sponsored: false,
      status: 'DRAFT',
      seoTitle: existing.seoTitle,
      seoDescription: existing.seoDescription,
      createdBy: actorId,
      updatedBy: actorId,
    });
    if (existing.images?.length) {
      await this.repos.automobileVehicles.replaceGallery(
        row.id,
        existing.images.map((img) => ({
          imageUrl: img.imageUrl,
          mediaId: img.mediaId,
          altText: img.altText,
          displayOrder: img.displayOrder,
        })),
      );
    }
    await this.audit(actorId, 'automobile.vehicle.duplicate', 'automobile_vehicle', row.id, row);
    await this.bust();
    return (await this.repos.automobileVehicles.findById(row.id)) ?? row;
  }

  compare(query: AutomobileCompareQuery) {
    return this.repos.automobileVehicles.findManyByIds(query.ids);
  }

  listMaintenance(vehicleId?: string) {
    if (vehicleId) return this.repos.automobileMaintenance.listByVehicle(vehicleId);
    return this.repos.automobileMaintenance.listAdmin({ limit: 50 });
  }

  async createMaintenance(input: CreateAutomobileMaintenanceInput, actorId: string) {
    const vehicle = await this.repos.automobileVehicles.findById(input.vehicleId);
    if (!vehicle) throw this.notFound('Vehicle not found.');
    const row = await this.repos.automobileMaintenance.create({
      vehicle: { connect: { id: input.vehicleId } },
      title: input.title,
      serviceInterval: input.serviceInterval,
      estimatedCost: input.estimatedCost,
      notes: input.notes,
      sortOrder: input.sortOrder ?? 0,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await this.audit(actorId, 'automobile.maintenance.create', 'automobile_maintenance', row.id, row);
    return row;
  }

  async updateMaintenance(id: string, input: UpdateAutomobileMaintenanceInput, actorId: string) {
    const existing = await this.db.automobileMaintenanceSchedule.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw this.notFound('Maintenance schedule not found.');
    const row = await this.repos.automobileMaintenance.update(id, {
      ...(input.title != null ? { title: input.title } : {}),
      ...(input.serviceInterval != null ? { serviceInterval: input.serviceInterval } : {}),
      ...(input.estimatedCost !== undefined ? { estimatedCost: input.estimatedCost } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      updatedBy: actorId,
    });
    await this.audit(actorId, 'automobile.maintenance.update', 'automobile_maintenance', id, row);
    return row;
  }

  async deleteMaintenance(id: string, actorId: string) {
    const ok = await this.repos.automobileMaintenance.softDelete(id, actorId);
    if (!ok) throw this.notFound('Maintenance schedule not found.');
    await this.audit(actorId, 'automobile.maintenance.delete', 'automobile_maintenance', id);
    return { id, deleted: true };
  }

  listFaqs(admin = false) {
    return this.db.automobileFaq.findMany({
      where: { deletedAt: null, ...(admin ? {} : { status: 'PUBLISHED' }) },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  createFaq(input: { question: string; answer: string; sortOrder?: number }, actorId: string) {
    return this.db.automobileFaq.create({
      data: {
        question: input.question,
        answer: input.answer,
        sortOrder: input.sortOrder ?? 0,
        status: 'PUBLISHED',
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  listGuides(admin = false) {
    return this.db.automobileGuide.findMany({
      where: { deletedAt: null, ...(admin ? {} : { status: 'PUBLISHED' }) },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async getGuide(slug: string) {
    const row = await this.db.automobileGuide.findFirst({
      where: { slug, deletedAt: null, status: 'PUBLISHED' },
    });
    if (!row) throw this.notFound('Guide not found.');
    return { ...row, content: row.body };
  }

  createGuide(
    input: { title: string; slug: string; summary?: string | null; body?: string | null },
    actorId: string,
  ) {
    return this.db.automobileGuide.create({
      data: {
        title: input.title,
        slug: input.slug,
        summary: input.summary,
        body: input.body,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  async listComparisons() {
    const rows = await this.db.automobileComparison.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => {
      const ids = Array.isArray(row.entityIds) ? (row.entityIds as string[]) : [];
      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        type: row.entityType,
        ids,
        vehicleIds: ids,
        status: row.status,
      };
    });
  }

  async listPublishedComparisons() {
    const rows = await this.db.automobileComparison.findMany({
      where: { deletedAt: null, status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 48,
    });
    return rows.map((row) => {
      const ids = Array.isArray(row.entityIds) ? (row.entityIds as string[]) : [];
      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        entityType: row.entityType,
        vehicleCount: ids.length,
        vehicleIds: ids,
      };
    });
  }

  async getComparisonBySlug(slug: string) {
    const row = await this.db.automobileComparison.findFirst({
      where: { slug, deletedAt: null, status: 'PUBLISHED' },
    });
    if (!row) throw this.notFound('Comparison not found.');
    const ids = Array.isArray(row.entityIds) ? (row.entityIds as string[]) : [];
    const vehicles = await this.repos.automobileVehicles.findManyByIds(ids);
    const enriched = await Promise.all(
      vehicles.map((v) => this.enrichVehicle(v as unknown as Record<string, unknown>)),
    );
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      entityType: row.entityType,
      vehicleIds: ids,
      vehicles: enriched,
    };
  }

  async reviewOptions() {
    return this.db.review.findMany({
      where: { deletedAt: null, status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        title: true,
        slug: true,
        overallScore: true,
        product: { select: { name: true } },
      },
    });
  }

  async createComparison(input: CreateAutomobileComparisonInput, actorId: string) {
    const entityIds = input.entityIds ?? input.ids ?? [];
    const entityType = input.entityType ?? input.type ?? 'vehicles';
    const baseSlug = input.slug ?? slugifyTitle(input.title);
    let slug = baseSlug;
    let n = 1;
    while (await this.db.automobileComparison.findFirst({ where: { slug, deletedAt: null } })) {
      n += 1;
      slug = `${baseSlug}-${n}`;
    }
    const row = await this.db.automobileComparison.create({
      data: {
        title: input.title,
        slug,
        entityType,
        entityIds,
        status: input.status ?? 'PUBLISHED',
        publishedAt: (input.status ?? 'PUBLISHED') === 'PUBLISHED' ? new Date() : null,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
    await this.audit(actorId, 'automobile.comparison.create', 'automobile_comparison', row.id, row);
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      type: row.entityType,
      ids: entityIds,
      vehicleIds: entityIds,
      status: row.status,
    };
  }

  async dealers() {
    const categories = await this.db.businessCategory.findMany({
      where: { slug: { in: [...DEALER_CATEGORY_SLUGS] }, deletedAt: null },
    });
    const categoryIds = categories.map((c) => c.id);
    const businesses = categoryIds.length
      ? await this.db.business.findMany({
          where: {
            deletedAt: null,
            status: 'APPROVED',
            categories: { some: { categoryId: { in: categoryIds } } },
          },
          include: {
            locations: { where: { deletedAt: null }, take: 1 },
            categories: { include: { category: true } },
          },
          orderBy: { updatedAt: 'desc' },
          take: 48,
        })
      : [];
    return {
      businesses: businesses.map((b) => {
        const meta = (b.metadata ?? {}) as Record<string, unknown>;
        return {
          id: b.id,
          name: b.name,
          slug: b.slug,
          city: b.locations[0]?.city ?? null,
          phone: b.phone,
          description: b.description,
          sponsored: Boolean(meta.sponsored),
          category: b.categories[0]?.category.name ?? null,
        };
      }),
      categories: categories.map((c) => ({ name: c.name, href: `/directory?category=${c.slug}` })),
      directoryHref: '/directory?vertical=automobile',
    };
  }

  async reviews(vehicleId?: string) {
    if (vehicleId) {
      const links = await this.db.automobileVehicleReview.findMany({
        where: {
          vehicleId,
          review: { deletedAt: null, status: 'PUBLISHED' },
        },
        include: {
          review: { include: { product: true } },
        },
        take: 24,
      });
      return links.map((l) => ({
        ...l.review,
        overallScore: l.review.overallScore,
        rating: l.review.overallScore,
        vehicleId,
      }));
    }
    const linked = await this.db.automobileVehicleReview.findMany({
      where: { review: { deletedAt: null, status: 'PUBLISHED' } },
      include: {
        review: { include: { product: true } },
        vehicle: { select: { id: true, name: true, slug: true } },
      },
      take: 24,
      orderBy: { reviewId: 'asc' },
    });
    if (linked.length) {
      return linked.map((l) => ({
        ...l.review,
        rating: l.review.overallScore,
        vehicle: l.vehicle,
      }));
    }
    return this.db.review.findMany({
      where: { deletedAt: null, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 24,
      include: { product: true },
    });
  }

  async vehicleOffers(_vehicleId: string) {
    const [loans, insurance] = await Promise.all([
      this.db.loan.findMany({
        where: {
          deletedAt: null,
          status: 'PUBLISHED',
          OR: [
            { loanType: { contains: 'car', mode: 'insensitive' } },
            { loanType: { contains: 'auto', mode: 'insensitive' } },
            { name: { contains: 'car', mode: 'insensitive' } },
            { slug: { contains: 'car', mode: 'insensitive' } },
            { name: { contains: 'auto', mode: 'insensitive' } },
          ],
        },
        include: { bank: { select: { name: true, slug: true } } },
        orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
        take: 6,
      }),
      this.db.insuranceProduct.findMany({
        where: {
          deletedAt: null,
          status: 'PUBLISHED',
          OR: [
            { name: { contains: 'motor', mode: 'insensitive' } },
            { name: { contains: 'car', mode: 'insensitive' } },
            { slug: { contains: 'motor', mode: 'insensitive' } },
            { slug: { contains: 'car', mode: 'insensitive' } },
            { coverage: { contains: 'motor', mode: 'insensitive' } },
          ],
        },
        orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
        take: 6,
      }),
    ]);
    return {
      loans: loans.map((l) => ({
        id: l.id,
        name: l.name,
        slug: l.slug,
        loanType: l.loanType,
        interestRate: l.interestRate,
        affiliateUrl: l.affiliateUrl,
        featured: l.featured,
        bank: l.bank,
        href: `/finance/loans/${l.id}`,
      })),
      insurance: insurance.map((i) => ({
        id: i.id,
        name: i.name,
        slug: i.slug,
        providerName: i.providerName,
        premium: i.premium,
        coverage: i.coverage,
        affiliateUrl: i.affiliateUrl,
        featured: i.featured,
        href: `/finance/insurance/${i.id}`,
      })),
    };
  }

  trackAffiliateClick(input: AutomobileAffiliateClickInput, userId?: string | null) {
    return this.db.affiliateClick.create({
      data: {
        entityType: input.entityType || 'automobile_vehicle',
        entityId: input.entityId,
        affiliateUrl: input.affiliateUrl,
        userId: userId ?? null,
        sessionId: input.sessionId,
        referrer: input.referrer,
      },
    });
  }

  trackAffiliateLead(input: AutomobileAffiliateLeadInput) {
    return this.db.affiliateLead.create({
      data: {
        entityType: input.entityType || 'automobile_vehicle',
        entityId: input.entityId,
        affiliateUrl: input.affiliateUrl,
        leadType: input.leadType || 'interest',
        name: input.name,
        email: input.email === '' ? null : input.email,
        phone: input.phone,
        sessionId: input.sessionId,
        referrer: input.referrer,
      },
    });
  }

  async affiliateStats() {
    const automobileTypes = ['automobile_vehicle', 'automobile_loan', 'automobile_insurance'];
    const [clicksByType, vehicleClicks, vehiclesWithAffiliate, leadsByType, vehicleLeads, totalClicks, totalLeads] =
      await Promise.all([
      this.db.affiliateClick.groupBy({
        by: ['entityType'],
        where: { entityType: { in: automobileTypes } },
        _count: { _all: true },
      }),
      this.db.affiliateClick.groupBy({
        by: ['entityId'],
        where: { entityType: 'automobile_vehicle' },
        _count: { _all: true },
        orderBy: { _count: { entityId: 'desc' } },
        take: 20,
      }),
      this.db.automobileVehicle.findMany({
        where: { deletedAt: null, affiliateUrl: { not: null } },
        select: { id: true, name: true, slug: true, affiliateUrl: true, status: true },
        take: 100,
      }),
      this.db.affiliateLead.groupBy({
        by: ['entityType'],
        where: { entityType: { in: automobileTypes } },
        _count: { _all: true },
      }),
      this.db.affiliateLead.groupBy({
        by: ['entityId'],
        where: { entityType: 'automobile_vehicle' },
        _count: { _all: true },
        orderBy: { _count: { entityId: 'desc' } },
        take: 20,
      }),
      this.db.affiliateClick.count({ where: { entityType: { in: automobileTypes } } }),
      this.db.affiliateLead.count({ where: { entityType: { in: automobileTypes } } }),
    ]);
    const clickMap = new Map(vehicleClicks.map((c) => [c.entityId, c._count._all]));
    const leadMap = new Map(vehicleLeads.map((l) => [l.entityId, l._count._all]));
    return {
      clickCounts: clicksByType.map((c) => ({ entityType: c.entityType, clicks: c._count._all })),
      leadCounts: leadsByType.map((l) => ({ entityType: l.entityType, leads: l._count._all })),
      totalClicks,
      totalLeads,
      conversionRate: totalClicks > 0 ? Number(((totalLeads / totalClicks) * 100).toFixed(2)) : 0,
      vehicles: vehiclesWithAffiliate.map((v) => {
        const clicks = clickMap.get(v.id) ?? 0;
        const leads = leadMap.get(v.id) ?? 0;
        return {
          ...v,
          clicks,
          leads,
          ctr: clicks > 0 ? Number(((leads / clicks) * 100).toFixed(2)) : 0,
        };
      }),
      totalVehicleClicks: vehicleClicks.reduce((sum, c) => sum + c._count._all, 0),
      totalVehicleLeads: vehicleLeads.reduce((sum, l) => sum + l._count._all, 0),
    };
  }

  async adminReportsSummary() {
    const [
      manufacturersPublished,
      vehiclesPublished,
      maintenanceSchedules,
      faqs,
      guides,
      comparisons,
      dealerCats,
      affiliateClicks,
      affiliateLeads,
    ] = await Promise.all([
      this.db.automobileManufacturer.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.db.automobileVehicle.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.db.automobileMaintenanceSchedule.count({ where: { deletedAt: null } }),
      this.db.automobileFaq.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.db.automobileGuide.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.db.automobileComparison.count({ where: { deletedAt: null } }),
      this.db.businessCategory.findMany({
        where: { slug: { in: [...DEALER_CATEGORY_SLUGS] }, deletedAt: null },
        select: { id: true },
      }),
      this.db.affiliateClick.count({
        where: { entityType: { in: ['automobile_vehicle', 'automobile_loan', 'automobile_insurance'] } },
      }),
      this.db.affiliateLead.count({
        where: { entityType: { in: ['automobile_vehicle', 'automobile_loan', 'automobile_insurance'] } },
      }),
    ]);
    const dealersLinked = dealerCats.length
      ? await this.db.business.count({
          where: {
            deletedAt: null,
            status: 'APPROVED',
            categories: { some: { categoryId: { in: dealerCats.map((c) => c.id) } } },
          },
        })
      : 0;
    return {
      manufacturersPublished,
      vehiclesPublished,
      maintenanceSchedules,
      faqs,
      guides,
      comparisons,
      dealersLinked,
      affiliateClicks,
      affiliateLeads,
    };
  }

  async entityHistory(entity: string, entityId: string) {
    const allowed = new Set([
      'automobile_manufacturer',
      'automobile_vehicle',
      'automobile_maintenance',
      'automobile_comparison',
      'automobile_faq',
      'automobile_guide',
    ]);
    if (!allowed.has(entity)) {
      throw new BadRequestException({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Unknown automobile entity for history.' },
      });
    }
    const rows = await this.db.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { id: true, email: true, displayName: true } } },
    });
    return rows.map((row) => ({
      id: row.id,
      action: row.action,
      createdAt: row.createdAt,
      user: row.user ? { id: row.user.id, email: row.user.email, displayName: row.user.displayName } : null,
    }));
  }

  async exportCsv(entity: string) {
    const esc = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    if (entity === 'manufacturers') {
      const rows = await this.db.automobileManufacturer.findMany({ where: { deletedAt: null } });
      return [
        'id,name,slug,country,website,status,featured',
        ...rows.map((r) => [r.id, r.name, r.slug, r.country, r.website, r.status, r.featured].map(esc).join(',')),
      ].join('\n');
    }
    if (entity === 'vehicles') {
      const rows = await this.db.automobileVehicle.findMany({
        where: { deletedAt: null },
        include: { manufacturer: { select: { slug: true } } },
      });
      return [
        'id,name,slug,manufacturerSlug,model,variant,fuelType,exShowroomPrice,status',
        ...rows.map((r) =>
          [r.id, r.name, r.slug, r.manufacturer.slug, r.model, r.variant, r.fuelType, r.exShowroomPrice, r.status]
            .map(esc)
            .join(','),
        ),
      ].join('\n');
    }
    throw new BadRequestException({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Unknown entity.' } });
  }

  async importCsv(entity: string, csvText: string, actorId: string) {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      throw new BadRequestException({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Empty CSV.' } });
    }
    const headers = lines[0]!.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map((line) => {
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = cols[i] ?? '';
      });
      return row;
    });
    let imported = 0;
    if (entity === 'manufacturers') {
      for (const row of rows) {
        if (!row.name || !row.slug) continue;
        await this.db.automobileManufacturer.upsert({
          where: { slug: row.slug },
          update: {
            name: row.name,
            country: row.country || null,
            website: row.website || null,
            status: (row.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
            updatedBy: actorId,
          },
          create: {
            name: row.name,
            slug: row.slug,
            country: row.country || null,
            website: row.website || null,
            status: (row.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
            createdBy: actorId,
            updatedBy: actorId,
          },
        });
        imported += 1;
      }
    } else if (entity === 'vehicles') {
      for (const row of rows) {
        if (!row.name || !row.slug || !row.model) continue;
        const manufacturerSlug = row.manufacturerSlug || row.manufacturerId;
        if (!manufacturerSlug) continue;
        const manufacturer = await this.db.automobileManufacturer.findFirst({
          where: {
            deletedAt: null,
            OR: [{ slug: manufacturerSlug }, { id: manufacturerSlug }],
          },
          select: { id: true },
        });
        if (!manufacturer) continue;
        await this.db.automobileVehicle.upsert({
          where: { slug: row.slug },
          update: {
            name: row.name,
            manufacturerId: manufacturer.id,
            model: row.model,
            variant: row.variant || '',
            fuelType: row.fuelType || null,
            exShowroomPrice: row.exShowroomPrice ? Number(row.exShowroomPrice) : null,
            status: (row.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
            updatedBy: actorId,
          },
          create: {
            name: row.name,
            slug: row.slug,
            manufacturerId: manufacturer.id,
            model: row.model,
            variant: row.variant || '',
            fuelType: row.fuelType || null,
            exShowroomPrice: row.exShowroomPrice ? Number(row.exShowroomPrice) : null,
            status: (row.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
            createdBy: actorId,
            updatedBy: actorId,
          },
        });
        imported += 1;
      }
    } else {
      throw new BadRequestException({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `Import for ${entity} not supported yet.` },
      });
    }
    await this.bust();
    return { imported };
  }
}
