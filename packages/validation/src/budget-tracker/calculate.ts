import { BUDGET_CALC_VERSION, BUDGET_QUALIFICATION } from './rates';
import { addMinor, fromMinor, subMinor, toMinor, type MoneyMinor } from './money';
import {
  budgetTrackerInputSchema,
  type BudgetCategoryBreakdown,
  type BudgetCumulativePoint,
  type BudgetTrackerInput,
  type BudgetTrackerResult,
} from './types';

function isSpentStatus(status: string): boolean {
  return status === 'paid';
}

function isCommittedStatus(status: string): boolean {
  return status === 'committed' || status === 'pending' || status === 'partial';
}

/**
 * Aggregate budget lines and expenses with integer minor-unit arithmetic.
 */
export function calculateBudgetTracker(raw: BudgetTrackerInput): BudgetTrackerResult {
  const input = budgetTrackerInputSchema.parse(raw);
  const currency = input.currency.toUpperCase();

  let totalBudgetMinor: MoneyMinor = 0;
  const budgetByCat = new Map<string, MoneyMinor>();

  for (const line of input.budgetLines) {
    const amt = toMinor(line.plannedAmount);
    totalBudgetMinor = addMinor(totalBudgetMinor, amt);
    budgetByCat.set(line.category, addMinor(budgetByCat.get(line.category) ?? 0, amt));
  }

  let spentMinor: MoneyMinor = 0;
  let committedMinor: MoneyMinor = 0;
  const spentByCat = new Map<string, MoneyMinor>();
  const committedByCat = new Map<string, MoneyMinor>();

  type DayAgg = { spent: MoneyMinor; committed: MoneyMinor };
  const byDay = new Map<string, DayAgg>();

  for (const exp of input.expenses) {
    const amt = toMinor(exp.amount);
    const day = exp.date.slice(0, 10);
    const bucket = byDay.get(day) ?? { spent: 0, committed: 0 };

    if (isSpentStatus(exp.paymentStatus)) {
      spentMinor = addMinor(spentMinor, amt);
      spentByCat.set(exp.category, addMinor(spentByCat.get(exp.category) ?? 0, amt));
      bucket.spent = addMinor(bucket.spent, amt);
    } else if (isCommittedStatus(exp.paymentStatus)) {
      committedMinor = addMinor(committedMinor, amt);
      committedByCat.set(exp.category, addMinor(committedByCat.get(exp.category) ?? 0, amt));
      bucket.committed = addMinor(bucket.committed, amt);
    }
    byDay.set(day, bucket);
  }

  const allocatedMinor = addMinor(spentMinor, committedMinor);
  const remainingMinor = subMinor(totalBudgetMinor, allocatedMinor);
  // If over-allocated, remaining is negative (over budget on commitments)
  const projectedFinalMinor = remainingMinor >= 0 ? totalBudgetMinor : allocatedMinor; // overspend/commit: projected = what is already out/locked

  const estimatedMinor =
    input.estimatedProjectCost != null && String(input.estimatedProjectCost).trim() !== ''
      ? toMinor(input.estimatedProjectCost)
      : null;

  const varianceMinor = subMinor(totalBudgetMinor, projectedFinalMinor);

  const categories = new Set<string>([
    ...budgetByCat.keys(),
    ...spentByCat.keys(),
    ...committedByCat.keys(),
  ]);

  const byCategory: BudgetCategoryBreakdown[] = [...categories]
    .sort((a, b) => a.localeCompare(b))
    .map((category) => {
      const budget = budgetByCat.get(category) ?? 0;
      const spent = spentByCat.get(category) ?? 0;
      const committed = committedByCat.get(category) ?? 0;
      return {
        category,
        budget: fromMinor(budget),
        spent: fromMinor(spent),
        committed: fromMinor(committed),
        remaining: fromMinor(subMinor(budget, addMinor(spent, committed))),
      };
    });

  const dates = [...byDay.keys()].sort();
  let cumSpent: MoneyMinor = 0;
  let cumCommitted: MoneyMinor = 0;
  const cumulativeSpending: BudgetCumulativePoint[] = dates.map((date) => {
    const d = byDay.get(date)!;
    cumSpent = addMinor(cumSpent, d.spent);
    cumCommitted = addMinor(cumCommitted, d.committed);
    return {
      date,
      cumulativeSpent: fromMinor(cumSpent),
      cumulativeCommitted: fromMinor(cumCommitted),
      cumulativeOutflow: fromMinor(addMinor(cumSpent, cumCommitted)),
    };
  });

  return {
    currency,
    metrics: {
      totalBudget: fromMinor(totalBudgetMinor),
      estimatedProjectCost: estimatedMinor != null ? fromMinor(estimatedMinor) : null,
      spent: fromMinor(spentMinor),
      committed: fromMinor(committedMinor),
      remaining: fromMinor(remainingMinor),
      projectedFinalCost: fromMinor(projectedFinalMinor),
      variance: fromMinor(varianceMinor),
    },
    byCategory,
    cumulativeSpending,
    assumptions: [
      'Amounts are summed in integer minor units (e.g. paise) then converted to major units.',
      'Paid expenses count as Spent; pending / committed / partial count as Committed.',
      'Remaining = Total budget − Spent − Committed (can be negative if over-allocated).',
      'Projected final cost = Total budget when under/at allocation; otherwise Spent + Committed.',
      'Variance = Total budget − Projected final cost (positive = under projected).',
      BUDGET_QUALIFICATION,
    ],
    qualification: BUDGET_QUALIFICATION,
    version: BUDGET_CALC_VERSION,
  };
}

export function encodeExpenseNotes(input: {
  userNotes?: string | null;
  category: string;
  vendor?: string | null;
  paymentStatus: string;
  receiptUrl?: string | null;
}): string {
  const meta = {
    v: 1,
    category: input.category,
    vendor: input.vendor ?? null,
    paymentStatus: input.paymentStatus,
    receiptUrl: input.receiptUrl ?? null,
  };
  const block = `<!--varnarc-budget:${JSON.stringify(meta)}-->`;
  const user = (input.userNotes ?? '').trim();
  return (user ? `${user}\n${block}` : block).slice(0, 2000);
}

export function decodeExpenseNotes(notes: string | null | undefined): {
  userNotes: string;
  meta: {
    category?: string;
    vendor?: string | null;
    paymentStatus?: string;
    receiptUrl?: string | null;
  } | null;
} {
  if (!notes) return { userNotes: '', meta: null };
  const match = notes.match(/<!--varnarc-budget:(\{.*?\})-->/);
  if (!match) return { userNotes: notes, meta: null };
  try {
    const meta = JSON.parse(match[1]!) as {
      category?: string;
      vendor?: string | null;
      paymentStatus?: string;
      receiptUrl?: string | null;
    };
    return { userNotes: notes.replace(match[0], '').trim(), meta };
  } catch {
    return { userNotes: notes, meta: null };
  }
}
