import { z } from 'zod';
import {
  cursorPaginationQuerySchema,
  jsonValueSchema,
  publishStatusSchema,
  slugSchema,
  uuidSchema,
} from './common';

/** Absolute URL or site-relative media path (media library / public hub). */
export const mediaImageUrlSchema = z
  .string()
  .max(500)
  .refine((value) => !value || value.startsWith('/') || /^https?:\/\//i.test(value), {
    message: 'Must be an absolute URL or a site-relative path',
  })
  .optional()
  .nullable()
  .or(z.literal(''));

export const createFinanceCategorySchema = z.object({
  name: z.string().min(1).max(150),
  slug: slugSchema,
  description: z.string().max(2000).optional().nullable(),
  shortDescription: z.string().max(500).optional().nullable(),
  introduction: z.string().max(10000).optional().nullable(),
  icon: z.string().max(80).optional().nullable(),
  iconMediaId: uuidSchema.optional().nullable(),
  iconAlt: z.string().max(300).optional().nullable(),
  featuredImage: mediaImageUrlSchema,
  featuredImageMediaId: uuidSchema.optional().nullable(),
  featuredImageAlt: z.string().max(300).optional().nullable(),
  heroImage: mediaImageUrlSchema,
  heroImageMediaId: uuidSchema.optional().nullable(),
  heroImageAlt: z.string().max(300).optional().nullable(),
  minInterestRate: z.number().min(0).max(100).optional().nullable(),
  maxInterestRate: z.number().min(0).max(100).optional().nullable(),
  typicalMinAmount: z.number().min(0).optional().nullable(),
  typicalMaxAmount: z.number().min(0).optional().nullable(),
  typicalMinTenure: z.number().int().min(1).optional().nullable(),
  typicalMaxTenure: z.number().int().min(1).optional().nullable(),
  metaTitle: z.string().max(200).optional().nullable(),
  metaDescription: z.string().max(500).optional().nullable(),
  seoContent: z.string().max(50000).optional().nullable(),
  contentSections: jsonValueSchema.optional().nullable(),
  loanHubEnabled: z.boolean().default(false),
  status: publishStatusSchema.default('DRAFT'),
  publishedAt: z.coerce.date().optional().nullable(),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const updateFinanceCategorySchema = createFinanceCategorySchema.partial();

export const createBankSchema = z.object({
  name: z.string().min(1).max(150),
  slug: slugSchema,
  legalName: z.string().max(250).optional().nullable(),
  lenderType: z.string().max(80).optional().nullable(),
  logoUrl: mediaImageUrlSchema,
  logoMediaId: uuidSchema.optional().nullable(),
  logoAlt: z.string().max(300).optional().nullable(),
  website: z.string().url().max(500).optional().nullable().or(z.literal('')),
  description: z.string().max(5000).optional().nullable(),
  headquarters: z.string().max(250).optional().nullable(),
  supportUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  sourceUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  status: publishStatusSchema.default('DRAFT'),
  featured: z.boolean().default(false),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
});

export const updateBankSchema = createBankSchema.partial();

export const createLoanSchema = z.object({
  bankId: uuidSchema,
  categoryId: uuidSchema.optional().nullable(),
  name: z.string().min(1).max(150),
  slug: slugSchema,
  loanType: z.string().min(1).max(80),
  shortDescription: z.string().max(500).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  interestRate: z.number().min(0).max(100).optional().nullable(),
  interestRateMin: z.number().min(0).max(100).optional().nullable(),
  interestRateMax: z.number().min(0).max(100).optional().nullable(),
  rateType: z.string().max(80).optional().nullable(),
  benchmarkType: z.string().max(80).optional().nullable(),
  processingFee: z.number().min(0).max(100).optional().nullable(),
  processingFeeMin: z.number().min(0).max(100).optional().nullable(),
  processingFeeMax: z.number().min(0).max(100).optional().nullable(),
  processingFeeText: z.string().max(1000).optional().nullable(),
  foreclosureChargeText: z.string().max(2000).optional().nullable(),
  prepaymentChargeText: z.string().max(2000).optional().nullable(),
  latePaymentChargeText: z.string().max(2000).optional().nullable(),
  tenureMin: z.number().int().min(1).optional().nullable(),
  tenureMax: z.number().int().min(1).optional().nullable(),
  loanAmountMin: z.number().min(0).optional().nullable(),
  loanAmountMax: z.number().min(0).optional().nullable(),
  maxAmount: z.number().min(0).optional().nullable(),
  minimumAge: z.number().int().min(18).max(100).optional().nullable(),
  maximumAge: z.number().int().min(18).max(100).optional().nullable(),
  minimumIncome: z.number().min(0).optional().nullable(),
  minimumCreditScore: z.number().int().min(300).max(900).optional().nullable(),
  employmentTypes: jsonValueSchema.optional().nullable(),
  eligibility: z.string().max(5000).optional().nullable(),
  eligibilitySummary: z.string().max(5000).optional().nullable(),
  documentsRequired: jsonValueSchema.optional().nullable(),
  features: jsonValueSchema.optional().nullable(),
  benefits: z.string().max(5000).optional().nullable(),
  disadvantages: z.string().max(5000).optional().nullable(),
  applicationProcess: z.string().max(10000).optional().nullable(),
  approvalTime: z.string().max(200).optional().nullable(),
  disbursementTime: z.string().max(200).optional().nullable(),
  officialApplicationUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  sourceUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  rateLastVerifiedAt: z.coerce.date().optional().nullable(),
  affiliateUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  pros: z.string().max(5000).optional().nullable(),
  cons: z.string().max(5000).optional().nullable(),
  featured: z.boolean().default(false),
  sponsored: z.boolean().default(false),
  sponsoredDisclosure: z.string().max(2000).optional().nullable(),
  needsRateReview: z.boolean().default(false),
  status: publishStatusSchema.default('DRAFT'),
  metadata: jsonValueSchema.optional().nullable(),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
  canonicalUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
});

export const updateLoanSchema = createLoanSchema.partial();

export const createCreditCardSchema = z.object({
  bankId: uuidSchema,
  categoryId: uuidSchema.optional().nullable(),
  name: z.string().min(1).max(150),
  slug: slugSchema,
  description: z.string().max(5000).optional().nullable(),
  annualFee: z.number().min(0).optional().nullable(),
  joiningFee: z.number().min(0).optional().nullable(),
  rewards: z.string().max(2000).optional().nullable(),
  cashback: z.string().max(2000).optional().nullable(),
  loungeAccess: z.boolean().default(false),
  affiliateUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  pros: z.string().max(5000).optional().nullable(),
  cons: z.string().max(5000).optional().nullable(),
  featured: z.boolean().default(false),
  status: publishStatusSchema.default('DRAFT'),
  metadata: jsonValueSchema.optional().nullable(),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
});

export const updateCreditCardSchema = createCreditCardSchema.partial();

export const createInsuranceSchema = z.object({
  categoryId: uuidSchema.optional().nullable(),
  providerName: z.string().min(1).max(150),
  name: z.string().min(1).max(150),
  slug: slugSchema,
  coverage: z.string().max(5000).optional().nullable(),
  premium: z.number().min(0).optional().nullable(),
  benefits: z.string().max(5000).optional().nullable(),
  affiliateUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  featured: z.boolean().default(false),
  status: publishStatusSchema.default('DRAFT'),
  metadata: jsonValueSchema.optional().nullable(),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
});

export const updateInsuranceSchema = createInsuranceSchema.partial();

export const createInvestmentSchema = z.object({
  categoryId: uuidSchema.optional().nullable(),
  providerName: z.string().min(1).max(150),
  name: z.string().min(1).max(150),
  slug: slugSchema,
  riskLevel: z.string().max(40).optional().nullable(),
  expectedReturn: z.number().min(0).max(100).optional().nullable(),
  lockInPeriod: z.string().max(120).optional().nullable(),
  affiliateUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  featured: z.boolean().default(false),
  status: publishStatusSchema.default('DRAFT'),
  metadata: jsonValueSchema.optional().nullable(),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
});

export const updateInvestmentSchema = createInvestmentSchema.partial();

export const createInterestRateSchema = z.object({
  loanId: uuidSchema.optional().nullable(),
  bankId: uuidSchema.optional().nullable(),
  productType: z.string().max(80).optional().nullable(),
  providerId: uuidSchema.optional().nullable(),
  rate: z.number().min(0).max(100),
  minTenure: z.number().int().min(1).optional().nullable(),
  maxTenure: z.number().int().min(1).optional().nullable(),
  source: z.string().max(200).optional().nullable(),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional().nullable(),
});

export const updateInterestRateSchema = createInterestRateSchema.partial();

export const financeListQuerySchema = cursorPaginationQuerySchema.extend({
  status: publishStatusSchema.optional(),
  bankId: uuidSchema.optional(),
  categoryId: uuidSchema.optional(),
  categorySlug: slugSchema.optional(),
  loanType: z.string().max(80).optional(),
  productType: z.string().max(80).optional(),
  featured: z.coerce.boolean().optional(),
  sponsored: z.coerce.boolean().optional(),
  needsRateReview: z.coerce.boolean().optional(),
  rateMax: z.coerce.number().min(0).max(100).optional(),
  rateMin: z.coerce.number().min(0).max(100).optional(),
  amountMin: z.coerce.number().min(0).optional(),
  amountMax: z.coerce.number().min(0).optional(),
  tenureMin: z.coerce.number().int().min(1).optional(),
  tenureMax: z.coerce.number().int().min(1).optional(),
  processingFeeMax: z.coerce.number().min(0).optional(),
  creditScoreMaxRequired: z.coerce.number().int().min(300).max(900).optional(),
  employmentType: z.string().max(80).optional(),
  sort: z
    .enum([
      'recommended',
      'lowest_interest',
      'highest_amount',
      'lowest_processing_fee',
      'longest_tenure',
    ])
    .optional(),
});

export const financeCompareQuerySchema = z.object({
  type: z.enum(['loans', 'credit-cards', 'insurance', 'investments']),
  ids: z
    .string()
    .min(1)
    .transform((v) =>
      v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .pipe(z.array(uuidSchema).min(2).max(6)),
});

export const createLoanRateHistorySchema = z.object({
  loanId: uuidSchema,
  interestRateMin: z.number().min(0).max(100).optional().nullable(),
  interestRateMax: z.number().min(0).max(100).optional().nullable(),
  sourceUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  effectiveDate: z.coerce.date(),
  verifiedAt: z.coerce.date().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const createContentSourceSchema = z.object({
  name: z.string().min(1).max(200),
  sourceUrl: z.string().url().max(500),
  entityType: z.string().max(80).optional().nullable(),
  entityId: uuidSchema.optional().nullable(),
  retrievedAt: z.coerce.date().optional().nullable(),
  verifiedAt: z.coerce.date().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  status: publishStatusSchema.default('PUBLISHED'),
});

export const updateContentSourceSchema = createContentSourceSchema.partial();

export const createFinanceFaqSchema = z.object({
  categoryId: uuidSchema.optional().nullable(),
  entityType: z
    .enum(['loan_hub', 'loan_category', 'loan', 'calculator', 'article'])
    .optional()
    .nullable(),
  entityId: uuidSchema.optional().nullable(),
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(10000),
  sortOrder: z.number().int().nonnegative().default(0),
  status: publishStatusSchema.default('PUBLISHED'),
});

export const updateFinanceFaqSchema = createFinanceFaqSchema.partial();

export const createFinanceComparisonSchema = z.object({
  title: z.string().min(1).max(200),
  slug: slugSchema,
  entityType: z.string().min(1).max(40).default('loan'),
  entityIds: z.array(uuidSchema).min(2).max(4),
  intro: z.string().max(5000).optional().nullable(),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
  canonicalUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  methodologyNote: z.string().max(5000).optional().nullable(),
  noindex: z.boolean().default(false),
  status: publishStatusSchema.default('DRAFT'),
});

export const updateFinanceComparisonSchema = createFinanceComparisonSchema.partial();

export type CreateFinanceCategoryInput = z.infer<typeof createFinanceCategorySchema>;
export type UpdateFinanceCategoryInput = z.infer<typeof updateFinanceCategorySchema>;
export type CreateBankInput = z.infer<typeof createBankSchema>;
export type UpdateBankInput = z.infer<typeof updateBankSchema>;
export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type UpdateLoanInput = z.infer<typeof updateLoanSchema>;
export type CreateCreditCardInput = z.infer<typeof createCreditCardSchema>;
export type UpdateCreditCardInput = z.infer<typeof updateCreditCardSchema>;
export type CreateInsuranceInput = z.infer<typeof createInsuranceSchema>;
export type UpdateInsuranceInput = z.infer<typeof updateInsuranceSchema>;
export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>;
export type UpdateInvestmentInput = z.infer<typeof updateInvestmentSchema>;
export type CreateInterestRateInput = z.infer<typeof createInterestRateSchema>;
export type UpdateInterestRateInput = z.infer<typeof updateInterestRateSchema>;
export type FinanceListQuery = z.infer<typeof financeListQuerySchema>;
export type FinanceCompareQuery = z.infer<typeof financeCompareQuerySchema>;
export type CreateLoanRateHistoryInput = z.infer<typeof createLoanRateHistorySchema>;
export type CreateContentSourceInput = z.infer<typeof createContentSourceSchema>;
export type UpdateContentSourceInput = z.infer<typeof updateContentSourceSchema>;
export type CreateFinanceFaqInput = z.infer<typeof createFinanceFaqSchema>;
export type UpdateFinanceFaqInput = z.infer<typeof updateFinanceFaqSchema>;
export type CreateFinanceComparisonInput = z.infer<typeof createFinanceComparisonSchema>;
export type UpdateFinanceComparisonInput = z.infer<typeof updateFinanceComparisonSchema>;
