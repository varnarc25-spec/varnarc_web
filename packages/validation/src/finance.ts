import { z } from 'zod';
import {
  cursorPaginationQuerySchema,
  jsonValueSchema,
  publishStatusSchema,
  slugSchema,
  uuidSchema,
} from './common';

export const createFinanceCategorySchema = z.object({
  name: z.string().min(1).max(150),
  slug: slugSchema,
  description: z.string().max(2000).optional().nullable(),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const updateFinanceCategorySchema = createFinanceCategorySchema.partial();

export const createBankSchema = z.object({
  name: z.string().min(1).max(150),
  slug: slugSchema,
  logoUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  logoMediaId: uuidSchema.optional().nullable(),
  website: z.string().url().max(500).optional().nullable().or(z.literal('')),
  description: z.string().max(5000).optional().nullable(),
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
  description: z.string().max(5000).optional().nullable(),
  interestRate: z.number().min(0).max(100).optional().nullable(),
  processingFee: z.number().min(0).max(100).optional().nullable(),
  tenureMin: z.number().int().min(1).optional().nullable(),
  tenureMax: z.number().int().min(1).optional().nullable(),
  maxAmount: z.number().min(0).optional().nullable(),
  eligibility: z.string().max(5000).optional().nullable(),
  affiliateUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  pros: z.string().max(5000).optional().nullable(),
  cons: z.string().max(5000).optional().nullable(),
  featured: z.boolean().default(false),
  status: publishStatusSchema.default('DRAFT'),
  metadata: jsonValueSchema.optional().nullable(),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
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
  loanType: z.string().max(80).optional(),
  productType: z.string().max(80).optional(),
  featured: z.coerce.boolean().optional(),
});

export const financeCompareQuerySchema = z.object({
  type: z.enum(['loans', 'credit-cards', 'insurance', 'investments']),
  ids: z
    .string()
    .min(1)
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean))
    .pipe(z.array(uuidSchema).min(2).max(6)),
});

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
