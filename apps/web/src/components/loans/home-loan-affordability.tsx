'use client';

import { useMemo, useState } from 'react';
import { formatInr } from '@/components/loans/loan-format';
import { useHomeLoanDecision } from '@/components/loans/home-loan-decision-context';
import { estimateHomeAffordability, HOME_LOAN_TENURE_YEARS } from '@/lib/home-loan-page';

function parseNonNeg(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

const fieldClass =
  'mt-1.5 min-h-11 w-full rounded-[var(--hl-radius-md)] border border-[var(--hl-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--hl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)]/30';

export function HomeLoanAffordability() {
  const { ratePercent, tenureYears } = useHomeLoanDecision();
  const [income, setIncome] = useState('1,00,000');
  const [existingEmis, setExistingEmis] = useState('15,000');
  const [downPayment, setDownPayment] = useState('15,00,000');
  const [rate, setRate] = useState(String(ratePercent));
  const [localTenure, setLocalTenure] = useState(tenureYears);
  const [foirPercent, setFoirPercent] = useState('40');

  const estimate = useMemo(() => {
    const monthlyIncome = parseNonNeg(income.replace(/,/g, ''));
    const emis = parseNonNeg(existingEmis.replace(/,/g, '')) ?? 0;
    const availableDown = parseNonNeg(downPayment.replace(/,/g, '')) ?? 0;
    const annualRate = parseNonNeg(rate);
    const foir = parseNonNeg(foirPercent);
    if (monthlyIncome == null || annualRate == null || foir == null) return null;

    return estimateHomeAffordability({
      monthlyIncome,
      existingEmis: emis,
      availableDownPayment: availableDown,
      annualRatePercent: annualRate,
      tenureYears: localTenure,
      foirRatio: foir / 100,
    });
  }, [income, existingEmis, downPayment, rate, localTenure, foirPercent]);

  const availableEmiCapacity =
    parseNonNeg(income.replace(/,/g, '')) != null && parseNonNeg(foirPercent) != null
      ? Math.max(
          0,
          parseNonNeg(income.replace(/,/g, ''))! * (parseNonNeg(foirPercent)! / 100) -
            (parseNonNeg(existingEmis.replace(/,/g, '')) ?? 0),
        )
      : null;

  return (
    <section
      id="home-loan-affordability"
      aria-labelledby="home-loan-affordability-heading"
      className="full-bleed bg-[var(--hl-surface-3)]"
    >
      <div className="site-container hl-section px-4">
        <p className="hl-eyebrow">Affordability</p>
        <h2 id="home-loan-affordability-heading" className="hl-h2">
          How Much Home Can You Afford?
        </h2>
        <p className="hl-lede">
          Illustrative affordability estimate using income, existing EMIs and down payment capacity.
          Not lender approval.
        </p>

        <div className="mt-7 grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--hl-muted)]">
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
                <span className="mt-1 block text-[11px] font-normal text-[var(--hl-muted)]">
                  Illustrative assumption — lenders use their own FOIR rules.
                </span>
              </label>
              <fieldset className="sm:col-span-2">
                <legend className="text-xs font-semibold text-slate-700">Preferred tenure</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {HOME_LOAN_TENURE_YEARS.map((years) => (
                    <button
                      key={years}
                      type="button"
                      aria-pressed={localTenure === years}
                      onClick={() => setLocalTenure(years)}
                      className={`inline-flex min-h-10 items-center rounded-full px-3.5 text-xs font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)] ${
                        localTenure === years
                          ? 'bg-[var(--hl-navy)] text-white'
                          : 'border border-[var(--hl-border)] bg-white text-[var(--hl-navy)] hover:bg-[var(--hl-surface-2)]'
                      }`}
                    >
                      {years} yrs
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--hl-muted)]">
              Indicative Home Budget
            </p>
            {estimate ? (
              <div className="mt-4 space-y-5">
                <div>
                  <p className="hl-metric-label">Indicative Property Budget</p>
                  <p className="hl-metric-value mt-2 text-[2.25rem] leading-none sm:text-[2.75rem]">
                    {formatInr(Math.round(estimate.propertyBudget))}
                  </p>
                </div>
                <dl className="grid gap-4 border-t border-[var(--hl-border)] pt-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--hl-muted)]">
                      Comfortable EMI
                    </dt>
                    <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--hl-navy)]">
                      {formatInr(Math.round(estimate.comfortableEmi))}
                      <span className="ml-1 text-sm font-medium text-[var(--hl-muted)]">/mo</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--hl-muted)]">
                      Loan Capacity
                    </dt>
                    <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--hl-navy)]">
                      {formatInr(Math.round(estimate.loanCapacity))}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--hl-muted)]">
                      Down Payment
                    </dt>
                    <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--hl-navy)]">
                      {formatInr(parseNonNeg(downPayment.replace(/,/g, '')) ?? 0)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--hl-muted)]">
                      EMI Capacity
                    </dt>
                    <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--hl-navy)]">
                      {availableEmiCapacity != null
                        ? formatInr(Math.round(availableEmiCapacity))
                        : '—'}
                    </dd>
                  </div>
                </dl>
                <ol className="space-y-1.5 border-t border-[var(--hl-border)] pt-4 text-xs text-[var(--hl-muted)] lg:hidden">
                  <li>Monthly Income</li>
                  <li>↓ Existing EMIs</li>
                  <li>↓ Available EMI Capacity</li>
                  <li>↓ Indicative Loan Capacity + Down Payment</li>
                  <li className="font-semibold text-[var(--hl-navy)]">
                    ↓ Indicative Property Budget
                  </li>
                </ol>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--hl-muted)]">
                Enter income, rate and tenure to see an indicative property budget.
              </p>
            )}
            <p className="mt-5 text-xs leading-relaxed text-[var(--hl-muted)]">
              Illustrative affordability estimate only; not lender approval.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
