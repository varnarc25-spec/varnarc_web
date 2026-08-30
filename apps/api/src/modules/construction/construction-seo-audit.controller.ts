import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import type { CurrentUser } from '@varnarc/types';
import {
  constructionSeoAuditIssueListQuerySchema,
  constructionSeoAuditRunListQuerySchema,
  createConstructionSeoAuditRunSchema,
  resolveConstructionSeoAuditIssueSchema,
} from '@varnarc/validation';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ConstructionSeoAuditService } from './construction-seo-audit.service';

@ApiTags('construction-seo-audit')
@ApiBearerAuth()
@Controller('construction/seo-audit')
export class ConstructionSeoAuditController {
  constructor(private readonly service: ConstructionSeoAuditService) {}

  @Get('dashboard')
  @RequirePermissions(PERMISSIONS.SEO_AUDIT)
  @ApiOperation({ summary: 'Construction SEO audit dashboard summary' })
  dashboard() {
    return this.service.dashboardLatest();
  }

  @Get('runs')
  @RequirePermissions(PERMISSIONS.SEO_AUDIT)
  listRuns(
    @Query(new ZodValidationPipe(constructionSeoAuditRunListQuerySchema))
    query: unknown,
  ) {
    return this.service.listRuns(query as { limit?: number; cursor?: string; status?: string });
  }

  @Get('runs/:id')
  @RequirePermissions(PERMISSIONS.SEO_AUDIT)
  getRun(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getRun(id);
  }

  @Post('runs')
  @RequirePermissions(PERMISSIONS.SEO_AUDIT)
  @ApiOperation({
    summary: 'Enqueue a Construction SEO audit run (fast inventory + deferred crawl via queue)',
  })
  enqueue(
    @Body(new ZodValidationPipe(createConstructionSeoAuditRunSchema)) body: unknown,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    const input = body as { mode?: 'FAST' | 'FULL'; siteUrl?: string };
    return this.service.enqueueRun({
      mode: input.mode,
      siteUrl: input.siteUrl,
      triggeredBy: user.id,
    });
  }

  @Get('issues')
  @RequirePermissions(PERMISSIONS.SEO_AUDIT)
  listIssues(
    @Query(new ZodValidationPipe(constructionSeoAuditIssueListQuerySchema))
    query: unknown,
  ) {
    return this.service.listIssues(
      query as Parameters<ConstructionSeoAuditService['listIssues']>[0],
    );
  }

  @Put('issues/:id')
  @RequirePermissions(PERMISSIONS.SEO_AUDIT)
  resolveIssue(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(resolveConstructionSeoAuditIssueSchema)) body: unknown,
  ) {
    const input = body as { status: 'RESOLVED' | 'IGNORED' };
    return this.service.resolveIssue(id, input.status);
  }
}
