'use client';

import { useMemo, useState } from 'react';
import { formatInr } from '@/components/loans/loan-format';
import { useTwoWheelerDecision } from '@/components/loans/two-wheeler-loan-decision-context';
import { calculateEmi } from '@/lib/emi';
import {
  TW_TENURE_YEARS,
  TW_NEW_VS_USED_ROWS,
  TW_DEALER_POINTS,
  TW_LENDER_POINTS,
  TW_FEE_TYPES,
  TW_CLOSURE_STEPS,
  TW_TIMELINE_STEPS,
  TW_DOCUMENT_GROUPS,
  TW_SALARIED_NOTES,
  TW_SELF_EMPLOYED_NOTES,
  estimateTwPrepaymentImpact,
  estimateTwAffordability,
  type PrepaymentMode,
} from '@/lib/two-wheeler-loan-page';

function InputField({
  label,
  id,
  value,
  onChange,
  suffix,
  prefix,
}: {
  label: string;
  id: string;
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
  prefix?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wide text-[var(--tw-muted)]"
      >
        {label}
      </label>
      <div className="relative mt-1 border-b border-[var(--tw-border)] pb-1 focus-within:border-[var(--tw-orange)]">
        {prefix ? (
          <span className="pointer-events-none absolute bottom-1.5 left-0 text-sm font-bold text-[var(--tw-muted)]">
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange(n);
          }}
          className={`w-full border-0 bg-transparent py-1 text-lg font-bold tabular-nums text-[var(--tw-navy)] outline-none focus-visible:ring-0 ${prefix ? 'pl-4' : ''} ${suffix ? 'pr-8' : ''}`}
        />
        {suffix ? (
          <span className="pointer-events-none absolute bottom-1.5 right-0 text-sm font-bold text-[var(--tw-muted)]">
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* ─── a) Tenure Simulator ─── */
export function TwTenureSimulator() {
  const { loanRequirement, ratePercent } = useTwoWheelerDecision();

  const rows = useMemo(
    () =>
      TW_TENURE_YEARS.map((years) => {
        const months = years * 12;
        const result = calculateEmi({
          principal: loanRequirement,
          annualRatePercent: ratePercent,
          tenureMonths: months,
        });
        return {
          years,
          months,
          emi: result ? Math.round(result.monthlyEmi) : null,
          interest: result ? Math.round(result.totalInterest) : null,
          repayment: result ? Math.round(result.totalRepayment) : null,
        };
      }),
    [loanRequirement, ratePercent],
  );

  return (
    <section
      id="tw-tenure"
      aria-labelledby="tw-tenure-heading"
      className="full-bleed bg-[var(--tw-surface-1)]"
    >
      <div className="site-container cl-section px-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--tw-orange)]">
          Tenure
        </p>
        <h2 id="tw-tenure-heading" className="cl-h2 text-[var(--tw-navy)]">
          Compare Tenure Options
        </h2>
        <p className="cl-lede text-[var(--tw-muted)]">
          See how tenure length changes monthly EMI, total interest and total repayment for your
          two-wheeler loan.
        </p>
        <div className="mt-7 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-[var(--tw-border)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--tw-muted)]">
                <th className="pb-3 pr-4">Tenure</th>
                <th className="pb-3 pr-4">Monthly EMI</th>
                <th className="pb-3 pr-4">Total Interest</th>
                <th className="pb-3">Total Repayment</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.years} className="border-b border-[var(--tw-border)] last:border-0">
                  <td className="py-3 pr-4 font-semibold text-[var(--tw-navy)]">
                    {r.years} {r.years === 1 ? 'year' : 'years'}
                  </td>
                  <td className="py-3 pr-4 font-bold tabular-nums text-[var(--tw-navy)]">
                    {r.emi != null ? formatInr(r.emi) : '—'}
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-slate-600">
                    {r.interest != null ? formatInr(r.interest) : '—'}
                  </td>
                  <td className="py-3 tabular-nums text-slate-600">
                    {r.repayment != null ? formatInr(r.repayment) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ─── b) Financing Percent ─── */
export function TwFinancingPercent() {
  const { vehiclePrice, loanRequirement, financingPercent } = useTwoWheelerDecision();
  const loanPct = financingPercent != null ? Math.min(100, Math.max(0, financingPercent)) : 0;
  const downPct = 100 - loanPct;

  return (
    <section
      id="tw-financing"
      aria-labelledby="tw-financing-heading"
      className="full-bleed bg-[var(--tw-surface-2)]"
    >
      <div className="site-container cl-section px-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--tw-orange)]">
          Financing %
        </p>
        <h2 id="tw-financing-heading" className="cl-h2 text-[var(--tw-navy)]">
          How Much of the Vehicle Price Are You Financing?
        </h2>
        <p className="cl-lede text-[var(--tw-muted)]">
          Financing % = Loan Required ÷ Vehicle Price × 100. It is a planning ratio, not a lender
          limit.
        </p>
        <div className="mt-8 max-w-3xl">
          <div className="flex h-12 overflow-hidden rounded-[var(--tw-radius-sm)]">
            <div
              className="flex items-center justify-center bg-[var(--tw-orange)] text-xs font-semibold text-white"
              style={{ width: `${downPct}%`, minWidth: downPct > 0 ? '3rem' : 0 }}
            >
              {downPct >= 12 ? `${downPct.toFixed(0)}% DP` : null}
            </div>
            <div
              className="flex flex-1 items-center justify-center bg-[var(--tw-navy)] text-xs font-semibold text-white"
              style={{ minWidth: loanPct > 0 ? '3rem' : 0 }}
            >
              {loanPct >= 12 ? `${loanPct.toFixed(0)}% Loan` : null}
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            <span className="font-bold text-[var(--tw-navy)]">{formatInr(loanRequirement)}</span>{' '}
            loan ÷{' '}
            <span className="font-bold text-[var(--tw-navy)]">{formatInr(vehiclePrice)}</span>{' '}
            vehicle ={' '}
            <span className="font-bold text-[var(--tw-orange)]">{loanPct.toFixed(1)}%</span>{' '}
            financed
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── c) New vs Used ─── */
export function TwNewVsUsed() {
  return (
    <section
      id="tw-new-vs-used"
      aria-labelledby="tw-new-vs-used-heading"
      className="full-bleed bg-[var(--tw-surface-4)]"
    >
      <div className="site-container cl-section px-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--tw-orange)]">
          New vs Used
        </p>
        <h2 id="tw-new-vs-used-heading" className="cl-h2 text-[var(--tw-navy)]">
          New vs Used Two-Wheeler Financing
        </h2>
        <p className="cl-lede text-[var(--tw-muted)]">
          Financing terms differ between new and used two-wheelers. Compare product specifics rather
          than assuming one structure.
        </p>
        <div className="mt-8 grid items-stretch gap-5 lg:grid-cols-2">
          <article className="flex h-full flex-col bg-[var(--tw-surface-1)] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tw-muted)]">
              New Vehicle
            </p>
            <h3 className="mt-1 text-lg font-bold text-[var(--tw-navy)]">
              Financing a New Two-Wheeler
            </h3>
            <ul className="mt-4 flex-1 space-y-3">
              {TW_NEW_VS_USED_ROWS.map((row) => (
                <li
                  key={`new-${row.label}`}
                  className="border-t border-[var(--tw-border)] pt-3 first:border-0 first:pt-0"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tw-muted)]">
                    {row.label}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{row.newVehicle}</p>
                </li>
              ))}
            </ul>
          </article>
          <article className="flex h-full flex-col bg-[var(--tw-surface-2)] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tw-muted)]">
              Used Vehicle
            </p>
            <h3 className="mt-1 text-lg font-bold text-[var(--tw-navy)]">
              Financing a Used Two-Wheeler
            </h3>
            <ul className="mt-4 flex-1 space-y-3">
              {TW_NEW_VS_USED_ROWS.map((row) => (
                <li
                  key={`used-${row.label}`}
                  className="border-t border-[var(--tw-border)] pt-3 first:border-0 first:pt-0"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tw-muted)]">
                    {row.label}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{row.usedVehicle}</p>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ─── d) Affordability ─── */
export function TwAffordability() {
  const { ratePercent, tenureYears } = useTwoWheelerDecision();
  const [income, setIncome] = useState(30000);
  const [existingEmis, setExistingEmis] = useState(0);
  const [dp, setDp] = useState(20000);

  const result = useMemo(
    () => estimateTwAffordability(income, existingEmis, dp, ratePercent, tenureYears * 12),
    [income, existingEmis, dp, ratePercent, tenureYears],
  );

  return (
    <section
      id="tw-affordability"
      aria-labelledby="tw-affordability-heading"
      className="full-bleed bg-[var(--tw-surface-1)]"
    >
      <div className="site-container cl-section px-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--tw-orange)]">
          Affordability
        </p>
        <h2 id="tw-affordability-heading" className="cl-h2 text-[var(--tw-navy)]">
          What Two-Wheeler Can You Afford?
        </h2>
        <p className="cl-lede text-[var(--tw-muted)]">
          Enter your monthly income and existing EMIs to get an indicative vehicle budget.
        </p>
        <div className="mt-7 grid gap-6 sm:grid-cols-3 max-w-2xl">
          <InputField
            label="Monthly Income"
            id="tw-aff-income"
            value={income}
            onChange={setIncome}
            prefix="₹"
          />
          <InputField
            label="Existing EMIs"
            id="tw-aff-emi"
            value={existingEmis}
            onChange={setExistingEmis}
            prefix="₹"
          />
          <InputField label="Down Payment" id="tw-aff-dp" value={dp} onChange={setDp} prefix="₹" />
        </div>
        {result ? (
          <div className="mt-6 rounded-[var(--tw-radius-md)] bg-[var(--tw-surface-4)] p-5 max-w-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tw-muted)]">
              Indicative Vehicle Budget
            </p>
            <p className="mt-2 text-3xl font-extrabold tabular-nums text-[var(--tw-navy)]">
              {formatInr(result.indicativeBudget)}
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--tw-muted)]">Max Loan</dt>
                <dd className="font-semibold tabular-nums text-[var(--tw-navy)]">
                  {formatInr(result.maxLoan)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--tw-muted)]">Max EMI</dt>
                <dd className="font-semibold tabular-nums text-[var(--tw-navy)]">
                  {formatInr(Math.round(result.maxEmi))}/mo
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="mt-6 text-sm text-[var(--tw-muted)]">
            Enter valid income to see an estimate.
          </p>
        )}
      </div>
    </section>
  );
}

/* ─── e) Interest Over Time ─── */
export function TwInterestOverTime() {
  const { loanRequirement, ratePercent } = useTwoWheelerDecision();

  const rows = useMemo(
    () =>
      TW_TENURE_YEARS.map((years) => {
        const result = calculateEmi({
          principal: loanRequirement,
          annualRatePercent: ratePercent,
          tenureMonths: years * 12,
        });
        return { years, interest: result ? Math.round(result.totalInterest) : 0 };
      }),
    [loanRequirement, ratePercent],
  );
  const maxInterest = Math.max(...rows.map((r) => r.interest), 1);

  return (
    <section
      id="tw-interest"
      aria-labelledby="tw-interest-heading"
      className="full-bleed bg-[var(--tw-surface-2)]"
    >
      <div className="site-container cl-section px-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--tw-orange)]">
          Interest
        </p>
        <h2 id="tw-interest-heading" className="cl-h2 text-[var(--tw-navy)]">
          Total Interest by Tenure
        </h2>
        <p className="cl-lede text-[var(--tw-muted)]">
          Longer tenure reduces EMI but increases total interest paid over the life of the loan.
        </p>
        <div className="mt-7 max-w-xl space-y-4">
          {rows.map((r) => (
            <div key={r.years} className="flex items-center gap-4">
              <span className="w-12 text-sm font-semibold text-[var(--tw-navy)]">{r.years} yr</span>
              <div className="flex-1">
                <div
                  className="h-8 rounded-[var(--tw-radius-sm)] bg-[var(--tw-navy)]"
                  style={{ width: `${Math.max((r.interest / maxInterest) * 100, 4)}%` }}
                />
              </div>
              <span className="min-w-[5rem] text-right text-sm font-bold tabular-nums text-[var(--tw-navy)]">
                {formatInr(r.interest)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── f) Dealer vs Lender ─── */
export function TwDealerVsLender() {
  return (
    <section
      id="tw-dealer-vs-lender"
      aria-labelledby="tw-dealer-heading"
      className="full-bleed bg-[var(--tw-surface-3)]"
    >
      <div className="site-container cl-section px-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--tw-orange)]">
          Dealer vs Lender
        </p>
        <h2 id="tw-dealer-heading" className="cl-h2 text-[var(--tw-navy)]">
          Dealer Finance vs Direct Lender
        </h2>
        <p className="cl-lede text-[var(--tw-muted)]">
          Two-wheeler financing is available through dealerships and directly from banks/NBFCs. Each
          has trade-offs.
        </p>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <article className="bg-[var(--tw-surface-1)] p-5 sm:p-6">
            <h3 className="text-lg font-bold text-[var(--tw-navy)]">Dealer Finance</h3>
            <ul className="mt-4 space-y-3">
              {TW_DEALER_POINTS.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-slate-600">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--tw-orange)]"
                    aria-hidden
                  />
                  {p}
                </li>
              ))}
            </ul>
          </article>
          <article className="bg-[var(--tw-surface-2)] p-5 sm:p-6">
            <h3 className="text-lg font-bold text-[var(--tw-navy)]">Direct Lender</h3>
            <ul className="mt-4 space-y-3">
              {TW_LENDER_POINTS.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-slate-600">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--tw-navy)]"
                    aria-hidden
                  />
                  {p}
                </li>
              ))}
            </ul>
          </article>
        </div>
        <p className="mt-5 text-xs text-[var(--tw-muted)]">
          Neither option is universally better. Compare the actual sanction terms, effective rate,
          and total cost.
        </p>
      </div>
    </section>
  );
}

/* ─── g) Eligibility ─── */
export function TwEligibility() {
  return (
    <section
      id="tw-eligibility"
      aria-labelledby="tw-eligibility-heading"
      className="full-bleed bg-[var(--tw-surface-1)]"
    >
      <div className="site-container cl-section px-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--tw-orange)]">
          Eligibility
        </p>
        <h2 id="tw-eligibility-heading" className="cl-h2 text-[var(--tw-navy)]">
          Two-Wheeler Loan Eligibility
        </h2>
        <p className="cl-lede text-[var(--tw-muted)]">
          Eligibility depends on applicant profile, vehicle details and lender policy. This is a
          general framework — actual criteria vary.
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="bg-[var(--tw-surface-2)] p-5">
            <h3 className="text-sm font-bold text-[var(--tw-navy)]">Applicant</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Age: typically 21–65 years</li>
              <li>Minimum income threshold (varies)</li>
              <li>Credit score 650+ preferred</li>
              <li>Employment: salaried or self-employed</li>
            </ul>
          </div>
          <div className="bg-[var(--tw-surface-2)] p-5">
            <h3 className="text-sm font-bold text-[var(--tw-navy)]">Vehicle</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>New: most lenders accept</li>
              <li>Used: age limits may apply</li>
              <li>Electric vehicles: eligible with select lenders</li>
            </ul>
          </div>
          <div className="bg-[var(--tw-surface-2)] p-5">
            <h3 className="text-sm font-bold text-[var(--tw-navy)]">Loan</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Amount: based on ex-showroom / on-road price</li>
              <li>LTV: typically 80–100% for new</li>
              <li>Tenure: 1–5 years</li>
            </ul>
          </div>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-2 max-w-3xl">
          <div>
            <h4 className="text-sm font-bold text-[var(--tw-navy)]">Salaried</h4>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
              {TW_SALARIED_NOTES.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--tw-navy)]">Self-Employed</h4>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
              {TW_SELF_EMPLOYED_NOTES.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── h) Fees ─── */
export function TwFees() {
  return (
    <section
      id="tw-fees"
      aria-labelledby="tw-fees-heading"
      className="full-bleed bg-[var(--tw-surface-2)]"
    >
      <div className="site-container cl-section px-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--tw-orange)]">
          Fees & Charges
        </p>
        <h2 id="tw-fees-heading" className="cl-h2 text-[var(--tw-navy)]">
          Two-Wheeler Loan Fees
        </h2>
        <p className="cl-lede text-[var(--tw-muted)]">
          Fees vary by lender and product. Confirm before accepting a sanction letter. Unknown fees
          are marked accordingly.
        </p>
        <div className="mt-7 max-w-2xl space-y-4">
          {TW_FEE_TYPES.map((fee) => (
            <div key={fee.label} className="border-b border-[var(--tw-border)] pb-4 last:border-0">
              <p className="text-sm font-bold text-[var(--tw-navy)]">{fee.label}</p>
              <p className="mt-1 text-sm text-slate-600">{fee.note}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs text-[var(--tw-muted)]">
          Vehicle cost (on-road price) and finance cost (interest + fees) are separate. Confirm what
          is included in the loan amount.
        </p>
      </div>
    </section>
  );
}

/* ─── i) Prepayment ─── */
export function TwPrepayment() {
  const { loanRequirement, ratePercent, tenureYears } = useTwoWheelerDecision();
  const [outstanding, setOutstanding] = useState(() => loanRequirement);
  const [remaining, setRemaining] = useState(() => tenureYears * 12);
  const [prepayAmount, setPrepayAmount] = useState(20000);
  const [mode, setMode] = useState<PrepaymentMode>('reduce-tenure');

  const impact = useMemo(
    () => estimateTwPrepaymentImpact(outstanding, ratePercent, remaining, prepayAmount, mode),
    [outstanding, ratePercent, remaining, prepayAmount, mode],
  );

  return (
    <section
      id="tw-prepayment"
      aria-labelledby="tw-prepayment-heading"
      className="full-bleed bg-[var(--tw-surface-1)]"
    >
      <div className="site-container cl-section px-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--tw-orange)]">
          Prepayment
        </p>
        <h2 id="tw-prepayment-heading" className="cl-h2 text-[var(--tw-navy)]">
          Prepayment Calculator
        </h2>
        <p className="cl-lede text-[var(--tw-muted)]">
          See how an additional payment may reduce tenure or EMI. Check your agreement for
          foreclosure charges.
        </p>
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 max-w-3xl">
          <InputField
            label="Outstanding"
            id="tw-prep-out"
            value={outstanding}
            onChange={setOutstanding}
            prefix="₹"
          />
          <InputField
            label="Rate (%)"
            id="tw-prep-rate"
            value={ratePercent}
            onChange={() => {}}
            suffix="%"
          />
          <InputField
            label="Remaining (months)"
            id="tw-prep-rem"
            value={remaining}
            onChange={setRemaining}
          />
          <InputField
            label="Prepay Amount"
            id="tw-prep-amt"
            value={prepayAmount}
            onChange={setPrepayAmount}
            prefix="₹"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Prepayment mode">
          {(['reduce-tenure', 'reduce-emi'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={`min-h-9 rounded-full px-4 text-xs font-semibold transition ${mode === m ? 'bg-[var(--tw-navy)] text-white' : 'border border-[var(--tw-border)] text-[var(--tw-navy)]'}`}
            >
              {m === 'reduce-tenure' ? 'Reduce Tenure' : 'Reduce EMI'}
            </button>
          ))}
        </div>
        {impact ? (
          <div className="mt-5 rounded-[var(--tw-radius-md)] bg-[var(--tw-surface-4)] p-5 max-w-md">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--tw-muted)]">Interest Saved</dt>
                <dd className="font-bold tabular-nums text-[var(--tw-navy)]">
                  {formatInr(Math.round(impact.interestSaved))}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--tw-muted)]">
                  {mode === 'reduce-tenure' ? 'Months Saved' : 'New EMI'}
                </dt>
                <dd className="font-bold tabular-nums text-[var(--tw-navy)]">
                  {mode === 'reduce-tenure'
                    ? `${impact.monthsSaved} months`
                    : formatInr(Math.round(impact.revised.monthlyEmi))}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ─── j) Hypothecation ─── */
export function TwHypothecation() {
  return (
    <section
      id="tw-hypothecation"
      aria-labelledby="tw-hypothecation-heading"
      className="full-bleed bg-[var(--tw-surface-4)]"
    >
      <div className="site-container cl-section px-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--tw-orange)]">
          Hypothecation
        </p>
        <h2 id="tw-hypothecation-heading" className="cl-h2 text-[var(--tw-navy)]">
          What is Hypothecation?
        </h2>
        <p className="cl-lede text-[var(--tw-muted)]">
          When you finance a two-wheeler, the vehicle is hypothecated to the lender — meaning the
          lender has a charge on it until the loan is repaid.
        </p>
        <div className="mt-7 flex flex-col items-center gap-4 sm:flex-row sm:gap-8 max-w-lg mx-auto">
          <div className="rounded-[var(--tw-radius-md)] bg-[var(--tw-surface-1)] p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tw-muted)]">
              Borrower
            </p>
            <p className="mt-1 text-sm font-bold text-[var(--tw-navy)]">Uses vehicle</p>
          </div>
          <div className="text-2xl text-[var(--tw-muted)]" aria-hidden>
            ↔
          </div>
          <div className="rounded-[var(--tw-radius-md)] bg-[var(--tw-surface-1)] p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tw-muted)]">
              Lender
            </p>
            <p className="mt-1 text-sm font-bold text-[var(--tw-navy)]">Holds charge on RC</p>
          </div>
        </div>
        <p className="mt-6 text-sm text-slate-600 max-w-2xl">
          The RC (Registration Certificate) records the hypothecation. After loan closure, the
          lender issues a NOC and you submit it to the RTO to remove the endorsement.
        </p>
      </div>
    </section>
  );
}

/* ─── k) Closure ─── */
export function TwClosure() {
  return (
    <section
      id="tw-closure"
      aria-labelledby="tw-closure-heading"
      className="full-bleed bg-[var(--tw-surface-1)]"
    >
      <div className="site-container cl-section px-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--tw-orange)]">
          Loan Closure
        </p>
        <h2 id="tw-closure-heading" className="cl-h2 text-[var(--tw-navy)]">
          Loan Closure Timeline
        </h2>
        <p className="cl-lede text-[var(--tw-muted)]">
          Steps from final payment to clear ownership of your two-wheeler.
        </p>
        <ol className="mt-7 max-w-xl space-y-5">
          {TW_CLOSURE_STEPS.map((s, i) => (
            <li key={s.step} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--tw-navy)] text-xs font-bold text-white">
                  {i + 1}
                </span>
                {i < TW_CLOSURE_STEPS.length - 1 ? (
                  <span className="mt-1 w-px flex-1 bg-[var(--tw-border)]" aria-hidden />
                ) : null}
              </div>
              <div className="pb-4">
                <p className="text-sm font-bold text-[var(--tw-navy)]">{s.step}</p>
                <p className="mt-1 text-sm text-slate-600">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ─── l) Documents ─── */
export function TwDocuments() {
  return (
    <section
      id="tw-documents"
      aria-labelledby="tw-documents-heading"
      className="full-bleed bg-[var(--tw-surface-2)]"
    >
      <div className="site-container cl-section px-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--tw-orange)]">
          Documents
        </p>
        <h2 id="tw-documents-heading" className="cl-h2 text-[var(--tw-navy)]">
          Required Documents
        </h2>
        <p className="cl-lede text-[var(--tw-muted)]">
          Common document requirements for a two-wheeler loan application. Lender-specific lists may
          differ.
        </p>
        <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl">
          {TW_DOCUMENT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-bold text-[var(--tw-navy)]">{group.title}</h3>
              <ul className="mt-3 space-y-2">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                    <span
                      className="mt-1 h-4 w-4 shrink-0 rounded border border-[var(--tw-border)]"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── m) Application Journey ─── */
export function TwApplicationJourney() {
  return (
    <section
      id="tw-application"
      aria-labelledby="tw-application-heading"
      className="full-bleed bg-[var(--tw-surface-1)]"
    >
      <div className="site-container cl-section px-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--tw-orange)]">
          Application
        </p>
        <h2 id="tw-application-heading" className="cl-h2 text-[var(--tw-navy)]">
          Application Journey
        </h2>
        <p className="cl-lede text-[var(--tw-muted)]">
          A typical two-wheeler loan application flow from research to repayment.
        </p>
        <div className="mt-7 max-w-2xl">
          {/* Desktop: horizontal connected */}
          <div className="hidden sm:flex sm:items-start sm:gap-0">
            {TW_TIMELINE_STEPS.map((s, i) => (
              <div key={s.step} className="flex flex-1 flex-col items-center text-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--tw-navy)] text-xs font-bold text-white">
                  {i + 1}
                </span>
                <p className="mt-2 text-xs font-bold text-[var(--tw-navy)]">{s.step}</p>
                <p className="mt-1 text-xs text-slate-500">{s.detail}</p>
              </div>
            ))}
          </div>
          {/* Mobile: vertical */}
          <ol className="space-y-4 sm:hidden">
            {TW_TIMELINE_STEPS.map((s, i) => (
              <li key={s.step} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--tw-navy)] text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  {i < TW_TIMELINE_STEPS.length - 1 ? (
                    <span className="mt-1 w-px flex-1 bg-[var(--tw-border)]" aria-hidden />
                  ) : null}
                </div>
                <div className="pb-3">
                  <p className="text-sm font-bold text-[var(--tw-navy)]">{s.step}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{s.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
