import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import {
  constructionCompareQuerySchema,
  constructionEstimateSchema,
  constructionEstimateQuerySchema,
  constructionEstimateSaveSchema,
  saveConstructionCalculationSchema,
  updateSavedConstructionCalculationSchema,
  constructionListQuerySchema,
  createConstructionBrandSchema,
  createConstructionCategorySchema,
  createConstructionChecklistSchema,
  createConstructionComparisonSchema,
  createConstructionMaterialSchema,
  createConstructionProjectSchema,
  createCostTemplateSchema,
  createConstructionPriceAlertSchema,
  createCommunityPriceReportSchema,
  fairPriceCheckInputSchema,
  projectReadinessInputSchema,
  saveConstructionChecklistProgressSchema,
  moderateCommunityPriceReportSchema,
  updateConstructionBrandSchema,
  updateConstructionCategorySchema,
  updateConstructionChecklistSchema,
  updateConstructionMaterialSchema,
  updateConstructionProjectSchema,
  updateConstructionPriceAlertSchema,
  updateCostTemplateSchema,
  saveConstructionProjectBoqSchema,
  replaceConstructionProjectPhasesSchema,
  saveConstructionBudgetItemSchema,
  saveConstructionExpenseSchema,
  saveConstructionDocumentMetaSchema,
  type ConstructionCompareQuery,
  type ConstructionEstimateInput,
  type ConstructionEstimateQuery,
  type ConstructionEstimateSaveInput,
  type SaveConstructionCalculationInput,
  type UpdateSavedConstructionCalculationInput,
  type ConstructionListQuery,
  type CreateConstructionBrandInput,
  type CreateConstructionCategoryInput,
  type CreateConstructionChecklistInput,
  type CreateConstructionComparisonInput,
  type CreateConstructionMaterialInput,
  type CreateConstructionProjectInput,
  type CreateCostTemplateInput,
  type CreateConstructionPriceAlertInput,
  type CreateCommunityPriceReportInput,
  type FairPriceCheckInput,
  type ProjectReadinessInput,
  type SaveConstructionChecklistProgressInput,
  type ModerateCommunityPriceReportInput,
  type SaveConstructionProjectBoqInput,
  type ReplaceConstructionProjectPhasesInput,
  type SaveConstructionBudgetItemInput,
  type SaveConstructionExpenseInput,
  type SaveConstructionDocumentMetaInput,
  type UpdateConstructionBrandInput,
  type UpdateConstructionCategoryInput,
  type UpdateConstructionChecklistInput,
  type UpdateConstructionMaterialInput,
  type UpdateConstructionProjectInput,
  type UpdateConstructionPriceAlertInput,
  type UpdateCostTemplateInput,
} from '@varnarc/validation';
import { SECURITY_RATE_LIMITS } from '@varnarc/config';
import { Throttle } from '@nestjs/throttler';
import type { CurrentUser } from '@varnarc/types';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok, okCursor } from '../../common/utils/response';
import { ConstructionService } from './construction.service';
import { CommunityPriceReportsService } from './community-price-reports.service';
import { PriceAlertsService } from './price-alerts.service';

@ApiTags('construction')
@ApiBearerAuth()
@Controller('construction')
export class ConstructionController {
  constructor(
    private readonly service: ConstructionService,
    private readonly priceAlerts: PriceAlertsService,
    private readonly communityPrices: CommunityPriceReportsService,
  ) {}

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
    @Body(new ZodValidationPipe(createConstructionCategorySchema))
    body: CreateConstructionCategoryInput,
  ) {
    return ok(await this.service.createCategory(body, user.id));
  }

  @Put('categories/:id')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_EDIT)
  @ApiOperation({ summary: 'Update a construction category' })
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateConstructionCategorySchema))
    body: UpdateConstructionCategoryInput,
  ) {
    return ok(await this.service.updateCategory(id, body, user.id));
  }

  @Delete('categories/:id')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_DELETE)
  @ApiOperation({ summary: 'Soft-delete a construction category' })
  async deleteCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.deleteCategory(id, user.id));
  }

  @Public()
  @Get('materials')
  @ApiOperation({ summary: 'List published construction materials' })
  async materials(
    @Query(new ZodValidationPipe(constructionListQuerySchema)) query: ConstructionListQuery,
  ) {
    return okCursor(
      await this.service.listMaterials({ ...query, status: query.status ?? 'PUBLISHED' }),
    );
  }

  @Get('admin/materials')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_VIEW)
  async adminMaterials(
    @Query(new ZodValidationPipe(constructionListQuerySchema)) query: ConstructionListQuery,
  ) {
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
    @Body(new ZodValidationPipe(createConstructionMaterialSchema))
    body: CreateConstructionMaterialInput,
  ) {
    return ok(await this.service.createMaterial(body, user.id));
  }

  @Put('materials/:id')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_EDIT)
  async updateMaterial(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateConstructionMaterialSchema))
    body: UpdateConstructionMaterialInput,
  ) {
    return ok(await this.service.updateMaterial(id, body, user.id));
  }

  @Post('materials/:id/publish')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_PUBLISH)
  async publishMaterial(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.publishMaterial(id, user.id));
  }

  @Delete('materials/:id')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_DELETE)
  async deleteMaterial(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.deleteMaterial(id, user.id));
  }

  @Post('materials/:id/duplicate')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_CREATE)
  async duplicateMaterial(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.duplicateMaterial(id, user.id));
  }

  @Public()
  @Get('brands')
  async brands(
    @Query(new ZodValidationPipe(constructionListQuerySchema)) query: ConstructionListQuery,
  ) {
    return okCursor(
      await this.service.listBrands({ ...query, status: query.status ?? 'PUBLISHED' }),
    );
  }

  @Get('admin/brands')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_VIEW)
  async adminBrands(
    @Query(new ZodValidationPipe(constructionListQuerySchema)) query: ConstructionListQuery,
  ) {
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
  async publishBrand(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.publishBrand(id, user.id));
  }

  @Get('admin/cost-templates')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_VIEW)
  async adminTemplates(
    @Query(new ZodValidationPipe(constructionListQuerySchema)) query: ConstructionListQuery,
  ) {
    return okCursor(await this.service.listTemplates(query));
  }

  @Public()
  @Get('cost-templates')
  async costTemplates(
    @Query(new ZodValidationPipe(constructionListQuerySchema)) query: ConstructionListQuery,
  ) {
    return okCursor(
      await this.service.listTemplates({ ...query, status: query.status ?? 'PUBLISHED' }),
    );
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
  async publishTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.publishTemplate(id, user.id));
  }

  @Public()
  @Post('estimate')
  async estimate(
    @Body(new ZodValidationPipe(constructionEstimateSchema)) body: ConstructionEstimateInput,
  ) {
    return ok(await this.service.estimate(body));
  }

  @Post('estimate/save')
  async saveEstimate(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Body(new ZodValidationPipe(constructionEstimateSaveSchema))
    body: ConstructionEstimateSaveInput,
  ) {
    return ok(await this.service.saveEstimateAsProject(body, user?.id));
  }

  @Get('calculations')
  async listSavedCalculations(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Query('projectId') projectId?: string,
  ) {
    return ok(await this.service.listSavedCalculations(user?.id, projectId));
  }

  @Post('calculations')
  async saveCalculation(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Body(new ZodValidationPipe(saveConstructionCalculationSchema))
    body: SaveConstructionCalculationInput,
  ) {
    return ok(await this.service.saveConstructionCalculation(body, user?.id));
  }

  @Get('calculations/:id')
  async getSavedCalculation(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return ok(await this.service.getSavedCalculation(id, user?.id));
  }

  @Put('calculations/:id')
  async updateSavedCalculation(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateSavedConstructionCalculationSchema))
    body: UpdateSavedConstructionCalculationInput,
  ) {
    return ok(await this.service.updateSavedCalculation({ id, ...body }, user?.id));
  }

  @Post('calculations/:id/duplicate')
  async duplicateSavedCalculation(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return ok(await this.service.duplicateSavedCalculation(id, user?.id));
  }

  @Post('calculations/:id/recalculate')
  async recalculateSavedCalculation(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return ok(await this.service.recalculateSavedCalculation(id, user?.id));
  }

  @Delete('calculations/:id')
  async deleteSavedCalculation(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return ok(await this.service.deleteSavedCalculation(id, user?.id));
  }

  @Public()
  @Get('reports/estimate')
  async estimateReport(
    @Query(new ZodValidationPipe(constructionEstimateQuerySchema)) query: ConstructionEstimateQuery,
  ) {
    return ok(await this.service.estimateReport(query));
  }

  @Public()
  @Get('reports/estimate.pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="construction-estimate.pdf"')
  async estimateReportPdf(
    @Query(new ZodValidationPipe(constructionEstimateQuerySchema)) query: ConstructionEstimateQuery,
  ) {
    const pdf = await this.service.estimateReportPdf(query);
    return new StreamableFile(pdf);
  }

  @Public()
  @Get('compare')
  async compare(
    @Query(new ZodValidationPipe(constructionCompareQuerySchema)) query: ConstructionCompareQuery,
  ) {
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
    @Body(new ZodValidationPipe(createConstructionProjectSchema))
    body: CreateConstructionProjectInput,
  ) {
    return ok(await this.service.createProject(body, user?.id));
  }

  @Public()
  @Get('projects/:id')
  async getProject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
  ) {
    return ok(await this.service.getProject(id, user?.id));
  }

  @Put('projects/:id')
  async updateProject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Body(new ZodValidationPipe(updateConstructionProjectSchema))
    body: UpdateConstructionProjectInput,
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
  @Get('projects/:id/boqs')
  async listProjectBoqs(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
  ) {
    return ok(await this.service.listProjectBoqs(id, user?.id));
  }

  @Public()
  @Post('projects/:id/boqs')
  async createProjectBoq(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Body(new ZodValidationPipe(saveConstructionProjectBoqSchema))
    body: SaveConstructionProjectBoqInput,
  ) {
    return ok(await this.service.createProjectBoq(id, body, user?.id));
  }

  @Public()
  @Get('boqs/:boqId')
  async getBoq(
    @Param('boqId', ParseUUIDPipe) boqId: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
  ) {
    return ok(await this.service.getBoq(boqId, user?.id));
  }

  @Public()
  @Post('boqs/:boqId/duplicate')
  async duplicateBoq(
    @Param('boqId', ParseUUIDPipe) boqId: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
  ) {
    return ok(await this.service.duplicateBoq(boqId, user?.id));
  }

  @Public()
  @Get('boqs/:boqId/report.pdf')
  @Header('Content-Disposition', 'attachment; filename="varnarc-boq.pdf"')
  async boqReportPdf(
    @Param('boqId', ParseUUIDPipe) boqId: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
  ) {
    const pdf = await this.service.boqReportPdf(boqId, user?.id);
    return new StreamableFile(pdf, { type: 'application/pdf' });
  }

  @Public()
  @Get('projects/:id/phases')
  async listProjectPhases(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
  ) {
    return ok(await this.service.listProjectPhases(id, user?.id));
  }

  @Public()
  @Put('projects/:id/phases')
  async replaceProjectPhases(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Body(new ZodValidationPipe(replaceConstructionProjectPhasesSchema))
    body: ReplaceConstructionProjectPhasesInput,
  ) {
    return ok(await this.service.replaceProjectPhases(id, body, user?.id));
  }

  @Public()
  @Get('projects/:id/budget-items')
  async listBudgetItems(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
  ) {
    return ok(await this.service.listBudgetItems(id, user?.id));
  }

  @Public()
  @Post('projects/:id/budget-items')
  async createBudgetItem(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Body(new ZodValidationPipe(saveConstructionBudgetItemSchema))
    body: SaveConstructionBudgetItemInput,
  ) {
    return ok(await this.service.createBudgetItem(id, body, user?.id));
  }

  @Public()
  @Delete('budget-items/:itemId')
  async deleteBudgetItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
  ) {
    return ok(await this.service.deleteBudgetItem(itemId, user?.id));
  }

  @Public()
  @Get('projects/:id/expenses')
  async listExpenses(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
  ) {
    return ok(await this.service.listExpenses(id, user?.id));
  }

  @Public()
  @Post('projects/:id/expenses')
  async createExpense(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Body(new ZodValidationPipe(saveConstructionExpenseSchema))
    body: SaveConstructionExpenseInput,
  ) {
    return ok(await this.service.createExpense(id, body, user?.id));
  }

  @Public()
  @Delete('expenses/:expenseId')
  async deleteExpense(
    @Param('expenseId', ParseUUIDPipe) expenseId: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
  ) {
    return ok(await this.service.deleteExpense(expenseId, user?.id));
  }

  @Public()
  @Get('projects/:id/documents')
  async listDocuments(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Query('kind') kind?: string,
  ) {
    return ok(await this.service.listDocuments(id, user?.id, false, kind));
  }

  @Public()
  @Post('projects/:id/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async uploadDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Record<string, string>,
  ) {
    const meta = saveConstructionDocumentMetaSchema.parse({
      kind: body.kind || 'OTHER',
      title: body.title,
      notes: body.notes || null,
      boqId: body.boqId || null,
      expenseId: body.expenseId || null,
      phaseId: body.phaseId || null,
      quoteDocumentId: body.quoteDocumentId || null,
    }) as SaveConstructionDocumentMetaInput;
    return ok(await this.service.uploadProjectDocument(id, file, meta, user?.id));
  }

  @Public()
  @Get('documents/:documentId')
  async getDocument(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
  ) {
    return ok(await this.service.getDocument(documentId, user?.id));
  }

  @Public()
  @Get('documents/:documentId/file')
  async downloadDocumentFile(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Res({ passthrough: true }) res: Response,
    @Query('disposition') disposition?: string,
  ) {
    const file = await this.service.downloadDocumentFile(documentId, user?.id);
    const mode = disposition === 'inline' ? 'inline' : 'attachment';
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `${mode}; filename="${file.filename.replace(/"/g, '')}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    return new StreamableFile(file.buffer);
  }

  @Public()
  @Delete('documents/:documentId')
  async deleteDocument(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
  ) {
    return ok(await this.service.deleteDocument(documentId, user?.id));
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
  @Get('prices')
  @ApiOperation({ summary: 'Construction prices hub — latest observations with freshness' })
  async pricesHub(@Query('material') material?: string, @Query('location') location?: string) {
    return ok(await this.service.listPriceHub({ material, location }));
  }

  @Public()
  @Get('prices/landings')
  @ApiOperation({ summary: 'Indexable price landing pairs (data-gated)' })
  async priceLandings() {
    return ok(await this.service.listIndexablePriceLandings());
  }

  @Public()
  @Get('construction-cost/landings')
  @ApiOperation({
    summary: 'Indexable city construction-cost landings (editorial + data gated)',
  })
  async constructionCostLandings() {
    return ok(await this.service.listIndexableConstructionCostCities());
  }

  @Public()
  @Get('construction-cost/:city')
  @ApiOperation({
    summary: 'City construction-cost landing (404 when insufficient local data)',
  })
  async constructionCostCity(@Param('city') city: string) {
    const data = await this.service.getConstructionCostCityLanding(city);
    if (!data) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'COST_CITY_LANDING_UNAVAILABLE',
          message:
            'Insufficient local data or missing editorial profile for this city construction-cost page.',
        },
      });
    }
    return ok(data);
  }

  @Public()
  @Get('prices/:material/:city/history')
  @ApiOperation({
    summary: 'Material×city price history (any observations; not SEO-gated)',
  })
  async pricePairHistory(@Param('material') material: string, @Param('city') city: string) {
    const data = await this.service.getPricePairHistory(material, city);
    if (!data) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'PRICE_HISTORY_UNAVAILABLE',
          message: 'No price observations for this city and material.',
        },
      });
    }
    return ok(data);
  }

  @Public()
  @Get('prices/:material/:city')
  @ApiOperation({ summary: 'City × material price landing (404 when data insufficient)' })
  async priceLanding(@Param('material') material: string, @Param('city') city: string) {
    const data = await this.service.getPriceLanding(material, city);
    if (!data) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'PRICE_LANDING_UNAVAILABLE',
          message: 'Insufficient reliable price data for this city and material.',
        },
      });
    }
    return ok(data);
  }

  @Public()
  @Get('vcci/methodology')
  @ApiOperation({ summary: 'VCCI methodology (always public; no invented index values)' })
  async vcciMethodology() {
    return ok(await this.service.getVcciMethodology());
  }

  @Public()
  @Get('vcci')
  @ApiOperation({ summary: 'VCCI hub — numeric values only when quality gate passes' })
  async vcciHub() {
    return ok(await this.service.getVcciHub());
  }

  @Public()
  @Get('vcci/cities')
  @ApiOperation({ summary: 'Cities with published VCCI snapshots' })
  async vcciCities() {
    return ok(await this.service.listPublishedVcciCities());
  }

  @Public()
  @Get('vcci/city/:city')
  @ApiOperation({ summary: 'City VCCI view (404 when unpublished / insufficient quality)' })
  async vcciCity(@Param('city') city: string) {
    const data = await this.service.getVcciCity(city);
    if (!data) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'VCCI_CITY_UNAVAILABLE',
          message: 'VCCI city view is not published for this location.',
        },
      });
    }
    return ok(data);
  }

  @Public()
  @Get('vcci/components/:component')
  @ApiOperation({ summary: 'Component VCCI view (404 when unpublished / insufficient quality)' })
  async vcciComponent(@Param('component') component: string) {
    const data = await this.service.getVcciComponent(component);
    if (!data) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'VCCI_COMPONENT_UNAVAILABLE',
          message: 'VCCI component view is not published for this key.',
        },
      });
    }
    return ok(data);
  }

  @Public()
  @Get('fair-price-checker/meta')
  @ApiOperation({ summary: 'Fair price checker materials, cities, units, methodology' })
  fairPriceCheckerMeta() {
    return ok(this.service.getFairPriceCheckerMeta());
  }

  @Public()
  @Post('fair-price-checker')
  @ApiOperation({
    summary: 'Compare a quote to recent Varnarc observed ranges (never labels fraud/unfair)',
  })
  async fairPriceChecker(
    @Body(new ZodValidationPipe(fairPriceCheckInputSchema)) body: FairPriceCheckInput,
  ) {
    return ok(await this.service.checkFairPrice(body));
  }

  @Public()
  @Get('project-readiness/meta')
  @ApiOperation({
    summary: 'Project readiness checker items, methodology and score bands',
  })
  projectReadinessMeta() {
    return ok(this.service.getProjectReadinessMeta());
  }

  @Public()
  @Post('project-readiness')
  @ApiOperation({
    summary:
      'Score construction planning readiness (not engineering adequacy or structural safety)',
  })
  evaluateProjectReadiness(
    @Body(new ZodValidationPipe(projectReadinessInputSchema)) body: ProjectReadinessInput,
  ) {
    return ok(this.service.evaluateProjectReadiness(body));
  }

  @Public()
  @Get('community-prices/meta')
  @ApiOperation({ summary: 'Community price reporting meta (materials, cities, limits)' })
  async communityPriceMeta() {
    return ok(await this.communityPrices.meta());
  }

  @Public()
  @Get('community-prices/aggregate')
  @ApiOperation({
    summary:
      'Public community observed range from eligible VERIFIED reports only — never primary market prices',
  })
  async communityPriceAggregate(
    @Query('materialId') materialId?: string,
    @Query('locationId') locationId?: string,
    @Query('unit') unit?: string,
  ) {
    return ok(
      await this.communityPrices.getPublicAggregate(materialId ?? '', locationId ?? '', unit ?? ''),
    );
  }

  @Get('community-prices/mine')
  @ApiOperation({ summary: 'List my community price reports (auth; privacy-scoped)' })
  async myCommunityPrices(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Query('status') status?: string,
  ) {
    return ok(await this.communityPrices.listMine(user?.id, status));
  }

  @Post('community-prices')
  @Throttle({ default: { limit: SECURITY_RATE_LIMITS.contact, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('invoice', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiOperation({
    summary:
      'Submit community material price (auth + rate limited). Never auto-promotes to primary market prices.',
  })
  async submitCommunityPrice(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @UploadedFile() invoice: Express.Multer.File | undefined,
    @Body() body: Record<string, string>,
  ) {
    const parsed = createCommunityPriceReportSchema.parse({
      materialId: body.materialId,
      locationId: body.locationId,
      brandId: body.brandId || null,
      brandName: body.brandName || null,
      price: body.price,
      unit: body.unit,
      currency: body.currency || 'INR',
      purchaseDate: body.purchaseDate,
      supplierName: body.supplierName || null,
      notes: body.notes || null,
    }) as CreateCommunityPriceReportInput;
    return ok(await this.communityPrices.submit(user?.id, parsed, invoice));
  }

  @Get('community-prices/moderation')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_VIEW)
  @ApiOperation({ summary: 'List community reports for moderation (admin)' })
  async moderateCommunityList(@Query('status') status?: string) {
    return ok(await this.communityPrices.listForModeration(status));
  }

  @Delete('community-prices/:id')
  @ApiOperation({ summary: 'Soft-delete my non-verified community price report' })
  async deleteCommunityPrice(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return ok(await this.communityPrices.removeMine(user?.id, id));
  }

  @Get('community-prices/:id/invoice')
  @ApiOperation({
    summary: 'Download invoice proof (owner or admin only — never public)',
  })
  async downloadCommunityInvoice(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const isAdmin = Boolean(
      user?.permissions?.includes(PERMISSIONS.CONSTRUCTION_VIEW) ||
      user?.permissions?.includes(PERMISSIONS.CONSTRUCTION_EDIT),
    );
    const file = await this.communityPrices.downloadInvoice(id, user?.id, isAdmin);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename.replace(/"/g, '')}"`,
    );
    res.setHeader('Cache-Control', 'private, no-store');
    return new StreamableFile(file.buffer);
  }

  @Post('community-prices/:id/moderate')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_EDIT)
  @Throttle({ default: { limit: SECURITY_RATE_LIMITS.contact, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Moderate community report (never writes primary market prices)',
  })
  async moderateCommunityPrice(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(moderateCommunityPriceReportSchema))
    body: ModerateCommunityPriceReportInput,
  ) {
    return ok(await this.communityPrices.moderate(user?.id, id, body));
  }

  @Public()
  @Get('price-alerts/meta')
  @ApiOperation({ summary: 'Price alert conditions and limits (public meta)' })
  async priceAlertMeta() {
    return ok(await this.priceAlerts.meta());
  }

  @Get('price-alerts')
  @ApiOperation({ summary: 'List my material price alerts (auth required)' })
  async listPriceAlerts(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Query('status') status?: string,
  ) {
    return ok(await this.priceAlerts.listMine(user?.id, status));
  }

  @Get('price-alerts/history')
  @ApiOperation({ summary: 'Price alert trigger history (auth required)' })
  async priceAlertHistory(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Query('alertId') alertId?: string,
  ) {
    return ok(await this.priceAlerts.listTriggerHistory(user?.id, alertId));
  }

  @Post('price-alerts')
  @Throttle({ default: { limit: SECURITY_RATE_LIMITS.contact, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create material price alert (auth + rate limited)' })
  async createPriceAlert(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Body(new ZodValidationPipe(createConstructionPriceAlertSchema))
    body: CreateConstructionPriceAlertInput,
  ) {
    return ok(await this.priceAlerts.create(user?.id, body));
  }

  @Put('price-alerts/:id')
  @ApiOperation({ summary: 'Update price alert (pause/resume/thresholds)' })
  async updatePriceAlert(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateConstructionPriceAlertSchema))
    body: UpdateConstructionPriceAlertInput,
  ) {
    return ok(await this.priceAlerts.update(user?.id, id, body));
  }

  @Post('price-alerts/:id/pause')
  @ApiOperation({ summary: 'Pause price alert' })
  async pausePriceAlert(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return ok(await this.priceAlerts.pause(user?.id, id));
  }

  @Post('price-alerts/:id/resume')
  @ApiOperation({ summary: 'Resume price alert' })
  async resumePriceAlert(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return ok(await this.priceAlerts.resume(user?.id, id));
  }

  @Delete('price-alerts/:id')
  @ApiOperation({ summary: 'Delete price alert' })
  async deletePriceAlert(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return ok(await this.priceAlerts.remove(user?.id, id));
  }

  @Post('price-alerts/evaluate')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_EDIT)
  @ApiOperation({ summary: 'Manually evaluate active price alerts (admin)' })
  async evaluatePriceAlerts() {
    return ok(await this.priceAlerts.evaluateActiveAlerts());
  }

  @Public()
  @Get('suppliers/meta')
  @ApiOperation({ summary: 'Supplier directory categories, cities, sort options' })
  supplierDirectoryMeta() {
    return ok(this.service.getSupplierDirectoryMeta());
  }

  @Public()
  @Get('suppliers/landings')
  @ApiOperation({ summary: 'Indexable supplier category×city landings (data-gated)' })
  async supplierLandings() {
    return ok(await this.service.listIndexableSupplierLandings());
  }

  @Public()
  @Get('suppliers')
  @ApiOperation({
    summary:
      'List construction suppliers with filters (location, category, brand, verified). No deceptive ranking.',
  })
  async suppliers(
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('location') location?: string,
    @Query('category') category?: string,
    @Query('brand') brand?: string,
    @Query('verified') verified?: string,
    @Query('sort') sort?: string,
  ) {
    return ok(
      await this.service.listSuppliers({
        limit: limit ? Number(limit) : undefined,
        cursor: cursor || undefined,
        location: location || undefined,
        category: category as never,
        brand: brand || undefined,
        verified: verified as never,
        sort: (sort as 'name' | 'recent') || undefined,
      }),
    );
  }

  @Public()
  @Get('suppliers/profile/:slug')
  @ApiOperation({ summary: 'Construction supplier profile (directory business)' })
  async supplierProfile(@Param('slug') slug: string) {
    const data = await this.service.getSupplierProfile(slug);
    if (!data) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Supplier not found.' },
      });
    }
    return ok(data);
  }

  @Public()
  @Get('suppliers/:category/:city')
  @ApiOperation({
    summary: 'Category × city supplier landing (404 when listings insufficient)',
  })
  async supplierLanding(@Param('category') category: string, @Param('city') city: string) {
    const data = await this.service.getSupplierLanding(category, city);
    if (!data) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Supplier landing not available — insufficient useful listings.',
        },
      });
    }
    return ok(data);
  }

  @Get('admin/suppliers')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_VIEW)
  @ApiOperation({ summary: 'Admin view of linked construction suppliers' })
  async adminSuppliers(@Query('limit') limit?: string, @Query('cursor') cursor?: string) {
    return ok(
      await this.service.listSuppliers({
        limit: limit ? Number(limit) : undefined,
        cursor: cursor || undefined,
        sort: 'name',
      }),
    );
  }

  @Public()
  @Get('professionals/meta')
  @ApiOperation({
    summary: 'Professionals directory types, specialities, project types, info-source labels',
  })
  professionalsDirectoryMeta() {
    return ok(this.service.getProfessionalsDirectoryMeta());
  }

  @Public()
  @Get('professionals/landings')
  @ApiOperation({ summary: 'Indexable professional type×city landings (data-gated)' })
  async professionalLandings() {
    return ok(await this.service.listIndexableProfessionalLandings());
  }

  @Public()
  @Get('professionals')
  @ApiOperation({
    summary:
      'List construction professionals (contractors, architects, civil engineers, interior designers). No deceptive ranking.',
  })
  async professionals(
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('location') location?: string,
    @Query('type') type?: string,
    @Query('speciality') speciality?: string,
    @Query('projectType') projectType?: string,
    @Query('verified') verified?: string,
    @Query('sort') sort?: string,
  ) {
    return ok(
      await this.service.listProfessionals({
        limit: limit ? Number(limit) : undefined,
        cursor: cursor || undefined,
        location: location || undefined,
        type: type as never,
        speciality: speciality || undefined,
        projectType: projectType || undefined,
        verified: verified as never,
        sort: (sort as 'name' | 'recent') || undefined,
      }),
    );
  }

  @Public()
  @Get('professionals/profile/:slug')
  @ApiOperation({ summary: 'Construction professional profile (directory business)' })
  async professionalProfile(@Param('slug') slug: string) {
    const data = await this.service.getProfessionalProfile(slug);
    if (!data) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Professional not found.' },
      });
    }
    return ok(data);
  }

  @Public()
  @Get('professionals/:type/:city')
  @ApiOperation({
    summary: 'Type × city professional landing (404 when listings insufficient)',
  })
  async professionalLanding(@Param('type') type: string, @Param('city') city: string) {
    const data = await this.service.getProfessionalLanding(type, city);
    if (!data) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Professional landing not available — insufficient useful listings.',
        },
      });
    }
    return ok(data);
  }

  @Public()
  @Get('checklists')
  @ApiOperation({ summary: 'List published construction checklists' })
  async checklists() {
    return ok(await this.service.listChecklists());
  }

  @Public()
  @Get('checklists/meta')
  @ApiOperation({ summary: 'Construction checklist system meta and canonical list' })
  checklistMeta() {
    return ok(this.service.getChecklistSystemMeta());
  }

  @Public()
  @Get('checklists/:slug')
  @ApiOperation({ summary: 'Get a published checklist by slug (SEO)' })
  async checklist(@Param('slug') slug: string) {
    return ok(await this.service.getChecklist(slug));
  }

  @Public()
  @Get('projects/:id/checklists')
  @ApiOperation({ summary: 'List checklist progress saved on a project' })
  async listProjectChecklists(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
  ) {
    return ok(await this.service.listProjectChecklistProgress(id, user?.id));
  }

  @Public()
  @Get('projects/:id/checklists/:slug')
  @ApiOperation({ summary: 'Get checklist progress for a project' })
  async getProjectChecklist(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('slug') slug: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
  ) {
    return ok(await this.service.getProjectChecklistProgress(id, slug, user?.id));
  }

  @Public()
  @Put('projects/:id/checklists/:slug')
  @ApiOperation({
    summary:
      'Save checklist progress to a project (complete + notes). Not a compliance certificate.',
  })
  async saveProjectChecklist(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('slug') slug: string,
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Body(new ZodValidationPipe(saveConstructionChecklistProgressSchema))
    body: SaveConstructionChecklistProgressInput,
  ) {
    return ok(
      await this.service.saveProjectChecklistProgress(
        id,
        { ...body, checklistSlug: slug },
        user?.id,
      ),
    );
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
    @Body(new ZodValidationPipe(createConstructionChecklistSchema))
    body: CreateConstructionChecklistInput,
  ) {
    return ok(await this.service.createChecklist(body, user.id));
  }

  @Put('admin/checklists/:id')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_EDIT)
  @ApiOperation({ summary: 'Update a construction checklist' })
  async updateChecklist(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateConstructionChecklistSchema))
    body: UpdateConstructionChecklistInput,
  ) {
    return ok(await this.service.updateChecklist(id, body, user.id));
  }

  @Delete('admin/checklists/:id')
  @RequirePermissions(PERMISSIONS.CONSTRUCTION_DELETE)
  @ApiOperation({ summary: 'Soft-delete a construction checklist' })
  async deleteChecklist(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
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
    @Body(new ZodValidationPipe(createConstructionComparisonSchema))
    body: CreateConstructionComparisonInput,
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
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async importCsv(
    @Param('entity') entity: string,
    @CurrentUserDecorator() user: CurrentUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file?.buffer) return ok({ imported: 0 });
    return ok(await this.service.importCsv(entity, file.buffer.toString('utf8'), user.id));
  }
}
