import type { Prisma, PrismaClient, PublishStatus } from '@prisma/client';
import { BaseRepository, listActiveWithCursor, softDeleteById } from '../base.repository';
import type { CursorPageParams } from '../../pagination';

type ListParams = CursorPageParams & {
  status?: PublishStatus;
  search?: string;
  excludeMockSources?: boolean;
  bankId?: string;
  categoryId?: string;
  categorySlug?: string;
  loanType?: string;
  productType?: string;
  featured?: boolean;
  excludeOwnBrand?: boolean;
  sponsored?: boolean;
  needsRateReview?: boolean;
  rateMin?: number;
  rateMax?: number;
  amountMin?: number;
  amountMax?: number;
  tenureMin?: number;
  tenureMax?: number;
  processingFeeMax?: number;
  creditScoreMaxRequired?: number;
  employmentType?: string;
  vehicleCondition?: string;
  financingPercentMin?: number;
  sort?:
    | 'recommended'
    | 'lowest_interest'
    | 'highest_amount'
    | 'lowest_processing_fee'
    | 'longest_tenure';
  loanHubEnabled?: boolean;
};

export class FinanceCategoryRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.financeCategory.findFirst({ where: { id, deletedAt: null } });
  }

  findBySlug(slug: string) {
    return this.db.financeCategory.findFirst({ where: { slug, deletedAt: null } });
  }

  list() {
    return this.db.financeCategory.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  listLoanHub(params: { status?: PublishStatus } = {}) {
    return this.db.financeCategory.findMany({
      where: {
        deletedAt: null,
        loanHubEnabled: true,
        ...(params.status ? { status: params.status } : { status: 'PUBLISHED' }),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  create(data: Prisma.FinanceCategoryCreateInput) {
    return this.db.financeCategory.create({ data });
  }

  update(id: string, data: Prisma.FinanceCategoryUpdateInput) {
    return this.db.financeCategory.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return softDeleteById(this.db.financeCategory, id);
  }
}

export class BankRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.bank.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { loans: true, creditCards: true } },
      },
    });
  }

  findBySlug(slug: string) {
    return this.db.bank.findFirst({ where: { slug, deletedAt: null } });
  }

  list(params: ListParams = {}) {
    return listActiveWithCursor(this.db.bank, {
      ...params,
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.featured != null ? { featured: params.featured } : {}),
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { slug: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { _count: { select: { loans: true, creditCards: true } } },
    });
  }

  create(data: Prisma.BankCreateInput) {
    return this.db.bank.create({ data });
  }

  update(id: string, data: Prisma.BankUpdateInput) {
    return this.db.bank.update({ where: { id }, data });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.bank, id, actorId);
  }

  async dashboardCounts() {
    const [
      categories,
      banksPublished,
      loansPublished,
      creditCardsPublished,
      insurancePublished,
      investmentsPublished,
      ratesTracked,
    ] = await Promise.all([
      this.db.financeCategory.count({ where: { deletedAt: null } }),
      this.db.bank.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.db.loan.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.db.creditCard.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.db.insuranceProduct.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.db.investmentProduct.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      this.db.interestRate.count({ where: { deletedAt: null } }),
    ]);
    return {
      categories,
      banksPublished,
      loansPublished,
      creditCardsPublished,
      insurancePublished,
      investmentsPublished,
      ratesTracked,
    };
  }
}

export class LoanRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  private include = {
    bank: true,
    category: true,
    rates: {
      where: { deletedAt: null },
      orderBy: { effectiveFrom: 'desc' as const },
      take: 5,
    },
  } satisfies Prisma.LoanInclude;

  findById(id: string) {
    return this.db.loan.findFirst({
      where: { id, deletedAt: null },
      include: this.include,
    });
  }

  findBySlug(bankSlug: string, slug: string) {
    return this.db.loan.findFirst({
      where: { slug, deletedAt: null, bank: { slug: bankSlug, deletedAt: null } },
      include: this.include,
    });
  }

  findByCategoryAndProductSlug(categorySlug: string, productSlug: string) {
    return this.db.loan.findFirst({
      where: {
        slug: productSlug,
        deletedAt: null,
        status: 'PUBLISHED',
        category: { slug: categorySlug, deletedAt: null },
      },
      include: this.include,
    });
  }

  findByCategoryAndLenderSlug(categorySlug: string, lenderSlug: string) {
    return this.db.loan.findFirst({
      where: {
        deletedAt: null,
        status: 'PUBLISHED',
        category: { slug: categorySlug, deletedAt: null },
        bank: { slug: lenderSlug, deletedAt: null },
      },
      orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
      include: this.include,
    });
  }

  list(params: ListParams = {}) {
    const sort = params.sort ?? 'recommended';
    const orderBy: Prisma.LoanOrderByWithRelationInput[] =
      sort === 'lowest_interest'
        ? [{ interestRateMin: 'asc' }, { interestRate: 'asc' }, { featured: 'desc' }]
        : sort === 'highest_amount'
          ? [{ loanAmountMax: 'desc' }, { maxAmount: 'desc' }, { featured: 'desc' }]
          : sort === 'lowest_processing_fee'
            ? [{ processingFeeMin: 'asc' }, { processingFee: 'asc' }, { featured: 'desc' }]
            : sort === 'longest_tenure'
              ? [{ tenureMax: 'desc' }, { featured: 'desc' }]
              : [{ featured: 'desc' }, { sponsored: 'desc' }, { updatedAt: 'desc' }];

    const and: Prisma.LoanWhereInput[] = [];

    if (params.status) and.push({ status: params.status });
    if (params.bankId) and.push({ bankId: params.bankId });
    if (params.categoryId) and.push({ categoryId: params.categoryId });
    if (params.categorySlug) {
      and.push({ category: { slug: params.categorySlug, deletedAt: null } });
    }
    if (params.loanType) and.push({ loanType: params.loanType });
    if (params.featured != null) and.push({ featured: params.featured });
    if (params.sponsored != null) and.push({ sponsored: params.sponsored });
    if (params.needsRateReview != null) and.push({ needsRateReview: params.needsRateReview });

    if (params.rateMax != null) {
      and.push({
        OR: [
          { interestRateMin: { lte: params.rateMax } },
          { interestRate: { lte: params.rateMax } },
        ],
      });
    }
    if (params.rateMin != null) {
      and.push({
        OR: [
          { interestRateMax: { gte: params.rateMin } },
          { interestRate: { gte: params.rateMin } },
        ],
      });
    }
    if (params.amountMin != null) {
      and.push({
        OR: [
          { loanAmountMax: { gte: params.amountMin } },
          { maxAmount: { gte: params.amountMin } },
        ],
      });
    }
    if (params.amountMax != null) {
      and.push({
        OR: [{ loanAmountMin: { lte: params.amountMax } }, { loanAmountMin: null }],
      });
    }
    if (params.tenureMin != null) and.push({ tenureMax: { gte: params.tenureMin } });
    if (params.tenureMax != null) {
      and.push({
        OR: [{ tenureMin: { lte: params.tenureMax } }, { tenureMin: null }],
      });
    }
    if (params.processingFeeMax != null) {
      and.push({
        OR: [
          { processingFeeMin: { lte: params.processingFeeMax } },
          { processingFee: { lte: params.processingFeeMax } },
          { processingFeeMin: null, processingFee: null },
        ],
      });
    }
    if (params.creditScoreMaxRequired != null) {
      and.push({
        OR: [
          { minimumCreditScore: { lte: params.creditScoreMaxRequired } },
          { minimumCreditScore: null },
        ],
      });
    }
    if (params.employmentType) {
      and.push({
        employmentTypes: { array_contains: [params.employmentType] },
      });
    }
    if (params.vehicleCondition === 'new' || params.vehicleCondition === 'used') {
      and.push({
        OR: [
          {
            metadata: {
              path: ['vehicleCondition'],
              equals: params.vehicleCondition,
            },
          },
          {
            metadata: {
              path: ['vehicleCondition'],
              equals: 'both',
            },
          },
        ],
      });
    }
    if (params.financingPercentMin != null) {
      and.push({
        OR: [
          {
            metadata: {
              path: ['financingPercentageMax'],
              gte: params.financingPercentMin,
            },
          },
          {
            metadata: {
              path: ['financingPercentageMin'],
              gte: params.financingPercentMin,
            },
          },
        ],
      });
    }
    if (params.search) {
      and.push({
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { slug: { contains: params.search, mode: 'insensitive' } },
          { loanType: { contains: params.search, mode: 'insensitive' } },
        ],
      });
    }

    return listActiveWithCursor(this.db.loan, {
      ...params,
      orderBy,
      where: and.length ? { AND: and } : {},
      include: { bank: true, category: true },
    });
  }

  create(data: Prisma.LoanCreateInput) {
    return this.db.loan.create({ data, include: this.include });
  }

  update(id: string, data: Prisma.LoanUpdateInput) {
    return this.db.loan.update({ where: { id }, data, include: this.include });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.loan, id, actorId);
  }

  findManyByIds(ids: string[]) {
    return this.db.loan.findMany({
      where: { id: { in: ids }, deletedAt: null, status: 'PUBLISHED' },
      include: this.include,
    });
  }
}

export class CreditCardRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  private include = { bank: true, category: true } satisfies Prisma.CreditCardInclude;

  findById(id: string) {
    return this.db.creditCard.findFirst({
      where: { id, deletedAt: null },
      include: this.include,
    });
  }

  findBySlug(slug: string) {
    return this.db.creditCard.findFirst({
      where: { slug, deletedAt: null },
      include: this.include,
    });
  }

  list(params: ListParams = {}) {
    return listActiveWithCursor(this.db.creditCard, {
      ...params,
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.bankId ? { bankId: params.bankId } : {}),
        ...(params.categoryId ? { categoryId: params.categoryId } : {}),
        ...(params.featured != null ? { featured: params.featured } : {}),
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { slug: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: this.include,
    });
  }

  create(data: Prisma.CreditCardCreateInput) {
    return this.db.creditCard.create({ data, include: this.include });
  }

  update(id: string, data: Prisma.CreditCardUpdateInput) {
    return this.db.creditCard.update({ where: { id }, data, include: this.include });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.creditCard, id, actorId);
  }

  findManyByIds(ids: string[]) {
    return this.db.creditCard.findMany({
      where: { id: { in: ids }, deletedAt: null, status: 'PUBLISHED' },
      include: this.include,
    });
  }
}

export class InsuranceProductRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  private include = { category: true } satisfies Prisma.InsuranceProductInclude;

  findById(id: string) {
    return this.db.insuranceProduct.findFirst({
      where: { id, deletedAt: null },
      include: this.include,
    });
  }

  findBySlug(slug: string) {
    return this.db.insuranceProduct.findFirst({
      where: { slug, deletedAt: null },
      include: this.include,
    });
  }

  list(params: ListParams = {}) {
    return listActiveWithCursor(this.db.insuranceProduct, {
      ...params,
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.categoryId ? { categoryId: params.categoryId } : {}),
        ...(params.featured != null ? { featured: params.featured } : {}),
        ...(params.excludeOwnBrand
          ? {
              NOT: {
                OR: [
                  { providerName: { contains: 'Varnarc', mode: 'insensitive' } },
                  { name: { contains: 'Varnarc', mode: 'insensitive' } },
                ],
              },
            }
          : {}),
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { providerName: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: this.include,
    });
  }

  create(data: Prisma.InsuranceProductCreateInput) {
    return this.db.insuranceProduct.create({ data, include: this.include });
  }

  update(id: string, data: Prisma.InsuranceProductUpdateInput) {
    return this.db.insuranceProduct.update({ where: { id }, data, include: this.include });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.insuranceProduct, id, actorId);
  }

  findManyByIds(ids: string[]) {
    return this.db.insuranceProduct.findMany({
      where: { id: { in: ids }, deletedAt: null, status: 'PUBLISHED' },
      include: this.include,
    });
  }
}

export class InvestmentProductRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  private include = { category: true } satisfies Prisma.InvestmentProductInclude;

  findById(id: string) {
    return this.db.investmentProduct.findFirst({
      where: { id, deletedAt: null },
      include: this.include,
    });
  }

  findBySlug(slug: string) {
    return this.db.investmentProduct.findFirst({
      where: { slug, deletedAt: null },
      include: this.include,
    });
  }

  list(params: ListParams = {}) {
    return listActiveWithCursor(this.db.investmentProduct, {
      ...params,
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.categoryId ? { categoryId: params.categoryId } : {}),
        ...(params.featured != null ? { featured: params.featured } : {}),
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { providerName: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: this.include,
    });
  }

  create(data: Prisma.InvestmentProductCreateInput) {
    return this.db.investmentProduct.create({ data, include: this.include });
  }

  update(id: string, data: Prisma.InvestmentProductUpdateInput) {
    return this.db.investmentProduct.update({ where: { id }, data, include: this.include });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.investmentProduct, id, actorId);
  }

  findManyByIds(ids: string[]) {
    return this.db.investmentProduct.findMany({
      where: { id: { in: ids }, deletedAt: null, status: 'PUBLISHED' },
      include: this.include,
    });
  }
}

export class InterestRateRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  private include = { loan: true, bank: true } satisfies Prisma.InterestRateInclude;

  findById(id: string) {
    return this.db.interestRate.findFirst({
      where: { id, deletedAt: null },
      include: this.include,
    });
  }

  list(params: ListParams = {}) {
    return listActiveWithCursor(this.db.interestRate, {
      ...params,
      where: {
        ...(params.excludeMockSources
          ? {
              OR: [
                { source: null },
                {
                  AND: [
                    { NOT: { source: { equals: 'mock', mode: 'insensitive' } } },
                    { NOT: { source: { startsWith: 'feed:mock', mode: 'insensitive' } } },
                  ],
                },
              ],
            }
          : {}),
        ...(params.bankId ? { bankId: params.bankId } : {}),
        ...(params.productType ? { productType: params.productType } : {}),
        ...(params.search
          ? {
              OR: [
                { productType: { contains: params.search, mode: 'insensitive' } },
                { source: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: this.include,
    });
  }

  create(data: Prisma.InterestRateCreateInput) {
    return this.db.interestRate.create({ data, include: this.include });
  }

  update(id: string, data: Prisma.InterestRateUpdateInput) {
    return this.db.interestRate.update({ where: { id }, data, include: this.include });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.interestRate, id, actorId);
  }
}

export class FinanceGuideRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.financeGuide.findFirst({
      where: { id, deletedAt: null },
      include: { category: true },
    });
  }

  findBySlug(slug: string) {
    return this.db.financeGuide.findFirst({
      where: { slug, deletedAt: null, status: 'PUBLISHED' },
      include: { category: true },
    });
  }
}

export class LoanRateHistoryRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  listByLoan(loanId: string) {
    return this.db.loanRateHistory.findMany({
      where: { loanId, deletedAt: null },
      orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  create(data: Prisma.LoanRateHistoryCreateInput) {
    return this.db.loanRateHistory.create({ data });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.loanRateHistory, id, actorId);
  }
}

export class ContentSourceRepository extends BaseRepository {
  constructor(db: PrismaClient) {
    super(db);
  }

  findById(id: string) {
    return this.db.contentSource.findFirst({ where: { id, deletedAt: null } });
  }

  list(params: ListParams = {}) {
    return listActiveWithCursor(this.db.contentSource, {
      ...params,
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { sourceUrl: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
    });
  }

  listForEntity(entityType: string, entityId: string) {
    return this.db.contentSource.findMany({
      where: { entityType, entityId, deletedAt: null, status: 'PUBLISHED' },
      orderBy: [{ verifiedAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  create(data: Prisma.ContentSourceCreateInput) {
    return this.db.contentSource.create({ data });
  }

  update(id: string, data: Prisma.ContentSourceUpdateInput) {
    return this.db.contentSource.update({ where: { id }, data });
  }

  softDelete(id: string, actorId?: string | null) {
    return softDeleteById(this.db.contentSource, id, actorId);
  }
}
