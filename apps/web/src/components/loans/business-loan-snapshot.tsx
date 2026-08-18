'use client';

import { formatInr } from '@/components/loans/loan-format';
import { useBusinessLoanDecision } from '@/components/loans/business-loan-decision-context';
import { BUSINESS_FUNDING_PURPOSES } from '@/lib/business-loan-page';

export function BusinessLoanSnapshot() {
  const { fundingRequired, tenureYears, purpose, ratePercent, setRatePercent, emi, cashFlow } =
    useBusinessLoanDecision();

  const purposeLabel = BUSINESS_FUNDING_PURPOSES.find((p) => p.id === purpose)?.label ?? '—';

  return (
    <section
      id="bl-snapshot"
      aria-labelledby="bl-snapshot-heading"
      className="full-bleed bg-[var(--bl-surface-3)]"
    >
      <div className="site-container bl-section px-4">
        <h2 id="bl-snapshot-heading" className="bl-h2">
          Your Business Funding Snapshot
        </h2>
        <p className="bl-lede">
          Planning outputs from your funding inputs and illustrative rate. Not a lender offer or
          government approval.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="bl-metric-label">Funding Requirement</p>
            <p className="bl-metric-value mt-2 text-[2.25rem] leading-none sm:text-[3rem]">
              {formatInr(fundingRequired)}
            </p>
          </div>
          <div>
            <p className="bl-metric-label">Illustrative Monthly EMI</p>
            <p className="bl-metric-value mt-2 text-[2.25rem] leading-none sm:text-[3rem]">
              {emi ? `${formatInr(Math.round(emi.monthlyEmi))}/mo` : '—'}
            </p>
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-x-5 gap-y-5 border-t border-[var(--bl-border)] pt-6 sm:grid-cols-3 lg:grid-cols-4">
          {[
            {
              label: 'Total Interest',
              value: emi ? formatInr(Math.round(emi.totalInterest)) : '—',
            },
            {
              label: 'Total Repayment',
              value: emi ? formatInr(Math.round(emi.totalRepayment)) : '—',
            },
            { label: 'Tenure', value: `${tenureYears} years` },
            { label: 'Funding Purpose', value: purposeLabel },
            {
              label: 'Estimated Monthly Cash-Flow Requirement',
              value: emi ? `${formatInr(Math.round(emi.monthlyEmi))}/mo` : '—',
            },
            {
              label: 'Surplus After Proposed EMI',
              value: cashFlow ? formatInr(Math.round(cashFlow.surplusAfterProposedEmi)) : '—',
            },
          ].map((row) => (
            <div key={row.label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--bl-muted)] sm:text-[0.8125rem]">
                {row.label}
              </dt>
              <dd className="mt-1 text-sm font-bold tabular-nums text-[var(--bl-navy)] sm:text-base">
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
              className="mt-1.5 min-h-11 w-full rounded-[var(--bl-radius-md)] border border-[var(--bl-border)] bg-white/80 px-3 text-sm font-semibold tabular-nums text-[var(--bl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)]/30"
            />
          </label>
        </div>

        <p className="mt-5 text-sm text-[var(--bl-muted)]">
          Cash-flow figures update when you enter revenue and expenses below. Government or lender
          eligibility is never assumed from this snapshot alone.
        </p>

        <div className="mt-6 border-t border-[var(--bl-border)] pt-5">
          <a
            href="#bl-cash-flow"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--bl-radius-md)] bg-[var(--bl-navy)] px-5 text-sm font-semibold !text-white transition hover:bg-[var(--bl-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bl-orange)]"
          >
            Evaluate Repayment Capacity →
          </a>
        </div>
      </div>
    </section>
  );
}
