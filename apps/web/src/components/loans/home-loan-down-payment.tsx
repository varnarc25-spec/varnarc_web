'use client';

import { useMemo } from 'react';
import { formatInr } from '@/components/loans/loan-format';
import { useHomeLoanDecision } from '@/components/loans/home-loan-decision-context';
import { calculateEmi } from '@/lib/emi';
import { HOME_LOAN_DOWN_PAYMENT_SCENARIOS } from '@/lib/home-loan-page';

function FinancingBar({
  propertyValue,
  downPayment,
  loanRequirement,
  downPaymentPercent,
}: {
  propertyValue: number;
  downPayment: number;
  loanRequirement: number;
  downPaymentPercent: number;
}) {
  const loanPct = propertyValue > 0 ? (loanRequirement / propertyValue) * 100 : 0;
  const downPct = propertyValue > 0 ? (downPayment / propertyValue) * 100 : 0;

  return (
    <div className="bg-[var(--hl-surface-2)] px-5 py-5 sm:px-6 sm:py-6">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--hl-muted)]">
        Property Value
      </p>
      <p className="hl-metric-value mt-1 text-2xl sm:text-3xl">{formatInr(propertyValue)}</p>

      <div
        className="mt-5 flex h-11 overflow-hidden rounded-[var(--hl-radius-sm)]"
        role="img"
        aria-label={`Down payment ${formatInr(downPayment) ?? ''} (${downPct.toFixed(1)} percent). Loan financed ${formatInr(loanRequirement) ?? ''} (${loanPct.toFixed(1)} percent).`}
      >
        <div
          className="flex items-center justify-center bg-[var(--hl-orange)] px-2 text-[11px] font-semibold text-white"
          style={{ width: `${Math.max(downPct, 0)}%`, minWidth: downPct > 0 ? '2.75rem' : 0 }}
        >
          {downPct >= 14 ? 'Down' : null}
        </div>
        <div
          className="flex flex-1 items-center justify-center bg-[var(--hl-navy)] px-2 text-[11px] font-semibold text-white"
          style={{ minWidth: loanPct > 0 ? '2.75rem' : 0 }}
        >
          {loanPct >= 14 ? 'Loan' : null}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--hl-muted)]">
            Down Payment
          </p>
          <p className="mt-1 text-base font-bold tabular-nums text-[var(--hl-navy)]">
            {formatInr(downPayment)}
            <span className="ml-1.5 text-sm font-semibold text-[var(--hl-orange)]">
              · {downPaymentPercent.toFixed(1)}%
            </span>
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--hl-muted)]">
            Loan Financed
          </p>
          <p className="mt-1 text-base font-bold tabular-nums text-[var(--hl-navy)]">
            {formatInr(loanRequirement)}
            <span className="ml-1.5 text-sm font-semibold text-slate-500">
              · {loanPct.toFixed(1)}%
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export function HomeLoanDownPayment() {
  const {
    propertyValue,
    downPayment,
    downPaymentPercent,
    loanRequirement,
    ratePercent,
    tenureYears,
    setDownPaymentFromPercent,
  } = useHomeLoanDecision();
  const tenureMonths = tenureYears * 12;

  const scenarios = useMemo(
    () =>
      HOME_LOAN_DOWN_PAYMENT_SCENARIOS.map((percent) => {
        const scenarioDown = Math.round((propertyValue * percent) / 100);
        const scenarioLoan = Math.max(0, propertyValue - scenarioDown);
        const emiResult = calculateEmi({
          principal: scenarioLoan,
          annualRatePercent: ratePercent,
          tenureMonths,
        });
        return { percent, downPayment: scenarioDown, loanRequirement: scenarioLoan, emiResult };
      }),
    [propertyValue, ratePercent, tenureMonths],
  );

  return (
    <section
      id="home-loan-down-payment"
      aria-labelledby="home-loan-down-payment-heading"
      className="full-bleed bg-[var(--hl-surface-1)]"
    >
      <div className="site-container hl-section px-4">
        <p className="hl-eyebrow">Down Payment</p>
        <h2 id="home-loan-down-payment-heading" className="hl-h2">
          How Down Payment Changes Your Home Loan
        </h2>
        <p className="hl-lede">
          Compare illustrative scenarios at {HOME_LOAN_DOWN_PAYMENT_SCENARIOS.join('%, ')}% down
          payment using your current property value, rate and tenure settings.
        </p>

        <div className="mt-7 max-w-3xl">
          <FinancingBar
            propertyValue={propertyValue}
            downPayment={downPayment}
            loanRequirement={loanRequirement}
            downPaymentPercent={downPaymentPercent}
          />
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {scenarios.map(({ percent, downPayment: dp, loanRequirement: lr, emiResult }) => {
            const active = Math.abs(downPaymentPercent - percent) < 0.51;
            return (
              <button
                key={percent}
                type="button"
                onClick={() => setDownPaymentFromPercent(percent)}
                className={`rounded-[var(--hl-radius-md)] p-5 text-left transition duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)] ${
                  active
                    ? 'bg-[var(--hl-surface-4)] ring-1 ring-[var(--hl-navy)]/20'
                    : 'bg-[var(--hl-surface-2)] hover:bg-[var(--hl-surface-4)]'
                }`}
              >
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--hl-muted)]">
                  {active ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--hl-orange)]" aria-hidden />
                  ) : null}
                  {percent}% Down
                </p>
                <p className="mt-3 text-2xl font-extrabold tabular-nums text-[var(--hl-navy)]">
                  {formatInr(dp)}
                </p>
                <p className="mt-0.5 text-xs text-[var(--hl-muted)]">upfront</p>
                <dl className="mt-4 space-y-2.5 border-t border-[var(--hl-border)] pt-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-xs text-[var(--hl-muted)]">Loan</dt>
                    <dd className="text-sm font-bold tabular-nums text-[var(--hl-navy)]">
                      {formatInr(lr)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-xs text-[var(--hl-muted)]">EMI</dt>
                    <dd className="text-sm font-bold tabular-nums text-[var(--hl-navy)]">
                      {emiResult ? `${formatInr(Math.round(emiResult.monthlyEmi))}/mo` : '—'}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-xs text-[var(--hl-muted)]">Interest</dt>
                    <dd className="text-sm font-semibold tabular-nums text-slate-600">
                      {emiResult ? formatInr(Math.round(emiResult.totalInterest)) : '—'}
                    </dd>
                  </div>
                </dl>
              </button>
            );
          })}
        </div>

        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-600">
          A higher down payment typically lowers the loan amount and may reduce EMI and total
          interest — but it is not universally better. Minimum down payment requirements are
          product-specific and are not invented on this page.
        </p>
      </div>
    </section>
  );
}
