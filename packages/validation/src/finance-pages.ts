import { z } from 'zod';
import { publishStatusSchema, slugSchema, uuidSchema } from './common';

export const FINANCE_PAGE_ENTITY_TYPE = 'finance_page';

export const financePageKeySchema = z.enum([
  'hub',
  'loans',
  'credit-cards',
  'insurance',
  'investments',
  'banks',
  'rates',
  'faqs',
  'glossary',
  'guides',
  'compare',
  'eligibility',
  'credit-score',
  'portfolio',
  'goals',
  'loans-methodology',
]);

export type FinancePageKey = z.infer<typeof financePageKeySchema>;

export const FINANCE_PAGE_IDS: Record<FinancePageKey, string> = {
  hub: 'f0000001-0000-4000-8000-000000000001',
  loans: 'f0000001-0000-4000-8000-000000000002',
  'credit-cards': 'f0000001-0000-4000-8000-000000000003',
  insurance: 'f0000001-0000-4000-8000-000000000004',
  investments: 'f0000001-0000-4000-8000-000000000005',
  banks: 'f0000001-0000-4000-8000-000000000006',
  rates: 'f0000001-0000-4000-8000-000000000007',
  faqs: 'f0000001-0000-4000-8000-000000000008',
  glossary: 'f0000001-0000-4000-8000-000000000009',
  guides: 'f0000001-0000-4000-8000-00000000000a',
  compare: 'f0000001-0000-4000-8000-00000000000b',
  eligibility: 'f0000001-0000-4000-8000-00000000000c',
  'credit-score': 'f0000001-0000-4000-8000-00000000000d',
  portfolio: 'f0000001-0000-4000-8000-00000000000e',
  goals: 'f0000001-0000-4000-8000-00000000000f',
  'loans-methodology': 'f0000001-0000-4000-8000-000000000010',
};

export type FinancePageDefaults = {
  path: string;
  label: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  canonicalUrl?: string;
};

export const FINANCE_PAGE_DEFAULTS: Record<FinancePageKey, FinancePageDefaults> = {
  hub: {
    path: '/finance',
    label: 'Finance hub',
    title: 'Finance Tools, Loan Calculators & Financial Comparisons',
    description:
      'Calculate EMIs, compare loans, explore credit cards, insurance and investments, and use smart finance tools to make better financial decisions.',
    h1: 'Finance tools, loan calculators & comparisons',
    intro:
      'Calculate EMIs, compare loans, explore credit cards, insurance and investments, and use smart finance tools to make better financial decisions.',
    canonicalUrl: 'https://varnarc.com/finance',
  },
  loans: {
    path: '/finance/loans',
    label: 'Loans listing',
    title: 'Compare Loans | Interest Rates, Fees & EMI Tools',
    description:
      'Compare loan options, interest rates, fees, loan amounts and repayment terms from banks and financial institutions.',
    h1: 'Compare Loans',
    intro:
      'Compare interest rates, fees, loan amounts and repayment terms from banks and financial institutions.',
  },
  'credit-cards': {
    path: '/finance/credit-cards',
    label: 'Credit cards listing',
    title: 'Credit Cards',
    description: 'Compare rewards, cashback, and premium credit cards.',
    h1: 'Credit cards',
    intro: 'Find the right card for your spending habits.',
  },
  insurance: {
    path: '/finance/insurance',
    label: 'Insurance listing',
    title: 'Insurance',
    description: 'Compare health, life, and motor insurance products.',
    h1: 'Insurance',
    intro: 'Protect what matters with the right coverage.',
  },
  investments: {
    path: '/finance/investments',
    label: 'Investments listing',
    title: 'Investments',
    description: 'Compare mutual funds, FDs, and investment products.',
    h1: 'Investments',
    intro: 'Grow your wealth with curated investment options.',
  },
  banks: {
    path: '/finance/banks',
    label: 'Banks listing',
    title: 'Banks',
    description: 'Explore partner banks and their financial products.',
    h1: 'Banks',
    intro: 'Browse banks and their loan and card offerings.',
  },
  rates: {
    path: '/finance/rates',
    label: 'Interest rates',
    title: 'Interest Rates',
    description: 'Latest benchmark and product interest rates.',
    h1: 'Interest rates',
    intro: 'Track current rates for loans and deposits.',
  },
  faqs: {
    path: '/finance/faqs',
    label: 'FAQs',
    title: 'Finance FAQs',
    description: 'Frequently asked questions about loans, cards, insurance, and investments.',
    h1: 'Finance FAQs',
    intro: 'Answers to common questions about financial products and planning.',
  },
  glossary: {
    path: '/finance/glossary',
    label: 'Glossary',
    title: 'Finance Glossary',
    description: 'Definitions of common financial terms and concepts.',
    h1: 'Finance glossary',
    intro: 'Understand key financial terms and concepts.',
  },
  guides: {
    path: '/finance/guides',
    label: 'Guides listing',
    title: 'Finance Guides',
    description: 'Educational guides on loans, investments, insurance, and personal finance.',
    h1: 'Finance guides',
    intro: 'Learn how to make smarter financial decisions.',
  },
  compare: {
    path: '/finance/compare',
    label: 'Compare products',
    title: 'Compare Finance Products',
    description: 'Side-by-side comparisons of loans, cards, insurance, and investments.',
    h1: 'Compare products',
    intro: 'Compare financial products side by side.',
  },
  eligibility: {
    path: '/finance/eligibility',
    label: 'Eligibility check',
    title: 'Loan Eligibility Check',
    description: 'Estimate your loan eligibility based on income and amount.',
    h1: 'Eligibility check',
    intro: 'Get a quick estimate of your loan eligibility.',
  },
  'credit-score': {
    path: '/finance/credit-score',
    label: 'Credit score',
    title: 'Credit Score Check',
    description: 'Check your credit profile and score band.',
    h1: 'Credit score',
    intro: 'Understand your credit health.',
  },
  portfolio: {
    path: '/finance/portfolio',
    label: 'Portfolio',
    title: 'Finance Portfolio',
    description: 'View and manage your investment holdings.',
    h1: 'Portfolio',
    intro: 'Track your investment holdings in one place.',
  },
  goals: {
    path: '/finance/goals',
    label: 'Financial goals',
    title: 'Financial Goals',
    description: 'Plan and track your financial goals.',
    h1: 'Financial goals',
    intro: 'Set targets and monitor your progress.',
  },
  'loans-methodology': {
    path: '/finance/loans/methodology',
    label: 'Loan methodology',
    title: 'How Varnarc Compares Loans',
    description:
      'How Varnarc sources loan data, displays rates and fees, handles featured and sponsored listings, and sorts comparisons.',
    h1: 'How Varnarc Compares Loans',
    intro:
      'A plain-language note on how loan information is stored, shown, and sorted on Varnarc — not a lending offer or approval.',
  },
};

export const FINANCE_PAGE_KEYS = financePageKeySchema.options;

export const updateFinancePageSeoSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  h1: z.string().max(200).optional().nullable(),
  intro: z.string().max(500).optional().nullable(),
  metaKeywords: z.string().max(500).optional().nullable(),
  canonicalUrl: z.string().max(500).optional().nullable().or(z.literal('')),
  heroImageUrl: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .or(z.literal(''))
    .refine(
      (v) => !v || v.startsWith('/') || /^https?:\/\//i.test(v),
      'Must be a site path or absolute URL',
    ),
  heroImageMediaId: uuidSchema.optional().nullable(),
  heroImageAlt: z.string().max(300).optional().nullable(),
  /** Modular hub education copy overrides (loans page). */
  educationModules: z
    .record(
      z.string().max(64),
      z.object({
        title: z.string().max(200).optional(),
        summary: z.string().max(1000).optional(),
        guideHref: z.string().max(500).optional().nullable(),
      }),
    )
    .optional()
    .nullable(),
});

export const createFinanceGuideSchema = z.object({
  title: z.string().min(1).max(200),
  slug: slugSchema,
  summary: z.string().max(2000).optional().nullable(),
  body: z.string().max(50000).optional().nullable(),
  categoryId: uuidSchema.optional().nullable(),
  status: publishStatusSchema.default('DRAFT'),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
});

export const updateFinanceGuideSchema = createFinanceGuideSchema.partial();

export type UpdateFinancePageSeoInput = z.infer<typeof updateFinancePageSeoSchema>;
export type CreateFinanceGuideInput = z.infer<typeof createFinanceGuideSchema>;
export type UpdateFinanceGuideInput = z.infer<typeof updateFinanceGuideSchema>;
