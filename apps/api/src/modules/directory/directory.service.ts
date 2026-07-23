import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { Repositories } from '@varnarc/database';
import type {
  CreateBusinessCategoryInput,
  CreateBusinessInput,
  CreateLeadRequestInput,
  CursorPaginationQuery,
  DirectoryBulkActionInput,
  DirectoryListingsQuery,
  DirectoryTrackEventInput,
  UpdateBusinessCategoryInput,
  UpdateBusinessInput,
  UpdateLeadStatusInput,
} from '@varnarc/validation';
import { REPOS } from '../../database/database.module';
import { SearchIndexerService } from '../search/search-indexer.service';

const CACHE_TTL = 60_000;
const DIRECTORY_ENTITY = 'directory_listing';

function isOpenNow(
  hours: Array<{ day: number; openTime?: string | null; closeTime?: string | null; isClosed?: boolean }>,
): boolean {
  const now = new Date();
  const slot = hours.find((h) => h.day === now.getDay());
  if (!slot || slot.isClosed || !slot.openTime || !slot.closeTime) return false;
  const toMins = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return nowMins >= toMins(slot.openTime) && nowMins <= toMins(slot.closeTime);
}

@Injectable()
export class DirectoryService {
  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly searchIndexer: SearchIndexerService,
  ) {}

  private async audit(actorId: string, action: string, entityId: string, newValue?: object) {
    await this.repos.auditLogs.create({
      userId: actorId,
      action,
      entity: 'directory_listing',
      entityId,
      newValue: newValue as never,
    });
  }

  private async bustCache(slug?: string) {
    await Promise.all([
      this.cache.del('directory:analytics'),
      this.cache.del('directory:listings:approved'),
      this.cache.del('directory:categories'),
      ...(slug ? [this.cache.del(`directory:slug:${slug}`)] : []),
    ]);
  }

  private assertOwnerOrElevated(
    listing: { ownerId?: string | null },
    userId: string,
    elevated: boolean,
  ) {
    if (elevated) return;
    if (listing.ownerId && listing.ownerId === userId) return;
    throw new ForbiddenException({
      success: false,
      error: { code: 'FORBIDDEN', message: 'You can only manage your own listings.' },
    });
  }

  async listCategories(query: CursorPaginationQuery & { parentId?: string | null }) {
    const cacheKey =
      !query.cursor && !query.search && query.parentId === undefined ? 'directory:categories' : null;
    if (cacheKey) {
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached as Awaited<ReturnType<typeof this.repos.businessCategories.list>>;
    }
    const page = await this.repos.businessCategories.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      search: query.search,
      parentId: query.parentId,
    });
    if (cacheKey) await this.cache.set(cacheKey, page, CACHE_TTL);
    return page;
  }

  async getCategoryBySlug(slug: string) {
    const row = await this.repos.businessCategories.findBySlug(slug);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Category not found.' },
      });
    }
    return row;
  }

  async createCategory(input: CreateBusinessCategoryInput, actorId: string) {
    const row = await this.repos.businessCategories.create({
      name: input.name,
      slug: input.slug,
      icon: input.icon ?? null,
      description: input.description ?? null,
      sortOrder: input.sortOrder ?? 0,
      ...(input.parentId ? { parent: { connect: { id: input.parentId } } } : {}),
    });
    await this.audit(actorId, 'directory.category.create', row.id, row);
    await this.bustCache();
    return row;
  }

  async updateCategory(id: string, input: UpdateBusinessCategoryInput, actorId: string) {
    const existing = await this.repos.businessCategories.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Category not found.' },
      });
    }
    const row = await this.repos.businessCategories.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.parentId !== undefined
        ? input.parentId
          ? { parent: { connect: { id: input.parentId } } }
          : { parent: { disconnect: true } }
        : {}),
    });
    await this.audit(actorId, 'directory.category.update', id, row);
    await this.bustCache();
    return row;
  }

  async deleteCategory(id: string, actorId: string) {
    const existing = await this.repos.businessCategories.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Category not found.' },
      });
    }
    await this.repos.businessCategories.softDelete(id);
    await this.audit(actorId, 'directory.category.delete', id);
    await this.bustCache();
    return { id, deleted: true };
  }

  async list(query: DirectoryListingsQuery, approvedOnly = true) {
    const needsPostFilter = query.openNow || query.topRated || query.mostReviewed || query.minRating;
    const fetchLimit = needsPostFilter ? Math.min((query.limit ?? 20) * 4, 100) : query.limit;

    const cacheKey =
      approvedOnly &&
      !needsPostFilter &&
      !query.cursor &&
      !query.search &&
      !query.category &&
      !query.city &&
      !query.state &&
      !query.country &&
      query.featured === undefined &&
      query.sponsored === undefined &&
      !query.verified &&
      !query.listingType &&
      query.lat == null &&
      !query.sort
        ? 'directory:listings:approved'
        : null;

    if (cacheKey) {
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached as Awaited<ReturnType<typeof this.repos.businesses.list>>;
    }

    let page = await this.repos.businesses.list({
      cursor: query.cursor,
      limit: fetchLimit,
      direction: query.direction,
      search: query.search,
      status: query.status ?? (approvedOnly ? 'APPROVED' : undefined),
      categorySlug: query.category,
      city: query.city,
      state: query.state,
      country: query.country,
      featured: query.featured,
      sponsored: query.sponsored,
      verified: query.verified,
      listingType: query.listingType,
      lat: query.lat,
      lng: query.lng,
      radiusKm: query.radiusKm,
      sort: query.sort,
    });

    if (needsPostFilter || query.sort === 'rating' || query.sort === 'reviews' || query.sort === 'popular' || query.sort === 'name') {
      page = await this.applySortAndFilters(page, query);
    }

    if (cacheKey) await this.cache.set(cacheKey, page, CACHE_TTL);
    return page;
  }

  private async applySortAndFilters(
    page: Awaited<ReturnType<typeof this.repos.businesses.list>>,
    query: DirectoryListingsQuery,
  ) {
    type ListingRow = (typeof page.items)[number] & {
      name?: string;
      hours?: Array<{ day: number; openTime?: string | null; closeTime?: string | null; isClosed?: boolean }>;
    };

    let items = page.items as ListingRow[];

    if (query.openNow) {
      items = items.filter((row) => isOpenNow(row.hours ?? []));
    }

    const ratings = await Promise.all(
      items.map(async (row) => ({
        id: row.id,
        summary: await this.repos.userReviews.entityRatingSummary(DIRECTORY_ENTITY, row.id),
      })),
    );
    const ratingMap = new Map(ratings.map((r) => [r.id, r.summary]));

    if (query.minRating) {
      items = items.filter((row) => {
        const avg = Number(ratingMap.get(row.id)?.averageRating ?? 0);
        return avg >= (query.minRating ?? 0);
      });
    }

    if (query.topRated || query.sort === 'rating') {
      items.sort(
        (a, b) =>
          Number(ratingMap.get(b.id)?.averageRating ?? 0) - Number(ratingMap.get(a.id)?.averageRating ?? 0),
      );
    } else if (query.mostReviewed || query.sort === 'reviews') {
      items.sort(
        (a, b) =>
          (ratingMap.get(b.id)?.totalRatings ?? 0) - (ratingMap.get(a.id)?.totalRatings ?? 0),
      );
    } else if (query.sort === 'popular') {
      items.sort((a, b) => ((b as { viewCount?: number }).viewCount ?? 0) - ((a as { viewCount?: number }).viewCount ?? 0));
    } else if (query.sort === 'name') {
      items.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    }

    const limit = query.limit ?? 20;
    return { ...page, items: items.slice(0, limit), hasMore: items.length > limit };
  }

  search(query: DirectoryListingsQuery) {
    return this.list(query, true);
  }

  async getById(id: string, approvedOnly = true) {
    const row = await this.repos.businesses.findById(id);
    if (!row || (approvedOnly && row.status !== 'APPROVED')) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Listing not found.' },
      });
    }
    return row;
  }

  async getBySlug(slug: string, approvedOnly = true) {
    const cacheKey = approvedOnly ? `directory:slug:${slug}` : null;
    if (cacheKey) {
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached as NonNullable<Awaited<ReturnType<typeof this.repos.businesses.findBySlug>>>;
    }
    const row = await this.repos.businesses.findBySlug(slug);
    if (!row || (approvedOnly && row.status !== 'APPROVED')) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Listing not found.' },
      });
    }
    if (cacheKey) await this.cache.set(cacheKey, row, CACHE_TTL);
    return row;
  }

  private mapCreateInput(input: CreateBusinessInput, ownerId: string) {
    return {
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      website: input.website || null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      whatsapp: input.whatsapp ?? null,
      contactPerson: input.contactPerson ?? null,
      socialLinks: input.socialLinks as never,
      logoUrl: input.logoUrl || null,
      coverImageUrl: input.coverImageUrl || null,
      listingType: input.listingType,
      verificationStatus: input.verificationStatus,
      featured: input.featured ?? false,
      sponsored: input.sponsored ?? false,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      pricing: input.pricing ?? null,
      certifications: input.certifications as never,
      faqs: input.faqs as never,
      status: input.status,
      metadata: input.metadata as never,
      owner: { connect: { id: ownerId } },
      locations: { create: input.locations },
      services: { create: input.services },
      products: { create: input.products },
      hours: { create: input.hours },
      media: {
        create: input.media.map((m) => ({
          mediaId: m.mediaId ?? null,
          url: m.url || null,
          kind: m.kind,
          sortOrder: m.sortOrder ?? 0,
          caption: m.caption ?? null,
        })),
      },
      ...(input.categoryIds.length
        ? { categories: { create: input.categoryIds.map((categoryId) => ({ categoryId })) } }
        : {}),
      createdBy: ownerId,
      updatedBy: ownerId,
      ...(input.status === 'APPROVED' ? { publishedAt: new Date() } : {}),
    };
  }

  async create(input: CreateBusinessInput, ownerId: string) {
    const existingSlug = await this.repos.businesses.findBySlug(input.slug);
    if (existingSlug) {
      throw new ConflictException({
        success: false,
        error: { code: 'DUPLICATE', message: 'A listing with this slug already exists.' },
      });
    }
    const city = input.locations[0]?.city;
    const duplicate = await this.repos.businesses.findDuplicate(input.name, city);
    if (duplicate) {
      throw new ConflictException({
        success: false,
        error: { code: 'DUPLICATE', message: 'A similar listing already exists for this name and location.' },
      });
    }
    const row = await this.repos.businesses.create(this.mapCreateInput(input, ownerId));
    await this.audit(ownerId, 'directory.listing.create', row.id, { name: row.name, slug: row.slug });
    await this.bustCache(row.slug);
    return row;
  }

  async update(
    id: string,
    input: UpdateBusinessInput,
    actorId: string,
    elevated: boolean,
  ) {
    const existing = await this.repos.businesses.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Listing not found.' },
      });
    }
    this.assertOwnerOrElevated(existing, actorId, elevated);

    const hasNested =
      input.locations !== undefined ||
      input.services !== undefined ||
      input.products !== undefined ||
      input.hours !== undefined ||
      input.media !== undefined ||
      input.categoryIds !== undefined;

    const businessPatch = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.website !== undefined ? { website: input.website || null } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.whatsapp !== undefined ? { whatsapp: input.whatsapp } : {}),
      ...(input.contactPerson !== undefined ? { contactPerson: input.contactPerson } : {}),
      ...(input.socialLinks !== undefined ? { socialLinks: input.socialLinks as never } : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl || null } : {}),
      ...(input.coverImageUrl !== undefined ? { coverImageUrl: input.coverImageUrl || null } : {}),
      ...(input.listingType !== undefined ? { listingType: input.listingType } : {}),
      ...(input.verificationStatus !== undefined
        ? { verificationStatus: input.verificationStatus }
        : {}),
      ...(input.featured !== undefined ? { featured: input.featured } : {}),
      ...(input.sponsored !== undefined ? { sponsored: input.sponsored } : {}),
      ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
      ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
      ...(input.pricing !== undefined ? { pricing: input.pricing } : {}),
      ...(input.certifications !== undefined ? { certifications: input.certifications as never } : {}),
      ...(input.faqs !== undefined ? { faqs: input.faqs as never } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata as never } : {}),
      updatedBy: actorId,
    };

    const row = hasNested
      ? await this.repos.businesses.replaceNested(id, {
          business: businessPatch,
          categoryIds: input.categoryIds,
          locations: input.locations,
          services: input.services,
          products: input.products,
          hours: input.hours,
          media: input.media?.map((m) => ({
            mediaId: m.mediaId ?? null,
            url: m.url || null,
            kind: m.kind,
            sortOrder: m.sortOrder ?? 0,
            caption: m.caption ?? null,
          })),
        })
      : await this.repos.businesses.update(id, businessPatch);

    await this.audit(actorId, 'directory.listing.update', id, { name: row.name, slug: row.slug });
    await this.bustCache(row.slug);
    return row;
  }

  async publish(id: string, actorId: string) {
    const existing = await this.repos.businesses.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Listing not found.' },
      });
    }
    const row = await this.repos.businesses.publish(id, actorId);
    await this.audit(actorId, 'directory.listing.publish', id, { slug: row.slug });
    await this.bustCache(row.slug);
    void this.searchIndexer.indexBusiness(id);
    return row;
  }

  async unpublish(id: string, actorId: string) {
    const existing = await this.repos.businesses.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Listing not found.' },
      });
    }
    const row = await this.repos.businesses.unpublish(id, actorId);
    await this.audit(actorId, 'directory.listing.unpublish', id, { slug: row.slug });
    await this.bustCache(row.slug);
    void this.searchIndexer.remove('BUSINESS', id);
    return row;
  }

  async verify(id: string, actorId: string, status: 'VERIFIED' | 'REJECTED' | 'PENDING' = 'VERIFIED') {
    const existing = await this.repos.businesses.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Listing not found.' },
      });
    }
    const row = await this.repos.businesses.verify(id, status, actorId);
    await this.audit(actorId, 'directory.listing.verify', id, { verificationStatus: status });
    await this.bustCache(row.slug);
    return row;
  }

  async feature(id: string, actorId: string, featured: boolean) {
    const row = await this.update(id, { featured }, actorId, true);
    await this.audit(actorId, featured ? 'directory.listing.feature' : 'directory.listing.unfeature', id);
    return row;
  }

  async sponsor(id: string, actorId: string, sponsored: boolean) {
    const row = await this.update(
      id,
      { sponsored, listingType: sponsored ? 'SPONSORED' : undefined },
      actorId,
      true,
    );
    await this.audit(actorId, sponsored ? 'directory.listing.sponsor' : 'directory.listing.unsponsor', id);
    return row;
  }

  async remove(id: string, actorId: string, elevated: boolean) {
    const existing = await this.repos.businesses.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Listing not found.' },
      });
    }
    this.assertOwnerOrElevated(existing, actorId, elevated);
    await this.repos.businesses.softDelete(id, actorId);
    await this.audit(actorId, 'directory.listing.delete', id);
    await this.bustCache(existing.slug);
    return { id, deleted: true };
  }

  async bulkPublish(body: DirectoryBulkActionInput, actorId: string) {
    const results = [];
    for (const id of body.ids) {
      results.push(await this.publish(id, actorId));
    }
    return { count: results.length, items: results };
  }

  async bulkDelete(body: DirectoryBulkActionInput, actorId: string) {
    for (const id of body.ids) {
      await this.remove(id, actorId, true);
    }
    return { count: body.ids.length };
  }

  async createLead(input: CreateLeadRequestInput, userId?: string) {
    const businessId = input.listingId ?? input.businessId!;
    const listing = await this.repos.businesses.findById(businessId);
    if (!listing || listing.status !== 'APPROVED') {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Listing not found.' },
      });
    }
    const lead = await this.repos.leadRequests.create({
      business: { connect: { id: businessId } },
      ...(userId ? { user: { connect: { id: userId } } } : {}),
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      message: input.message ?? null,
      leadType: input.leadType,
    });
    await this.repos.directoryEvents.create({
      businessId,
      eventType: 'LEAD_REQUEST',
      metadata: { leadId: lead.id, leadType: input.leadType },
    });
    return lead;
  }

  listLeads(query: CursorPaginationQuery & { status?: string; businessId?: string }) {
    return this.repos.leadRequests.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      status: query.status as never,
      businessId: query.businessId,
    });
  }

  async updateLeadStatus(id: string, input: UpdateLeadStatusInput, actorId: string) {
    const existing = await this.repos.leadRequests.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Lead not found.' },
      });
    }
    const row = await this.repos.leadRequests.updateStatus(id, input.status);
    await this.audit(actorId, 'directory.lead.update', id, { status: input.status });
    return row;
  }

  async trackEvent(listingId: string | null, input: DirectoryTrackEventInput) {
    if (listingId && input.eventType === 'VIEW') {
      await this.repos.businesses.incrementViews(listingId).catch(() => undefined);
    }
    return this.repos.directoryEvents.create({
      businessId: listingId,
      eventType: input.eventType,
      metadata: input.metadata as never,
    });
  }

  async analytics() {
    const cached = await this.cache.get('directory:analytics');
    if (cached) return cached as Awaited<ReturnType<typeof this.repos.businesses.analytics>>;
    const [data, sponsoredPerformance, leadConversion] = await Promise.all([
      this.repos.businesses.analytics(),
      this.repos.businesses.sponsoredPerformance(),
      this.repos.businesses.leadConversionRate(),
    ]);
    const merged = { ...data, sponsoredPerformance, leadConversion };
    await this.cache.set('directory:analytics', merged, CACHE_TTL);
    return merged;
  }

  mapMarkers(query: { city?: string; category?: string; limit?: number }) {
    return this.repos.businesses.mapMarkers({
      city: query.city,
      categorySlug: query.category,
      limit: query.limit,
    });
  }

  listVerificationQueue(query: CursorPaginationQuery) {
    return this.repos.businesses.listVerificationQueue(query);
  }

  async getRelated(slug: string) {
    const listing = await this.getBySlug(slug, true);
    const categoryId = listing.categories[0]?.categoryId;

    const [userReviewSummary, userReviews, editorialReviews, comparisons, relatedBusinesses, nearby] =
      await Promise.all([
        this.repos.userReviews.entityRatingSummary(DIRECTORY_ENTITY, listing.id),
        this.repos.userReviews.listByEntity(DIRECTORY_ENTITY, listing.id, { limit: 5 }),
        this.repos.reviews.list({ entityType: DIRECTORY_ENTITY, entityId: listing.id, limit: 5, status: 'PUBLISHED' }),
        this.repos.comparisons.findByEntity(DIRECTORY_ENTITY, listing.id, 5),
        categoryId
          ? this.repos.businesses.relatedInCategory(listing.id, categoryId, 6)
          : Promise.resolve([]),
        this.nearby(slug),
      ]);

    return {
      listing: { id: listing.id, name: listing.name, slug: listing.slug },
      ratingSummary: userReviewSummary,
      userReviews: userReviews.items,
      editorialReviews: editorialReviews.items,
      comparisons,
      relatedBusinesses,
      nearby: nearby.items,
    };
  }

  async exportCsv() {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = await this.repos.businesses.exportRows();
    return [
      'id,name,slug,description,phone,email,website,city,state,country,status,featured,sponsored,verificationStatus,listingType',
      ...rows.map((r) =>
        [
          r.id,
          r.name,
          r.slug,
          r.description,
          r.phone,
          r.email,
          r.website,
          r.city,
          r.state,
          r.country,
          r.status,
          r.featured,
          r.sponsored,
          r.verificationStatus,
          r.listingType,
        ]
          .map(esc)
          .join(','),
      ),
    ].join('\n');
  }

  async importCsv(csvText: string, actorId: string) {
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      throw new BadRequestException({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'CSV must include a header row and at least one data row.' },
      });
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
    let updated = 0;
    for (const row of rows) {
      if (!row.name || !row.slug) continue;
      const existing = await this.repos.businesses.findBySlug(row.slug);
      const payload = {
        name: row.name,
        slug: row.slug,
        description: row.description || null,
        phone: row.phone || null,
        email: row.email || null,
        website: row.website || null,
        status: (row.status as 'PENDING' | 'APPROVED') || 'PENDING',
        featured: row.featured === 'true',
        sponsored: row.sponsored === 'true',
        listingType: (row.listingType as 'FREE' | 'SPONSORED' | 'VERIFIED') || 'FREE',
        updatedBy: actorId,
      };

      if (existing) {
        await this.repos.businesses.update(existing.id, payload);
        if (row.city) {
          await this.repos.businesses.replaceNested(existing.id, {
            business: payload,
            locations: [
              {
                address1: row.city,
                city: row.city,
                state: row.state || null,
                country: row.country || 'India',
              },
            ],
          });
        }
        updated += 1;
      } else {
        await this.repos.businesses.create({
          ...payload,
          owner: { connect: { id: actorId } },
          ...(row.city
            ? {
                locations: {
                  create: [{ address1: row.city, city: row.city, state: row.state || null, country: row.country || 'India' }],
                },
              }
            : {}),
          createdBy: actorId,
        });
        imported += 1;
      }
    }
    await this.bustCache();
    await this.audit(actorId, 'directory.import', actorId, { imported, updated });
    return { imported, updated };
  }

  history(id: string) {
    return this.repos.auditLogs.list({ entity: 'directory_listing', entityId: id, limit: 50, direction: 'desc' });
  }

  async nearby(slug: string, limit = 8) {
    const listing = await this.getBySlug(slug, true);
    const primary = listing.locations[0];
    if (!primary?.city) return { items: [] };
    const page = await this.repos.businesses.list({
      limit,
      city: primary.city,
      status: 'APPROVED',
    });
    return {
      items: page.items.filter((item) => item.id !== listing.id),
    };
  }
}
