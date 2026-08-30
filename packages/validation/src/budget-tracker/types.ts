/** Budget tracker schemas & result types. */

import { z } from 'zod';
import { BUDGET_PAYMENT_STATUSES } from './rates';

export const budgetPaymentStatusSchema = z.enum(BUDGET_PAYMENT_STATUSES);

export const budgetLineInputSchema = z.object({
  id: z.string().min(1).max(64),
  category: z.string().min(1).max(80),
  name: z.string().min(1).max(150),
  /** Major units as decimal string or number — converted to minor internally */
  plannedAmount: z.union([z.number(), z.string()]),
  notes: z.string().max(2000).optional().nullable(),
});

export const budgetExpenseInputSchema = z.object({
  id: z.string().min(1).max(64),
  date: z.string().min(1).max(32), // YYYY-MM-DD
  category: z.string().min(1).max(80),
  description: z.string().min(1).max(150),
  vendor: z.string().max(200).optional().nullable(),
  amount: z.union([z.number(), z.string()]),
  paymentStatus: budgetPaymentStatusSchema.default('paid'),
  notes: z.string().max(2000).optional().nullable(),
  receiptUrl: z.string().max(500).optional().nullable(),
  budgetItemId: z.string().max(64).optional().nullable(),
});

export const budgetTrackerInputSchema = z.object({
  currency: z.string().length(3).default('INR'),
  /** Optional overall estimate from project / cost calculator */
  estimatedProjectCost: z.union([z.number(), z.string()]).optional().nullable(),
  budgetLines: z.array(budgetLineInputSchema).max(500),
  expenses: z.array(budgetExpenseInputSchema).max(5000),
});

export type BudgetLineInput = z.input<typeof budgetLineInputSchema>;
export type BudgetExpenseInput = z.input<typeof budgetExpenseInputSchema>;
export type BudgetTrackerInput = z.input<typeof budgetTrackerInputSchema>;

export type BudgetCategoryBreakdown = {
  category: string;
  budget: number;
  spent: number;
  committed: number;
  remaining: number;
};

export type BudgetCumulativePoint = {
  date: string;
  cumulativeSpent: number;
  cumulativeCommitted: number;
  cumulativeOutflow: number;
};

export type BudgetTrackerMetrics = {
  totalBudget: number;
  estimatedProjectCost: number | null;
  spent: number;
  committed: number;
  remaining: number;
  projectedFinalCost: number;
  variance: number;
};

export type BudgetTrackerResult = {
  currency: string;
  metrics: BudgetTrackerMetrics;
  byCategory: BudgetCategoryBreakdown[];
  cumulativeSpending: BudgetCumulativePoint[];
  assumptions: string[];
  qualification: string;
  version: string;
};
