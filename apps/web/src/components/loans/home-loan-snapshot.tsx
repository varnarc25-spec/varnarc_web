'use client';

import { formatInr } from '@/components/loans/loan-format';
import {
  HOME_LOAN_ILLUSTRATIVE_RATE,
  useHomeLoanDecision,
} from '@/components/loans/home-loan-decision-context';

export function HomeLoanSnapshot() {
  const {
    propertyValue,
    downPayment,
    loanRequirement,
    tenureYears,
    ratePercent,
    ltvPercent,
    setRatePercent,
    emiResult,
  } = useHomeLoanDecision();

  return (
    <section
      id="home-loan-snapshot"
      aria-labelledby="home-loan-snapshot-heading"
      className="full-bleed bg-[var(--hl-surface-3)]"
    >
      <div className="site-container hl-section px-4">
        <p className="hl-eyebrow">Financing Snapshot</p>
        <h2 id="home-loan-snapshot-heading" className="hl-h2">
          Your Home Financing Snapshot
        </h2>
        <p className="hl-lede">
          See how property value, down payment and tenure may affect loan requirement, monthly EMI
          and total borrowing cost.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] lg:items-end">
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <p className="hl-metric-label">Loan Required</p>
              <p className="hl-metric-value mt-2 text-[2.25rem] leading-none sm:text-[3rem]">
                {formatInr(loanRequirement)}
              </p>
            </div>
            <div>
              <p className="hl-metric-label">Estimated Monthly EMI</p>
              <p className="mt-2 flex flex-wrap items-baseline gap-2">
                <span className="hl-metric-value text-[2.25rem] leading-none sm:text-[3rem]">
                  {emiResult ? formatInr(Math.round(emiResult.monthlyEmi)) : '—'}
                </span>
                <span className="text-sm font-medium text-[var(--hl-muted)]">/month</span>
              </p>
              <p className="mt-2 text-xs text-[var(--hl-muted)]">
                Illustrative at {ratePercent}% p.a. — not a lender offer.
              </p>
            </div>
          </div>

          <label className="block max-w-xs text-sm font-semibold text-slate-700">
            Adjust illustrative rate (% p.a.)
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={50}
              step={0.1}
              value={ratePercent}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n)) setRatePercent(n);
              }}
              className="mt-1.5 min-h-11 w-full rounded-[var(--hl-radius-md)] border border-[var(--hl-border)] bg-white/80 px-3 text-sm font-semibold tabular-nums text-[var(--hl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)]/30"
            />
            <button
              type="button"
              onClick={() => setRatePercent(HOME_LOAN_ILLUSTRATIVE_RATE)}
              className="mt-1.5 text-xs font-semibold text-[var(--hl-muted)] underline-offset-2 hover:text-[var(--hl-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)]"
            >
              Reset to {HOME_LOAN_ILLUSTRATIVE_RATE}% illustrative default
            </button>
          </label>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-x-5 gap-y-5 border-t border-[var(--hl-border)] pt-6 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Property Value', value: formatInr(propertyValue) },
            { label: 'Down Payment', value: formatInr(downPayment) },
            {
              label: 'Total Interest',
              value: emiResult ? formatInr(Math.round(emiResult.totalInterest)) : '—',
            },
            {
              label: 'Total Repayment',
              value: emiResult ? formatInr(Math.round(emiResult.totalRepayment)) : '—',
            },
            {
              label: 'Tenure',
              value: `${tenureYears} ${tenureYears === 1 ? 'year' : 'years'}`,
            },
            {
              label: 'LTV',
              value: ltvPercent != null ? `${ltvPercent.toFixed(1)}%` : '—',
            },
          ].map((item) => (
            <div key={item.label} className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--hl-muted)]">
                {item.label}
              </dt>
              <dd className="mt-1 text-base font-semibold tabular-nums text-slate-700 sm:text-lg">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 border-t border-[var(--hl-border)] pt-5">
          <a
            href="#home-loan-offers"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--hl-radius-md)] bg-[var(--hl-navy)] px-5 text-sm font-semibold text-white transition duration-150 hover:bg-[var(--hl-navy-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)] focus-visible:ring-offset-2"
          >
            See Matching Home Loans →
          </a>
        </div>
      </div>
    </section>
  );
}
