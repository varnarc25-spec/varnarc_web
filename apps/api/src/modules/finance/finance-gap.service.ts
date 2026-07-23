import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { PrismaClient } from '@varnarc/database';
import { PRISMA } from '../../database/database.module';
import { fetchRemoteRates, ingestRemoteRate } from './finance-rate-sync';

function csvEscape(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0]!.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? '';
    });
    return row;
  });
}

@Injectable()
export class FinanceGapService {
  constructor(@Inject(PRISMA) private readonly db: PrismaClient) {}

  private notFound(message: string) {
    return new NotFoundException({ success: false, error: { code: 'NOT_FOUND', message } });
  }

  // --- Banks by slug ---
  async getBankBySlug(slug: string) {
    const bank = await this.db.bank.findFirst({
      where: { slug, deletedAt: null, status: 'PUBLISHED' },
      include: {
        loans: { where: { deletedAt: null, status: 'PUBLISHED' }, take: 20, orderBy: { name: 'asc' } },
        creditCards: { where: { deletedAt: null, status: 'PUBLISHED' }, take: 20, orderBy: { name: 'asc' } },
        _count: { select: { loans: true, creditCards: true } },
      },
    });
    if (!bank) throw this.notFound('Bank not found.');
    return bank;
  }

  // --- FAQs ---
  listFaqs(admin = false) {
    return this.db.financeFaq.findMany({
      where: { deletedAt: null, ...(admin ? {} : { status: 'PUBLISHED' }) },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: { category: true },
    });
  }

  createFaq(input: { question: string; answer: string; categoryId?: string | null; sortOrder?: number }, actorId: string) {
    return this.db.financeFaq.create({
      data: {
        question: input.question,
        answer: input.answer,
        categoryId: input.categoryId,
        sortOrder: input.sortOrder ?? 0,
        status: 'PUBLISHED',
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  // --- Glossary ---
  listGlossary(admin = false) {
    return this.db.financeGlossaryTerm.findMany({
      where: { deletedAt: null, ...(admin ? {} : { status: 'PUBLISHED' }) },
      orderBy: { term: 'asc' },
    });
  }

  createGlossary(
    input: { term: string; slug: string; definition: string },
    actorId: string,
  ) {
    return this.db.financeGlossaryTerm.create({
      data: {
        term: input.term,
        slug: input.slug,
        definition: input.definition,
        status: 'PUBLISHED',
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  // --- Guides ---
  listGuides(admin = false) {
    return this.db.financeGuide.findMany({
      where: { deletedAt: null, ...(admin ? {} : { status: 'PUBLISHED' }) },
      orderBy: { publishedAt: 'desc' },
      include: { category: true },
    });
  }

  async getGuideBySlug(slug: string) {
    const row = await this.db.financeGuide.findFirst({
      where: { slug, deletedAt: null, status: 'PUBLISHED' },
      include: { category: true },
    });
    if (!row) throw this.notFound('Guide not found.');
    return {
      ...row,
      content: row.body,
      category: row.category?.name ?? null,
    };
  }

  createGuide(
    input: {
      title: string;
      slug: string;
      summary?: string | null;
      body?: string | null;
      categoryId?: string | null;
      status?: 'DRAFT' | 'PUBLISHED';
    },
    actorId: string,
  ) {
    return this.db.financeGuide.create({
      data: {
        title: input.title,
        slug: input.slug,
        summary: input.summary,
        body: input.body,
        categoryId: input.categoryId,
        status: input.status ?? 'PUBLISHED',
        publishedAt: (input.status ?? 'PUBLISHED') === 'PUBLISHED' ? new Date() : null,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  // --- Reviews for finance entities ---
  async entityReviews(entity: string, id: string) {
    const map: Record<string, () => Promise<{ reviewProductId: string | null } | null>> = {
      loans: () => this.db.loan.findFirst({ where: { id, deletedAt: null }, select: { reviewProductId: true } }),
      'credit-cards': () =>
        this.db.creditCard.findFirst({ where: { id, deletedAt: null }, select: { reviewProductId: true } }),
      insurance: () =>
        this.db.insuranceProduct.findFirst({ where: { id, deletedAt: null }, select: { reviewProductId: true } }),
      investments: () =>
        this.db.investmentProduct.findFirst({ where: { id, deletedAt: null }, select: { reviewProductId: true } }),
    };
    const loader = map[entity];
    if (!loader) return [];
    const row = await loader();
    if (!row?.reviewProductId) {
      // Fallback: products with metadata matching entity id
      const products = await this.db.product.findMany({
        where: {
          deletedAt: null,
          OR: [
            { metadata: { path: ['financeEntityId'], equals: id } },
            { slug: { contains: id.slice(0, 8) } },
          ],
        },
        take: 5,
      });
      if (!products.length) return [];
      return this.db.review.findMany({
        where: {
          deletedAt: null,
          status: 'PUBLISHED',
          productId: { in: products.map((p) => p.id) },
        },
        orderBy: { publishedAt: 'desc' },
        take: 20,
      });
    }
    return this.db.review.findMany({
      where: { productId: row.reviewProductId, deletedAt: null, status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    });
  }

  // --- Affiliate ---
  async trackAffiliateClick(input: {
    entityType: string;
    entityId: string;
    affiliateUrl: string;
    userId?: string | null;
    sessionId?: string | null;
    referrer?: string | null;
  }) {
    return this.db.affiliateClick.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        affiliateUrl: input.affiliateUrl,
        userId: input.userId,
        sessionId: input.sessionId,
        referrer: input.referrer,
      },
    });
  }

  async affiliateStats() {
    const [clicks, loans, cards, insurance, investments] = await Promise.all([
      this.db.affiliateClick.groupBy({
        by: ['entityType'],
        _count: { _all: true },
      }),
      this.db.loan.findMany({
        where: { deletedAt: null, affiliateUrl: { not: null } },
        select: { id: true, name: true, affiliateUrl: true, status: true },
        take: 100,
      }),
      this.db.creditCard.findMany({
        where: { deletedAt: null, affiliateUrl: { not: null } },
        select: { id: true, name: true, affiliateUrl: true, status: true },
        take: 100,
      }),
      this.db.insuranceProduct.findMany({
        where: { deletedAt: null, affiliateUrl: { not: null } },
        select: { id: true, name: true, affiliateUrl: true, status: true },
        take: 100,
      }),
      this.db.investmentProduct.findMany({
        where: { deletedAt: null, affiliateUrl: { not: null } },
        select: { id: true, name: true, affiliateUrl: true, status: true },
        take: 100,
      }),
    ]);
    return {
      clickCounts: clicks.map((c) => ({ entityType: c.entityType, clicks: c._count._all })),
      products: [
        ...loans.map((r) => ({ ...r, entityType: 'loans' })),
        ...cards.map((r) => ({ ...r, entityType: 'credit-cards' })),
        ...insurance.map((r) => ({ ...r, entityType: 'insurance' })),
        ...investments.map((r) => ({ ...r, entityType: 'investments' })),
      ],
    };
  }

  // --- Comparisons ---
  listComparisons() {
    return this.db.financeComparison.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  createComparison(
    input: { title: string; slug: string; entityType: string; entityIds: string[]; status?: 'DRAFT' | 'PUBLISHED' },
    actorId: string,
  ) {
    return this.db.financeComparison.create({
      data: {
        title: input.title,
        slug: input.slug,
        entityType: input.entityType,
        entityIds: input.entityIds,
        status: input.status ?? 'PUBLISHED',
        publishedAt: (input.status ?? 'PUBLISHED') === 'PUBLISHED' ? new Date() : null,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  // --- Rate feeds ---
  listRateFeeds() {
    return this.db.financeRateFeed.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  createRateFeed(
    input: { name: string; provider: string; endpointUrl?: string | null; productType?: string | null },
    actorId: string,
  ) {
    return this.db.financeRateFeed.create({
      data: {
        name: input.name,
        provider: input.provider,
        endpointUrl: input.endpointUrl,
        productType: input.productType,
        enabled: true,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  async syncRateFeed(id: string, actorId: string) {
    const feed = await this.db.financeRateFeed.findFirst({ where: { id, deletedAt: null } });
    if (!feed) throw this.notFound('Rate feed not found.');

    try {
      let imported = 0;

      if (feed.provider !== 'mock' && feed.endpointUrl) {
        const rows = await fetchRemoteRates(feed);
        for (const row of rows) {
          await ingestRemoteRate(this.db, feed, row, actorId);
          imported += 1;
        }
      } else {
        const rate = 8 + Math.random() * 4;
        await ingestRemoteRate(
          this.db,
          feed,
          { productType: feed.productType ?? feed.provider, rate },
          actorId,
        );
        imported = 1;
      }

      return this.db.financeRateFeed.update({
        where: { id },
        data: {
          lastSyncedAt: new Date(),
          lastStatus: `ok:${imported}`,
          updatedBy: actorId,
        },
      });
    } catch (err) {
      await this.db.financeRateFeed.update({
        where: { id },
        data: {
          lastStatus: `error:${err instanceof Error ? err.message : 'sync_failed'}`,
          updatedBy: actorId,
        },
      });
      throw new BadRequestException({
        success: false,
        error: {
          code: 'RATE_FEED_SYNC_FAILED',
          message: err instanceof Error ? err.message : 'Rate feed sync failed.',
        },
      });
    }
  }

  async syncEnabledFeeds() {
    const feeds = await this.db.financeRateFeed.findMany({
      where: { deletedAt: null, enabled: true },
      select: { id: true },
    });
    let processed = 0;
    for (const feed of feeds) {
      try {
        await this.syncRateFeed(feed.id, 'system');
        processed += 1;
      } catch {
        // status stored on feed row
      }
    }
    return { processed, total: feeds.length };
  }

  // --- Eligibility (mock) ---
  async checkEligibility(input: {
    loanType: string;
    income: number;
    amount: number;
    tenureMonths?: number;
    userId?: string | null;
  }) {
    const maxEligible = input.income * 40;
    const eligible = input.amount <= maxEligible && input.income >= 25000;
    const emiEstimate =
      input.tenureMonths && input.tenureMonths > 0
        ? Math.round((input.amount * 1.1) / input.tenureMonths)
        : null;
    const result = {
      eligible,
      maxEligibleAmount: maxEligible,
      recommendedRate: eligible ? 10.5 : null,
      emiEstimate,
      reasons: eligible
        ? ['Income meets minimum threshold', 'Requested amount within estimated eligibility']
        : ['Requested amount exceeds estimated eligibility or income is below minimum'],
      provider: 'mock',
    };
    await this.db.loanEligibilityCheck.create({
      data: {
        userId: input.userId,
        loanType: input.loanType,
        income: input.income,
        amount: input.amount,
        tenureMonths: input.tenureMonths,
        result,
      },
    });
    return result;
  }

  // --- Credit score (mock) ---
  async checkCreditScore(input: { pan?: string; userId?: string | null }) {
    const score = 650 + Math.floor(Math.random() * 150);
    const band = score >= 750 ? 'excellent' : score >= 700 ? 'good' : score >= 650 ? 'fair' : 'poor';
    const panMasked = input.pan ? `${input.pan.slice(0, 3)}****${input.pan.slice(-1)}` : null;
    const result = { score, band, provider: 'mock', factors: ['Payment history', 'Credit utilization'] };
    await this.db.creditScoreCheck.create({
      data: {
        userId: input.userId,
        panMasked,
        provider: 'mock',
        score,
        band,
        result,
      },
    });
    return result;
  }

  // --- Portfolio ---
  async getPortfolio(userId?: string | null) {
    if (!userId) throw new UnauthorizedException({ success: false, error: { code: 'UNAUTHORIZED', message: 'Login required.' } });
    let portfolio = await this.db.financePortfolio.findFirst({
      where: { userId, deletedAt: null },
      include: { holdings: true },
    });
    if (!portfolio) {
      portfolio = await this.db.financePortfolio.create({
        data: { userId, name: 'My portfolio' },
        include: { holdings: true },
      });
    }
    return portfolio.holdings.map((h) => ({
      id: h.id,
      name: h.name,
      symbol: h.symbol,
      assetType: h.assetType,
      quantity: h.quantity,
      avgCost: h.avgCost,
    }));
  }

  // --- Goals ---
  async listGoals(userId?: string | null) {
    if (!userId) throw new UnauthorizedException({ success: false, error: { code: 'UNAUTHORIZED', message: 'Login required.' } });
    return this.db.financeGoal.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createGoal(
    input: { title: string; targetAmount: number; currentAmount?: number; targetDate?: string | null },
    userId?: string | null,
  ) {
    if (!userId) throw new UnauthorizedException({ success: false, error: { code: 'UNAUTHORIZED', message: 'Login required.' } });
    return this.db.financeGoal.create({
      data: {
        userId,
        title: input.title,
        targetAmount: input.targetAmount,
        currentAmount: input.currentAmount ?? 0,
        targetDate: input.targetDate ? new Date(input.targetDate) : null,
        status: 'active',
      },
    });
  }

  // --- CSV export ---
  async exportCsv(entity: string): Promise<string> {
    if (entity === 'banks') {
      const rows = await this.db.bank.findMany({ where: { deletedAt: null } });
      const header = 'id,name,slug,website,status,featured';
      return [header, ...rows.map((r) => [r.id, r.name, r.slug, r.website, r.status, r.featured].map(csvEscape).join(','))].join('\n');
    }
    if (entity === 'loans') {
      const rows = await this.db.loan.findMany({ where: { deletedAt: null } });
      const header = 'id,bankId,name,slug,loanType,interestRate,status,affiliateUrl';
      return [
        header,
        ...rows.map((r) =>
          [r.id, r.bankId, r.name, r.slug, r.loanType, r.interestRate, r.status, r.affiliateUrl].map(csvEscape).join(','),
        ),
      ].join('\n');
    }
    if (entity === 'credit-cards') {
      const rows = await this.db.creditCard.findMany({ where: { deletedAt: null } });
      const header = 'id,bankId,name,slug,annualFee,joiningFee,status,affiliateUrl';
      return [
        header,
        ...rows.map((r) =>
          [r.id, r.bankId, r.name, r.slug, r.annualFee, r.joiningFee, r.status, r.affiliateUrl].map(csvEscape).join(','),
        ),
      ].join('\n');
    }
    if (entity === 'insurance') {
      const rows = await this.db.insuranceProduct.findMany({ where: { deletedAt: null } });
      const header = 'id,providerName,name,slug,premium,status,affiliateUrl';
      return [
        header,
        ...rows.map((r) =>
          [r.id, r.providerName, r.name, r.slug, r.premium, r.status, r.affiliateUrl].map(csvEscape).join(','),
        ),
      ].join('\n');
    }
    if (entity === 'investments') {
      const rows = await this.db.investmentProduct.findMany({ where: { deletedAt: null } });
      const header = 'id,providerName,name,slug,riskLevel,expectedReturn,status,affiliateUrl';
      return [
        header,
        ...rows.map((r) =>
          [r.id, r.providerName, r.name, r.slug, r.riskLevel, r.expectedReturn, r.status, r.affiliateUrl]
            .map(csvEscape)
            .join(','),
        ),
      ].join('\n');
    }
    if (entity === 'interest-rates') {
      const rows = await this.db.interestRate.findMany({ where: { deletedAt: null } });
      const header = 'id,productType,rate,source,effectiveFrom,bankId,loanId';
      return [
        header,
        ...rows.map((r) =>
          [r.id, r.productType, r.rate, r.source, r.effectiveFrom.toISOString(), r.bankId, r.loanId]
            .map(csvEscape)
            .join(','),
        ),
      ].join('\n');
    }
    throw new BadRequestException({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Unknown entity.' } });
  }

  async importCsv(entity: string, csvText: string, actorId: string) {
    const rows = parseCsv(csvText);
    if (!rows.length) {
      throw new BadRequestException({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Empty CSV.' } });
    }
    let imported = 0;
    if (entity === 'banks') {
      for (const row of rows) {
        if (!row.name || !row.slug) continue;
        await this.db.bank.upsert({
          where: { slug: row.slug },
          update: {
            name: row.name,
            website: row.website || null,
            status: (row.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
            updatedBy: actorId,
          },
          create: {
            name: row.name,
            slug: row.slug,
            website: row.website || null,
            status: (row.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
            createdBy: actorId,
            updatedBy: actorId,
          },
        });
        imported += 1;
      }
    } else if (entity === 'glossary' || entity === 'faqs') {
      // no-op for wrong entity
    } else if (entity === 'loans') {
      for (const row of rows) {
        if (!row.name || !row.slug || !row.loanType) continue;
        const bankId = await this.resolveBankId(row);
        if (!bankId) continue;
        await this.db.loan.upsert({
          where: { bankId_slug: { bankId, slug: row.slug } },
          update: {
            name: row.name,
            loanType: row.loanType,
            interestRate: row.interestRate ? Number(row.interestRate) : undefined,
            affiliateUrl: row.affiliateUrl || null,
            status: (row.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
            updatedBy: actorId,
          },
          create: {
            bankId,
            name: row.name,
            slug: row.slug,
            loanType: row.loanType,
            interestRate: row.interestRate ? Number(row.interestRate) : null,
            affiliateUrl: row.affiliateUrl || null,
            status: (row.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
            createdBy: actorId,
            updatedBy: actorId,
          },
        });
        imported += 1;
      }
    } else if (entity === 'credit-cards') {
      for (const row of rows) {
        if (!row.name || !row.slug) continue;
        const bankId = await this.resolveBankId(row);
        if (!bankId) continue;
        await this.db.creditCard.upsert({
          where: { bankId_slug: { bankId, slug: row.slug } },
          update: {
            name: row.name,
            annualFee: row.annualFee ? Number(row.annualFee) : null,
            joiningFee: row.joiningFee ? Number(row.joiningFee) : null,
            affiliateUrl: row.affiliateUrl || null,
            status: (row.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
            updatedBy: actorId,
          },
          create: {
            bankId,
            name: row.name,
            slug: row.slug,
            annualFee: row.annualFee ? Number(row.annualFee) : null,
            joiningFee: row.joiningFee ? Number(row.joiningFee) : null,
            affiliateUrl: row.affiliateUrl || null,
            status: (row.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
            createdBy: actorId,
            updatedBy: actorId,
          },
        });
        imported += 1;
      }
    } else if (entity === 'insurance') {
      for (const row of rows) {
        if (!row.name || !row.slug || !row.providerName) continue;
        await this.db.insuranceProduct.upsert({
          where: { slug: row.slug },
          update: {
            name: row.name,
            providerName: row.providerName,
            premium: row.premium ? Number(row.premium) : null,
            affiliateUrl: row.affiliateUrl || null,
            status: (row.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
            updatedBy: actorId,
          },
          create: {
            name: row.name,
            slug: row.slug,
            providerName: row.providerName,
            premium: row.premium ? Number(row.premium) : null,
            affiliateUrl: row.affiliateUrl || null,
            status: (row.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
            createdBy: actorId,
            updatedBy: actorId,
          },
        });
        imported += 1;
      }
    } else if (entity === 'investments') {
      for (const row of rows) {
        if (!row.name || !row.slug || !row.providerName) continue;
        await this.db.investmentProduct.upsert({
          where: { slug: row.slug },
          update: {
            name: row.name,
            providerName: row.providerName,
            riskLevel: row.riskLevel || null,
            expectedReturn: row.expectedReturn ? Number(row.expectedReturn) : null,
            affiliateUrl: row.affiliateUrl || null,
            status: (row.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
            updatedBy: actorId,
          },
          create: {
            name: row.name,
            slug: row.slug,
            providerName: row.providerName,
            riskLevel: row.riskLevel || null,
            expectedReturn: row.expectedReturn ? Number(row.expectedReturn) : null,
            affiliateUrl: row.affiliateUrl || null,
            status: (row.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
            createdBy: actorId,
            updatedBy: actorId,
          },
        });
        imported += 1;
      }
    } else if (entity === 'interest-rates') {
      for (const row of rows) {
        if (!row.rate) continue;
        await this.db.interestRate.create({
          data: {
            productType: row.productType || 'imported',
            rate: Number(row.rate),
            source: row.source || 'csv-import',
            effectiveFrom: row.effectiveFrom ? new Date(row.effectiveFrom) : new Date(),
            bankId: row.bankId || null,
            loanId: row.loanId || null,
            createdBy: actorId,
            updatedBy: actorId,
          },
        });
        imported += 1;
      }
    } else {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `CSV import for ${entity} is not supported.`,
        },
      });
    }
    return { imported };
  }

  private async resolveBankId(row: Record<string, string>) {
    if (row.bankId) return row.bankId;
    if (!row.bankSlug) return null;
    const bank = await this.db.bank.findFirst({
      where: { slug: row.bankSlug, deletedAt: null },
      select: { id: true },
    });
    return bank?.id ?? null;
  }
}
