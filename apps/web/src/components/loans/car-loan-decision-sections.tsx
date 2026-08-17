'use client';

import Link from 'next/link';
import { useId, useMemo, useState, useEffect } from 'react';
import { formatInr } from '@/components/loans/loan-format';
import { useCarLoanDecision } from '@/components/loans/car-loan-decision-context';
import { calculateEmi } from '@/lib/emi';
import { calculatorHref, financeEligibilityPath } from '@/lib/finance-routes';
import { trackAnalyticsEvent } from '@/lib/analytics-client';
import {
  CAR_LOAN_BANK_DEALER_COMPARE,
  CAR_LOAN_BANK_POINTS,
  CAR_LOAN_CLOSURE_STEPS,
  CAR_LOAN_DEALER_POINTS,
  CAR_LOAN_FEE_TYPES,
  CAR_LOAN_JOINT_NOTES,
  CAR_LOAN_NEW_VS_USED_ROWS,
  CAR_LOAN_SALARIED_NOTES,
  CAR_LOAN_SELF_EMPLOYED_NOTES,
  CAR_LOAN_TENURE_YEARS,
  CAR_LOAN_TIMELINE_STEPS,
  estimateCarLoanPrepaymentImpact,
  type PrepaymentMode,
} from '@/lib/car-loan-page';

export function CarLoanNewVsUsed() {
  return (
    <section
      id="car-loan-new-vs-used"
      aria-labelledby="car-loan-new-vs-used-heading"
      className="full-bleed bg-[var(--cl-surface-4)]"
    >
      <div className="site-container cl-section px-4">
        <p className="cl-eyebrow">New vs Used</p>
        <h2 id="car-loan-new-vs-used-heading" className="cl-h2">
          New Car vs Used Car Financing
        </h2>
        <p className="cl-lede">
          Financing terms can differ between new and used vehicles. Lender policies vary — compare
          product specifics rather than assuming one structure fits all.
        </p>

        <div className="mt-8 grid items-stretch gap-5 lg:grid-cols-2">
          <article className="flex h-full flex-col bg-[var(--cl-surface-1)] p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cl-muted)]">
              New Car
            </p>
            <h3 className="mt-1 text-lg font-bold text-[var(--cl-navy)]">
              Financing a New Vehicle
            </h3>
            <ul className="mt-4 flex-1 space-y-3">
              {CAR_LOAN_NEW_VS_USED_ROWS.map((row) => (
                <li
                  key={`new-${row.label}`}
                  className="border-t border-[var(--cl-border)] pt-3 first:border-0 first:pt-0"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cl-muted)]">
                    {row.label}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{row.newCar}</p>
                </li>
              ))}
            </ul>
          </article>
          <article className="flex h-full flex-col bg-[var(--cl-surface-2)] p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cl-muted)]">
              Used Car
            </p>
            <h3 className="mt-1 text-lg font-bold text-[var(--cl-navy)]">
              Financing a Used Vehicle
            </h3>
            <ul className="mt-4 flex-1 space-y-3">
              {CAR_LOAN_NEW_VS_USED_ROWS.map((row) => (
                <li
                  key={`used-${row.label}`}
                  className="border-t border-[var(--cl-border)] pt-3 first:border-0 first:pt-0"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cl-muted)]">
                    {row.label}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{row.usedCar}</p>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <p className="mt-5 text-xs text-[var(--cl-muted)]">
          No winner badge — neither option is universally better. Compare total cost, tenure
          flexibility and lender terms.
        </p>
      </div>
    </section>
  );
}

export function CarLoanFinancingPercent() {
  const { vehiclePrice, loanRequirement, financingPercent } = useCarLoanDecision();
  const loanPct = financingPercent != null ? Math.min(100, Math.max(0, financingPercent)) : 0;
  const downPct = 100 - loanPct;

  return (
    <section
      id="car-loan-financing-percent"
      aria-labelledby="car-loan-financing-percent-heading"
      className="full-bleed bg-[var(--cl-surface-1)]"
    >
      <div className="site-container cl-section px-4">
        <p className="cl-eyebrow">Financing %</p>
        <h2 id="car-loan-financing-percent-heading" className="cl-h2">
          How Much of the Vehicle Price Are You Financing?
        </h2>
        <p className="cl-lede">
          Financing % is loan required ÷ vehicle price × 100. It is a planning ratio — not an
          approval metric or a universal lender limit.
        </p>

        <div className="mt-8 max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cl-muted)]">
            Financing %
          </p>
          <p className="cl-metric-value mt-2 text-[3rem] leading-none sm:text-[3.75rem]">
            {financingPercent != null ? `${financingPercent.toFixed(0)}%` : '—'}
          </p>
          <p className="mt-3 text-sm text-slate-600">
            {formatInr(loanRequirement)} ÷ {formatInr(vehiclePrice)} × 100
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--cl-muted)]">
                Vehicle price
              </p>
              <p className="mt-1 text-base font-bold tabular-nums text-[var(--cl-navy)]">
                {formatInr(vehiclePrice)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--cl-muted)]">
                Loan financed
              </p>
              <p className="mt-1 text-base font-bold tabular-nums text-[var(--cl-navy)]">
                {formatInr(loanRequirement)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--cl-muted)]">
                Down payment
              </p>
              <p className="mt-1 text-base font-bold tabular-nums text-[var(--cl-navy)]">
                {formatInr(vehiclePrice - loanRequirement)}
              </p>
            </div>
          </div>

          <div
            className="mt-5 flex h-10 overflow-hidden rounded-[var(--cl-radius-sm)]"
            role="img"
            aria-label={`Down payment ${downPct.toFixed(1)} percent, financed ${loanPct.toFixed(1)} percent`}
          >
            <div
              className="bg-[var(--cl-orange)]"
              style={{ width: `${downPct}%`, minWidth: downPct > 0 ? '2rem' : 0 }}
            />
            <div className="flex-1 bg-[var(--cl-navy)]" />
          </div>
          <p className="mt-2 text-xs text-[var(--cl-muted)]">
            Orange = down payment · Navy = financed. Planning visual only.
          </p>
        </div>
      </div>
    </section>
  );
}

export function CarLoanInterestOverTime() {
  const { loanRequirement, ratePercent, tenureYears } = useCarLoanDecision();

  const bars = useMemo(
    () =>
      CAR_LOAN_TENURE_YEARS.map((years) => {
        const result = calculateEmi({
          principal: loanRequirement,
          annualRatePercent: ratePercent,
          tenureMonths: years * 12,
        });
        return {
          years,
          monthlyEmi: result?.monthlyEmi ?? 0,
          totalInterest: result?.totalInterest ?? 0,
          totalRepayment: result?.totalRepayment ?? 0,
        };
      }),
    [loanRequirement, ratePercent],
  );

  const maxInterest = Math.max(...bars.map((b) => b.totalInterest), 1);
  const selectedRow = bars.find((b) => b.years === tenureYears) ?? bars[2];

  return (
    <section
      id="car-loan-interest-over-time"
      aria-labelledby="car-loan-interest-over-time-heading"
      className="full-bleed bg-[var(--cl-surface-2)]"
    >
      <div className="site-container cl-section px-4">
        <p className="cl-eyebrow">Total Interest</p>
        <h2 id="car-loan-interest-over-time-heading" className="cl-h2">
          How Much Interest Could You Pay?
        </h2>
        <p className="cl-lede">
          Illustrative totals at your current loan requirement and rate across common tenures.
          Longer tenures typically accumulate more interest.
        </p>

        {selectedRow ? (
          <div className="mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
            <div>
              <p className="cl-metric-label">Monthly EMI ({selectedRow.years}y)</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-[var(--cl-navy)]">
                {selectedRow.monthlyEmi > 0
                  ? `${formatInr(Math.round(selectedRow.monthlyEmi))}/mo`
                  : '—'}
              </p>
            </div>
            <div>
              <p className="cl-metric-label">Total Interest</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-[var(--cl-navy)]">
                {selectedRow.totalInterest > 0
                  ? formatInr(Math.round(selectedRow.totalInterest))
                  : '—'}
              </p>
            </div>
            <div>
              <p className="cl-metric-label">Total Repayment</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-[var(--cl-navy)]">
                {selectedRow.totalRepayment > 0
                  ? formatInr(Math.round(selectedRow.totalRepayment))
                  : '—'}
              </p>
            </div>
          </div>
        ) : null}

        <p className="mt-8 text-sm font-bold text-[var(--cl-navy)]">
          Total Interest by Loan Tenure
        </p>
        <div className="mt-4 max-w-3xl space-y-3.5" role="list">
          {bars.map(({ years, totalInterest }) => {
            const widthPct = maxInterest > 0 ? (totalInterest / maxInterest) * 100 : 0;
            const selected = years === tenureYears;
            const label = `${years} years: ${formatInr(Math.round(totalInterest))} total interest${selected ? ', selected tenure' : ''}`;
            return (
              <div
                key={years}
                role="listitem"
                className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3"
              >
                <p
                  className={`text-xs font-semibold tabular-nums ${
                    selected ? 'text-[var(--cl-orange)]' : 'text-[var(--cl-navy)]'
                  }`}
                >
                  {years} {years === 1 ? 'year' : 'years'}
                </p>
                <div
                  className="relative h-7 rounded-[var(--cl-radius-sm)] bg-white"
                  role="img"
                  aria-label={label}
                >
                  <div
                    className={`absolute inset-y-0 left-0 rounded-[var(--cl-radius-sm)] transition-all duration-150 motion-reduce:transition-none ${
                      selected ? 'bg-[var(--cl-orange)]' : 'bg-[var(--cl-navy)]/75'
                    }`}
                    style={{ width: `${Math.max(widthPct, 2)}%` }}
                  />
                </div>
                <p className="min-w-[5.5rem] text-right text-sm font-bold tabular-nums text-[var(--cl-navy)]">
                  {totalInterest > 0 ? formatInr(Math.round(totalInterest)) : '—'}
                </p>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-[var(--cl-muted)]">
          Selected tenure uses orange accent; other bars use navy. Illustrative only — not an
          approval outcome.
        </p>
      </div>
    </section>
  );
}

export function CarLoanBankVsDealer() {
  return (
    <section
      id="car-loan-bank-vs-dealer"
      aria-labelledby="car-loan-bank-vs-dealer-heading"
      className="full-bleed bg-[var(--cl-surface-3)]"
    >
      <div className="site-container cl-section px-4">
        <p className="cl-eyebrow">Financing Source</p>
        <h2 id="car-loan-bank-vs-dealer-heading" className="cl-h2">
          Bank Finance vs Dealer Finance
        </h2>
        <p className="cl-lede">
          Neither channel is universally cheaper or faster. Compare total cost, convenience and
          terms before choosing.
        </p>

        <div className="mt-8 grid items-stretch gap-5 lg:grid-cols-2">
          <article className="flex h-full flex-col bg-[var(--cl-surface-1)] p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cl-muted)]">
              Bank / Lender Finance
            </p>
            <h3 className="mt-1 text-lg font-bold text-[var(--cl-navy)]">Direct Bank Finance</h3>
            <ul className="mt-4 flex-1 space-y-2.5">
              {CAR_LOAN_BANK_POINTS.map((point) => (
                <li key={point} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--cl-navy)]"
                    aria-hidden
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="flex h-full flex-col bg-[var(--cl-surface-4)] p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cl-muted)]">
              Dealer Finance
            </p>
            <h3 className="mt-1 text-lg font-bold text-[var(--cl-navy)]">Dealer Finance</h3>
            <ul className="mt-4 flex-1 space-y-2.5">
              {CAR_LOAN_DEALER_POINTS.map((point) => (
                <li key={point} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--cl-orange)]"
                    aria-hidden
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-bold text-[var(--cl-navy)]">Things to compare</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {CAR_LOAN_BANK_DEALER_COMPARE.map((item) => (
              <li
                key={item}
                className="rounded-full bg-[var(--cl-surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--cl-navy)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="#car-loan-offers"
          className="mt-8 inline-flex min-h-11 items-center rounded-[var(--cl-radius-md)] bg-[var(--cl-navy)] px-4 text-sm font-semibold !text-white hover:bg-[var(--cl-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)]"
        >
          Compare Financing Options →
        </Link>
      </div>
    </section>
  );
}

export function CarLoanEligibility() {
  const tabsId = useId();
  const [tab, setTab] = useState<'salaried' | 'self-employed' | 'joint'>('salaried');

  const notes =
    tab === 'salaried'
      ? CAR_LOAN_SALARIED_NOTES
      : tab === 'self-employed'
        ? CAR_LOAN_SELF_EMPLOYED_NOTES
        : CAR_LOAN_JOINT_NOTES;

  return (
    <section
      id="car-loan-eligibility"
      aria-labelledby="car-loan-eligibility-heading"
      className="full-bleed bg-[var(--cl-surface-1)]"
    >
      <div className="site-container cl-section px-4">
        <p className="cl-eyebrow">Eligibility</p>
        <h2 id="car-loan-eligibility-heading" className="cl-h2">
          Car Loan Eligibility
        </h2>
        <p className="cl-lede">
          Lenders typically weigh applicant and vehicle factors together. Thresholds are
          product-specific — this page does not invent universal cutoffs.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cl-muted)]">
              Applicant factors
            </p>
            <div
              className="mt-3 inline-flex w-full flex-wrap rounded-full bg-[var(--cl-surface-2)] p-1 sm:w-auto"
              role="tablist"
              aria-label="Applicant type"
            >
              {(
                [
                  ['salaried', 'Salaried'],
                  ['self-employed', 'Self-Employed'],
                  ['joint', 'Joint Applicant'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  id={`${tabsId}-${key}`}
                  aria-selected={tab === key}
                  aria-controls={`${tabsId}-panel`}
                  tabIndex={tab === key ? 0 : -1}
                  onClick={() => setTab(key)}
                  className={`min-h-11 flex-1 rounded-full px-4 text-xs font-semibold transition duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)] sm:flex-none ${
                    tab === key
                      ? 'bg-[var(--cl-navy)] text-white'
                      : 'bg-transparent text-[var(--cl-navy)] hover:bg-white/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div
              id={`${tabsId}-panel`}
              role="tabpanel"
              aria-labelledby={`${tabsId}-${tab}`}
              className="mt-4 bg-[var(--cl-surface-2)] p-5"
            >
              <ul className="space-y-2.5">
                {notes.map((note) => (
                  <li key={note} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--cl-navy)]"
                      aria-hidden
                    />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {[
                'Income',
                'Credit Profile',
                'Existing EMIs',
                'Employment / Business Stability',
                'Requested Loan Amount',
                'Tenure',
              ].map((factor) => (
                <span
                  key={factor}
                  className="rounded-full bg-[var(--cl-surface-4)] px-3 py-1.5 text-xs font-semibold text-[var(--cl-navy)]"
                >
                  {factor}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cl-muted)]">
              Vehicle factors
            </p>
            <ul className="mt-3 space-y-3 bg-[var(--cl-surface-2)] p-5">
              {[
                'Vehicle Price',
                'New / Used',
                'Vehicle Age (where relevant)',
                'Valuation (where relevant)',
                'Lender Criteria',
              ].map((factor) => (
                <li key={factor} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--cl-orange)]"
                    aria-hidden
                  />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-[var(--cl-muted)]">
              Exact criteria vary by product. No universal financing limits are implied here.
            </p>
          </div>
        </div>

        <Link
          href={financeEligibilityPath({ loanType: 'car' })}
          onClick={() => {
            try {
              trackAnalyticsEvent({
                eventType: 'custom',
                entityType: 'car_loan',
                entityId: 'eligibility_cta',
                metadata: { action: 'car_eligibility_started' },
              });
            } catch {
              /* optional */
            }
          }}
          className="mt-8 inline-flex min-h-11 items-center rounded-[var(--cl-radius-md)] bg-[var(--cl-navy)] px-4 text-sm font-semibold !text-white hover:bg-[var(--cl-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)]"
        >
          Check Car Loan Eligibility →
        </Link>
      </div>
    </section>
  );
}

export function CarLoanPrepayment() {
  const { loanRequirement, ratePercent, tenureYears } = useCarLoanDecision();
  const [outstanding, setOutstanding] = useState(loanRequirement);
  const [rate, setRate] = useState(ratePercent);
  const [remainingYears, setRemainingYears] = useState(tenureYears);
  const [prepayAmount, setPrepayAmount] = useState(Math.round(loanRequirement * 0.1));
  const [mode, setMode] = useState<PrepaymentMode>('reduce-tenure');
  const modeId = useId();

  const impact = useMemo(
    () =>
      estimateCarLoanPrepaymentImpact({
        outstanding,
        annualRatePercent: rate,
        remainingMonths: remainingYears * 12,
        prepaymentAmount: prepayAmount,
        mode,
      }),
    [outstanding, rate, remainingYears, prepayAmount, mode],
  );

  useEffect(() => {
    if (!impact) return;
    try {
      trackAnalyticsEvent({
        eventType: 'custom',
        entityType: 'car_loan',
        entityId: 'prepayment',
        metadata: { action: 'car_prepayment_calculated', mode: impact.mode },
      });
    } catch {
      /* optional */
    }
  }, [impact]);

  const remainingMonthsAfter =
    impact && impact.mode === 'reduce-tenure'
      ? Math.max(0, remainingYears * 12 - impact.monthsSaved)
      : remainingYears * 12;

  return (
    <section
      id="car-loan-prepayment"
      aria-labelledby="car-loan-prepayment-heading"
      className="full-bleed bg-[var(--cl-surface-2)]"
    >
      <div className="site-container cl-section px-4">
        <p className="cl-eyebrow">Prepayment</p>
        <h2 id="car-loan-prepayment-heading" className="cl-h2">
          Should You Prepay Your Car Loan?
        </h2>
        <p className="cl-lede">
          Illustrative prepayment impact using a reducing-balance model. Prepayment charges may
          apply depending on lender and product terms — confirm before acting.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InputField
            label="Outstanding principal (₹)"
            value={outstanding}
            onChange={setOutstanding}
          />
          <InputField label="Interest rate (% p.a.)" value={rate} onChange={setRate} step={0.1} />
          <InputField
            label="Remaining tenure (years)"
            value={remainingYears}
            onChange={setRemainingYears}
            min={1}
            max={10}
          />
          <InputField
            label="Prepayment amount (₹)"
            value={prepayAmount}
            onChange={setPrepayAmount}
          />
        </div>

        <div className="mt-5">
          <p id={`${modeId}-label`} className="cl-metric-label">
            Strategy
          </p>
          <div
            className="mt-2 inline-flex w-full flex-wrap rounded-full bg-[var(--cl-surface-2)] p-1 sm:w-auto"
            role="group"
            aria-labelledby={`${modeId}-label`}
          >
            {(
              [
                ['reduce-tenure', 'Reduce Tenure'],
                ['reduce-emi', 'Reduce EMI'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={mode === key}
                onClick={() => setMode(key)}
                className={`min-h-10 flex-1 rounded-full px-4 text-xs font-semibold transition duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)] sm:flex-none ${
                  mode === key
                    ? 'bg-[var(--cl-navy)] text-white'
                    : 'bg-transparent text-[var(--cl-navy)] hover:bg-white/80'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {impact ? (
          <div className="mt-7">
            <dl className="grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="cl-metric-label">Potential Interest Saved</dt>
                <dd className="cl-metric-value mt-1.5 text-3xl sm:text-4xl">
                  {formatInr(Math.round(impact.interestSaved))}
                </dd>
              </div>
              {impact.mode === 'reduce-tenure' && impact.monthsSaved > 0 ? (
                <div>
                  <dt className="cl-metric-label">Potential Time Saved</dt>
                  <dd className="cl-metric-value mt-1.5 text-3xl sm:text-4xl">
                    {impact.monthsSaved}{' '}
                    <span className="text-lg font-semibold text-[var(--cl-muted)]">
                      {impact.monthsSaved === 1 ? 'month' : 'months'}
                    </span>
                  </dd>
                </div>
              ) : (
                <div>
                  <dt className="cl-metric-label">Revised EMI</dt>
                  <dd className="cl-metric-value mt-1.5 text-3xl sm:text-4xl">
                    {formatInr(Math.round(impact.revised.monthlyEmi))}
                    <span className="ml-1 text-base font-semibold text-[var(--cl-muted)]">
                      /month
                    </span>
                  </dd>
                </div>
              )}
            </dl>
            <dl className="mt-5 grid gap-3 border-t border-[var(--cl-border)] pt-4 sm:grid-cols-2">
              {impact.mode === 'reduce-tenure' ? (
                <div>
                  <dt className="text-xs text-[var(--cl-muted)]">Revised tenure</dt>
                  <dd className="mt-0.5 text-sm font-bold tabular-nums text-[var(--cl-navy)]">
                    {Math.floor(remainingMonthsAfter / 12)} years{' '}
                    {remainingMonthsAfter % 12 ? `${remainingMonthsAfter % 12} mo` : ''}
                    <span className="ml-2 font-medium text-[var(--cl-muted)]">
                      (was {remainingYears} years)
                    </span>
                  </dd>
                </div>
              ) : (
                <div>
                  <dt className="text-xs text-[var(--cl-muted)]">Original EMI</dt>
                  <dd className="mt-0.5 text-sm font-bold tabular-nums text-[var(--cl-navy)]">
                    {formatInr(Math.round(impact.original.monthlyEmi))}/month
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-[var(--cl-muted)]">Strategy</dt>
                <dd className="mt-0.5 text-sm font-semibold text-[var(--cl-navy)]">
                  {impact.mode === 'reduce-tenure' ? 'Reduce tenure' : 'Reduce EMI'}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="mt-6 text-sm text-[var(--cl-muted)]">
            Enter valid outstanding principal, rate, tenure and a prepayment amount less than
            outstanding to see illustrative savings.
          </p>
        )}

        <Link
          href={calculatorHref('loan-prepayment')}
          className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--cl-navy)] underline-offset-2 hover:text-[var(--cl-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)]"
        >
          Calculate Prepayment Savings →
        </Link>
      </div>
    </section>
  );
}

export function CarLoanFeesAndCharges() {
  return (
    <section
      id="car-loan-fees"
      aria-labelledby="car-loan-fees-heading"
      className="full-bleed bg-[var(--cl-surface-1)]"
    >
      <div className="site-container cl-section px-4">
        <p className="cl-eyebrow">Fees & Charges</p>
        <h2 id="car-loan-fees-heading" className="cl-h2">
          Look Beyond the Car Loan Interest Rate
        </h2>
        <p className="cl-lede">
          The headline rate is only one part of total financing cost. Confirm charges on the
          sanction letter. Vehicle purchase costs such as registration or insurance sit outside the
          loan itself unless a product explicitly includes them.
        </p>

        <div
          className="mt-8 flex max-w-3xl flex-wrap items-center gap-2 text-sm font-bold text-[var(--cl-navy)]"
          role="img"
          aria-label="Interest plus processing fee plus other lender charges plus vehicle-related financing costs where applicable equals total financing cost"
        >
          <span className="rounded-[var(--cl-radius-sm)] bg-[var(--cl-surface-2)] px-3 py-2">
            Interest
          </span>
          <span className="text-[var(--cl-orange)]" aria-hidden>
            +
          </span>
          <span className="rounded-[var(--cl-radius-sm)] bg-[var(--cl-surface-2)] px-3 py-2">
            Processing Fee
          </span>
          <span className="text-[var(--cl-orange)]" aria-hidden>
            +
          </span>
          <span className="rounded-[var(--cl-radius-sm)] bg-[var(--cl-surface-2)] px-3 py-2">
            Other Lender Charges
          </span>
          <span className="text-[var(--cl-orange)]" aria-hidden>
            +
          </span>
          <span className="rounded-[var(--cl-radius-sm)] bg-[var(--cl-surface-4)] px-3 py-2">
            Vehicle-Related Financing Costs*
          </span>
          <span className="text-[var(--cl-orange)]" aria-hidden>
            =
          </span>
          <span className="rounded-[var(--cl-radius-sm)] bg-[var(--cl-navy)] px-3 py-2 !text-white">
            Total Financing Cost
          </span>
        </div>
        <p className="mt-3 max-w-3xl text-xs text-[var(--cl-muted)]">
          *Only where applicable to the financing offer. Registration and insurance are typically
          separate purchase costs — not loan fees by default.
        </p>

        <ul className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {CAR_LOAN_FEE_TYPES.map((item) => (
            <li key={item.key} className="border-t border-[var(--cl-border)] pt-3.5">
              <p className="text-sm font-bold text-[var(--cl-navy)]">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.detail}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function CarLoanHypothecation() {
  return (
    <section
      id="car-loan-hypothecation"
      aria-labelledby="car-loan-hypothecation-heading"
      className="full-bleed bg-[var(--cl-surface-4)]"
    >
      <div className="site-container cl-section px-4">
        <p className="cl-eyebrow">Hypothecation</p>
        <h2 id="car-loan-hypothecation-heading" className="cl-h2">
          What Is Vehicle Hypothecation?
        </h2>
        <p className="cl-lede">
          Hypothecation generally means the lender records a security interest in the financed
          vehicle. The process varies by lender and local procedure.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--cl-surface-2)]">
            <svg
              viewBox="0 0 48 48"
              className="h-10 w-10 text-[var(--cl-navy)]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="8" y="18" width="32" height="16" rx="3" />
              <circle cx="14" cy="34" r="3" />
              <circle cx="34" cy="34" r="3" />
              <path d="M12 18l4-8h16l4 8" />
            </svg>
          </div>
          <div
            className="flex h-6 w-6 items-center justify-center text-lg font-bold text-[var(--cl-orange)] sm:h-8 sm:w-8"
            aria-hidden
          >
            ↔
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--cl-surface-2)]">
            <svg
              viewBox="0 0 48 48"
              className="h-10 w-10 text-[var(--cl-navy)]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="24" cy="20" r="8" />
              <path d="M12 40c0-6 5-10 12-10s12 4 12 10" />
            </svg>
          </div>
          <div
            className="flex h-6 w-6 items-center justify-center text-lg font-bold text-[var(--cl-orange)] sm:h-8 sm:w-8"
            aria-hidden
          >
            ↔
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--cl-navy)]">
            <svg
              viewBox="0 0 48 48"
              className="h-10 w-10 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="10" y="6" width="28" height="36" rx="3" />
              <path d="M18 16h12M18 24h12M18 32h8" />
            </svg>
          </div>
        </div>
        <div className="mt-4 flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-12">
          <p className="text-xs font-semibold text-[var(--cl-navy)]">CAR</p>
          <p className="text-xs font-semibold text-[var(--cl-navy)]">OWNER</p>
          <p className="text-xs font-semibold text-[var(--cl-navy)]">LENDER INTEREST</p>
        </div>

        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-slate-600">
          While the loan is active, the lender&apos;s interest may be recorded in vehicle records.
          After loan closure, a hypothecation removal process updates ownership documentation. Exact
          steps and documentation can vary by lender and local transport authority process.
        </p>
      </div>
    </section>
  );
}

export function CarLoanClosure() {
  return (
    <section
      id="car-loan-closure"
      aria-labelledby="car-loan-closure-heading"
      className="full-bleed bg-[var(--cl-surface-1)]"
    >
      <div className="site-container cl-section px-4">
        <p className="cl-eyebrow">Loan Closure</p>
        <h2 id="car-loan-closure-heading" className="cl-h2">
          What Happens When Your Car Loan Is Fully Repaid?
        </h2>
        <p className="cl-lede">
          Typical conceptual journey after the final payment. Exact steps, documents and timelines
          vary by lender and local transport authority process — this is not a guaranteed checklist.
        </p>

        <ol className="mt-8 space-y-4">
          {CAR_LOAN_CLOSURE_STEPS.map((step, index) => (
            <li key={step} className="flex items-start gap-3">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--cl-navy)] text-xs font-bold text-white">
                {index + 1}
              </span>
              <p className="pt-1 text-sm font-semibold text-[var(--cl-navy)]">{step}</p>
            </li>
          ))}
        </ol>

        <p className="mt-5 text-xs text-[var(--cl-muted)]">
          Confirm the exact closure process with your lender. NOC and hypothecation removal
          timelines differ.
        </p>
      </div>
    </section>
  );
}

export function CarLoanApplicationJourney() {
  return (
    <section
      id="car-loan-application-journey"
      aria-labelledby="car-loan-application-journey-heading"
      className="full-bleed bg-[var(--cl-surface-2)]"
    >
      <div className="site-container cl-section px-4">
        <h2 id="car-loan-application-journey-heading" className="cl-h2">
          How a Car Loan Typically Works
        </h2>
        <p className="cl-lede">
          A typical path from vehicle budgeting to disbursement. Steps and timelines vary by lender
          and vehicle type.
        </p>

        {/* Mobile vertical */}
        <ol className="relative mt-8 space-y-0 lg:hidden">
          {CAR_LOAN_TIMELINE_STEPS.map((step, index) => {
            const isLast = index === CAR_LOAN_TIMELINE_STEPS.length - 1;
            return (
              <li key={step} className="relative flex gap-3 pb-4">
                {!isLast ? (
                  <span
                    className="absolute left-[15px] top-8 bottom-0 w-px bg-[var(--cl-navy)]/25"
                    aria-hidden
                  />
                ) : null}
                <span className="relative z-[1] inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--cl-navy)]/20 bg-white text-xs font-bold text-[var(--cl-navy)]">
                  {index + 1}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cl-muted)]">
                    Step {index + 1}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-[var(--cl-navy)]">{step}</p>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Desktop 5+5 */}
        <div className="mt-8 hidden lg:block">
          {[0, 1].map((row) => {
            const slice = CAR_LOAN_TIMELINE_STEPS.slice(row * 5, row * 5 + 5);
            return (
              <ol
                key={row}
                className={`relative grid grid-cols-5 gap-4 ${row === 1 ? 'mt-6' : ''}`}
              >
                {slice.map((step, i) => {
                  const index = row * 5 + i;
                  const isLastInRow = i === slice.length - 1;
                  return (
                    <li key={step} className="relative min-w-0">
                      {!isLastInRow ? (
                        <span
                          className="absolute left-8 right-0 top-[15px] h-px bg-[var(--cl-navy)]/25"
                          aria-hidden
                        />
                      ) : null}
                      <span className="relative z-[1] inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--cl-navy)]/20 bg-white text-xs font-bold text-[var(--cl-navy)]">
                        {index + 1}
                      </span>
                      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--cl-muted)]">
                        Step {index + 1}
                      </p>
                      <p className="mt-0.5 text-sm font-bold leading-snug text-[var(--cl-navy)]">
                        {step}
                      </p>
                    </li>
                  );
                })}
              </ol>
            );
          })}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-[var(--cl-muted)]">
          Varnarc helps users compare and calculate. Final eligibility, verification, approval and
          disbursement are determined by the lender.
        </p>
      </div>
    </section>
  );
}

function InputField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="block text-xs font-semibold text-slate-700">
      {label}
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
        className="mt-1.5 min-h-11 w-full rounded-[var(--cl-radius-md)] border border-[var(--cl-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--cl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)]/30"
      />
    </label>
  );
}
