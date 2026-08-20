'use client';

import { useMemo } from 'react';
import { formatInr } from '@/components/loans/loan-format';
import { useTwoWheelerDecision } from '@/components/loans/two-wheeler-loan-decision-context';
import { calculateEmi } from '@/lib/emi';
import { TW_DOWN_PAYMENT_SCENARIOS } from '@/lib/two-wheeler-loan-page';

function FinancingBar({
  vehiclePrice,
  downPayment,
  loanRequirement,
  downPaymentPercent,
}: {
  vehiclePrice: number;
  downPayment: number;
  loanRequirement: number;
  downPaymentPercent: number;
}) {
  const loanPct = vehiclePrice > 0 ? (loanRequirement / vehiclePrice) * 100 : 0;
  const downPct = vehiclePrice > 0 ? (downPayment / vehiclePrice) * 100 : 0;

  return (
    <div className="bg-[var(--tw-surface-2)] px-5 py-5 sm:px-6 sm:py-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tw-muted)]">
        Vehicle Price
      </p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums text-[var(--tw-navy)] sm:text-3xl">
        {formatInr(vehiclePrice)}
      </p>

      <div
        className="mt-5 flex h-11 overflow-hidden rounded-[var(--tw-radius-sm)]"
        role="img"
        aria-label={`Down payment ${formatInr(downPayment)} (${downPct.toFixed(1)}%). Loan financed ${formatInr(loanRequirement)} (${loanPct.toFixed(1)}%).`}
      >
        <div
          className="flex items-center justify-center bg-[var(--tw-orange)] px-2 text-xs font-semibold text-white"
          style={{ width: `${Math.max(downPct, 0)}%`, minWidth: downPct > 0 ? '2.75rem' : 0 }}
        >
          {downPct >= 14 ? 'DP' : null}
        </div>
        <div
          className="flex flex-1 items-center justify-center bg-[var(--tw-navy)] px-2 text-xs font-semibold text-white"
          style={{ minWidth: loanPct > 0 ? '2.75rem' : 0 }}
        >
          {loanPct >= 14 ? 'Loan' : null}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tw-muted)]">
            Down Payment
          </p>
          <p className="mt-1 text-base font-bold tabular-nums text-[var(--tw-navy)]">
            {formatInr(downPayment)}
            <span className="ml-1.5 text-sm font-semibold text-[var(--tw-orange)]">
              · {downPaymentPercent.toFixed(1)}%
            </span>
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tw-muted)]">
            Loan Financed
          </p>
          <p className="mt-1 text-base font-bold tabular-nums text-[var(--tw-navy)]">
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

export function TwoWheelerLoanDownPayment() {
  const {
    vehiclePrice,
    downPayment,
    downPaymentPercent,
    loanRequirement,
    ratePercent,
    tenureYears,
    setDownPaymentFromPercent,
  } = useTwoWheelerDecision();
  const tenureMonths = tenureYears * 12;

  const scenarios = useMemo(
    () =>
      TW_DOWN_PAYMENT_SCENARIOS.map((percent) => {
        const scenarioDown = Math.round((vehiclePrice * percent) / 100);
        const scenarioLoan = Math.max(0, vehiclePrice - scenarioDown);
        const emiResult = calculateEmi({
          principal: scenarioLoan,
          annualRatePercent: ratePercent,
          tenureMonths,
        });
        const scenarioFinancing = vehiclePrice > 0 ? (scenarioLoan / vehiclePrice) * 100 : 0;
        return {
          percent,
          downPayment: scenarioDown,
          loanRequirement: scenarioLoan,
          emiResult,
          financingPercent: scenarioFinancing,
        };
      }),
    [vehiclePrice, ratePercent, tenureMonths],
  );

  return (
    <section
      id="tw-down-payment"
      aria-labelledby="tw-down-payment-heading"
      className="full-bleed bg-[var(--tw-surface-1)]"
    >
      <div className="site-container cl-section px-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--tw-orange)]">
          Down Payment
        </p>
        <h2 id="tw-down-payment-heading" className="cl-h2 text-[var(--tw-navy)]">
          How Down Payment Changes Your Two-Wheeler Loan
        </h2>
        <p className="cl-lede text-[var(--tw-muted)]">
          Compare illustrative scenarios at {TW_DOWN_PAYMENT_SCENARIOS.join('%, ')}% down payment
          using your current vehicle price, rate and tenure settings.
        </p>

        <div className="mt-7 max-w-3xl">
          <FinancingBar
            vehiclePrice={vehiclePrice}
            downPayment={downPayment}
            loanRequirement={loanRequirement}
            downPaymentPercent={downPaymentPercent}
          />
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {scenarios.map(
            ({
              percent,
              downPayment: dp,
              loanRequirement: lr,
              emiResult,
              financingPercent: fp,
            }) => {
              const active = Math.abs(downPaymentPercent - percent) < 0.51;
              return (
                <button
                  key={percent}
                  type="button"
                  onClick={() => setDownPaymentFromPercent(percent)}
                  className={`rounded-[var(--tw-radius-md)] p-5 text-left transition duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tw-orange)] ${
                    active
                      ? 'bg-[var(--tw-surface-4)] ring-1 ring-[var(--tw-navy)]/20'
                      : 'bg-[var(--tw-surface-2)] hover:bg-[var(--tw-surface-4)]'
                  }`}
                >
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--tw-muted)]">
                    {active ? (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-[var(--tw-orange)]"
                        aria-hidden
                      />
                    ) : null}
                    {percent}% Down
                  </p>
                  <p className="mt-3 text-2xl font-extrabold tabular-nums text-[var(--tw-navy)]">
                    {formatInr(dp)}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--tw-muted)]">upfront</p>
                  <dl className="mt-4 space-y-2.5 border-t border-[var(--tw-border)] pt-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <dt className="text-xs text-[var(--tw-muted)]">Loan</dt>
                      <dd className="text-sm font-bold tabular-nums text-[var(--tw-navy)]">
                        {formatInr(lr)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <dt className="text-xs text-[var(--tw-muted)]">EMI</dt>
                      <dd className="text-sm font-bold tabular-nums text-[var(--tw-navy)]">
                        {emiResult ? `${formatInr(Math.round(emiResult.monthlyEmi))}/mo` : '—'}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <dt className="text-xs text-[var(--tw-muted)]">Interest</dt>
                      <dd className="text-sm font-semibold tabular-nums text-slate-600">
                        {emiResult ? formatInr(Math.round(emiResult.totalInterest)) : '—'}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <dt className="text-xs text-[var(--tw-muted)]">Financing %</dt>
                      <dd className="text-sm font-semibold tabular-nums text-slate-600">
                        {fp.toFixed(1)}%
                      </dd>
                    </div>
                  </dl>
                </button>
              );
            },
          )}
        </div>

        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-600">
          A higher down payment lowers the loan amount and may reduce EMI and total interest — but
          minimum requirements are product-specific. Confirm with the lender or dealer.
        </p>
      </div>
    </section>
  );
}
