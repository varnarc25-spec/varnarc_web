'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { formatInr } from '@/components/loans/loan-format';
import { useHomeLoanDecision } from '@/components/loans/home-loan-decision-context';
import { calculateEmi } from '@/lib/emi';
import { calculatorHref } from '@/lib/finance-routes';
import { HOME_LOAN_TENURE_YEARS } from '@/lib/home-loan-page';

export function HomeLoanTenureSimulator() {
  const { loanRequirement, ratePercent, tenureYears } = useHomeLoanDecision();
  const [mobileTenure, setMobileTenure] = useState<(typeof HOME_LOAN_TENURE_YEARS)[number]>(
    tenureYears as (typeof HOME_LOAN_TENURE_YEARS)[number],
  );
  const [hovered, setHovered] = useState<number | null>(null);

  const comparisons = useMemo(
    () =>
      HOME_LOAN_TENURE_YEARS.map((years) => {
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
      id="home-loan-tenure-simulator"
      aria-labelledby="home-loan-tenure-simulator-heading"
      className="full-bleed bg-[var(--hl-surface-1)]"
    >
      <div className="site-container hl-section px-4">
        <p className="hl-eyebrow">EMI & Tenure</p>
        <h2 id="home-loan-tenure-simulator-heading" className="hl-h2">
          See How Home Loan Tenure Changes Your Cost
        </h2>
        <p className="hl-lede">
          Compare monthly repayment and total interest across common home loan tenures using your
          current loan requirement and illustrative rate.
        </p>

        <div
          className="mt-5 flex gap-2 overflow-x-auto pb-1 md:hidden"
          role="tablist"
          aria-label="Compare tenure"
        >
          {HOME_LOAN_TENURE_YEARS.map((years) => (
            <button
              key={years}
              type="button"
              role="tab"
              aria-selected={mobileTenure === years}
              onClick={() => setMobileTenure(years)}
              className={`min-h-10 shrink-0 rounded-full px-3.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)] ${
                mobileTenure === years
                  ? 'bg-[var(--hl-navy)] text-white'
                  : 'bg-[var(--hl-surface-2)] text-[var(--hl-navy)]'
              }`}
            >
              {years} years
            </button>
          ))}
        </div>

        <div className="mt-5 flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-5">
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
                } ${emphasize ? 'bg-[var(--hl-surface-4)]' : 'bg-[var(--hl-surface-2)]'}`}
              >
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--hl-muted)]">
                  {emphasize ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--hl-orange)]" aria-hidden />
                  ) : null}
                  {years} years
                </p>
                <p className="mt-3 flex flex-wrap items-baseline gap-1.5">
                  <span className="hl-metric-value text-[2rem] leading-none sm:text-[2.125rem]">
                    {result ? formatInr(Math.round(result.monthlyEmi)) : '—'}
                  </span>
                  <span className="text-xs font-medium text-[var(--hl-muted)]">/month</span>
                </p>
                <dl className="mt-4 space-y-2 border-t border-[var(--hl-border)] pt-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-xs text-[var(--hl-muted)]">Total interest</dt>
                    <dd className="text-sm font-semibold tabular-nums text-slate-700">
                      {result ? formatInr(Math.round(result.totalInterest)) : '—'}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-xs text-[var(--hl-muted)]">Total repayment</dt>
                    <dd className="text-sm font-semibold tabular-nums text-slate-700">
                      {result ? formatInr(Math.round(result.totalRepayment)) : '—'}
                    </dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>

        <div className="mt-7 bg-[var(--hl-surface-2)] px-4 py-5 sm:px-6">
          <p className="hl-metric-label">Tenure tradeoff</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="shrink-0 text-sm">
              <p className="font-bold text-[var(--hl-navy)]">Shorter tenure</p>
              <p className="text-xs text-[var(--hl-muted)]">Higher EMI · Lower total interest</p>
            </div>
            <div className="relative h-2 w-full flex-1" aria-hidden>
              <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-[var(--hl-border)]" />
              <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-gradient-to-r from-[var(--hl-navy)] via-slate-300 to-[var(--hl-orange)] opacity-90" />
              <span className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-x-0.5 -translate-y-1/2 rounded-full bg-[var(--hl-navy)] ring-[3px] ring-white" />
              <span className="absolute right-0 top-1/2 h-3.5 w-3.5 translate-x-0.5 -translate-y-1/2 rounded-full bg-[var(--hl-orange)] ring-[3px] ring-white" />
            </div>
            <div className="shrink-0 text-sm sm:text-right">
              <p className="font-bold text-[var(--hl-navy)]">Longer tenure</p>
              <p className="text-xs text-[var(--hl-muted)]">Lower EMI · Higher total interest</p>
            </div>
          </div>
        </div>

        <Link
          href={calculatorHref('home-loan-emi', {
            amount: loanRequirement,
            rate: ratePercent,
            tenure: tenureYears,
            tenureUnit: 'years',
          })}
          className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--hl-navy)] underline-offset-2 hover:text-[var(--hl-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)]"
        >
          Open Home Loan EMI Calculator →
        </Link>
      </div>
    </section>
  );
}
