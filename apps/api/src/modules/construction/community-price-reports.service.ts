import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import {
  COMMUNITY_PRICE_DUPLICATE_DAYS,
  COMMUNITY_PRICE_DUPLICATE_PRICE_TOLERANCE,
  COMMUNITY_PRICE_LOOKBACK_DAYS,
  COMMUNITY_PRICE_MAX_PENDING,
  COMMUNITY_PRICE_MAX_PER_DAY,
  COMMUNITY_PRICE_METHODOLOGY,
  COMMUNITY_PRICE_MIN_TRUST_FOR_AGGREGATE,
  COMMUNITY_PRICE_QUALIFICATION,
  COMMUNITY_PRICE_SOURCE,
  COMMUNITY_PRICE_SOURCE_LABEL,
  COMMUNITY_PRICE_STATUS_LABELS,
  COMMUNITY_PRICE_VERSION,
  PRICE_HUB_CITIES,
  aggregateCommunityPrices,
  computeCommunityTrustScore,
  createCommunityPriceReportSchema,
  isCommunityPriceOutlier,
  matchMaterialToHubKey,
  moderateCommunityPriceReportSchema,
  sanitizeDocumentFilename,
  suggestInitialModerationStatus,
  type CreateCommunityPriceReportInput,
  type ModerateCommunityPriceReportInput,
} from '@varnarc/validation';
import { REPOS } from '../../database/database.module';
import { GcsStorageService } from '../media/gcs-storage.service';

type ReportRow = {
  id: string;
  userId: string;
  unit: string;
  currency: string;
  price: unknown;
  purchaseDate: Date;
  brandName?: string | null;
  supplierName?: string | null;
  notes?: string | null;
  sourceLabel: string;
  status: string;
  trustScore: number;
  isOutlier: boolean;
  outlierRatio?: unknown;
  referenceMidPrice?: unknown;
  isDuplicate: boolean;
  duplicateOfId?: string | null;
  invoiceStorageKey?: string | null;
  invoiceMimeType?: string | null;
  invoiceOriginalName?: string | null;
  invoiceByteSize?: number | null;
  moderationNotes?: string | null;
  moderatedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  material?: { id: string; name: string; slug: string; unit: string } | null;
  location?: { id: string; name: string; slug: string; type: string } | null;
  brand?: { id: string; name: string; slug: string } | null;
};

@Injectable()
export class CommunityPriceReportsService {
  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    private readonly storage: GcsStorageService,
  ) {}

  private requireUser(userId?: string | null) {
    if (!userId)
      throw new UnauthorizedException('Authentication required to submit price reports.');
    return userId;
  }

  /**
   * Public-safe serialization: never exposes userId, invoice keys, or moderation internals
   * unless `owner` (contributor) or `admin`.
   */
  private serialize(row: ReportRow, mode: 'public' | 'owner' | 'admin') {
    const hasInvoice = Boolean(row.invoiceStorageKey);
    const base = {
      id: row.id,
      unit: row.unit,
      currency: row.currency,
      price: Number(row.price),
      purchaseDate: row.purchaseDate.toISOString().slice(0, 10),
      brandName: row.brandName ?? row.brand?.name ?? null,
      sourceLabel: row.sourceLabel || COMMUNITY_PRICE_SOURCE,
      sourceLabelDisplay: COMMUNITY_PRICE_SOURCE_LABEL,
      status: row.status,
      statusLabel:
        COMMUNITY_PRICE_STATUS_LABELS[row.status as keyof typeof COMMUNITY_PRICE_STATUS_LABELS] ??
        row.status,
      trustScore: row.trustScore,
      isOutlier: row.isOutlier,
      isDuplicate: row.isDuplicate,
      hasInvoice,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      material: row.material
        ? {
            id: row.material.id,
            name: row.material.name,
            slug: row.material.slug,
            unit: row.material.unit,
            hubKey: matchMaterialToHubKey(row.material.slug),
          }
        : null,
      location: row.location
        ? {
            id: row.location.id,
            name: row.location.name,
            slug: row.location.slug,
            type: row.location.type,
          }
        : null,
      brand: row.brand ? { id: row.brand.id, name: row.brand.name, slug: row.brand.slug } : null,
      /** Explicit: community rows are never primary market prices. */
      isPrimaryMarketPrice: false as const,
    };

    if (mode === 'public') {
      return base;
    }

    return {
      ...base,
      supplierName: row.supplierName ?? null,
      notes: row.notes ?? null,
      outlierRatio: row.outlierRatio != null ? Number(row.outlierRatio) : null,
      referenceMidPrice: row.referenceMidPrice != null ? Number(row.referenceMidPrice) : null,
      duplicateOfId: row.duplicateOfId ?? null,
      moderationNotes: mode === 'admin' ? (row.moderationNotes ?? null) : null,
      moderatedAt: row.moderatedAt?.toISOString() ?? null,
      invoice: hasInvoice
        ? {
            originalName: row.invoiceOriginalName ?? null,
            mimeType: row.invoiceMimeType ?? null,
            byteSize: row.invoiceByteSize ?? null,
            /** Never expose storage key — download only via authenticated endpoint. */
            downloadAvailable: true,
          }
        : null,
      ...(mode === 'admin' ? { userId: row.userId } : {}),
    };
  }

  async meta() {
    const cities = await this.repos.constructionLocations.listCities(
      PRICE_HUB_CITIES.map((c) => c.slug),
    );
    const materialsPage = await this.repos.constructionMaterials.list({
      status: 'PUBLISHED',
      limit: 200,
    });
    const materialRows = materialsPage.items as unknown as Array<{
      id: string;
      name: string;
      slug: string;
      unit: string;
    }>;
    return {
      version: COMMUNITY_PRICE_VERSION,
      qualification: COMMUNITY_PRICE_QUALIFICATION,
      methodology: COMMUNITY_PRICE_METHODOLOGY,
      sourceLabel: COMMUNITY_PRICE_SOURCE_LABEL,
      statuses: Object.entries(COMMUNITY_PRICE_STATUS_LABELS).map(([key, label]) => ({
        key,
        label,
      })),
      limits: {
        maxPerDay: COMMUNITY_PRICE_MAX_PER_DAY,
        maxPending: COMMUNITY_PRICE_MAX_PENDING,
        minTrustForAggregate: COMMUNITY_PRICE_MIN_TRUST_FOR_AGGREGATE,
        lookbackDays: COMMUNITY_PRICE_LOOKBACK_DAYS,
      },
      cities: PRICE_HUB_CITIES.map((c) => {
        const row = (cities as Array<{ id: string; slug: string; name: string }>).find(
          (x) => x.slug === c.slug,
        );
        return { slug: c.slug, name: c.name, id: row?.id ?? null };
      }),
      materials: materialRows.map((m) => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        unit: m.unit,
        hubKey: matchMaterialToHubKey(m.slug),
      })),
      neverPromotesToPrimaryMarket: true,
    };
  }

  async listMine(userId?: string | null, status?: string) {
    const uid = this.requireUser(userId);
    const rows = await this.repos.constructionCommunityPriceReports.listForUser(uid, status);
    return {
      items: rows.map((r) => this.serialize(r as ReportRow, 'owner')),
      qualification: COMMUNITY_PRICE_QUALIFICATION,
    };
  }

  async getPublicAggregate(materialId: string, locationId: string, unit: string) {
    if (!materialId || !locationId || !unit?.trim()) {
      return {
        ...aggregateCommunityPrices({
          materialId: materialId || '',
          locationId: locationId || '',
          unit: unit || '',
          observations: [],
        }),
        material: null,
        location: null,
        neverPromotesToPrimaryMarket: true as const,
      };
    }

    const since = new Date(Date.now() - COMMUNITY_PRICE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const [rows, material, locationRows] = await Promise.all([
      this.repos.constructionCommunityPriceReports.listEligibleForAggregate({
        materialId,
        locationId,
        unit: unit.trim(),
        since,
        minTrust: COMMUNITY_PRICE_MIN_TRUST_FOR_AGGREGATE,
      }),
      this.repos.constructionMaterials.findById(materialId),
      this.repos.constructionLocations.listCities(),
    ]);

    const locationMeta =
      (locationRows as Array<{ id: string; name: string; slug: string }>).find(
        (x) => x.id === locationId,
      ) ?? null;

    const aggregate = aggregateCommunityPrices({
      materialId,
      locationId,
      unit: unit.trim(),
      observations: rows.map((r) => ({
        price: Number(r.price),
        purchaseDate: r.purchaseDate,
        hasInvoice: Boolean(r.invoiceStorageKey),
        trustScore: r.trustScore,
        status: 'VERIFIED' as const,
        isOutlier: r.isOutlier,
        unit: r.unit,
      })),
    });

    return {
      ...aggregate,
      material: material ? { id: material.id, name: material.name, slug: material.slug } : null,
      location: locationMeta,
      neverPromotesToPrimaryMarket: true as const,
    };
  }

  private async resolveReferenceMid(
    materialId: string,
    locationId: string,
    unit: string,
  ): Promise<number | null> {
    // Prefer editorial hub observations for outlier reference — community never writes there.
    const [locationRows, material] = await Promise.all([
      this.repos.constructionLocations.listCities(),
      this.repos.constructionMaterials.findById(materialId),
    ]);
    if (!material) return null;
    const loc = locationRows.find((l) => l.id === locationId);

    const hubRows = await this.repos.constructionMaterialPrices.listFiltered({
      materialSlugs: [material.slug],
      ...(loc ? { locationSlugs: [loc.slug] } : {}),
      take: 40,
    });
    const matching = hubRows.filter(
      (r) => r.unit.trim().toLowerCase() === unit.trim().toLowerCase(),
    );
    if (matching.length >= 2) {
      const prices = matching.map((r) => Number(r.price)).filter((p) => p > 0);
      if (prices.length) {
        return (Math.min(...prices) + Math.max(...prices)) / 2;
      }
    }

    // Fallback: recent verified community mid (still not primary hub).
    const since = new Date(Date.now() - COMMUNITY_PRICE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const community = await this.repos.constructionCommunityPriceReports.listEligibleForAggregate({
      materialId,
      locationId,
      unit,
      since,
      minTrust: COMMUNITY_PRICE_MIN_TRUST_FOR_AGGREGATE,
    });
    if (community.length >= 2) {
      const prices = community.map((r) => Number(r.price)).filter((p) => p > 0);
      if (prices.length) return (Math.min(...prices) + Math.max(...prices)) / 2;
    }
    return null;
  }

  async submit(
    userId: string | null | undefined,
    raw: CreateCommunityPriceReportInput,
    file?: Express.Multer.File,
  ) {
    const uid = this.requireUser(userId);
    const input = createCommunityPriceReportSchema.parse(raw);

    const purchaseDate = new Date(input.purchaseDate);
    if (Number.isNaN(purchaseDate.getTime())) {
      throw new BadRequestException('Invalid purchase date.');
    }
    if (purchaseDate.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
      throw new BadRequestException('Purchase date cannot be in the future.');
    }

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [dayCount, pendingCount, verifiedHistory] = await Promise.all([
      this.repos.constructionCommunityPriceReports.countSubmittedSince(uid, dayAgo),
      this.repos.constructionCommunityPriceReports.countPendingForUser(uid),
      this.repos.constructionCommunityPriceReports.countVerifiedForUser(uid),
    ]);

    if (dayCount >= COMMUNITY_PRICE_MAX_PER_DAY) {
      throw new BadRequestException(
        `Rate limit: max ${COMMUNITY_PRICE_MAX_PER_DAY} community price reports per day.`,
      );
    }
    if (pendingCount >= COMMUNITY_PRICE_MAX_PENDING) {
      throw new BadRequestException(
        `You already have ${COMMUNITY_PRICE_MAX_PENDING} reports pending moderation.`,
      );
    }

    const dupSince = new Date(Date.now() - COMMUNITY_PRICE_DUPLICATE_DAYS * 24 * 60 * 60 * 1000);
    const duplicates = await this.repos.constructionCommunityPriceReports.findRecentDuplicates({
      userId: uid,
      materialId: input.materialId,
      locationId: input.locationId,
      unit: input.unit.trim(),
      price: input.price,
      since: dupSince,
      priceTolerance: COMMUNITY_PRICE_DUPLICATE_PRICE_TOLERANCE,
    });
    const isDuplicate = duplicates.length > 0;
    const duplicateOfId = duplicates[0]?.id ?? null;

    const referenceMid = await this.resolveReferenceMid(
      input.materialId,
      input.locationId,
      input.unit.trim(),
    );
    const isOutlier = isCommunityPriceOutlier(input.price, referenceMid);
    const outlierRatio =
      referenceMid && referenceMid > 0
        ? Math.round((Math.abs(input.price - referenceMid) / referenceMid) * 10000) / 10000
        : null;

    let invoiceStorageKey: string | null = null;
    let invoiceMimeType: string | null = null;
    let invoiceOriginalName: string | null = null;
    let invoiceByteSize: number | null = null;

    if (file) {
      this.storage.validateUpload(file);
      await this.storage.assertConfigured();
      const safeName = sanitizeDocumentFilename(file.originalname);
      const uploaded = await this.storage.upload(
        { ...file, originalname: safeName },
        { folderPath: `community-price-invoices/${uid}` },
      );
      invoiceStorageKey = uploaded.publicId;
      invoiceMimeType = file.mimetype;
      invoiceOriginalName = safeName;
      invoiceByteSize = file.size;
    }

    const hasInvoice = Boolean(invoiceStorageKey);
    const trustScore = computeCommunityTrustScore({
      hasInvoice,
      hasBrand: Boolean(input.brandId || input.brandName),
      hasSupplier: Boolean(input.supplierName),
      verifiedHistoryCount: verifiedHistory,
      isOutlier,
    });

    const status = suggestInitialModerationStatus({ isDuplicate, isOutlier });

    const row = await this.repos.constructionCommunityPriceReports.create({
      userId: uid,
      materialId: input.materialId,
      locationId: input.locationId,
      brandId: input.brandId || null,
      brandName: input.brandName?.trim() || null,
      unit: input.unit.trim(),
      currency: input.currency ?? 'INR',
      price: input.price,
      purchaseDate,
      supplierName: input.supplierName?.trim() || null,
      notes: input.notes?.trim() || null,
      sourceLabel: COMMUNITY_PRICE_SOURCE,
      status,
      trustScore,
      isOutlier,
      outlierRatio,
      referenceMidPrice: referenceMid,
      isDuplicate,
      duplicateOfId,
      invoiceStorageKey,
      invoiceMimeType,
      invoiceOriginalName,
      invoiceByteSize,
      metadata: {
        version: COMMUNITY_PRICE_VERSION,
        neverPromotesToPrimaryMarket: true,
      } as never,
    });

    return {
      report: this.serialize(row as ReportRow, 'owner'),
      message:
        status === 'FLAGGED'
          ? 'Report received and flagged for review (duplicate or outlier signals). It will not appear in public aggregates until verified.'
          : 'Report received and pending moderation. Unverified community reports are never promoted into primary market prices.',
      qualification: COMMUNITY_PRICE_QUALIFICATION,
    };
  }

  async moderate(
    adminUserId: string | null | undefined,
    reportId: string,
    raw: ModerateCommunityPriceReportInput,
  ) {
    if (!adminUserId) throw new UnauthorizedException('Authentication required.');
    const input = moderateCommunityPriceReportSchema.parse(raw);
    const existing = await this.repos.constructionCommunityPriceReports.findById(reportId);
    if (!existing) throw new NotFoundException('Report not found.');

    // Moderation never writes to construction_material_prices.
    const updated = await this.repos.constructionCommunityPriceReports.update(reportId, {
      status: input.status,
      moderationNotes: input.moderationNotes ?? existing.moderationNotes,
      trustScore: input.trustScore ?? existing.trustScore,
      moderatedBy: adminUserId,
      moderatedAt: new Date(),
      // Clear outlier only when explicitly verifying with notes of override via trustScore bump —
      // keep isOutlier as recorded unless admin verifies (eligible filter uses isOutlier).
      ...(input.status === 'VERIFIED'
        ? { isOutlier: false }
        : input.status === 'FLAGGED'
          ? {}
          : {}),
    });

    return {
      report: this.serialize(updated as ReportRow, 'admin'),
      note: 'Moderation updated community report only — primary market prices were not modified.',
    };
  }

  async listForModeration(status?: string) {
    const rows = await this.repos.constructionCommunityPriceReports.listForModeration(status);
    return {
      items: rows.map((r) => this.serialize(r as ReportRow, 'admin')),
      qualification: COMMUNITY_PRICE_QUALIFICATION,
      neverPromotesToPrimaryMarket: true,
    };
  }

  async downloadInvoice(
    reportId: string,
    userId?: string | null,
    admin = false,
  ): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const uid = this.requireUser(userId);
    const row = await this.repos.constructionCommunityPriceReports.findById(reportId);
    if (!row || !row.invoiceStorageKey) {
      throw new NotFoundException('Invoice not found.');
    }
    if (!admin && row.userId !== uid) {
      throw new ForbiddenException('You cannot access this invoice.');
    }
    await this.storage.assertConfigured();
    const downloaded = await this.storage.downloadBuffer(row.invoiceStorageKey);
    return {
      buffer: downloaded.buffer,
      mimeType: row.invoiceMimeType || downloaded.contentType || 'application/octet-stream',
      filename: row.invoiceOriginalName || 'invoice',
    };
  }

  async removeMine(userId: string | null | undefined, reportId: string) {
    const uid = this.requireUser(userId);
    const row = await this.repos.constructionCommunityPriceReports.findByIdForUser(reportId, uid);
    if (!row) throw new NotFoundException('Report not found.');
    if (row.status === 'VERIFIED') {
      throw new BadRequestException('Verified reports cannot be deleted by contributors.');
    }
    await this.repos.constructionCommunityPriceReports.softDelete(reportId);
    return { deleted: true };
  }
}
