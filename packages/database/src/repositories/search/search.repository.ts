import { Prisma, type PrismaClient, type SearchEntityType, type PublishStatus } from '@prisma/client';
import { BaseRepository } from '../base.repository';
import {
  decodeCursor,
  encodeCursor,
  normalizeLimit,
  toCursorPayload,
} from '../../pagination';

const REINDEX_BATCH = 1000;

export type SearchIndexUpsertInput = {
  entityType: SearchEntityType;
  entityId: string;
  title: string;
  summary?: string | null;
  content?: string | null;
  keywords?: string | null;
  tags?: string | null;
  slug: string;
  url: string;
  thumbnail?: string | null;
  category?: string | null;
  location?: string | null;
  author?: string | null;
  brand?: string | null;
  priceMin?: number | string | null;
  priceMax?: number | string | null;
  vehicleType?: string | null;
  fuelType?: string | null;
  loanType?: string | null;
  materialType?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  language?: string;
  status?: PublishStatus;
  featured?: boolean;
  sponsored?: boolean;
  verified?: boolean;
  rating?: number | null;
  viewCount?: number;
  publishedAt?: Date | null;
};

export type SearchHit = {
  id: string;
  entity_type: SearchEntityType;
  entity_id: string;
  title: string;
  summary: string | null;
  slug: string;
  url: string;
  thumbnail: string | null;
  category: string | null;
  location: string | null;
  author: string | null;
  brand: string | null;
  tags: string | null;
  language: string;
  status: PublishStatus;
  featured: boolean;
  sponsored: boolean;
  verified: boolean;
  rating: number | null;
  view_count: number;
  published_at: Date | null;
  created_at: Date;
  seo_title: string | null;
  seo_description: string | null;
  rank: number;
  headline: string | null;
};

export type SearchPage = {
  items: SearchHit[];
  nextCursor: string | null;
  hasMore: boolean;
};

function toDecimal(value: number | string | null | undefined): Prisma.Decimal | null {
  if (value === null || value === undefined || value === '') return null;
  return new Prisma.Decimal(value);
}

function authorLabel(user?: {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
} | null): string | null {
  if (!user) return null;
  if (user.displayName?.trim()) return user.displayName.trim();
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (name) return name;
  return user.email ?? null;
}

export class SearchIndexRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  upsert(data: SearchIndexUpsertInput) {
    const create = {
      entityType: data.entityType,
      entityId: data.entityId,
      title: data.title,
      summary: data.summary ?? null,
      content: data.content ?? null,
      keywords: data.keywords ?? null,
      tags: data.tags ?? null,
      slug: data.slug,
      url: data.url,
      thumbnail: data.thumbnail ?? null,
      category: data.category ?? null,
      location: data.location ?? null,
      author: data.author ?? null,
      brand: data.brand ?? null,
      priceMin: toDecimal(data.priceMin),
      priceMax: toDecimal(data.priceMax),
      vehicleType: data.vehicleType ?? null,
      fuelType: data.fuelType ?? null,
      loanType: data.loanType ?? null,
      materialType: data.materialType ?? null,
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
      language: data.language ?? 'en',
      status: data.status ?? 'PUBLISHED',
      featured: data.featured ?? false,
      sponsored: data.sponsored ?? false,
      verified: data.verified ?? false,
      rating: data.rating ?? null,
      viewCount: data.viewCount ?? 0,
      publishedAt: data.publishedAt ?? null,
    };

    return this.db.searchIndex.upsert({
      where: {
        entityType_entityId: {
          entityType: data.entityType,
          entityId: data.entityId,
        },
      },
      create,
      update: {
        title: create.title,
        summary: create.summary,
        content: create.content,
        keywords: create.keywords,
        tags: create.tags,
        slug: create.slug,
        url: create.url,
        thumbnail: create.thumbnail,
        category: create.category,
        location: create.location,
        author: create.author,
        brand: create.brand,
        priceMin: create.priceMin,
        priceMax: create.priceMax,
        vehicleType: create.vehicleType,
        fuelType: create.fuelType,
        loanType: create.loanType,
        materialType: create.materialType,
        seoTitle: create.seoTitle,
        seoDescription: create.seoDescription,
        language: create.language,
        status: create.status,
        featured: create.featured,
        sponsored: create.sponsored,
        verified: create.verified,
        rating: create.rating,
        viewCount: create.viewCount,
        publishedAt: create.publishedAt,
      },
    });
  }

  async remove(entityType: SearchEntityType, entityId: string) {
    await this.db.searchIndex.deleteMany({ where: { entityType, entityId } });
  }

  async clearModule(entityTypes: SearchEntityType[]) {
    await this.db.searchIndex.deleteMany({ where: { entityType: { in: entityTypes } } });
  }

  count(where: Prisma.SearchIndexWhereInput = {}) {
    return this.db.searchIndex.count({ where });
  }

  countsByType() {
    return this.db.searchIndex.groupBy({
      by: ['entityType'],
      _count: { _all: true },
    });
  }

  async reindexModule(mod: string): Promise<number> {
    switch (mod) {
      case 'cms':
        return this.reindexCms();
      case 'finance':
        return this.reindexFinance();
      case 'construction':
        return this.reindexConstruction();
      case 'automobile':
        return this.reindexAutomobile();
      case 'directory':
        return this.reindexDirectory();
      case 'ai-tools':
        return this.reindexAiTools();
      case 'calculators':
        return this.reindexCalculators();
      case 'reviews':
        return this.reindexReviews();
      case 'comparisons':
        return this.reindexComparisons();
      case 'media':
        return this.reindexMedia();
      case 'guides':
        return this.reindexGuides();
      default:
        return 0;
    }
  }

  /** Page through a table in batches of REINDEX_BATCH until exhausted. */
  private async forEachBatch<T extends { id: string }>(
    fetch: (args: { take: number; skip: number }) => Promise<T[]>,
    handle: (row: T) => Promise<void>,
  ): Promise<number> {
    let n = 0;
    let skip = 0;
    for (;;) {
      const rows = await fetch({ take: REINDEX_BATCH, skip });
      if (!rows.length) break;
      for (const row of rows) {
        await handle(row);
        n++;
      }
      if (rows.length < REINDEX_BATCH) break;
      skip += REINDEX_BATCH;
    }
    return n;
  }

  private async reindexCms() {
    let n = 0;
    n += await this.forEachBatch(
      ({ take, skip }) =>
        this.db.article.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            content: true,
            publishedAt: true,
            isFeatured: true,
            author: {
              select: { displayName: true, firstName: true, lastName: true, email: true },
            },
            tags: { select: { tag: { select: { name: true } } } },
            category: { select: { name: true } },
          },
        }),
      async (a) => {
        const tagNames = a.tags.map((t) => t.tag.name).filter(Boolean);
        await this.upsert({
          entityType: 'ARTICLE',
          entityId: a.id,
          title: a.title,
          summary: a.excerpt,
          content: a.content,
          tags: tagNames.length ? tagNames.join(',') : null,
          slug: a.slug,
          url: `/articles/${a.slug}`,
          category: a.category?.name || 'Articles',
          author: authorLabel(a.author),
          featured: a.isFeatured,
          publishedAt: a.publishedAt,
        });
      },
    );

    n += await this.forEachBatch(
      ({ take, skip }) =>
        this.db.page.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: { id: true, title: true, slug: true, publishedAt: true },
        }),
      async (p) => {
        await this.upsert({
          entityType: 'PAGE',
          entityId: p.id,
          title: p.title,
          slug: p.slug,
          url: `/p/${p.slug}`,
          category: 'Pages',
          publishedAt: p.publishedAt,
        });
      },
    );

    n += await this.forEachBatch(
      ({ take, skip }) =>
        this.db.category.findMany({
          where: { deletedAt: null },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: { id: true, name: true, slug: true },
        }),
      async (c) => {
        await this.upsert({
          entityType: 'CMS_CATEGORY',
          entityId: c.id,
          title: c.name,
          slug: c.slug,
          url: `/articles?category=${c.slug}`,
          category: 'Categories',
        });
      },
    );

    n += await this.forEachBatch(
      ({ take, skip }) =>
        this.db.tag.findMany({
          where: { deletedAt: null },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: { id: true, name: true, slug: true, description: true },
        }),
      async (t) => {
        await this.upsert({
          entityType: 'TAG',
          entityId: t.id,
          title: t.name,
          summary: t.description,
          tags: t.name,
          slug: t.slug,
          url: `/articles?tag=${t.slug}`,
          category: 'Tags',
        });
      },
    );

    return n;
  }

  private async reindexGuides() {
    let n = 0;
    n += await this.forEachBatch(
      ({ take, skip }) =>
        this.db.financeGuide.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            title: true,
            slug: true,
            summary: true,
            body: true,
            seoTitle: true,
            seoDescription: true,
            publishedAt: true,
          },
        }),
      async (g) => {
        await this.upsert({
          entityType: 'GUIDE',
          entityId: g.id,
          title: g.title,
          summary: g.summary,
          content: g.body,
          slug: g.slug,
          url: `/finance/guides/${g.slug}`,
          category: 'Finance Guides',
          seoTitle: g.seoTitle,
          seoDescription: g.seoDescription,
          publishedAt: g.publishedAt,
        });
      },
    );

    n += await this.forEachBatch(
      ({ take, skip }) =>
        this.db.constructionGuide.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            title: true,
            slug: true,
            summary: true,
            body: true,
            seoTitle: true,
            seoDescription: true,
            publishedAt: true,
          },
        }),
      async (g) => {
        await this.upsert({
          entityType: 'GUIDE',
          entityId: g.id,
          title: g.title,
          summary: g.summary,
          content: g.body,
          slug: g.slug,
          url: `/construction/guides/${g.slug}`,
          category: 'Construction Guides',
          seoTitle: g.seoTitle,
          seoDescription: g.seoDescription,
          publishedAt: g.publishedAt,
        });
      },
    );

    n += await this.forEachBatch(
      ({ take, skip }) =>
        this.db.automobileGuide.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            title: true,
            slug: true,
            summary: true,
            body: true,
            seoTitle: true,
            seoDescription: true,
            publishedAt: true,
          },
        }),
      async (g) => {
        await this.upsert({
          entityType: 'GUIDE',
          entityId: g.id,
          title: g.title,
          summary: g.summary,
          content: g.body,
          slug: g.slug,
          url: `/automobile/guides/${g.slug}`,
          category: 'Automobile Guides',
          seoTitle: g.seoTitle,
          seoDescription: g.seoDescription,
          publishedAt: g.publishedAt,
        });
      },
    );

    return n;
  }

  private async reindexFinance() {
    let n = 0;
    n += await this.forEachBatch(
      ({ take, skip }) =>
        this.db.bank.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: { id: true, name: true, slug: true, description: true },
        }),
      async (b) => {
        await this.upsert({
          entityType: 'BANK',
          entityId: b.id,
          title: b.name,
          summary: b.description,
          slug: b.slug,
          url: `/finance/banks/${b.slug}`,
          category: 'Banks',
        });
      },
    );

    n += await this.forEachBatch(
      ({ take, skip }) =>
        this.db.loan.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            loanType: true,
            maxAmount: true,
            featured: true,
            seoTitle: true,
            seoDescription: true,
            publishedAt: true,
            bank: { select: { name: true } },
          },
        }),
      async (loan) => {
        await this.upsert({
          entityType: 'LOAN',
          entityId: loan.id,
          title: loan.name,
          summary: loan.description,
          slug: loan.slug || loan.id,
          url: `/finance/loans/${loan.id}`,
          category: 'Loans',
          loanType: loan.loanType,
          brand: loan.bank?.name ?? null,
          priceMax: loan.maxAmount != null ? Number(loan.maxAmount) : null,
          featured: loan.featured,
          seoTitle: loan.seoTitle,
          seoDescription: loan.seoDescription,
          publishedAt: loan.publishedAt,
        });
      },
    );

    n += await this.forEachBatch(
      ({ take, skip }) =>
        this.db.creditCard.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            annualFee: true,
            featured: true,
            seoTitle: true,
            seoDescription: true,
            publishedAt: true,
            bank: { select: { name: true } },
          },
        }),
      async (card) => {
        await this.upsert({
          entityType: 'CREDIT_CARD',
          entityId: card.id,
          title: card.name,
          summary: card.description,
          slug: card.slug || card.id,
          url: `/finance/credit-cards/${card.id}`,
          category: 'Credit Cards',
          brand: card.bank?.name ?? null,
          priceMin: card.annualFee != null ? Number(card.annualFee) : null,
          featured: card.featured,
          seoTitle: card.seoTitle,
          seoDescription: card.seoDescription,
          publishedAt: card.publishedAt,
        });
      },
    );

    n += await this.forEachBatch(
      ({ take, skip }) =>
        this.db.insuranceProduct.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            seoDescription: true,
            coverage: true,
            premium: true,
            publishedAt: true,
          },
        }),
      async (item) => {
        await this.upsert({
          entityType: 'INSURANCE',
          entityId: item.id,
          title: item.name,
          summary: item.seoDescription || item.coverage,
          slug: item.slug || item.id,
          url: `/finance/insurance/${item.id}`,
          category: 'Insurance',
          priceMin: item.premium != null ? Number(item.premium) : null,
          publishedAt: item.publishedAt,
        });
      },
    );

    n += await this.reindexGuidesFinanceOnly();
    return n;
  }

  private async reindexGuidesFinanceOnly() {
    return this.forEachBatch(
      ({ take, skip }) =>
        this.db.financeGuide.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            title: true,
            slug: true,
            summary: true,
            body: true,
            seoTitle: true,
            seoDescription: true,
            publishedAt: true,
          },
        }),
      async (g) => {
        await this.upsert({
          entityType: 'GUIDE',
          entityId: g.id,
          title: g.title,
          summary: g.summary,
          content: g.body,
          slug: g.slug,
          url: `/finance/guides/${g.slug}`,
          category: 'Finance Guides',
          seoTitle: g.seoTitle,
          seoDescription: g.seoDescription,
          publishedAt: g.publishedAt,
        });
      },
    );
  }

  private async reindexConstruction() {
    let n = 0;
    n += await this.forEachBatch(
      ({ take, skip }) =>
        this.db.constructionMaterial.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            approximatePrice: true,
            unitCost: true,
            rating: true,
            featured: true,
            sponsored: true,
            seoTitle: true,
            seoDescription: true,
            publishedAt: true,
            brand: { select: { name: true } },
            category: { select: { name: true, slug: true } },
          },
        }),
      async (m) => {
        const price =
          m.approximatePrice != null
            ? Number(m.approximatePrice)
            : m.unitCost != null
              ? Number(m.unitCost)
              : null;
        await this.upsert({
          entityType: 'MATERIAL',
          entityId: m.id,
          title: m.name,
          summary: m.description,
          slug: m.slug || m.id,
          url: `/construction/materials/${m.id}`,
          category: m.category?.name || 'Materials',
          brand: m.brand?.name ?? null,
          materialType: m.category?.slug || m.category?.name || null,
          priceMin: price,
          priceMax: price,
          rating: m.rating != null ? Number(m.rating) : null,
          featured: m.featured,
          sponsored: m.sponsored,
          seoTitle: m.seoTitle,
          seoDescription: m.seoDescription,
          publishedAt: m.publishedAt,
        });
      },
    );

    n += await this.forEachBatch(
      ({ take, skip }) =>
        this.db.constructionBrand.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: { id: true, name: true, slug: true, description: true },
        }),
      async (b) => {
        await this.upsert({
          entityType: 'BRAND',
          entityId: b.id,
          title: b.name,
          summary: b.description,
          slug: b.slug,
          url: `/construction/brands/${b.slug}`,
          category: 'Brands',
          brand: b.name,
        });
      },
    );

    n += await this.forEachBatch(
      ({ take, skip }) =>
        this.db.constructionGuide.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            title: true,
            slug: true,
            summary: true,
            body: true,
            seoTitle: true,
            seoDescription: true,
            publishedAt: true,
          },
        }),
      async (g) => {
        await this.upsert({
          entityType: 'GUIDE',
          entityId: g.id,
          title: g.title,
          summary: g.summary,
          content: g.body,
          slug: g.slug,
          url: `/construction/guides/${g.slug}`,
          category: 'Construction Guides',
          seoTitle: g.seoTitle,
          seoDescription: g.seoDescription,
          publishedAt: g.publishedAt,
        });
      },
    );

    return n;
  }

  private async reindexAutomobile() {
    let n = 0;
    n += await this.forEachBatch(
      ({ take, skip }) =>
        this.db.automobileManufacturer.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: { id: true, name: true, slug: true, description: true },
        }),
      async (m) => {
        await this.upsert({
          entityType: 'MANUFACTURER',
          entityId: m.id,
          title: m.name,
          summary: m.description,
          slug: m.slug,
          url: `/automobile/manufacturers/${m.slug}`,
          category: 'Manufacturers',
          brand: m.name,
        });
      },
    );

    n += await this.forEachBatch(
      ({ take, skip }) =>
        this.db.automobileVehicle.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            category: true,
            bodyType: true,
            fuelType: true,
            exShowroomPrice: true,
            estimatedOnRoadPrice: true,
            expertRating: true,
            featured: true,
            sponsored: true,
            imageUrl: true,
            seoTitle: true,
            seoDescription: true,
            publishedAt: true,
            manufacturer: { select: { name: true } },
          },
        }),
      async (v) => {
        await this.upsert({
          entityType: 'VEHICLE',
          entityId: v.id,
          title: v.name,
          summary: v.description,
          slug: v.slug,
          url: `/automobile/vehicles/${v.slug}`,
          category: v.category || 'Vehicles',
          brand: v.manufacturer?.name ?? null,
          vehicleType: v.bodyType || v.category || null,
          fuelType: v.fuelType,
          priceMin: v.exShowroomPrice != null ? Number(v.exShowroomPrice) : null,
          priceMax: v.estimatedOnRoadPrice != null ? Number(v.estimatedOnRoadPrice) : null,
          rating: v.expertRating != null ? Number(v.expertRating) : null,
          featured: v.featured,
          sponsored: v.sponsored,
          thumbnail: v.imageUrl,
          seoTitle: v.seoTitle,
          seoDescription: v.seoDescription,
          publishedAt: v.publishedAt,
        });
      },
    );

    // No AutomobileDealer model — map directory businesses whose category slug contains "dealer"
    n += await this.forEachBatch(
      ({ take, skip }) =>
        this.db.business.findMany({
          where: {
            deletedAt: null,
            status: 'APPROVED',
            categories: {
              some: {
                category: {
                  OR: [
                    { slug: { contains: 'dealer', mode: 'insensitive' } },
                    { name: { contains: 'dealer', mode: 'insensitive' } },
                  ],
                },
              },
            },
          },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            verificationStatus: true,
            featured: true,
            sponsored: true,
            seoTitle: true,
            seoDescription: true,
            publishedAt: true,
            locations: {
              where: { deletedAt: null },
              take: 1,
              select: { city: true, state: true, country: true },
            },
            categories: { select: { category: { select: { name: true } } } },
          },
        }),
      async (b) => {
        const loc = b.locations[0];
        const location = loc
          ? [loc.city, loc.state, loc.country].filter(Boolean).join(', ')
          : null;
        await this.upsert({
          entityType: 'DEALER',
          entityId: b.id,
          title: b.name,
          summary: b.description,
          slug: b.slug,
          url: `/directory/${b.slug}`,
          category: b.categories[0]?.category.name || 'Dealers',
          location,
          verified: b.verificationStatus === 'VERIFIED',
          featured: b.featured,
          sponsored: b.sponsored,
          seoTitle: b.seoTitle,
          seoDescription: b.seoDescription,
          publishedAt: b.publishedAt,
        });
      },
    );

    n += await this.forEachBatch(
      ({ take, skip }) =>
        this.db.automobileGuide.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            title: true,
            slug: true,
            summary: true,
            body: true,
            seoTitle: true,
            seoDescription: true,
            publishedAt: true,
          },
        }),
      async (g) => {
        await this.upsert({
          entityType: 'GUIDE',
          entityId: g.id,
          title: g.title,
          summary: g.summary,
          content: g.body,
          slug: g.slug,
          url: `/automobile/guides/${g.slug}`,
          category: 'Automobile Guides',
          seoTitle: g.seoTitle,
          seoDescription: g.seoDescription,
          publishedAt: g.publishedAt,
        });
      },
    );

    return n;
  }

  private async reindexDirectory() {
    let n = 0;
    n += await this.forEachBatch(
      ({ take, skip }) =>
        this.db.business.findMany({
          where: { deletedAt: null, status: 'APPROVED' },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            verificationStatus: true,
            featured: true,
            sponsored: true,
            seoTitle: true,
            seoDescription: true,
            publishedAt: true,
            viewCount: true,
            locations: {
              where: { deletedAt: null },
              take: 1,
              select: { city: true, state: true, country: true },
            },
            categories: { select: { category: { select: { name: true } } } },
          },
        }),
      async (b) => {
        const loc = b.locations[0];
        const location = loc
          ? [loc.city, loc.state, loc.country].filter(Boolean).join(', ')
          : null;
        await this.upsert({
          entityType: 'BUSINESS',
          entityId: b.id,
          title: b.name,
          summary: b.description,
          slug: b.slug,
          url: `/directory/${b.slug}`,
          category: b.categories[0]?.category.name || 'Directory',
          location,
          verified: b.verificationStatus === 'VERIFIED',
          featured: b.featured,
          sponsored: b.sponsored,
          seoTitle: b.seoTitle,
          seoDescription: b.seoDescription,
          publishedAt: b.publishedAt,
          viewCount: b.viewCount,
        });
      },
    );

    n += await this.forEachBatch(
      ({ take, skip }) =>
        this.db.businessService.findMany({
          where: { deletedAt: null, business: { deletedAt: null, status: 'APPROVED' } },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            business: { select: { slug: true, name: true } },
          },
        }),
      async (s) => {
        await this.upsert({
          entityType: 'BUSINESS_SERVICE',
          entityId: s.id,
          title: s.name,
          summary: s.description,
          slug: `${s.business.slug}-${s.id}`,
          url: `/directory/${s.business.slug}`,
          category: 'Services',
          brand: s.business.name,
        });
      },
    );

    return n;
  }

  private async reindexAiTools() {
    let n = 0;
    const vendorIds = new Set<string>();

    n += await this.forEachBatch(
      ({ take, skip }) =>
        this.db.aiTool.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            shortDescription: true,
            featured: true,
            sponsored: true,
            seoTitle: true,
            seoDescription: true,
            publishedAt: true,
            category: { select: { name: true } },
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                verificationStatus: true,
                featured: true,
                seoTitle: true,
                seoDescription: true,
                publishedAt: true,
              },
            },
          },
        }),
      async (t) => {
        await this.upsert({
          entityType: 'AI_TOOL',
          entityId: t.id,
          title: t.name,
          summary: t.shortDescription || t.description,
          slug: t.slug,
          url: `/ai-tools/${t.slug}`,
          category: t.category?.name || 'AI Tools',
          brand: t.company?.name ?? null,
          featured: t.featured,
          sponsored: t.sponsored,
          seoTitle: t.seoTitle,
          seoDescription: t.seoDescription,
          publishedAt: t.publishedAt,
        });

        if (t.company && !vendorIds.has(t.company.id)) {
          vendorIds.add(t.company.id);
          await this.upsert({
            entityType: 'VENDOR',
            entityId: t.company.id,
            title: t.company.name,
            summary: t.company.description,
            slug: t.company.slug,
            url: `/directory/${t.company.slug}`,
            category: 'AI Vendors',
            brand: t.company.name,
            verified: t.company.verificationStatus === 'VERIFIED',
            featured: t.company.featured,
            seoTitle: t.company.seoTitle,
            seoDescription: t.company.seoDescription,
            publishedAt: t.company.publishedAt,
          });
          n++;
        }
      },
    );

    n += await this.forEachBatch(
      ({ take, skip }) =>
        this.db.aiCategory.findMany({
          where: { deletedAt: null },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: { id: true, name: true, slug: true, description: true },
        }),
      async (c) => {
        await this.upsert({
          entityType: 'AI_CATEGORY',
          entityId: c.id,
          title: c.name,
          summary: c.description,
          slug: c.slug,
          url: `/ai-tools/${c.slug}`,
          category: 'AI Categories',
        });
      },
    );

    return n;
  }

  private async reindexCalculators() {
    let n = 0;
    n += await this.forEachBatch(
      ({ take, skip }) =>
        this.db.calculator.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            formula: true,
            seoTitle: true,
            seoDescription: true,
            publishedAt: true,
            category: { select: { name: true } },
          },
        }),
      async (c) => {
        await this.upsert({
          entityType: 'CALCULATOR',
          entityId: c.id,
          title: c.name,
          summary: c.description,
          content: c.formula,
          slug: c.slug,
          url: `/calculators/${c.slug}`,
          category: c.category?.name || 'Calculators',
          seoTitle: c.seoTitle,
          seoDescription: c.seoDescription,
          publishedAt: c.publishedAt,
        });

        if (c.formula?.trim()) {
          await this.upsert({
            entityType: 'FORMULA_PAGE',
            entityId: c.id,
            title: `${c.name} Formula`,
            summary: c.description,
            content: c.formula,
            keywords: c.formula,
            slug: `${c.slug}-formula`,
            url: `/calculators/${c.slug}#formula`,
            category: 'Formula Pages',
            seoTitle: c.seoTitle,
            seoDescription: c.seoDescription,
            publishedAt: c.publishedAt,
          });
          n++;
        }
      },
    );
    return n;
  }

  private async reindexReviews() {
    return this.forEachBatch(
      ({ take, skip }) =>
        this.db.review.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            title: true,
            slug: true,
            overallScore: true,
            summary: true,
            publishedAt: true,
            author: {
              select: { displayName: true, firstName: true, lastName: true, email: true },
            },
          },
        }),
      async (r) => {
        await this.upsert({
          entityType: 'REVIEW',
          entityId: r.id,
          title: r.title,
          summary: r.summary,
          slug: r.slug,
          url: `/reviews/${r.slug}`,
          category: 'Reviews',
          author: authorLabel(r.author),
          rating: r.overallScore != null ? Number(r.overallScore) : null,
          publishedAt: r.publishedAt,
        });
      },
    );
  }

  private async reindexComparisons() {
    return this.forEachBatch(
      ({ take, skip }) =>
        this.db.comparison.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: { id: true, title: true, slug: true, description: true, publishedAt: true },
        }),
      async (c) => {
        await this.upsert({
          entityType: 'COMPARISON',
          entityId: c.id,
          title: c.title,
          summary: c.description,
          slug: c.slug,
          url: `/compare/${c.slug}`,
          category: 'Comparisons',
          publishedAt: c.publishedAt,
        });
      },
    );
  }

  private async reindexMedia() {
    return this.forEachBatch(
      ({ take, skip }) =>
        this.db.mediaAsset.findMany({
          where: { deletedAt: null },
          take,
          skip,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            fileName: true,
            originalName: true,
            alt: true,
            description: true,
            url: true,
          },
        }),
      async (m) => {
        const title = m.originalName || m.fileName || m.id;
        await this.upsert({
          entityType: 'MEDIA',
          entityId: m.id,
          title,
          summary: m.alt || m.description,
          slug: m.id,
          url: m.url || `/media/${m.id}`,
          category: 'Media',
          thumbnail: m.url,
        });
      },
    );
  }

  async search(params: {
    q?: string;
    entityTypes?: SearchEntityType[];
    category?: string;
    language?: string;
    location?: string;
    author?: string;
    publishedFrom?: Date;
    publishedTo?: Date;
    tags?: string;
    minRating?: number;
    priceMin?: number;
    priceMax?: number;
    brand?: string;
    vehicleType?: string;
    fuelType?: string;
    loanType?: string;
    materialType?: string;
    featured?: boolean;
    sponsored?: boolean;
    verified?: boolean;
    sort?: string;
    limit: number;
    cursor?: string | null;
  }): Promise<SearchPage> {
    const limit = normalizeLimit(params.limit, 20);
    const capped = Math.min(limit, 50);
    const q = params.q?.trim() ?? '';
    const conditions: Prisma.Sql[] = [Prisma.sql`status = 'PUBLISHED'::"publish_status"`];

    if (params.entityTypes?.length) {
      conditions.push(
        Prisma.sql`entity_type::text IN (${Prisma.join(params.entityTypes.map((t) => Prisma.sql`${t}`))})`,
      );
    }
    if (params.category) {
      conditions.push(Prisma.sql`category ILIKE ${`%${params.category}%`}`);
    }
    if (params.language) {
      conditions.push(Prisma.sql`language = ${params.language}`);
    }
    if (params.location) {
      conditions.push(Prisma.sql`location ILIKE ${`%${params.location}%`}`);
    }
    if (params.author) {
      conditions.push(Prisma.sql`author ILIKE ${`%${params.author}%`}`);
    }
    if (params.publishedFrom) {
      conditions.push(Prisma.sql`published_at >= ${params.publishedFrom}`);
    }
    if (params.publishedTo) {
      conditions.push(Prisma.sql`published_at <= ${params.publishedTo}`);
    }
    if (params.tags) {
      const tagParts = params.tags
        .split(/[,\s]+/)
        .map((t) => t.trim())
        .filter(Boolean);
      for (const tag of tagParts) {
        conditions.push(Prisma.sql`tags ILIKE ${`%${tag}%`}`);
      }
    }
    if (params.minRating !== undefined) {
      conditions.push(Prisma.sql`rating >= ${params.minRating}`);
    }
    // Overlapping price ranges: document [price_min, price_max] intersects filter
    if (params.priceMin !== undefined) {
      conditions.push(Prisma.sql`(price_max IS NULL OR price_max >= ${params.priceMin})`);
    }
    if (params.priceMax !== undefined) {
      conditions.push(Prisma.sql`(price_min IS NULL OR price_min <= ${params.priceMax})`);
    }
    if (params.brand) {
      conditions.push(Prisma.sql`brand ILIKE ${`%${params.brand}%`}`);
    }
    if (params.vehicleType) {
      conditions.push(Prisma.sql`vehicle_type ILIKE ${`%${params.vehicleType}%`}`);
    }
    if (params.fuelType) {
      conditions.push(Prisma.sql`fuel_type ILIKE ${`%${params.fuelType}%`}`);
    }
    if (params.loanType) {
      conditions.push(Prisma.sql`loan_type ILIKE ${`%${params.loanType}%`}`);
    }
    if (params.materialType) {
      conditions.push(Prisma.sql`material_type ILIKE ${`%${params.materialType}%`}`);
    }
    if (params.featured !== undefined) {
      conditions.push(Prisma.sql`featured = ${params.featured}`);
    }
    if (params.sponsored !== undefined) {
      conditions.push(Prisma.sql`sponsored = ${params.sponsored}`);
    }
    if (params.verified !== undefined) {
      conditions.push(Prisma.sql`verified = ${params.verified}`);
    }

    // Cursor keyset on (created_at, id) — direction follows newest/oldest; otherwise DESC
    const cursorAsc = params.sort === 'oldest';
    if (params.cursor) {
      const { id, createdAt } = decodeCursor(params.cursor);
      const createdAtDate = new Date(createdAt);
      if (cursorAsc) {
        conditions.push(
          Prisma.sql`(created_at > ${createdAtDate} OR (created_at = ${createdAtDate} AND id > ${id}::uuid))`,
        );
      } else {
        conditions.push(
          Prisma.sql`(created_at < ${createdAtDate} OR (created_at = ${createdAtDate} AND id < ${id}::uuid))`,
        );
      }
    }

    let rankExpr = Prisma.sql`0::float`;
    let headlineExpr = Prisma.sql`NULL::text`;
    if (q) {
      conditions.push(
        Prisma.sql`(
          search_vector @@ plainto_tsquery('english', ${q})
          OR title ILIKE ${`%${q}%`}
          OR summary ILIKE ${`%${q}%`}
          OR keywords ILIKE ${`%${q}%`}
          OR tags ILIKE ${`%${q}%`}
          OR brand ILIKE ${`%${q}%`}
          OR location ILIKE ${`%${q}%`}
          OR author ILIKE ${`%${q}%`}
        )`,
      );
      rankExpr = Prisma.sql`ts_rank(search_vector, plainto_tsquery('english', ${q}))`;
      headlineExpr = Prisma.sql`ts_headline('english', coalesce(summary, content, title), plainto_tsquery('english', ${q}), 'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15')`;
    }

    const whereSql = conditions.length
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty;

    // Always end with created_at + id so cursor keyset stays stable
    let orderSql = Prisma.sql`ORDER BY featured DESC, sponsored DESC, ${rankExpr} DESC, created_at DESC, id DESC`;
    switch (params.sort) {
      case 'newest':
        orderSql = Prisma.sql`ORDER BY published_at DESC NULLS LAST, created_at DESC, id DESC`;
        break;
      case 'oldest':
        orderSql = Prisma.sql`ORDER BY published_at ASC NULLS LAST, created_at ASC, id ASC`;
        break;
      case 'most_viewed':
      case 'most_popular':
        orderSql = Prisma.sql`ORDER BY view_count DESC, created_at DESC, id DESC`;
        break;
      case 'highest_rated':
        orderSql = Prisma.sql`ORDER BY rating DESC NULLS LAST, created_at DESC, id DESC`;
        break;
      case 'alphabetical':
        orderSql = Prisma.sql`ORDER BY title ASC, created_at DESC, id DESC`;
        break;
      default:
        break;
    }

    const rows = await this.db.$queryRaw<SearchHit[]>`
      SELECT
        id::text,
        entity_type,
        entity_id::text,
        title,
        summary,
        slug,
        url,
        thumbnail,
        category,
        location,
        author,
        brand,
        tags,
        language,
        status,
        featured,
        sponsored,
        verified,
        rating,
        view_count,
        published_at,
        created_at,
        seo_title,
        seo_description,
        ${rankExpr} AS rank,
        ${headlineExpr} AS headline
      FROM search_index
      ${whereSql}
      ${orderSql}
      LIMIT ${capped + 1}
    `;

    const hasMore = rows.length > capped;
    const items = hasMore ? rows.slice(0, capped) : rows;
    const nextCursor =
      hasMore && items.length > 0
        ? encodeCursor(
            toCursorPayload({
              id: items[items.length - 1]!.id,
              createdAt: new Date(items[items.length - 1]!.created_at),
            }),
          )
        : null;

    return { items, nextCursor, hasMore };
  }

  async facets(params: {
    q?: string;
    entityTypes?: SearchEntityType[];
    location?: string;
    brand?: string;
  }) {
    const q = params.q?.trim() ?? '';
    const conditions: Prisma.Sql[] = [Prisma.sql`status = 'PUBLISHED'::"publish_status"`];
    if (params.entityTypes?.length) {
      conditions.push(
        Prisma.sql`entity_type::text IN (${Prisma.join(params.entityTypes.map((t) => Prisma.sql`${t}`))})`,
      );
    }
    if (params.location) {
      conditions.push(Prisma.sql`location ILIKE ${`%${params.location}%`}`);
    }
    if (params.brand) {
      conditions.push(Prisma.sql`brand ILIKE ${`%${params.brand}%`}`);
    }
    if (q) {
      conditions.push(
        Prisma.sql`(
          search_vector @@ plainto_tsquery('english', ${q})
          OR title ILIKE ${`%${q}%`}
        )`,
      );
    }
    const whereSql = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
    const byType = await this.db.$queryRaw<Array<{ entity_type: SearchEntityType; count: bigint }>>`
      SELECT entity_type, COUNT(*)::bigint AS count
      FROM search_index
      ${whereSql}
      GROUP BY entity_type
      ORDER BY count DESC
    `;
    const byCategory = await this.db.$queryRaw<Array<{ category: string | null; count: bigint }>>`
      SELECT category, COUNT(*)::bigint AS count
      FROM search_index
      ${whereSql}
      GROUP BY category
      ORDER BY count DESC
      LIMIT 20
    `;
    return {
      entityTypes: byType.map((r) => ({ entityType: r.entity_type, count: Number(r.count) })),
      categories: byCategory
        .filter((r) => r.category)
        .map((r) => ({ category: r.category!, count: Number(r.count) })),
    };
  }

  autocomplete(q: string, limit = 10) {
    const term = q.trim();
    if (!term) return Promise.resolve([]);
    return this.db.$queryRaw<
      Array<{
        id: string;
        title: string;
        slug: string;
        url: string;
        entity_type: SearchEntityType;
        category: string | null;
      }>
    >`
      SELECT id::text, title, slug, url, entity_type, category
      FROM search_index
      WHERE status = 'PUBLISHED'::"publish_status"
        AND (
          title ILIKE ${`${term}%`}
          OR title ILIKE ${`% ${term}%`}
          OR search_vector @@ plainto_tsquery('english', ${term})
        )
      ORDER BY
        CASE WHEN title ILIKE ${`${term}%`} THEN 0 ELSE 1 END,
        ts_rank(search_vector, plainto_tsquery('english', ${term})) DESC,
        featured DESC
      LIMIT ${limit}
    `;
  }
}

export class SearchQueryRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  create(data: {
    query: string;
    results?: number | null;
    userId?: string | null;
    latencyMs?: number | null;
  }) {
    return this.db.searchQuery.create({
      data: {
        query: data.query,
        results: data.results ?? null,
        userId: data.userId ?? null,
        latencyMs: data.latencyMs ?? null,
      },
    });
  }

  markClicked(id: string) {
    return this.db.searchQuery.update({
      where: { id },
      data: { clicked: true },
    });
  }

  async trackClick(data: {
    queryId?: string | null;
    entityType: SearchEntityType;
    entityId: string;
    url?: string | null;
  }) {
    if (data.queryId) {
      await this.markClicked(data.queryId).catch(() => undefined);
    }
    return this.db.searchResultClick.create({
      data: {
        queryId: data.queryId ?? null,
        entityType: data.entityType,
        entityId: data.entityId,
        url: data.url ?? null,
      },
    });
  }

  async mostClicked(limit = 20, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const rows = await this.db.$queryRaw<
      Array<{
        entity_type: SearchEntityType;
        entity_id: string;
        url: string | null;
        click_count: bigint;
      }>
    >`
      SELECT
        entity_type,
        entity_id::text,
        MAX(url) AS url,
        COUNT(*)::bigint AS click_count
      FROM search_result_clicks
      WHERE created_at >= ${since}
      GROUP BY entity_type, entity_id
      ORDER BY click_count DESC
      LIMIT ${limit}
    `;
    return rows.map((r) => ({
      entityType: r.entity_type,
      entityId: r.entity_id,
      url: r.url,
      count: Number(r.click_count),
    }));
  }

  topQueries(limit = 20) {
    return this.db.searchQuery.groupBy({
      by: ['query'],
      _count: { _all: true },
      orderBy: { _count: { query: 'desc' } },
      take: limit,
    });
  }

  zeroResultQueries(limit = 20) {
    return this.db.searchQuery.findMany({
      where: { results: 0 },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, query: true, createdAt: true, results: true },
    });
  }

  volume(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return this.db.searchQuery.count({ where: { createdAt: { gte: since } } });
  }

  avgLatency() {
    return this.db.searchQuery.aggregate({
      _avg: { latencyMs: true },
      where: { latencyMs: { not: null } },
    });
  }

  clickRate() {
    return this.db.searchQuery
      .aggregate({
        _count: { _all: true },
        where: {},
      })
      .then(async (total) => {
        const clicked = await this.db.searchQuery.count({ where: { clicked: true } });
        return {
          total: total._count._all,
          clicked,
          ctr: total._count._all ? clicked / total._count._all : 0,
        };
      });
  }

  recent(userId: string, limit = 10) {
    return this.db.searchQuery.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      distinct: ['query'],
      select: { query: true, createdAt: true },
    });
  }
}

export class SearchResultClickRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  create(data: {
    queryId?: string | null;
    entityType: SearchEntityType;
    entityId: string;
    url?: string | null;
  }) {
    return this.db.searchResultClick.create({
      data: {
        queryId: data.queryId ?? null,
        entityType: data.entityType,
        entityId: data.entityId,
        url: data.url ?? null,
      },
    });
  }

  async mostClicked(limit = 20, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const rows = await this.db.$queryRaw<
      Array<{
        entity_type: SearchEntityType;
        entity_id: string;
        url: string | null;
        click_count: bigint;
      }>
    >`
      SELECT
        entity_type,
        entity_id::text,
        MAX(url) AS url,
        COUNT(*)::bigint AS click_count
      FROM search_result_clicks
      WHERE created_at >= ${since}
      GROUP BY entity_type, entity_id
      ORDER BY click_count DESC
      LIMIT ${limit}
    `;
    return rows.map((r) => ({
      entityType: r.entity_type,
      entityId: r.entity_id,
      url: r.url,
      count: Number(r.click_count),
    }));
  }
}

export class PopularSearchRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  async increment(keyword: string) {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return null;
    return this.db.popularSearch.upsert({
      where: { keyword: normalized },
      create: { keyword: normalized, searchCount: 1 },
      update: { searchCount: { increment: 1 } },
    });
  }

  top(limit = 10) {
    return this.db.popularSearch.findMany({
      orderBy: { searchCount: 'desc' },
      take: limit,
    });
  }

  trending(limit = 10) {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    return this.db.popularSearch.findMany({
      where: { updatedAt: { gte: since } },
      orderBy: { searchCount: 'desc' },
      take: limit,
    });
  }
}
