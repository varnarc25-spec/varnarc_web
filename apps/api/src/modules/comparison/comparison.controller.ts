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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import {
  comparisonAffiliateClickSchema,
  comparisonBulkActionSchema,
  comparisonsListQuerySchema,
  createComparisonSchema,
  createComparisonTemplateSchema,
  cursorPaginationQuerySchema,
  updateComparisonSchema,
  updateComparisonTemplateSchema,
  type ComparisonAffiliateClickInput,
  type ComparisonBulkActionInput,
  type ComparisonsListQuery,
  type CreateComparisonInput,
  type CreateComparisonTemplateInput,
  type CursorPaginationQuery,
  type UpdateComparisonInput,
  type UpdateComparisonTemplateInput,
} from '@varnarc/validation';
import type { CurrentUser } from '@varnarc/types';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok, okCursor } from '../../common/utils/response';
import { ComparisonService } from './comparison.service';

@ApiTags('comparisons')
@ApiBearerAuth()
@Controller(['comparison', 'comparisons'])
export class ComparisonController {
  constructor(private readonly service: ComparisonService) {}

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Comparison module health status' })
  status() {
    return ok({ module: 'comparisons', status: 'ready' });
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published comparisons' })
  async list(@Query(new ZodValidationPipe(comparisonsListQuerySchema)) query: ComparisonsListQuery) {
    return okCursor(await this.service.list(query, true));
  }

  @Get('admin')
  @RequirePermissions(PERMISSIONS.COMPARISON_VIEW)
  @ApiOperation({ summary: 'Admin list comparisons' })
  async adminList(@Query(new ZodValidationPipe(comparisonsListQuerySchema)) query: ComparisonsListQuery) {
    return okCursor(await this.service.list({ ...query, status: query.status }, false));
  }

  @Get('analytics')
  @RequirePermissions(PERMISSIONS.COMPARISON_VIEW)
  @ApiOperation({ summary: 'Comparison analytics dashboard with affiliate CTR' })
  async analytics() {
    return ok(await this.service.analytics());
  }

  @Post('bulk/publish')
  @RequirePermissions(PERMISSIONS.COMPARISON_PUBLISH)
  @ApiOperation({ summary: 'Bulk publish comparisons' })
  async bulkPublish(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(comparisonBulkActionSchema)) body: ComparisonBulkActionInput,
  ) {
    return ok(await this.service.bulkPublish(body, user.id));
  }

  @Post('bulk/delete')
  @RequirePermissions(PERMISSIONS.COMPARISON_DELETE)
  @ApiOperation({ summary: 'Bulk delete comparisons' })
  async bulkDelete(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(comparisonBulkActionSchema)) body: ComparisonBulkActionInput,
  ) {
    return ok(await this.service.bulkDelete(body, user.id));
  }

  @Get('templates')
  @RequirePermissions(PERMISSIONS.COMPARISON_VIEW)
  @ApiOperation({ summary: 'List comparison templates' })
  async templates(@Query(new ZodValidationPipe(cursorPaginationQuerySchema)) query: CursorPaginationQuery) {
    return okCursor(await this.service.listTemplates(query));
  }

  @Post('templates')
  @RequirePermissions(PERMISSIONS.COMPARISON_CREATE)
  @ApiOperation({ summary: 'Create comparison template' })
  async createTemplate(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createComparisonTemplateSchema)) body: CreateComparisonTemplateInput,
  ) {
    return ok(await this.service.createTemplate(body, user.id));
  }

  @Put('templates/:id')
  @RequirePermissions(PERMISSIONS.COMPARISON_EDIT)
  @ApiOperation({ summary: 'Update comparison template' })
  async updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateComparisonTemplateSchema)) body: UpdateComparisonTemplateInput,
  ) {
    return ok(await this.service.updateTemplate(id, body, user.id));
  }

  @Delete('templates/:id')
  @RequirePermissions(PERMISSIONS.COMPARISON_DELETE)
  @ApiOperation({ summary: 'Delete comparison template' })
  async deleteTemplate(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.deleteTemplate(id, user.id));
  }

  @Public()
  @Get('slug/:slug/related')
  @ApiOperation({ summary: 'Related reviews, articles, calculators, and affiliate offers' })
  async related(@Param('slug') slug: string) {
    return ok(await this.service.getRelated(slug));
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get published comparison by slug' })
  async bySlug(@Param('slug') slug: string) {
    return ok(await this.service.getBySlug(slug, true));
  }

  @Get('admin/:id/history')
  @RequirePermissions(PERMISSIONS.COMPARISON_VIEW)
  @ApiOperation({ summary: 'Audit/version history for a comparison' })
  async history(@Param('id', ParseUUIDPipe) id: string) {
    return okCursor(await this.service.history(id));
  }

  @Get('admin/:id')
  @RequirePermissions(PERMISSIONS.COMPARISON_VIEW)
  @ApiOperation({ summary: 'Get comparison by id (admin)' })
  async adminById(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getById(id, false));
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get published comparison by id' })
  async byId(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getById(id, true));
  }

  @Post()
  @RequirePermissions(PERMISSIONS.COMPARISON_CREATE)
  @ApiOperation({ summary: 'Create comparison' })
  async create(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createComparisonSchema)) body: CreateComparisonInput,
  ) {
    return ok(await this.service.create(body, user.id));
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.COMPARISON_EDIT)
  @ApiOperation({ summary: 'Update comparison' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateComparisonSchema)) body: UpdateComparisonInput,
  ) {
    return ok(await this.service.update(id, body, user.id));
  }

  @Post(':id/clone')
  @RequirePermissions(PERMISSIONS.COMPARISON_CREATE)
  @ApiOperation({ summary: 'Clone a comparison as draft' })
  async clone(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.clone(id, user.id));
  }

  @Post(':id/publish')
  @RequirePermissions(PERMISSIONS.COMPARISON_PUBLISH)
  @ApiOperation({ summary: 'Publish comparison' })
  async publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.publish(id, user.id));
  }

  @Public()
  @Post(':id/view')
  @ApiOperation({ summary: 'Track comparison page view' })
  async trackView(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.trackView(id));
  }

  @Public()
  @Post(':id/affiliate/click')
  @ApiOperation({ summary: 'Track affiliate click from comparison page' })
  async affiliateClick(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Body(new ZodValidationPipe(comparisonAffiliateClickSchema)) body: ComparisonAffiliateClickInput,
  ) {
    return ok(await this.service.trackAffiliateClick(id, body, user?.id));
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.COMPARISON_DELETE)
  @ApiOperation({ summary: 'Delete comparison' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.remove(id, user.id));
  }
}
