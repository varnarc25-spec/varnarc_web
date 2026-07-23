import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PERMISSIONS } from '@varnarc/auth';
import { SECURITY_RATE_LIMITS } from '@varnarc/config';
import type { CurrentUser } from '@varnarc/types';
import {
  createNewsletterCampaignSchema,
  createNewsletterTemplateSchema,
  newsletterCampaignListQuerySchema,
  newsletterSubscribeSchema,
  newsletterSubscriberListQuerySchema,
  newsletterTemplateListQuerySchema,
  newsletterUnsubscribeSchema,
  sendNewsletterCampaignSchema,
  updateNewsletterCampaignSchema,
  updateNewsletterTemplateSchema,
  type CreateNewsletterCampaignInput,
  type CreateNewsletterTemplateInput,
  type NewsletterCampaignListQuery,
  type NewsletterSubscriberListQuery,
  type NewsletterTemplateListQuery,
  type SendNewsletterCampaignInput,
  type UpdateNewsletterCampaignInput,
  type UpdateNewsletterTemplateInput,
} from '@varnarc/validation';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok, okCursor } from '../../common/utils/response';
import { NewsletterService } from './newsletter.service';

@ApiTags('newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly service: NewsletterService) {}

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Newsletter module health and subscriber counts' })
  async status() {
    return ok(await this.service.status());
  }

  @Public()
  @Post('subscribe')
  @Throttle({ default: { limit: SECURITY_RATE_LIMITS.newsletter, ttl: 60_000 } })
  @ApiOperation({ summary: 'Subscribe an email to the newsletter' })
  async subscribe(
    @Body(new ZodValidationPipe(newsletterSubscribeSchema)) body: unknown,
    @CurrentUserDecorator() user?: CurrentUser,
  ) {
    const input = newsletterSubscribeSchema.parse(body);
    return ok(await this.service.subscribe(input, user?.id));
  }

  @Public()
  @Post('unsubscribe')
  @Throttle({ default: { limit: SECURITY_RATE_LIMITS.newsletter, ttl: 60_000 } })
  @ApiOperation({ summary: 'Unsubscribe an email from the newsletter' })
  async unsubscribe(
    @Body(new ZodValidationPipe(newsletterUnsubscribeSchema)) body: unknown,
    @CurrentUserDecorator() user?: CurrentUser,
  ) {
    const input = newsletterUnsubscribeSchema.parse(body);
    return ok(await this.service.unsubscribe(input, user?.id));
  }

  @Get('dashboard')
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_VIEW)
  @ApiOperation({ summary: 'Newsletter subscriber summary (admin)' })
  async dashboard() {
    return ok(await this.service.dashboard());
  }

  @Get('subscribers')
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_VIEW)
  @ApiOperation({ summary: 'List newsletter subscribers (admin)' })
  async listSubscribers(
    @Query(new ZodValidationPipe(newsletterSubscriberListQuerySchema)) query: NewsletterSubscriberListQuery,
  ) {
    const page = await this.service.listSubscribers(query);
    return okCursor({
      items: page.items,
      nextCursor: page.nextCursor,
      prevCursor: page.prevCursor,
      hasMore: page.hasMore,
      limit: query.limit ?? 20,
    });
  }

  @Get('templates')
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_VIEW)
  async listTemplates(
    @Query(new ZodValidationPipe(newsletterTemplateListQuerySchema)) query: NewsletterTemplateListQuery,
  ) {
    const page = await this.service.listTemplates(query);
    return okCursor({
      items: page.items,
      nextCursor: page.nextCursor,
      prevCursor: page.prevCursor,
      hasMore: page.hasMore,
      limit: query.limit ?? 20,
    });
  }

  @Get('templates/:id')
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_VIEW)
  async getTemplate(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getTemplate(id));
  }

  @Post('templates')
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_MANAGE)
  async createTemplate(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createNewsletterTemplateSchema)) body: CreateNewsletterTemplateInput,
  ) {
    return ok(await this.service.createTemplate(body, user.id));
  }

  @Put('templates/:id')
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_MANAGE)
  async updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateNewsletterTemplateSchema)) body: UpdateNewsletterTemplateInput,
  ) {
    return ok(await this.service.updateTemplate(id, body, user.id));
  }

  @Delete('templates/:id')
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_MANAGE)
  async deleteTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.deleteTemplate(id, user.id));
  }

  @Get('campaigns')
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_VIEW)
  async listCampaigns(
    @Query(new ZodValidationPipe(newsletterCampaignListQuerySchema)) query: NewsletterCampaignListQuery,
  ) {
    const page = await this.service.listCampaigns(query);
    return okCursor({
      items: page.items,
      nextCursor: page.nextCursor,
      prevCursor: page.prevCursor,
      hasMore: page.hasMore,
      limit: query.limit ?? 20,
    });
  }

  @Get('campaigns/:id')
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_VIEW)
  async getCampaign(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getCampaign(id));
  }

  @Post('campaigns')
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_MANAGE)
  async createCampaign(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createNewsletterCampaignSchema)) body: CreateNewsletterCampaignInput,
  ) {
    return ok(await this.service.createCampaign(body, user.id));
  }

  @Put('campaigns/:id')
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_MANAGE)
  async updateCampaign(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateNewsletterCampaignSchema)) body: UpdateNewsletterCampaignInput,
  ) {
    return ok(await this.service.updateCampaign(id, body, user.id));
  }

  @Delete('campaigns/:id')
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_MANAGE)
  async deleteCampaign(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.deleteCampaign(id, user.id));
  }

  @Post('campaigns/:id/send')
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_MANAGE)
  async sendCampaign(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(sendNewsletterCampaignSchema)) body: SendNewsletterCampaignInput,
  ) {
    return ok(await this.service.sendCampaign(id, body, user.id));
  }

  @Post('campaigns/process-scheduled')
  @RequirePermissions(PERMISSIONS.NOTIFICATIONS_MANAGE)
  async processScheduled(@CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.processScheduled(user.id));
  }
}
