import type { PrismaClient } from '@prisma/client';

/**
 * Seed loan hub categories only — no fabricated product rates.
 * Editorial/product data must be entered via admin with source verification.
 */
export const LOAN_HUB_CATEGORIES = [
  {
    name: 'Personal Loan',
    slug: 'personal-loan',
    shortDescription: 'Unsecured loans for personal expenses.',
    introduction:
      'Compare personal loan rates, loan amounts, repayment tenure, processing fees and eligibility requirements.',
    icon: 'wallet',
    sortOrder: 10,
    typicalMinTenure: 12,
    typicalMaxTenure: 60,
  },
  {
    name: 'Home Loan',
    slug: 'home-loan',
    shortDescription: 'Loans for buying or building a home.',
    introduction:
      'Compare home loan interest rates, loan amounts, tenure, processing fees, LTV and eligibility for buying or building a home.',
    icon: 'home',
    sortOrder: 20,
    typicalMinTenure: 60,
    typicalMaxTenure: 360,
  },
  {
    name: 'Car Loan',
    slug: 'car-loan',
    shortDescription: 'Financing for new and used cars.',
    introduction:
      'Compare car loan interest rates, loan amounts, repayment tenure, processing fees and eligibility criteria.',
    icon: 'car',
    sortOrder: 30,
    typicalMinTenure: 12,
    typicalMaxTenure: 84,
  },
  {
    name: 'Education Loan',
    slug: 'education-loan',
    shortDescription: 'Funding for higher education in India and abroad.',
    introduction:
      'Compare education loan interest rates, loan amounts, tenure, processing fees and eligibility criteria.',
    icon: 'book',
    sortOrder: 40,
    typicalMinTenure: 12,
    typicalMaxTenure: 180,
  },
  {
    name: 'Business Loan',
    slug: 'business-loan',
    shortDescription: 'Credit for working capital and business growth.',
    introduction:
      'Compare business loan interest rates, loan amounts, tenure, processing fees and eligibility criteria.',
    icon: 'briefcase',
    sortOrder: 50,
    typicalMinTenure: 12,
    typicalMaxTenure: 84,
  },
  {
    name: 'Gold Loan',
    slug: 'gold-loan',
    shortDescription: 'Loans secured against gold jewellery.',
    introduction:
      'Compare gold loan interest rates, loan amounts, tenure, processing fees and eligibility criteria.',
    icon: 'gem',
    sortOrder: 60,
    typicalMinTenure: 3,
    typicalMaxTenure: 36,
  },
  {
    name: 'Two-Wheeler Loan',
    slug: 'two-wheeler-loan',
    shortDescription: 'Financing for scooters and motorcycles.',
    introduction:
      'Compare two-wheeler loan interest rates, loan amounts, tenure, processing fees and eligibility criteria.',
    icon: 'bike',
    sortOrder: 70,
    typicalMinTenure: 6,
    typicalMaxTenure: 48,
  },
  {
    name: 'Loan Against Property',
    slug: 'loan-against-property',
    shortDescription: 'Secured credit against residential or commercial property.',
    introduction:
      'Compare loan against property interest rates, loan amounts, tenure, processing fees and eligibility criteria.',
    icon: 'building',
    sortOrder: 80,
    typicalMinTenure: 60,
    typicalMaxTenure: 180,
  },
] as const;

export async function seedLoanCategories(prisma: PrismaClient) {
  for (const cat of LOAN_HUB_CATEGORIES) {
    const existing = await prisma.financeCategory.findFirst({
      where: { slug: cat.slug, deletedAt: null },
    });

    const data = {
      name: cat.name,
      slug: cat.slug,
      shortDescription: cat.shortDescription,
      introduction: cat.introduction,
      description: cat.shortDescription,
      icon: cat.icon,
      sortOrder: cat.sortOrder,
      typicalMinTenure: cat.typicalMinTenure,
      typicalMaxTenure: cat.typicalMaxTenure,
      loanHubEnabled: true,
      status: 'PUBLISHED' as const,
      publishedAt: new Date(),
      // Intentionally omit interest rate / amount ranges — set via admin after verification.
      metaTitle: `Compare ${cat.name}s`,
      metaDescription: cat.introduction,
      contentSections: {
        whatIs: null,
        howItWorks: null,
        features: null,
        benefits: null,
        drawbacks: null,
        interestRates: null,
        rateFactors: null,
        eligibility: null,
        documents: null,
        howToApply: null,
        howToCompare: null,
        emiCalculation: null,
        creditScore: null,
        fees: null,
        prepayment: null,
        securedVsUnsecured: null,
        mistakes: null,
        alternatives: null,
      },
    };

    if (existing) {
      await prisma.financeCategory.update({
        where: { id: existing.id },
        data: {
          ...data,
          deletedAt: null,
        },
      });
    } else {
      await prisma.financeCategory.create({ data });
    }
  }
}
