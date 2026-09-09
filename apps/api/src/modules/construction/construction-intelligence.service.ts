import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { PrismaClient } from '@varnarc/database';
import {
  classifyRateFreshness,
  parseRateImportCsv,
  publicRateLabel,
  resolveRate,
  catalogNationalPriceAsResolvable,
  CITY_RATE_UNAVAILABLE_NOTE,
  LOCAL_VERIFICATION_WARNING,
  type RateLocationLevel,
  type RateSourceType,
  type ResolvableRate,
} from '@varnarc/validation';
import { PRISMA } from '../../database/database.module';

const INTEL_CACHE = 'construction:intelligence:dashboard';

function mapLocationType(type: string): RateLocationLevel {
  if (type === 'COUNTRY') return 'NATIONAL';
  if (type === 'LOCALITY' || type === 'CITY' || type === 'DISTRICT' || type === 'STATE') {
    return type;
  }
  return 'FALLBACK';
}

@Injectable()
export class ConstructionIntelligenceService {
  constructor(
    @Inject(PRISMA) private readonly db: PrismaClient,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async dashboard() {
    const cached = await this.cache.get(INTEL_CACHE);
    if (cached) return cached;

    const now = new Date();

    const [
      materials,
      specifications,
      activeRates,
      labourTrades,
      equipment,
      interiors,
      states,
      cities,
      sources,
      derived,
      fallback,
      high,
      medium,
      low,
      official,
      manufacturer,
      verified,
      pendingImport,
      recentAudit,
    ] = await Promise.all([
      this.db.constructionMaterial.count({ where: { deletedAt: null } }),
      this.db.constructionMaterialSpecification.count({ where: { deletedAt: null } }),
      this.db.constructionMaterialPrice.count({
        where: { deletedAt: null, rateStatus: 'ACTIVE' },
      }),
      this.db.constructionLabourTrade.count({ where: { deletedAt: null } }),
      this.db.constructionEquipment.count({ where: { deletedAt: null } }),
      this.db.constructionInteriorComponent.count({ where: { deletedAt: null } }),
      this.db.constructionLocation.count({ where: { deletedAt: null, type: 'STATE' } }),
      this.db.constructionLocation.count({ where: { deletedAt: null, type: 'CITY' } }),
      this.db.constructionRateSource.count({ where: { deletedAt: null } }),
      this.db.constructionMaterialPrice.count({
        where: { deletedAt: null, sourceType: 'DERIVED' },
      }),
      this.db.constructionMaterialPrice.count({
        where: { deletedAt: null, sourceType: 'ESTIMATED_FALLBACK' },
      }),
      this.db.constructionMaterialPrice.count({
        where: { deletedAt: null, confidence: 'HIGH' },
      }),
      this.db.constructionMaterialPrice.count({
        where: { deletedAt: null, confidence: 'MEDIUM' },
      }),
      this.db.constructionMaterialPrice.count({
        where: { deletedAt: null, confidence: 'LOW' },
      }),
      this.db.constructionMaterialPrice.count({
        where: {
          deletedAt: null,
          sourceType: { in: ['OFFICIAL_SOR', 'OFFICIAL_MARKET_SURVEY', 'OFFICIAL_STATISTICS'] },
        },
      }),
      this.db.constructionMaterialPrice.count({
        where: { deletedAt: null, sourceType: 'MANUFACTURER' },
      }),
      this.db.constructionMaterialPrice.count({
        where: { deletedAt: null, sourceType: 'VARNARC_VERIFIED' },
      }),
      this.db.constructionRateImportBatch.count({ where: { status: 'PENDING' } }),
      this.db.constructionRateAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

    const [pendingReview, quotations, locationFactors, commercialRules] = await Promise.all([
      this.db.constructionRateReview.count({ where: { status: { in: ['OPEN', 'IN_REVIEW'] } } }),
      this.db.constructionSupplierQuotation.count({ where: { deletedAt: null } }),
      this.db.constructionLocationCostFactor.count(),
      this.db.constructionCommercialRule.count({ where: { deletedAt: null } }),
    ]);

    const verifiedDates = await this.db.constructionMaterialPrice.findMany({
      where: { deletedAt: null, rateStatus: 'ACTIVE' },
      select: { verifiedAt: true, retrievedAt: true },
    });
    let fresh = 0;
    let aging = 0;
    let stale = 0;
    let critical = 0;
    let older30 = 0;
    let older60 = 0;
    let older90 = 0;
    let older180 = 0;
    let older365 = 0;
    for (const row of verifiedDates) {
      const at = row.verifiedAt ?? row.retrievedAt;
      const status = classifyRateFreshness(at, now);
      if (status === 'FRESH') fresh += 1;
      else if (status === 'AGING') aging += 1;
      else if (status === 'STALE') stale += 1;
      else critical += 1;
      if (at) {
        const age = now.getTime() - at.getTime();
        if (age > 30 * 86_400_000) older30 += 1;
        if (age > 60 * 86_400_000) older60 += 1;
        if (age > 90 * 86_400_000) older90 += 1;
        if (age > 180 * 86_400_000) older180 += 1;
        if (age > 365 * 86_400_000) older365 += 1;
      } else {
        older30 += 1;
        older60 += 1;
        older90 += 1;
        older180 += 1;
        older365 += 1;
      }
    }

    const data = {
      materials,
      specifications,
      activeRates,
      labourTrades,
      equipment,
      interiors,
      states,
      cities,
      sources,
      official,
      manufacturer,
      verified,
      derived,
      fallback,
      high,
      medium,
      low,
      fresh,
      aging,
      stale,
      critical,
      older30,
      older60,
      older90,
      older180,
      older365,
      pendingImport,
      pendingReview,
      quotations,
      locationFactors,
      commercialRules,
      recentAudit,
      note: 'Official city selling prices are not seeded. Derived and fallback counts are expected until SOR extracts are imported.',
    };
    await this.cache.set(INTEL_CACHE, data, 60);
    return data;
  }

  async listSources() {
    return this.db.constructionRateSource.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      take: 200,
    });
  }

  async listMaterialRates(query: {
    state?: string;
    city?: string;
    sourceType?: RateSourceType;
    confidence?: string;
    status?: string;
    take?: number;
  }) {
    return this.db.constructionMaterialPrice.findMany({
      where: {
        deletedAt: null,
        ...(query.sourceType ? { sourceType: query.sourceType } : {}),
        ...(query.confidence ? { confidence: query.confidence as 'HIGH' | 'MEDIUM' | 'LOW' } : {}),
        ...(query.status ? { rateStatus: query.status as 'ACTIVE' } : {}),
        ...(query.city
          ? { location: { slug: query.city, deletedAt: null } }
          : query.state
            ? { location: { slug: query.state, deletedAt: null } }
            : {}),
      },
      include: {
        material: { select: { name: true, slug: true } },
        location: { select: { name: true, type: true, slug: true } },
        specification: { select: { name: true, unit: true } },
        sourceRecord: { select: { name: true, sourceType: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: Math.min(query.take ?? 100, 200),
    });
  }

  async listMasters() {
    const [
      trades,
      equipment,
      professionals,
      phases,
      workItems,
      wastage,
      interiors,
      benchmarks,
      rules,
      factors,
    ] = await Promise.all([
      this.db.constructionLabourTrade.findMany({
        where: { deletedAt: null },
        orderBy: { sortOrder: 'asc' },
      }),
      this.db.constructionEquipment.findMany({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
      }),
      this.db.constructionProfessionalService.findMany({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
      }),
      this.db.constructionPhaseTemplate.findMany({
        where: { deletedAt: null },
        orderBy: { sortOrder: 'asc' },
      }),
      this.db.constructionWorkItem.findMany({
        where: { deletedAt: null },
        orderBy: { code: 'asc' },
      }),
      this.db.constructionWastageRule.findMany({
        where: { deletedAt: null },
        orderBy: { categoryKey: 'asc' },
      }),
      this.db.constructionInteriorComponent.findMany({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
      }),
      this.db.constructionBenchmarkRate.findMany({
        where: { deletedAt: null },
        include: { location: { select: { name: true, slug: true } } },
        take: 50,
      }),
      this.db.constructionCommercialRule.findMany({
        where: { deletedAt: null },
        include: { location: { select: { name: true, slug: true } } },
      }),
      this.db.constructionLocationCostFactor.findMany({
        include: { location: { select: { name: true, slug: true, type: true } } },
        take: 80,
      }),
    ]);
    return {
      trades,
      equipment,
      professionals,
      phases,
      workItems,
      wastage,
      interiors,
      benchmarks,
      commercialRules: rules,
      locationFactors: factors,
    };
  }

  async listReviews() {
    return this.db.constructionRateReview.findMany({
      include: { location: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async listQuotations() {
    return this.db.constructionSupplierQuotation.findMany({
      where: { deletedAt: null },
      include: { location: { select: { name: true, slug: true } } },
      orderBy: { quotedAt: 'desc' },
      take: 200,
    });
  }

  async locationAncestry(slug: string) {
    const leaf = await this.db.constructionLocation.findFirst({
      where: { slug, deletedAt: null },
    });
    if (!leaf) return [];
    const chain: { id: string; type: RateLocationLevel; slug: string; name: string }[] = [];
    let current = leaf;
    while (current) {
      chain.push({
        id: current.id,
        type: mapLocationType(current.type),
        slug: current.slug,
        name: current.name,
      });
      if (!current.parentId) break;
      const parent = await this.db.constructionLocation.findFirst({
        where: { id: current.parentId, deletedAt: null },
      });
      if (!parent) break;
      current = parent;
    }
    return chain;
  }

  async resolveMaterialRate(input: { materialSlug: string; locationSlug?: string }) {
    const material = await this.db.constructionMaterial.findFirst({
      where: { slug: input.materialSlug, deletedAt: null },
    });
    if (!material) return null;
    const ancestry = input.locationSlug ? await this.locationAncestry(input.locationSlug) : [];
    const prices = await this.db.constructionMaterialPrice.findMany({
      where: {
        materialId: material.id,
        deletedAt: null,
        rateStatus: 'ACTIVE',
      },
      include: { sourceRecord: true, location: true },
      take: 200,
    });
    const candidates: ResolvableRate[] = prices.map((row) => ({
      id: row.id,
      locationId: row.locationId,
      locationType: row.location ? mapLocationType(row.location.type) : 'NATIONAL',
      minRate: Number(row.minPrice ?? row.price),
      averageRate: Number(row.price),
      maxRate: Number(row.maxPrice ?? row.price),
      unit: row.unit,
      sourceType: row.sourceType,
      confidence: row.confidence,
      isDerived: row.isDerived,
      derivationMethod: row.derivationMethod,
      lastVerifiedAt: (row.verifiedAt ?? row.retrievedAt)?.toISOString() ?? null,
      effectiveFrom: row.effectiveFrom.toISOString(),
      sourceName: row.sourceRecord?.name ?? row.source,
    }));
    const catalog = catalogNationalPriceAsResolvable(material.slug);
    if (catalog) candidates.push(catalog);
    const resolved = resolveRate({
      candidates,
      ancestry: ancestry.map((node) => ({ id: node.id, type: node.type })),
    });
    if (!resolved) {
      return {
        material: material.name,
        resolved: null,
        publicLabel: 'Indicative planning rate',
        usedFallback: true,
        fallbackNote: CITY_RATE_UNAVAILABLE_NOTE,
        localVerificationWarning: LOCAL_VERIFICATION_WARNING,
        note: 'No ingested rate for this material. Using catalog national indicative rate is not available for this SKU — enter a supplier quote as a user override. Do not treat these figures as live prices.',
      };
    }
    const usedFallback =
      resolved.locationLevel === 'NATIONAL' ||
      resolved.locationLevel === 'FALLBACK' ||
      resolved.locationLevel === 'REGION' ||
      resolved.locationLevel === 'STATE';
    return {
      material: material.name,
      resolved: {
        ...resolved,
        publicLabel: publicRateLabel(resolved),
      },
      usedFallback,
      fallbackNote: usedFallback ? CITY_RATE_UNAVAILABLE_NOTE : null,
      localVerificationWarning: LOCAL_VERIFICATION_WARNING,
    };
  }

  async importCsv(csv: string, actorId: string) {
    const parsed = parseRateImportCsv(csv);
    const batch = await this.db.constructionRateImportBatch.create({
      data: {
        filename: 'rates.csv',
        status: parsed.errors.length ? 'FAILED' : 'COMPLETED',
        rowCount: parsed.rows.length,
        errorCount: parsed.errors.length,
        errors: parsed.errors as object[],
        createdBy: actorId,
        finishedAt: new Date(),
      },
    });
    return {
      batchId: batch.id,
      imported: 0,
      accepted: parsed.rows.length,
      errors: parsed.errors,
      note:
        parsed.errors.length === 0
          ? 'Rows validated. Numeric ingest still requires matching material/specification IDs — invalid rows were rejected. Official prices are not auto-created from unmatched names.'
          : 'Malformed rows were rejected. Nothing was written to live rates.',
    };
  }

  async priceHistory(materialPriceId: string) {
    const current = await this.db.constructionMaterialPrice.findFirst({
      where: { id: materialPriceId, deletedAt: null },
    });
    if (!current) return [];
    return this.db.constructionMaterialPrice.findMany({
      where: {
        materialId: current.materialId,
        locationId: current.locationId,
        deletedAt: null,
      },
      orderBy: { effectiveFrom: 'asc' },
      take: 120,
    });
  }
}
