'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { formatInr } from '@/components/loans/loan-format';
import { usePersonalLoanDecision } from '@/components/loans/personal-loan-decision-context';
import { calculateEmi } from '@/lib/emi';
import { calculatorHref } from '@/lib/finance-routes';

const TENURES = [2, 3, 5] as const;

export function PersonalLoanTenureSimulator() {
  const { amount, ratePercent, setAmount, setRatePercent } = usePersonalLoanDecision();
  const [mobileTenure, setMobileTenure] = useState<(typeof TENURES)[number]>(3);
  const [hovered, setHovered] = useState<number | null>(null);

  const comparisons = useMemo(
    () =>
      TENURES.map((years) => {
        const result = calculateEmi({
          principal: amount,
          annualRatePercent: ratePercent,
          tenureMonths: years * 12,
        });
        return { years, result };
      }),
    [amount, ratePercent],
  );

  return (
    <section
      id="personal-loan-tenure-simulator"
      aria-labelledby="personal-loan-tenure-simulator-heading"
      className="full-bleed bg-[var(--pl-surface-1,#fff)]"
    >
      <div className="site-container pl-section px-4">
        <p className="pl-eyebrow">EMI & Tenure</p>
        <h2 id="personal-loan-tenure-simulator-heading" className="pl-h2">
          See How Tenure Changes Your EMI
        </h2>
        <p className="pl-lede">
          Compare monthly repayment and total interest across different repayment periods.
        </p>

        <div className="mt-6 grid max-w-lg gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-700">
            Loan Amount (₹)
            <input
              type="number"
              inputMode="numeric"
              min={1000}
              step={10000}
              value={amount}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n) && n > 0) setAmount(n);
              }}
              className="mt-1.5 min-h-11 w-full rounded-[var(--pl-radius-md)] border border-[var(--pl-border)] bg-[var(--pl-surface-2)] px-3 text-sm font-semibold tabular-nums text-[var(--pl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-orange)]/30"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-700">
            Interest Rate (% p.a.)
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
              className="mt-1.5 min-h-11 w-full rounded-[var(--pl-radius-md)] border border-[var(--pl-border)] bg-[var(--pl-surface-2)] px-3 text-sm font-semibold tabular-nums text-[var(--pl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-orange)]/30"
            />
          </label>
        </div>

        <div className="mt-5 flex gap-2 md:hidden" role="tablist" aria-label="Compare tenure">
          {TENURES.map((years) => (
            <button
              key={years}
              type="button"
              role="tab"
              aria-selected={mobileTenure === years}
              onClick={() => setMobileTenure(years)}
              className={`min-h-10 flex-1 rounded-full text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-orange)] ${
                mobileTenure === years
                  ? 'bg-[var(--pl-navy)] text-white'
                  : 'bg-[var(--pl-surface-2)] text-[var(--pl-navy)]'
              }`}
            >
              {years} years
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {comparisons.map(({ years, result }) => {
            const showOnMobile = years === mobileTenure;
            const emphasize = hovered === years || (hovered == null && years === 3);
            return (
              <div
                key={years}
                role="tabpanel"
                onMouseEnter={() => setHovered(years)}
                onMouseLeave={() => setHovered(null)}
                className={`rounded-[var(--pl-radius-lg)] bg-[var(--pl-surface-2)] p-5 transition motion-reduce:transition-none ${
                  showOnMobile ? 'block' : 'hidden md:block'
                } ${emphasize ? 'bg-[var(--pl-surface-4)]' : ''}`}
              >
                <p className="pl-metric-label">{years} years</p>
                <p className="mt-3 flex flex-wrap items-baseline gap-1.5">
                  <span className="pl-metric-value text-[2rem] leading-none sm:text-[2.125rem]">
                    {result ? formatInr(Math.round(result.monthlyEmi)) : '—'}
                  </span>
                  <span className="text-xs font-medium text-[var(--pl-muted)]">/month</span>
                </p>
                <dl className="mt-4 space-y-2 border-t border-[var(--pl-border)] pt-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-xs text-[var(--pl-muted)]">Total interest</dt>
                    <dd className="text-sm font-semibold tabular-nums text-slate-700">
                      {result ? formatInr(Math.round(result.totalInterest)) : '—'}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-xs text-[var(--pl-muted)]">Total repayment</dt>
                    <dd className="text-sm font-semibold tabular-nums text-slate-700">
                      {result ? formatInr(Math.round(result.totalRepayment)) : '—'}
                    </dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>

        <div className="mt-7 rounded-[var(--pl-radius-lg)] bg-[var(--pl-surface-2)] px-4 py-5 sm:px-6">
          <p className="pl-metric-label">Tenure tradeoff</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <span className="shrink-0 text-sm font-bold text-[var(--pl-navy)]">
              Lower total interest
            </span>
            <div className="relative h-2 w-full flex-1" aria-hidden>
              <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-gradient-to-r from-[var(--pl-navy)] via-slate-300 to-[var(--pl-orange)]" />
              <span className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-x-0.5 -translate-y-1/2 rounded-full bg-[var(--pl-navy)] ring-[3px] ring-white" />
              <span className="absolute right-0 top-1/2 h-3.5 w-3.5 translate-x-0.5 -translate-y-1/2 rounded-full bg-[var(--pl-orange)] ring-[3px] ring-white" />
            </div>
            <span className="shrink-0 text-sm font-bold text-[var(--pl-navy)]">
              Lower monthly EMI
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Shorter tenure raises EMI and may lower total interest. Longer tenure lowers EMI and may
            raise total interest. Product conditions can change the outcome.
          </p>
        </div>

        <Link
          href={calculatorHref('personal-loan-emi', {
            amount,
            rate: ratePercent,
            tenure: 3,
            tenureUnit: 'years',
          })}
          className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--pl-navy)] underline-offset-2 hover:text-[var(--pl-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-orange)]"
        >
          Open Personal Loan EMI Calculator →
        </Link>
      </div>
    </section>
  );
}
