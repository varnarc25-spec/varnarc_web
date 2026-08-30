import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import type { CurrentUser } from '@varnarc/types';
import {
  constructionSearchOpportunityListQuerySchema,
  logConstructionSearchEventSchema,
  markConstructionSearchClickSchema,
  updateConstructionSearchOpportunitySchema,
} from '@varnarc/validation';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ConstructionSearchOpportunityService } from './construction-search-opportunity.service';

@ApiTags('construction-search-opportunities')
@Controller('construction/search-opportunities')
export class ConstructionSearchOpportunityController {
  constructor(private readonly service: ConstructionSearchOpportunityService) {}

  @Public()
  @Post('events')
  @ApiOperation({
    summary: 'Log a privacy-safe construction search event (no PII / userId)',
  })
  logEvent(@Body(new ZodValidationPipe(logConstructionSearchEventSchema)) body: unknown) {
    const input = body as {
      query: string;
      surface: string;
      resultCount: number;
      clicked?: boolean;
      path?: string;
    };
    return this.service.logSearch(input);
  }

  @Public()
  @Post('events/click')
  @ApiOperation({ summary: 'Mark a recent privacy-safe search event as clicked' })
  markClick(@Body(new ZodValidationPipe(markConstructionSearchClickSchema)) body: unknown) {
    const input = body as { query: string; surface?: string };
    return this.service.markClick(input);
  }

  @Get('dashboard')
  @ApiBearerAuth()
  @RequirePermissions(PERMISSIONS.SEARCH_ANALYTICS)
  dashboard(@Query('windowDays') windowDaysRaw?: string) {
    const windowDays = ([7, 30, 90] as const).includes(Number(windowDaysRaw) as 7 | 30 | 90)
      ? (Number(windowDaysRaw) as 7 | 30 | 90)
      : 30;
    return this.service.dashboard(windowDays);
  }

  @Get()
  @ApiBearerAuth()
  @RequirePermissions(PERMISSIONS.SEARCH_ANALYTICS)
  list(
    @Query(new ZodValidationPipe(constructionSearchOpportunityListQuerySchema))
    query: unknown,
  ) {
    return this.service.listOpportunities(
      query as Parameters<ConstructionSearchOpportunityService['listOpportunities']>[0],
    );
  }

  @Put(':id')
  @ApiBearerAuth()
  @RequirePermissions(PERMISSIONS.SEARCH_ANALYTICS)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateConstructionSearchOpportunitySchema)) body: unknown,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    const input = body as {
      status: 'OPEN' | 'PLANNED' | 'IMPLEMENTED' | 'IGNORED';
      notes?: string | null;
    };
    return this.service.updateOpportunity(id, { ...input, actorId: user.id });
  }

  @Post('aggregate')
  @ApiBearerAuth()
  @RequirePermissions(PERMISSIONS.SEARCH_ANALYTICS)
  @ApiOperation({ summary: 'Re-aggregate construction search opportunities (7/30/90d)' })
  aggregate() {
    return this.service.aggregateAllWindows();
  }
}
