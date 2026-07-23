import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import type { CurrentUser } from '@varnarc/types';
import {
  analyticsDashboardQuerySchema,
  analyticsEventsQuerySchema,
  analyticsExportQuerySchema,
  analyticsIntegrationsSchema,
  analyticsReportsQuerySchema,
  adsenseRevenueImportSchema,
  recordSystemMetricSchema,
  recordWebVitalsSchema,
  trackAnalyticsEventSchema,
  trackAnalyticsEventsBatchSchema,
} from '@varnarc/validation';
import type { Request } from 'express';
import { z } from 'zod';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok, okCursor } from '../../common/utils/response';
import { AnalyticsService } from './analytics.service';

const dateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  period: z.enum(['day', 'week', 'month', 'quarter', 'year', 'custom']).optional(),
});

const savedReportCreateSchema = z.object({
  name: z.string().min(1).max(200),
  reportType: z.string().min(1).max(80),
  filters: z.record(z.unknown()).optional(),
});

const trackOrBatchSchema = z.union([
  trackAnalyticsEventsBatchSchema,
  trackAnalyticsEventSchema,
]);

function clientMeta(req: Request, user?: CurrentUser) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined) ||
    req.ip ||
    null;
  const userAgent =
    (typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null) || null;
  return {
    userId: user?.id ?? null,
    ipAddress: ip,
    userAgent,
  };
}

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Analytics module health' })
  status() {
    return ok(this.service.status());
  }

  @Public()
  @Post('events')
  @ApiOperation({ summary: 'Track a single analytics event or a batch ({ events: [] })' })
  async trackEvents(
    @Body(new ZodValidationPipe(trackOrBatchSchema))
    body: z.infer<typeof trackOrBatchSchema>,
    @Req() req: Request,
    @CurrentUserDecorator() user?: CurrentUser,
  ) {
    const meta = clientMeta(req, user);
    if ('events' in body && Array.isArray(body.events)) {
      return ok(this.service.trackBatch(body.events, meta));
    }
    return ok(this.service.trackEvent(body as z.infer<typeof trackAnalyticsEventSchema>, meta));
  }

  @Public()
  @Post('vitals')
  @ApiOperation({ summary: 'Record Core Web Vitals (RUM)' })
  async recordWebVitals(
    @Body(new ZodValidationPipe(recordWebVitalsSchema))
    body: z.infer<typeof recordWebVitalsSchema>,
    @Req() req: Request,
    @CurrentUserDecorator() user?: CurrentUser,
  ) {
    return ok(await this.service.recordWebVitals(body, clientMeta(req, user)));
  }

  @Public()
  @Post('events/batch')
  @ApiOperation({ summary: 'Track a batch of analytics events' })
  async trackBatch(
    @Body(new ZodValidationPipe(trackAnalyticsEventsBatchSchema))
    body: z.infer<typeof trackAnalyticsEventsBatchSchema>,
    @Req() req: Request,
    @CurrentUserDecorator() user?: CurrentUser,
  ) {
    return ok(this.service.trackBatch(body.events, clientMeta(req, user)));
  }

  @Get('dashboard')
  @RequirePermissions(PERMISSIONS.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'Global analytics dashboard' })
  async dashboard(
    @Query(new ZodValidationPipe(analyticsDashboardQuerySchema))
    query: z.infer<typeof analyticsDashboardQuerySchema>,
  ) {
    return ok(await this.service.dashboard(query));
  }

  @Get('reports')
  @RequirePermissions(PERMISSIONS.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'Structured analytics reports by type' })
  async reports(
    @Query(new ZodValidationPipe(analyticsReportsQuerySchema))
    query: z.infer<typeof analyticsReportsQuerySchema>,
  ) {
    return ok(await this.service.reports(query));
  }

  @Get('traffic')
  @RequirePermissions(PERMISSIONS.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'Traffic sources analytics' })
  async traffic(
    @Query(new ZodValidationPipe(dateRangeSchema)) query: z.infer<typeof dateRangeSchema>,
  ) {
    return ok(await this.service.traffic(query));
  }

  @Get('search')
  @RequirePermissions(PERMISSIONS.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'Search analytics' })
  async search(
    @Query(new ZodValidationPipe(dateRangeSchema)) query: z.infer<typeof dateRangeSchema>,
  ) {
    return ok(await this.service.searchAnalytics(query));
  }

  @Get('ads')
  @RequirePermissions(PERMISSIONS.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'Advertisement analytics' })
  async ads() {
    return ok(await this.service.adsAnalytics());
  }

  @Get('affiliates')
  @RequirePermissions(PERMISSIONS.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'Affiliate conversion analytics' })
  async affiliates() {
    return ok(await this.service.affiliatesAnalytics());
  }

  @Get('system')
  @RequirePermissions(PERMISSIONS.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'System health metrics' })
  async system(
    @Query(new ZodValidationPipe(dateRangeSchema)) query: z.infer<typeof dateRangeSchema>,
  ) {
    return ok(await this.service.systemAnalytics(query));
  }

  @Get('events')
  @RequirePermissions(PERMISSIONS.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'List raw analytics events (cursor pagination)' })
  async events(
    @Query(new ZodValidationPipe(analyticsEventsQuerySchema))
    query: z.infer<typeof analyticsEventsQuerySchema>,
  ) {
    const page = await this.service.listEvents(query);
    return okCursor({
      items: page.items,
      nextCursor: page.nextCursor,
      prevCursor: null,
      hasMore: page.hasMore,
      limit: query.limit,
    });
  }

  @Get('export')
  @RequirePermissions(PERMISSIONS.ANALYTICS_EXPORT)
  @ApiOperation({
    summary: 'Export report as CSV/Excel/PDF payload (BFF converts to download)',
  })
  async export(
    @Query(new ZodValidationPipe(analyticsExportQuerySchema))
    query: z.infer<typeof analyticsExportQuerySchema>,
  ) {
    return ok(await this.service.export(query));
  }

  @Post('system/metrics')
  @RequirePermissions(PERMISSIONS.ANALYTICS_ADMIN)
  @ApiOperation({ summary: 'Record a system metric' })
  async recordMetric(
    @Body(new ZodValidationPipe(recordSystemMetricSchema))
    body: z.infer<typeof recordSystemMetricSchema>,
  ) {
    return ok(await this.service.recordSystemMetric(body));
  }

  @Post('aggregate')
  @RequirePermissions(PERMISSIONS.ANALYTICS_ADMIN)
  @ApiOperation({ summary: 'Run aggregation for the given period now' })
  async aggregate(
    @Query(new ZodValidationPipe(dateRangeSchema)) query: z.infer<typeof dateRangeSchema>,
  ) {
    return ok(await this.service.aggregateNow(query));
  }

  @Get('saved-reports')
  @RequirePermissions(PERMISSIONS.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'List saved analytics reports' })
  async listSavedReports(@CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.listSavedReports(user.id));
  }

  @Post('saved-reports')
  @RequirePermissions(PERMISSIONS.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'Create a saved analytics report' })
  async createSavedReport(
    @Body(new ZodValidationPipe(savedReportCreateSchema))
    body: z.infer<typeof savedReportCreateSchema>,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(
      await this.service.createSavedReport({
        ...body,
        createdBy: user.id,
      }),
    );
  }

  @Delete('saved-reports/:id')
  @RequirePermissions(PERMISSIONS.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'Delete a saved analytics report' })
  async deleteSavedReport(@Param('id') id: string) {
    return ok(await this.service.deleteSavedReport(id));
  }

  @Public()
  @Get('integrations/public')
  @ApiOperation({ summary: 'Public-safe third-party analytics script config' })
  async publicIntegrations() {
    return ok(await this.service.getPublicIntegrations());
  }

  @Get('integrations')
  @RequirePermissions(PERMISSIONS.ANALYTICS_ADMIN)
  @ApiOperation({ summary: 'Get optional analytics integrations config' })
  async getIntegrations() {
    return ok(await this.service.getIntegrations());
  }

  @Put('integrations')
  @RequirePermissions(PERMISSIONS.ANALYTICS_ADMIN)
  @ApiOperation({ summary: 'Update optional analytics integrations config' })
  async setIntegrations(
    @Body(new ZodValidationPipe(analyticsIntegrationsSchema))
    body: z.infer<typeof analyticsIntegrationsSchema>,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.setIntegrations(body, user.id));
  }

  @Get('revenue')
  @RequirePermissions(PERMISSIONS.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'Unified revenue dashboard data' })
  async revenue(@Query(new ZodValidationPipe(dateRangeSchema)) query: z.infer<typeof dateRangeSchema>) {
    return ok(await this.service.revenueReport(query));
  }

  @Post('adsense/import')
  @RequirePermissions(PERMISSIONS.ANALYTICS_ADMIN)
  @ApiOperation({ summary: 'Import AdSense revenue snapshot (manual/CSV)' })
  async importAdsense(
    @Body(new ZodValidationPipe(adsenseRevenueImportSchema))
    body: z.infer<typeof adsenseRevenueImportSchema>,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.importAdsenseRevenue(body, user.id));
  }

  @Get('adsense/status')
  @RequirePermissions(PERMISSIONS.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'AdSense API sync configuration status' })
  async adsenseStatus() {
    return ok(await this.service.getAdsenseSyncStatus());
  }

  @Post('adsense/sync')
  @RequirePermissions(PERMISSIONS.ANALYTICS_ADMIN)
  @ApiOperation({ summary: 'Sync AdSense revenue from Google API (last 30 days)' })
  async syncAdsense(@CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.syncAdsenseFromApi(user.id));
  }
}
