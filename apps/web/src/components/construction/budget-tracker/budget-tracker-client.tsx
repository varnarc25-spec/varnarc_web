'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  BUDGET_CATEGORIES,
  BUDGET_PAYMENT_STATUSES,
  BUDGET_PAYMENT_STATUS_LABELS,
  BUDGET_QUALIFICATION,
  calculateBudgetTracker,
  decodeExpenseNotes,
  type BudgetPaymentStatus,
  type BudgetTrackerResult,
} from '@varnarc/validation';
import {
  CalculationResult,
  CalculatorShell,
  MethodologyPanel,
} from '@/components/construction/calculator';
import { ConstructionRelatedLinks } from '@/components/construction/construction-related-links';
import { GroupedBarChart, SimpleLineChart } from '@/components/shared/simple-chart';
import { cn, cx } from '@/components/construction/styles';
import { wizardMeta } from '@/components/construction/project-dashboard/dashboard-metrics';
import {
  trackCalculationAddedToProject,
  trackCalculatorCompleted,
  trackCalculatorError,
} from '@/lib/construction/analytics';
import type { ConstructionProject } from '@/services/construction';
import { BUDGET_TRACKER_FAQS, BUDGET_TRACKER_RELATED, BUDGET_TRACKER_SEO } from './content';

const CALC_TYPE = 'budget_tracker';

type BudgetLine = {
  id: string;
  category: string;
  name: string;
  plannedAmount: string;
  notes: string;
  persisted?: boolean;
};

type ExpenseRow = {
  id: string;
  date: string;
  category: string;
  description: string;
  vendor: string;
  amount: string;
  paymentStatus: BudgetPaymentStatus;
  notes: string;
  receiptUrl: string;
  persisted?: boolean;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatInr(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function newLine(partial?: Partial<BudgetLine>): BudgetLine {
  return {
    id: `bl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    category: 'Other',
    name: '',
    plannedAmount: '',
    notes: '',
    ...partial,
  };
}

function newExpense(partial?: Partial<ExpenseRow>): ExpenseRow {
  return {
    id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: todayIso(),
    category: 'Other',
    description: '',
    vendor: '',
    amount: '',
    paymentStatus: 'paid',
    notes: '',
    receiptUrl: '',
    ...partial,
  };
}

export function BudgetTrackerClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get('projectId');

  const [projectId, setProjectId] = useState<string | null>(projectIdParam);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [estimatedCost, setEstimatedCost] = useState('');
  const [lines, setLines] = useState<BudgetLine[]>([
    newLine({ category: 'RCC', name: 'Structural concrete', plannedAmount: '500000' }),
    newLine({ category: 'Masonry', name: 'Brick / block work', plannedAmount: '200000' }),
  ]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [expenseDraft, setExpenseDraft] = useState<ExpenseRow>(newExpense());
  const [result, setResult] = useState<BudgetTrackerResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/construction/projects', { cache: 'no-store' });
        if (res.status === 401 || !res.ok) return;
        const json = await res.json();
        const list = (json?.data ?? json ?? []) as ConstructionProject[];
        if (cancelled || !Array.isArray(list)) return;
        setProjects(list.map((p) => ({ id: p.id, name: p.name || 'Untitled project' })));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!projectIdParam) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/construction/projects/${projectIdParam}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const json = await res.json();
        const project = (json?.data ?? json) as ConstructionProject;
        if (cancelled || !project?.id) return;
        setProjectId(project.id);
        const meta = wizardMeta(project);
        if (project.estimatedCost != null) setEstimatedCost(String(project.estimatedCost));
        else if (meta?.budgetInr != null) setEstimatedCost(String(meta.budgetInr));

        const budgetItems = project.budgetItems ?? [];
        const expenseItems = project.expenses ?? [];

        if (budgetItems.length) {
          setLines(
            budgetItems.map((b) => ({
              id: b.id,
              category: b.category || 'Other',
              name: b.name,
              plannedAmount: String(b.plannedAmount ?? ''),
              notes: b.notes ?? '',
              persisted: true,
            })),
          );
        }
        if (expenseItems.length) {
          setExpenses(
            expenseItems.map((e) => {
              const { userNotes, meta: noteMeta } = decodeExpenseNotes(e.notes);
              return {
                id: e.id,
                date: e.spentOn ? String(e.spentOn).slice(0, 10) : todayIso(),
                category: noteMeta?.category || 'Other',
                description: e.name || '',
                vendor: noteMeta?.vendor ?? '',
                amount: String(e.amount ?? ''),
                paymentStatus: (noteMeta?.paymentStatus as BudgetPaymentStatus) || 'paid',
                notes: userNotes,
                receiptUrl: noteMeta?.receiptUrl ?? '',
                persisted: true,
              };
            }),
          );
        }
        setLoadMsg(`Loaded budget data from “${project.name}”.`);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectIdParam]);

  function compute(): BudgetTrackerResult | null {
    try {
      return calculateBudgetTracker({
        currency: 'INR',
        estimatedProjectCost: estimatedCost.trim() ? estimatedCost : null,
        budgetLines: lines
          .filter((l) => l.name.trim() && l.plannedAmount.trim())
          .map((l) => ({
            id: l.id,
            category: l.category,
            name: l.name.trim(),
            plannedAmount: l.plannedAmount,
            notes: l.notes.trim() || null,
          })),
        expenses: expenses
          .filter((e) => e.description.trim() && e.amount.trim())
          .map((e) => ({
            id: e.id,
            date: e.date,
            category: e.category,
            description: e.description.trim(),
            vendor: e.vendor.trim() || null,
            amount: e.amount,
            paymentStatus: e.paymentStatus,
            notes: e.notes.trim() || null,
            receiptUrl: e.receiptUrl.trim() || null,
          })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not calculate budget');
      return null;
    }
  }

  function runRecalc(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setActionMsg(null);
    const next = compute();
    if (!next) {
      trackCalculatorError({
        calculator_type: CALC_TYPE,
        error_code: 'calc_failed',
        logged_in: Boolean(projectId),
      });
      setResult(null);
      return;
    }
    setResult(next);
    trackCalculatorCompleted({
      calculator_type: CALC_TYPE,
      unit: 'INR',
      result_range_category:
        next.metrics.totalBudget <= 500_000
          ? 'low'
          : next.metrics.totalBudget <= 5_000_000
            ? 'mid'
            : 'high',
      logged_in: Boolean(projectId),
    });
  }

  function addExpenseLocal() {
    if (!expenseDraft.description.trim() || !expenseDraft.amount.trim()) {
      setActionMsg('Enter expense description and amount.');
      return;
    }
    setExpenses((prev) => [...prev, { ...expenseDraft, id: newExpense().id }]);
    setExpenseDraft(newExpense({ category: expenseDraft.category }));
    setActionMsg('Expense added locally — recalculate, then save to project if needed.');
  }

  async function persistNewLinesAndExpenses() {
    if (!projectId) {
      setActionMsg('Choose a project to persist budget lines and expenses.');
      return;
    }
    setSaveLoading(true);
    setActionMsg(null);
    try {
      const toSaveLines = lines.filter(
        (l) => !l.persisted && l.name.trim() && l.plannedAmount.trim(),
      );
      for (const line of toSaveLines) {
        const res = await fetch(`/api/construction/projects/${projectId}/budget-items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: line.category,
            name: line.name.trim(),
            plannedAmount: Number(line.plannedAmount),
            currency: 'INR',
            notes: line.notes.trim() || null,
          }),
        });
        if (res.status === 401) {
          setActionMsg('Sign in to save budget data.');
          return;
        }
        if (!res.ok) throw new Error('Failed to save budget line');
      }

      const toSaveExp = expenses.filter(
        (e) => !e.persisted && e.description.trim() && e.amount.trim(),
      );
      for (const exp of toSaveExp) {
        const res = await fetch(`/api/construction/projects/${projectId}/expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: exp.description.trim(),
            amount: Number(exp.amount),
            currency: 'INR',
            spentOn: exp.date,
            category: exp.category,
            vendor: exp.vendor.trim() || null,
            paymentStatus: exp.paymentStatus,
            receiptUrl: exp.receiptUrl.trim() || null,
            notes: exp.notes.trim() || null,
          }),
        });
        if (res.status === 401) {
          setActionMsg('Sign in to save expenses.');
          return;
        }
        if (!res.ok) throw new Error('Failed to save expense');
      }

      const next = compute();
      if (next) setResult(next);
      setActionMsg('Saved new budget lines and expenses to project.');
      trackCalculationAddedToProject({ calculator_type: CALC_TYPE, logged_in: true });
      router.push(`/construction/project/${projectId}?tab=budget`);
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaveLoading(false);
    }
  }

  const chartCategoryData = useMemo(
    () =>
      (result?.byCategory ?? []).map((c) => ({
        category: c.category,
        Budget: c.budget,
        Spent: c.spent,
        Committed: c.committed,
      })),
    [result],
  );

  const chartCumulative = useMemo(
    () =>
      (result?.cumulativeSpending ?? []).map((p) => ({
        date: p.date,
        Spent: p.cumulativeSpent,
        Committed: p.cumulativeCommitted,
        Outflow: p.cumulativeOutflow,
      })),
    [result],
  );

  const formNode = (
    <form className={cn(cx.card, 'space-y-5 p-4 sm:p-5')} onSubmit={runRecalc}>
      <aside className="rounded-xl border border-amber-200 bg-amber-50 p-3 sm:p-4">
        <p className="text-sm font-semibold text-[#0b1f3a]">Planning tracker</p>
        <p className="mt-1 text-sm text-slate-700">{BUDGET_QUALIFICATION}</p>
      </aside>
      {loadMsg ? <p className="text-sm text-slate-600">{loadMsg}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Project</span>
          <select
            className={cx.input}
            value={projectId ?? ''}
            onChange={(e) => setProjectId(e.target.value || null)}
          >
            <option value="">Select project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            Estimated project cost (optional)
          </span>
          <input
            className={cx.input}
            type="number"
            min={0}
            step="0.01"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
            placeholder="From cost calculator / quote"
          />
        </label>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-[#0b1f3a]">Estimated budget categories</h3>
          <button
            type="button"
            className={cx.secondaryBtn}
            onClick={() => setLines((prev) => [...prev, newLine()])}
          >
            Add budget line
          </button>
        </div>
        <div className="space-y-3">
          {lines.map((line) => (
            <div
              key={line.id}
              className="grid gap-2 rounded-lg border border-slate-100 p-3 sm:grid-cols-4"
            >
              <select
                className={cx.input}
                value={line.category}
                onChange={(e) =>
                  setLines((prev) =>
                    prev.map((l) => (l.id === line.id ? { ...l, category: e.target.value } : l)),
                  )
                }
              >
                {BUDGET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                className={cx.input}
                placeholder="Line name"
                value={line.name}
                onChange={(e) =>
                  setLines((prev) =>
                    prev.map((l) => (l.id === line.id ? { ...l, name: e.target.value } : l)),
                  )
                }
              />
              <input
                className={cx.input}
                type="number"
                min={0}
                step="0.01"
                placeholder="Planned amount"
                value={line.plannedAmount}
                onChange={(e) =>
                  setLines((prev) =>
                    prev.map((l) =>
                      l.id === line.id ? { ...l, plannedAmount: e.target.value } : l,
                    ),
                  )
                }
              />
              <button
                type="button"
                className="text-sm text-slate-500 hover:underline"
                onClick={() => setLines((prev) => prev.filter((l) => l.id !== line.id))}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-[#0b1f3a]">Add expense</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Date</span>
            <input
              className={cx.input}
              type="date"
              value={expenseDraft.date}
              onChange={(e) => setExpenseDraft((d) => ({ ...d, date: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Category</span>
            <select
              className={cx.input}
              value={expenseDraft.category}
              onChange={(e) => setExpenseDraft((d) => ({ ...d, category: e.target.value }))}
            >
              {BUDGET_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Description</span>
            <input
              className={cx.input}
              value={expenseDraft.description}
              onChange={(e) => setExpenseDraft((d) => ({ ...d, description: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Vendor (optional)</span>
            <input
              className={cx.input}
              value={expenseDraft.vendor}
              onChange={(e) => setExpenseDraft((d) => ({ ...d, vendor: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Amount</span>
            <input
              className={cx.input}
              type="number"
              min={0}
              step="0.01"
              value={expenseDraft.amount}
              onChange={(e) => setExpenseDraft((d) => ({ ...d, amount: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Payment status</span>
            <select
              className={cx.input}
              value={expenseDraft.paymentStatus}
              onChange={(e) =>
                setExpenseDraft((d) => ({
                  ...d,
                  paymentStatus: e.target.value as BudgetPaymentStatus,
                }))
              }
            >
              {BUDGET_PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {BUDGET_PAYMENT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-600">Notes</span>
            <input
              className={cx.input}
              value={expenseDraft.notes}
              onChange={(e) => setExpenseDraft((d) => ({ ...d, notes: e.target.value }))}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-600">Receipt / document link (optional)</span>
            <input
              className={cx.input}
              type="url"
              placeholder="https://…"
              value={expenseDraft.receiptUrl}
              onChange={(e) => setExpenseDraft((d) => ({ ...d, receiptUrl: e.target.value }))}
            />
          </label>
        </div>
        <button type="button" className={cn(cx.secondaryBtn, 'mt-3')} onClick={addExpenseLocal}>
          Add expense
        </button>
      </div>

      {expenses.length ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-[#0b1f3a]">Expenses</h3>
          <ul className="space-y-2 text-sm">
            {expenses.map((e) => (
              <li
                key={e.id}
                className={cn(cx.card, 'flex flex-wrap items-start justify-between gap-2 p-3')}
              >
                <div>
                  <p className="font-medium text-[#0b1f3a]">
                    {e.description} · {formatInr(Number(e.amount) || 0)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {e.date} · {e.category} · {BUDGET_PAYMENT_STATUS_LABELS[e.paymentStatus]}
                    {e.vendor ? ` · ${e.vendor}` : ''}
                  </p>
                  {e.receiptUrl ? (
                    <a
                      href={e.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#f97316] hover:underline"
                    >
                      Receipt link
                    </a>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="text-xs text-slate-500 hover:underline"
                  onClick={() => setExpenses((prev) => prev.filter((x) => x.id !== e.id))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="submit" className={cx.primaryBtn}>
          Recalculate metrics
        </button>
        <button
          type="button"
          className={cx.secondaryBtn}
          disabled={saveLoading}
          onClick={() => void persistNewLinesAndExpenses()}
        >
          {saveLoading ? 'Saving…' : 'Save to project'}
        </button>
        <Link
          href="/construction/project/new"
          className="text-sm font-medium text-[#f97316] hover:underline self-center"
        >
          Create project
        </Link>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {actionMsg ? <p className="text-sm text-slate-600">{actionMsg}</p> : null}
    </form>
  );

  const m = result?.metrics;
  const resultNode =
    result && m ? (
      <div className="space-y-4">
        <CalculationResult
          label="Projected final cost"
          value={formatInr(m.projectedFinalCost)}
          hint={result.qualification}
          metrics={[
            { label: 'Total budget', value: formatInr(m.totalBudget) },
            {
              label: 'Estimated project cost',
              value: m.estimatedProjectCost != null ? formatInr(m.estimatedProjectCost) : '—',
            },
            { label: 'Spent', value: formatInr(m.spent) },
            { label: 'Committed', value: formatInr(m.committed) },
            { label: 'Remaining', value: formatInr(m.remaining) },
            {
              label: 'Variance',
              value: formatInr(m.variance),
              hint: m.variance >= 0 ? 'Under / at projected' : 'Over projected',
            },
          ]}
        />

        {chartCategoryData.length ? (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[#0b1f3a]">
              Budget vs actual by category
            </h3>
            <GroupedBarChart
              data={chartCategoryData}
              xKey="category"
              series={[
                { key: 'Budget', color: '#0b1f3a', name: 'Budget' },
                { key: 'Spent', color: '#f97316', name: 'Spent' },
                { key: 'Committed', color: '#94a3b8', name: 'Committed' },
              ]}
            />
          </div>
        ) : null}

        {chartCumulative.length ? (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[#0b1f3a]">
              Cumulative spending over time
            </h3>
            <SimpleLineChart
              data={chartCumulative}
              xKey="date"
              series={[
                { key: 'Spent', color: '#f97316', name: 'Cumulative spent' },
                { key: 'Committed', color: '#64748b', name: 'Cumulative committed' },
                { key: 'Outflow', color: '#0b1f3a', name: 'Cumulative outflow' },
              ]}
            />
          </div>
        ) : (
          <p className="text-sm text-slate-500">Add dated expenses to see cumulative spending.</p>
        )}

        <MethodologyPanel title="Assumptions" steps={result.assumptions} />
      </div>
    ) : null;

  return (
    <>
      <CalculatorShell
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/construction' },
          { label: 'Budget tracker' },
        ]}
        title="Construction Project Budget Tracker"
        description={BUDGET_TRACKER_SEO}
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        formula={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs sm:text-sm">
              Remaining = Budget − Spent − Committed · Projected final = Budget (or Spent+Committed
              if over-allocated) · Variance = Budget − Projected final
            </p>
            <p>Money totals use integer minor units for precise decimal arithmetic.</p>
          </div>
        }
        faqs={BUDGET_TRACKER_FAQS}
        stickyCta={{
          primary: { label: 'Recalculate', onClick: () => runRecalc() },
          secondary: {
            label: 'Save',
            onClick: () => void persistNewLinesAndExpenses(),
          },
        }}
      />
      <div className="site-container pb-12 print:hidden">
        <ConstructionRelatedLinks calculators={BUDGET_TRACKER_RELATED} />
      </div>
    </>
  );
}
