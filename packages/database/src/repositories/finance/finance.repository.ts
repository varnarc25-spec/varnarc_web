import type { Prisma, PrismaClient, PublishStatus } from '@prisma/client';
import {
  BaseRepository,
  listActiveWithCursor,
  softDeleteById,
} from '../base.repository';
import type { CursorPageParams } from '../../pagination';

type ListParams = CursorPageParams & {
  status?: PublishStatus;
  search?: string;
  bankId?: string;
  categoryId?: string;
  loanType?: string;
  productType?: string;
  featured?: boolean;
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

  list(params: ListParams = {}) {
    return listActiveWithCursor(this.db.loan, {
      ...params,
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.bankId ? { bankId: params.bankId } : {}),
        ...(params.categoryId ? { categoryId: params.categoryId } : {}),
        ...(params.loanType ? { loanType: params.loanType } : {}),
        ...(params.featured != null ? { featured: params.featured } : {}),
        ...(params.search
          ? {
              OR: [
                { name: { contains: params.search, mode: 'insensitive' } },
                { slug: { contains: params.search, mode: 'insensitive' } },
                { loanType: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
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
