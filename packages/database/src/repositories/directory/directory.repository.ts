import type {
  BusinessStatus,
  DirectoryEventType,
  LeadStatus,
  ListingType,
  Prisma,
  PrismaClient,
  VerificationStatus,
} from '@prisma/client';
import {
  BaseRepository,
  findActiveById,
  listActiveWithCursor,
  softDeleteById,
} from '../base.repository';
import type { CursorPageParams } from '../../pagination';

const listingInclude = {
  locations: { where: { deletedAt: null } },
  services: { where: { deletedAt: null } },
  products: { where: { deletedAt: null } },
  media: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' as const } },
  hours: { where: { deletedAt: null }, orderBy: { day: 'asc' as const } },
  categories: { include: { category: true } },
  owner: true,
  _count: { select: { reviews: true, leads: true } },
} satisfies Prisma.BusinessInclude;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export class BusinessRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.business.findFirst({
      where: { id, deletedAt: null },
      include: listingInclude,
    });
  }

  findBySlug(slug: string) {
    return this.db.business.findFirst({
      where: { slug, deletedAt: null },
      include: listingInclude,
    });
  }

  list(
    params: CursorPageParams & {
      status?: BusinessStatus;
      search?: string;
      ownerId?: string;
      categorySlug?: string;
      city?: string;
      state?: string;
      country?: string;
      featured?: boolean;
      sponsored?: boolean;
      verified?: boolean;
      listingType?: ListingType;
      lat?: number;
      lng?: number;
      radiusKm?: number;
      sort?: 'recent' | 'popular' | 'rating' | 'reviews' | 'name';
    } = {},
  ) {
    const locationFilter =
      params.city || params.state || params.country || (params.lat != null && params.lng != null)
        ? {
            locations: {
              some: {
                deletedAt: null,
                ...(params.city ? { city: { equals: params.city, mode: 'insensitive' as const } } : {}),
                ...(params.state ? { state: { equals: params.state, mode: 'insensitive' as const } } : {}),
                ...(params.country
                  ? { country: { equals: params.country, mode: 'insensitive' as const } }
                  : {}),
              },
            },
          }
        : {};

    return listActiveWithCursor(this.db.business, {
      ...params,
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.ownerId ? { ownerId: params.ownerId } : {}),
        ...(params.featured !== undefined ? { featured: params.featured } : {}),
        ...(params.sponsored !== undefined ? { sponsored: params.sponsored } : {}),
        ...(params.verified ? { verificationStatus: 'VERIFIED' as VerificationStatus } : {}),
        ...(params.listingType ? { listingType: params.listingType } : {}),
        ...(params.categorySlug
          ? {
              categories: {
                some: { category: { slug: params.categorySlug, deletedAt: null } },
              },
            }
          : {}),
        ...locationFilter,
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { slug: { contains: params.search, mode: 'insensitive' } },
                { description: { contains: params.search, mode: 'insensitive' } },
                { services: { some: { name: { contains: params.search, mode: 'insensitive' }, deletedAt: null } } },
                { products: { some: { name: { contains: params.search, mode: 'insensitive' }, deletedAt: null } } },
              ],
            }
          : {}),
      },
      include: {
        categories: { include: { category: true } },
        locations: { where: { deletedAt: null }, take: 3 },
        hours: { where: { deletedAt: null } },
        _count: { select: { reviews: true, leads: true } },
      },
    }).then(async (page) => {
      if (params.lat == null || params.lng == null || !params.radiusKm) return page;
      const items = page.items.filter((row) => {
        const locs = (row as { locations?: Array<{ latitude: unknown; longitude: unknown }> }).locations ?? [];
        return locs.some((loc) => {
          if (loc.latitude == null || loc.longitude == null) return false;
          const lat = Number(loc.latitude);
          const lng = Number(loc.longitude);
          if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
          return haversineKm(params.lat!, params.lng!, lat, lng) <= params.radiusKm!;
        });
      });
      return { ...page, items };
    });
  }

  create(data: Prisma.BusinessCreateInput) {
    return this.db.business.create({ data, include: listingInclude });
  }

  update(id: string, data: Prisma.BusinessUpdateInput) {
    return this.db.business.update({ where: { id }, data, include: listingInclude });
  }

  async replaceNested(
    id: string,
    data: {
      business: Prisma.BusinessUpdateInput;
      categoryIds?: string[];
      locations?: Prisma.BusinessLocationCreateWithoutBusinessInput[];
      services?: Prisma.BusinessServiceCreateWithoutBusinessInput[];
      products?: Prisma.BusinessProductCreateWithoutBusinessInput[];
      hours?: Prisma.BusinessHoursCreateWithoutBusinessInput[];
      media?: Prisma.BusinessMediaCreateWithoutBusinessInput[];
    },
  ) {
    return this.db.$transaction(async (tx) => {
      if (data.locations) {
        await tx.businessLocation.deleteMany({ where: { businessId: id } });
      }
      if (data.services) {
        await tx.businessService.deleteMany({ where: { businessId: id } });
      }
      if (data.products) {
        await tx.businessProduct.deleteMany({ where: { businessId: id } });
      }
      if (data.hours) {
        await tx.businessHours.deleteMany({ where: { businessId: id } });
      }
      if (data.media) {
        await tx.businessMedia.deleteMany({ where: { businessId: id } });
      }
      if (data.categoryIds) {
        await tx.businessCategoryLink.deleteMany({ where: { businessId: id } });
      }

      return tx.business.update({
        where: { id },
        data: {
          ...data.business,
          ...(data.categoryIds
            ? { categories: { create: data.categoryIds.map((categoryId) => ({ categoryId })) } }
            : {}),
          ...(data.locations ? { locations: { create: data.locations } } : {}),
          ...(data.services ? { services: { create: data.services } } : {}),
          ...(data.products ? { products: { create: data.products } } : {}),
          ...(data.hours ? { hours: { create: data.hours } } : {}),
          ...(data.media ? { media: { create: data.media } } : {}),
        },
        include: listingInclude,
      });
    });
  }

  publish(id: string, actorId?: string | null) {
    return this.db.business.update({
      where: { id },
      data: {
        status: 'APPROVED',
        publishedAt: new Date(),
        updatedBy: actorId ?? undefined,
      },
      include: listingInclude,
    });
  }

  unpublish(id: string, actorId?: string | null) {
    return this.db.business.update({
      where: { id },
      data: {
        status: 'PENDING',
        publishedAt: null,
        updatedBy: actorId ?? undefined,
      },
      include: listingInclude,
    });
  }

  verify(id: string, status: VerificationStatus, actorId?: string | null) {
    return this.db.business.update({
      where: { id },
      data: {
        verificationStatus: status,
        listingType: status === 'VERIFIED' ? 'VERIFIED' : undefined,
        updatedBy: actorId ?? undefined,
      },
      include: listingInclude,
    });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.business, id, actorId);
  }

  incrementViews(id: string) {
    return this.db.business.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  async exportRows() {
    const rows = await this.db.business.findMany({
      where: { deletedAt: null },
      include: { locations: { where: { deletedAt: null }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      phone: r.phone,
      email: r.email,
      website: r.website,
      city: r.locations[0]?.city ?? '',
      state: r.locations[0]?.state ?? '',
      country: r.locations[0]?.country ?? '',
      status: r.status,
      featured: r.featured,
      sponsored: r.sponsored,
      verificationStatus: r.verificationStatus,
      listingType: r.listingType,
    }));
  }

  async analytics() {
    const [
      totalListings,
      approvedListings,
      pendingListings,
      featuredCount,
      sponsoredCount,
      verifiedCount,
      leadCounts,
      topCities,
      topCategories,
      eventCounts,
    ] = await Promise.all([
      this.db.business.count({ where: { deletedAt: null } }),
      this.db.business.count({ where: { deletedAt: null, status: 'APPROVED' } }),
      this.db.business.count({ where: { deletedAt: null, status: 'PENDING' } }),
      this.db.business.count({ where: { deletedAt: null, featured: true } }),
      this.db.business.count({ where: { deletedAt: null, sponsored: true } }),
      this.db.business.count({ where: { deletedAt: null, verificationStatus: 'VERIFIED' } }),
      this.db.leadRequest.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      this.db.businessLocation.groupBy({
        by: ['city'],
        where: { deletedAt: null },
        _count: { _all: true },
        orderBy: { _count: { city: 'desc' } },
        take: 10,
      }),
      this.db.businessCategoryLink.groupBy({
        by: ['categoryId'],
        _count: { _all: true },
        orderBy: { _count: { categoryId: 'desc' } },
        take: 10,
      }),
      this.db.directoryEvent.groupBy({
        by: ['eventType'],
        _count: { _all: true },
      }),
    ]);

    const categoryIds = topCategories.map((c) => c.categoryId);
    const categories = categoryIds.length
      ? await this.db.businessCategory.findMany({
          where: { id: { in: categoryIds }, deletedAt: null },
          select: { id: true, name: true, slug: true },
        })
      : [];
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const mostViewed = await this.db.business.findMany({
      where: { deletedAt: null, status: 'APPROVED' },
      orderBy: { viewCount: 'desc' },
      take: 10,
      select: { id: true, name: true, slug: true, viewCount: true, featured: true, sponsored: true },
    });

    return {
      totalListings,
      approvedListings,
      pendingListings,
      featuredCount,
      sponsoredCount,
      verifiedCount,
      leadsByStatus: Object.fromEntries(leadCounts.map((r) => [r.status, r._count._all])),
      topCities: topCities.map((c) => ({ city: c.city, count: c._count._all })),
      topCategories: topCategories.map((c) => ({
        categoryId: c.categoryId,
        name: categoryMap.get(c.categoryId)?.name ?? c.categoryId,
        slug: categoryMap.get(c.categoryId)?.slug ?? null,
        count: c._count._all,
      })),
      eventsByType: Object.fromEntries(eventCounts.map((e) => [e.eventType, e._count._all])),
      mostViewed,
    };
  }

  findDuplicate(name: string, city?: string | null) {
    return this.db.business.findFirst({
      where: {
        deletedAt: null,
        name: { equals: name, mode: 'insensitive' },
        ...(city
          ? { locations: { some: { city: { equals: city, mode: 'insensitive' }, deletedAt: null } } }
          : {}),
      },
      select: { id: true, name: true, slug: true },
    });
  }

  async mapMarkers(params: { city?: string; categorySlug?: string; limit?: number } = {}) {
    const listings = await this.db.business.findMany({
      where: {
        deletedAt: null,
        status: 'APPROVED',
        ...(params.categorySlug
          ? { categories: { some: { category: { slug: params.categorySlug, deletedAt: null } } } }
          : {}),
        ...(params.city
          ? { locations: { some: { city: { equals: params.city, mode: 'insensitive' }, deletedAt: null } } }
          : {}),
        locations: { some: { latitude: { not: null }, longitude: { not: null }, deletedAt: null } },
      },
      take: params.limit ?? 200,
      select: {
        id: true,
        name: true,
        slug: true,
        featured: true,
        sponsored: true,
        verificationStatus: true,
        locations: {
          where: { deletedAt: null, latitude: { not: null }, longitude: { not: null } },
          take: 1,
          select: { latitude: true, longitude: true, city: true, address1: true },
        },
      },
    });

    return listings
      .map((row) => {
        const loc = row.locations[0];
        if (!loc?.latitude || !loc?.longitude) return null;
        return {
          id: row.id,
          name: row.name,
          slug: row.slug,
          featured: row.featured,
          sponsored: row.sponsored,
          verified: row.verificationStatus === 'VERIFIED',
          lat: Number(loc.latitude),
          lng: Number(loc.longitude),
          city: loc.city,
          address: loc.address1,
        };
      })
      .filter(Boolean);
  }

  listVerificationQueue(params: CursorPageParams = {}) {
    return listActiveWithCursor(this.db.business, {
      ...params,
      where: {
        verificationStatus: { in: ['PENDING', 'UNVERIFIED'] },
        status: { in: ['PENDING', 'APPROVED'] },
      },
      include: {
        locations: { where: { deletedAt: null }, take: 1 },
        categories: { include: { category: true } },
      },
    });
  }

  relatedInCategory(businessId: string, categoryId: string, limit = 6) {
    return this.db.business.findMany({
      where: {
        id: { not: businessId },
        deletedAt: null,
        status: 'APPROVED',
        categories: { some: { categoryId } },
      },
      take: limit,
      select: { id: true, name: true, slug: true, description: true, featured: true, sponsored: true },
    });
  }

  async sponsoredPerformance() {
    const sponsored = await this.db.business.findMany({
      where: { deletedAt: null, sponsored: true, status: 'APPROVED' },
      select: { id: true, name: true, slug: true, viewCount: true },
      orderBy: { viewCount: 'desc' },
      take: 10,
    });
    const events = await this.db.directoryEvent.groupBy({
      by: ['businessId'],
      where: { businessId: { not: null }, eventType: { in: ['VIEW', 'LEAD_REQUEST', 'WEBSITE_CLICK'] } },
      _count: { _all: true },
    });
    const eventMap = new Map(events.map((e) => [e.businessId!, e._count._all]));
    return sponsored.map((s) => ({
      ...s,
      engagementEvents: eventMap.get(s.id) ?? 0,
    }));
  }

  async leadConversionRate() {
    const [totalLeads, convertedLeads, totalViews] = await Promise.all([
      this.db.leadRequest.count({ where: { deletedAt: null } }),
      this.db.leadRequest.count({ where: { deletedAt: null, status: 'CONVERTED' } }),
      this.db.directoryEvent.count({ where: { eventType: 'VIEW' } }),
    ]);
    return {
      totalLeads,
      convertedLeads,
      conversionRate: totalLeads ? convertedLeads / totalLeads : 0,
      viewsPerLead: totalLeads ? totalViews / totalLeads : 0,
    };
  }
}

export class BusinessCategoryRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return findActiveById(this.db.businessCategory, id, {
      children: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
      _count: { select: { businesses: true } },
    });
  }

  findBySlug(slug: string) {
    return this.db.businessCategory.findFirst({
      where: { slug, deletedAt: null },
      include: {
        children: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
        parent: true,
        _count: { select: { businesses: true } },
      },
    });
  }

  list(params: CursorPageParams & { parentId?: string | null; search?: string } = {}) {
    return listActiveWithCursor(this.db.businessCategory, {
      ...params,
      where: {
        ...(params.parentId !== undefined ? { parentId: params.parentId } : {}),
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
        children: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
        _count: { select: { businesses: true } },
      },
    });
  }

  create(data: Prisma.BusinessCategoryCreateInput) {
    return this.db.businessCategory.create({ data });
  }

  update(id: string, data: Prisma.BusinessCategoryUpdateInput) {
    return this.db.businessCategory.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return softDeleteById(this.db.businessCategory, id);
  }
}

export class LeadRequestRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.leadRequest.findFirst({
      where: { id, deletedAt: null },
      include: { business: { select: { id: true, name: true, slug: true } } },
    });
  }

  list(params: CursorPageParams & { status?: LeadStatus; businessId?: string } = {}) {
    return listActiveWithCursor(this.db.leadRequest, {
      ...params,
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.businessId ? { businessId: params.businessId } : {}),
      },
      include: {
        business: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  create(data: Prisma.LeadRequestCreateInput) {
    return this.db.leadRequest.create({
      data,
      include: { business: { select: { id: true, name: true, slug: true } } },
    });
  }

  updateStatus(id: string, status: LeadStatus) {
    return this.db.leadRequest.update({
      where: { id },
      data: { status },
      include: { business: { select: { id: true, name: true, slug: true } } },
    });
  }

  softDelete(id: string) {
    return softDeleteById(this.db.leadRequest, id);
  }
}

export class DirectoryEventRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  create(data: { businessId?: string | null; eventType: DirectoryEventType; metadata?: Prisma.InputJsonValue }) {
    return this.db.directoryEvent.create({
      data: {
        businessId: data.businessId ?? null,
        eventType: data.eventType,
        metadata: data.metadata,
      },
    });
  }
}
