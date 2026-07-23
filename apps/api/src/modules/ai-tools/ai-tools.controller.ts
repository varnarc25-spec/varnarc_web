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
  aiToolsBulkActionSchema,
  aiToolsCompareQuerySchema,
  aiToolsQuerySchema,
  aiToolTrackEventSchema,
  aiUtilityRunSchema,
  createAiCategorySchema,
  createAiToolBookmarkSchema,
  createAiToolSchema,
  cursorPaginationQuerySchema,
  followAiCategorySchema,
  renameAiFeatureSchema,
  aiToolBookmarksQuerySchema,
  updateAiCategorySchema,
  updateAiToolSchema,
  type AiToolsBulkActionInput,
  type AiToolsCompareQuery,
  type AiToolsQuery,
  type AiToolTrackEventInput,
  type AiUtilityRunInput,
  type CreateAiCategoryInput,
  type CreateAiToolBookmarkInput,
  type CreateAiToolInput,
  type CursorPaginationQuery,
  type FollowAiCategoryInput,
  type RenameAiFeatureInput,
  type UpdateAiCategoryInput,
  type UpdateAiToolInput,
} from '@varnarc/validation';
import type { CurrentUser } from '@varnarc/types';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok, okCursor } from '../../common/utils/response';
import { AiToolsService } from './ai-tools.service';

@ApiTags('ai-tools')
@ApiBearerAuth()
@Controller('ai-tools')
export class AiToolsController {
  constructor(private readonly service: AiToolsService) {}

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'AI Tools module health status' })
  status() {
    return ok({ module: 'ai-tools', status: 'ready' });
  }

  // ── Categories ──────────────────────────────────────────────

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'List AI tool categories' })
  async categories(@Query(new ZodValidationPipe(cursorPaginationQuerySchema)) query: CursorPaginationQuery) {
    return okCursor(await this.service.listCategories(query));
  }

  @Public()
  @Get('categories/slug/:slug')
  @ApiOperation({ summary: 'Get AI category by slug' })
  async categoryBySlug(@Param('slug') slug: string) {
    return ok(await this.service.getCategoryBySlug(slug));
  }

  @Post('categories')
  @RequirePermissions(PERMISSIONS.AI_TOOLS_CREATE)
  @ApiOperation({ summary: 'Create AI tool category' })
  async createCategory(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createAiCategorySchema)) body: CreateAiCategoryInput,
  ) {
    return ok(await this.service.createCategory(body, user.id));
  }

  @Put('categories/:id')
  @RequirePermissions(PERMISSIONS.AI_TOOLS_EDIT)
  @ApiOperation({ summary: 'Update AI tool category' })
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateAiCategorySchema)) body: UpdateAiCategoryInput,
  ) {
    return ok(await this.service.updateCategory(id, body, user.id));
  }

  @Delete('categories/:id')
  @RequirePermissions(PERMISSIONS.AI_TOOLS_DELETE)
  @ApiOperation({ summary: 'Delete AI tool category' })
  async deleteCategory(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.deleteCategory(id, user.id));
  }

  // ── Compare / admin export / utilities (before :id) ─────────

  @Public()
  @Get('compare')
  @ApiOperation({ summary: 'Compare AI tools side by side' })
  async compare(@Query(new ZodValidationPipe(aiToolsCompareQuerySchema)) query: AiToolsCompareQuery) {
    return ok(await this.service.compare(query));
  }

  @Get('admin/export/tools')
  @RequirePermissions(PERMISSIONS.AI_TOOLS_VIEW)
  @ApiOperation({ summary: 'Export AI tools CSV' })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportTools() {
    const csv = await this.service.exportCsv();
    return new StreamableFile(Buffer.from(csv, 'utf8'));
  }

  @Post('admin/import/tools')
  @RequirePermissions(PERMISSIONS.AI_TOOLS_CREATE)
  @ApiOperation({ summary: 'Import AI tools CSV' })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
  async importTools(
    @CurrentUserDecorator() user: CurrentUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file?.buffer) return ok({ imported: 0, updated: 0 });
    return ok(await this.service.importCsv(file.buffer.toString('utf8'), user.id));
  }

  @Get('admin/:id/history')
  @RequirePermissions(PERMISSIONS.AI_TOOLS_VIEW)
  @ApiOperation({ summary: 'Audit history for an AI tool' })
  async history(@Param('id', ParseUUIDPipe) id: string) {
    return okCursor(await this.service.history(id));
  }

  @Get('admin')
  @RequirePermissions(PERMISSIONS.AI_TOOLS_VIEW)
  @ApiOperation({ summary: 'Admin list AI tools' })
  async adminList(@Query(new ZodValidationPipe(aiToolsQuerySchema)) query: AiToolsQuery) {
    return okCursor(await this.service.adminList(query));
  }

  @Public()
  @Get('slug/:slug/related')
  @ApiOperation({ summary: 'Related reviews, comparisons, and tools' })
  async related(@Param('slug') slug: string) {
    return ok(await this.service.getRelated(slug));
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get published AI tool by slug' })
  async bySlug(
    @Param('slug') slug: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
  ) {
    return ok(await this.service.getBySlug(slug, true, user?.id));
  }

  // ── Bookmarks & recently viewed ─────────────────────────────

  @Get('bookmarks/collections')
  @ApiOperation({ summary: 'List bookmark collection names for current user' })
  async bookmarkCollections(@CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.listCollections(user.id));
  }

  @Get('bookmarks')
  @ApiOperation({ summary: 'List bookmarks for current user' })
  async listBookmarks(
    @CurrentUserDecorator() user: CurrentUser,
    @Query(new ZodValidationPipe(aiToolBookmarksQuerySchema))
    query: CursorPaginationQuery & { collectionName?: string },
  ) {
    return okCursor(await this.service.listBookmarks(user.id, query));
  }

  @Post('bookmarks')
  @ApiOperation({ summary: 'Bookmark an AI tool' })
  async createBookmark(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createAiToolBookmarkSchema)) body: CreateAiToolBookmarkInput,
  ) {
    return ok(await this.service.createBookmark(user.id, body));
  }

  @Delete('bookmarks/:id')
  @ApiOperation({ summary: 'Remove a bookmark' })
  async deleteBookmark(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.deleteBookmark(id, user.id));
  }

  @Get('me/recently-viewed')
  @ApiOperation({ summary: 'Recently viewed AI tools for current user' })
  async recentlyViewed(@CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.recentlyViewed(user.id));
  }

  @Get('me/follows')
  @ApiOperation({ summary: 'Categories followed by current user' })
  async listFollows(@CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.listFollows(user.id));
  }

  @Post('me/follows')
  @ApiOperation({ summary: 'Follow an AI tool category' })
  async followCategory(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(followAiCategorySchema)) body: FollowAiCategoryInput,
  ) {
    return ok(await this.service.followCategory(user.id, body));
  }

  @Delete('me/follows/:categoryId')
  @ApiOperation({ summary: 'Unfollow an AI tool category' })
  async unfollowCategory(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.unfollowCategory(user.id, categoryId));
  }

  @Get('me/recommendations')
  @ApiOperation({ summary: 'Personalized AI tool recommendations' })
  async recommendations(@CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.recommendations(user.id));
  }

  @Get('admin/features')
  @RequirePermissions(PERMISSIONS.AI_TOOLS_VIEW)
  @ApiOperation({ summary: 'Feature catalog across tools' })
  async featureCatalog() {
    return ok(await this.service.featureCatalog());
  }

  @Post('admin/features/rename')
  @RequirePermissions(PERMISSIONS.AI_TOOLS_EDIT)
  @ApiOperation({ summary: 'Rename a feature across all tools' })
  async renameFeature(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(renameAiFeatureSchema)) body: RenameAiFeatureInput,
  ) {
    return ok(await this.service.renameFeature(body, user.id));
  }

  @Delete('admin/features')
  @RequirePermissions(PERMISSIONS.AI_TOOLS_EDIT)
  @ApiOperation({ summary: 'Soft-delete a feature name across tools' })
  async deleteFeature(
    @CurrentUserDecorator() user: CurrentUser,
    @Query('name') name: string,
  ) {
    return ok(await this.service.deleteFeature(name, user.id));
  }

  @Get('admin/bookmarks/stats')
  @RequirePermissions(PERMISSIONS.AI_TOOLS_VIEW)
  @ApiOperation({ summary: 'Bookmark engagement stats' })
  async bookmarkStats() {
    return ok(await this.service.bookmarkAdminStats());
  }

  @Get('analytics')
  @RequirePermissions(PERMISSIONS.AI_TOOLS_VIEW)
  @ApiOperation({ summary: 'AI Tools analytics dashboard' })
  async analytics() {
    return ok(await this.service.analytics());
  }

  @Public()
  @Post('utilities/run')
  @ApiOperation({ summary: 'Run a deterministic embedded AI utility' })
  async runUtility(@Body(new ZodValidationPipe(aiUtilityRunSchema)) body: AiUtilityRunInput) {
    return ok(this.service.runUtility(body));
  }

  @Post('bulk/publish')
  @RequirePermissions(PERMISSIONS.AI_TOOLS_PUBLISH)
  @ApiOperation({ summary: 'Bulk publish AI tools' })
  async bulkPublish(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(aiToolsBulkActionSchema)) body: AiToolsBulkActionInput,
  ) {
    return ok(await this.service.bulkPublish(body, user.id));
  }

  @Post('bulk/delete')
  @RequirePermissions(PERMISSIONS.AI_TOOLS_DELETE)
  @ApiOperation({ summary: 'Bulk delete AI tools' })
  async bulkDelete(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(aiToolsBulkActionSchema)) body: AiToolsBulkActionInput,
  ) {
    return ok(await this.service.bulkDelete(body, user.id));
  }

  // ── Tools CRUD ──────────────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published AI tools' })
  async list(@Query(new ZodValidationPipe(aiToolsQuerySchema)) query: AiToolsQuery) {
    return okCursor(await this.service.list(query, true));
  }

  @Post()
  @RequirePermissions(PERMISSIONS.AI_TOOLS_CREATE)
  @ApiOperation({ summary: 'Create AI tool' })
  async create(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createAiToolSchema)) body: CreateAiToolInput,
  ) {
    return ok(await this.service.create(body, user.id));
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.AI_TOOLS_VIEW)
  @ApiOperation({ summary: 'Get AI tool by id (admin)' })
  async byId(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getById(id, false));
  }

  @Put(':id')
  @RequirePermissions(PERMISSIONS.AI_TOOLS_EDIT)
  @ApiOperation({ summary: 'Update AI tool' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateAiToolSchema)) body: UpdateAiToolInput,
  ) {
    return ok(await this.service.update(id, body, user.id));
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.AI_TOOLS_DELETE)
  @ApiOperation({ summary: 'Delete AI tool' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.delete(id, user.id));
  }

  @Post(':id/publish')
  @RequirePermissions(PERMISSIONS.AI_TOOLS_PUBLISH)
  @ApiOperation({ summary: 'Publish AI tool' })
  async publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.publish(id, user.id));
  }

  @Post(':id/unpublish')
  @RequirePermissions(PERMISSIONS.AI_TOOLS_PUBLISH)
  @ApiOperation({ summary: 'Unpublish AI tool' })
  async unpublish(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.unpublish(id, user.id));
  }

  @Post(':id/feature')
  @RequirePermissions(PERMISSIONS.AI_TOOLS_PUBLISH)
  @ApiOperation({ summary: 'Mark AI tool featured' })
  async feature(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.feature(id, user.id, true));
  }

  @Post(':id/sponsor')
  @RequirePermissions(PERMISSIONS.AI_TOOLS_PUBLISH)
  @ApiOperation({ summary: 'Mark AI tool sponsored' })
  async sponsor(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.sponsor(id, user.id, true));
  }

  @Public()
  @Post(':id/events')
  @ApiOperation({ summary: 'Track AI tool engagement event' })
  async trackEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(aiToolTrackEventSchema)) body: AiToolTrackEventInput,
  ) {
    return ok(await this.service.trackEvent(id, body));
  }
}
