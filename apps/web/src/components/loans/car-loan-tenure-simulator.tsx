'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { formatInr } from '@/components/loans/loan-format';
import { useCarLoanDecision } from '@/components/loans/car-loan-decision-context';
import { calculateEmi } from '@/lib/emi';
import { calculatorHref } from '@/lib/finance-routes';
import { CAR_LOAN_TENURE_YEARS } from '@/lib/car-loan-page';

export function CarLoanTenureSimulator() {
  const { loanRequirement, ratePercent, tenureYears } = useCarLoanDecision();
  const [mobileTenure, setMobileTenure] = useState<(typeof CAR_LOAN_TENURE_YEARS)[number]>(
    tenureYears as (typeof CAR_LOAN_TENURE_YEARS)[number],
  );
  const [hovered, setHovered] = useState<number | null>(null);

  const comparisons = useMemo(
    () =>
      CAR_LOAN_TENURE_YEARS.map((years) => {
        const result = calculateEmi({
          principal: loanRequirement,
          annualRatePercent: ratePercent,
          tenureMonths: years * 12,
        });
        return { years, result };
      }),
    [loanRequirement, ratePercent],
  );

  const defaultEmphasis = tenureYears;

  return (
    <section
      id="car-loan-tenure-simulator"
      aria-labelledby="car-loan-tenure-simulator-heading"
      className="full-bleed bg-[var(--cl-surface-1)]"
    >
      <div className="site-container cl-section px-4">
        <p className="cl-eyebrow">EMI & Tenure</p>
        <h2 id="car-loan-tenure-simulator-heading" className="cl-h2">
          See How Car Loan Tenure Changes Your EMI
        </h2>
        <p className="cl-lede">
          Compare monthly repayment and total interest across common car loan tenures using your
          current loan requirement and illustrative rate.
        </p>

        <div
          className="mt-5 flex gap-2 overflow-x-auto pb-1 md:hidden"
          role="tablist"
          aria-label="Compare tenure"
        >
          {CAR_LOAN_TENURE_YEARS.map((years) => (
            <button
              key={years}
              type="button"
              role="tab"
              aria-selected={mobileTenure === years}
              onClick={() => setMobileTenure(years)}
              className={`min-h-10 shrink-0 rounded-full px-3.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)] ${
                mobileTenure === years
                  ? 'bg-[var(--cl-navy)] text-white'
                  : 'bg-[var(--cl-surface-2)] text-[var(--cl-navy)]'
              }`}
            >
              {years} {years === 1 ? 'year' : 'years'}
            </button>
          ))}
        </div>

        <div className="mt-5 flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:overflow-visible">
          {comparisons.map(({ years, result }) => {
            const showOnMobile = years === mobileTenure;
            const emphasize = hovered === years || (hovered == null && years === defaultEmphasis);
            return (
              <div
                key={years}
                role="tabpanel"
                onMouseEnter={() => setHovered(years)}
                onMouseLeave={() => setHovered(null)}
                className={`min-w-[11.5rem] shrink-0 p-5 transition duration-150 motion-reduce:transition-none md:min-w-0 ${
                  showOnMobile ? 'block' : 'hidden md:block'
                } ${emphasize ? 'bg-[var(--cl-surface-4)]' : 'bg-[var(--cl-surface-2)]'}`}
              >
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--cl-muted)]">
                  {emphasize ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--cl-orange)]" aria-hidden />
                  ) : null}
                  {years} {years === 1 ? 'year' : 'years'}
                </p>
                <p className="mt-3 flex flex-wrap items-baseline gap-1.5">
                  <span className="cl-metric-value text-[2rem] leading-none sm:text-[2.125rem]">
                    {result ? formatInr(Math.round(result.monthlyEmi)) : '—'}
                  </span>
                  <span className="text-xs font-medium text-[var(--cl-muted)]">/month</span>
                </p>
                <dl className="mt-4 space-y-2 border-t border-[var(--cl-border)] pt-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-xs text-[var(--cl-muted)]">Total interest</dt>
                    <dd className="text-sm font-semibold tabular-nums text-slate-700">
                      {result ? formatInr(Math.round(result.totalInterest)) : '—'}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-xs text-[var(--cl-muted)]">Total repayment</dt>
                    <dd className="text-sm font-semibold tabular-nums text-slate-700">
                      {result ? formatInr(Math.round(result.totalRepayment)) : '—'}
                    </dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>

        <div className="mt-7 bg-[var(--cl-surface-2)] px-4 py-5 sm:px-6">
          <p className="cl-metric-label">Tenure tradeoff</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="shrink-0 text-sm">
              <p className="font-bold text-[var(--cl-navy)]">Shorter tenure</p>
              <p className="text-xs text-[var(--cl-muted)]">Higher EMI · Lower total interest</p>
            </div>
            <div className="relative h-2 w-full flex-1" aria-hidden>
              <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-[var(--cl-border)]" />
              <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-gradient-to-r from-[var(--cl-navy)] via-slate-300 to-[var(--cl-orange)] opacity-90" />
              <span className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-x-0.5 -translate-y-1/2 rounded-full bg-[var(--cl-navy)] ring-[3px] ring-white" />
              <span className="absolute right-0 top-1/2 h-3.5 w-3.5 translate-x-0.5 -translate-y-1/2 rounded-full bg-[var(--cl-orange)] ring-[3px] ring-white" />
            </div>
            <div className="shrink-0 text-sm sm:text-right">
              <p className="font-bold text-[var(--cl-navy)]">Longer tenure</p>
              <p className="text-xs text-[var(--cl-muted)]">Lower EMI · Higher total interest</p>
            </div>
          </div>
        </div>

        <Link
          href={calculatorHref('car-loan')}
          className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--cl-navy)] underline-offset-2 hover:text-[var(--cl-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)]"
        >
          Open Car Loan EMI Calculator →
        </Link>
      </div>
    </section>
  );
}
