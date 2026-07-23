import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import {
  createAdCampaignSchema,
  createAdPlacementSchema,
  createAdvertisementSchema,
  cursorPaginationQuerySchema,
  placementQuerySchema,
  trackAdEventSchema,
  updateAdCampaignSchema,
  updateAdPlacementSchema,
  updateAdvertisementSchema,
  type CreateAdCampaignInput,
  type CreateAdPlacementInput,
  type CreateAdvertisementInput,
  type CursorPaginationQuery,
  type PlacementQueryInput,
  type TrackAdEventInput,
  type UpdateAdCampaignInput,
  type UpdateAdPlacementInput,
  type UpdateAdvertisementInput,
} from '@varnarc/validation';
import { z } from 'zod';
import type { CurrentUser } from '@varnarc/types';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok, okCursor } from '../../common/utils/response';
import { AdvertisementsService } from './advertisements.service';

const campaignListSchema = cursorPaginationQuerySchema.extend({
  status: z.string().optional(),
  search: z.string().optional(),
});

const adListSchema = cursorPaginationQuerySchema.extend({
  status: z.string().optional(),
  type: z.string().optional(),
  campaignId: z.string().uuid().optional(),
  placementId: z.string().uuid().optional(),
  search: z.string().optional(),
});

@ApiTags('advertisements')
@Controller('advertisements')
export class AdvertisementsController {
  constructor(private readonly service: AdvertisementsService) {}

  // —— Analytics ——
  @Get('analytics/summary')
  @RequirePermissions(PERMISSIONS.ADVERTISEMENT_VIEW)
  async analytics() {
    return ok(await this.service.analytics());
  }

  // —— Campaigns ——
  @Get('campaigns')
  @RequirePermissions(PERMISSIONS.ADVERTISEMENT_VIEW)
  async listCampaigns(
    @Query(new ZodValidationPipe(campaignListSchema))
    query: CursorPaginationQuery & { status?: string; search?: string },
  ) {
    return okCursor(await this.service.listCampaigns(query));
  }

  @Get('campaigns/:id')
  @RequirePermissions(PERMISSIONS.ADVERTISEMENT_VIEW)
  async getCampaign(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getCampaign(id));
  }

  @Post('campaigns')
  @RequirePermissions(PERMISSIONS.ADVERTISEMENT_CREATE)
  async createCampaign(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createAdCampaignSchema)) body: CreateAdCampaignInput,
  ) {
    return ok(await this.service.createCampaign(body, user.id));
  }

  @Put('campaigns/:id')
  @RequirePermissions(PERMISSIONS.ADVERTISEMENT_EDIT)
  async updateCampaign(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateAdCampaignSchema)) body: UpdateAdCampaignInput,
  ) {
    return ok(await this.service.updateCampaign(id, body, user.id));
  }

  @Post('campaigns/:id/duplicate')
  @RequirePermissions(PERMISSIONS.ADVERTISEMENT_CREATE)
  async duplicateCampaign(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.duplicateCampaign(id, user.id));
  }

  @Delete('campaigns/:id')
  @RequirePermissions(PERMISSIONS.ADVERTISEMENT_DELETE)
  async removeCampaign(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.removeCampaign(id, user.id));
  }

  // —— Placements ——
  @Get('placements')
  @RequirePermissions(PERMISSIONS.ADVERTISEMENT_VIEW)
  async listPlacements(
    @Query(new ZodValidationPipe(cursorPaginationQuerySchema.extend({ search: z.string().optional() })))
    query: CursorPaginationQuery & { search?: string },
  ) {
    return okCursor(await this.service.listPlacements(query));
  }

  @Get('placements/:id')
  @RequirePermissions(PERMISSIONS.ADVERTISEMENT_VIEW)
  async getPlacement(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getPlacement(id));
  }

  @Post('placements')
  @RequirePermissions(PERMISSIONS.ADVERTISEMENT_CREATE)
  async createPlacement(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createAdPlacementSchema)) body: CreateAdPlacementInput,
  ) {
    return ok(await this.service.createPlacement(body, user.id));
  }

  @Put('placements/:id')
  @RequirePermissions(PERMISSIONS.ADVERTISEMENT_EDIT)
  async updatePlacement(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateAdPlacementSchema)) body: UpdateAdPlacementInput,
  ) {
    return ok(await this.service.updatePlacement(id, body, user.id));
  }

  @Delete('placements/:id')
  @RequirePermissions(PERMISSIONS.ADVERTISEMENT_DELETE)
  async removePlacement(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.removePlacement(id, user.id));
  }

  // —— Public placement delivery (before :id routes) ——
  @Public()
  @Get('placement/:slug')
  async publicPlacement(
    @Param('slug') slug: string,
    @Query(new ZodValidationPipe(placementQuerySchema)) query: PlacementQueryInput,
  ) {
    return ok(await this.service.getForPlacement(slug, query));
  }

  // —— Ads ——
  @Get()
  @RequirePermissions(PERMISSIONS.ADVERTISEMENT_VIEW)
  async listAds(
    @Query(new ZodValidationPipe(adListSchema))
    query: CursorPaginationQuery & {
      campaignId?: string;
      placementId?: string;
      status?: string;
      type?: string;
      search?: string;
    },
  ) {
    return okCursor(await this.service.listAds(query));
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.ADVERTISEMENT_VIEW)
  async getAd(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getAd(id));
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ADVERTISEMENT_CREATE)
  async createAd(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createAdvertisementSchema)) body: CreateAdvertisementInput,
  ) {
    return ok(await this.service.createAd(body, user.id));
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.ADVERTISEMENT_EDIT)
  async updateAd(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateAdvertisementSchema)) body: UpdateAdvertisementInput,
  ) {
    return ok(await this.service.updateAd(id, body, user.id));
  }

  @Post(':id/publish')
  @RequirePermissions(PERMISSIONS.ADVERTISEMENT_PUBLISH)
  async publishAd(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.publishAd(id, user.id));
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.ADVERTISEMENT_DELETE)
  async removeAd(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.removeAd(id, user.id));
  }

  @Public()
  @Post('impression')
  async impressionBody(@Body(new ZodValidationPipe(trackAdEventSchema.extend({ adId: z.string().uuid() }))) body: TrackAdEventInput & { adId: string }) {
    return ok(await this.service.trackImpression(body.adId, body));
  }

  @Public()
  @Post('click')
  async clickBody(@Body(new ZodValidationPipe(trackAdEventSchema.extend({ adId: z.string().uuid() }))) body: TrackAdEventInput & { adId: string }) {
    return ok(await this.service.trackClick(body.adId, body));
  }

  @Public()
  @Post(':id/impressions')
  async impression(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(trackAdEventSchema)) body: TrackAdEventInput,
  ) {
    return ok(await this.service.trackImpression(id, body));
  }

  @Public()
  @Post(':id/clicks')
  async click(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(trackAdEventSchema)) body: TrackAdEventInput,
  ) {
    return ok(await this.service.trackClick(id, body));
  }
}
