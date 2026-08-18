'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { formatInr } from '@/components/loans/loan-format';
import { useBusinessLoanDecision } from '@/components/loans/business-loan-decision-context';
import { calculatorHref } from '@/lib/finance-routes';
import {
  BUSINESS_FUNDING_PURPOSES,
  BUSINESS_LOAN_TIMELINE_STEPS,
  BUSINESS_VINTAGE_TIMELINE,
  breakEvenAdditionalSales,
  breakEvenValidationMessage,
  calculateIllustrativeDscr,
  cashFlowHeadroomLabel,
  clampNonNegative,
  estimateBusinessLoanPrepaymentImpact,
  estimateTotalBorrowingCost,
  facilityHintLabel,
  stressTestBusinessCashFlow,
  tenureComparisonRows,
  turnoverLoanRatio,
  vintageTimelineStepId,
  type BusinessSecurityMode,
  type PrepaymentMode,
} from '@/lib/business-loan-page';

function MoneyField({
  label,
  value,
  onChange,
  hint,
  readOnly,
}: {
  label: string;
  value: number;
  onChange?: (n: number) => void;
  hint?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input
        type="number"
        min={0}
        inputMode="numeric"
        readOnly={readOnly}
        value={Number.isFinite(value) ? value : 0}
        onChange={onChange ? (e) => onChange(Number(e.target.value)) : undefined}
        className={`mt-1.5 min-h-11 w-full rounded-[var(--bl-radius-md)] border border-[var(--bl-border)] px-3 text-sm font-semibold tabular-nums text-[var(--bl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)]/30 ${
          readOnly ? 'bg-[var(--bl-surface-2)]' : 'bg-white'
        }`}
      />
      {hint ? (
        <span className="mt-1 block text-xs font-normal text-[var(--bl-muted)] sm:text-sm">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function FlowArrow() {
  return (
    <div className="flex justify-center py-1 text-[var(--bl-muted)]" aria-hidden>
      <span className="text-sm font-semibold">↓</span>
    </div>
  );
}

export function BusinessLoanPurposeCards() {
  const { purpose, setPurpose, facilityHint } = useBusinessLoanDecision();

  return (
    <section
      id="bl-purpose"
      aria-labelledby="bl-purpose-heading"
      className="full-bleed bg-[var(--bl-surface-1)]"
    >
      <div className="site-container bl-section px-4">
        <p className="bl-eyebrow">Funding Purpose</p>
        <h2 id="bl-purpose-heading" className="bl-h2">
          What Do You Need Business Funding For?
        </h2>
        <p className="bl-lede">
          Purpose helps frame working-capital vs term exploration. Exact product fit is
          lender-specific.
        </p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BUSINESS_FUNDING_PURPOSES.map((p) => {
            const selected = purpose === p.id;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setPurpose(p.id)}
                  className={`h-full w-full rounded-[var(--bl-radius-md)] p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)] ${
                    selected
                      ? 'bg-white ring-2 ring-[var(--bl-navy)]/25'
                      : 'bg-[var(--bl-surface-2)] hover:bg-white'
                  }`}
                >
                  <h3 className="text-sm font-bold text-[var(--bl-navy)]">{p.label}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--bl-muted)]">
                    {p.summary}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-5 text-sm font-semibold text-[var(--bl-navy)]">
          {facilityHintLabel(facilityHint)}
        </p>
      </div>
    </section>
  );
}

export function BusinessLoanWcVsTerm() {
  const { facilityHint, purpose } = useBusinessLoanDecision();
  const purposeLabel =
    BUSINESS_FUNDING_PURPOSES.find((p) => p.id === purpose)?.label ?? 'Selected purpose';

  return (
    <section
      id="bl-wc-vs-term"
      aria-labelledby="bl-wc-vs-term-heading"
      className="full-bleed bg-[var(--bl-surface-4)]"
    >
      <div className="site-container bl-section px-4">
        <p className="bl-eyebrow">Facility Structure</p>
        <h2 id="bl-wc-vs-term-heading" className="bl-h2">
          Working Capital vs Term Loan
        </h2>
        <p className="bl-lede">
          Scannable comparison for planning. Neither structure is universally better — product terms
          vary by lender.
        </p>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <article
            className={`bg-[var(--bl-surface-1)] p-5 sm:p-6 ${
              facilityHint === 'working_capital' ? 'ring-2 ring-[var(--bl-navy)]/20' : ''
            }`}
          >
            <div className="mb-4 flex h-16 items-center" aria-hidden>
              <svg viewBox="0 0 200 64" className="h-14 w-full max-w-[200px]" fill="none">
                <rect x="8" y="28" width="28" height="24" rx="4" fill="#0b1f3a" />
                <rect x="42" y="20" width="28" height="32" rx="4" fill="#122b4a" />
                <rect x="76" y="32" width="28" height="20" rx="4" fill="#0b1f3a" opacity="0.85" />
                <path d="M118 36h40" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                <path
                  d="M150 28l8 8-8 8"
                  stroke="#f97316"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect
                  x="164"
                  y="24"
                  width="28"
                  height="24"
                  rx="4"
                  fill="#eef2f7"
                  stroke="#cbd5e1"
                />
                <path
                  d="M170 36h16M170 42h10"
                  stroke="#0b1f3a"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[var(--bl-navy)]">Working Capital</h3>
            <p className="mt-2 text-sm font-semibold text-slate-700">Typical purpose</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Short-term operating requirements
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-700">Examples</p>
            <ul className="mt-1.5 space-y-1.5 text-sm text-slate-600">
              {[
                'Inventory',
                'Supplier payments',
                'Payroll timing',
                'Receivables gap',
                'Seasonality',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--bl-orange)]" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm font-semibold text-slate-700">
              Typical financing characteristic
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Focused on operational liquidity
            </p>
          </article>
          <article
            className={`bg-[var(--bl-surface-2)] p-5 sm:p-6 ${
              facilityHint === 'term_loan' ? 'ring-2 ring-[var(--bl-navy)]/20' : ''
            }`}
          >
            <div className="mb-4 flex h-16 items-center" aria-hidden>
              <svg viewBox="0 0 200 64" className="h-14 w-full max-w-[200px]" fill="none">
                <rect x="12" y="36" width="48" height="16" rx="3" fill="#0b1f3a" />
                <rect x="20" y="18" width="12" height="18" rx="2" fill="#122b4a" />
                <rect x="40" y="12" width="14" height="24" rx="2" fill="#0b1f3a" />
                <circle cx="24" cy="54" r="6" fill="#94a3b8" />
                <circle cx="48" cy="54" r="6" fill="#94a3b8" />
                <path d="M80 40h96" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
                <circle cx="96" cy="40" r="5" fill="#f97316" />
                <circle cx="128" cy="40" r="5" fill="#0b1f3a" />
                <circle cx="160" cy="40" r="5" fill="#0b1f3a" />
                <text x="90" y="58" fill="#64748b" fontSize="8" fontFamily="system-ui,sans-serif">
                  repayment timeline
                </text>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[var(--bl-navy)]">Term Loan</h3>
            <p className="mt-2 text-sm font-semibold text-slate-700">Typical purpose</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Planned longer-term expenditure
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-700">Examples</p>
            <ul className="mt-1.5 space-y-1.5 text-sm text-slate-600">
              {['Machinery', 'Equipment', 'Expansion', 'Renovation', 'Business infrastructure'].map(
                (item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--bl-orange)]" />
                    {item}
                  </li>
                ),
              )}
            </ul>
            <p className="mt-4 text-sm font-semibold text-slate-700">
              Typical financing characteristic
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Structured repayment over an agreed tenure
            </p>
          </article>
        </div>
        <div className="mt-6 rounded-[var(--bl-radius-md)] bg-white/80 px-4 py-4 ring-1 ring-[var(--bl-border)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--bl-muted)]">
            Based on your selected purpose
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--bl-navy)] sm:text-base">
            {purposeLabel}: {facilityHintLabel(facilityHint)}
          </p>
          <p className="mt-1 text-sm text-[var(--bl-muted)]">
            Confirm with lender products — this is not a product recommendation.
          </p>
        </div>
      </div>
    </section>
  );
}

export function BusinessLoanCashFlow() {
  const {
    monthlyRevenue,
    setMonthlyRevenue,
    monthlyOpExpenses,
    setMonthlyOpExpenses,
    existingMonthlyDebt,
    setExistingMonthlyDebt,
    otherCommitments,
    setOtherCommitments,
    emi,
    cashFlow,
  } = useBusinessLoanDecision();

  const proposedEmi = emi?.monthlyEmi ?? 0;
  const remaining = cashFlow?.surplusAfterProposedEmi ?? null;
  const isShortfall = remaining != null && remaining < 0;

  const steps: Array<{
    key: string;
    label: string;
    value: number;
    tone: 'navy' | 'neutral' | 'orange';
  }> = [
    { key: 'rev', label: 'Monthly Revenue', value: monthlyRevenue, tone: 'navy' },
    { key: 'exp', label: 'Operating Expenses', value: -monthlyOpExpenses, tone: 'neutral' },
    { key: 'debt', label: 'Existing Debt', value: -existingMonthlyDebt, tone: 'neutral' },
    ...(otherCommitments > 0
      ? [
          {
            key: 'other',
            label: 'Other Recurring Commitments',
            value: -otherCommitments,
            tone: 'neutral' as const,
          },
        ]
      : []),
    { key: 'emi', label: 'Proposed Loan EMI', value: -proposedEmi, tone: 'orange' },
  ];

  return (
    <section
      id="bl-cash-flow"
      aria-labelledby="bl-cash-flow-heading"
      className="full-bleed bg-[var(--bl-surface-1)]"
    >
      <div className="site-container bl-section px-4">
        <p className="bl-eyebrow">Cash Flow</p>
        <h2 id="bl-cash-flow-heading" className="bl-h2">
          Can Your Business Support This EMI?
        </h2>
        <p className="bl-lede">
          Illustrative monthly cash-flow assessment. Lenders use their own frameworks — this is
          planning only.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MoneyField
            label="Average Monthly Revenue (₹)"
            value={monthlyRevenue}
            onChange={setMonthlyRevenue}
          />
          <MoneyField
            label="Average Monthly Operating Expenses (₹)"
            value={monthlyOpExpenses}
            onChange={setMonthlyOpExpenses}
          />
          <MoneyField
            label="Existing Monthly Debt Payments (₹)"
            value={existingMonthlyDebt}
            onChange={setExistingMonthlyDebt}
          />
          <MoneyField
            label="Proposed Loan EMI (₹)"
            value={Math.round(proposedEmi)}
            readOnly
            hint="Auto-filled from funding planner"
          />
          <MoneyField
            label="Other Recurring Commitments (₹)"
            value={otherCommitments}
            onChange={setOtherCommitments}
            hint="Optional"
          />
        </div>

        <div className="mt-8 max-w-xl" aria-label="Cash-flow waterfall">
          <ol className="bl-waterfall space-y-0">
            {steps.map((row, index) => (
              <li key={row.key}>
                {index > 0 ? <FlowArrow /> : null}
                <div
                  className={`flex items-center justify-between gap-3 rounded-[var(--bl-radius-md)] px-4 py-3.5 ${
                    row.tone === 'orange'
                      ? 'bg-[var(--bl-orange-soft)] ring-1 ring-[var(--bl-orange)]/25'
                      : row.tone === 'navy'
                        ? 'bg-[var(--bl-navy)] text-white'
                        : 'bg-[var(--bl-surface-2)]'
                  }`}
                >
                  <span
                    className={`text-sm font-semibold sm:text-base ${
                      row.tone === 'navy' ? 'text-white' : 'text-[var(--bl-navy)]'
                    }`}
                  >
                    {row.label}
                  </span>
                  <span
                    className={`text-sm font-bold tabular-nums sm:text-base ${
                      row.tone === 'navy'
                        ? 'text-white'
                        : row.tone === 'orange'
                          ? 'text-[var(--bl-orange)]'
                          : 'text-slate-600'
                    }`}
                  >
                    {row.value >= 0
                      ? formatInr(Math.round(row.value))
                      : `−${formatInr(Math.round(Math.abs(row.value)))}`}
                  </span>
                </div>
              </li>
            ))}
            <li>
              <FlowArrow />
              <div className="rounded-[var(--bl-radius-md)] bg-[var(--bl-navy)] px-4 py-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/70 sm:text-sm">
                  {isShortfall
                    ? 'Estimated Cash-Flow Shortfall'
                    : 'Estimated Cash Flow After New EMI'}
                </p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums sm:text-3xl">
                  {remaining != null ? formatInr(Math.round(Math.abs(remaining))) : '—'}
                </p>
                {cashFlow ? (
                  <p className="mt-2 text-sm text-white/80">
                    {cashFlowHeadroomLabel(cashFlow.headroom)}
                  </p>
                ) : null}
              </div>
            </li>
          </ol>
        </div>

        {cashFlow ? (
          <dl className="mt-8 grid gap-4 sm:grid-cols-2 max-w-xl">
            <div className="rounded-[var(--bl-radius-md)] bg-[var(--bl-surface-3)] p-4">
              <dt className="bl-metric-label">Operating Surplus Before New EMI</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums text-[var(--bl-navy)] sm:text-xl">
                {formatInr(Math.round(cashFlow.operatingSurplusBeforeEmi))}
              </dd>
              <p className="mt-1 text-xs text-[var(--bl-muted)] sm:text-sm">
                Revenue − expenses − existing debt
                {otherCommitments > 0 ? ' − other commitments' : ''}
              </p>
            </div>
            <div className="rounded-[var(--bl-radius-md)] bg-[var(--bl-surface-3)] p-4">
              <dt className="bl-metric-label">Cash Flow After New EMI</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums text-[var(--bl-navy)] sm:text-xl">
                {isShortfall
                  ? `Shortfall ${formatInr(Math.round(Math.abs(remaining!)))}`
                  : formatInr(Math.round(remaining!))}
              </dd>
              <p className="mt-1 text-xs text-[var(--bl-muted)] sm:text-sm">
                Operating surplus − proposed EMI
              </p>
            </div>
          </dl>
        ) : null}

        <p className="mt-5 text-sm text-[var(--bl-muted)]" role="note">
          Illustrative business cash-flow assessment only; lender underwriting may use additional
          information. Headroom labels are planning cues — not credit decisions.
        </p>
        <a
          href="#bl-stress"
          className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--bl-navy)] underline-offset-2 hover:text-[var(--bl-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)]"
        >
          Run a revenue stress test →
        </a>
      </div>
    </section>
  );
}

export function BusinessLoanStressTest() {
  const { monthlyRevenue, monthlyOpExpenses, existingMonthlyDebt, otherCommitments, emi } =
    useBusinessLoanDecision();
  const [customRevenue, setCustomRevenue] = useState<number | ''>('');

  const scenarios = useMemo(() => {
    if (!emi) return [];
    return stressTestBusinessCashFlow({
      monthlyRevenue,
      monthlyOperatingExpenses: monthlyOpExpenses,
      existingMonthlyDebt,
      proposedMonthlyEmi: emi.monthlyEmi,
      otherCommitments,
      customRevenue: customRevenue === '' ? null : Number(customRevenue),
    });
  }, [
    monthlyRevenue,
    monthlyOpExpenses,
    existingMonthlyDebt,
    otherCommitments,
    emi,
    customRevenue,
  ]);

  const maxPositive = Math.max(1, ...scenarios.map((s) => Math.max(0, s.surplusAfterProposedEmi)));

  return (
    <section
      id="bl-stress"
      aria-labelledby="bl-stress-heading"
      className="full-bleed bg-[var(--bl-surface-4)]"
    >
      <div className="site-container bl-section px-4">
        <p className="bl-eyebrow">Stress Test</p>
        <h2 id="bl-stress-heading" className="bl-h2">
          What If Revenue Falls?
        </h2>
        <p className="bl-lede">
          Illustrative scenarios holding expenses and EMI constant. Bars show estimated cash
          remaining after modeled expenses, debt and EMI — not approval probability.
        </p>

        <div className="mt-5 max-w-xs">
          <MoneyField
            label="Custom monthly revenue (₹) — optional"
            value={customRevenue === '' ? 0 : customRevenue}
            onChange={(n) => setCustomRevenue(n)}
          />
        </div>

        <ul className="mt-8 grid gap-4" aria-label="Revenue stress scenarios">
          {scenarios.map((s) => {
            const remaining = s.surplusAfterProposedEmi;
            const isShortfall = remaining < 0;
            const barPct = isShortfall
              ? 8
              : Math.max(8, Math.round((remaining / maxPositive) * 100));
            return (
              <li
                key={s.id}
                className="rounded-[var(--bl-radius-md)] bg-white p-4 ring-1 ring-[var(--bl-border)] sm:p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-bold text-[var(--bl-navy)] sm:text-base">
                    {s.label}
                  </h3>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--bl-muted)] sm:text-sm">
                    {cashFlowHeadroomLabel(s.headroom)}
                  </p>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-xs text-[var(--bl-muted)] sm:text-sm">Revenue</dt>
                    <dd className="font-bold tabular-nums text-[var(--bl-navy)]">
                      {formatInr(Math.round(s.revenue))}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--bl-muted)] sm:text-sm">Operating Surplus</dt>
                    <dd className="font-bold tabular-nums text-[var(--bl-navy)]">
                      {formatInr(Math.round(s.operatingSurplusBeforeEmi))}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--bl-muted)] sm:text-sm">Proposed EMI</dt>
                    <dd className="font-bold tabular-nums text-[var(--bl-navy)]">
                      {emi ? formatInr(Math.round(emi.monthlyEmi)) : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--bl-muted)] sm:text-sm">
                      {isShortfall ? 'Estimated Cash-Flow Shortfall' : 'Remaining Cash Flow'}
                    </dt>
                    <dd className="text-base font-extrabold tabular-nums text-[var(--bl-navy)] sm:text-lg">
                      {formatInr(Math.round(Math.abs(remaining)))}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <p className="sr-only">
                    Estimated cash remaining after modeled expenses, debt and EMI:{' '}
                    {formatInr(Math.round(remaining))}
                  </p>
                  <div
                    className="h-3 overflow-hidden rounded-full bg-[var(--bl-surface-2)]"
                    role="img"
                    aria-label={`Bar indicating ${
                      isShortfall ? 'shortfall' : 'remaining cash flow'
                    } of ${formatInr(Math.round(Math.abs(remaining)))}`}
                  >
                    <div
                      className={`h-full rounded-full ${
                        isShortfall ? 'bg-slate-400' : 'bg-[var(--bl-navy)]'
                      }`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-[var(--bl-muted)] sm:text-sm">
                    Estimated cash remaining after modeled expenses/debt/EMI
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function BusinessLoanEmiCalculator() {
  const {
    fundingRequired,
    setFundingRequired,
    tenureYears,
    setTenureYears,
    ratePercent,
    setRatePercent,
    emi,
  } = useBusinessLoanDecision();

  return (
    <section
      id="bl-emi"
      aria-labelledby="bl-emi-heading"
      className="full-bleed bg-[var(--bl-surface-1)]"
    >
      <div className="site-container bl-section px-4">
        <p className="bl-eyebrow">EMI</p>
        <h2 id="bl-emi-heading" className="bl-h2">
          Business Loan EMI Snapshot
        </h2>
        <p className="bl-lede">
          Reducing-balance illustrative EMI. Confirm final terms with the lender.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <MoneyField
            label="Loan amount (₹)"
            value={fundingRequired}
            onChange={setFundingRequired}
          />
          <label className="block text-xs font-semibold text-slate-700">
            Tenure (years)
            <input
              type="number"
              min={1}
              max={15}
              value={tenureYears}
              onChange={(e) =>
                setTenureYears(Math.max(1, Math.min(15, Number(e.target.value) || 1)))
              }
              className="mt-1.5 min-h-11 w-full rounded-[var(--bl-radius-md)] border border-[var(--bl-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--bl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)]/30"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-700">
            Rate (% p.a.)
            <input
              type="number"
              min={0}
              max={50}
              step={0.1}
              value={ratePercent}
              onChange={(e) => setRatePercent(Number(e.target.value))}
              className="mt-1.5 min-h-11 w-full rounded-[var(--bl-radius-md)] border border-[var(--bl-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--bl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)]/30"
            />
          </label>
        </div>
        <dl className="mt-8 grid gap-5 sm:grid-cols-3">
          <div>
            <dt className="bl-metric-label">Monthly EMI</dt>
            <dd className="bl-metric-value mt-1.5 text-2xl">
              {emi ? formatInr(Math.round(emi.monthlyEmi)) : '—'}
            </dd>
          </div>
          <div>
            <dt className="bl-metric-label">Total Interest</dt>
            <dd className="bl-metric-value mt-1.5 text-2xl">
              {emi ? formatInr(Math.round(emi.totalInterest)) : '—'}
            </dd>
          </div>
          <div>
            <dt className="bl-metric-label">Total Repayment</dt>
            <dd className="bl-metric-value mt-1.5 text-2xl">
              {emi ? formatInr(Math.round(emi.totalRepayment)) : '—'}
            </dd>
          </div>
        </dl>
        <Link
          href={calculatorHref('business-loan-emi')}
          className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--bl-navy)] underline-offset-2 hover:text-[var(--bl-orange)] hover:underline"
        >
          Open Business Loan EMI Calculator →
        </Link>
      </div>
    </section>
  );
}

export function BusinessLoanTenureCompare() {
  const { fundingRequired, ratePercent } = useBusinessLoanDecision();
  const rows = useMemo(
    () =>
      tenureComparisonRows({
        loanAmount: fundingRequired,
        annualRatePercent: ratePercent,
        tenureYearsList: [2, 3, 5],
      }),
    [fundingRequired, ratePercent],
  );

  return (
    <section
      id="bl-tenure"
      aria-labelledby="bl-tenure-heading"
      className="full-bleed bg-[var(--bl-surface-3)]"
    >
      <div className="site-container bl-section px-4">
        <p className="bl-eyebrow">Tenure</p>
        <h2 id="bl-tenure-heading" className="bl-h2">
          How Tenure Changes EMI and Interest
        </h2>
        <p className="bl-lede">
          Compare 2-, 3- and 5-year illustrative tenures at your planning rate. Longer tenure can
          lower EMI while increasing total interest.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {rows.map(({ tenureYears, emi }) => (
            <article
              key={tenureYears}
              className="rounded-[var(--bl-radius-md)] bg-white p-5 ring-1 ring-[var(--bl-border)]"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--bl-muted)]">
                {tenureYears} years
              </p>
              <p className="mt-2 text-2xl font-extrabold tabular-nums text-[var(--bl-navy)]">
                {emi ? formatInr(Math.round(emi.monthlyEmi)) : '—'}
                <span className="ml-1 text-sm font-semibold text-[var(--bl-muted)]">/mo</span>
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--bl-muted)]">Interest</dt>
                  <dd className="font-bold tabular-nums text-[var(--bl-navy)]">
                    {emi ? formatInr(Math.round(emi.totalInterest)) : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--bl-muted)]">Total repayment</dt>
                  <dd className="font-bold tabular-nums text-[var(--bl-navy)]">
                    {emi ? formatInr(Math.round(emi.totalRepayment)) : '—'}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
        <p className="mt-5 text-xs text-[var(--bl-muted)]">
          At {ratePercent}% p.a. on {formatInr(fundingRequired)}. Illustrative only.
        </p>
      </div>
    </section>
  );
}

export function BusinessLoanLenderAssessment() {
  const factors = [
    {
      title: 'Business Profile',
      items: ['Entity type', 'Vintage', 'Industry / activity', 'Ownership structure'],
    },
    {
      title: 'Financial Profile',
      items: ['Turnover', 'Profitability', 'Banking conduct', 'Tax filings'],
    },
    {
      title: 'Cash-flow Capacity',
      items: ['Operating surplus', 'Seasonality', 'Receivables timing', 'Expense rigidity'],
    },
    {
      title: 'Credit Profile',
      items: ['Business credit history', 'Promoter credit', 'Past delinquencies if any'],
    },
    {
      title: 'Existing Obligations',
      items: ['Current EMIs', 'Working-capital limits', 'Guarantees / contingent liabilities'],
    },
    {
      title: 'Security Profile',
      items: ['Secured / unsecured', 'Collateral quality where applicable', 'Guarantee frameworks'],
    },
  ];

  return (
    <section
      id="bl-assessment"
      aria-labelledby="bl-assessment-heading"
      className="full-bleed bg-[var(--bl-surface-1)]"
    >
      <div className="site-container bl-section px-4">
        <p className="bl-eyebrow">Lender Assessment</p>
        <h2 id="bl-assessment-heading" className="bl-h2">
          Six Factors Lenders Often Weigh
        </h2>
        <p className="bl-lede">
          Educational overview only. Weighting and thresholds are product-specific — this page does
          not score approval odds.
        </p>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {factors.map((f, i) => (
            <li
              key={f.title}
              className="rounded-[var(--bl-radius-md)] bg-[var(--bl-surface-2)] p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--bl-muted)]">
                Factor {i + 1}
              </p>
              <h3 className="mt-1 text-sm font-bold text-[var(--bl-navy)]">{f.title}</h3>
              <ul className="mt-3 space-y-1.5">
                {f.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-slate-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--bl-orange)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function BusinessLoanTurnover() {
  const { annualTurnover, setAnnualTurnover, fundingRequired } = useBusinessLoanDecision();
  const ratio = turnoverLoanRatio(annualTurnover, fundingRequired);

  return (
    <section
      id="bl-turnover"
      aria-labelledby="bl-turnover-heading"
      className="full-bleed bg-[var(--bl-surface-4)]"
    >
      <div className="site-container bl-section px-4">
        <p className="bl-eyebrow">Turnover</p>
        <h2 id="bl-turnover-heading" className="bl-h2">
          Why Business Turnover Matters
        </h2>
        <p className="bl-lede">
          Turnover can help indicate business scale, but does not by itself show profitability or
          repayment capacity.
        </p>
        <div className="mt-6 max-w-sm">
          <MoneyField
            label="Annual turnover (₹)"
            value={annualTurnover}
            onChange={setAnnualTurnover}
          />
        </div>
        <dl className="mt-8 grid gap-6 sm:grid-cols-3 max-w-3xl">
          <div>
            <dt className="bl-metric-label">Annual Turnover</dt>
            <dd className="bl-metric-value mt-1.5 text-2xl sm:text-3xl">
              {formatInr(annualTurnover)}
            </dd>
          </div>
          <div>
            <dt className="bl-metric-label">Requested Loan</dt>
            <dd className="bl-metric-value mt-1.5 text-2xl sm:text-3xl">
              {formatInr(fundingRequired)}
            </dd>
          </div>
          <div>
            <dt className="bl-metric-label">Requested Loan as % of Turnover</dt>
            <dd className="bl-metric-value mt-1.5 text-2xl sm:text-3xl">
              {ratio != null ? `${ratio.toFixed(1)}%` : '—'}
            </dd>
          </div>
        </dl>
        <p className="mt-5 text-sm text-[var(--bl-muted)]">
          Illustrative ratio only. No universal threshold is applied — lender comfort levels vary by
          industry, security and cash flow.
        </p>
      </div>
    </section>
  );
}

export function BusinessLoanProfitability() {
  const { monthlyRevenue, monthlyOpExpenses, emi } = useBusinessLoanDecision();
  const annualRevenue = monthlyRevenue * 12;
  const annualExpenses = monthlyOpExpenses * 12;
  const operatingSurplus = annualRevenue - annualExpenses;

  return (
    <section
      id="bl-profitability"
      aria-labelledby="bl-profitability-heading"
      className="full-bleed bg-[var(--bl-surface-1)]"
    >
      <div className="site-container bl-section px-4">
        <p className="bl-eyebrow">Profitability</p>
        <h2 id="bl-profitability-heading" className="bl-h2">
          Revenue Is Not Profit
        </h2>
        <p className="bl-lede">
          An illustrative annual equation from your cash-flow planner inputs — not audited
          financials.
        </p>

        <div className="mt-8 max-w-lg space-y-0" aria-label="Profitability equation">
          <div className="rounded-[var(--bl-radius-md)] bg-[var(--bl-navy)] px-4 py-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Revenue</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">
              {formatInr(Math.round(annualRevenue))}
            </p>
          </div>
          <FlowArrow />
          <div className="rounded-[var(--bl-radius-md)] bg-[var(--bl-surface-2)] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--bl-muted)]">
              − Operating Expenses
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-slate-600">
              {formatInr(Math.round(annualExpenses))}
            </p>
          </div>
          <FlowArrow />
          <div className="rounded-[var(--bl-radius-md)] bg-[var(--bl-surface-3)] px-4 py-4 ring-1 ring-[var(--bl-border)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--bl-muted)]">
              = Operating Surplus / Profit
            </p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-[var(--bl-navy)]">
              {formatInr(Math.round(operatingSurplus))}
            </p>
          </div>
          <FlowArrow />
          <div className="rounded-[var(--bl-radius-md)] bg-[var(--bl-orange-soft)] px-4 py-4 ring-1 ring-[var(--bl-orange)]/20">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--bl-muted)]">
              Potential Loan EMI
            </p>
            <p className="mt-1 text-xl font-extrabold tabular-nums text-[var(--bl-orange)]">
              {emi ? `${formatInr(Math.round(emi.monthlyEmi))}/mo` : '—'}
            </p>
          </div>
        </div>
        <p className="mt-5 text-sm text-[var(--bl-muted)]">
          This visually connects operating surplus to repayment burden. No hardcoded “good” margin
          thresholds are shown — expectations vary by sector and product.
        </p>
      </div>
    </section>
  );
}

export function BusinessLoanDscr() {
  const { monthlyRevenue, monthlyOpExpenses, existingMonthlyDebt, otherCommitments, emi } =
    useBusinessLoanDecision();

  const [annualCashOverride, setAnnualCashOverride] = useState<number | null>(null);
  const [annualExistingOverride, setAnnualExistingOverride] = useState<number | null>(null);
  const [annualProposedOverride, setAnnualProposedOverride] = useState<number | null>(null);

  const derivedAnnualCash = (monthlyRevenue - monthlyOpExpenses - otherCommitments) * 12;
  const derivedExisting = existingMonthlyDebt * 12;
  const derivedProposed = (emi?.monthlyEmi ?? 0) * 12;

  const annualCash = annualCashOverride ?? Math.max(0, derivedAnnualCash);
  const annualExisting = annualExistingOverride ?? derivedExisting;
  const annualProposed = annualProposedOverride ?? derivedProposed;

  const dscr = useMemo(
    () =>
      calculateIllustrativeDscr({
        annualCashAvailableForDebtService: annualCash,
        annualExistingDebtPayments: annualExisting,
        proposedAnnualLoanPayments: annualProposed,
      }),
    [annualCash, annualExisting, annualProposed],
  );

  const debtService = annualExisting + annualProposed;
  const cashBarPct =
    debtService > 0
      ? Math.min(100, Math.round((annualCash / Math.max(annualCash, debtService)) * 100))
      : 100;
  const debtBarPct =
    annualCash > 0 || debtService > 0
      ? Math.min(100, Math.round((debtService / Math.max(annualCash, debtService, 1)) * 100))
      : 0;

  return (
    <section
      id="bl-dscr"
      aria-labelledby="bl-dscr-heading"
      className="full-bleed bg-[var(--bl-surface-3)]"
    >
      <div className="site-container bl-section px-4">
        <p className="bl-eyebrow">DSCR</p>
        <h2 id="bl-dscr-heading" className="bl-h2">
          Understand Debt Service Coverage Ratio (DSCR)
        </h2>
        <p className="bl-lede">
          DSCR compares cash available for debt repayment with debt obligations. Different lenders
          and products may use different DSCR expectations and definitions.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <MoneyField
            label="Annual Cash Available for Debt Service (₹)"
            value={Math.round(annualCash)}
            onChange={(n) => setAnnualCashOverride(n)}
          />
          <MoneyField
            label="Annual Existing Debt Payments (₹)"
            value={Math.round(annualExisting)}
            onChange={(n) => setAnnualExistingOverride(n)}
          />
          <MoneyField
            label="Proposed Annual Loan Payments (₹)"
            value={Math.round(annualProposed)}
            onChange={(n) => setAnnualProposedOverride(n)}
          />
        </div>

        <div
          className="bl-dscr-formula mt-8 flex max-w-xl flex-col gap-2 sm:flex-row sm:items-center sm:gap-4"
          aria-label="DSCR formula"
        >
          <div className="flex-1 rounded-[var(--bl-radius-md)] bg-white px-4 py-4 ring-1 ring-[var(--bl-border)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--bl-muted)]">
              Cash Available for Debt Service
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-[var(--bl-navy)] sm:text-xl">
              {formatInr(Math.round(annualCash))}
            </p>
          </div>
          <span className="text-center text-xl font-bold text-[var(--bl-muted)]" aria-hidden>
            ÷
          </span>
          <div className="flex-1 rounded-[var(--bl-radius-md)] bg-white px-4 py-4 ring-1 ring-[var(--bl-border)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--bl-muted)]">
              Total Debt Service
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-[var(--bl-navy)] sm:text-xl">
              {formatInr(Math.round(debtService))}
            </p>
          </div>
          <span className="text-center text-xl font-bold text-[var(--bl-muted)]" aria-hidden>
            =
          </span>
          <div className="flex-1 rounded-[var(--bl-radius-md)] bg-[var(--bl-navy)] px-4 py-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">DSCR</p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums sm:text-4xl">
              {dscr ? `${dscr.dscr.toFixed(2)}x` : '—'}
            </p>
          </div>
        </div>

        <div className="mt-8 max-w-xl space-y-4" aria-label="DSCR proportion visual">
          <div>
            <div className="mb-1.5 flex justify-between text-sm font-semibold text-[var(--bl-navy)]">
              <span>Cash Available</span>
              <span className="tabular-nums">{formatInr(Math.round(annualCash))}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[var(--bl-surface-2)]">
              <div
                className="h-full rounded-full bg-[var(--bl-navy)]"
                style={{ width: `${cashBarPct}%` }}
              />
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex justify-between text-sm font-semibold text-slate-600">
              <span>Debt Service</span>
              <span className="tabular-nums">{formatInr(Math.round(debtService))}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[var(--bl-surface-2)]">
              <div
                className="h-full rounded-full bg-slate-400"
                style={{ width: `${debtBarPct}%` }}
              />
            </div>
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-[var(--bl-muted)]">
          {dscr?.calculationBasis ??
            'Illustrative DSCR = cash available for debt service ÷ (existing + proposed annual debt payments).'}{' '}
          No universal “good” or “bad” label is applied.
        </p>
      </div>
    </section>
  );
}

export function BusinessLoanBreakEven() {
  const { emi, contributionMarginPercent, setContributionMarginPercent } =
    useBusinessLoanDecision();
  const marginError = breakEvenValidationMessage(contributionMarginPercent);
  const extraSales =
    emi && !marginError
      ? breakEvenAdditionalSales({
          proposedMonthlyEmi: emi.monthlyEmi,
          contributionMarginPercent,
        })
      : null;

  return (
    <section
      id="bl-break-even"
      aria-labelledby="bl-break-even-heading"
      className="full-bleed bg-[var(--bl-surface-1)]"
    >
      <div className="site-container bl-section px-4">
        <p className="bl-eyebrow">Break-even Impact</p>
        <h2 id="bl-break-even-heading" className="bl-h2">
          How Much Additional Business Could Be Needed to Cover the EMI?
        </h2>
        <p className="bl-lede">Simplified illustrative calculation — not a sales forecast.</p>
        <div className="mt-6 max-w-xs">
          <label className="block text-sm font-semibold text-slate-700">
            Contribution margin (%)
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={contributionMarginPercent}
              aria-invalid={Boolean(marginError)}
              aria-describedby={marginError ? 'bl-break-even-error' : undefined}
              onChange={(e) => setContributionMarginPercent(Number(e.target.value))}
              className="mt-1.5 min-h-11 w-full rounded-[var(--bl-radius-md)] border border-[var(--bl-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--bl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)]/30"
            />
          </label>
          {marginError ? (
            <p id="bl-break-even-error" className="mt-2 text-sm text-slate-700" role="alert">
              {marginError}
            </p>
          ) : null}
        </div>

        <div className="mt-8 max-w-md space-y-0" aria-label="Break-even calculation flow">
          <div className="rounded-[var(--bl-radius-md)] bg-[var(--bl-orange-soft)] px-4 py-4 ring-1 ring-[var(--bl-orange)]/20">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--bl-muted)]">
              Proposed EMI
            </p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-[var(--bl-orange)]">
              {emi ? formatInr(Math.round(emi.monthlyEmi)) : '—'}
            </p>
          </div>
          <FlowArrow />
          <div className="rounded-[var(--bl-radius-md)] bg-[var(--bl-surface-2)] px-4 py-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--bl-muted)]">
              Contribution Margin
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-[var(--bl-navy)]">
              {contributionMarginPercent}%
            </p>
          </div>
          <FlowArrow />
          <div className="rounded-[var(--bl-radius-md)] bg-[var(--bl-navy)] px-4 py-5 text-white">
            <p className="text-sm font-semibold uppercase tracking-wide text-white/70">
              Illustrative Additional Sales
            </p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums sm:text-3xl">
              {extraSales != null ? `${formatInr(Math.round(extraSales))}/month` : '—'}
            </p>
          </div>
        </div>
        <p className="mt-5 text-sm text-[var(--bl-muted)]">
          Required sales = EMI ÷ contribution margin. Margin assumptions should match your economics
          — they are not verified by Varnarc.
        </p>
      </div>
    </section>
  );
}

export function BusinessLoanSecuredUnsecured() {
  const { securityMode, setSecurityMode } = useBusinessLoanDecision();

  return (
    <section
      id="bl-secured"
      aria-labelledby="bl-secured-heading"
      className="full-bleed bg-[var(--bl-surface-4)]"
    >
      <div className="site-container bl-section px-4">
        <p className="bl-eyebrow">Security Structure</p>
        <h2 id="bl-secured-heading" className="bl-h2">
          Secured vs Unsecured Business Finance
        </h2>
        <p className="bl-lede">
          Balanced comparison. Do not assume secured always means a lower rate unless product data
          supports it.
        </p>

        <div
          className="mt-5 inline-flex flex-wrap rounded-full bg-[var(--bl-surface-2)] p-1"
          role="group"
          aria-label="Security preference"
        >
          {(
            [
              ['secured', 'Secured'],
              ['unsecured', 'Unsecured'],
              ['unsure', 'Not sure'],
            ] as Array<[BusinessSecurityMode, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={securityMode === key}
              onClick={() => setSecurityMode(key)}
              className={`min-h-11 rounded-full px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)] ${
                securityMode === key
                  ? 'bg-[var(--bl-navy)] text-white'
                  : 'bg-transparent text-[var(--bl-navy)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <article className="bg-[var(--bl-surface-1)] p-5 sm:p-6">
            <h3 className="text-lg font-bold text-[var(--bl-navy)]">Secured Business Finance</h3>
            <dl className="mt-4 space-y-4 text-sm text-slate-600 sm:text-[0.9375rem]">
              <div>
                <dt className="font-semibold text-[var(--bl-navy)]">Potential security</dt>
                <dd className="mt-1">
                  Property, machinery, business assets, or other lender-accepted security
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--bl-navy)]">Assessment may consider</dt>
                <dd className="mt-1">Business + collateral profile</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--bl-navy)]">Key consideration</dt>
                <dd className="mt-1">
                  A pledged asset may be exposed to lender enforcement if obligations are not met
                </dd>
              </div>
            </dl>
          </article>
          <article className="bg-[var(--bl-surface-2)] p-5 sm:p-6">
            <h3 className="text-lg font-bold text-[var(--bl-navy)]">Unsecured Business Finance</h3>
            <dl className="mt-4 space-y-4 text-sm text-slate-600 sm:text-[0.9375rem]">
              <div>
                <dt className="font-semibold text-[var(--bl-navy)]">Collateral</dt>
                <dd className="mt-1">No pledged collateral for that facility</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--bl-navy)]">Assessment may rely more on</dt>
                <dd className="mt-1">
                  Cash flow, turnover, profitability, credit profile and business vintage
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--bl-navy)]">Key consideration</dt>
                <dd className="mt-1">
                  Pricing, limits and documentation still vary widely by product
                </dd>
              </div>
            </dl>
          </article>
        </div>
      </div>
    </section>
  );
}

export function BusinessLoanEligibility() {
  const profiles = [
    {
      title: 'Business Profile',
      items: ['Business Type', 'Industry', 'Business Vintage', 'Location'],
    },
    {
      title: 'Financial Profile',
      items: [
        'Turnover',
        'Profitability',
        'Cash Flow',
        'Banking History',
        'Tax / Financial History',
      ],
    },
    {
      title: 'Borrowing Profile',
      items: ['Requested Amount', 'Funding Purpose', 'Tenure', 'Existing Debt'],
    },
    {
      title: 'Promoter / Applicant Profile',
      items: ['Credit Profile', 'Existing Obligations', 'Ownership / Role'],
    },
    {
      title: 'Security Profile',
      items: ['Secured / Unsecured', 'Collateral where applicable'],
    },
  ];

  return (
    <section
      id="bl-eligibility"
      aria-labelledby="bl-eligibility-heading"
      className="full-bleed bg-[var(--bl-surface-1)]"
    >
      <div className="site-container bl-section px-4">
        <p className="bl-eyebrow">Eligibility</p>
        <h2 id="bl-eligibility-heading" className="bl-h2">
          Business Loan Eligibility Factors
        </h2>
        <p className="bl-lede">
          Five profile groups commonly feed lender assessment. This page does not calculate an
          approval percentage.
        </p>

        {/* Mobile: vertical flow */}
        <ol className="mt-8 space-y-3 lg:hidden" aria-label="Eligibility assessment flow">
          {profiles.map((block) => (
            <li key={block.title}>
              <article className="bg-[var(--bl-surface-2)] p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--bl-navy)]">
                  {block.title}
                </h3>
                <ul className="mt-3 space-y-2">
                  {block.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-slate-600">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--bl-orange)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
              <p
                className="py-2 text-center text-sm font-semibold text-[var(--bl-muted)]"
                aria-hidden
              >
                ↓
              </p>
            </li>
          ))}
          <li>
            <p className="rounded-[var(--bl-radius-md)] bg-[var(--bl-navy)] px-4 py-3 text-center text-sm font-bold text-white">
              Lender Assessment
            </p>
          </li>
        </ol>

        {/* Desktop: connected assessment model */}
        <div className="mt-8 hidden lg:block" aria-label="Eligibility assessment model">
          <div className="grid gap-3 lg:grid-cols-3">
            {profiles.slice(0, 3).map((block) => (
              <article
                key={block.title}
                className="rounded-[var(--bl-radius-md)] bg-[var(--bl-surface-2)] p-5"
              >
                <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--bl-navy)]">
                  {block.title}
                </h3>
                <ul className="mt-3 space-y-1.5">
                  {block.items.map((item) => (
                    <li key={item} className="text-sm leading-relaxed text-slate-600">
                      · {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="py-3 text-center text-sm font-semibold text-[var(--bl-muted)]" aria-hidden>
            ╲ &nbsp;&nbsp; │ &nbsp;&nbsp; ╱
          </p>
          <p className="mx-auto max-w-md rounded-[var(--bl-radius-md)] bg-[var(--bl-navy)] px-4 py-3 text-center text-sm font-bold text-white">
            Lender Assessment
          </p>
          <p className="py-3 text-center text-sm font-semibold text-[var(--bl-muted)]" aria-hidden>
            ╱ &nbsp;&nbsp; ╲
          </p>
          <div className="mx-auto grid max-w-2xl gap-3 sm:grid-cols-2">
            {profiles.slice(3).map((block) => (
              <article
                key={block.title}
                className="rounded-[var(--bl-radius-md)] bg-[var(--bl-surface-3)] p-5 ring-1 ring-[var(--bl-border)]"
              >
                <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--bl-navy)]">
                  {block.title}
                  <span className="ml-2 text-xs font-semibold normal-case tracking-normal text-[var(--bl-muted)]">
                    (supporting)
                  </span>
                </h3>
                <ul className="mt-3 space-y-1.5">
                  {block.items.map((item) => (
                    <li key={item} className="text-sm leading-relaxed text-slate-600">
                      · {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>

        <Link
          href="/finance/eligibility"
          className="mt-8 inline-flex min-h-11 items-center rounded-[var(--bl-radius-md)] bg-[var(--bl-navy)] px-4 text-sm font-semibold !text-white hover:bg-[var(--bl-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)]"
        >
          Check Business Loan Eligibility →
        </Link>
      </div>
    </section>
  );
}

export function BusinessLoanVintage() {
  const { vintageYears, setVintageYears, entityType } = useBusinessLoanDecision();
  const activeId = vintageTimelineStepId(vintageYears);

  return (
    <section
      id="bl-vintage"
      aria-labelledby="bl-vintage-heading"
      className="full-bleed bg-[var(--bl-surface-4)]"
    >
      <div className="site-container bl-section px-4">
        <p className="bl-eyebrow">Business Vintage</p>
        <h2 id="bl-vintage-heading" className="bl-h2">
          How Long Has the Business Been Operating?
        </h2>
        <p className="bl-lede">
          More operating history can provide more financial and banking information for assessment.
          Minimums vary by lender — stages are not labeled eligible or ineligible.
        </p>
        <div className="mt-6 max-w-xs">
          <label className="block text-sm font-semibold text-slate-700">
            Business vintage (years)
            <input
              type="number"
              min={0}
              max={50}
              step={0.5}
              value={vintageYears}
              onChange={(e) => setVintageYears(Math.max(0, Number(e.target.value) || 0))}
              className="mt-1.5 min-h-11 w-full rounded-[var(--bl-radius-md)] border border-[var(--bl-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--bl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)]/30"
            />
          </label>
        </div>

        <ol
          className="mt-8 flex flex-wrap items-center gap-2 sm:gap-3"
          aria-label="Business vintage timeline"
        >
          {BUSINESS_VINTAGE_TIMELINE.map((step, index) => (
            <li key={step.id} className="flex items-center gap-2 sm:gap-3">
              <span
                className={`inline-flex min-h-11 min-w-[4.5rem] items-center justify-center rounded-full px-3 text-sm font-semibold ${
                  activeId === step.id
                    ? 'bg-[var(--bl-navy)] text-white'
                    : 'bg-white text-[var(--bl-navy)] ring-1 ring-[var(--bl-border)]'
                }`}
              >
                {step.label}
              </span>
              {index < BUSINESS_VINTAGE_TIMELINE.length - 1 ? (
                <span className="text-[var(--bl-muted)]" aria-hidden>
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>

        <p className="mt-5 text-sm text-[var(--bl-muted)]">
          Entity type in planner:{' '}
          <span className="font-semibold capitalize text-[var(--bl-navy)]">
            {entityType.replace(/_/g, ' ')}
          </span>
          . No eligibility claim is made from vintage alone.
        </p>
      </div>
    </section>
  );
}

export function BusinessLoanExistingDebt() {
  const { existingMonthlyDebt, setExistingMonthlyDebt, emi, cashFlow } = useBusinessLoanDecision();

  const proposedEmi = emi?.monthlyEmi ?? 0;
  const totalDebt = existingMonthlyDebt + proposedEmi;
  const surplusAfter = cashFlow?.surplusAfterProposedEmi ?? null;
  const isShortfall = surplusAfter != null && surplusAfter < 0;

  return (
    <section
      id="bl-existing-debt"
      aria-labelledby="bl-existing-debt-heading"
      className="full-bleed bg-[var(--bl-surface-1)]"
    >
      <div className="site-container bl-section px-4">
        <p className="bl-eyebrow">Existing Debt</p>
        <h2 id="bl-existing-debt-heading" className="bl-h2">
          Existing Debt + New Loan
        </h2>
        <p className="bl-lede">
          Shared with the Cash-Flow Planner. Existing EMIs and limits affect repayment capacity.
        </p>
        <div className="mt-6 max-w-sm">
          <MoneyField
            label="Current Monthly Debt (₹)"
            value={existingMonthlyDebt}
            onChange={setExistingMonthlyDebt}
          />
        </div>
        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[var(--bl-radius-md)] bg-[var(--bl-surface-2)] p-4">
            <dt className="bl-metric-label">Current Monthly Debt</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-[var(--bl-navy)]">
              {formatInr(Math.round(existingMonthlyDebt))}
            </dd>
          </div>
          <div className="rounded-[var(--bl-radius-md)] bg-[var(--bl-surface-2)] p-4">
            <dt className="bl-metric-label">Proposed EMI</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-[var(--bl-navy)]">
              {emi ? formatInr(Math.round(proposedEmi)) : '—'}
            </dd>
          </div>
          <div className="rounded-[var(--bl-radius-md)] bg-[var(--bl-surface-2)] p-4">
            <dt className="bl-metric-label">Total Monthly Debt Payment</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-[var(--bl-navy)]">
              {emi ? formatInr(Math.round(totalDebt)) : formatInr(Math.round(existingMonthlyDebt))}
            </dd>
          </div>
          <div className="rounded-[var(--bl-radius-md)] bg-[var(--bl-navy)] p-4 text-white">
            <dt className="text-xs font-semibold uppercase tracking-wide text-white/70">
              {isShortfall
                ? 'Estimated Shortfall After Debt Service'
                : 'Estimated Surplus After Debt Service'}
            </dt>
            <dd className="mt-1 text-lg font-bold tabular-nums">
              {surplusAfter != null ? formatInr(Math.round(Math.abs(surplusAfter))) : '—'}
            </dd>
          </div>
        </dl>
        {cashFlow ? (
          <p className="mt-4 text-sm text-[var(--bl-muted)]">
            Operating surplus before new EMI:{' '}
            <span className="font-semibold text-[var(--bl-navy)]">
              {formatInr(Math.round(cashFlow.operatingSurplusBeforeEmi))}
            </span>
            . Connected to the Cash-Flow Planner above.
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function BusinessLoanCreditProfile() {
  return (
    <section
      id="bl-credit"
      aria-labelledby="bl-credit-heading"
      className="full-bleed bg-[var(--bl-surface-4)]"
    >
      <div className="site-container bl-section px-4">
        <p className="bl-eyebrow">Credit Profile</p>
        <h2 id="bl-credit-heading" className="bl-h2">
          Business and Promoter Credit Context
        </h2>
        <p className="bl-lede">
          Credit history for the enterprise and promoters may be reviewed. This page does not fetch
          or score bureau data.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            'Payment history on existing facilities',
            'Utilisation of working-capital limits',
            'Promoter personal credit where relevant to the product',
            'Overdues, settlements or write-offs if any',
            'Guarantees and contingent liabilities',
            'Consistency of banking conduct',
          ].map((item) => (
            <li
              key={item}
              className="flex gap-2 rounded-[var(--bl-radius-md)] bg-[var(--bl-surface-1)] p-4 text-sm text-slate-600"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--bl-orange)]" />
              {item}
            </li>
          ))}
        </ul>
        <Link
          href="/finance/credit-score"
          className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--bl-navy)] underline-offset-2 hover:text-[var(--bl-orange)] hover:underline"
        >
          Learn about credit score basics →
        </Link>
      </div>
    </section>
  );
}

export function BusinessLoanDocuments() {
  const groups = [
    {
      title: 'Business Identity',
      items: ['Entity registration', 'PAN', 'GST where applicable', 'Udyam if relevant'],
    },
    {
      title: 'Promoter / Applicant',
      items: ['Identity', 'Address proof', 'Photographs as required'],
    },
    {
      title: 'Financial Statements',
      items: ['Profit & loss', 'Balance sheet', 'Notes / schedules where applicable'],
    },
    {
      title: 'Bank Statements',
      items: ['Operating accounts', 'Debt-servicing evidence'],
    },
    {
      title: 'Tax Records',
      items: ['ITR filings', 'GST returns where applicable'],
    },
    {
      title: 'Business Licences / Registrations',
      items: ['Trade licences', 'Sector registrations where relevant'],
    },
    {
      title: 'Security Documents — If Applicable',
      items: ['Property / asset documents', 'Valuation papers as required'],
    },
  ];

  return (
    <section
      id="bl-documents"
      aria-labelledby="bl-documents-heading"
      className="full-bleed bg-[var(--bl-surface-2)]"
    >
      <div className="site-container bl-section px-4">
        <p className="bl-eyebrow">Documents</p>
        <h2 id="bl-documents-heading" className="bl-h2">
          Application Readiness Checklist
        </h2>
        <p className="bl-lede">
          Commonly requested; exact requirements vary by lender, facility type, amount and security
          structure.
        </p>

        <div className="mt-8 space-y-2 sm:hidden">
          {groups.map((g) => (
            <details
              key={g.title}
              className="group rounded-[var(--bl-radius-md)] bg-white ring-1 ring-[var(--bl-border)] open:ring-[var(--bl-navy)]/20"
            >
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-bold text-[var(--bl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)]">
                {g.title}
                <span className="text-[var(--bl-muted)] group-open:rotate-180" aria-hidden>
                  ▾
                </span>
              </summary>
              <ul className="space-y-2 border-t border-[var(--bl-border)] px-4 py-3">
                {g.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-slate-600">
                    <span aria-hidden>☐</span>
                    {item}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>

        <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <article key={g.title} className="bg-white p-5 ring-1 ring-[var(--bl-border)]">
              <h3 className="text-sm font-bold text-[var(--bl-navy)]">{g.title}</h3>
              <ul className="mt-3 space-y-2">
                {g.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-slate-600">
                    <span aria-hidden>☐</span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BusinessLoanFinancialStatements() {
  return (
    <section
      id="bl-financials"
      aria-labelledby="bl-financials-heading"
      className="full-bleed bg-[var(--bl-surface-1)]"
    >
      <div className="site-container bl-section px-4">
        <p className="bl-eyebrow">Financial Statements</p>
        <h2 id="bl-financials-heading" className="bl-h2">
          What Financial Statements May Tell a Lender
        </h2>
        <p className="bl-lede">
          Educational overview of common statement modules. Exact periods and formats vary.
        </p>
        <ul className="mt-8 grid gap-4 lg:grid-cols-3">
          {[
            {
              title: 'Profit & Loss',
              items: ['Revenue', 'Operating Expenses', 'Profitability'],
            },
            {
              title: 'Balance Sheet',
              items: ['Assets', 'Liabilities', 'Net Position'],
            },
            {
              title: 'Bank Statements / Cash Flow',
              items: ['Money In', 'Money Out', 'Debt Payments', 'Cash Movement'],
            },
          ].map((card) => (
            <li
              key={card.title}
              className="rounded-[var(--bl-radius-md)] bg-[var(--bl-surface-2)] p-5 sm:p-6"
            >
              <h3 className="text-base font-bold text-[var(--bl-navy)]">{card.title}</h3>
              <ul className="mt-4 space-y-2">
                {card.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-slate-600 sm:text-[0.9375rem]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--bl-orange)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-[var(--bl-radius-md)] bg-[var(--bl-surface-3)] p-5 ring-1 ring-[var(--bl-border)]">
          <h3 className="text-sm font-bold text-[var(--bl-navy)]">Tax / Return History</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Educational concept only — ITR / GST filings may support reported activity. Requirements
            are product-specific.
          </p>
        </div>
      </div>
    </section>
  );
}

export function BusinessLoanFees() {
  return (
    <section
      id="bl-fees"
      aria-labelledby="bl-fees-heading"
      className="full-bleed bg-[var(--bl-surface-4)]"
    >
      <div className="site-container bl-section px-4">
        <p className="bl-eyebrow">Fees</p>
        <h2 id="bl-fees-heading" className="bl-h2">
          Look Beyond the Interest Rate
        </h2>
        <p className="bl-lede">
          Fee names and amounts are product-specific. Missing fee data is never invented on offer
          cards.
        </p>
        <div
          className="mt-8 max-w-xl space-y-2 text-sm sm:text-[0.9375rem]"
          aria-label="Total financing cost equation"
        >
          {[
            'Interest',
            '+ Processing fee',
            '+ Documentation / valuation / legal charges (where applicable)',
            '+ Other disclosed fees',
          ].map((line) => (
            <p
              key={line}
              className="rounded-[var(--bl-radius-md)] bg-white px-4 py-3 font-semibold text-[var(--bl-navy)] ring-1 ring-[var(--bl-border)]"
            >
              {line}
            </p>
          ))}
          <p className="rounded-[var(--bl-radius-md)] bg-[var(--bl-navy)] px-4 py-4 font-bold text-white">
            = Total Financing Cost
          </p>
        </div>
        <p className="mt-4 text-sm text-[var(--bl-muted)]">
          This is not labeled as APR unless a genuine APR is calculated from verified product data.
        </p>
      </div>
    </section>
  );
}

export function BusinessLoanTotalCost() {
  const { fundingRequired, ratePercent, tenureYears } = useBusinessLoanDecision();
  const [knownFeesInput, setKnownFeesInput] = useState<string>('');
  const knownFees = knownFeesInput.trim() === '' ? null : clampNonNegative(Number(knownFeesInput));
  const total = useMemo(
    () =>
      estimateTotalBorrowingCost({
        loanAmount: fundingRequired,
        annualRatePercent: ratePercent,
        tenureYears,
        knownFees,
      }),
    [fundingRequired, ratePercent, tenureYears, knownFees],
  );

  return (
    <section
      id="bl-total-cost"
      aria-labelledby="bl-total-cost-heading"
      className="full-bleed bg-[var(--bl-surface-1)]"
    >
      <div className="site-container bl-section px-4">
        <p className="bl-eyebrow">Total Cost</p>
        <h2 id="bl-total-cost-heading" className="bl-h2">
          Illustrative Total Financing Cost
        </h2>
        <p className="bl-lede">
          Interest plus any known fees you enter. Leave fees blank when unknown — blank does not
          mean “no fee”. Not an APR unless calculated as such.
        </p>
        <div className="mt-6 max-w-xs">
          <label className="block text-sm font-semibold text-slate-700">
            Known fees (₹) — optional
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={knownFeesInput}
              placeholder="Leave blank if unknown"
              onChange={(e) => setKnownFeesInput(e.target.value)}
              className="mt-1.5 min-h-11 w-full rounded-[var(--bl-radius-md)] border border-[var(--bl-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--bl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)]/30"
            />
            <span className="mt-1 block text-sm font-normal text-[var(--bl-muted)]">
              Unknown fees display as “Not currently available”
            </span>
          </label>
        </div>
        {total ? (
          <dl className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="bl-metric-label">Interest</dt>
              <dd className="bl-metric-value mt-1.5 text-xl sm:text-2xl">
                {formatInr(Math.round(total.totalInterest))}
              </dd>
            </div>
            <div>
              <dt className="bl-metric-label">Known Fees</dt>
              <dd className="bl-metric-value mt-1.5 text-xl sm:text-2xl">
                {total.feesKnown && total.knownFees != null
                  ? formatInr(Math.round(total.knownFees))
                  : 'Not currently available'}
              </dd>
            </div>
            <div>
              <dt className="bl-metric-label">
                {total.feesKnown ? 'Total Financing Cost' : 'Interest + Known Fees'}
              </dt>
              <dd className="bl-metric-value mt-1.5 text-xl sm:text-2xl">
                {total.feesKnown
                  ? formatInr(Math.round(total.totalFinancingCost))
                  : `${formatInr(Math.round(total.totalInterest))} + fees N/A`}
              </dd>
            </div>
            <div>
              <dt className="bl-metric-label">Total Repayment</dt>
              <dd className="bl-metric-value mt-1.5 text-xl sm:text-2xl">
                {total.feesKnown
                  ? formatInr(Math.round(total.totalRepayment))
                  : formatInr(Math.round(total.loanAmount + total.totalInterest))}
              </dd>
              {!total.feesKnown ? (
                <p className="mt-1 text-sm text-[var(--bl-muted)]">Excludes unknown fees</p>
              ) : null}
            </div>
          </dl>
        ) : null}
      </div>
    </section>
  );
}

export function BusinessLoanPrepayment() {
  const { fundingRequired, ratePercent, tenureYears, emi } = useBusinessLoanDecision();
  const outstanding = Math.round(emi?.principal ?? fundingRequired);
  const [prepay, setPrepay] = useState(Math.round(outstanding * 0.1));
  const [mode, setMode] = useState<PrepaymentMode>('reduce-tenure');

  const impact = useMemo(
    () =>
      estimateBusinessLoanPrepaymentImpact({
        outstanding,
        annualRatePercent: ratePercent,
        remainingMonths: tenureYears * 12,
        prepaymentAmount: prepay,
        mode,
      }),
    [outstanding, ratePercent, tenureYears, prepay, mode],
  );

  return (
    <section
      id="bl-prepayment"
      aria-labelledby="bl-prepayment-heading"
      className="full-bleed bg-[var(--bl-surface-2)]"
    >
      <div className="site-container bl-section px-4">
        <p className="bl-eyebrow">Early Repayment</p>
        <h2 id="bl-prepayment-heading" className="bl-h2">
          Could Prepayment Reduce Financing Cost?
        </h2>
        <p className="bl-lede">
          Illustrative interest impact. Prepayment charges are not fabricated — confirm with the
          lender.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">
            Prepayment amount (₹)
            <input
              type="number"
              min={0}
              value={prepay}
              onChange={(e) => setPrepay(Number(e.target.value) || 0)}
              className="mt-1.5 min-h-11 w-full rounded-[var(--bl-radius-md)] border border-[var(--bl-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--bl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)]/30"
            />
          </label>
          <div>
            <p className="text-sm font-semibold text-slate-700">Strategy</p>
            <div className="mt-1.5 flex gap-2">
              {(
                [
                  ['reduce-tenure', 'Reduce Tenure'],
                  ['reduce-emi', 'Reduce EMI'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={mode === key}
                  onClick={() => setMode(key)}
                  className={`min-h-11 flex-1 rounded-full px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)] ${
                    mode === key
                      ? 'bg-[var(--bl-navy)] text-white'
                      : 'bg-[var(--bl-surface-4)] text-[var(--bl-navy)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {impact ? (
          <dl className="mt-7 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="bl-metric-label">Potential Interest Saved (gross)</dt>
              <dd className="bl-metric-value mt-1.5 text-3xl">
                {formatInr(Math.round(impact.interestSaved))}
              </dd>
            </div>
            {impact.mode === 'reduce-tenure' ? (
              <div>
                <dt className="bl-metric-label">Potential Time Saved</dt>
                <dd className="bl-metric-value mt-1.5 text-3xl">{impact.monthsSaved} months</dd>
              </div>
            ) : (
              <div>
                <dt className="bl-metric-label">Revised EMI</dt>
                <dd className="bl-metric-value mt-1.5 text-3xl">
                  {formatInr(Math.round(impact.revised.monthlyEmi))}
                </dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="mt-6 text-sm text-[var(--bl-muted)]">
            Enter a prepayment amount less than outstanding to see illustrative savings.
          </p>
        )}
        <Link
          href={calculatorHref('loan-prepayment')}
          className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--bl-navy)] underline-offset-2 hover:text-[var(--bl-orange)] hover:underline"
        >
          Open Prepayment Calculator →
        </Link>
      </div>
    </section>
  );
}

export function BusinessLoanApplicationJourney() {
  return (
    <section
      id="bl-application"
      aria-labelledby="bl-application-heading"
      className="full-bleed bg-[var(--bl-surface-4)]"
    >
      <div className="site-container bl-section px-4">
        <h2 id="bl-application-heading" className="bl-h2">
          How a Business Loan Application May Progress
        </h2>
        <p className="bl-lede">
          From defining the funding need through disbursement. Steps may vary by lender and facility
          type.
        </p>

        <ol
          className="mt-8 hidden gap-3 md:grid md:grid-cols-3 lg:grid-cols-4"
          aria-label="Application journey"
        >
          {BUSINESS_LOAN_TIMELINE_STEPS.map((step, index) => (
            <li
              key={step}
              className="relative rounded-[var(--bl-radius-md)] bg-white p-4 ring-1 ring-[var(--bl-border)]"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--bl-muted)]">
                Step {index + 1}
              </p>
              <p className="mt-1 text-sm font-bold text-[var(--bl-navy)]">{step}</p>
            </li>
          ))}
        </ol>

        <ol className="relative mt-8 space-y-0 md:hidden">
          {BUSINESS_LOAN_TIMELINE_STEPS.map((step, index) => {
            const isLast = index === BUSINESS_LOAN_TIMELINE_STEPS.length - 1;
            return (
              <li key={step} className="relative flex gap-3 pb-4">
                {!isLast ? (
                  <span
                    className="absolute left-[15px] top-8 bottom-0 w-px bg-[var(--bl-navy)]/25"
                    aria-hidden
                  />
                ) : null}
                <span className="relative z-[1] inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--bl-navy)]/20 bg-white text-xs font-bold text-[var(--bl-navy)]">
                  {index + 1}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--bl-muted)]">
                    Step {index + 1}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-[var(--bl-navy)]">{step}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export function BusinessLoanUseCaseCards() {
  return (
    <section
      id="bl-use-cases"
      aria-labelledby="bl-use-cases-heading"
      className="full-bleed bg-[var(--bl-surface-1)]"
    >
      <div className="site-container bl-section px-4">
        <p className="bl-eyebrow">Use Cases</p>
        <h2 id="bl-use-cases-heading" className="bl-h2">
          Common Business Funding Situations
        </h2>
        <p className="bl-lede">
          Explore how purpose maps to planning questions. Product availability is lender-specific.
        </p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BUSINESS_FUNDING_PURPOSES.slice(0, 6).map((p) => (
            <li key={p.id} className="rounded-[var(--bl-radius-md)] bg-[var(--bl-surface-2)] p-5">
              <h3 className="text-sm font-bold text-[var(--bl-navy)]">{p.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.summary}</p>
              <p className="mt-3 text-xs font-semibold text-[var(--bl-muted)]">
                {facilityHintLabel(p.facilityHint)}
              </p>
            </li>
          ))}
        </ul>
        <a
          href="#bl-purpose"
          className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--bl-navy)] underline-offset-2 hover:text-[var(--bl-orange)] hover:underline"
        >
          Update purpose in the planner →
        </a>
      </div>
    </section>
  );
}
