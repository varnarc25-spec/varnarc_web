import type { Prisma, PrismaClient } from '@prisma/client';
import {
  buildGuideClusterLanding,
  canIndexConstructionCostCity,
  canIndexPriceLanding,
  CONSTRUCTION_SITEMAP_MAX_URLS_PER_FILE,
  CONSTRUCTION_SITEMAP_SEGMENTS,
  CONSTRUCTION_SITEMAP_STATIC_LASTMOD,
  constructionSitemapChildLoc,
  filterConstructionSitemapPaths,
  isConstructionSitemapSegment,
  listConstructionCostCityProfileSlugs,
  listConstructionSitemapStaticPaths,
  listGuideClusters,
  listIndexableConstructionGlossaryTerms,
  listIndexableIntentCalcLandings,
  PRICE_HUB_CITIES,
  type ConstructionSitemapSegment,
  type PriceFreshness,
} from '@varnarc/validation';
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
    if (isConstructionSitemapSegment(type)) {
      return this.entriesForConstructionSegment(type, siteUrl);
    }

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
        const now = new Date();
        const staticPages = [
          '/',
          '/about',
          '/contact',
          '/editorial-policy',
          '/methodology',
          '/corrections',
          '/disclaimer',
          '/privacy',
          '/terms',
          '/reviews',
          '/articles',
          '/compare',
          '/compare/products',
          '/calculators',
          '/directory',
          '/ai-tools',
          '/solar',
          '/search',
        ];
        return [
          ...staticPages.map((path) => ({ loc: `${siteUrl}${path}`, lastmod: now })),
          ...rows.map((r) => ({ loc: `${siteUrl}/p/${r.slug}`, lastmod: r.updatedAt })),
        ];
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
        const [banks, loans, cards, insurance, investments, guides, categories] = await Promise.all(
          [
            this.db.bank.findMany({
              where: published,
              select: { slug: true, updatedAt: true },
              take: 2000,
            }),
            this.db.loan.findMany({
              where: published,
              select: { id: true, updatedAt: true },
              take: 2000,
            }),
            this.db.creditCard.findMany({
              where: published,
              select: { id: true, updatedAt: true },
              take: 2000,
            }),
            this.db.insuranceProduct.findMany({
              where: published,
              select: { id: true, updatedAt: true },
              take: 2000,
            }),
            this.db.investmentProduct.findMany({
              where: published,
              select: { id: true, updatedAt: true },
              take: 2000,
            }),
            this.db.financeGuide.findMany({
              where: published,
              select: { slug: true, updatedAt: true },
              take: 2000,
            }),
            this.db.financeCategory.findMany({
              where: { deletedAt: null },
              select: { slug: true, updatedAt: true },
              take: 500,
            }),
          ],
        );
        const hubPaths = [
          '/finance',
          '/finance/loans',
          '/finance/loans/home-loan',
          '/finance/loans/personal-loan',
          '/finance/loans/car-loan',
          '/finance/loans/education-loan',
          '/finance/loans/business-loan',
          '/finance/loans/gold-loan',
          '/finance/loans/two-wheeler-loan',
          '/finance/loans/loan-against-property',
          '/finance/loans/methodology',
          '/finance/credit-cards',
          '/finance/insurance',
          '/finance/investments',
          '/finance/banks',
          '/finance/rates',
          '/finance/faqs',
          '/finance/glossary',
          '/finance/guides',
          '/finance/compare',
          '/finance/eligibility',
          '/finance/credit-score',
        ];
        const now = new Date();
        return [
          ...hubPaths.map((path) => ({ loc: `${siteUrl}${path}`, lastmod: now })),
          ...categories.map((r) => ({
            loc: `${siteUrl}/finance/categories/${r.slug}`,
            lastmod: r.updatedAt,
          })),
          ...banks.map((r) => ({
            loc: `${siteUrl}/finance/banks/${r.slug}`,
            lastmod: r.updatedAt,
          })),
          ...loans.map((r) => ({ loc: `${siteUrl}/finance/loans/${r.id}`, lastmod: r.updatedAt })),
          ...cards.map((r) => ({
            loc: `${siteUrl}/finance/credit-cards/${r.id}`,
            lastmod: r.updatedAt,
          })),
          ...insurance.map((r) => ({
            loc: `${siteUrl}/finance/insurance/${r.id}`,
            lastmod: r.updatedAt,
          })),
          ...investments.map((r) => ({
            loc: `${siteUrl}/finance/investments/${r.id}`,
            lastmod: r.updatedAt,
          })),
          ...guides.map((r) => ({
            loc: `${siteUrl}/finance/guides/${r.slug}`,
            lastmod: r.updatedAt,
          })),
        ];
      }
      case 'construction': {
        // Union of all child segments (SEO audit / status counts). Nested XML
        // index is built in SeoService — this path must stay complete.
        const parts = await Promise.all(
          CONSTRUCTION_SITEMAP_SEGMENTS.map((segment) =>
            this.entriesForConstructionSegment(segment, siteUrl),
          ),
        );
        return this.dedupeSitemapEntries(parts.flat());
      }
      case 'automobile': {
        const published = { deletedAt: null, status: 'PUBLISHED' as const };
        const [vehicles, manufacturers, guides] = await Promise.all([
          this.db.automobileVehicle.findMany({
            where: published,
            select: { slug: true, updatedAt: true },
            take: 2000,
          }),
          this.db.automobileManufacturer.findMany({
            where: published,
            select: { slug: true, updatedAt: true },
            take: 2000,
          }),
          this.db.automobileGuide.findMany({
            where: published,
            select: { slug: true, updatedAt: true },
            take: 2000,
          }),
        ]);
        const now = new Date();
        const autoHubs = ['/automobile', '/automobile/faqs', '/automobile/guides'];
        return [
          ...autoHubs.map((path) => ({ loc: `${siteUrl}${path}`, lastmod: now })),
          ...vehicles.map((r) => ({
            loc: `${siteUrl}/automobile/vehicles/${r.slug}`,
            lastmod: r.updatedAt,
          })),
          ...manufacturers.map((r) => ({
            loc: `${siteUrl}/automobile/manufacturers/${r.slug}`,
            lastmod: r.updatedAt,
          })),
          ...guides.map((r) => ({
            loc: `${siteUrl}/automobile/guides/${r.slug}`,
            lastmod: r.updatedAt,
          })),
        ];
      }
      default:
        return [];
    }
  }

  /** Child construction sitemap segments (canonical indexable URLs only). */
  async entriesForConstructionSegment(
    segment: ConstructionSitemapSegment,
    siteUrl: string,
  ): Promise<SitemapEntry[]> {
    const base = siteUrl.replace(/\/+$/, '');
    const staticLastmod = CONSTRUCTION_SITEMAP_STATIC_LASTMOD;
    const published = { deletedAt: null, status: 'PUBLISHED' as const };

    const staticEntries = (): SitemapEntry[] =>
      listConstructionSitemapStaticPaths(segment).map((path) => ({
        loc: `${base}${path}`,
        lastmod: staticLastmod,
      }));

    let entries: SitemapEntry[] = [];

    switch (segment) {
      case 'construction-core': {
        entries = staticEntries();
        break;
      }
      case 'construction-calculators': {
        entries = [
          ...staticEntries(),
          ...listIndexableIntentCalcLandings().map((p) => ({
            loc: `${base}${p.path}`,
            lastmod: staticLastmod,
          })),
        ];
        break;
      }
      case 'construction-materials': {
        const [materials, brands] = await Promise.all([
          this.db.constructionMaterial.findMany({
            where: published,
            select: { id: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
            take: 5_000,
          }),
          this.db.constructionBrand.findMany({
            where: published,
            select: { slug: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
            take: 2_000,
          }),
        ]);
        entries = [
          ...staticEntries(),
          ...materials.map((r) => ({
            loc: `${base}/construction/materials/${r.id}`,
            lastmod: r.updatedAt,
          })),
          ...brands.map((r) => ({
            loc: `${base}/construction/brands/${r.slug}`,
            lastmod: r.updatedAt,
          })),
        ];
        break;
      }
      case 'construction-comparisons': {
        const comparisons = await this.db.constructionComparison.findMany({
          where: published,
          select: { slug: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
          take: 2_000,
        });
        entries = [
          ...staticEntries(),
          ...comparisons.map((r) => ({
            loc: `${base}/construction/compare/${r.slug}`,
            lastmod: r.updatedAt,
          })),
        ];
        break;
      }
      case 'construction-guides': {
        const [guides, checklists] = await Promise.all([
          this.db.constructionGuide.findMany({
            where: published,
            select: { slug: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
            take: 5_000,
          }),
          this.db.constructionChecklist.findMany({
            where: published,
            select: { slug: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
            take: 2_000,
          }),
        ]);
        entries = [
          ...guides.map((r) => ({
            loc: `${base}/construction/guides/${r.slug}`,
            lastmod: r.updatedAt,
          })),
          ...checklists.map((r) => ({
            loc: `${base}/construction/checklists/${r.slug}`,
            lastmod: r.updatedAt,
          })),
          ...listGuideClusters()
            .map((c) => buildGuideClusterLanding(c.slug))
            .filter((l): l is NonNullable<typeof l> => l != null)
            .map((c) => ({
              loc: `${base}${c.canonicalPath}`,
              lastmod: staticLastmod,
            })),
        ];
        break;
      }
      case 'construction-glossary': {
        entries = listIndexableConstructionGlossaryTerms().map((t) => ({
          loc: `${base}/construction/glossary/${t.slug}`,
          lastmod: staticLastmod,
        }));
        break;
      }
      case 'construction-prices': {
        entries = await this.buildConstructionPriceSitemapEntries(base);
        break;
      }
      default:
        entries = [];
    }

    return this.capSitemapEntries(this.dedupeSitemapEntries(entries));
  }

  constructionSitemapIndexEntries(siteUrl: string): Array<{ loc: string; lastmod: Date }> {
    return CONSTRUCTION_SITEMAP_SEGMENTS.map((segment) => ({
      loc: constructionSitemapChildLoc(siteUrl, segment),
      lastmod: CONSTRUCTION_SITEMAP_STATIC_LASTMOD,
    }));
  }

  private async buildConstructionPriceSitemapEntries(base: string): Promise<SitemapEntry[]> {
    const citySlugs = PRICE_HUB_CITIES.map((c) => c.slug);
    const priceRows = await this.db.constructionMaterialPrice.findMany({
      where: {
        deletedAt: null,
        location: { deletedAt: null, slug: { in: [...citySlugs] } },
      },
      select: {
        updatedAt: true,
        freshness: true,
        verifiedAt: true,
        effectiveFrom: true,
        unit: true,
        price: true,
        currency: true,
        material: { select: { slug: true } },
        location: { select: { slug: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 12_000,
    });

    const hubKeyFromSlug = (slug: string): string | null => {
      const s = slug.toLowerCase();
      if (s.includes('cement') || s === 'opc' || s === 'ppc') return 'cement';
      if (s.includes('steel') || s.includes('tmt') || s.includes('rebar')) return 'steel';
      if (s.includes('sand') || s.includes('m-sand') || s.includes('msand')) return 'sand';
      if (s.includes('aggregate') || s.includes('jelly') || s.includes('metal')) return 'aggregate';
      if (s.includes('brick') || s.includes('aac') || s.includes('block')) return 'brick';
      if (s.includes('tile')) return 'tiles';
      if (s.includes('paint') || s.includes('emulsion')) return 'paint';
      return null;
    };

    type Obs = {
      claimed: PriceFreshness;
      verifiedAt: Date | null;
      effectiveFrom: Date | null;
      updatedAt: Date;
      price: number;
      unit: string;
      currency: string;
      materialKey: string;
    };
    const byPair = new Map<string, Obs[]>();
    const byCity = new Map<string, Obs[]>();

    for (const row of priceRows) {
      const materialKey = hubKeyFromSlug(row.material.slug);
      const citySlug = row.location?.slug;
      if (!materialKey || !citySlug) continue;
      const claimed = row.freshness as PriceFreshness;
      const obs: Obs = {
        claimed,
        verifiedAt: row.verifiedAt,
        effectiveFrom: row.effectiveFrom,
        updatedAt: row.updatedAt,
        price: Number(row.price),
        unit: row.unit,
        currency: row.currency || 'INR',
        materialKey,
      };
      const pair = `${materialKey}/${citySlug}`;
      const list = byPair.get(pair) ?? [];
      list.push(obs);
      byPair.set(pair, list);

      const cityList = byCity.get(citySlug) ?? [];
      cityList.push(obs);
      byCity.set(citySlug, cityList);
    }

    const entries: SitemapEntry[] = [];

    for (const [pair, observations] of byPair.entries()) {
      const [materialKey, citySlug] = pair.split('/') as [string, string];
      if (
        !canIndexPriceLanding({
          materialKey,
          citySlug,
          observations,
        })
      ) {
        continue;
      }
      const lastmod = observations.reduce(
        (max, o) => (o.updatedAt > max ? o.updatedAt : max),
        observations[0]!.updatedAt,
      );
      entries.push({ loc: `${base}/construction/prices/${pair}`, lastmod });
    }

    for (const citySlug of listConstructionCostCityProfileSlugs()) {
      const cityObs = byCity.get(citySlug) ?? [];
      const gate = canIndexConstructionCostCity({
        citySlug,
        observations: cityObs.map((o) => ({
          materialKey: o.materialKey,
          claimed: o.claimed,
          verifiedAt: o.verifiedAt,
          effectiveFrom: o.effectiveFrom,
          price: o.price,
          unit: o.unit,
          currency: o.currency,
        })),
      });
      if (!gate.indexable) continue;
      const lastmod =
        cityObs.length > 0
          ? cityObs.reduce(
              (max, o) => (o.updatedAt > max ? o.updatedAt : max),
              cityObs[0]!.updatedAt,
            )
          : CONSTRUCTION_SITEMAP_STATIC_LASTMOD;
      entries.push({ loc: `${base}/construction/construction-cost/${citySlug}`, lastmod });
    }

    const vcciCityRows = await this.db.constructionVcciSnapshot.findMany({
      where: {
        deletedAt: null,
        status: 'PUBLISHED',
        qualityPassed: true,
        scope: 'CITY',
        location: { deletedAt: null },
      },
      select: {
        updatedAt: true,
        location: { select: { slug: true } },
      },
      take: 500,
    });
    const vcciCities = new Map<string, Date>();
    for (const row of vcciCityRows) {
      const slug = row.location?.slug;
      if (!slug) continue;
      const prev = vcciCities.get(slug);
      if (!prev || row.updatedAt > prev) vcciCities.set(slug, row.updatedAt);
    }
    for (const [slug, lastmod] of vcciCities.entries()) {
      entries.push({ loc: `${base}/construction/cost-index/city/${slug}`, lastmod });
    }

    const vcciNational = await this.db.constructionVcciSnapshot.findFirst({
      where: {
        deletedAt: null,
        status: 'PUBLISHED',
        qualityPassed: true,
        scope: 'NATIONAL',
      },
      select: { updatedAt: true },
      orderBy: { calculationDate: 'desc' },
    });
    if (vcciNational) {
      const vcciComponentRows = await this.db.constructionVcciSnapshot.findMany({
        where: {
          deletedAt: null,
          status: 'PUBLISHED',
          qualityPassed: true,
          scope: 'COMPONENT',
          componentKey: { not: null },
        },
        select: { updatedAt: true, componentKey: true },
        take: 200,
      });
      for (const r of vcciComponentRows) {
        if (!r.componentKey) continue;
        entries.push({
          loc: `${base}/construction/cost-index/components/${r.componentKey}`,
          lastmod: r.updatedAt,
        });
      }
    }

    return entries;
  }

  private dedupeSitemapEntries(entries: SitemapEntry[]): SitemapEntry[] {
    const seen = new Set<string>();
    const out: SitemapEntry[] = [];
    for (const e of entries) {
      try {
        const path = new URL(e.loc).pathname.replace(/\/$/, '') || '/';
        if (!path.startsWith('/construction')) continue;
        if (filterConstructionSitemapPaths([path]).length === 0) continue;
        if (seen.has(e.loc)) continue;
        seen.add(e.loc);
        out.push(e);
      } catch {
        /* skip invalid */
      }
    }
    return out;
  }

  private capSitemapEntries(entries: SitemapEntry[]): SitemapEntry[] {
    if (entries.length <= CONSTRUCTION_SITEMAP_MAX_URLS_PER_FILE) return entries;
    return entries.slice(0, CONSTRUCTION_SITEMAP_MAX_URLS_PER_FILE);
  }

  async listAuditCandidates() {
    const published = { deletedAt: null, status: 'PUBLISHED' as const };
    const [
      calculators,
      aiTools,
      businesses,
      comparisons,
      banks,
      loans,
      cards,
      insurance,
      investments,
      guides,
    ] = await Promise.all([
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
      this.db.bank.findMany({
        where: published,
        select: { id: true, slug: true, name: true, seoTitle: true, seoDescription: true },
        take: 500,
      }),
      this.db.loan.findMany({
        where: published,
        select: { id: true, slug: true, name: true, seoTitle: true, seoDescription: true },
        take: 500,
      }),
      this.db.creditCard.findMany({
        where: published,
        select: { id: true, slug: true, name: true, seoTitle: true, seoDescription: true },
        take: 500,
      }),
      this.db.insuranceProduct.findMany({
        where: published,
        select: { id: true, slug: true, name: true, seoTitle: true, seoDescription: true },
        take: 500,
      }),
      this.db.investmentProduct.findMany({
        where: published,
        select: { id: true, slug: true, name: true, seoTitle: true, seoDescription: true },
        take: 500,
      }),
      this.db.financeGuide.findMany({
        where: published,
        select: { id: true, slug: true, title: true, seoTitle: true, seoDescription: true },
        take: 500,
      }),
    ]);
    return {
      calculators,
      aiTools,
      businesses,
      comparisons,
      banks,
      loans,
      cards,
      insurance,
      investments,
      guides,
    };
  }
}
