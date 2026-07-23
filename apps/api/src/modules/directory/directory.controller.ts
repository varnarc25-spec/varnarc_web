import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import {
  createBusinessCategorySchema,
  createBusinessSchema,
  createLeadRequestSchema,
  cursorPaginationQuerySchema,
  directoryBulkActionSchema,
  directoryListingsQuerySchema,
  directorySearchQuerySchema,
  directoryTrackEventSchema,
  updateBusinessCategorySchema,
  updateBusinessSchema,
  updateLeadStatusSchema,
  type CreateBusinessCategoryInput,
  type CreateBusinessInput,
  type CreateLeadRequestInput,
  type CursorPaginationQuery,
  type DirectoryBulkActionInput,
  type DirectoryListingsQuery,
  type DirectorySearchQuery,
  type DirectoryTrackEventInput,
  type UpdateBusinessCategoryInput,
  type UpdateBusinessInput,
  type UpdateLeadStatusInput,
} from '@varnarc/validation';
import type { CurrentUser } from '@varnarc/types';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok, okCursor } from '../../common/utils/response';
import { DirectoryService } from './directory.service';

@ApiTags('directory')
@ApiBearerAuth()
@Controller('directory')
export class DirectoryController {
  constructor(private readonly service: DirectoryService) {}

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Directory module health status' })
  status() {
    return ok({ module: 'directory', status: 'ready' });
  }

  // ── Categories ──────────────────────────────────────────────

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'List directory categories' })
  async categories(@Query(new ZodValidationPipe(cursorPaginationQuerySchema)) query: CursorPaginationQuery) {
    return okCursor(await this.service.listCategories(query));
  }

  @Public()
  @Get('categories/slug/:slug')
  @ApiOperation({ summary: 'Get category by slug' })
  async categoryBySlug(@Param('slug') slug: string) {
    return ok(await this.service.getCategoryBySlug(slug));
  }

  @Post('categories')
  @RequirePermissions(PERMISSIONS.DIRECTORY_CREATE)
  @ApiOperation({ summary: 'Create directory category' })
  async createCategory(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createBusinessCategorySchema)) body: CreateBusinessCategoryInput,
  ) {
    return ok(await this.service.createCategory(body, user.id));
  }

  @Put('categories/:id')
  @RequirePermissions(PERMISSIONS.DIRECTORY_EDIT)
  @ApiOperation({ summary: 'Update directory category' })
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateBusinessCategorySchema)) body: UpdateBusinessCategoryInput,
  ) {
    return ok(await this.service.updateCategory(id, body, user.id));
  }

  @Delete('categories/:id')
  @RequirePermissions(PERMISSIONS.DIRECTORY_DELETE)
  @ApiOperation({ summary: 'Delete directory category' })
  async deleteCategory(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.deleteCategory(id, user.id));
  }

  // ── Search ──────────────────────────────────────────────────

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search directory listings with filters and geo' })
  async search(@Query(new ZodValidationPipe(directorySearchQuerySchema)) query: DirectorySearchQuery) {
    return okCursor(await this.service.search(query));
  }

  @Public()
  @Get('map')
  @ApiOperation({ summary: 'Map markers for directory listings' })
  async map(@Query(new ZodValidationPipe(directorySearchQuerySchema)) query: DirectorySearchQuery) {
    return ok(
      await this.service.mapMarkers({
        city: query.city,
        category: query.category,
        limit: query.limit,
      }),
    );
  }

  @Public()
  @Get('listings/slug/:slug/related')
  @ApiOperation({ summary: 'Related reviews, comparisons, and businesses' })
  async related(@Param('slug') slug: string) {
    return ok(await this.service.getRelated(slug));
  }

  @Get('listings/admin/verification')
  @RequirePermissions(PERMISSIONS.DIRECTORY_VERIFY)
  @ApiOperation({ summary: 'Verification queue' })
  async verificationQueue(@Query(new ZodValidationPipe(cursorPaginationQuerySchema)) query: CursorPaginationQuery) {
    return okCursor(await this.service.listVerificationQueue(query));
  }

  @Get('admin/export/listings')
  @RequirePermissions(PERMISSIONS.DIRECTORY_VIEW)
  @ApiOperation({ summary: 'Export directory listings CSV' })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportListings() {
    const csv = await this.service.exportCsv();
    return new StreamableFile(Buffer.from(csv, 'utf8'));
  }

  @Post('admin/import/listings')
  @RequirePermissions(PERMISSIONS.DIRECTORY_CREATE)
  @ApiOperation({ summary: 'Import directory listings CSV' })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
  async importListings(
    @CurrentUserDecorator() user: CurrentUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file?.buffer) return ok({ imported: 0 });
    return ok(await this.service.importCsv(file.buffer.toString('utf8'), user.id));
  }

  // ── Listings (spec aliases + legacy businesses paths) ────────

  @Public()
  @Get(['listings', 'businesses'])
  @ApiOperation({ summary: 'List approved directory listings' })
  async list(@Query(new ZodValidationPipe(directoryListingsQuerySchema)) query: DirectoryListingsQuery) {
    return okCursor(await this.service.list(query, true));
  }

  @Get('listings/admin')
  @RequirePermissions(PERMISSIONS.DIRECTORY_VIEW)
  @ApiOperation({ summary: 'Admin list directory listings' })
  async adminList(@Query(new ZodValidationPipe(directoryListingsQuerySchema)) query: DirectoryListingsQuery) {
    return okCursor(await this.service.list({ ...query, status: query.status }, false));
  }

  @Public()
  @Get(['listings/slug/:slug', 'businesses/slug/:slug'])
  @ApiOperation({ summary: 'Get listing by slug' })
  async bySlug(@Param('slug') slug: string) {
    return ok(await this.service.getBySlug(slug, true));
  }

  @Public()
  @Get('listings/slug/:slug/nearby')
  @ApiOperation({ summary: 'Nearby listings for a listing slug' })
  async nearby(@Param('slug') slug: string) {
    return ok(await this.service.nearby(slug));
  }

  @Get('listings/admin/:id')
  @RequirePermissions(PERMISSIONS.DIRECTORY_VIEW)
  @ApiOperation({ summary: 'Get listing by id (admin)' })
  async adminById(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getById(id, false));
  }

  @Get('listings/admin/:id/history')
  @RequirePermissions(PERMISSIONS.DIRECTORY_VIEW)
  @ApiOperation({ summary: 'Audit history for a listing' })
  async history(@Param('id', ParseUUIDPipe) id: string) {
    return okCursor(await this.service.history(id));
  }

  @Public()
  @Get(['listings/:id', 'businesses/:id'])
  @ApiOperation({ summary: 'Get published listing by id' })
  async byId(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getById(id, true));
  }

  @Post(['listings', 'businesses'])
  @ApiOperation({ summary: 'Create directory listing (authenticated owners or editors)' })
  async create(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createBusinessSchema)) body: CreateBusinessInput,
  ) {
    return ok(await this.service.create(body, user.id));
  }

  @Put(['listings/:id', 'businesses/:id'])
  @ApiOperation({ summary: 'Update directory listing (owner or editor)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateBusinessSchema)) body: UpdateBusinessInput,
  ) {
    const elevated =
      (user.permissions?.includes(PERMISSIONS.DIRECTORY_EDIT) ||
        user.permissions?.includes(PERMISSIONS.DIRECTORY_PUBLISH)) ??
      false;
    return ok(await this.service.update(id, body, user.id, elevated));
  }

  @Post('listings/:id/publish')
  @RequirePermissions(PERMISSIONS.DIRECTORY_PUBLISH)
  @ApiOperation({ summary: 'Publish / approve listing' })
  async publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.publish(id, user.id));
  }

  @Post('listings/:id/unpublish')
  @RequirePermissions(PERMISSIONS.DIRECTORY_PUBLISH)
  @ApiOperation({ summary: 'Unpublish listing' })
  async unpublish(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.unpublish(id, user.id));
  }

  @Post('listings/:id/verify')
  @RequirePermissions(PERMISSIONS.DIRECTORY_VERIFY)
  @ApiOperation({ summary: 'Verify listing' })
  async verify(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.verify(id, user.id, 'VERIFIED'));
  }

  @Post('listings/:id/feature')
  @RequirePermissions(PERMISSIONS.DIRECTORY_PUBLISH)
  @ApiOperation({ summary: 'Mark listing featured' })
  async feature(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.feature(id, user.id, true));
  }

  @Post('listings/:id/sponsor')
  @RequirePermissions(PERMISSIONS.DIRECTORY_PUBLISH)
  @ApiOperation({ summary: 'Mark listing sponsored' })
  async sponsor(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.sponsor(id, user.id, true));
  }

  @Public()
  @Post('listings/:id/events')
  @ApiOperation({ summary: 'Track directory engagement event' })
  async trackEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(directoryTrackEventSchema)) body: DirectoryTrackEventInput,
  ) {
    return ok(await this.service.trackEvent(id, body));
  }

  @Delete(['listings/:id', 'businesses/:id'])
  @ApiOperation({ summary: 'Delete directory listing (owner or editor)' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    const elevated =
      (user.permissions?.includes(PERMISSIONS.DIRECTORY_DELETE) ||
        user.permissions?.includes(PERMISSIONS.DIRECTORY_PUBLISH)) ??
      false;
    return ok(await this.service.remove(id, user.id, elevated));
  }

  @Post('bulk/publish')
  @RequirePermissions(PERMISSIONS.DIRECTORY_PUBLISH)
  @ApiOperation({ summary: 'Bulk publish listings' })
  async bulkPublish(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(directoryBulkActionSchema)) body: DirectoryBulkActionInput,
  ) {
    return ok(await this.service.bulkPublish(body, user.id));
  }

  @Post('bulk/delete')
  @RequirePermissions(PERMISSIONS.DIRECTORY_DELETE)
  @ApiOperation({ summary: 'Bulk delete listings' })
  async bulkDelete(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(directoryBulkActionSchema)) body: DirectoryBulkActionInput,
  ) {
    return ok(await this.service.bulkDelete(body, user.id));
  }

  // ── Leads ───────────────────────────────────────────────────

  @Public()
  @Post('leads')
  @ApiOperation({ summary: 'Submit a lead / inquiry for a listing' })
  async createLead(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Body(new ZodValidationPipe(createLeadRequestSchema)) body: CreateLeadRequestInput,
  ) {
    return ok(await this.service.createLead(body, user?.id));
  }

  @Get('leads')
  @RequirePermissions(PERMISSIONS.DIRECTORY_VIEW)
  @ApiOperation({ summary: 'List lead requests' })
  async listLeads(@Query(new ZodValidationPipe(cursorPaginationQuerySchema)) query: CursorPaginationQuery) {
    return okCursor(await this.service.listLeads(query));
  }

  @Put('leads/:id')
  @RequirePermissions(PERMISSIONS.DIRECTORY_EDIT)
  @ApiOperation({ summary: 'Update lead status' })
  async updateLead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateLeadStatusSchema)) body: UpdateLeadStatusInput,
  ) {
    return ok(await this.service.updateLeadStatus(id, body, user.id));
  }

  // ── Analytics ───────────────────────────────────────────────

  @Get('analytics')
  @RequirePermissions(PERMISSIONS.DIRECTORY_VIEW)
  @ApiOperation({ summary: 'Directory analytics dashboard' })
  async analytics() {
    return ok(await this.service.analytics());
  }
}
