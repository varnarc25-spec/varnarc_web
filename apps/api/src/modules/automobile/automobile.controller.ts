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
  automobileAffiliateClickSchema,
  automobileAffiliateLeadSchema,
  automobileCompareQuerySchema,
  automobileListQuerySchema,
  createAutomobileComparisonSchema,
  createAutomobileMaintenanceSchema,
  createAutomobileManufacturerSchema,
  createAutomobileVehicleSchema,
  updateAutomobileMaintenanceSchema,
  updateAutomobileManufacturerSchema,
  updateAutomobileVehicleSchema,
  type AutomobileAffiliateClickInput,
  type AutomobileAffiliateLeadInput,
  type AutomobileCompareQuery,
  type AutomobileListQuery,
  type CreateAutomobileComparisonInput,
  type CreateAutomobileMaintenanceInput,
  type CreateAutomobileManufacturerInput,
  type CreateAutomobileVehicleInput,
  type UpdateAutomobileMaintenanceInput,
  type UpdateAutomobileManufacturerInput,
  type UpdateAutomobileVehicleInput,
} from '@varnarc/validation';
import type { CurrentUser } from '@varnarc/types';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok, okCursor } from '../../common/utils/response';
import { AutomobileService } from './automobile.service';

@ApiTags('automobile')
@ApiBearerAuth()
@Controller('automobile')
export class AutomobileController {
  constructor(private readonly service: AutomobileService) {}

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Automobile module health status' })
  status() {
    return ok({ module: 'automobile', status: 'ready' });
  }

  @Public()
  @Get('dashboard')
  @ApiOperation({ summary: 'Public automobile dashboard stats' })
  async dashboard() {
    return ok(await this.service.dashboard());
  }

  @Public()
  @Get('manufacturers')
  @ApiOperation({ summary: 'List published manufacturers' })
  async manufacturers(@Query(new ZodValidationPipe(automobileListQuerySchema)) query: AutomobileListQuery) {
    return okCursor(await this.service.listManufacturers({ ...query, status: query.status ?? 'PUBLISHED' }));
  }

  @Get('admin/manufacturers')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_VIEW)
  @ApiOperation({ summary: 'Admin list manufacturers' })
  async adminManufacturers(@Query(new ZodValidationPipe(automobileListQuerySchema)) query: AutomobileListQuery) {
    return okCursor(await this.service.listManufacturers(query));
  }

  @Public()
  @Get('manufacturers/slug/:slug')
  @ApiOperation({ summary: 'Get manufacturer by slug' })
  async manufacturerBySlug(@Param('slug') slug: string) {
    return ok(await this.service.getManufacturerBySlug(slug));
  }

  @Get('manufacturers/:id')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_VIEW)
  async manufacturer(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getManufacturer(id));
  }

  @Post('manufacturers')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_CREATE)
  @ApiOperation({ summary: 'Create manufacturer' })
  async createManufacturer(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createAutomobileManufacturerSchema)) body: CreateAutomobileManufacturerInput,
  ) {
    return ok(await this.service.createManufacturer(body, user.id));
  }

  @Put('manufacturers/:id')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_EDIT)
  async updateManufacturer(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateAutomobileManufacturerSchema)) body: UpdateAutomobileManufacturerInput,
  ) {
    return ok(await this.service.updateManufacturer(id, body, user.id));
  }

  @Post('manufacturers/:id/publish')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_PUBLISH)
  async publishManufacturer(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.publishManufacturer(id, user.id));
  }

  @Public()
  @Get('vehicles')
  @ApiOperation({ summary: 'List published vehicles' })
  async vehicles(@Query(new ZodValidationPipe(automobileListQuerySchema)) query: AutomobileListQuery) {
    return okCursor(await this.service.listVehicles({ ...query, status: query.status ?? 'PUBLISHED' }));
  }

  @Get('admin/vehicles')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_VIEW)
  async adminVehicles(@Query(new ZodValidationPipe(automobileListQuerySchema)) query: AutomobileListQuery) {
    return okCursor(await this.service.listVehicles(query));
  }

  @Public()
  @Get('vehicles/slug/:slug')
  @ApiOperation({ summary: 'Get vehicle by slug' })
  async vehicleBySlug(@Param('slug') slug: string) {
    return ok(await this.service.getVehicleBySlug(slug));
  }

  @Public()
  @Get('vehicles/:id/offers')
  @ApiOperation({ summary: 'Finance and insurance offers for a vehicle' })
  async vehicleOffers(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.getVehicle(id);
    return ok(await this.service.vehicleOffers(id));
  }

  @Public()
  @Get('vehicles/:id')
  @ApiOperation({ summary: 'Get vehicle by id' })
  async vehicle(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getVehicle(id));
  }

  @Post('vehicles')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_CREATE)
  @ApiOperation({ summary: 'Create vehicle' })
  async createVehicle(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createAutomobileVehicleSchema)) body: CreateAutomobileVehicleInput,
  ) {
    return ok(await this.service.createVehicle(body, user.id));
  }

  @Put('vehicles/:id')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_EDIT)
  async updateVehicle(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateAutomobileVehicleSchema)) body: UpdateAutomobileVehicleInput,
  ) {
    return ok(await this.service.updateVehicle(id, body, user.id));
  }

  @Post('vehicles/:id/publish')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_PUBLISH)
  async publishVehicle(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.publishVehicle(id, user.id));
  }

  @Post('vehicles/:id/duplicate')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_CREATE)
  async duplicateVehicle(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.duplicateVehicle(id, user.id));
  }

  @Delete('vehicles/:id')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_DELETE)
  async deleteVehicle(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.deleteVehicle(id, user.id));
  }

  @Public()
  @Get('comparisons')
  @ApiOperation({ summary: 'List published saved comparisons' })
  async publishedComparisons() {
    return ok(await this.service.listPublishedComparisons());
  }

  @Public()
  @Get('comparisons/slug/:slug')
  @ApiOperation({ summary: 'Get saved comparison by slug with vehicles' })
  async comparisonBySlug(@Param('slug') slug: string) {
    return ok(await this.service.getComparisonBySlug(slug));
  }

  @Public()
  @Get('compare')
  @ApiOperation({ summary: 'Compare vehicles by ids' })
  async compare(@Query(new ZodValidationPipe(automobileCompareQuerySchema)) query: AutomobileCompareQuery) {
    return ok(await this.service.compare(query));
  }

  @Public()
  @Get('maintenance')
  @ApiOperation({ summary: 'List maintenance schedules' })
  async maintenance(@Query('vehicleId') vehicleId?: string) {
    return ok(await this.service.listMaintenance(vehicleId));
  }

  @Get('admin/maintenance')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_VIEW)
  async adminMaintenance() {
    return ok(await this.service.listMaintenance());
  }

  @Post('maintenance')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_CREATE)
  async createMaintenance(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createAutomobileMaintenanceSchema)) body: CreateAutomobileMaintenanceInput,
  ) {
    return ok(await this.service.createMaintenance(body, user.id));
  }

  @Put('maintenance/:id')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_EDIT)
  async updateMaintenance(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateAutomobileMaintenanceSchema)) body: UpdateAutomobileMaintenanceInput,
  ) {
    return ok(await this.service.updateMaintenance(id, body, user.id));
  }

  @Delete('maintenance/:id')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_DELETE)
  async deleteMaintenance(@Param('id', ParseUUIDPipe) id: string, @CurrentUserDecorator() user: CurrentUser) {
    return ok(await this.service.deleteMaintenance(id, user.id));
  }

  @Public()
  @Get('dealers')
  @ApiOperation({ summary: 'List automobile dealers from directory' })
  async dealers() {
    return ok(await this.service.dealers());
  }

  @Get('admin/dealers')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_VIEW)
  async adminDealers() {
    return ok(await this.service.dealers());
  }

  @Public()
  @Get('reviews')
  @ApiOperation({ summary: 'List approved reviews linked to vehicles/products' })
  async reviews(@Query('vehicleId') vehicleId?: string) {
    return ok(await this.service.reviews(vehicleId));
  }

  @Public()
  @Post('affiliate/click')
  @ApiOperation({ summary: 'Track automobile affiliate click' })
  async affiliateClick(
    @Body(new ZodValidationPipe(automobileAffiliateClickSchema)) body: AutomobileAffiliateClickInput,
  ) {
    return ok(await this.service.trackAffiliateClick(body));
  }

  @Public()
  @Post('affiliate/lead')
  @ApiOperation({ summary: 'Track automobile affiliate lead' })
  async affiliateLead(
    @Body(new ZodValidationPipe(automobileAffiliateLeadSchema)) body: AutomobileAffiliateLeadInput,
  ) {
    return ok(await this.service.trackAffiliateLead(body));
  }

  @Get('admin/affiliate-stats')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_VIEW)
  async affiliateStats() {
    return ok(await this.service.affiliateStats());
  }

  @Get('admin/review-options')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_VIEW)
  async reviewOptions() {
    return ok(await this.service.reviewOptions());
  }

  @Public()
  @Get('faqs')
  async faqs() {
    return ok(await this.service.listFaqs());
  }

  @Get('admin/faqs')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_VIEW)
  async adminFaqs() {
    return ok(await this.service.listFaqs(true));
  }

  @Post('admin/faqs')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_CREATE)
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
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_VIEW)
  async adminGuides() {
    return ok(await this.service.listGuides(true));
  }

  @Post('admin/guides')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_CREATE)
  async createGuide(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() body: { title: string; slug: string; summary?: string | null; body?: string | null },
  ) {
    return ok(await this.service.createGuide(body, user.id));
  }

  @Get('admin/comparisons')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_VIEW)
  async adminComparisons() {
    return ok(await this.service.listComparisons());
  }

  @Post('admin/comparisons')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_CREATE)
  async createComparison(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createAutomobileComparisonSchema)) body: CreateAutomobileComparisonInput,
  ) {
    return ok(await this.service.createComparison(body, user.id));
  }

  @Get('admin/reports/summary')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_VIEW)
  async adminReportsSummary() {
    return ok(await this.service.adminReportsSummary());
  }

  @Get('admin/history/:entity/:id')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_VIEW)
  async entityHistory(@Param('entity') entity: string, @Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.entityHistory(entity, id));
  }

  @Get('admin/export/:entity')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_VIEW)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportCsv(@Param('entity') entity: string) {
    const csv = await this.service.exportCsv(entity);
    return new StreamableFile(Buffer.from(csv, 'utf8'));
  }

  @Post('admin/import/:entity')
  @RequirePermissions(PERMISSIONS.AUTOMOBILE_CREATE)
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
