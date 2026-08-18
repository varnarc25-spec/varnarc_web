'use client';

import { formatInr } from '@/components/loans/loan-format';
import { useGoldLoanDecision } from '@/components/loans/gold-loan-decision-context';

export function GoldLoanSnapshot() {
  const {
    requiredLoan,
    weightG,
    karat,
    tenureMonths,
    repaymentMode,
    valuation,
    capacity,
    goldRequiredG,
    emi,
    ratePercent,
    setRatePercent,
  } = useGoldLoanDecision();

  const repaymentLabel =
    repaymentMode === 'emi'
      ? 'EMI'
      : repaymentMode === 'interest_only'
        ? 'Periodic interest'
        : 'Bullet-style';

  return (
    <section
      id="gl-snapshot"
      aria-labelledby="gl-snapshot-heading"
      className="full-bleed bg-[var(--gl-surface-3)]"
    >
      <div className="site-container gl-section px-4">
        <h2 id="gl-snapshot-heading" className="gl-h2">
          Your Gold Loan Snapshot
        </h2>
        <p className="gl-lede">
          Indicative planning outputs from your gold profile and illustrative rate. Not a lender
          offer, guaranteed valuation or approval.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="gl-metric-label">Required Loan</p>
            <p className="gl-metric-value mt-2 text-[2rem] leading-none sm:text-[2.5rem]">
              {formatInr(requiredLoan)}
            </p>
          </div>
          <div>
            <p className="gl-metric-label">Estimated Eligible Gold Value</p>
            <p className="gl-metric-value mt-2 text-[2rem] leading-none sm:text-[2.5rem]">
              {valuation ? formatInr(Math.round(valuation.estimatedGoldValue)) : '—'}
            </p>
          </div>
          <div>
            <p className="gl-metric-label">Indicative Borrowing Capacity</p>
            <p className="gl-metric-value mt-2 text-[2rem] leading-none sm:text-[2.5rem]">
              {capacity ? formatInr(Math.round(capacity.indicativeMaxLoan)) : '—'}
            </p>
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-x-5 gap-y-5 border-t border-[var(--gl-border)] pt-6 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { label: 'Gold Weight', value: `${weightG} g` },
            { label: 'Purity', value: `${karat}K` },
            {
              label: 'Estimated Gold Required',
              value: goldRequiredG != null ? `${goldRequiredG.toFixed(1)} g` : '—',
            },
            {
              label: 'Indicative EMI',
              value: emi ? `${formatInr(Math.round(emi.monthlyEmi))}/mo` : '—',
            },
            { label: 'Tenure', value: `${tenureMonths} months` },
            { label: 'Repayment Preference', value: repaymentLabel },
          ].map((row) => (
            <div key={row.label}>
              <dt className="text-sm font-medium uppercase tracking-wide text-[var(--gl-muted)]">
                {row.label}
              </dt>
              <dd className="mt-1 text-base font-bold tabular-nums text-[var(--gl-navy)]">
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
              className="mt-1.5 min-h-11 w-full rounded-[var(--gl-radius-md)] border border-[var(--gl-border)] bg-white/80 px-3 text-sm font-semibold tabular-nums text-[var(--gl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-orange)]/30"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-[var(--gl-border)] pt-5">
          <a
            href="#gl-offers"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--gl-radius-md)] bg-[var(--gl-navy)] px-5 text-sm font-semibold !text-white hover:bg-[var(--gl-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-orange)]"
          >
            Explore Available Offers
          </a>
          <a
            href="#gl-valuation"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--gl-navy)] underline-offset-2 hover:underline"
          >
            Adjust Gold Details →
          </a>
        </div>
      </div>
    </section>
  );
}
