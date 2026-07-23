import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { Public } from '../../auth/decorators/public.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok } from '../../common/utils/response';
import {
  isPrometheusEnabled,
  prometheusContentType,
  renderPrometheusMetrics,
} from '../../observability/prometheus';
import { PerformanceService } from './performance.service';

const cacheClearSchema = z.object({
  scope: z.enum(['all', 'platform', 'search', 'cms', 'settings', 'seo', 'analytics']).optional(),
});

function authorizePrometheusScrape(req: Request) {
  if (!isPrometheusEnabled()) {
    throw new NotFoundException({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Prometheus metrics are disabled.' },
    });
  }

  const token = process.env.PROMETHEUS_SCRAPE_TOKEN?.trim();
  if (process.env.NODE_ENV !== 'production' && !token) {
    return;
  }

  if (!token) {
    throw new UnauthorizedException({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'PROMETHEUS_SCRAPE_TOKEN is not configured.' },
    });
  }

  if (req.headers.authorization !== `Bearer ${token}`) {
    throw new UnauthorizedException({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid Prometheus scrape token.' },
    });
  }
}

@ApiTags('performance')
@Controller()
export class PerformanceMetricsController {
  constructor(private readonly service: PerformanceService) {}

  @Get('metrics')
  @RequirePermissions(PERMISSIONS.API_VIEW)
  @ApiOperation({ summary: 'Operational metrics (RBAC protected)' })
  async metrics() {
    return ok(await this.service.metrics());
  }

  @Public()
  @Get('metrics/prometheus')
  @ApiOperation({ summary: 'Prometheus scrape endpoint (token in production)' })
  async prometheus(@Req() req: Request, @Res() res: Response) {
    authorizePrometheusScrape(req);
    res.setHeader('Content-Type', prometheusContentType());
    res.send(await renderPrometheusMetrics());
  }
}

@ApiTags('performance')
@Controller('performance')
export class PerformanceController {
  constructor(private readonly service: PerformanceService) {}

  @Get('overview')
  @RequirePermissions(PERMISSIONS.API_VIEW)
  async overview() {
    return ok(await this.service.overview());
  }

  @Get('cache')
  @RequirePermissions(PERMISSIONS.API_VIEW)
  cacheStatus() {
    return ok(this.service.cacheStatus());
  }

  @Post('cache/clear')
  @RequirePermissions(PERMISSIONS.API_MANAGE)
  async clearCache(
    @Query(new ZodValidationPipe(cacheClearSchema)) query: z.infer<typeof cacheClearSchema>,
    @Body(new ZodValidationPipe(cacheClearSchema)) body: z.infer<typeof cacheClearSchema>,
  ) {
    const scope = body.scope ?? query.scope;
    return ok(await this.service.clearCache(scope));
  }
}
