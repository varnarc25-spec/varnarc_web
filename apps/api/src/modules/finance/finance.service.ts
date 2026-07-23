import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { Repositories } from '@varnarc/database';
import type {
  CreateBankInput,
  CreateCreditCardInput,
  CreateFinanceCategoryInput,
  CreateInsuranceInput,
  CreateInterestRateInput,
  CreateInvestmentInput,
  CreateLoanInput,
  FinanceCompareQuery,
  FinanceListQuery,
  UpdateBankInput,
  UpdateCreditCardInput,
  UpdateFinanceCategoryInput,
  UpdateInsuranceInput,
  UpdateInterestRateInput,
  UpdateInvestmentInput,
  UpdateLoanInput,
} from '@varnarc/validation';
import { REPOS } from '../../database/database.module';

const LIST_CACHE_TTL_MS = 60_000;

@Injectable()
export class FinanceService {
  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private notFound(message = 'Finance resource not found.') {
    return new NotFoundException({
      success: false,
      error: { code: 'NOT_FOUND', message },
    });
  }

  private emptyUrl(v?: string | null) {
    return v === '' ? null : v;
  }

  private async audit(
    actorId: string,
    action: string,
    entity: string,
    entityId: string,
    newValue?: object,
  ) {
    await this.repos.auditLogs.create({
      userId: actorId,
      action,
      entity,
      entityId,
      newValue: newValue as never,
    });
  }

  private async bustLists() {
    await Promise.all([
      this.cache.del('finance:banks:published'),
      this.cache.del('finance:loans:published'),
      this.cache.del('finance:cards:published'),
      this.cache.del('finance:insurance:published'),
      this.cache.del('finance:investments:published'),
      this.cache.del('finance:rates:published'),
      this.cache.del('finance:categories'),
      this.cache.del('finance:dashboard'),
    ]);
  }

  // --- Categories ---
  async listCategories() {
    const cached = await this.cache.get('finance:categories');
    if (cached) return cached;
    const rows = await this.repos.financeCategories.list();
    await this.cache.set('finance:categories', rows, LIST_CACHE_TTL_MS);
    return rows;
  }

  async createCategory(input: CreateFinanceCategoryInput, actorId: string) {
    const existing = await this.repos.financeCategories.findBySlug(input.slug);
    if (existing) throw new ConflictException({ success: false, error: { code: 'CONFLICT', message: 'Slug already exists.' } });
    const row = await this.repos.financeCategories.create({
      name: input.name,
      slug: input.slug,
      description: input.description,
      sortOrder: input.sortOrder ?? 0,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await this.audit(actorId, 'finance.category.create', 'finance_category', row.id, row);
    await this.bustLists();
    return row;
  }

  async updateCategory(id: string, input: UpdateFinanceCategoryInput, actorId: string) {
    const existing = await this.repos.financeCategories.findById(id);
    if (!existing) throw this.notFound('Category not found.');
    if (input.slug && input.slug !== existing.slug) {
      const clash = await this.repos.financeCategories.findBySlug(input.slug);
      if (clash) throw new ConflictException({ success: false, error: { code: 'CONFLICT', message: 'Slug already exists.' } });
    }
    const row = await this.repos.financeCategories.update(id, { ...input, updatedBy: actorId });
    await this.audit(actorId, 'finance.category.update', 'finance_category', id, row);
    await this.bustLists();
    return row;
  }

  async deleteCategory(id: string, actorId: string) {
    const ok = await this.repos.financeCategories.softDelete(id);
    if (!ok) throw this.notFound('Category not found.');
    await this.audit(actorId, 'finance.category.delete', 'finance_category', id);
    await this.bustLists();
    return { id, deleted: true };
  }

  // --- Banks ---
  listBanks(query: FinanceListQuery) {
    return this.repos.banks.list(query);
  }

  async getBank(id: string) {
    const row = await this.repos.banks.findById(id);
    if (!row) throw this.notFound('Bank not found.');
    return row;
  }

  async createBank(input: CreateBankInput, actorId: string) {
    const existing = await this.repos.banks.findBySlug(input.slug);
    if (existing) throw new ConflictException({ success: false, error: { code: 'CONFLICT', message: 'Slug already exists.' } });
    const row = await this.repos.banks.create({
      name: input.name,
      slug: input.slug,
      logoUrl: this.emptyUrl(input.logoUrl),
      logoMediaId: input.logoMediaId,
      website: this.emptyUrl(input.website),
      description: input.description,
      status: input.status ?? 'DRAFT',
      featured: input.featured ?? false,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await this.audit(actorId, 'finance.bank.create', 'bank', row.id, row);
    await this.bustLists();
    return row;
  }

  async updateBank(id: string, input: UpdateBankInput, actorId: string) {
    const existing = await this.repos.banks.findById(id);
    if (!existing) throw this.notFound('Bank not found.');
    if (input.slug && input.slug !== existing.slug) {
      const clash = await this.repos.banks.findBySlug(input.slug);
      if (clash) throw new ConflictException({ success: false, error: { code: 'CONFLICT', message: 'Slug already exists.' } });
    }
    const row = await this.repos.banks.update(id, {
      ...(input.name != null ? { name: input.name } : {}),
      ...(input.slug != null ? { slug: input.slug } : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: this.emptyUrl(input.logoUrl) } : {}),
      ...(input.logoMediaId !== undefined ? { logoMediaId: input.logoMediaId } : {}),
      ...(input.website !== undefined ? { website: this.emptyUrl(input.website) } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.status != null ? { status: input.status } : {}),
      ...(input.featured != null ? { featured: input.featured } : {}),
      ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
      ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
      updatedBy: actorId,
    });
    await this.audit(actorId, 'finance.bank.update', 'bank', id, row);
    await this.bustLists();
    return row;
  }

  async deleteBank(id: string, actorId: string) {
    const ok = await this.repos.banks.softDelete(id, actorId);
    if (!ok) throw this.notFound('Bank not found.');
    await this.audit(actorId, 'finance.bank.delete', 'bank', id);
    await this.bustLists();
    return { id, deleted: true };
  }

  async publishBank(id: string, actorId: string) {
    return this.updateBank(id, { status: 'PUBLISHED' }, actorId);
  }

  // --- Loans ---
  listLoans(query: FinanceListQuery) {
    return this.repos.loans.list(query);
  }

  async getLoan(id: string) {
    const row = await this.repos.loans.findById(id);
    if (!row) throw this.notFound('Loan not found.');
    return row;
  }

  async createLoan(input: CreateLoanInput, actorId: string) {
    const bank = await this.repos.banks.findById(input.bankId);
    if (!bank) throw this.notFound('Bank not found.');
    const row = await this.repos.loans.create({
      bank: { connect: { id: input.bankId } },
      ...(input.categoryId ? { category: { connect: { id: input.categoryId } } } : {}),
      name: input.name,
      slug: input.slug,
      loanType: input.loanType,
      description: input.description,
      interestRate: input.interestRate,
      processingFee: input.processingFee,
      tenureMin: input.tenureMin,
      tenureMax: input.tenureMax,
      maxAmount: input.maxAmount,
      eligibility: input.eligibility,
      affiliateUrl: this.emptyUrl(input.affiliateUrl),
      pros: input.pros,
      cons: input.cons,
      featured: input.featured ?? false,
      status: input.status ?? 'DRAFT',
      metadata: input.metadata as never,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await this.audit(actorId, 'finance.loan.create', 'loan', row.id, row);
    await this.bustLists();
    return row;
  }

  async updateLoan(id: string, input: UpdateLoanInput, actorId: string) {
    const existing = await this.repos.loans.findById(id);
    if (!existing) throw this.notFound('Loan not found.');
    const row = await this.repos.loans.update(id, {
      ...(input.bankId ? { bank: { connect: { id: input.bankId } } } : {}),
      ...(input.categoryId !== undefined
        ? input.categoryId
          ? { category: { connect: { id: input.categoryId } } }
          : { category: { disconnect: true } }
        : {}),
      ...(input.name != null ? { name: input.name } : {}),
      ...(input.slug != null ? { slug: input.slug } : {}),
      ...(input.loanType != null ? { loanType: input.loanType } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.interestRate !== undefined ? { interestRate: input.interestRate } : {}),
      ...(input.processingFee !== undefined ? { processingFee: input.processingFee } : {}),
      ...(input.tenureMin !== undefined ? { tenureMin: input.tenureMin } : {}),
      ...(input.tenureMax !== undefined ? { tenureMax: input.tenureMax } : {}),
      ...(input.maxAmount !== undefined ? { maxAmount: input.maxAmount } : {}),
      ...(input.eligibility !== undefined ? { eligibility: input.eligibility } : {}),
      ...(input.affiliateUrl !== undefined ? { affiliateUrl: this.emptyUrl(input.affiliateUrl) } : {}),
      ...(input.pros !== undefined ? { pros: input.pros } : {}),
      ...(input.cons !== undefined ? { cons: input.cons } : {}),
      ...(input.featured != null ? { featured: input.featured } : {}),
      ...(input.status != null
        ? {
            status: input.status,
            publishedAt: input.status === 'PUBLISHED' ? existing.publishedAt ?? new Date() : existing.publishedAt,
          }
        : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata as never } : {}),
      ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
      ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
      updatedBy: actorId,
    });
    await this.audit(actorId, 'finance.loan.update', 'loan', id, row);
    await this.bustLists();
    return row;
  }

  async deleteLoan(id: string, actorId: string) {
    const ok = await this.repos.loans.softDelete(id, actorId);
    if (!ok) throw this.notFound('Loan not found.');
    await this.audit(actorId, 'finance.loan.delete', 'loan', id);
    await this.bustLists();
    return { id, deleted: true };
  }

  async publishLoan(id: string, actorId: string) {
    return this.updateLoan(id, { status: 'PUBLISHED' }, actorId);
  }

  // --- Credit cards ---
  listCreditCards(query: FinanceListQuery) {
    return this.repos.creditCards.list(query);
  }

  async getCreditCard(id: string) {
    const row = await this.repos.creditCards.findById(id);
    if (!row) throw this.notFound('Credit card not found.');
    return row;
  }

  async createCreditCard(input: CreateCreditCardInput, actorId: string) {
    const bank = await this.repos.banks.findById(input.bankId);
    if (!bank) throw this.notFound('Bank not found.');
    const row = await this.repos.creditCards.create({
      bank: { connect: { id: input.bankId } },
      ...(input.categoryId ? { category: { connect: { id: input.categoryId } } } : {}),
      name: input.name,
      slug: input.slug,
      description: input.description,
      annualFee: input.annualFee,
      joiningFee: input.joiningFee,
      rewards: input.rewards,
      cashback: input.cashback,
      loungeAccess: input.loungeAccess ?? false,
      affiliateUrl: this.emptyUrl(input.affiliateUrl),
      pros: input.pros,
      cons: input.cons,
      featured: input.featured ?? false,
      status: input.status ?? 'DRAFT',
      metadata: input.metadata as never,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await this.audit(actorId, 'finance.credit_card.create', 'credit_card', row.id, row);
    await this.bustLists();
    return row;
  }

  async updateCreditCard(id: string, input: UpdateCreditCardInput, actorId: string) {
    const existing = await this.repos.creditCards.findById(id);
    if (!existing) throw this.notFound('Credit card not found.');
    const row = await this.repos.creditCards.update(id, {
      ...(input.bankId ? { bank: { connect: { id: input.bankId } } } : {}),
      ...(input.categoryId !== undefined
        ? input.categoryId
          ? { category: { connect: { id: input.categoryId } } }
          : { category: { disconnect: true } }
        : {}),
      ...(input.name != null ? { name: input.name } : {}),
      ...(input.slug != null ? { slug: input.slug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.annualFee !== undefined ? { annualFee: input.annualFee } : {}),
      ...(input.joiningFee !== undefined ? { joiningFee: input.joiningFee } : {}),
      ...(input.rewards !== undefined ? { rewards: input.rewards } : {}),
      ...(input.cashback !== undefined ? { cashback: input.cashback } : {}),
      ...(input.loungeAccess != null ? { loungeAccess: input.loungeAccess } : {}),
      ...(input.affiliateUrl !== undefined ? { affiliateUrl: this.emptyUrl(input.affiliateUrl) } : {}),
      ...(input.pros !== undefined ? { pros: input.pros } : {}),
      ...(input.cons !== undefined ? { cons: input.cons } : {}),
      ...(input.featured != null ? { featured: input.featured } : {}),
      ...(input.status != null
        ? {
            status: input.status,
            publishedAt: input.status === 'PUBLISHED' ? existing.publishedAt ?? new Date() : existing.publishedAt,
          }
        : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata as never } : {}),
      ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
      ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
      updatedBy: actorId,
    });
    await this.audit(actorId, 'finance.credit_card.update', 'credit_card', id, row);
    await this.bustLists();
    return row;
  }

  async deleteCreditCard(id: string, actorId: string) {
    const ok = await this.repos.creditCards.softDelete(id, actorId);
    if (!ok) throw this.notFound('Credit card not found.');
    await this.audit(actorId, 'finance.credit_card.delete', 'credit_card', id);
    await this.bustLists();
    return { id, deleted: true };
  }

  async publishCreditCard(id: string, actorId: string) {
    return this.updateCreditCard(id, { status: 'PUBLISHED' }, actorId);
  }

  // --- Insurance ---
  listInsurance(query: FinanceListQuery) {
    return this.repos.insuranceProducts.list(query);
  }

  async getInsurance(id: string) {
    const row = await this.repos.insuranceProducts.findById(id);
    if (!row) throw this.notFound('Insurance product not found.');
    return row;
  }

  async createInsurance(input: CreateInsuranceInput, actorId: string) {
    const clash = await this.repos.insuranceProducts.findBySlug(input.slug);
    if (clash) throw new ConflictException({ success: false, error: { code: 'CONFLICT', message: 'Slug already exists.' } });
    const row = await this.repos.insuranceProducts.create({
      ...(input.categoryId ? { category: { connect: { id: input.categoryId } } } : {}),
      providerName: input.providerName,
      name: input.name,
      slug: input.slug,
      coverage: input.coverage,
      premium: input.premium,
      benefits: input.benefits,
      affiliateUrl: this.emptyUrl(input.affiliateUrl),
      featured: input.featured ?? false,
      status: input.status ?? 'DRAFT',
      metadata: input.metadata as never,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await this.audit(actorId, 'finance.insurance.create', 'insurance_product', row.id, row);
    await this.bustLists();
    return row;
  }

  async updateInsurance(id: string, input: UpdateInsuranceInput, actorId: string) {
    const existing = await this.repos.insuranceProducts.findById(id);
    if (!existing) throw this.notFound('Insurance product not found.');
    if (input.slug && input.slug !== existing.slug) {
      const clash = await this.repos.insuranceProducts.findBySlug(input.slug);
      if (clash) throw new ConflictException({ success: false, error: { code: 'CONFLICT', message: 'Slug already exists.' } });
    }
    const row = await this.repos.insuranceProducts.update(id, {
      ...(input.categoryId !== undefined
        ? input.categoryId
          ? { category: { connect: { id: input.categoryId } } }
          : { category: { disconnect: true } }
        : {}),
      ...(input.providerName != null ? { providerName: input.providerName } : {}),
      ...(input.name != null ? { name: input.name } : {}),
      ...(input.slug != null ? { slug: input.slug } : {}),
      ...(input.coverage !== undefined ? { coverage: input.coverage } : {}),
      ...(input.premium !== undefined ? { premium: input.premium } : {}),
      ...(input.benefits !== undefined ? { benefits: input.benefits } : {}),
      ...(input.affiliateUrl !== undefined ? { affiliateUrl: this.emptyUrl(input.affiliateUrl) } : {}),
      ...(input.featured != null ? { featured: input.featured } : {}),
      ...(input.status != null
        ? {
            status: input.status,
            publishedAt: input.status === 'PUBLISHED' ? existing.publishedAt ?? new Date() : existing.publishedAt,
          }
        : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata as never } : {}),
      ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
      ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
      updatedBy: actorId,
    });
    await this.audit(actorId, 'finance.insurance.update', 'insurance_product', id, row);
    await this.bustLists();
    return row;
  }

  async deleteInsurance(id: string, actorId: string) {
    const ok = await this.repos.insuranceProducts.softDelete(id, actorId);
    if (!ok) throw this.notFound('Insurance product not found.');
    await this.audit(actorId, 'finance.insurance.delete', 'insurance_product', id);
    await this.bustLists();
    return { id, deleted: true };
  }

  async publishInsurance(id: string, actorId: string) {
    return this.updateInsurance(id, { status: 'PUBLISHED' }, actorId);
  }

  // --- Investments ---
  listInvestments(query: FinanceListQuery) {
    return this.repos.investmentProducts.list(query);
  }

  async getInvestment(id: string) {
    const row = await this.repos.investmentProducts.findById(id);
    if (!row) throw this.notFound('Investment product not found.');
    return row;
  }

  async createInvestment(input: CreateInvestmentInput, actorId: string) {
    const clash = await this.repos.investmentProducts.findBySlug(input.slug);
    if (clash) throw new ConflictException({ success: false, error: { code: 'CONFLICT', message: 'Slug already exists.' } });
    const row = await this.repos.investmentProducts.create({
      ...(input.categoryId ? { category: { connect: { id: input.categoryId } } } : {}),
      providerName: input.providerName,
      name: input.name,
      slug: input.slug,
      riskLevel: input.riskLevel,
      expectedReturn: input.expectedReturn,
      lockInPeriod: input.lockInPeriod,
      affiliateUrl: this.emptyUrl(input.affiliateUrl),
      featured: input.featured ?? false,
      status: input.status ?? 'DRAFT',
      metadata: input.metadata as never,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await this.audit(actorId, 'finance.investment.create', 'investment_product', row.id, row);
    await this.bustLists();
    return row;
  }

  async updateInvestment(id: string, input: UpdateInvestmentInput, actorId: string) {
    const existing = await this.repos.investmentProducts.findById(id);
    if (!existing) throw this.notFound('Investment product not found.');
    if (input.slug && input.slug !== existing.slug) {
      const clash = await this.repos.investmentProducts.findBySlug(input.slug);
      if (clash) throw new ConflictException({ success: false, error: { code: 'CONFLICT', message: 'Slug already exists.' } });
    }
    const row = await this.repos.investmentProducts.update(id, {
      ...(input.categoryId !== undefined
        ? input.categoryId
          ? { category: { connect: { id: input.categoryId } } }
          : { category: { disconnect: true } }
        : {}),
      ...(input.providerName != null ? { providerName: input.providerName } : {}),
      ...(input.name != null ? { name: input.name } : {}),
      ...(input.slug != null ? { slug: input.slug } : {}),
      ...(input.riskLevel !== undefined ? { riskLevel: input.riskLevel } : {}),
      ...(input.expectedReturn !== undefined ? { expectedReturn: input.expectedReturn } : {}),
      ...(input.lockInPeriod !== undefined ? { lockInPeriod: input.lockInPeriod } : {}),
      ...(input.affiliateUrl !== undefined ? { affiliateUrl: this.emptyUrl(input.affiliateUrl) } : {}),
      ...(input.featured != null ? { featured: input.featured } : {}),
      ...(input.status != null
        ? {
            status: input.status,
            publishedAt: input.status === 'PUBLISHED' ? existing.publishedAt ?? new Date() : existing.publishedAt,
          }
        : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata as never } : {}),
      ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
      ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
      updatedBy: actorId,
    });
    await this.audit(actorId, 'finance.investment.update', 'investment_product', id, row);
    await this.bustLists();
    return row;
  }

  async deleteInvestment(id: string, actorId: string) {
    const ok = await this.repos.investmentProducts.softDelete(id, actorId);
    if (!ok) throw this.notFound('Investment product not found.');
    await this.audit(actorId, 'finance.investment.delete', 'investment_product', id);
    await this.bustLists();
    return { id, deleted: true };
  }

  async publishInvestment(id: string, actorId: string) {
    return this.updateInvestment(id, { status: 'PUBLISHED' }, actorId);
  }

  // --- Rates ---
  listRates(query: FinanceListQuery) {
    return this.repos.interestRates.list(query);
  }

  async createRate(input: CreateInterestRateInput, actorId: string) {
    if (!input.loanId && !input.bankId && !input.productType) {
      throw new BadRequestException({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Provide loanId, bankId, or productType.' },
      });
    }
    const row = await this.repos.interestRates.create({
      ...(input.loanId ? { loan: { connect: { id: input.loanId } } } : {}),
      ...(input.bankId ? { bank: { connect: { id: input.bankId } } } : {}),
      productType: input.productType,
      providerId: input.providerId,
      rate: input.rate,
      minTenure: input.minTenure,
      maxTenure: input.maxTenure,
      source: input.source,
      effectiveFrom: input.effectiveFrom,
      effectiveTo: input.effectiveTo,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await this.audit(actorId, 'finance.rate.create', 'interest_rate', row.id, row);
    await this.bustLists();
    return row;
  }

  async updateRate(id: string, input: UpdateInterestRateInput, actorId: string) {
    const existing = await this.repos.interestRates.findById(id);
    if (!existing) throw this.notFound('Interest rate not found.');
    const row = await this.repos.interestRates.update(id, {
      ...(input.loanId !== undefined
        ? input.loanId
          ? { loan: { connect: { id: input.loanId } } }
          : { loan: { disconnect: true } }
        : {}),
      ...(input.bankId !== undefined
        ? input.bankId
          ? { bank: { connect: { id: input.bankId } } }
          : { bank: { disconnect: true } }
        : {}),
      ...(input.productType !== undefined ? { productType: input.productType } : {}),
      ...(input.providerId !== undefined ? { providerId: input.providerId } : {}),
      ...(input.rate != null ? { rate: input.rate } : {}),
      ...(input.minTenure !== undefined ? { minTenure: input.minTenure } : {}),
      ...(input.maxTenure !== undefined ? { maxTenure: input.maxTenure } : {}),
      ...(input.source !== undefined ? { source: input.source } : {}),
      ...(input.effectiveFrom != null ? { effectiveFrom: input.effectiveFrom } : {}),
      ...(input.effectiveTo !== undefined ? { effectiveTo: input.effectiveTo } : {}),
      updatedBy: actorId,
    });
    await this.audit(actorId, 'finance.rate.update', 'interest_rate', id, row);
    await this.bustLists();
    return row;
  }

  async deleteRate(id: string, actorId: string) {
    const ok = await this.repos.interestRates.softDelete(id, actorId);
    if (!ok) throw this.notFound('Interest rate not found.');
    await this.audit(actorId, 'finance.rate.delete', 'interest_rate', id);
    await this.bustLists();
    return { id, deleted: true };
  }

  // --- Compare + dashboard ---
  async compare(query: FinanceCompareQuery) {
    const { type, ids } = query;
    if (type === 'loans') return this.repos.loans.findManyByIds(ids);
    if (type === 'credit-cards') return this.repos.creditCards.findManyByIds(ids);
    if (type === 'insurance') return this.repos.insuranceProducts.findManyByIds(ids);
    return this.repos.investmentProducts.findManyByIds(ids);
  }

  async dashboard() {
    const cached = await this.cache.get('finance:dashboard');
    if (cached) return cached;
    const counts = await this.repos.banks.dashboardCounts();
    const data = {
      ...counts,
      relatedCalculators: [
        { slug: 'loan', name: 'Loan Calculator' },
        { slug: 'emi', name: 'EMI Calculator' },
        { slug: 'sip', name: 'SIP Calculator' },
        { slug: 'income-tax', name: 'Income Tax Calculator' },
        { slug: 'gst', name: 'GST Calculator' },
        { slug: 'retirement', name: 'Retirement Calculator' },
      ],
    };
    await this.cache.set('finance:dashboard', data, LIST_CACHE_TTL_MS);
    return data;
  }
}
