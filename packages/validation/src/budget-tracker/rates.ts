/** Construction Project Budget Tracker — categories & qualification. */

import { BOQ_CATEGORIES } from '../boq-generator/rates';

export const BUDGET_CALC_VERSION = '2026.08.1';

export const BUDGET_QUALIFICATION =
  'Budget figures are planning trackers based on amounts you enter. They are not audited accounts, tax records, or guaranteed project cost forecasts.';

/** Prefer BOQ categories; allow a few budget-specific extras. */
export const BUDGET_CATEGORIES = [
  ...BOQ_CATEGORIES,
  'Contingency',
  'Professional fees',
  'Labour',
  'Equipment',
  'Permits & approvals',
] as const;

export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export const BUDGET_PAYMENT_STATUSES = ['paid', 'pending', 'committed', 'partial'] as const;

export type BudgetPaymentStatus = (typeof BUDGET_PAYMENT_STATUSES)[number];

export const BUDGET_PAYMENT_STATUS_LABELS: Record<BudgetPaymentStatus, string> = {
  paid: 'Paid',
  pending: 'Pending',
  committed: 'Committed',
  partial: 'Partial',
};
