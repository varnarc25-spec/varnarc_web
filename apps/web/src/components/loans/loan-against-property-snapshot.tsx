'use client';

import { formatInr } from '@/components/loans/loan-format';
import { useLapDecision } from '@/components/loans/loan-against-property-decision-context';

export function LoanAgainstPropertySnapshot() {
  const {
    propertyValue,
    requiredLoan,
    tenureYears,
    capacity,
    ltv,
    emi,
    incomeCapacity,
    ratePercent,
    setRatePercent,
  } = useLapDecision();

  return (
    <section
      id="lap-snapshot"
      aria-labelledby="lap-snapshot-heading"
      className="full-bleed bg-[var(--lap-surface-3)]"
    >
      <div className="site-container lap-section px-4">
        <h2 id="lap-snapshot-heading" className="lap-h2">
          Your LAP Snapshot
        </h2>
        <p className="lap-lede">
          Indicative planning outputs from property value, requested loan and illustrative rate. Not
          a lender offer, guaranteed valuation or approval.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="lap-metric-label" id="lap-snap-property-label">
              Property Value
            </p>
            <p
              className="lap-metric-value mt-2 text-[2rem] leading-none sm:text-[2.5rem]"
              aria-labelledby="lap-snap-property-label"
            >
              {formatInr(propertyValue)}
            </p>
          </div>
          <div>
            <p className="lap-metric-label" id="lap-snap-capacity-label">
              Indicative Capacity
            </p>
            <p
              className="lap-metric-value mt-2 text-[2rem] leading-none sm:text-[2.5rem]"
              aria-labelledby="lap-snap-capacity-label"
            >
              {capacity ? formatInr(Math.round(capacity.indicativeMaxLoan)) : '—'}
            </p>
          </div>
          <div>
            <p className="lap-metric-label" id="lap-snap-requested-label">
              Requested Loan
            </p>
            <p
              className="lap-metric-value mt-2 text-[2rem] leading-none sm:text-[2.5rem]"
              aria-labelledby="lap-snap-requested-label"
            >
              {formatInr(requiredLoan)}
            </p>
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-x-5 gap-y-5 border-t border-[var(--lap-border)] pt-6 sm:grid-cols-3 lg:grid-cols-4">
          {[
            {
              label: 'Requested LTV',
              value: ltv != null ? `${ltv.toFixed(1)}%` : '—',
            },
            {
              label: 'Indicative EMI',
              value: emi ? `${formatInr(Math.round(emi.monthlyEmi))}/mo` : '—',
            },
            {
              label: 'Total Interest',
              value: emi ? formatInr(Math.round(emi.totalInterest)) : '—',
            },
            { label: 'Tenure', value: `${tenureYears} years` },
            ...(incomeCapacity
              ? [
                  {
                    label: `Income-based Capacity (@ ${Math.round(incomeCapacity.foirRatioUsed * 100)}% illustrative FOIR)`,
                    value:
                      incomeCapacity.illustrativeLoanFromIncome != null
                        ? formatInr(Math.round(incomeCapacity.illustrativeLoanFromIncome))
                        : '—',
                  },
                ]
              : []),
          ].map((row) => (
            <div key={row.label}>
              <dt className="text-sm font-medium uppercase tracking-wide text-[var(--lap-muted)]">
                {row.label}
              </dt>
              <dd className="mt-1 text-base font-bold tabular-nums text-[var(--lap-navy)]">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 max-w-xs">
          <label className="block text-sm font-semibold text-slate-700">
            Illustrative interest rate (% p.a.)
            <input
              type="number"
              min={0}
              max={50}
              step={0.1}
              value={ratePercent}
              onChange={(e) => setRatePercent(Number(e.target.value))}
              className="mt-1.5 min-h-11 w-full rounded-[var(--lap-radius-md)] border border-[var(--lap-border)] bg-white/80 px-3 text-sm font-semibold tabular-nums text-[var(--lap-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lap-orange)]/30"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-[var(--lap-border)] pt-5">
          <a
            href="#lap-offers"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--lap-radius-md)] bg-[var(--lap-navy)] px-5 text-sm font-semibold !text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lap-orange)]"
          >
            Explore Offers
          </a>
          <a
            href="#lap-capacity"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lap-navy)] underline-offset-2 hover:underline"
          >
            Adjust Details →
          </a>
        </div>
      </div>
    </section>
  );
}
