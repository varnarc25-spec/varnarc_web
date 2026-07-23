import type { Prisma, PrismaClient } from '@prisma/client';
import { BaseRepository } from '../base.repository';

export class SeoMetadataRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findByEntity(entityType: string, entityId: string) {
    return this.db.seoMetadata.findUnique({
      where: { entityType_entityId: { entityType, entityId } },
    });
  }

  list(params: { entityType?: string; search?: string; cursor?: string; limit?: number }) {
    const limit = Math.min(params.limit ?? 25, 100);
    const where: Prisma.SeoMetadataWhereInput = {
      ...(params.entityType ? { entityType: params.entityType } : {}),
      ...(params.search
        ? {
            OR: [
              { title: { contains: params.search, mode: 'insensitive' } },
              { description: { contains: params.search, mode: 'insensitive' } },
              { entityType: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.db.seoMetadata.findMany({
      where,
      take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      orderBy: { updatedAt: 'desc' },
    });
  }

  upsert(
    entityType: string,
    entityId: string,
    data: Omit<Prisma.SeoMetadataCreateInput, 'entityType' | 'entityId'>,
  ) {
    return this.db.seoMetadata.upsert({
      where: { entityType_entityId: { entityType, entityId } },
      create: { entityType, entityId, ...data },
      update: data,
    });
  }

  deleteByEntity(entityType: string, entityId: string) {
    return this.db.seoMetadata.delete({
      where: { entityType_entityId: { entityType, entityId } },
    });
  }
}

export class SeoRedirectRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  list(params: { search?: string; status?: string; cursor?: string; limit?: number }) {
    const limit = Math.min(params.limit ?? 25, 100);
    const where: Prisma.SeoRedirectWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { sourcePath: { contains: params.search, mode: 'insensitive' } },
              { targetPath: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    return this.db.seoRedirect.findMany({
      where,
      take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      orderBy: { updatedAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.db.seoRedirect.findUnique({ where: { id } });
  }

  findActiveBySource(sourcePath: string) {
    return this.db.seoRedirect.findFirst({
      where: { sourcePath, status: 'ACTIVE' },
    });
  }

  listActive() {
    return this.db.seoRedirect.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { sourcePath: 'asc' },
    });
  }

  create(data: Prisma.SeoRedirectCreateInput) {
    return this.db.seoRedirect.create({ data });
  }

  update(id: string, data: Prisma.SeoRedirectUpdateInput) {
    return this.db.seoRedirect.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.db.seoRedirect.delete({ where: { id } });
  }

  incrementHit(id: string) {
    return this.db.seoRedirect.update({
      where: { id },
      data: { hitCount: { increment: 1 } },
    });
  }
}

export class SeoAuditRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  list(params: {
    resolved?: boolean;
    severity?: string;
    issueType?: string;
    cursor?: string;
    limit?: number;
  }) {
    const limit = Math.min(params.limit ?? 50, 200);
    const where: Prisma.SeoAuditWhereInput = {
      ...(params.resolved !== undefined ? { resolved: params.resolved } : {}),
      ...(params.severity ? { severity: params.severity } : {}),
      ...(params.issueType ? { issueType: params.issueType } : {}),
    };
    return this.db.seoAudit.findMany({
      where,
      take: limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
    });
  }

  clearUnresolved() {
    return this.db.seoAudit.deleteMany({ where: { resolved: false } });
  }

  createMany(data: Prisma.SeoAuditCreateManyInput[]) {
    if (!data.length) return Promise.resolve({ count: 0 });
    return this.db.seoAudit.createMany({ data });
  }

  resolve(id: string) {
    return this.db.seoAudit.update({ where: { id }, data: { resolved: true } });
  }

  summary() {
    return this.db.seoAudit.groupBy({
      by: ['severity', 'resolved'],
      _count: { _all: true },
    });
  }
}

export type SitemapEntry = { loc: string; lastmod?: Date };

export class SeoSitemapRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  async entriesForType(type: string, siteUrl: string): Promise<SitemapEntry[]> {
    const published = { status: 'PUBLISHED' as const, deletedAt: null };

    switch (type) {
      case 'articles': {
        const rows = await this.db.article.findMany({
          where: published,
          select: { slug: true, updatedAt: true },
          take: 5000,
        });
        return rows.map((r) => ({ loc: `${siteUrl}/articles/${r.slug}`, lastmod: r.updatedAt }));
      }
      case 'pages': {
        const rows = await this.db.page.findMany({
          where: published,
          select: { slug: true, updatedAt: true },
          take: 5000,
        });
        return rows.map((r) => ({ loc: `${siteUrl}/p/${r.slug}`, lastmod: r.updatedAt }));
      }
      case 'reviews': {
        const rows = await this.db.review.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          select: { slug: true, updatedAt: true },
          take: 5000,
        });
        return rows.map((r) => ({ loc: `${siteUrl}/reviews/${r.slug}`, lastmod: r.updatedAt }));
      }
      case 'calculators': {
        const rows = await this.db.calculator.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          select: { slug: true, updatedAt: true },
          take: 5000,
        });
        return rows.map((r) => ({ loc: `${siteUrl}/calculators/${r.slug}`, lastmod: r.updatedAt }));
      }
      case 'ai-tools': {
        const rows = await this.db.aiTool.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          select: { slug: true, updatedAt: true },
          take: 5000,
        });
        return rows.map((r) => ({ loc: `${siteUrl}/ai-tools/${r.slug}`, lastmod: r.updatedAt }));
      }
      case 'directory': {
        const rows = await this.db.business.findMany({
          where: { deletedAt: null, status: 'APPROVED' },
          select: { slug: true, updatedAt: true },
          take: 5000,
        });
        return rows.map((r) => ({ loc: `${siteUrl}/directory/${r.slug}`, lastmod: r.updatedAt }));
      }
      case 'comparisons': {
        const rows = await this.db.comparison.findMany({
          where: { deletedAt: null, status: 'PUBLISHED' },
          select: { slug: true, updatedAt: true },
          take: 5000,
        });
        return rows.map((r) => ({ loc: `${siteUrl}/compare/${r.slug}`, lastmod: r.updatedAt }));
      }
      case 'images': {
        const rows = await this.db.mediaAsset.findMany({
          where: { deletedAt: null },
          select: { url: true, updatedAt: true },
          take: 5000,
        });
        return rows
          .filter((r) => r.url?.startsWith('http'))
          .map((r) => ({ loc: r.url!, lastmod: r.updatedAt }));
      }
      case 'finance': {
        const published = { deletedAt: null, status: 'PUBLISHED' as const };
        const [banks, loans, cards, insurance, investments, guides] = await Promise.all([
          this.db.bank.findMany({ where: published, select: { slug: true, updatedAt: true }, take: 2000 }),
          this.db.loan.findMany({ where: published, select: { id: true, updatedAt: true }, take: 2000 }),
          this.db.creditCard.findMany({ where: published, select: { id: true, updatedAt: true }, take: 2000 }),
          this.db.insuranceProduct.findMany({ where: published, select: { id: true, updatedAt: true }, take: 2000 }),
          this.db.investmentProduct.findMany({ where: published, select: { id: true, updatedAt: true }, take: 2000 }),
          this.db.financeGuide.findMany({ where: published, select: { slug: true, updatedAt: true }, take: 2000 }),
        ]);
        return [
          ...banks.map((r) => ({ loc: `${siteUrl}/finance/banks/${r.slug}`, lastmod: r.updatedAt })),
          ...loans.map((r) => ({ loc: `${siteUrl}/finance/loans/${r.id}`, lastmod: r.updatedAt })),
          ...cards.map((r) => ({ loc: `${siteUrl}/finance/credit-cards/${r.id}`, lastmod: r.updatedAt })),
          ...insurance.map((r) => ({ loc: `${siteUrl}/finance/insurance/${r.id}`, lastmod: r.updatedAt })),
          ...investments.map((r) => ({ loc: `${siteUrl}/finance/investments/${r.id}`, lastmod: r.updatedAt })),
          ...guides.map((r) => ({ loc: `${siteUrl}/finance/guides/${r.slug}`, lastmod: r.updatedAt })),
        ];
      }
      case 'construction': {
        const published = { deletedAt: null, status: 'PUBLISHED' as const };
        const [materials, brands, guides, checklists] = await Promise.all([
          this.db.constructionMaterial.findMany({ where: published, select: { id: true, updatedAt: true }, take: 2000 }),
          this.db.constructionBrand.findMany({ where: published, select: { slug: true, updatedAt: true }, take: 2000 }),
          this.db.constructionGuide.findMany({ where: published, select: { slug: true, updatedAt: true }, take: 2000 }),
          this.db.constructionChecklist.findMany({ where: published, select: { slug: true, updatedAt: true }, take: 2000 }),
        ]);
        return [
          ...materials.map((r) => ({ loc: `${siteUrl}/construction/materials/${r.id}`, lastmod: r.updatedAt })),
          ...brands.map((r) => ({ loc: `${siteUrl}/construction/brands/${r.slug}`, lastmod: r.updatedAt })),
          ...guides.map((r) => ({ loc: `${siteUrl}/construction/guides/${r.slug}`, lastmod: r.updatedAt })),
          ...checklists.map((r) => ({ loc: `${siteUrl}/construction/checklists/${r.slug}`, lastmod: r.updatedAt })),
        ];
      }
      case 'automobile': {
        const published = { deletedAt: null, status: 'PUBLISHED' as const };
        const [vehicles, manufacturers, guides] = await Promise.all([
          this.db.automobileVehicle.findMany({ where: published, select: { slug: true, updatedAt: true }, take: 2000 }),
          this.db.automobileManufacturer.findMany({ where: published, select: { slug: true, updatedAt: true }, take: 2000 }),
          this.db.automobileGuide.findMany({ where: published, select: { slug: true, updatedAt: true }, take: 2000 }),
        ]);
        return [
          ...vehicles.map((r) => ({ loc: `${siteUrl}/automobile/vehicles/${r.slug}`, lastmod: r.updatedAt })),
          ...manufacturers.map((r) => ({ loc: `${siteUrl}/automobile/manufacturers/${r.slug}`, lastmod: r.updatedAt })),
          ...guides.map((r) => ({ loc: `${siteUrl}/automobile/guides/${r.slug}`, lastmod: r.updatedAt })),
        ];
      }
      default:
        return [];
    }
  }

  async listAuditCandidates() {
    const published = { deletedAt: null, status: 'PUBLISHED' as const };
    const [calculators, aiTools, businesses, comparisons] = await Promise.all([
      this.db.calculator.findMany({
        where: published,
        select: { id: true, slug: true, name: true, seoTitle: true, seoDescription: true },
        take: 500,
      }),
      this.db.aiTool.findMany({
        where: published,
        select: { id: true, slug: true, name: true, seoTitle: true, seoDescription: true },
        take: 500,
      }),
      this.db.business.findMany({
        where: { deletedAt: null, status: 'APPROVED' },
        select: { id: true, slug: true, name: true, seoTitle: true, seoDescription: true },
        take: 500,
      }),
      this.db.comparison.findMany({
        where: published,
        select: { id: true, slug: true, title: true, seoTitle: true, seoDescription: true },
        take: 500,
      }),
    ]);
    return { calculators, aiTools, businesses, comparisons };
  }
}
