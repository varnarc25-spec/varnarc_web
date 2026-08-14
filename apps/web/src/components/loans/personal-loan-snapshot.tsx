'use client';

import { useState } from 'react';
import { formatInr } from '@/components/loans/loan-format';
import {
  PERSONAL_LOAN_ILLUSTRATIVE_RATE,
  usePersonalLoanDecision,
} from '@/components/loans/personal-loan-decision-context';
import { PersonalLoanAffordabilityPanel } from '@/components/loans/personal-loan-affordability';

export function PersonalLoanSnapshot() {
  const { amount, tenureYears, ratePercent, setRatePercent, emiResult } = usePersonalLoanDecision();
  const [showAffordability, setShowAffordability] = useState(false);

  return (
    <section
      id="personal-loan-snapshot"
      aria-labelledby="personal-loan-snapshot-heading"
      className="mt-8 rounded-[var(--pl-radius-lg)] bg-[var(--pl-surface-3,#faf7f2)] px-4 py-6 sm:px-6 sm:py-7 lg:px-7"
    >
      <p className="pl-eyebrow">Your Snapshot</p>
      <h2 id="personal-loan-snapshot-heading" className="pl-h2">
        Your Personal Loan Snapshot
      </h2>
      <p className="pl-lede">
        See how your selected amount and repayment period may affect monthly repayment and total
        borrowing cost.
      </p>

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end">
        <div>
          <p className="pl-metric-label">Estimated Monthly EMI</p>
          <p className="mt-2 flex flex-wrap items-baseline gap-2">
            <span className="pl-metric-value text-[2.75rem] leading-none sm:text-[3.5rem]">
              {emiResult ? formatInr(Math.round(emiResult.monthlyEmi)) : '—'}
            </span>
            <span className="text-sm font-medium text-[var(--pl-muted)]">/month</span>
          </p>
          <p className="mt-2.5 text-xs text-[var(--pl-muted)]">
            Illustrative calculation at {ratePercent}% p.a. — not a market rate or lender offer.
          </p>
        </div>

        <label className="block max-w-xs text-xs font-semibold text-slate-700">
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
            className="mt-1.5 min-h-11 w-full rounded-[var(--pl-radius-md)] border border-[var(--pl-border)] bg-white/80 px-3 text-sm font-semibold tabular-nums text-[var(--pl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-orange)]/30"
          />
          <button
            type="button"
            onClick={() => setRatePercent(PERSONAL_LOAN_ILLUSTRATIVE_RATE)}
            className="mt-1.5 text-[11px] font-semibold text-[var(--pl-muted)] underline-offset-2 hover:text-[var(--pl-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-orange)]"
          >
            Reset to {PERSONAL_LOAN_ILLUSTRATIVE_RATE}% illustrative default
          </button>
        </label>
      </div>

      <dl className="mt-7 grid grid-cols-2 gap-x-5 gap-y-5 border-t border-[var(--pl-border)] pt-6 sm:grid-cols-4">
        {[
          { label: 'Loan Amount', value: formatInr(amount) },
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
            <dt className="pl-metric-label">{item.label}</dt>
            <dd className="pl-metric-value mt-1.5 text-lg sm:text-xl">{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-col gap-2 border-t border-[var(--pl-border)] pt-5 sm:flex-row sm:items-center sm:gap-4">
        <a
          href="#personal-loan-offers"
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--pl-radius-md)] bg-[var(--pl-navy)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--pl-navy-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-orange)] focus-visible:ring-offset-2"
        >
          See Matching Personal Loans →
        </a>
        <button
          type="button"
          aria-expanded={showAffordability}
          onClick={() => setShowAffordability((v) => !v)}
          className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-slate-600 transition hover:text-[var(--pl-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-orange)]"
        >
          {showAffordability ? 'Hide affordability estimate' : 'Estimate affordability'}
        </button>
      </div>

      {showAffordability ? (
        <div className="mt-5 border-t border-[var(--pl-border)] pt-5">
          <PersonalLoanAffordabilityPanel compact />
        </div>
      ) : null}
    </section>
  );
}
