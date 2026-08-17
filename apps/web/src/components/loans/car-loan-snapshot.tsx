'use client';

import { formatInr } from '@/components/loans/loan-format';
import {
  CAR_LOAN_ILLUSTRATIVE_RATE,
  useCarLoanDecision,
} from '@/components/loans/car-loan-decision-context';

export function CarLoanSnapshot() {
  const {
    vehiclePrice,
    downPayment,
    loanRequirement,
    financingPercent,
    tenureYears,
    ratePercent,
    setRatePercent,
    emiResult,
  } = useCarLoanDecision();

  return (
    <section
      id="car-loan-snapshot"
      aria-labelledby="car-loan-snapshot-heading"
      className="full-bleed bg-[var(--cl-surface-3)]"
    >
      <div className="site-container cl-section px-4">
        <p className="cl-eyebrow">Financing Snapshot</p>
        <h2 id="car-loan-snapshot-heading" className="cl-h2">
          Your Car Financing Snapshot
        </h2>
        <p className="cl-lede">
          See how vehicle price, down payment and tenure may affect loan requirement, monthly EMI
          and total borrowing cost.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] lg:items-end">
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <p className="cl-metric-label">Loan Required</p>
              <p className="cl-metric-value mt-2 text-[2.25rem] leading-none sm:text-[3rem]">
                {formatInr(loanRequirement)}
              </p>
            </div>
            <div>
              <p className="cl-metric-label">Estimated Monthly EMI</p>
              <p className="mt-2 flex flex-wrap items-baseline gap-2">
                <span className="cl-metric-value text-[2.25rem] leading-none sm:text-[3rem]">
                  {emiResult ? formatInr(Math.round(emiResult.monthlyEmi)) : '—'}
                </span>
                <span className="text-sm font-medium text-[var(--cl-muted)]">/month</span>
              </p>
              <p className="mt-2 text-xs text-[var(--cl-muted)]">
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
              className="mt-1.5 min-h-11 w-full rounded-[var(--cl-radius-md)] border border-[var(--cl-border)] bg-white/80 px-3 text-sm font-semibold tabular-nums text-[var(--cl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)]/30"
            />
            <button
              type="button"
              onClick={() => setRatePercent(CAR_LOAN_ILLUSTRATIVE_RATE)}
              className="mt-1.5 text-xs font-semibold text-[var(--cl-muted)] underline-offset-2 hover:text-[var(--cl-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)]"
            >
              Reset to {CAR_LOAN_ILLUSTRATIVE_RATE}% illustrative default
            </button>
          </label>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-x-5 gap-y-5 border-t border-[var(--cl-border)] pt-6 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Vehicle Price', value: formatInr(vehiclePrice) },
            { label: 'Down Payment', value: formatInr(downPayment) },
            {
              label: 'Financing %',
              value: financingPercent != null ? `${financingPercent.toFixed(1)}%` : '—',
            },
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
          ].map((item) => (
            <div key={item.label} className="min-w-0">
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--cl-muted)]">
                {item.label}
              </dt>
              <dd className="mt-1 text-base font-semibold tabular-nums text-slate-700 sm:text-lg">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 border-t border-[var(--cl-border)] pt-5">
          <a
            href="#car-loan-offers"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--cl-radius-md)] bg-[var(--cl-navy)] px-5 text-sm font-semibold !text-white transition duration-150 hover:bg-[var(--cl-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)] focus-visible:ring-offset-2"
          >
            See Matching Car Loans →
          </a>
        </div>
      </div>
    </section>
  );
}
