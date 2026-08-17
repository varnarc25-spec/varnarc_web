'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { formatInr } from '@/components/loans/loan-format';
import { useCarLoanDecision } from '@/components/loans/car-loan-decision-context';
import { CAR_LOAN_TENURE_YEARS, estimateCarAffordability } from '@/lib/car-loan-page';
import { trackAnalyticsEvent } from '@/lib/analytics-client';
import { calculatorHref } from '@/lib/finance-routes';

function parseNonNeg(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw.replace(/,/g, ''));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

const fieldClass =
  'mt-1.5 min-h-11 w-full rounded-[var(--cl-radius-md)] border border-[var(--cl-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--cl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)]/30';

export function CarLoanAffordability({ standalone = false }: { standalone?: boolean }) {
  const { ratePercent, tenureYears } = useCarLoanDecision();
  const [income, setIncome] = useState('80,000');
  const [existingEmis, setExistingEmis] = useState('10,000');
  const [downPayment, setDownPayment] = useState('2,40,000');
  const [rate, setRate] = useState(String(ratePercent));
  const [localTenure, setLocalTenure] = useState(tenureYears);
  const [foirPercent, setFoirPercent] = useState('40');

  const estimate = useMemo(() => {
    const monthlyIncome = parseNonNeg(income);
    const emis = parseNonNeg(existingEmis) ?? 0;
    const availableDown = parseNonNeg(downPayment) ?? 0;
    const annualRate = parseNonNeg(rate);
    const foir = parseNonNeg(foirPercent);
    if (monthlyIncome == null || annualRate == null || foir == null) return null;

    return estimateCarAffordability({
      monthlyIncome,
      existingEmis: emis,
      availableDownPayment: availableDown,
      annualRatePercent: annualRate,
      tenureYears: localTenure,
      foirRatio: foir / 100,
    });
  }, [income, existingEmis, downPayment, rate, localTenure, foirPercent]);

  function trackStarted() {
    try {
      trackAnalyticsEvent({
        eventType: 'custom',
        entityType: 'car_loan',
        entityId: 'affordability',
        metadata: { action: 'car_eligibility_started' },
      });
    } catch {
      /* optional */
    }
  }

  const content = (
    <>
      <p className="cl-eyebrow">Affordability</p>
      <h2 id="car-loan-affordability-heading" className="cl-h2">
        How Much Car Can You Afford?
      </h2>
      <p className="cl-lede">
        Illustrative vehicle budget from income, existing EMIs and down payment capacity. Not lender
        approval.
      </p>

      <div className="mt-7 grid gap-8 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cl-muted)]">
            Your Finances
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-700">
              Monthly household income (₹)
              <input
                type="text"
                inputMode="numeric"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                onBlur={trackStarted}
                className={fieldClass}
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Existing monthly EMIs (₹)
              <input
                type="text"
                inputMode="numeric"
                value={existingEmis}
                onChange={(e) => setExistingEmis(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Available down payment (₹)
              <input
                type="text"
                inputMode="numeric"
                value={downPayment}
                onChange={(e) => setDownPayment(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Expected rate (% p.a.)
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={50}
                step={0.1}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700 sm:col-span-2">
              FOIR assumption (% of income for EMIs)
              <input
                type="number"
                inputMode="decimal"
                min={1}
                max={100}
                step={1}
                value={foirPercent}
                onChange={(e) => setFoirPercent(e.target.value)}
                className={fieldClass}
              />
              <span className="mt-1 block text-xs font-normal text-[var(--cl-muted)]">
                Illustrative assumption — lenders use their own FOIR rules.
              </span>
            </label>
            <fieldset className="sm:col-span-2">
              <legend className="text-xs font-semibold text-slate-700">Preferred tenure</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {CAR_LOAN_TENURE_YEARS.map((years) => (
                  <button
                    key={years}
                    type="button"
                    aria-pressed={localTenure === years}
                    onClick={() => setLocalTenure(years)}
                    className={`inline-flex min-h-10 items-center rounded-full px-3.5 text-xs font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)] ${
                      localTenure === years
                        ? 'bg-[var(--cl-navy)] text-white'
                        : 'border border-[var(--cl-border)] bg-white text-[var(--cl-navy)] hover:bg-[var(--cl-surface-2)]'
                    }`}
                  >
                    {years} {years === 1 ? 'year' : 'years'}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cl-muted)]">
            Indicative Vehicle Budget
          </p>
          {estimate ? (
            <div className="mt-4 space-y-5">
              <div>
                <p className="cl-metric-label">Indicative Vehicle Price</p>
                <p className="cl-metric-value mt-2 text-[2.25rem] leading-none sm:text-[2.75rem]">
                  {formatInr(Math.round(estimate.vehicleBudget))}
                </p>
              </div>
              <dl className="grid gap-4 border-t border-[var(--cl-border)] pt-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-[var(--cl-muted)]">
                    Comfortable EMI
                  </dt>
                  <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--cl-navy)]">
                    {formatInr(Math.round(estimate.comfortableEmi))}
                    <span className="ml-1 text-sm font-medium text-[var(--cl-muted)]">/mo</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-[var(--cl-muted)]">
                    Loan Capacity
                  </dt>
                  <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--cl-navy)]">
                    {formatInr(Math.round(estimate.loanCapacity))}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-[var(--cl-muted)]">
                    Down Payment
                  </dt>
                  <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--cl-navy)]">
                    {formatInr(parseNonNeg(downPayment) ?? 0)}
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--cl-muted)]">
              Enter income and rate to see an illustrative vehicle budget.
            </p>
          )}
          {!standalone ? (
            <Link
              href="/calculators/car-loan-affordability"
              className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--cl-navy)] underline-offset-2 hover:text-[var(--cl-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)]"
            >
              Open dedicated Affordability Calculator →
            </Link>
          ) : (
            <Link
              href={calculatorHref('car-loan')}
              className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--cl-navy)] underline-offset-2 hover:text-[var(--cl-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)]"
            >
              Open Car Loan EMI Calculator →
            </Link>
          )}
        </div>
      </div>
    </>
  );

  if (standalone) {
    return (
      <div className="cl-page rounded-[var(--cl-radius-lg)] bg-[var(--cl-surface-1)] p-4 sm:p-6">
        {content}
      </div>
    );
  }

  return (
    <section
      id="car-loan-affordability"
      aria-labelledby="car-loan-affordability-heading"
      className="full-bleed bg-[var(--cl-surface-3)]"
    >
      <div className="site-container cl-section px-4">{content}</div>
    </section>
  );
}
