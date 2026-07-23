import type {
  AdRotationMode,
  AdStatus,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import {
  BaseRepository,
  findActiveById,
  listActiveWithCursor,
  softDeleteById,
} from '../base.repository';
import type { CursorPageParams } from '../../pagination';

type TargetingContext = {
  pageType?: string;
  categoryId?: string;
  articleId?: string;
  reviewId?: string;
  directoryId?: string;
  calculatorId?: string;
  device?: string;
};

function matchesTargeting(
  targeting: unknown,
  ctx: TargetingContext,
): boolean {
  if (!targeting || typeof targeting !== 'object') return true;
  const t = targeting as Record<string, unknown>;

  const pageTypes = t.pageTypes as string[] | undefined;
  if (pageTypes?.length && ctx.pageType && !pageTypes.includes(ctx.pageType)) {
    return false;
  }

  const devices = t.devices as string[] | undefined;
  if (devices?.length && ctx.device && !devices.includes(ctx.device)) {
    return false;
  }

  const checks: Array<[string[] | undefined, string | undefined]> = [
    [t.categoryIds as string[] | undefined, ctx.categoryId],
    [t.articleIds as string[] | undefined, ctx.articleId],
    [t.reviewIds as string[] | undefined, ctx.reviewId],
    [t.directoryIds as string[] | undefined, ctx.directoryId],
    [t.calculatorIds as string[] | undefined, ctx.calculatorId],
  ];

  for (const [ids, value] of checks) {
    if (ids?.length && value && !ids.includes(value)) return false;
  }

  return true;
}

function pickByRotation<T extends { priority: number; weight: number; id: string }>(
  ads: T[],
  mode: AdRotationMode,
): T | null {
  if (!ads.length) return null;
  if (mode === 'PRIORITY' || mode === 'SEQUENTIAL') {
    return [...ads].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))[0] ?? null;
  }
  if (mode === 'RANDOM') {
    return ads[Math.floor(Math.random() * ads.length)] ?? null;
  }
  // WEIGHTED
  const total = ads.reduce((sum, ad) => sum + Math.max(1, ad.weight), 0);
  let roll = Math.random() * total;
  for (const ad of ads) {
    roll -= Math.max(1, ad.weight);
    if (roll <= 0) return ad;
  }
  return ads[ads.length - 1] ?? null;
}

export class AdPlacementRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.adPlacement.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { ads: true } } },
    });
  }

  findBySlug(slug: string) {
    return this.db.adPlacement.findFirst({
      where: { slug, deletedAt: null },
    });
  }

  list(params: CursorPageParams & { search?: string } = {}) {
    return listActiveWithCursor(this.db.adPlacement, {
      ...params,
      where: params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { slug: { contains: params.search, mode: 'insensitive' } },
              { location: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: { _count: { select: { ads: true } } },
    });
  }

  create(data: Prisma.AdPlacementCreateInput) {
    return this.db.adPlacement.create({ data });
  }

  update(id: string, data: Prisma.AdPlacementUpdateInput) {
    return this.db.adPlacement.update({ where: { id }, data });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.adPlacement, id, actorId);
  }

  async upsertDefaults(
    defaults: Array<{
      slug: string;
      name: string;
      location?: string;
      description?: string;
    }>,
  ) {
    for (const item of defaults) {
      await this.db.adPlacement.upsert({
        where: { slug: item.slug },
        update: {
          name: item.name,
          location: item.location,
          description: item.description,
          deletedAt: null,
        },
        create: {
          slug: item.slug,
          name: item.name,
          location: item.location,
          description: item.description,
        },
      });
    }
  }
}

export class AdCampaignRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.adCampaign.findFirst({
      where: { id, deletedAt: null },
      include: { sponsor: true, ads: true, _count: { select: { ads: true } } },
    });
  }

  findBySlug(slug: string) {
    return this.db.adCampaign.findFirst({
      where: { slug, deletedAt: null },
      include: { sponsor: true, ads: true },
    });
  }

  list(
    params: CursorPageParams & {
      status?: AdStatus;
      sponsorId?: string;
      search?: string;
    } = {},
  ) {
    return listActiveWithCursor(this.db.adCampaign, {
      ...params,
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.sponsorId ? { sponsorId: params.sponsorId } : {}),
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { slug: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { sponsor: true, _count: { select: { ads: true } } },
    });
  }

  create(data: Prisma.AdCampaignCreateInput) {
    return this.db.adCampaign.create({ data });
  }

  update(id: string, data: Prisma.AdCampaignUpdateInput) {
    return this.db.adCampaign.update({ where: { id }, data });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.adCampaign, id, actorId);
  }
}

export class AdvertisementRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.advertisement.findFirst({
      where: { id, deletedAt: null },
      include: {
        campaign: true,
        placement: true,
        _count: { select: { impressions: true, clicks: true } },
      },
    });
  }

  list(
    params: CursorPageParams & {
      status?: AdStatus;
      campaignId?: string;
      placementId?: string;
      type?: string;
      search?: string;
    } = {},
  ) {
    return listActiveWithCursor(this.db.advertisement, {
      ...params,
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.campaignId ? { campaignId: params.campaignId } : {}),
        ...(params.placementId ? { placementId: params.placementId } : {}),
        ...(params.type ? { type: params.type as never } : {}),
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
        campaign: true,
        placement: true,
        _count: { select: { impressions: true, clicks: true } },
      },
    });
  }

  create(data: Prisma.AdvertisementCreateInput) {
    return this.db.advertisement.create({
      data,
      include: { campaign: true, placement: true },
    });
  }

  update(id: string, data: Prisma.AdvertisementUpdateInput) {
    return this.db.advertisement.update({
      where: { id },
      data,
      include: { campaign: true, placement: true },
    });
  }

  async findActiveForPlacement(
    placementSlug: string,
    ctx: TargetingContext & { limit?: number } = {},
  ) {
    const placement = await this.db.adPlacement.findFirst({
      where: { slug: placementSlug, deletedAt: null },
    });
    if (!placement) return { placement: null, ads: [] as never[] };

    const now = new Date();
    const candidates = await this.db.advertisement.findMany({
      where: {
        deletedAt: null,
        placementId: placement.id,
        status: { in: ['ACTIVE', 'SCHEDULED'] },
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
        campaign: {
          deletedAt: null,
          status: { in: ['ACTIVE', 'SCHEDULED'] },
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
          ],
        },
      },
      include: {
        campaign: true,
        placement: true,
        _count: { select: { impressions: true, clicks: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    const eligible = candidates.filter((ad) => {
      if (ad.status === 'SCHEDULED' && ad.startsAt && ad.startsAt > now) return false;
      if (ad.maxImpressions != null && ad._count.impressions >= ad.maxImpressions) {
        return false;
      }
      if (ad.maxClicks != null && ad._count.clicks >= ad.maxClicks) return false;
      return matchesTargeting(ad.targeting, ctx);
    });

    const limit = Math.max(1, Math.min(ctx.limit ?? 1, 10));
    const selected: typeof eligible = [];
    const pool = [...eligible];
    while (selected.length < limit && pool.length) {
      const pick = pickByRotation(pool, placement.rotationMode);
      if (!pick) break;
      selected.push(pick);
      const idx = pool.findIndex((a) => a.id === pick.id);
      if (idx >= 0) pool.splice(idx, 1);
    }

    return { placement, ads: selected };
  }

  recordImpression(
    adId: string,
    meta?: {
      sessionId?: string | null;
      pagePath?: string | null;
      userAgent?: string | null;
      referrer?: string | null;
      device?: string | null;
    },
  ) {
    return this.db.adImpression.create({
      data: {
        adId,
        sessionId: meta?.sessionId ?? undefined,
        pagePath: meta?.pagePath ?? undefined,
        userAgent: meta?.userAgent ?? undefined,
        referrer: meta?.referrer ?? undefined,
        device: meta?.device ?? undefined,
      },
    });
  }

  recordClick(
    adId: string,
    meta?: {
      sessionId?: string | null;
      pagePath?: string | null;
      destinationUrl?: string | null;
      referrer?: string | null;
      userAgent?: string | null;
      device?: string | null;
    },
  ) {
    return this.db.adClick.create({
      data: {
        adId,
        sessionId: meta?.sessionId ?? undefined,
        pagePath: meta?.pagePath ?? undefined,
        destinationUrl: meta?.destinationUrl ?? undefined,
        referrer: meta?.referrer ?? undefined,
        userAgent: meta?.userAgent ?? undefined,
        device: meta?.device ?? undefined,
      },
    });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.advertisement, id, actorId);
  }

  async analyticsSummary() {
    const [impressions, clicks, byPlacement, topAds] = await Promise.all([
      this.db.adImpression.count(),
      this.db.adClick.count(),
      this.db.adImpression.groupBy({
        by: ['adId'],
        _count: { _all: true },
        orderBy: { _count: { adId: 'desc' } },
        take: 20,
      }),
      this.db.advertisement.findMany({
        where: { deletedAt: null },
        take: 20,
        orderBy: { updatedAt: 'desc' },
        include: {
          placement: true,
          campaign: true,
          _count: { select: { impressions: true, clicks: true } },
        },
      }),
    ]);

    const ctr = impressions > 0 ? clicks / impressions : 0;
    return {
      impressions,
      clicks,
      ctr,
      topAds: topAds.map((ad) => ({
        id: ad.id,
        name: ad.name,
        slug: ad.slug,
        type: ad.type,
        status: ad.status,
        placement: ad.placement?.slug ?? null,
        campaign: ad.campaign.name,
        impressions: ad._count.impressions,
        clicks: ad._count.clicks,
        ctr:
          ad._count.impressions > 0
            ? ad._count.clicks / ad._count.impressions
            : 0,
      })),
      impressionLeaders: byPlacement,
    };
  }
}

export class SponsorRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return findActiveById(this.db.sponsor, id);
  }

  list(params: CursorPageParams & { search?: string } = {}) {
    return listActiveWithCursor(this.db.sponsor, {
      ...params,
      where: params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { slug: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : undefined,
    });
  }

  create(data: Prisma.SponsorCreateInput) {
    return this.db.sponsor.create({ data });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.sponsor, id, actorId);
  }
}
