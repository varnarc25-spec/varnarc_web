import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import type {
  CreateAdCampaignInput,
  CreateAdPlacementInput,
  CreateAdvertisementInput,
  CursorPaginationQuery,
  PlacementQueryInput,
  TrackAdEventInput,
  UpdateAdCampaignInput,
  UpdateAdPlacementInput,
  UpdateAdvertisementInput,
} from '@varnarc/validation';
import { REPOS } from '../../database/database.module';

function assertSafeUrl(url: string | null | undefined) {
  if (!url) return;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new BadRequestException({
      success: false,
      error: { code: 'INVALID_URL', message: 'Invalid destination URL.' },
    });
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new BadRequestException({
      success: false,
      error: { code: 'INVALID_URL', message: 'Only http(s) URLs are allowed.' },
    });
  }
}

function sanitizeHtmlSnippet(html: string | null | undefined) {
  if (!html) return html ?? null;
  // Strip script tags from HTML creatives; JS ads use javascriptCode field instead.
  return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
}

@Injectable()
export class AdvertisementsService {
  constructor(@Inject(REPOS) private readonly repos: Repositories) {}

  private async audit(
    actorId: string,
    action: string,
    entityId: string,
    before?: unknown,
    after?: unknown,
  ) {
    await this.repos.auditLogs.create({
      userId: actorId,
      action,
      entity: 'advertisement',
      entityId,
      oldValue: before as never,
      newValue: after as never,
    });
  }

  // —— Campaigns ——
  listCampaigns(
    query: CursorPaginationQuery & { status?: string; search?: string },
  ) {
    return this.repos.adCampaigns.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      status: query.status as never,
      search: query.search,
    });
  }

  async getCampaign(id: string) {
    const row = await this.repos.adCampaigns.findById(id);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Campaign not found.' },
      });
    }
    return row;
  }

  async createCampaign(input: CreateAdCampaignInput, actorId: string) {
    const row = await this.repos.adCampaigns.create({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      status: input.status,
      startsAt: input.startsAt ?? undefined,
      endsAt: input.endsAt ?? undefined,
      budget: input.budget ?? undefined,
      priority: input.priority ?? 0,
      maxImpressions: input.maxImpressions ?? null,
      maxClicks: input.maxClicks ?? null,
      utmSource: input.utmSource ?? null,
      utmMedium: input.utmMedium ?? null,
      utmCampaign: input.utmCampaign ?? null,
      ...(input.sponsorId ? { sponsor: { connect: { id: input.sponsorId } } } : {}),
      createdBy: actorId,
      updatedBy: actorId,
    });
    await this.audit(actorId, 'campaign.create', row.id, null, row);
    return row;
  }

  async updateCampaign(id: string, input: UpdateAdCampaignInput, actorId: string) {
    const existing = await this.getCampaign(id);
    const row = await this.repos.adCampaigns.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
      ...(input.endsAt !== undefined ? { endsAt: input.endsAt } : {}),
      ...(input.budget !== undefined ? { budget: input.budget } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.maxImpressions !== undefined
        ? { maxImpressions: input.maxImpressions }
        : {}),
      ...(input.maxClicks !== undefined ? { maxClicks: input.maxClicks } : {}),
      ...(input.utmSource !== undefined ? { utmSource: input.utmSource } : {}),
      ...(input.utmMedium !== undefined ? { utmMedium: input.utmMedium } : {}),
      ...(input.utmCampaign !== undefined ? { utmCampaign: input.utmCampaign } : {}),
      ...(input.sponsorId !== undefined
        ? input.sponsorId
          ? { sponsor: { connect: { id: input.sponsorId } } }
          : { sponsor: { disconnect: true } }
        : {}),
      updatedBy: actorId,
    });
    await this.audit(actorId, 'campaign.update', id, existing, row);
    return row;
  }

  async duplicateCampaign(id: string, actorId: string) {
    const source = await this.getCampaign(id);
    const slug = `${source.slug}-copy-${Date.now().toString(36)}`;
    const row = await this.repos.adCampaigns.create({
      name: `${source.name} (Copy)`,
      slug,
      description: source.description,
      status: 'DRAFT',
      startsAt: source.startsAt,
      endsAt: source.endsAt,
      budget: source.budget ?? undefined,
      priority: source.priority,
      maxImpressions: source.maxImpressions,
      maxClicks: source.maxClicks,
      utmSource: source.utmSource,
      utmMedium: source.utmMedium,
      utmCampaign: source.utmCampaign,
      ...(source.sponsorId
        ? { sponsor: { connect: { id: source.sponsorId } } }
        : {}),
      createdBy: actorId,
      updatedBy: actorId,
    });
    await this.audit(actorId, 'campaign.duplicate', row.id, source, row);
    return row;
  }

  async removeCampaign(id: string, actorId: string) {
    const existing = await this.getCampaign(id);
    const ok = await this.repos.adCampaigns.softDelete(id, actorId);
    if (!ok) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Campaign not found.' },
      });
    }
    await this.audit(actorId, 'campaign.delete', id, existing, { deleted: true });
    return { deleted: true };
  }

  // —— Placements ——
  listPlacements(query: CursorPaginationQuery & { search?: string }) {
    return this.repos.adPlacements.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      search: query.search,
    });
  }

  async getPlacement(id: string) {
    const row = await this.repos.adPlacements.findById(id);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Placement not found.' },
      });
    }
    return row;
  }

  async createPlacement(input: CreateAdPlacementInput, actorId: string) {
    const row = await this.repos.adPlacements.create({
      slug: input.slug,
      name: input.name,
      description: input.description ?? null,
      location: input.location ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      rotationMode: input.rotationMode,
    });
    await this.audit(actorId, 'placement.create', row.id, null, row);
    return row;
  }

  async updatePlacement(id: string, input: UpdateAdPlacementInput, actorId: string) {
    const existing = await this.getPlacement(id);
    const row = await this.repos.adPlacements.update(id, {
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
      ...(input.width !== undefined ? { width: input.width } : {}),
      ...(input.height !== undefined ? { height: input.height } : {}),
      ...(input.rotationMode !== undefined ? { rotationMode: input.rotationMode } : {}),
    });
    await this.audit(actorId, 'placement.update', id, existing, row);
    return row;
  }

  async removePlacement(id: string, actorId: string) {
    const existing = await this.getPlacement(id);
    const ok = await this.repos.adPlacements.softDelete(id, actorId);
    if (!ok) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Placement not found.' },
      });
    }
    await this.audit(actorId, 'placement.delete', id, existing, { deleted: true });
    return { deleted: true };
  }

  // —— Ads ——
  listAds(
    query: CursorPaginationQuery & {
      campaignId?: string;
      placementId?: string;
      status?: string;
      type?: string;
      search?: string;
    },
  ) {
    return this.repos.advertisements.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      campaignId: query.campaignId,
      placementId: query.placementId,
      status: query.status as never,
      type: query.type,
      search: query.search,
    });
  }

  async getAd(id: string) {
    const row = await this.repos.advertisements.findById(id);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Advertisement not found.' },
      });
    }
    return row;
  }

  async createAd(input: CreateAdvertisementInput, actorId: string) {
    assertSafeUrl(input.targetUrl || null);
    assertSafeUrl(input.creativeUrl || null);
    if (input.htmlContent && input.htmlContent.length > 50_000) {
      throw new BadRequestException({
        success: false,
        error: { code: 'HTML_TOO_LARGE', message: 'HTML content exceeds size limit.' },
      });
    }

    const row = await this.repos.advertisements.create({
      name: input.name,
      slug: input.slug,
      type: input.type,
      provider: input.provider,
      contentType: input.contentType,
      status: input.status,
      creativeUrl: input.creativeUrl || null,
      htmlContent: sanitizeHtmlSnippet(input.htmlContent),
      javascriptCode: input.javascriptCode || null,
      targetUrl: input.targetUrl || null,
      adsenseSlot: input.adsenseSlot || null,
      adsenseClient: input.adsenseClient || null,
      priority: input.priority ?? 0,
      weight: input.weight ?? 1,
      maxImpressions: input.maxImpressions ?? null,
      maxClicks: input.maxClicks ?? null,
      startsAt: input.startsAt ?? undefined,
      endsAt: input.endsAt ?? undefined,
      targeting: input.targeting as never,
      metadata: input.metadata as never,
      campaign: { connect: { id: input.campaignId } },
      ...(input.placementId
        ? { placement: { connect: { id: input.placementId } } }
        : {}),
      createdBy: actorId,
      updatedBy: actorId,
    });
    await this.audit(actorId, 'ad.create', row.id, null, row);
    return row;
  }

  async updateAd(id: string, input: UpdateAdvertisementInput, actorId: string) {
    const existing = await this.getAd(id);
    if (input.targetUrl !== undefined) assertSafeUrl(input.targetUrl || null);
    if (input.creativeUrl !== undefined) assertSafeUrl(input.creativeUrl || null);

    const row = await this.repos.advertisements.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.provider !== undefined ? { provider: input.provider } : {}),
      ...(input.contentType !== undefined ? { contentType: input.contentType } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.creativeUrl !== undefined ? { creativeUrl: input.creativeUrl || null } : {}),
      ...(input.htmlContent !== undefined
        ? { htmlContent: sanitizeHtmlSnippet(input.htmlContent) }
        : {}),
      ...(input.javascriptCode !== undefined
        ? { javascriptCode: input.javascriptCode || null }
        : {}),
      ...(input.targetUrl !== undefined ? { targetUrl: input.targetUrl || null } : {}),
      ...(input.adsenseSlot !== undefined ? { adsenseSlot: input.adsenseSlot || null } : {}),
      ...(input.adsenseClient !== undefined
        ? { adsenseClient: input.adsenseClient || null }
        : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.weight !== undefined ? { weight: input.weight } : {}),
      ...(input.maxImpressions !== undefined
        ? { maxImpressions: input.maxImpressions }
        : {}),
      ...(input.maxClicks !== undefined ? { maxClicks: input.maxClicks } : {}),
      ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
      ...(input.endsAt !== undefined ? { endsAt: input.endsAt } : {}),
      ...(input.targeting !== undefined ? { targeting: input.targeting as never } : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata as never } : {}),
      ...(input.placementId !== undefined
        ? input.placementId
          ? { placement: { connect: { id: input.placementId } } }
          : { placement: { disconnect: true } }
        : {}),
      updatedBy: actorId,
    });
    await this.audit(actorId, 'ad.update', id, existing, row);
    return row;
  }

  async publishAd(id: string, actorId: string) {
    const existing = await this.getAd(id);
    const row = await this.repos.advertisements.update(id, {
      status: 'ACTIVE',
      updatedBy: actorId,
    });
    if (existing.campaign.status === 'DRAFT' || existing.campaign.status === 'SCHEDULED') {
      await this.repos.adCampaigns.update(existing.campaignId, {
        status: 'ACTIVE',
        updatedBy: actorId,
      });
    }
    await this.audit(actorId, 'ad.publish', id, existing, row);
    return row;
  }

  async removeAd(id: string, actorId: string) {
    const existing = await this.getAd(id);
    const ok = await this.repos.advertisements.softDelete(id, actorId);
    if (!ok) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Advertisement not found.' },
      });
    }
    await this.audit(actorId, 'ad.delete', id, existing, { deleted: true });
    return { deleted: true };
  }

  // —— Public ——
  async getForPlacement(slug: string, query: PlacementQueryInput) {
    const result = await this.repos.advertisements.findActiveForPlacement(slug, {
      pageType: query.pageType,
      categoryId: query.categoryId,
      articleId: query.articleId,
      reviewId: query.reviewId,
      directoryId: query.directoryId,
      calculatorId: query.calculatorId,
      device: query.device,
      limit: query.limit,
    });
    return {
      placement: result.placement
        ? {
            id: result.placement.id,
            slug: result.placement.slug,
            name: result.placement.name,
            location: result.placement.location,
            rotationMode: result.placement.rotationMode,
          }
        : null,
      ads: result.ads.map((ad) => ({
        id: ad.id,
        name: ad.name,
        slug: ad.slug,
        type: ad.type,
        provider: ad.provider,
        contentType: ad.contentType,
        creativeUrl: ad.creativeUrl,
        htmlContent: ad.htmlContent,
        // Do not expose raw javascript for XSS; only AdSense slot metadata publicly
        adsenseSlot: ad.adsenseSlot,
        adsenseClient: ad.adsenseClient,
        targetUrl: ad.targetUrl,
        priority: ad.priority,
        campaign: {
          id: ad.campaign.id,
          name: ad.campaign.name,
          utmSource: ad.campaign.utmSource,
          utmMedium: ad.campaign.utmMedium,
          utmCampaign: ad.campaign.utmCampaign,
        },
      })),
    };
  }

  async trackImpression(adId: string, meta: TrackAdEventInput) {
    try {
      await this.getAd(adId);
      return await this.repos.advertisements.recordImpression(adId, meta);
    } catch {
      // Tracking must never break callers — return soft failure
      return { recorded: false };
    }
  }

  async trackClick(adId: string, meta: TrackAdEventInput) {
    try {
      await this.getAd(adId);
      return await this.repos.advertisements.recordClick(adId, meta);
    } catch {
      return { recorded: false };
    }
  }

  analytics() {
    return this.repos.advertisements.analyticsSummary();
  }
}
