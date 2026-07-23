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
  constructionCompareQuerySchema,
  constructionEstimateSchema,
  constructionEstimateQuerySchema,
  constructionEstimateSaveSchema,
  constructionListQuerySchema,
  createConstructionBrandSchema,
  createConstructionCategorySchema,
  createConstructionChecklistSchema,
  createConstructionComparisonSchema,
  createConstructionMaterialSchema,
  createConstructionProjectSchema,
  createCostTemplateSchema,
  updateConstructionBrandSchema,
  updateConstructionCategorySchema,
  updateConstructionChecklistSchema,
  updateConstructionMaterialSchema,
  updateConstructionProjectSchema,
  updateCostTemplateSchema,
  type ConstructionCompareQuery,
  type ConstructionEstimateInput,
  type ConstructionEstimateQuery,
  type ConstructionEstimateSaveInput,
  type ConstructionListQuery,
  type CreateConstructionBrandInput,
  type CreateConstructionCategoryInput,
  type CreateConstructionChecklistInput,
  type CreateConstructionComparisonInput,
  type CreateConstructionMaterialInput,
  type CreateConstructionProjectInput,
  type CreateCostTemplateInput,
  type UpdateConstructionBrandInput,
  type UpdateConstructionCategoryInput,
  type UpdateConstructionChecklistInput,
  type UpdateConstructionMaterialInput,
  type UpdateConstructionProjectInput,
  type UpdateCostTemplateInput,
} from '@varnarc/validation';
import type { CurrentUser } from '@varnarc/types';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok, okCursor } from '../../common/utils/response';
import { ConstructionService } from './construction.service';

@ApiTags('construction')
@ApiBearerAuth()
@Controller('construction')
export class ConstructionController {
  constructor(private readonly service: ConstructionService) {}

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Construction module health status' })
  status() {
    return ok({ module: 'construction', status: 'ready' });
  }

  @Public()
  @Get('dashboard')
  @ApiOperation({ summary: 'Public construction dashboard stats' })
  async dashboard() {
    return ok(await this.service.dashboard());
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'List construction categories' })
  async categories() {
    return ok(await this.service.listCategories());
  }

  @Post('categories')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_CREATE)
  @ApiOperation({ summary: 'Create a construction category' })
  async createCategory(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createConstructionCategorySchema)) body: CreateConstructionCategoryInput,
  ) {
    return ok(await this.service.createCategory(body, user.id));
  }

  @Put('categories/:id')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_EDIT)
  @ApiOperation({ summary: 'Update a construction category' })
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateConstructionCategorySchema)) body: UpdateConstructionCategoryInput,
  ) {
    return ok(await this.service.updateCategory(id, body, user.id));
  }

  @Delete('categories/:id')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_DELETE)
  @ApiOperation({ summary: 'Soft-delete a construction category' })
  async deleteCategory(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.deleteCategory(id, user.id));
  }

  @Public()
  @Get('materials')
  @ApiOperation({ summary: 'List published construction materials' })
  async materials(@Query(new ZodValidationPipe(constructionListQuerySchema)) query: ConstructionListQuery) {
    return okCursor(await this.service.listMaterials({ ...query, status: query.status ?? 'PUBLISHED' }));
  }

  @Get('admin/materials')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_VIEW)
  async adminMaterials(@Query(new ZodValidationPipe(constructionListQuerySchema)) query: ConstructionListQuery) {
    return okCursor(await this.service.listMaterials(query));
  }

  @Public()
  @Get('materials/:id')
  async material(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getMaterial(id));
  }

  @Post('materials')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_CREATE)
  async createMaterial(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createConstructionMaterialSchema)) body: CreateConstructionMaterialInput,
  ) {
    return ok(await this.service.createMaterial(body, user.id));
  }

  @Put('materials/:id')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_EDIT)
  async updateMaterial(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateConstructionMaterialSchema)) body: UpdateConstructionMaterialInput,
  ) {
    return ok(await this.service.updateMaterial(id, body, user.id));
  }

  @Post('materials/:id/publish')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_PUBLISH)
  async publishMaterial(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.publishMaterial(id, user.id));
  }

  @Delete('materials/:id')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_DELETE)
  async deleteMaterial(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.deleteMaterial(id, user.id));
  }

  @Post('materials/:id/duplicate')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_CREATE)
  async duplicateMaterial(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.duplicateMaterial(id, user.id));
  }

  @Public()
  @Get('brands')
  async brands(@Query(new ZodValidationPipe(constructionListQuerySchema)) query: ConstructionListQuery) {
    return okCursor(await this.service.listBrands({ ...query, status: query.status ?? 'PUBLISHED' }));
  }

  @Get('admin/brands')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_VIEW)
  async adminBrands(@Query(new ZodValidationPipe(constructionListQuerySchema)) query: ConstructionListQuery) {
    return okCursor(await this.service.listBrands(query));
  }

  @Public()
  @Get('brands/slug/:slug')
  async brandBySlug(@Param('slug') slug: string) {
    return ok(await this.service.getBrandBySlug(slug));
  }

  @Get('brands/:id')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_VIEW)
  async brand(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getBrand(id));
  }

  @Post('brands')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_CREATE)
  async createBrand(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createConstructionBrandSchema)) body: CreateConstructionBrandInput,
  ) {
    return ok(await this.service.createBrand(body, user.id));
  }

  @Put('brands/:id')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_EDIT)
  async updateBrand(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateConstructionBrandSchema)) body: UpdateConstructionBrandInput,
  ) {
    return ok(await this.service.updateBrand(id, body, user.id));
  }

  @Post('brands/:id/publish')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_PUBLISH)
  async publishBrand(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.publishBrand(id, user.id));
  }

  @Get('admin/cost-templates')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_VIEW)
  async adminTemplates(@Query(new ZodValidationPipe(constructionListQuerySchema)) query: ConstructionListQuery) {
    return okCursor(await this.service.listTemplates(query));
  }

  @Public()
  @Get('cost-templates')
  async costTemplates(@Query(new ZodValidationPipe(constructionListQuerySchema)) query: ConstructionListQuery) {
    return okCursor(await this.service.listTemplates({ ...query, status: query.status ?? 'PUBLISHED' }));
  }

  @Post('cost-templates')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_CREATE)
  async createTemplate(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createCostTemplateSchema)) body: CreateCostTemplateInput,
  ) {
    return ok(await this.service.createTemplate(body, user.id));
  }

  @Put('cost-templates/:id')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_EDIT)
  async updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateCostTemplateSchema)) body: UpdateCostTemplateInput,
  ) {
    return ok(await this.service.updateTemplate(id, body, user.id));
  }

  @Post('cost-templates/:id/publish')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_PUBLISH)
  async publishTemplate(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.publishTemplate(id, user.id));
  }

  @Public()
  @Post('estimate')
  async estimate(@Body(new ZodValidationPipe(constructionEstimateSchema)) body: ConstructionEstimateInput) {
    return ok(await this.service.estimate(body));
  }

  @Post('estimate/save')
  async saveEstimate(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Body(new ZodValidationPipe(constructionEstimateSaveSchema)) body: ConstructionEstimateSaveInput,
  ) {
    return ok(await this.service.saveEstimateAsProject(body, user?.id));
  }

  @Public()
  @Get('reports/estimate')
  async estimateReport(@Query(new ZodValidationPipe(constructionEstimateQuerySchema)) query: ConstructionEstimateQuery) {
    return ok(await this.service.estimateReport(query));
  }

  @Public()
  @Get('reports/estimate.pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="construction-estimate.pdf"')
  async estimateReportPdf(@Query(new ZodValidationPipe(constructionEstimateQuerySchema)) query: ConstructionEstimateQuery) {
    const pdf = await this.service.estimateReportPdf(query);
    return new StreamableFile(pdf);
  }

  @Public()
  @Get('compare')
  async compare(@Query(new ZodValidationPipe(constructionCompareQuerySchema)) query: ConstructionCompareQuery) {
    return ok(await this.service.compare(query));
  }

  @Public()
  @Get('projects')
  async projects(@CurrentUserDecorator() user: CurrentUser | undefined) {
    return ok(await this.service.listProjects(user?.id));
  }

  @Get('admin/projects')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_VIEW)
  async adminProjects() {
    return ok(await this.service.listProjects(null, true));
  }

  @Public()
  @Post('projects')
  async createProject(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Body(new ZodValidationPipe(createConstructionProjectSchema)) body: CreateConstructionProjectInput,
  ) {
    return ok(await this.service.createProject(body, user?.id));
  }

  @Put('projects/:id')
  async updateProject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Body(new ZodValidationPipe(updateConstructionProjectSchema)) body: UpdateConstructionProjectInput,
  ) {
    return ok(await this.service.updateProject(id, body, user?.id));
  }

  @Public()
  @Delete('projects/:id')
  async deleteProject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
  ) {
    return ok(await this.service.deleteProject(id, user?.id));
  }

  @Public()
  @Get('faqs')
  async faqs() {
    return ok(await this.service.listFaqs());
  }

  @Get('admin/faqs')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_VIEW)
  async adminFaqs() {
    return ok(await this.service.listFaqs(true));
  }

  @Post('admin/faqs')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_CREATE)
  async createFaq(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() body: { question: string; answer: string; sortOrder?: number },
  ) {
    return ok(await this.service.createFaq(body, user.id));
  }

  @Public()
  @Get('guides')
  async guides() {
    return ok(await this.service.listGuides());
  }

  @Public()
  @Get('guides/:slug')
  async guide(@Param('slug') slug: string) {
    return ok(await this.service.getGuide(slug));
  }

  @Get('admin/guides')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_VIEW)
  async adminGuides() {
    return ok(await this.service.listGuides(true));
  }

  @Post('admin/guides')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_CREATE)
  async createGuide(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() body: { title: string; slug: string; summary?: string | null; body?: string | null },
  ) {
    return ok(await this.service.createGuide(body, user.id));
  }

  @Public()
  @Get('suppliers')
  @ApiOperation({ summary: 'List construction suppliers from the directory' })
  async suppliers(
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return ok(
      await this.service.suppliers({
        limit: limit ? Number(limit) : undefined,
        cursor: cursor || undefined,
      }),
    );
  }

  @Get('admin/suppliers')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_VIEW)
  @ApiOperation({ summary: 'Admin view of linked construction suppliers' })
  async adminSuppliers(
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return ok(
      await this.service.suppliers({
        limit: limit ? Number(limit) : undefined,
        cursor: cursor || undefined,
      }),
    );
  }

  @Public()
  @Get('checklists')
  @ApiOperation({ summary: 'List published construction checklists' })
  async checklists() {
    return ok(await this.service.listChecklists());
  }

  @Public()
  @Get('checklists/:slug')
  @ApiOperation({ summary: 'Get a published checklist by slug' })
  async checklist(@Param('slug') slug: string) {
    return ok(await this.service.getChecklist(slug));
  }

  @Get('admin/checklists')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_VIEW)
  @ApiOperation({ summary: 'Admin list of construction checklists' })
  async adminChecklists() {
    return ok(await this.service.listChecklists(true));
  }

  @Post('admin/checklists')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_CREATE)
  @ApiOperation({ summary: 'Create a construction checklist' })
  async createChecklist(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createConstructionChecklistSchema)) body: CreateConstructionChecklistInput,
  ) {
    return ok(await this.service.createChecklist(body, user.id));
  }

  @Put('admin/checklists/:id')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_EDIT)
  @ApiOperation({ summary: 'Update a construction checklist' })
  async updateChecklist(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateConstructionChecklistSchema)) body: UpdateConstructionChecklistInput,
  ) {
    return ok(await this.service.updateChecklist(id, body, user.id));
  }

  @Delete('admin/checklists/:id')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_DELETE)
  @ApiOperation({ summary: 'Soft-delete a construction checklist' })
  async deleteChecklist(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.deleteChecklist(id, user.id));
  }

  @Get('admin/comparisons')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_VIEW)
  @ApiOperation({ summary: 'List saved construction comparisons' })
  async adminComparisons() {
    return ok(await this.service.listComparisons());
  }

  @Post('admin/comparisons')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_CREATE)
  @ApiOperation({ summary: 'Save a construction material comparison' })
  async createComparison(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createConstructionComparisonSchema)) body: CreateConstructionComparisonInput,
  ) {
    return ok(await this.service.createComparison(body, user.id));
  }

  @Get('admin/reports/summary')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_VIEW)
  @ApiOperation({ summary: 'Construction module report summary' })
  async adminReportsSummary() {
    return ok(await this.service.adminReportsSummary());
  }

  @Get('admin/history/:entity/:id')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_VIEW)
  @ApiOperation({ summary: 'Version/audit history for a construction entity' })
  async entityHistory(@Param('entity') entity: string, @Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.entityHistory(entity, id));
  }

  @Get('admin/export/:entity')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_VIEW)
  @ApiOperation({ summary: 'Export construction entity CSV' })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportCsv(@Param('entity') entity: string) {
    const csv = await this.service.exportCsv(entity);
    return new StreamableFile(Buffer.from(csv, 'utf8'));
  }

  @Post('admin/import/:entity')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_CREATE)
  @ApiOperation({ summary: 'Import construction entity CSV' })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
  async importCsv(
    @Param('entity') entity: string,
    @CurrentUserDecorator() user: CurrentUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file?.buffer) return ok({ imported: 0 });
    return ok(await this.service.importCsv(entity, file.buffer.toString('utf8'), user.id));
  }
}
