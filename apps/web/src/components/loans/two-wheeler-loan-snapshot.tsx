'use client';

import { formatInr } from '@/components/loans/loan-format';
import {
  TW_ILLUSTRATIVE_RATE,
  useTwoWheelerDecision,
} from '@/components/loans/two-wheeler-loan-decision-context';

export function TwoWheelerLoanSnapshot() {
  const {
    vehiclePrice,
    downPayment,
    loanRequirement,
    financingPercent,
    tenureYears,
    ratePercent,
    setRatePercent,
    emiResult,
  } = useTwoWheelerDecision();

  return (
    <section
      id="tw-snapshot"
      aria-labelledby="tw-snapshot-heading"
      className="full-bleed bg-[var(--tw-surface-3)]"
    >
      <div className="site-container cl-section px-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--tw-orange)]">
          Financing Snapshot
        </p>
        <h2 id="tw-snapshot-heading" className="cl-h2 text-[var(--tw-navy)]">
          Your Two-Wheeler Financing Snapshot
        </h2>
        <p className="cl-lede text-[var(--tw-muted)]">
          See how vehicle price, down payment and tenure affect loan requirement, monthly EMI and
          total borrowing cost.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] lg:items-end">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--tw-muted)]">
                Vehicle Price
              </p>
              <p className="mt-2 text-2xl font-extrabold tabular-nums text-[var(--tw-navy)] sm:text-3xl">
                {formatInr(vehiclePrice)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--tw-muted)]">
                Loan Required
              </p>
              <p className="mt-2 text-2xl font-extrabold tabular-nums text-[var(--tw-navy)] sm:text-3xl">
                {formatInr(loanRequirement)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--tw-muted)]">
                Estimated Monthly EMI
              </p>
              <p className="mt-2 flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-extrabold tabular-nums text-[var(--tw-navy)] sm:text-3xl">
                  {emiResult ? formatInr(Math.round(emiResult.monthlyEmi)) : '—'}
                </span>
                <span className="text-sm font-medium text-[var(--tw-muted)]">/month</span>
              </p>
              <p className="mt-2 text-xs text-[var(--tw-muted)]">
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
              className="mt-1.5 min-h-11 w-full rounded-[var(--tw-radius-md)] border border-[var(--tw-border)] bg-white/80 px-3 text-sm font-semibold tabular-nums text-[var(--tw-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tw-orange)]/30"
            />
            <button
              type="button"
              onClick={() => setRatePercent(TW_ILLUSTRATIVE_RATE)}
              className="mt-1.5 text-xs font-semibold text-[var(--tw-muted)] underline-offset-2 hover:text-[var(--tw-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tw-orange)]"
            >
              Reset to {TW_ILLUSTRATIVE_RATE}% illustrative default
            </button>
          </label>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-x-5 gap-y-5 border-t border-[var(--tw-border)] pt-6 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Down Payment', value: formatInr(downPayment) },
            {
              label: 'Financing %',
              value: financingPercent != null ? `${financingPercent.toFixed(1)}%` : '—',
            },
            {
              label: 'Tenure',
              value: `${tenureYears} ${tenureYears === 1 ? 'year' : 'years'}`,
            },
            {
              label: 'Total Interest',
              value: emiResult ? formatInr(Math.round(emiResult.totalInterest)) : '—',
            },
            {
              label: 'Total Repayment',
              value: emiResult ? formatInr(Math.round(emiResult.totalRepayment)) : '—',
            },
            { label: 'Vehicle Price', value: formatInr(vehiclePrice) },
          ].map((item) => (
            <div key={item.label} className="min-w-0">
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--tw-muted)]">
                {item.label}
              </dt>
              <dd className="mt-1 text-base font-semibold tabular-nums text-slate-700 sm:text-lg">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-[var(--tw-border)] pt-5">
          <a
            href="#tw-offers"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--tw-radius-md)] bg-[var(--tw-navy)] px-5 text-sm font-semibold !text-white transition duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tw-orange)] focus-visible:ring-offset-2"
          >
            Explore Offers
          </a>
          <a
            href="#tw-hero-planner"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--tw-radius-md)] border border-[var(--tw-border)] bg-white px-5 text-sm font-semibold text-[var(--tw-navy)] transition duration-150 hover:text-[var(--tw-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tw-orange)]"
          >
            Adjust Details →
          </a>
        </div>
      </div>
    </section>
  );
}
