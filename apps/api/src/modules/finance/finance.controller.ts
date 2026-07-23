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
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import {
  createBankSchema,
  createCreditCardSchema,
  createFinanceCategorySchema,
  createInsuranceSchema,
  createInterestRateSchema,
  createInvestmentSchema,
  createLoanSchema,
  financeCompareQuerySchema,
  financeListQuerySchema,
  updateBankSchema,
  updateCreditCardSchema,
  updateFinanceCategorySchema,
  updateInsuranceSchema,
  updateInterestRateSchema,
  updateInvestmentSchema,
  updateLoanSchema,
  type CreateBankInput,
  type CreateCreditCardInput,
  type CreateFinanceCategoryInput,
  type CreateInsuranceInput,
  type CreateInterestRateInput,
  type CreateInvestmentInput,
  type CreateLoanInput,
  type FinanceCompareQuery,
  type FinanceListQuery,
  type UpdateBankInput,
  type UpdateCreditCardInput,
  type UpdateFinanceCategoryInput,
  type UpdateInsuranceInput,
  type UpdateInterestRateInput,
  type UpdateInvestmentInput,
  type UpdateLoanInput,
} from '@varnarc/validation';
import type { CurrentUser } from '@varnarc/types';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok, okCursor } from '../../common/utils/response';
import { FinanceService } from './finance.service';
import { FinanceGapService } from './finance-gap.service';

@ApiTags('finance')
@Controller('finance')
export class FinanceController {
  constructor(
    private readonly service: FinanceService,
    private readonly gap: FinanceGapService,
  ) {}

  @Public()
  @Get('status')
  status() {
    return ok({ module: 'finance', status: 'ready' });
  }

  @Public()
  @Get('dashboard')
  async dashboard() {
    return ok(await this.service.dashboard());
  }

  @Public()
  @Get('categories')
  async categories() {
    return ok(await this.service.listCategories());
  }

  @Post('categories')
  @RequirePermissions(PERMISSIONS.FINANCE_EDIT)
  async createCategory(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createFinanceCategorySchema)) body: CreateFinanceCategoryInput,
  ) {
    return ok(await this.service.createCategory(body, user.id));
  }

  @Put('categories/:id')
  @RequirePermissions(PERMISSIONS.FINANCE_EDIT)
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateFinanceCategorySchema)) body: UpdateFinanceCategoryInput,
  ) {
    return ok(await this.service.updateCategory(id, body, user.id));
  }

  @Delete('categories/:id')
  @RequirePermissions(PERMISSIONS.FINANCE_DELETE)
  async deleteCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.deleteCategory(id, user.id));
  }

  @Public()
  @Get('banks')
  async banks(@Query(new ZodValidationPipe(financeListQuerySchema)) query: FinanceListQuery) {
    return okCursor(await this.service.listBanks({ ...query, status: query.status ?? 'PUBLISHED' }));
  }

  @Get('admin/banks')
  @RequirePermissions(PERMISSIONS.FINANCE_VIEW)
  async adminBanks(@Query(new ZodValidationPipe(financeListQuerySchema)) query: FinanceListQuery) {
    return okCursor(await this.service.listBanks(query));
  }

  @Get('banks/:id')
  @RequirePermissions(PERMISSIONS.FINANCE_VIEW)
  async bank(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getBank(id));
  }

  @Public()
  @Get('banks/slug/:slug')
  async bankBySlug(@Param('slug') slug: string) {
    return ok(await this.gap.getBankBySlug(slug));
  }

  @Post('banks')
  @RequirePermissions(PERMISSIONS.FINANCE_CREATE)
  async createBank(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createBankSchema)) body: CreateBankInput,
  ) {
    return ok(await this.service.createBank(body, user.id));
  }

  @Put('banks/:id')
  @RequirePermissions(PERMISSIONS.FINANCE_EDIT)
  async updateBank(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateBankSchema)) body: UpdateBankInput,
  ) {
    return ok(await this.service.updateBank(id, body, user.id));
  }

  @Post('banks/:id/publish')
  @RequirePermissions(PERMISSIONS.FINANCE_PUBLISH)
  async publishBank(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.publishBank(id, user.id));
  }

  @Delete('banks/:id')
  @RequirePermissions(PERMISSIONS.FINANCE_DELETE)
  async deleteBank(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.deleteBank(id, user.id));
  }

  @Public()
  @Get('loans')
  async loans(@Query(new ZodValidationPipe(financeListQuerySchema)) query: FinanceListQuery) {
    return okCursor(await this.service.listLoans({ ...query, status: query.status ?? 'PUBLISHED' }));
  }

  @Get('admin/loans')
  @RequirePermissions(PERMISSIONS.FINANCE_VIEW)
  async adminLoans(@Query(new ZodValidationPipe(financeListQuerySchema)) query: FinanceListQuery) {
    return okCursor(await this.service.listLoans(query));
  }

  @Public()
  @Get('loans/:id')
  async loan(@Param('id', ParseUUIDPipe) id: string) {
    const row = await this.service.getLoan(id);
    return ok(row);
  }

  @Post('loans')
  @RequirePermissions(PERMISSIONS.FINANCE_CREATE)
  async createLoan(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createLoanSchema)) body: CreateLoanInput,
  ) {
    return ok(await this.service.createLoan(body, user.id));
  }

  @Put('loans/:id')
  @RequirePermissions(PERMISSIONS.FINANCE_EDIT)
  async updateLoan(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateLoanSchema)) body: UpdateLoanInput,
  ) {
    return ok(await this.service.updateLoan(id, body, user.id));
  }

  @Post('loans/:id/publish')
  @RequirePermissions(PERMISSIONS.FINANCE_PUBLISH)
  async publishLoan(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.publishLoan(id, user.id));
  }

  @Delete('loans/:id')
  @RequirePermissions(PERMISSIONS.FINANCE_DELETE)
  async deleteLoan(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.deleteLoan(id, user.id));
  }

  @Public()
  @Get('credit-cards')
  async creditCards(@Query(new ZodValidationPipe(financeListQuerySchema)) query: FinanceListQuery) {
    return okCursor(await this.service.listCreditCards({ ...query, status: query.status ?? 'PUBLISHED' }));
  }

  @Get('admin/credit-cards')
  @RequirePermissions(PERMISSIONS.FINANCE_VIEW)
  async adminCreditCards(@Query(new ZodValidationPipe(financeListQuerySchema)) query: FinanceListQuery) {
    return okCursor(await this.service.listCreditCards(query));
  }

  @Public()
  @Get('credit-cards/:id')
  async creditCard(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getCreditCard(id));
  }

  @Post('credit-cards')
  @RequirePermissions(PERMISSIONS.FINANCE_CREATE)
  async createCreditCard(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createCreditCardSchema)) body: CreateCreditCardInput,
  ) {
    return ok(await this.service.createCreditCard(body, user.id));
  }

  @Put('credit-cards/:id')
  @RequirePermissions(PERMISSIONS.FINANCE_EDIT)
  async updateCreditCard(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateCreditCardSchema)) body: UpdateCreditCardInput,
  ) {
    return ok(await this.service.updateCreditCard(id, body, user.id));
  }

  @Post('credit-cards/:id/publish')
  @RequirePermissions(PERMISSIONS.FINANCE_PUBLISH)
  async publishCreditCard(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.publishCreditCard(id, user.id));
  }

  @Delete('credit-cards/:id')
  @RequirePermissions(PERMISSIONS.FINANCE_DELETE)
  async deleteCreditCard(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.deleteCreditCard(id, user.id));
  }

  @Public()
  @Get('insurance')
  async insurance(@Query(new ZodValidationPipe(financeListQuerySchema)) query: FinanceListQuery) {
    return okCursor(await this.service.listInsurance({ ...query, status: query.status ?? 'PUBLISHED' }));
  }

  @Get('admin/insurance')
  @RequirePermissions(PERMISSIONS.FINANCE_VIEW)
  async adminInsurance(@Query(new ZodValidationPipe(financeListQuerySchema)) query: FinanceListQuery) {
    return okCursor(await this.service.listInsurance(query));
  }

  @Public()
  @Get('insurance/:id')
  async insuranceOne(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getInsurance(id));
  }

  @Post('insurance')
  @RequirePermissions(PERMISSIONS.FINANCE_CREATE)
  async createInsurance(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createInsuranceSchema)) body: CreateInsuranceInput,
  ) {
    return ok(await this.service.createInsurance(body, user.id));
  }

  @Put('insurance/:id')
  @RequirePermissions(PERMISSIONS.FINANCE_EDIT)
  async updateInsurance(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateInsuranceSchema)) body: UpdateInsuranceInput,
  ) {
    return ok(await this.service.updateInsurance(id, body, user.id));
  }

  @Post('insurance/:id/publish')
  @RequirePermissions(PERMISSIONS.FINANCE_PUBLISH)
  async publishInsurance(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.publishInsurance(id, user.id));
  }

  @Delete('insurance/:id')
  @RequirePermissions(PERMISSIONS.FINANCE_DELETE)
  async deleteInsurance(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.deleteInsurance(id, user.id));
  }

  @Public()
  @Get('investments')
  async investments(@Query(new ZodValidationPipe(financeListQuerySchema)) query: FinanceListQuery) {
    return okCursor(await this.service.listInvestments({ ...query, status: query.status ?? 'PUBLISHED' }));
  }

  @Get('admin/investments')
  @RequirePermissions(PERMISSIONS.FINANCE_VIEW)
  async adminInvestments(@Query(new ZodValidationPipe(financeListQuerySchema)) query: FinanceListQuery) {
    return okCursor(await this.service.listInvestments(query));
  }

  @Public()
  @Get('investments/:id')
  async investment(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getInvestment(id));
  }

  @Post('investments')
  @RequirePermissions(PERMISSIONS.FINANCE_CREATE)
  async createInvestment(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createInvestmentSchema)) body: CreateInvestmentInput,
  ) {
    return ok(await this.service.createInvestment(body, user.id));
  }

  @Put('investments/:id')
  @RequirePermissions(PERMISSIONS.FINANCE_EDIT)
  async updateInvestment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateInvestmentSchema)) body: UpdateInvestmentInput,
  ) {
    return ok(await this.service.updateInvestment(id, body, user.id));
  }

  @Post('investments/:id/publish')
  @RequirePermissions(PERMISSIONS.FINANCE_PUBLISH)
  async publishInvestment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.publishInvestment(id, user.id));
  }

  @Delete('investments/:id')
  @RequirePermissions(PERMISSIONS.FINANCE_DELETE)
  async deleteInvestment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.deleteInvestment(id, user.id));
  }

  @Public()
  @Get('interest-rates')
  async rates(@Query(new ZodValidationPipe(financeListQuerySchema)) query: FinanceListQuery) {
    return okCursor(await this.service.listRates(query));
  }

  @Get('admin/interest-rates')
  @RequirePermissions(PERMISSIONS.FINANCE_VIEW)
  async adminRates(@Query(new ZodValidationPipe(financeListQuerySchema)) query: FinanceListQuery) {
    return okCursor(await this.service.listRates(query));
  }

  @Post('interest-rates')
  @RequirePermissions(PERMISSIONS.FINANCE_CREATE)
  async createRate(
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(createInterestRateSchema)) body: CreateInterestRateInput,
  ) {
    return ok(await this.service.createRate(body, user.id));
  }

  @Put('interest-rates/:id')
  @RequirePermissions(PERMISSIONS.FINANCE_EDIT)
  async updateRate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Body(new ZodValidationPipe(updateInterestRateSchema)) body: UpdateInterestRateInput,
  ) {
    return ok(await this.service.updateRate(id, body, user.id));
  }

  @Delete('interest-rates/:id')
  @RequirePermissions(PERMISSIONS.FINANCE_DELETE)
  async deleteRate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.deleteRate(id, user.id));
  }

  @Public()
  @Get('compare')
  async compare(@Query(new ZodValidationPipe(financeCompareQuerySchema)) query: FinanceCompareQuery) {
    return ok(await this.service.compare(query));
  }

  // --- Gapfill: content, reviews, affiliate, tools ---

  @Public()
  @Get('faqs')
  async faqs() {
    return ok(await this.gap.listFaqs());
  }

  @Get('admin/faqs')
  @RequirePermissions(PERMISSIONS.FINANCE_VIEW)
  async adminFaqs() {
    return ok(await this.gap.listFaqs(true));
  }

  @Post('admin/faqs')
  @RequirePermissions(PERMISSIONS.FINANCE_CREATE)
  async createFaq(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() body: { question: string; answer: string; categoryId?: string | null; sortOrder?: number },
  ) {
    return ok(await this.gap.createFaq(body, user.id));
  }

  @Public()
  @Get('glossary')
  async glossary() {
    return ok(await this.gap.listGlossary());
  }

  @Get('admin/glossary')
  @RequirePermissions(PERMISSIONS.FINANCE_VIEW)
  async adminGlossary() {
    return ok(await this.gap.listGlossary(true));
  }

  @Post('admin/glossary')
  @RequirePermissions(PERMISSIONS.FINANCE_CREATE)
  async createGlossary(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() body: { term: string; slug: string; definition: string },
  ) {
    return ok(await this.gap.createGlossary(body, user.id));
  }

  @Public()
  @Get('guides')
  async guides() {
    return ok(await this.gap.listGuides());
  }

  @Public()
  @Get('guides/:slug')
  async guide(@Param('slug') slug: string) {
    return ok(await this.gap.getGuideBySlug(slug));
  }

  @Post('admin/guides')
  @RequirePermissions(PERMISSIONS.FINANCE_CREATE)
  async createGuide(
    @CurrentUserDecorator() user: CurrentUser,
    @Body()
    body: {
      title: string;
      slug: string;
      summary?: string | null;
      body?: string | null;
      categoryId?: string | null;
      status?: 'DRAFT' | 'PUBLISHED';
    },
  ) {
    return ok(await this.gap.createGuide(body, user.id));
  }

  @Public()
  @Get('loans/:id/reviews')
  async loanReviews(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.gap.entityReviews('loans', id));
  }

  @Public()
  @Get('credit-cards/:id/reviews')
  async cardReviews(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.gap.entityReviews('credit-cards', id));
  }

  @Public()
  @Get('insurance/:id/reviews')
  async insuranceReviews(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.gap.entityReviews('insurance', id));
  }

  @Public()
  @Get('investments/:id/reviews')
  async investmentReviews(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.gap.entityReviews('investments', id));
  }

  @Public()
  @Post('affiliate/click')
  async affiliateClick(
    @Body()
    body: {
      entityType: string;
      entityId: string;
      affiliateUrl: string;
      sessionId?: string | null;
      referrer?: string | null;
    },
  ) {
    return ok(await this.gap.trackAffiliateClick(body));
  }

  @Get('admin/affiliate-stats')
  @RequirePermissions(PERMISSIONS.FINANCE_VIEW)
  async affiliateStats() {
    return ok(await this.gap.affiliateStats());
  }

  @Get('admin/comparisons')
  @RequirePermissions(PERMISSIONS.FINANCE_VIEW)
  async adminComparisons() {
    return ok(await this.gap.listComparisons());
  }

  @Post('admin/comparisons')
  @RequirePermissions(PERMISSIONS.FINANCE_CREATE)
  async createComparison(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() body: { title: string; slug: string; entityType: string; entityIds: string[]; status?: 'DRAFT' | 'PUBLISHED' },
  ) {
    return ok(await this.gap.createComparison(body, user.id));
  }

  @Get('admin/rate-feeds')
  @RequirePermissions(PERMISSIONS.FINANCE_VIEW)
  async rateFeeds() {
    return ok(await this.gap.listRateFeeds());
  }

  @Post('admin/rate-feeds')
  @RequirePermissions(PERMISSIONS.FINANCE_CREATE)
  async createRateFeed(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() body: { name: string; provider: string; endpointUrl?: string | null; productType?: string | null },
  ) {
    return ok(await this.gap.createRateFeed(body, user.id));
  }

  @Post('admin/rate-feeds/:id/sync')
  @RequirePermissions(PERMISSIONS.FINANCE_EDIT)
  async syncRateFeed(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.gap.syncRateFeed(id, user.id));
  }

  @Public()
  @Post('eligibility/check')
  async eligibilityCheck(
    @Body() body: { loanType: string; income: number; amount: number; tenureMonths?: number },
  ) {
    return ok(await this.gap.checkEligibility(body));
  }

  @Public()
  @Post('credit-score/check')
  async creditScoreCheck(@Body() body: { pan?: string }) {
    return ok(await this.gap.checkCreditScore(body));
  }

  @Public()
  @Get('portfolio')
  async portfolio(@CurrentUserDecorator() user: CurrentUser | undefined) {
    return ok(await this.gap.getPortfolio(user?.id));
  }

  @Public()
  @Get('goals')
  async goals(@CurrentUserDecorator() user: CurrentUser | undefined) {
    return ok(await this.gap.listGoals(user?.id));
  }

  @Public()
  @Post('goals')
  async createGoal(
    @CurrentUserDecorator() user: CurrentUser | undefined,
    @Body() body: { title: string; targetAmount: number; currentAmount?: number; targetDate?: string | null },
  ) {
    return ok(await this.gap.createGoal(body, user?.id));
  }

  @Get('admin/export/:entity')
  @RequirePermissions(PERMISSIONS.FINANCE_VIEW)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportCsv(@Param('entity') entity: string) {
    const csv = await this.gap.exportCsv(entity);
    return new StreamableFile(Buffer.from(csv, 'utf8'));
  }

  @Post('admin/import/:entity')
  @RequirePermissions(PERMISSIONS.FINANCE_CREATE)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
  async importCsv(
    @Param('entity') entity: string,
    @CurrentUserDecorator() user: CurrentUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file?.buffer) {
      return ok({ imported: 0, error: 'No file uploaded' });
    }
    return ok(await this.gap.importCsv(entity, file.buffer.toString('utf8'), user.id));
  }
}
