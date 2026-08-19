'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { formatInr } from '@/components/loans/loan-format';
import { useLapDecision } from '@/components/loans/loan-against-property-decision-context';
import { calculatorHref } from '@/lib/finance-routes';
import {
  LAP_APPLICATION_STEPS,
  LAP_NONPAYMENT_STEPS,
  LAP_VALUATION_STEPS,
  clampNonNegative,
  compareLapTenures,
  estimateLapPrepaymentImpact,
  estimateLapTotalCost,
  parseLapMoneyInput,
  type PrepaymentMode,
} from '@/lib/loan-against-property-page';

function MoneyField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  hint?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={Number.isFinite(value) ? String(value) : '0'}
        onChange={(e) => onChange(parseLapMoneyInput(e.target.value))}
        className="mt-1.5 min-h-11 w-full rounded-[var(--lap-radius-md)] border border-[var(--lap-border)] bg-white px-3 text-[0.9375rem] font-semibold tabular-nums text-[var(--lap-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lap-orange)]/30"
      />
      {hint ? (
        <span className="mt-1 block text-sm font-normal leading-relaxed text-[var(--lap-muted)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function LapCapacity() {
  const {
    propertyValue,
    requiredLoan,
    setRequiredLoan,
    illustrativeLtvPercent,
    setIllustrativeLtvPercent,
    capacity,
  } = useLapDecision();

  if (!capacity) {
    return (
      <section id="lap-capacity" className="full-bleed bg-[var(--lap-surface-1)]">
        <div className="site-container lap-section px-4">
          <h2 className="lap-h2">How Property Value Can Affect Loan Capacity</h2>
          <p className="lap-lede">
            Enter property value above to see an illustrative capacity estimate.
          </p>
        </div>
      </section>
    );
  }

  const borrowPct = Math.min(100, Math.max(0, illustrativeLtvPercent));
  const remaining = capacity.remainingPropertyValue;
  const shortfall = capacity.exceedsCapacity
    ? Math.max(0, requiredLoan - capacity.indicativeMaxLoan)
    : 0;

  return (
    <section
      id="lap-capacity"
      aria-labelledby="lap-capacity-heading"
      className="full-bleed bg-[var(--lap-surface-1)]"
    >
      <div className="site-container lap-section px-4">
        <p className="lap-eyebrow">Borrowing Capacity</p>
        <h2 id="lap-capacity-heading" className="lap-h2">
          How Property Value Can Affect Loan Capacity
        </h2>
        <p className="lap-lede">
          Indicative capacity uses property value × illustrative LTV. Applicable LTV depends on
          lender policy and any applicable regulatory requirements — confirm officially.
        </p>

        <div className="mt-6 max-w-xs">
          <label className="block text-sm font-semibold text-slate-700">
            Illustrative LTV assumption (%)
            <input
              type="number"
              min={1}
              max={100}
              step={1}
              value={illustrativeLtvPercent}
              onChange={(e) => setIllustrativeLtvPercent(Number(e.target.value))}
              className="mt-1.5 min-h-11 w-full rounded-[var(--lap-radius-md)] border border-[var(--lap-border)] bg-white px-3 text-[0.9375rem] font-semibold tabular-nums text-[var(--lap-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lap-orange)]/30"
            />
            <span className="mt-1 block text-sm font-normal leading-relaxed text-[var(--lap-muted)]">
              User-adjustable planning input — not an RBI maximum or lender limit.
            </span>
          </label>
        </div>

        <dl className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="lap-metric-label">Estimated Property Value</dt>
            <dd className="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-[var(--lap-navy)] sm:text-[1.75rem]">
              {formatInr(Math.round(propertyValue))}
            </dd>
          </div>
          <div>
            <dt className="lap-metric-label">Requested Loan</dt>
            <dd className="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-[var(--lap-navy)] sm:text-[1.75rem]">
              {formatInr(Math.round(requiredLoan))}
            </dd>
          </div>
          <div>
            <dt className="lap-metric-label">Indicative Loan Capacity</dt>
            <dd className="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-[var(--lap-navy)] sm:text-[1.75rem]">
              {formatInr(Math.round(capacity.indicativeMaxLoan))}
            </dd>
          </div>
          <div>
            <dt className="lap-metric-label">Illustrative LTV assumption</dt>
            <dd className="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-[var(--lap-navy)] sm:text-[1.75rem]">
              {illustrativeLtvPercent}%
            </dd>
          </div>
        </dl>

        <div className="mt-8 max-w-3xl">
          <p className="text-sm font-semibold text-[var(--lap-navy)]">Property value</p>
          <div className="mt-1 flex justify-between gap-3 text-[0.8125rem] font-semibold text-[var(--lap-muted)]">
            <span>0%</span>
            <span>100%</span>
          </div>
          <div
            className="mt-1.5 h-6 overflow-hidden rounded-[var(--lap-radius-sm)] bg-[var(--lap-surface-4)]"
            role="img"
            aria-label={`Property value ${formatInr(Math.round(propertyValue))}. Indicative loan capacity ${formatInr(Math.round(capacity.indicativeMaxLoan))} at ${borrowPct}% illustrative LTV assumption. Value outside indicative LTV capacity ${formatInr(Math.round(remaining))}.`}
          >
            <div className="flex h-full w-full">
              <div className="h-full bg-[var(--lap-orange)]" style={{ width: `${borrowPct}%` }} />
              <div
                className="h-full bg-[var(--lap-navy)]"
                style={{ width: `${100 - borrowPct}%` }}
              />
            </div>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[var(--lap-muted)]">
            <span className="font-semibold text-[var(--lap-orange)]">Loan portion</span>{' '}
            {formatInr(Math.round(capacity.indicativeMaxLoan))}
            <span className="mx-2 text-[var(--lap-border)]" aria-hidden>
              |
            </span>
            <span className="font-semibold text-[var(--lap-navy)]">
              Value outside indicative LTV capacity
            </span>{' '}
            {formatInr(Math.round(remaining))}
          </p>
        </div>

        {!capacity.exceedsCapacity ? (
          <dl className="mt-8 grid gap-5 sm:grid-cols-3">
            <div>
              <dt className="lap-metric-label">Requested Loan</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--lap-navy)]">
                {formatInr(Math.round(requiredLoan))}
              </dd>
            </div>
            <div>
              <dt className="lap-metric-label">Indicative Capacity</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--lap-navy)]">
                {formatInr(Math.round(capacity.indicativeMaxLoan))}
              </dd>
            </div>
            <div>
              <dt className="lap-metric-label">Remaining Indicative Headroom</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--lap-navy)]">
                {formatInr(Math.round(capacity.headroom))}
              </dd>
            </div>
          </dl>
        ) : (
          <div className="mt-8 border-l-4 border-[var(--lap-orange)] bg-[var(--lap-surface-3)] px-4 py-4 sm:px-5">
            <p className="text-[0.9375rem] font-semibold leading-relaxed text-[var(--lap-navy)]">
              Requested amount exceeds this illustrative property-backed estimate by{' '}
              {formatInr(Math.round(shortfall))}.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setRequiredLoan(Math.floor(capacity.indicativeMaxLoan))}
                className="inline-flex min-h-11 items-center rounded-[var(--lap-radius-md)] bg-[var(--lap-navy)] px-4 text-sm font-semibold !text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lap-orange)]"
              >
                Adjust Loan Amount
              </button>
              <a
                href="#lap-hero-planner"
                className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lap-navy)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lap-orange)]"
              >
                Adjust Property Value
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function LapLtv() {
  const { propertyValue, requiredLoan, ltv } = useLapDecision();
  const loanPct = ltv != null ? Math.min(100, Math.max(0, ltv)) : 0;
  const remainingPct = Math.max(0, 100 - loanPct);
  const remainingValue = Math.max(0, propertyValue - requiredLoan);

  return (
    <section
      id="lap-ltv"
      aria-labelledby="lap-ltv-heading"
      className="full-bleed bg-[var(--lap-surface-4)]"
    >
      <div className="site-container lap-section px-4">
        <p className="lap-eyebrow">Loan-to-Value</p>
        <h2 id="lap-ltv-heading" className="lap-h2">
          Understand Loan-to-Value for LAP
        </h2>
        <p className="lap-lede">
          LTV compares the loan amount with property value. Lenders may use their own valuation and
          product LTV — this is a planning formula only.
        </p>

        <div className="mt-8 max-w-3xl">
          <p className="lap-result-label">LTV</p>
          <p className="lap-result lap-ltv-result mt-2">
            {ltv != null ? `${ltv.toFixed(1)}%` : '—'}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Formula: Loan Amount ÷ Property Value × 100
            {propertyValue > 0 ? (
              <>
                {' '}
                ({formatInr(requiredLoan)} ÷ {formatInr(propertyValue)} × 100)
              </>
            ) : null}
          </p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="lap-metric-label">Property Value</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--lap-navy)]">
                {formatInr(Math.round(propertyValue))}
              </dd>
            </div>
            <div>
              <dt className="lap-metric-label">Loan Amount</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--lap-navy)]">
                {formatInr(Math.round(requiredLoan))}
              </dd>
            </div>
            <div>
              <dt className="lap-metric-label">Equity after requested loan</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--lap-navy)]">
                {formatInr(Math.round(remainingValue))}
              </dd>
            </div>
          </dl>

          <div className="mt-8">
            <div className="flex justify-between gap-3 text-[0.8125rem] font-semibold text-[var(--lap-muted)]">
              <span>0%</span>
              <span>100%</span>
            </div>
            <div
              className="mt-1.5 flex h-10 w-full overflow-hidden rounded-[var(--lap-radius-md)]"
              role="img"
              aria-label={`Loan portion ${loanPct.toFixed(1)} percent (${formatInr(Math.round(requiredLoan))}), equity after requested loan ${remainingPct.toFixed(1)} percent (${formatInr(Math.round(remainingValue))}).`}
            >
              <div
                className="bg-[var(--lap-orange)]"
                style={{ width: `${loanPct}%`, minWidth: loanPct > 0 ? '0.5rem' : 0 }}
              />
              <div
                className="bg-[var(--lap-navy)]"
                style={{ width: `${remainingPct}%`, minWidth: remainingPct > 0 ? '0.5rem' : 0 }}
              />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[var(--lap-muted)]">
              <span className="font-semibold text-[var(--lap-orange)]">Loan</span>{' '}
              {loanPct.toFixed(1)}%
              <span className="mx-2 text-[var(--lap-border)]" aria-hidden>
                |
              </span>
              <span className="font-semibold text-[var(--lap-navy)]">Equity after requested loan</span>{' '}
              {remainingPct.toFixed(1)}%. Planning visual only — not an approval meter.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LapPropertyType() {
  const cards = [
    {
      title: 'Residential',
      body: 'Self-occupied or investment homes are commonly discussed in LAP planning. Acceptance, valuation and documentation vary by lender product.',
    },
    {
      title: 'Commercial',
      body: 'Some products may consider commercial property. Do not assume every LAP product accepts every commercial asset type.',
    },
    {
      title: 'Industrial / Other',
      body: 'Industrial and specialised assets may face stricter diligence. Product availability is lender-specific — confirm before applying.',
    },
  ];

  return (
    <section
      id="lap-property-type"
      aria-labelledby="lap-property-type-heading"
      className="full-bleed bg-[var(--lap-surface-1)]"
    >
      <div className="site-container lap-section px-4">
        <p className="lap-eyebrow">Property Type</p>
        <h2 id="lap-property-type-heading" className="lap-h2">
          How Property Type Affects Planning
        </h2>
        <p className="lap-lede">
          Educational overview only. Varnarc does not invent which lenders accept which property
          types.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {cards.map((c) => (
            <article
              key={c.title}
              className="rounded-[var(--lap-radius-md)] bg-[var(--lap-surface-2)] p-5"
            >
              <h3 className="text-base font-bold text-[var(--lap-navy)]">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LapOwnership() {
  const items = [
    {
      title: 'Self-owned (sole)',
      body: 'Single-owner title can simplify documentation, but lenders still assess valuation, legal title and repayment capacity.',
    },
    {
      title: 'Jointly owned',
      body: 'Joint ownership may require co-owner involvement or consent under lender process. Ownership alone does not equal automatic eligibility.',
    },
    {
      title: 'Inherited / Family',
      body: 'Succession and mutation records may need additional legal diligence. Confirm documentation requirements with the lender.',
    },
    {
      title: 'Business-owned',
      body: 'Corporate or firm ownership can change documentation and underwriting. Facility terms depend on entity structure and product policy.',
    },
  ];

  return (
    <section
      id="lap-ownership"
      aria-labelledby="lap-ownership-heading"
      className="full-bleed bg-[var(--lap-surface-3)]"
    >
      <div className="site-container lap-section px-4">
        <p className="lap-eyebrow">Ownership</p>
        <h2 id="lap-ownership-heading" className="lap-h2">
          Ownership Structures and LAP Planning
        </h2>
        <p className="lap-lede">
          Soft explanations of common ownership patterns. Exact co-owner and consent rules are
          lender- and title-specific.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item.title}
              className="rounded-[var(--lap-radius-md)] bg-white p-5 ring-1 ring-[var(--lap-border)]"
            >
              <h3 className="text-base font-bold text-[var(--lap-navy)]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function LapFoir() {
  const {
    monthlyIncome,
    setMonthlyIncome,
    existingEmis,
    setExistingEmis,
    otherObligations,
    setOtherObligations,
    obligation,
    emi,
  } = useLapDecision();

  const income = monthlyIncome > 0 ? monthlyIncome : 0;
  const proposed = emi?.monthlyEmi ?? 0;
  const existingPct = income > 0 ? Math.min(100, (existingEmis / income) * 100) : 0;
  const otherPct = income > 0 ? Math.min(100 - existingPct, (otherObligations / income) * 100) : 0;
  const proposedPct =
    income > 0 ? Math.min(100 - existingPct - otherPct, (proposed / income) * 100) : 0;
  const remainingPct = Math.max(0, 100 - existingPct - otherPct - proposedPct);

  return (
    <section
      id="lap-foir"
      aria-labelledby="lap-foir-heading"
      className="full-bleed bg-[var(--lap-surface-1)]"
    >
      <div className="site-container lap-section px-4">
        <p className="lap-eyebrow">Repayment Capacity</p>
        <h2 id="lap-foir-heading" className="lap-h2">
          Can Your Income Support the LAP EMI?
        </h2>
        <p className="lap-lede">
          Illustrative income allocation and obligation ratio. This is not a universal FOIR cap —
          lenders use their own frameworks.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MoneyField
            label="Monthly Net Income (₹)"
            value={monthlyIncome}
            onChange={setMonthlyIncome}
          />
          <MoneyField
            label="Existing Monthly EMIs (₹)"
            value={existingEmis}
            onChange={setExistingEmis}
          />
          <MoneyField
            label="Other Monthly Obligations (₹)"
            value={otherObligations}
            onChange={setOtherObligations}
            hint="Optional recurring commitments"
          />
          <div role="group" aria-labelledby="lap-proposed-emi-label">
            <p id="lap-proposed-emi-label" className="block text-sm font-semibold text-slate-700">
              Proposed LAP EMI
            </p>
            <p className="mt-1.5 flex min-h-11 items-center rounded-[var(--lap-radius-md)] border border-[var(--lap-border)] bg-[var(--lap-surface-2)] px-3 text-[0.9375rem] font-semibold tabular-nums text-[var(--lap-navy)]">
              {emi ? formatInr(Math.round(emi.monthlyEmi)) : '—'}
            </p>
            <span className="mt-1 block text-sm font-normal leading-relaxed text-[var(--lap-muted)]">
              From hero loan amount, tenure and planning rate.
            </span>
          </div>
        </div>

        {income > 0 && obligation ? (
          <div className="mt-8 max-w-3xl">
            <dl className="grid gap-5 sm:grid-cols-3">
              <div>
                <dt className="lap-metric-label">Total Monthly Obligations</dt>
                <dd className="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-[var(--lap-navy)]">
                  {formatInr(Math.round(obligation.totalMonthlyDebt))}
                </dd>
              </div>
              <div>
                <dt className="lap-metric-label">Remaining Monthly Income</dt>
                <dd className="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-[var(--lap-navy)]">
                  {formatInr(Math.round(obligation.remainingMonthlyIncome))}
                </dd>
              </div>
              <div>
                <dt className="lap-metric-label">Illustrative Obligation Ratio</dt>
                <dd className="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-[var(--lap-navy)]">
                  {obligation.obligationRatioPercent != null
                    ? `${obligation.obligationRatioPercent.toFixed(1)}%`
                    : '—'}
                </dd>
              </div>
            </dl>

            <p className="mt-8 text-sm font-semibold text-[var(--lap-navy)]">
              Monthly income {formatInr(Math.round(income))}
            </p>
            <div
              className="mt-2 flex h-7 w-full overflow-hidden rounded-full"
              role="img"
              aria-label={`Existing EMIs ${formatInr(Math.round(existingEmis))} (${existingPct.toFixed(0)}%). Proposed LAP EMI ${formatInr(Math.round(proposed))} (${proposedPct.toFixed(0)}%). Other obligations ${formatInr(Math.round(otherObligations))} (${otherPct.toFixed(0)}%). Remaining income ${formatInr(Math.round(obligation.remainingMonthlyIncome))} (${remainingPct.toFixed(0)}%).`}
            >
              <div className="bg-[var(--lap-navy)]" style={{ width: `${existingPct}%` }} />
              <div className="bg-[var(--lap-orange)]" style={{ width: `${proposedPct}%` }} />
              {otherPct > 0 ? (
                <div className="bg-[#94a3b8]" style={{ width: `${otherPct}%` }} />
              ) : null}
              <div className="bg-[var(--lap-surface-4)]" style={{ width: `${remainingPct}%` }} />
            </div>
            <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-[var(--lap-muted)]">
              <li>
                <span className="font-semibold text-[var(--lap-navy)]">Existing EMIs</span> —{' '}
                {formatInr(Math.round(existingEmis))}
              </li>
              <li>
                <span className="font-semibold text-[var(--lap-orange)]">LAP EMI</span> —{' '}
                {formatInr(Math.round(proposed))}
              </li>
              {otherObligations > 0 ? (
                <li>
                  <span className="font-semibold text-[#64748b]">Other obligations</span> —{' '}
                  {formatInr(Math.round(otherObligations))}
                </li>
              ) : null}
              <li>
                <span className="font-semibold text-[var(--lap-navy)]">Remaining income</span> —{' '}
                {formatInr(Math.round(obligation.remainingMonthlyIncome))}
              </li>
            </ul>
          </div>
        ) : (
          <p className="mt-6 text-sm leading-relaxed text-[var(--lap-muted)]">
            Enter monthly net income to see an illustrative obligation view.
          </p>
        )}
      </div>
    </section>
  );
}

export function LapTenureSimulator() {
  const { requiredLoan, ratePercent, tenureYears, setTenureYears } = useLapDecision();
  const rows = useMemo(
    () =>
      compareLapTenures({
        loanAmount: requiredLoan,
        annualRatePercent: ratePercent,
        yearOptions: [5, 10, 15, 20],
      }),
    [requiredLoan, ratePercent],
  );

  return (
    <section
      id="lap-tenure"
      aria-labelledby="lap-tenure-heading"
      className="full-bleed bg-[var(--lap-surface-3)]"
    >
      <div className="site-container lap-section px-4">
        <p className="lap-eyebrow">Tenure</p>
        <h2 id="lap-tenure-heading" className="lap-h2">
          How Tenure Changes EMI and Interest
        </h2>
        <p className="lap-lede">
          Compare 5-, 10-, 15- and 20-year illustrative tenures at your planning rate. Longer tenure
          can lower EMI while increasing total interest.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map(({ years, emi }) => {
            const selected = years === tenureYears;
            return (
              <button
                key={years}
                type="button"
                onClick={() => setTenureYears(years)}
                aria-pressed={selected}
                className={`rounded-[var(--lap-radius-md)] p-5 text-left ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lap-orange)] ${
                  selected
                    ? 'bg-[var(--lap-navy)] text-white ring-[var(--lap-navy)]'
                    : 'bg-white text-[var(--lap-navy)] ring-[var(--lap-border)]'
                }`}
              >
                <p
                  className={`text-sm font-semibold uppercase tracking-wide ${
                    selected ? 'text-white/70' : 'text-[var(--lap-muted)]'
                  }`}
                >
                  {years} years
                </p>
                <p className="mt-2 text-2xl font-extrabold tabular-nums">
                  {emi ? formatInr(Math.round(emi.monthlyEmi)) : '—'}
                  <span
                    className={`ml-1 text-sm font-semibold ${
                      selected ? 'text-white/70' : 'text-[var(--lap-muted)]'
                    }`}
                  >
                    /mo
                  </span>
                </p>
                <p className={`mt-3 text-sm ${selected ? 'text-white/80' : 'text-slate-600'}`}>
                  Interest {emi ? formatInr(Math.round(emi.totalInterest)) : '—'}
                </p>
              </button>
            );
          })}
        </div>
        <p className="mt-5 text-[0.8125rem] leading-relaxed text-[var(--lap-muted)] sm:text-sm">
          At {ratePercent}% p.a. on {formatInr(requiredLoan)}. Illustrative only.
        </p>
      </div>
    </section>
  );
}

export function LapTotalCost() {
  const { requiredLoan, ratePercent, tenureYears } = useLapDecision();
  const [knownFeesInput, setKnownFeesInput] = useState<string>('');
  const knownFees = knownFeesInput.trim() === '' ? null : clampNonNegative(Number(knownFeesInput));
  const total = useMemo(
    () =>
      estimateLapTotalCost({
        principal: requiredLoan,
        annualRatePercent: ratePercent,
        tenureMonths: tenureYears * 12,
        knownFees,
      }),
    [requiredLoan, ratePercent, tenureYears, knownFees],
  );

  return (
    <section
      id="lap-total-cost"
      aria-labelledby="lap-total-cost-heading"
      className="full-bleed bg-[var(--lap-surface-1)]"
    >
      <div className="site-container lap-section px-4">
        <p className="lap-eyebrow">Total Cost</p>
        <h2 id="lap-total-cost-heading" className="lap-h2">
          Illustrative Total Financing Cost
        </h2>
        <p className="lap-lede">
          Interest plus any known fees you enter. Leave fees blank when unknown — blank does not
          mean “no fee”.
        </p>
        <div className="mt-6 max-w-xs">
          <label className="block text-sm font-semibold text-slate-700">
            Known fees (₹) — optional
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={knownFeesInput}
              placeholder="Leave blank if unknown"
              onChange={(e) => setKnownFeesInput(e.target.value)}
              className="mt-1.5 min-h-11 w-full rounded-[var(--lap-radius-md)] border border-[var(--lap-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--lap-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lap-orange)]/30"
            />
            <span className="mt-1 block text-sm font-normal text-[var(--lap-muted)]">
              Unknown fees display as “Not currently available”
            </span>
          </label>
        </div>
        {total ? (
          <dl className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="lap-metric-label">Interest</dt>
              <dd className="lap-metric-value mt-1.5 text-xl sm:text-2xl">
                {formatInr(Math.round(total.totalInterest))}
              </dd>
            </div>
            <div>
              <dt className="lap-metric-label">Known Fees</dt>
              <dd className="lap-metric-value mt-1.5 text-xl sm:text-2xl">
                {total.feesKnown && total.knownFees != null
                  ? formatInr(Math.round(total.knownFees))
                  : 'Not currently available'}
              </dd>
            </div>
            <div>
              <dt className="lap-metric-label">
                {total.feesKnown ? 'Total Financing Cost' : 'Interest + Known Fees'}
              </dt>
              <dd className="lap-metric-value mt-1.5 text-xl sm:text-2xl">
                {total.feesKnown
                  ? formatInr(Math.round(total.totalFinancingCost))
                  : `${formatInr(Math.round(total.totalInterest))} + fees N/A`}
              </dd>
            </div>
            <div>
              <dt className="lap-metric-label">Total Repayment</dt>
              <dd className="lap-metric-value mt-1.5 text-xl sm:text-2xl">
                {total.feesKnown
                  ? formatInr(Math.round(total.totalRepayment))
                  : formatInr(Math.round(total.principal + total.totalInterest))}
              </dd>
              {!total.feesKnown ? (
                <p className="mt-1 text-sm text-[var(--lap-muted)]">Excludes unknown fees</p>
              ) : null}
            </div>
          </dl>
        ) : null}
      </div>
    </section>
  );
}

export function LapPrepayment() {
  const { requiredLoan, ratePercent, tenureYears, emi } = useLapDecision();
  const outstanding = Math.round(emi?.principal ?? requiredLoan);
  const [prepay, setPrepay] = useState(Math.round(outstanding * 0.1));
  const [mode, setMode] = useState<PrepaymentMode>('reduce-tenure');
  const [knownChargeInput, setKnownChargeInput] = useState('');
  const knownCharge =
    knownChargeInput.trim() === '' ? null : clampNonNegative(parseLapMoneyInput(knownChargeInput));

  useEffect(() => {
    setPrepay(Math.round(outstanding * 0.1));
  }, [outstanding]);

  const impact = useMemo(
    () =>
      estimateLapPrepaymentImpact({
        outstanding,
        annualRatePercent: ratePercent,
        remainingMonths: tenureYears * 12,
        prepaymentAmount: prepay,
        mode,
        knownCharge,
      }),
    [outstanding, ratePercent, tenureYears, prepay, mode, knownCharge],
  );

  return (
    <section
      id="lap-prepayment"
      aria-labelledby="lap-prepayment-heading"
      className="full-bleed bg-[var(--lap-surface-2)]"
    >
      <div className="site-container lap-section px-4">
        <p className="lap-eyebrow">Early Repayment</p>
        <h2 id="lap-prepayment-heading" className="lap-h2">
          Could Prepayment Reduce Financing Cost?
        </h2>
        <p className="lap-lede">
          Illustrative interest impact. Prepayment charges are not fabricated — leave blank when
          unknown and confirm with the lender.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <label className="block text-sm font-semibold text-slate-700">
            Prepayment amount (₹)
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={Number.isFinite(prepay) ? String(prepay) : '0'}
              onChange={(e) => setPrepay(parseLapMoneyInput(e.target.value))}
              className="mt-1.5 min-h-11 w-full rounded-[var(--lap-radius-md)] border border-[var(--lap-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--lap-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lap-orange)]/30"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Known charge (₹) — optional
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={knownChargeInput}
              placeholder="Blank if unknown"
              onChange={(e) => setKnownChargeInput(e.target.value)}
              className="mt-1.5 min-h-11 w-full rounded-[var(--lap-radius-md)] border border-[var(--lap-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--lap-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lap-orange)]/30"
            />
          </label>
          <div>
            <p className="text-sm font-semibold text-slate-700" id="lap-prepay-strategy-label">
              Strategy
            </p>
            <div
              className="mt-1.5 flex gap-2"
              role="group"
              aria-labelledby="lap-prepay-strategy-label"
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
                  className={`min-h-11 flex-1 rounded-full px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lap-orange)] ${
                    mode === key
                      ? 'bg-[var(--lap-navy)] text-white'
                      : 'bg-[var(--lap-surface-4)] text-[var(--lap-navy)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {impact ? (
          <dl className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="lap-metric-label">Potential Interest Saved (gross)</dt>
              <dd className="lap-metric-value mt-1.5 text-3xl">
                {formatInr(Math.round(impact.interestSaved))}
              </dd>
            </div>
            {impact.mode === 'reduce-tenure' ? (
              <div>
                <dt className="lap-metric-label">Potential Time Saved</dt>
                <dd className="lap-metric-value mt-1.5 text-3xl">{impact.monthsSaved} months</dd>
              </div>
            ) : (
              <div>
                <dt className="lap-metric-label">Revised EMI</dt>
                <dd className="lap-metric-value mt-1.5 text-3xl">
                  {formatInr(Math.round(impact.revised.monthlyEmi))}
                </dd>
              </div>
            )}
            <div>
              <dt className="lap-metric-label">Net Savings (after known charge)</dt>
              <dd className="lap-metric-value mt-1.5 text-3xl">
                {impact.netSavings != null
                  ? formatInr(Math.round(impact.netSavings))
                  : 'Not currently available'}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-6 text-sm text-[var(--lap-muted)]">
            Enter a prepayment amount less than outstanding to see illustrative savings.
          </p>
        )}
        <Link
          href={calculatorHref('loan-prepayment')}
          className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lap-navy)] underline-offset-2 hover:text-[var(--lap-orange)] hover:underline"
        >
          Open Prepayment Calculator →
        </Link>
      </div>
    </section>
  );
}

export function LapFixedFloating() {
  return (
    <section
      id="lap-rate-type"
      aria-labelledby="lap-rate-type-heading"
      className="full-bleed bg-[var(--lap-surface-1)]"
    >
      <div className="site-container lap-section px-4">
        <p className="lap-eyebrow">Rate Type</p>
        <h2 id="lap-rate-type-heading" className="lap-h2">
          Fixed vs Floating LAP Rates
        </h2>
        <p className="lap-lede">
          Neither rate type is universally better. Compare product terms, reset rules and your
          repayment horizon.
        </p>
        <div className="mt-8 grid items-stretch gap-5 lg:grid-cols-2">
          <article className="flex h-full flex-col bg-[var(--lap-surface-2)] p-5 sm:p-6">
            <p className="lap-result-label">Fixed Rate</p>
            <h3 className="mt-1 text-lg font-bold text-[var(--lap-navy)]">More predictable path</h3>
            <ul className="mt-4 flex-1 space-y-2.5 text-sm leading-relaxed text-slate-600">
              <li>EMI path may stay more stable for a stated period, subject to product terms.</li>
              <li>Can help budgeting when cash flows are rigid.</li>
              <li>Reset or conversion rules still matter — read the sanction letter.</li>
            </ul>
          </article>
          <article className="flex h-full flex-col bg-[var(--lap-surface-4)] p-5 sm:p-6">
            <p className="lap-result-label">Floating Rate</p>
            <h3 className="mt-1 text-lg font-bold text-[var(--lap-navy)]">May move with terms</h3>
            <ul className="mt-4 flex-1 space-y-2.5 text-sm leading-relaxed text-slate-600">
              <li>Rate may change with benchmark or lender reset policy.</li>
              <li>EMI or tenure can adjust depending on product mechanics.</li>
              <li>Useful to stress-test affordability if rates rise — planning only.</li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}

export function LapValuation() {
  return (
    <section
      id="lap-valuation"
      aria-labelledby="lap-valuation-heading"
      className="full-bleed bg-[var(--lap-surface-3)]"
    >
      <div className="site-container lap-section px-4">
        <p className="lap-eyebrow">Valuation</p>
        <h2 id="lap-valuation-heading" className="lap-h2">
          How Property Valuation May Progress
        </h2>
        <p className="lap-lede">
          An owner’s expected market value is a planning input. Lenders typically use their own
          valuation and diligence process.
        </p>
        <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Valuation steps">
          {LAP_VALUATION_STEPS.map((step, index) => (
            <li
              key={step}
              className="rounded-[var(--lap-radius-md)] bg-white p-4 ring-1 ring-[var(--lap-border)]"
            >
              <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-[var(--lap-muted)]">
                Step {index + 1}
              </p>
              <p className="mt-1 text-sm font-bold text-[var(--lap-navy)]">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function LapLegalTechnical() {
  return (
    <section
      id="lap-legal"
      aria-labelledby="lap-legal-heading"
      className="full-bleed bg-[var(--lap-surface-1)]"
    >
      <div className="site-container lap-section px-4">
        <p className="lap-eyebrow">Verification</p>
        <h2 id="lap-legal-heading" className="lap-h2">
          Legal and Technical Checks
        </h2>
        <p className="lap-lede">
          Secured lending commonly involves title and property diligence. Exact checklists vary by
          lender and location.
        </p>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <article className="rounded-[var(--lap-radius-md)] bg-[var(--lap-surface-2)] p-5 sm:p-6">
            <h3 className="text-base font-bold text-[var(--lap-navy)]">Legal</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {[
                'Title / ownership chain review',
                'Encumbrance and charge search themes',
                'Consent / co-owner documentation where applicable',
                'Agreement and mortgage documentation',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-[var(--lap-orange)]" aria-hidden>
                    ·
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-[var(--lap-radius-md)] bg-[var(--lap-surface-4)] p-5 sm:p-6">
            <h3 className="text-base font-bold text-[var(--lap-navy)]">Technical</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {[
                'Property inspection / technical assessment',
                'Construction and usage observations',
                'Market / valuation inputs',
                'Eligible value used for lending assessment',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-[var(--lap-orange)]" aria-hidden>
                    ·
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}

export function LapEligibility() {
  const profiles = [
    {
      title: 'Property Profile',
      items: ['Ownership', 'Property type', 'Location', 'Usage'],
    },
    {
      title: 'Applicant Profile',
      items: ['KYC', 'Income type', 'Credit history', 'Existing obligations'],
    },
    {
      title: 'Loan Profile',
      items: ['Requested amount', 'Tenure', 'Purpose (as disclosed)', 'LTV planning'],
    },
    {
      title: 'Diligence Profile',
      items: ['Legal title', 'Technical / valuation', 'Documentation completeness'],
    },
  ];

  return (
    <section
      id="lap-eligibility"
      aria-labelledby="lap-eligibility-heading"
      className="full-bleed bg-[var(--lap-surface-4)]"
    >
      <div className="site-container lap-section px-4">
        <p className="lap-eyebrow">Eligibility</p>
        <h2 id="lap-eligibility-heading" className="lap-h2">
          LAP Profile Factors
        </h2>
        <p className="lap-lede">
          Soft planning themes only: Potential Match, May Be Relevant, More Information Required —
          never Approved or Guaranteed Eligible.
        </p>
        <ul className="mt-8 grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {profiles.map((p) => (
            <li key={p.title} className="border-t border-[var(--lap-border)] pt-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--lap-navy)]">
                {p.title}
              </h3>
              <ul className="mt-2 space-y-1.5">
                {p.items.map((item) => (
                  <li key={item} className="text-[0.9375rem] text-slate-600">
                    · {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <Link
          href="/finance/eligibility"
          className="mt-8 inline-flex min-h-11 items-center rounded-[var(--lap-radius-md)] bg-[var(--lap-navy)] px-4 text-sm font-semibold !text-white"
        >
          Check Loan Eligibility →
        </Link>
      </div>
    </section>
  );
}

export function LapCoOwner() {
  return (
    <section
      id="lap-co-owner"
      aria-labelledby="lap-co-owner-heading"
      className="full-bleed bg-[var(--lap-surface-1)]"
    >
      <div className="site-container lap-section px-4">
        <p className="lap-eyebrow">Co-owners</p>
        <h2 id="lap-co-owner-heading" className="lap-h2">
          Planning With Co-owners
        </h2>
        <p className="lap-lede">
          Joint title often means more stakeholders in consent, documentation and repayment
          planning. Exact requirements are lender-specific.
        </p>
        <ul className="mt-6 max-w-2xl space-y-3 text-sm leading-relaxed text-slate-600">
          <li>
            · Co-owner consent or co-applicant participation may be required depending on title and
            product rules.
          </li>
          <li>
            · Income of co-applicants may be considered when assessing repayment capacity — confirm
            with the lender.
          </li>
          <li>· Ownership share alone does not automatically determine how much you can borrow.</li>
        </ul>
      </div>
    </section>
  );
}

export function LapNonPayment() {
  return (
    <section
      id="lap-risk"
      aria-labelledby="lap-risk-heading"
      className="full-bleed bg-[var(--lap-surface-2)]"
    >
      <div className="site-container lap-section px-4">
        <p className="lap-eyebrow">Missed Payments</p>
        <h2 id="lap-risk-heading" className="lap-h2">
          What May Happen If Payments Are Missed
        </h2>
        <p className="lap-lede">
          Educational sequence only. Exact timelines and remedies depend on the agreement,
          applicable law and lender policy.
        </p>
        <ol className="relative mt-8 max-w-lg space-y-0" aria-label="Non-payment awareness steps">
          {LAP_NONPAYMENT_STEPS.map((step, index) => {
            const isLast = index === LAP_NONPAYMENT_STEPS.length - 1;
            return (
              <li key={step} className="relative flex gap-3 pb-4">
                {!isLast ? (
                  <span
                    className="absolute left-[15px] top-8 bottom-0 w-px bg-[var(--lap-navy)]/25"
                    aria-hidden
                  />
                ) : null}
                <span className="relative z-[1] inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--lap-navy)]/20 bg-white text-xs font-bold text-[var(--lap-navy)]">
                  {index + 1}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-bold text-[var(--lap-navy)]">{step}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export function LapCompareLoans() {
  const headers = ['Theme', 'LAP', 'Home Loan', 'Personal Loan', 'Business Loan'];
  const rows = [
    [
      'Primary security',
      'Owned property as collateral',
      'Property being purchased',
      'Typically unsecured',
      'May be secured or unsecured',
    ],
    [
      'Common use',
      'Liquidity against owned asset',
      'Home purchase / construction',
      'Personal expenses',
      'Business funding needs',
    ],
    [
      'Capacity lens',
      'Property LTV + repayment capacity',
      'Property LTV + income',
      'Income / credit profile',
      'Cash-flow / business profile',
    ],
    [
      'Diligence emphasis',
      'Legal + technical + valuation',
      'Property + applicant docs',
      'Applicant KYC + income',
      'Business financials + KYC',
    ],
    [
      'Non-payment theme',
      'May involve secured property remedies',
      'Property-secured remedies may apply',
      'Credit / recovery process',
      'Facility / security dependent',
    ],
  ];

  return (
    <section
      id="lap-compare"
      aria-labelledby="lap-compare-heading"
      className="full-bleed bg-[var(--lap-surface-1)]"
    >
      <div className="site-container lap-section px-4">
        <p className="lap-eyebrow">Comparison</p>
        <h2 id="lap-compare-heading" className="lap-h2">
          LAP vs Home vs Personal vs Business
        </h2>
        <p className="lap-lede">Neutral comparison — no option is universally better.</p>

        <div className="mt-8 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[640px] text-left text-[0.9375rem]">
            <thead>
              <tr className="border-b border-[var(--lap-border)] text-[var(--lap-muted)]">
                {headers.map((h) => (
                  <th key={h} className="px-3 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[0]} className="border-b border-[var(--lap-border)]/70">
                  {row.map((cell, i) => (
                    <td
                      key={`${row[0]}-${i}`}
                      className={`px-3 py-3 align-top ${
                        i === 0 ? 'font-semibold text-[var(--lap-navy)]' : 'text-slate-600'
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 space-y-4 md:hidden">
          {rows.map((row) => (
            <article
              key={row[0]}
              className="rounded-[var(--lap-radius-md)] bg-[var(--lap-surface-2)] p-4"
            >
              <h3 className="text-sm font-bold text-[var(--lap-navy)]">{row[0]}</h3>
              <dl className="mt-3 space-y-2 text-sm">
                {headers.slice(1).map((h, i) => (
                  <div key={h}>
                    <dt className="text-[0.8125rem] font-semibold uppercase tracking-wide text-[var(--lap-muted)]">
                      {h}
                    </dt>
                    <dd className="mt-0.5 text-slate-600">{row[i + 1]}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LapDocuments() {
  const groups = [
    {
      title: 'Applicant KYC',
      items: ['Identity proof', 'Address proof', 'Photographs where applicable'],
    },
    {
      title: 'Income',
      items: ['Salary / ITR / business proofs as applicable', 'Bank statements commonly requested'],
    },
    {
      title: 'Property Ownership',
      items: ['Title / sale deed themes', 'Mutation / tax receipts as applicable'],
    },
    {
      title: 'Property Diligence',
      items: ['Encumbrance-related docs', 'Approved plans / occupancy themes where relevant'],
    },
    {
      title: 'Loan Papers',
      items: ['Application forms', 'Agreements and mortgage documentation'],
    },
    {
      title: 'Additional',
      items: ['Co-owner consent where required', 'Lender-specific checklist items'],
    },
  ];

  return (
    <section
      id="lap-documents"
      aria-labelledby="lap-documents-heading"
      className="full-bleed bg-[var(--lap-surface-4)]"
    >
      <div className="site-container lap-section px-4">
        <p className="lap-eyebrow">Documents</p>
        <h2 id="lap-documents-heading" className="lap-h2">
          Documents Commonly Discussed
        </h2>
        <p className="lap-lede">
          Themes only — exact lists vary by lender, property type and ownership structure.
        </p>
        <div className="mt-8 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <article key={g.title} className="border-t border-[var(--lap-border)] pt-3">
              <h3 className="text-sm font-bold text-[var(--lap-navy)]">{g.title}</h3>
              <ul className="mt-2 space-y-2">
                {g.items.map((item) => (
                  <li key={item} className="text-[0.9375rem] text-slate-600">
                    · {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LapApplicationJourney() {
  return (
    <section
      id="lap-application"
      aria-labelledby="lap-application-heading"
      className="full-bleed bg-[var(--lap-surface-3)]"
    >
      <div className="site-container lap-section px-4">
        <h2 id="lap-application-heading" className="lap-h2">
          How a LAP Application May Progress
        </h2>
        <p className="lap-lede">
          From estimate and verification through decision and disbursement. Steps may vary by
          lender.
        </p>

        <ol
          className="mt-8 hidden gap-3 md:grid md:grid-cols-3 lg:grid-cols-4"
          aria-label="Application journey"
        >
          {LAP_APPLICATION_STEPS.map((step, index) => (
            <li
              key={step}
              className="relative rounded-[var(--lap-radius-md)] bg-white p-4 ring-1 ring-[var(--lap-border)]"
            >
              <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-[var(--lap-muted)]">
                Step {index + 1}
              </p>
              <p className="mt-1 text-sm font-bold text-[var(--lap-navy)]">{step}</p>
            </li>
          ))}
        </ol>

        <ol className="relative mt-8 space-y-0 md:hidden">
          {LAP_APPLICATION_STEPS.map((step, index) => {
            const isLast = index === LAP_APPLICATION_STEPS.length - 1;
            return (
              <li key={step} className="relative flex gap-3 pb-4">
                {!isLast ? (
                  <span
                    className="absolute left-[15px] top-8 bottom-0 w-px bg-[var(--lap-navy)]/25"
                    aria-hidden
                  />
                ) : null}
                <span className="relative z-[1] inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--lap-navy)]/20 bg-white text-xs font-bold text-[var(--lap-navy)]">
                  {index + 1}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-[var(--lap-muted)]">
                    Step {index + 1}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-[var(--lap-navy)]">{step}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
