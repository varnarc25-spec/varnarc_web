/** Construction Affordability Calculator — types & Zod input. */

import { z } from 'zod';

export const affordabilityCostInputSchema = z.object({
  /** Mid / estimated project cost before extra contingency buffer (₹). */
  estimatedProjectCost: z.number().positive().max(500_000_000),
  availableSavings: z.number().min(0).max(500_000_000),
  expectedLoanAmount: z.number().min(0).max(500_000_000).default(0),
  monthlyIncome: z.number().positive().max(50_000_000).optional().nullable(),
  monthlyEmi: z.number().min(0).max(50_000_000).optional().nullable(),
  /** Planned construction duration in months. */
  constructionDurationMonths: z.number().int().min(1).max(120).default(18),
  /**
   * Contingency already included in estimatedProjectCost (percent).
   * Used to explain / recommend an additional buffer if too low.
   */
  contingencyAlreadyPercent: z.number().min(0).max(40).optional().default(10),
  /** Extra contingency reserve the user wants to hold (percent of project cost). */
  contingencyReservePercent: z.number().min(0).max(40).optional().default(10),
  /** Optional label for linked Varnarc calculation source. */
  sourceLabel: z.string().max(120).optional().nullable(),
});

export type AffordabilityCostInput = z.infer<typeof affordabilityCostInputSchema>;

export type AffordabilityStatus = 'surplus' | 'balanced' | 'gap';

export type AffordabilityCostResult = {
  currency: 'INR';
  estimatedProjectCost: number;
  contingencyReservePercent: number;
  contingencyReserveAmount: number;
  recommendedContingencyPercent: number;
  recommendedContingencyAmount: number;
  totalFundingNeed: number;
  availableSavings: number;
  expectedLoanAmount: number;
  availableFunds: number;
  fundingDifference: number;
  status: AffordabilityStatus;
  constructionDurationMonths: number;
  monthlyCashRequirement: number;
  peakCashRequirement: number;
  financing: {
    monthlyEmi: number;
    monthlyIncome: number;
    emiToIncomePercent: number;
    residualIncomeAfterEmi: number;
    note: string;
  } | null;
  sourceLabel: string | null;
  assumptions: string[];
  methodology: { title: string; steps: string[] };
  disclaimer: string;
  version: string;
};
