'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { formatInr } from '@/components/loans/loan-format';
import { useGoldLoanDecision } from '@/components/loans/gold-loan-decision-context';
import {
  GOLD_LOAN_APPLICATION_STEPS,
  GOLD_LOAN_PLEDGE_STEPS,
  comparePurityForWeight,
  estimateGoldRepayment,
  estimateGoldTotalCost,
  purityFactorFromKarat,
  stressGoldValueLtv,
  type GoldRepaymentMode,
} from '@/lib/gold-loan-page';

function MoneyField({
  label,
  value,
  onChange,
  hint,
  step,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  hint?: string;
  step?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input
        type="number"
        min={0}
        step={step ?? '1'}
        inputMode="decimal"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 min-h-11 w-full rounded-[var(--gl-radius-md)] border border-[var(--gl-border)] bg-white px-3 text-[0.9375rem] font-semibold tabular-nums text-[var(--gl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-orange)]/30"
      />
      {hint ? (
        <span className="mt-1 block text-[0.8125rem] font-normal leading-relaxed text-[var(--gl-muted)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function StageConnector({ desktop }: { desktop?: boolean }) {
  return (
    <div
      className={
        desktop
          ? 'hidden items-center px-1 text-[var(--gl-muted)] lg:flex'
          : 'flex justify-center py-1.5 text-[var(--gl-muted)] lg:hidden'
      }
      aria-hidden
    >
      <span className="text-sm font-semibold">{desktop ? '→' : '↓'}</span>
    </div>
  );
}

/** Signature Gold → Purity → Value → LTV → Capacity flow */
function GoldCapacityStory() {
  const { weightG, karat, valuation, capacity, illustrativeLtvPercent } = useGoldLoanDecision();
  const factor = purityFactorFromKarat(karat);
  const finePct = factor != null ? (factor * 100).toFixed(1) : '—';
  const goldValue = valuation ? Math.round(valuation.estimatedGoldValue) : null;
  const loanCap = capacity ? Math.round(capacity.indicativeMaxLoan) : null;
  const remaining = goldValue != null && loanCap != null ? Math.max(0, goldValue - loanCap) : null;
  const ltvPct = Math.min(100, Math.max(0, illustrativeLtvPercent));

  return (
    <div className="mt-8" aria-label="Gold weight to loan capacity flow">
      <ol className="flex flex-col gap-0 lg:flex-row lg:items-stretch lg:gap-0">
        {[
          {
            label: 'Gold Weight',
            value: valuation ? `${valuation.eligibleWeightG.toFixed(1)} g` : `${weightG} g`,
            hint: 'Eligible weight',
          },
          {
            label: 'Purity',
            value: `${karat}K`,
            hint: `≈ ${finePct}% fine gold`,
          },
          {
            label: 'Estimated Eligible Gold Value',
            value: goldValue != null ? formatInr(goldValue) : '—',
            hint: 'Illustrative',
          },
          {
            label: 'Illustrative LTV',
            value: `${illustrativeLtvPercent}%`,
            hint: 'User-adjustable',
          },
          {
            label: 'Indicative Loan Capacity',
            value: loanCap != null ? formatInr(loanCap) : '—',
            hint: 'Not a sanction',
            accent: true,
          },
        ].map((stage, i, arr) => (
          <li
            key={stage.label}
            className="flex min-w-0 flex-1 flex-col lg:flex-row lg:items-stretch"
          >
            <div
              className={`min-w-0 flex-1 border-l-2 border-[var(--gl-navy)]/15 py-3 pl-4 lg:border-l-0 lg:border-t-2 lg:px-2 lg:py-0 lg:pt-3 ${
                stage.accent ? 'lg:border-t-[var(--gl-orange)]' : ''
              }`}
            >
              <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-[var(--gl-muted)]">
                {stage.label}
              </p>
              <p className={`mt-1 gl-result ${stage.accent ? 'gl-result-accent' : ''}`}>
                {stage.value}
              </p>
              <p className="mt-0.5 text-[0.8125rem] text-[var(--gl-muted)]">{stage.hint}</p>
            </div>
            {i < arr.length - 1 ? (
              <>
                <StageConnector />
                <StageConnector desktop />
              </>
            ) : null}
          </li>
        ))}
      </ol>

      {goldValue != null && loanCap != null ? (
        <div className="mt-8 max-w-2xl">
          <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-[var(--gl-muted)]">
            Collateral Value
          </p>
          <div
            className="mt-2 h-5 overflow-hidden rounded-full bg-[var(--gl-navy)]/15"
            role="img"
            aria-label={`Gold value ${formatInr(goldValue)}. Illustrative LTV ${ltvPct}% equals borrowing portion ${formatInr(loanCap)}. Remaining collateral value ${formatInr(remaining ?? 0)}.`}
          >
            <div className="flex h-full w-full">
              <div
                className="h-full bg-[var(--gl-orange)]"
                style={{ width: `${ltvPct}%` }}
                title={`Borrowing portion ${formatInr(loanCap)}`}
              />
              <div
                className="h-full bg-[var(--gl-navy)]"
                style={{ width: `${100 - ltvPct}%` }}
                title={`Remaining ${formatInr(remaining ?? 0)}`}
              />
            </div>
          </div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-[0.8125rem] font-semibold text-[var(--gl-muted)]">
                Indicative Loan (LTV)
              </dt>
              <dd className="mt-0.5 text-base font-bold tabular-nums text-[var(--gl-orange)]">
                {formatInr(loanCap)}
              </dd>
            </div>
            <div>
              <dt className="text-[0.8125rem] font-semibold text-[var(--gl-muted)]">
                Remaining Collateral Value
              </dt>
              <dd className="mt-0.5 text-base font-bold tabular-nums text-[var(--gl-navy)]">
                {formatInr(remaining ?? 0)}
              </dd>
            </div>
            <div>
              <dt className="text-[0.8125rem] font-semibold text-[var(--gl-muted)]">Gold Value</dt>
              <dd className="mt-0.5 text-base font-bold tabular-nums text-[var(--gl-navy)]">
                {formatInr(goldValue)}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}

export function GoldLoanValuation() {
  const {
    weightG,
    setWeightG,
    karat,
    setKarat,
    referenceRatePerG,
    setReferenceRatePerG,
    illustrativeLtvPercent,
    setIllustrativeLtvPercent,
    eligibleWeightFraction,
    setEligibleWeightFraction,
    valuation,
  } = useGoldLoanDecision();

  return (
    <section
      id="gl-valuation"
      aria-labelledby="gl-valuation-heading"
      className="full-bleed bg-[var(--gl-surface-1)]"
    >
      <div className="site-container gl-section px-4">
        <p className="gl-eyebrow">Gold Value Estimator</p>
        <h2 id="gl-valuation-heading" className="gl-h2">
          Estimate the Value Used for Your Gold Loan
        </h2>
        <p className="gl-lede">
          Market gold price is a reference — not necessarily the valuation a lender will use. Stones
          and non-gold components may be excluded or adjusted.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MoneyField
            label="Gross gold weight (g)"
            value={weightG}
            onChange={setWeightG}
            step="0.1"
          />
          <MoneyField label="Purity (karat)" value={karat} onChange={setKarat} step="0.1" />
          <MoneyField
            label="Reference gold rate (₹/g)"
            value={referenceRatePerG}
            onChange={setReferenceRatePerG}
            hint="User-entered reference — not a live market feed"
          />
          <MoneyField
            label="Illustrative LTV (%)"
            value={illustrativeLtvPercent}
            onChange={setIllustrativeLtvPercent}
            hint="Adjust per lender/policy — not a universal regulatory cap"
          />
        </div>
        <div className="mt-3 max-w-xs">
          <MoneyField
            label="Eligible weight fraction (0–1)"
            value={eligibleWeightFraction}
            onChange={setEligibleWeightFraction}
            step="0.01"
            hint="Optional: reduce if part of weight may not be treated as eligible metal"
          />
        </div>

        <GoldCapacityStory />

        <p className="mt-5 text-[0.875rem] leading-relaxed text-[var(--gl-muted)]" role="note">
          {valuation?.calculationBasis}
        </p>
      </div>
    </section>
  );
}

export function GoldLoanPurityVisualizer() {
  const { weightG, referenceRatePerG } = useGoldLoanDecision();
  const rows = useMemo(
    () => comparePurityForWeight({ grossWeightG: weightG, referenceRatePerG }),
    [weightG, referenceRatePerG],
  );
  const maxVal = Math.max(1, ...rows.map((r) => r.estimatedGoldValue));

  return (
    <section
      id="gl-purity"
      aria-labelledby="gl-purity-heading"
      className="full-bleed bg-[var(--gl-surface-4)]"
    >
      <div className="site-container gl-section px-4">
        <p className="gl-eyebrow">Purity</p>
        <h2 id="gl-purity-heading" className="gl-h2">
          How Purity Can Change Gold Valuation
        </h2>
        <p className="gl-lede">
          Same gross weight ({weightG} g). Higher purity generally means more gold content for the
          same weight. Actual lender valuation can differ based on appraisal methodology, eligible
          weight, non-gold components and applicable lender/regulatory requirements.
        </p>
        <ul className="mt-8 space-y-5" aria-label="Purity comparison for the same weight">
          {rows.map((r) => {
            const pct = Math.max(10, Math.round((r.estimatedGoldValue / maxVal) * 100));
            const fine = (r.purityFactor * 100).toFixed(2);
            return (
              <li key={r.karat}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-base font-bold text-[var(--gl-navy)]">
                    {r.label}
                    <span className="ml-2 text-[0.875rem] font-semibold text-[var(--gl-muted)]">
                      ≈ {fine}% theoretical gold content
                    </span>
                  </h3>
                  <p className="text-base font-extrabold tabular-nums text-[var(--gl-navy)]">
                    {formatInr(Math.round(r.estimatedGoldValue))}
                  </p>
                </div>
                <div
                  className="mt-2 h-3.5 overflow-hidden rounded-full bg-[var(--gl-navy)]/10"
                  role="img"
                  aria-label={`${r.label}: approximately ${fine}% fine gold; estimated value ${formatInr(Math.round(r.estimatedGoldValue))}`}
                >
                  <div
                    className="h-full rounded-full bg-[var(--gl-navy)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-5 text-[0.875rem] leading-relaxed text-[var(--gl-muted)]">
          Fine-gold proportions are theoretical (karat ÷ 24). Do not assume lender appraisal equals
          theoretical fine-gold value.
        </p>
      </div>
    </section>
  );
}

export function GoldLoanCapacity() {
  const { requiredLoan, setRequiredLoan, valuation, capacity, illustrativeLtvPercent } =
    useGoldLoanDecision();
  if (!valuation || !capacity) {
    return (
      <section id="gl-capacity" className="full-bleed bg-[var(--gl-surface-1)]">
        <div className="site-container gl-section px-4">
          <h2 className="gl-h2">See How Gold Value Changes Your Borrowing Capacity</h2>
          <p className="gl-lede">
            Enter gold details above to see an illustrative capacity estimate.
          </p>
        </div>
      </section>
    );
  }

  const borrowPct = Math.min(100, illustrativeLtvPercent);
  const remaining = capacity.estimatedGoldValue - capacity.indicativeMaxLoan;

  return (
    <section
      id="gl-capacity"
      aria-labelledby="gl-capacity-heading"
      className="full-bleed bg-[var(--gl-surface-1)]"
    >
      <div className="site-container gl-section px-4">
        <p className="gl-eyebrow">Borrowing Capacity</p>
        <h2 id="gl-capacity-heading" className="gl-h2">
          See How Gold Value Changes Your Borrowing Capacity
        </h2>
        <p className="gl-lede">
          Illustrative LTV visualization. Applicable LTV depends on lender policy and any applicable
          regulatory requirements — confirm officially.
        </p>

        <div className="mt-8 max-w-xl">
          <div className="flex flex-wrap justify-between gap-2 text-[0.875rem] font-semibold text-[var(--gl-navy)]">
            <span>Gold Value {formatInr(Math.round(capacity.estimatedGoldValue))}</span>
            <span>LTV {illustrativeLtvPercent}%</span>
          </div>
          <div
            className="mt-2 h-5 overflow-hidden rounded-full bg-[var(--gl-navy)]/15"
            role="img"
            aria-label={`Gold value ${formatInr(Math.round(capacity.estimatedGoldValue))}. Loan portion ${formatInr(Math.round(capacity.indicativeMaxLoan))} at ${borrowPct}% LTV. Remaining value ${formatInr(Math.round(remaining))}.`}
          >
            <div className="flex h-full w-full">
              <div className="h-full bg-[var(--gl-orange)]" style={{ width: `${borrowPct}%` }} />
              <div
                className="h-full bg-[var(--gl-navy)]"
                style={{ width: `${100 - borrowPct}%` }}
              />
            </div>
          </div>
          <p className="mt-2 text-[0.8125rem] text-[var(--gl-muted)]">
            <span className="font-semibold text-[var(--gl-orange)]">■</span> Borrowing portion{' '}
            {formatInr(Math.round(capacity.indicativeMaxLoan))}
            <span className="mx-2 text-[var(--gl-border)]">|</span>
            <span className="font-semibold text-[var(--gl-navy)]">■</span> Remaining collateral{' '}
            {formatInr(Math.round(remaining))}
          </p>

          <dl className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="gl-metric-label">Indicative Maximum Loan</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--gl-navy)]">
                {formatInr(Math.round(capacity.indicativeMaxLoan))}
              </dd>
            </div>
            <div>
              <dt className="gl-metric-label">Requested Loan</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--gl-navy)]">
                {formatInr(Math.round(requiredLoan))}
              </dd>
            </div>
            <div>
              <dt className="gl-metric-label">Headroom</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--gl-navy)]">
                {formatInr(Math.round(capacity.headroom))}
              </dd>
            </div>
            <div>
              <dt className="gl-metric-label">Remaining Collateral Value</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--gl-navy)]">
                {formatInr(Math.round(remaining))}
              </dd>
            </div>
          </dl>
        </div>

        {capacity.exceedsCapacity ? (
          <div className="mt-6 border-l-4 border-[var(--gl-orange)] bg-[var(--gl-surface-3)] px-4 py-4">
            <p className="text-[0.9375rem] font-semibold text-[var(--gl-navy)]">
              Your requested amount is above this illustrative borrowing estimate.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setRequiredLoan(Math.floor(capacity.indicativeMaxLoan))}
                className="inline-flex min-h-11 items-center rounded-[var(--gl-radius-md)] bg-[var(--gl-navy)] px-4 text-sm font-semibold !text-white"
              >
                Adjust loan amount
              </button>
              <a
                href="#gl-valuation"
                className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--gl-navy)] underline-offset-2 hover:underline"
              >
                Adjust gold details
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function GoldLoanRequired() {
  const {
    requiredLoan,
    setRequiredLoan,
    karat,
    referenceRatePerG,
    illustrativeLtvPercent,
    goldRequiredG,
  } = useGoldLoanDecision();

  const factor = purityFactorFromKarat(karat);
  const requiredEligibleValue =
    illustrativeLtvPercent > 0 ? requiredLoan / (illustrativeLtvPercent / 100) : null;
  const perGram = factor != null && referenceRatePerG > 0 ? factor * referenceRatePerG : null;

  return (
    <section
      id="gl-gold-required"
      aria-labelledby="gl-gold-required-heading"
      className="full-bleed bg-[var(--gl-surface-3)]"
    >
      <div className="site-container gl-section px-4">
        <p className="gl-eyebrow">Reverse Calculator</p>
        <h2 id="gl-gold-required-heading" className="gl-h2">
          How Much Gold Might You Need?
        </h2>
        <p className="gl-lede">
          Illustrative reverse estimate from required loan, purity-adjusted reference value and
          illustrative LTV — not the exact amount a lender will accept.
        </p>
        <div className="mt-6 max-w-xs">
          <MoneyField label="Required Loan (₹)" value={requiredLoan} onChange={setRequiredLoan} />
        </div>

        <div className="mt-8 max-w-lg" aria-label="Gold required calculation equation">
          <div className="space-y-1 border-l-2 border-[var(--gl-border)] pl-4">
            <div className="py-2">
              <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-[var(--gl-muted)]">
                Required Loan
              </p>
              <p className="text-2xl font-extrabold tabular-nums text-[var(--gl-navy)]">
                {formatInr(requiredLoan)}
              </p>
            </div>
            <p className="text-sm font-semibold text-[var(--gl-muted)]" aria-hidden>
              ÷
            </p>
            <div className="py-2">
              <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-[var(--gl-muted)]">
                Illustrative LTV
              </p>
              <p className="text-xl font-bold tabular-nums text-[var(--gl-navy)]">
                {illustrativeLtvPercent}%
              </p>
            </div>
            <p className="text-sm font-semibold text-[var(--gl-muted)]" aria-hidden>
              =
            </p>
            <div className="py-2">
              <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-[var(--gl-muted)]">
                Required Eligible Gold Value
              </p>
              <p className="text-xl font-bold tabular-nums text-[var(--gl-navy)]">
                {requiredEligibleValue != null ? formatInr(Math.round(requiredEligibleValue)) : '—'}
              </p>
            </div>
            <p className="text-sm font-semibold text-[var(--gl-muted)]" aria-hidden>
              ÷
            </p>
            <div className="py-2">
              <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-[var(--gl-muted)]">
                Purity-Adjusted Value / Gram
              </p>
              <p className="text-xl font-bold tabular-nums text-[var(--gl-navy)]">
                {perGram != null ? `${formatInr(Math.round(perGram))}/g` : '—'}
              </p>
              <p className="mt-0.5 text-[0.8125rem] text-[var(--gl-muted)]">
                {karat}K × {formatInr(referenceRatePerG)}/g reference
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[var(--gl-radius-md)] bg-[var(--gl-navy)] px-5 py-6 text-white">
            <p className="gl-result-label !text-white/70">Estimated Gold Required</p>
            <p
              className="mt-1 text-4xl font-extrabold tabular-nums tracking-tight text-white"
              aria-live="polite"
            >
              {goldRequiredG != null ? `${goldRequiredG.toFixed(1)} g` : '—'}
            </p>
            <p className="mt-2 text-[0.9375rem] text-white/80">
              {karat}K gold · Illustrative estimate
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function RepaymentTimeline({
  mode,
  periodic,
  principalAtEnd,
  tenureMonths,
}: {
  mode: GoldRepaymentMode;
  periodic: number | null;
  principalAtEnd: number;
  tenureMonths: number;
}) {
  if (mode === 'emi' && periodic != null) {
    const preview = Math.min(3, tenureMonths);
    return (
      <ol className="mt-6 space-y-0" aria-label="Illustrative EMI payment timeline">
        {Array.from({ length: preview }, (_, i) => (
          <li key={i} className="flex gap-3 border-l-2 border-[var(--gl-orange)]/40 py-2 pl-4">
            <div>
              <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-[var(--gl-muted)]">
                Month {i + 1}
              </p>
              <p className="text-base font-bold tabular-nums text-[var(--gl-navy)]">
                {formatInr(Math.round(periodic))}
              </p>
            </div>
          </li>
        ))}
        {tenureMonths > preview ? (
          <li className="border-l-2 border-[var(--gl-border)] py-2 pl-4 text-[0.875rem] text-[var(--gl-muted)]">
            … continuing scheduled EMIs
          </li>
        ) : null}
        <li className="border-l-2 border-[var(--gl-navy)] py-2 pl-4">
          <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-[var(--gl-muted)]">
            Maturity
          </p>
          <p className="text-base font-bold text-[var(--gl-navy)]">Final scheduled EMI</p>
        </li>
      </ol>
    );
  }

  if (mode === 'interest_only' && periodic != null) {
    return (
      <ol className="mt-6 space-y-0" aria-label="Illustrative periodic interest timeline">
        <li className="border-l-2 border-[var(--gl-orange)]/40 py-2 pl-4">
          <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-[var(--gl-muted)]">
            Each period
          </p>
          <p className="text-base font-bold tabular-nums text-[var(--gl-navy)]">
            Interest {formatInr(Math.round(periodic))}
          </p>
        </li>
        <li className="border-l-2 border-[var(--gl-navy)] py-2 pl-4">
          <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-[var(--gl-muted)]">
            Maturity
          </p>
          <p className="text-base font-bold tabular-nums text-[var(--gl-navy)]">
            Principal {formatInr(Math.round(principalAtEnd))}
          </p>
        </li>
      </ol>
    );
  }

  return (
    <ol className="mt-6 space-y-0" aria-label="Illustrative bullet-style repayment timeline">
      <li className="border-l-2 border-[var(--gl-border)] py-2 pl-4">
        <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-[var(--gl-muted)]">
          During tenure
        </p>
        <p className="text-[0.9375rem] text-[var(--gl-navy)]">
          Limited or no principal repayment in this educational model
        </p>
      </li>
      <li className="border-l-2 border-[var(--gl-navy)] py-2 pl-4">
        <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-[var(--gl-muted)]">
          Maturity
        </p>
        <p className="text-base font-bold tabular-nums text-[var(--gl-navy)]">
          Principal + applicable amount {formatInr(Math.round(principalAtEnd))}
          {periodic == null ? ' (+ accrued interest in total)' : ''}
        </p>
      </li>
    </ol>
  );
}

export function GoldLoanRepaymentCalculator() {
  const {
    requiredLoan,
    ratePercent,
    setRatePercent,
    tenureMonths,
    setTenureMonths,
    repaymentMode,
    setRepaymentMode,
  } = useGoldLoanDecision();

  const summary = useMemo(
    () =>
      estimateGoldRepayment({
        principal: requiredLoan,
        annualRatePercent: ratePercent,
        tenureMonths,
        mode: repaymentMode,
      }),
    [requiredLoan, ratePercent, tenureMonths, repaymentMode],
  );

  return (
    <section
      id="gl-repayment"
      aria-labelledby="gl-repayment-heading"
      className="full-bleed bg-[var(--gl-surface-1)]"
    >
      <div className="site-container gl-section px-4">
        <p className="gl-eyebrow">Repayment</p>
        <h2 id="gl-repayment-heading" className="gl-h2">
          How Could You Repay Your Gold Loan?
        </h2>
        <p className="gl-lede">
          Common repayment structures may include the options below. Availability varies by lender —
          only structures this calculator can model are shown.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <MoneyField
            label="Interest rate (% p.a.)"
            value={ratePercent}
            onChange={setRatePercent}
            step="0.1"
          />
          <MoneyField label="Tenure (months)" value={tenureMonths} onChange={setTenureMonths} />
          <fieldset className="text-sm font-semibold text-slate-700">
            <legend>Repayment method</legend>
            <div className="mt-1.5 flex flex-col gap-2">
              {(
                [
                  ['emi', 'EMI'],
                  ['interest_only', 'Periodic interest'],
                  ['bullet', 'Bullet-style'],
                ] as Array<[GoldRepaymentMode, string]>
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={repaymentMode === key}
                  onClick={() => setRepaymentMode(key)}
                  className={`min-h-11 rounded-[var(--gl-radius-md)] px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-orange)] ${
                    repaymentMode === key
                      ? 'bg-[var(--gl-navy)] text-white'
                      : 'bg-[var(--gl-surface-2)] text-[var(--gl-navy)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
        {summary ? (
          <>
            <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="gl-metric-label">Periodic Payment</dt>
                <dd className="gl-metric-value mt-1 text-xl">
                  {summary.periodicPayment != null
                    ? formatInr(Math.round(summary.periodicPayment))
                    : 'At maturity'}
                </dd>
              </div>
              <div>
                <dt className="gl-metric-label">Total Interest</dt>
                <dd className="gl-metric-value mt-1 text-xl">
                  {formatInr(Math.round(summary.totalInterest))}
                </dd>
              </div>
              <div>
                <dt className="gl-metric-label">Principal at End</dt>
                <dd className="gl-metric-value mt-1 text-xl">
                  {formatInr(Math.round(summary.principalAtEnd))}
                </dd>
              </div>
              <div>
                <dt className="gl-metric-label">Total Repayment</dt>
                <dd className="gl-metric-value mt-1 text-xl">
                  {formatInr(Math.round(summary.totalRepayment))}
                </dd>
              </div>
            </dl>
            <RepaymentTimeline
              mode={repaymentMode}
              periodic={summary.periodicPayment}
              principalAtEnd={summary.principalAtEnd}
              tenureMonths={tenureMonths}
            />
          </>
        ) : null}
        <p className="mt-4 text-[0.875rem] leading-relaxed text-[var(--gl-muted)]">
          {summary?.notes}
        </p>
      </div>
    </section>
  );
}

export function GoldLoanRepaymentCompare() {
  const { requiredLoan, ratePercent, tenureMonths } = useGoldLoanDecision();
  const modes: GoldRepaymentMode[] = ['emi', 'interest_only', 'bullet'];
  const byMode = Object.fromEntries(
    modes.map((mode) => [
      mode,
      estimateGoldRepayment({
        principal: requiredLoan,
        annualRatePercent: ratePercent,
        tenureMonths,
        mode,
      }),
    ]),
  ) as Record<GoldRepaymentMode, ReturnType<typeof estimateGoldRepayment>>;

  const labels: Record<GoldRepaymentMode, string> = {
    emi: 'EMI',
    interest_only: 'Periodic Interest',
    bullet: 'Bullet-style',
  };

  const compareRows: Array<{
    factor: string;
    values: Record<GoldRepaymentMode, string>;
  }> = [
    {
      factor: 'Regular cash outflow',
      values: {
        emi:
          byMode.emi?.periodicPayment != null
            ? (formatInr(Math.round(byMode.emi.periodicPayment)) ?? '—')
            : '—',
        interest_only:
          byMode.interest_only?.periodicPayment != null
            ? (formatInr(Math.round(byMode.interest_only.periodicPayment)) ?? '—')
            : '—',
        bullet: 'Low until end',
      },
    },
    {
      factor: 'Principal timing',
      values: {
        emi: 'Across tenure',
        interest_only: 'Mostly at maturity',
        bullet: 'At maturity',
      },
    },
    {
      factor: 'Interest timing',
      values: {
        emi: 'Within each EMI',
        interest_only: 'Periodic interest',
        bullet: 'Accrues to maturity (model)',
      },
    },
    {
      factor: 'Maturity obligation',
      values: {
        emi: 'Final EMI',
        interest_only:
          byMode.interest_only != null
            ? (formatInr(Math.round(byMode.interest_only.principalAtEnd)) ?? '—')
            : '—',
        bullet:
          byMode.bullet != null
            ? (formatInr(Math.round(byMode.bullet.totalRepayment)) ?? '—')
            : '—',
      },
    },
    {
      factor: 'Cash-flow predictability',
      values: {
        emi: 'High (level instalments)',
        interest_only: 'Moderate (end spike)',
        bullet: 'Low interim / high maturity',
      },
    },
  ];

  return (
    <section
      id="gl-repayment-compare"
      aria-labelledby="gl-repayment-compare-heading"
      className="full-bleed bg-[var(--gl-surface-4)]"
    >
      <div className="site-container gl-section px-4">
        <p className="gl-eyebrow">Compare Methods</p>
        <h2 id="gl-repayment-compare-heading" className="gl-h2">
          Compare Gold Loan Repayment Methods
        </h2>
        <p className="gl-lede">
          Educational comparison for your current planner inputs — not a recommendation ranking.
        </p>

        {/* Desktop table */}
        <div className="mt-8 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[40rem] text-left text-[0.9375rem]">
            <thead>
              <tr className="border-b border-[var(--gl-border)]">
                <th className="py-3 pr-3 font-semibold text-[var(--gl-muted)]">Factor</th>
                {modes.map((m) => (
                  <th key={m} className="py-3 pr-3 font-bold text-[var(--gl-navy)]">
                    {labels[m]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareRows.map((row) => (
                <tr key={row.factor} className="border-b border-[var(--gl-border)]/70">
                  <td className="py-3 pr-3 font-semibold text-[var(--gl-navy)]">{row.factor}</td>
                  {modes.map((m) => (
                    <td key={m} className="py-3 pr-3 text-slate-600">
                      {row.values[m]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked */}
        <ul className="mt-8 space-y-6 md:hidden" aria-label="Repayment method comparison">
          {modes.map((m) => (
            <li key={m} className="border-t border-[var(--gl-border)] pt-4">
              <h3 className="text-base font-bold text-[var(--gl-navy)]">{labels[m]}</h3>
              <dl className="mt-3 space-y-2">
                {compareRows.map((row) => (
                  <div key={row.factor}>
                    <dt className="text-[0.8125rem] font-semibold text-[var(--gl-muted)]">
                      {row.factor}
                    </dt>
                    <dd className="text-[0.9375rem] text-[var(--gl-navy)]">{row.values[m]}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function GoldLoanTotalCost() {
  const { requiredLoan, ratePercent, tenureMonths, repaymentMode } = useGoldLoanDecision();
  const [knownFeesInput, setKnownFeesInput] = useState('');
  const knownFees = knownFeesInput.trim() === '' ? null : Math.max(0, Number(knownFeesInput) || 0);
  const total = useMemo(
    () =>
      estimateGoldTotalCost({
        principal: requiredLoan,
        annualRatePercent: ratePercent,
        tenureMonths,
        mode: repaymentMode,
        knownFees,
      }),
    [requiredLoan, ratePercent, tenureMonths, repaymentMode, knownFees],
  );

  return (
    <section
      id="gl-total-cost"
      aria-labelledby="gl-total-cost-heading"
      className="full-bleed bg-[var(--gl-surface-1)]"
    >
      <div className="site-container gl-section px-4">
        <p className="gl-eyebrow">Total Cost</p>
        <h2 id="gl-total-cost-heading" className="gl-h2">
          Look Beyond the Interest Rate
        </h2>
        <p className="gl-lede">
          Interest plus known fees you enter. Leave fees blank when unknown — blank does not mean
          “no fee”.
        </p>
        <div className="mt-6 max-w-xs">
          <label className="block text-sm font-semibold text-slate-700">
            Known fees (₹) — optional
            <input
              type="number"
              min={0}
              value={knownFeesInput}
              placeholder="Leave blank if unknown"
              onChange={(e) => setKnownFeesInput(e.target.value)}
              className="mt-1.5 min-h-11 w-full rounded-[var(--gl-radius-md)] border border-[var(--gl-border)] bg-white px-3 text-[0.9375rem] font-semibold tabular-nums text-[var(--gl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-orange)]/30"
            />
          </label>
        </div>
        {total ? (
          <dl className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="gl-metric-label">Principal</dt>
              <dd className="gl-metric-value mt-1.5 text-xl">
                {formatInr(Math.round(total.principal))}
              </dd>
            </div>
            <div>
              <dt className="gl-metric-label">Interest</dt>
              <dd className="gl-metric-value mt-1.5 text-xl">
                {formatInr(Math.round(total.totalInterest))}
              </dd>
            </div>
            <div>
              <dt className="gl-metric-label">Known Fees</dt>
              <dd className="gl-metric-value mt-1.5 text-xl">
                {total.feesKnown && total.knownFees != null
                  ? formatInr(Math.round(total.knownFees))
                  : 'Not currently available'}
              </dd>
            </div>
            <div>
              <dt className="gl-metric-label">Estimated Total Cost</dt>
              <dd className="gl-metric-value mt-1.5 text-xl">
                {total.feesKnown
                  ? formatInr(Math.round(total.totalFinancingCost))
                  : `${formatInr(Math.round(total.totalInterest))} + fees N/A`}
              </dd>
            </div>
          </dl>
        ) : null}
      </div>
    </section>
  );
}

export function GoldLoanRiskExplorer() {
  const { valuation, requiredLoan } = useGoldLoanDecision();
  const [customMult, setCustomMult] = useState<number | ''>('');
  const rows = useMemo(() => {
    if (!valuation) return [];
    return stressGoldValueLtv({
      currentGoldValue: valuation.estimatedGoldValue,
      outstandingLoan: requiredLoan,
      customMultiplier: customMult === '' ? null : Number(customMult),
    });
  }, [valuation, requiredLoan, customMult]);

  return (
    <section
      id="gl-risk"
      aria-labelledby="gl-risk-heading"
      className="full-bleed bg-[var(--gl-surface-4)]"
    >
      <div className="site-container gl-section px-4">
        <p className="gl-eyebrow">Risk Explorer</p>
        <h2 id="gl-risk-heading" className="gl-h2">
          Understand Gold Value and LTV Risk
        </h2>
        <p className="gl-lede">
          Illustrative gold value scenarios — not forecasts. Actual lender actions depend on
          contract terms, applicable law/regulation and lender policy.
        </p>
        <div className="mt-5 max-w-xs">
          <MoneyField
            label="Custom value multiplier (e.g. 0.85)"
            value={customMult === '' ? 0 : customMult}
            onChange={(n) => setCustomMult(n)}
            step="0.01"
            hint="Optional"
          />
        </div>
        <ul
          className="mt-8 divide-y divide-[var(--gl-border)]"
          aria-label="Illustrative gold value scenarios"
        >
          {rows.map((r) => (
            <li key={r.id} className="py-4 first:pt-0">
              <h3 className="text-base font-bold text-[var(--gl-navy)]">{r.label}</h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-[0.9375rem] sm:grid-cols-3">
                <div>
                  <dt className="text-[0.8125rem] font-semibold text-[var(--gl-muted)]">
                    Illustrative Gold Value
                  </dt>
                  <dd className="font-bold tabular-nums text-[var(--gl-navy)]">
                    {formatInr(Math.round(r.illustrativeGoldValue))}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.8125rem] font-semibold text-[var(--gl-muted)]">
                    Outstanding Loan
                  </dt>
                  <dd className="font-bold tabular-nums text-[var(--gl-navy)]">
                    {formatInr(Math.round(r.outstandingLoan))}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.8125rem] font-semibold text-[var(--gl-muted)]">
                    Resulting LTV
                  </dt>
                  <dd className="text-lg font-extrabold tabular-nums text-[var(--gl-navy)]">
                    {r.resultingLtvPercent != null ? `${r.resultingLtvPercent.toFixed(1)}%` : '—'}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[0.875rem] leading-relaxed text-[var(--gl-muted)]">
          Lower LTV ←————————→ Higher LTV. Do not treat these scenarios as predictions of gold price
          movement or auction outcomes.
        </p>
      </div>
    </section>
  );
}

const PLEDGE_ICONS = ['◆', '⚖', '◈', '▣', '▤', '▣', '◉', '✓', '↩'] as const;

export function GoldLoanPledgeLifecycle() {
  return (
    <section
      id="gl-pledge"
      aria-labelledby="gl-pledge-heading"
      className="full-bleed bg-[var(--gl-surface-1)]"
    >
      <div className="site-container gl-section px-4">
        <p className="gl-eyebrow">Pledged Gold</p>
        <h2 id="gl-pledge-heading" className="gl-h2">
          What Happens to Your Gold?
        </h2>
        <p className="gl-lede">
          Trust-oriented lifecycle. Exact steps and timelines depend on the lender process.
        </p>

        {/* Desktop horizontal process */}
        <ol
          className="mt-8 hidden gap-0 lg:grid lg:grid-cols-9"
          aria-label="What happens to pledged gold"
        >
          {GOLD_LOAN_PLEDGE_STEPS.map((step, i) => (
            <li key={step} className="relative px-1 text-center">
              {i < GOLD_LOAN_PLEDGE_STEPS.length - 1 ? (
                <span
                  className="absolute left-[58%] top-4 right-0 h-px bg-[var(--gl-border)]"
                  aria-hidden
                />
              ) : null}
              <span
                className="relative z-[1] mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-[var(--gl-surface-2)] text-sm text-[var(--gl-navy)] ring-1 ring-[var(--gl-border)]"
                aria-hidden
              >
                {PLEDGE_ICONS[i] ?? '·'}
              </span>
              <p className="mt-2 text-[0.8125rem] font-bold leading-snug text-[var(--gl-navy)]">
                {step}
              </p>
            </li>
          ))}
        </ol>

        {/* Mobile / tablet vertical timeline */}
        <ol className="mt-8 space-y-0 lg:hidden" aria-label="What happens to pledged gold">
          {GOLD_LOAN_PLEDGE_STEPS.map((step, i) => (
            <li key={step} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className="flex h-3 w-3 shrink-0 rounded-full bg-[var(--gl-navy)]"
                  aria-hidden
                />
                {i < GOLD_LOAN_PLEDGE_STEPS.length - 1 ? (
                  <span className="w-px flex-1 bg-[var(--gl-border)]" aria-hidden />
                ) : null}
              </div>
              <p className="pb-5 text-[0.9375rem] font-bold text-[var(--gl-navy)]">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function GoldLoanMissedPayments() {
  const steps = [
    'Payment Due',
    'Overdue',
    'Communication',
    'Notice / Contractual Process',
    'Recovery Process',
    'Possible Auction Where Applicable',
  ];
  return (
    <section
      id="gl-missed-payments"
      aria-labelledby="gl-missed-payments-heading"
      className="full-bleed bg-[var(--gl-surface-4)]"
    >
      <div className="site-container gl-section px-4">
        <p className="gl-eyebrow">Missed Payments</p>
        <h2 id="gl-missed-payments-heading" className="gl-h2">
          What If You Miss a Payment?
        </h2>
        <p className="gl-lede">Neutral educational process — not fear-based warning copy.</p>
        <ol className="mt-8 max-w-lg space-y-0" aria-label="Missed payment process">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className="flex h-3 w-3 shrink-0 rounded-full bg-[var(--gl-navy)]/70"
                  aria-hidden
                />
                {i < steps.length - 1 ? (
                  <span className="w-px flex-1 bg-[var(--gl-border)]" aria-hidden />
                ) : null}
              </div>
              <p className="pb-5 text-[0.9375rem] font-semibold text-[var(--gl-navy)]">{step}</p>
            </li>
          ))}
        </ol>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-[var(--gl-muted)]">
          A missed payment does not mean pledged gold is necessarily auctioned immediately.
          Timelines, notices, charges and recovery procedures depend on the loan agreement, lender
          policy and applicable requirements.
        </p>
        <a
          href="#gl-regulatory"
          className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--gl-navy)] underline-offset-2 hover:underline"
        >
          Official regulatory information →
        </a>
      </div>
    </section>
  );
}

export function GoldLoanAuctionAwareness() {
  const blocks = [
    {
      title: 'Before Possible Auction',
      body: 'Communication / notice process as described in the agreement and applicable requirements.',
    },
    {
      title: 'Loan Agreement',
      body: 'Relevant contractual conditions govern timelines, charges and recovery steps.',
    },
    {
      title: 'Auction Process',
      body: 'Where applicable, formal lender/regulatory procedure applies — not an automatic outcome of any overdue day.',
    },
    {
      title: 'Proceeds',
      body: 'How proceeds may be applied toward outstanding dues depends on the agreement and applicable rules.',
    },
    {
      title: 'Surplus',
      body: 'Potential surplus treatment where applicable is contract- and process-dependent.',
    },
    {
      title: 'Official Information',
      body: 'Verify current requirements using official sources — Varnarc is not a regulator or lender.',
    },
  ];
  return (
    <section
      id="gl-auction"
      aria-labelledby="gl-auction-heading"
      className="full-bleed bg-[var(--gl-surface-1)]"
    >
      <div className="site-container gl-section px-4">
        <p className="gl-eyebrow">Auction Awareness</p>
        <h2 id="gl-auction-heading" className="gl-h2">
          Understand Gold Loan Auction Risk
        </h2>
        <p className="gl-lede">High-level education only — not legal advice or guarantees.</p>
        <dl className="mt-8 grid gap-6 sm:grid-cols-2">
          {blocks.map((b) => (
            <div key={b.title} className="border-t border-[var(--gl-border)] pt-4">
              <dt className="text-sm font-bold uppercase tracking-wide text-[var(--gl-navy)]">
                {b.title}
              </dt>
              <dd className="mt-2 text-[0.9375rem] leading-relaxed text-slate-600">{b.body}</dd>
            </div>
          ))}
        </dl>
        <a
          href="#gl-regulatory"
          className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--gl-navy)] underline-offset-2 hover:underline"
        >
          Official regulatory information →
        </a>
      </div>
    </section>
  );
}

export function GoldLoanRelease() {
  const { requiredLoan } = useGoldLoanDecision();
  const steps = [
    { label: 'Outstanding Balance', value: formatInr(Math.round(requiredLoan)) },
    { label: 'Repayment Completed', value: null },
    { label: 'Loan Closed', value: null },
    { label: 'Release Process', value: null },
    { label: 'Verification', value: null },
    { label: 'Gold Returned', value: null },
  ];

  return (
    <section
      id="gl-release"
      aria-labelledby="gl-release-heading"
      className="full-bleed bg-[var(--gl-surface-3)]"
    >
      <div className="site-container gl-section px-4">
        <p className="gl-eyebrow">Gold Release</p>
        <h2 id="gl-release-heading" className="gl-h2">
          How Do You Get Your Gold Back?
        </h2>
        <p className="gl-lede">
          Reassuring but factual process. No universal same-day release is claimed.
        </p>

        {requiredLoan > 0 ? (
          <p
            className="mt-5 max-w-xl border-l-4 border-[var(--gl-navy)]/30 bg-[var(--gl-surface-2)] px-4 py-3 text-[0.9375rem] text-[var(--gl-navy)]"
            role="status"
          >
            Outstanding amount remains ({formatInr(Math.round(requiredLoan))} in your planner) until
            repaid and closed with the lender.
          </p>
        ) : null}

        <ol className="mt-8 max-w-md space-y-0" aria-label="Gold release process">
          {steps.map((step, i) => (
            <li key={step.label} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    i === 0
                      ? 'bg-[var(--gl-orange-soft)] text-[var(--gl-orange)] ring-1 ring-[var(--gl-orange)]/30'
                      : i === steps.length - 1
                        ? 'bg-[var(--gl-navy)] text-white'
                        : 'bg-[var(--gl-surface-2)] text-[var(--gl-navy)] ring-1 ring-[var(--gl-border)]'
                  }`}
                  aria-hidden
                >
                  {i === steps.length - 1 ? '✓' : i + 1}
                </span>
                {i < steps.length - 1 ? (
                  <span className="w-px flex-1 bg-[var(--gl-border)]" aria-hidden />
                ) : null}
              </div>
              <div className="pb-5 pt-1">
                <p className="text-[0.9375rem] font-bold text-[var(--gl-navy)]">{step.label}</p>
                {step.value ? (
                  <p className="mt-0.5 text-lg font-extrabold tabular-nums text-[var(--gl-navy)]">
                    {step.value}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-[var(--gl-muted)]">
          Borrowers may wish to compare returned items with relevant pledge/receipt documentation
          before completing the collection process.
        </p>
      </div>
    </section>
  );
}

export function GoldLoanEligibility() {
  const profiles = [
    { title: 'Applicant / KYC', items: ['Identity', 'Address', 'Photograph if applicable'] },
    { title: 'Gold Ownership', items: ['Pledge requirements', 'Declarations'] },
    { title: 'Gold Type & Purity', items: ['Jewellery type', 'Karat / hallmarks'] },
    { title: 'Eligible Weight', items: ['Gross vs eligible metal', 'Stone adjustments'] },
    { title: 'Borrowing Need', items: ['Required amount', 'Tenure'] },
    { title: 'Lender Policy', items: ['Product limits', 'Appraisal method'] },
  ];
  return (
    <section
      id="gl-eligibility"
      aria-labelledby="gl-eligibility-heading"
      className="full-bleed bg-[var(--gl-surface-1)]"
    >
      <div className="site-container gl-section px-4">
        <p className="gl-eyebrow">Eligibility</p>
        <h2 id="gl-eligibility-heading" className="gl-h2">
          Gold Loan Profile Factors
        </h2>
        <p className="gl-lede">
          Soft planning states only: Potential Match, May Be Relevant, More Information Required —
          never Approved or Guaranteed Eligible.
        </p>
        <div className="mt-8 mx-auto max-w-sm rounded-[var(--gl-radius-md)] bg-[var(--gl-navy)] px-4 py-4 text-center text-sm font-bold text-white">
          Gold Loan Profile
        </div>
        <ul className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <li key={p.title} className="border-t border-[var(--gl-border)] pt-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--gl-navy)]">
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
          className="mt-8 inline-flex min-h-11 items-center rounded-[var(--gl-radius-md)] bg-[var(--gl-navy)] px-4 text-sm font-semibold !text-white"
        >
          Check Loan Eligibility →
        </Link>
      </div>
    </section>
  );
}

export function GoldLoanDocuments() {
  const groups = [
    { title: 'Identity', items: ['Government ID as required by lender'] },
    { title: 'Address', items: ['Address proof commonly requested'] },
    { title: 'KYC', items: ['KYC documentation under lender process'] },
    { title: 'Photograph', items: ['Where applicable'] },
    { title: 'Loan / Pledge Documentation', items: ['Pledge receipt', 'Loan agreement copies'] },
    { title: 'Additional', items: ['Lender-specific documents as applicable'] },
  ];
  return (
    <section
      id="gl-documents"
      aria-labelledby="gl-documents-heading"
      className="full-bleed bg-[var(--gl-surface-4)]"
    >
      <div className="site-container gl-section px-4">
        <p className="gl-eyebrow">Documents</p>
        <h2 id="gl-documents-heading" className="gl-h2">
          Documents Commonly Requested
        </h2>
        <p className="gl-lede">
          Gold Loans may rely heavily on pledged collateral, but KYC and other lender requirements
          still apply. Exact lists vary.
        </p>
        <div className="mt-8 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <article key={g.title} className="border-t border-[var(--gl-border)] pt-3">
              <h3 className="text-sm font-bold text-[var(--gl-navy)]">{g.title}</h3>
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

export function GoldLoanVsPersonal() {
  const rows = [
    ['Security', 'Pledged gold', 'Typically unsecured'],
    ['Underwriting basis', 'Collateral + KYC (and product rules)', 'Income / credit profile'],
    ['Collateral risk', 'Gold may be at risk if dues unpaid', 'No jewellery pledge'],
    ['Documentation', 'KYC + pledge docs', 'KYC + income docs as required'],
    ['Loan amount basis', 'Valued gold × applicable LTV', 'Income / policy limits'],
    ['Non-payment effect', 'Contractual recovery may involve gold', 'Credit / recovery process'],
  ];
  return (
    <section
      id="gl-vs-personal"
      aria-labelledby="gl-vs-personal-heading"
      className="full-bleed bg-[var(--gl-surface-1)]"
    >
      <div className="site-container gl-section px-4">
        <p className="gl-eyebrow">Comparison</p>
        <h2 id="gl-vs-personal-heading" className="gl-h2">
          Gold Loan or Personal Loan?
        </h2>
        <p className="gl-lede">Neutral comparison — neither option is universally better.</p>

        <div className="mt-8 hidden md:block">
          <table className="w-full text-left text-[0.9375rem]">
            <thead>
              <tr className="border-b border-[var(--gl-border)] text-[var(--gl-muted)]">
                <th className="py-2 pr-3 font-semibold">Factor</th>
                <th className="py-2 pr-3 font-semibold">Gold Loan</th>
                <th className="py-2 font-semibold">Personal Loan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([factor, gold, pl]) => (
                <tr key={factor} className="border-b border-[var(--gl-border)]/70">
                  <td className="py-3 pr-3 font-semibold text-[var(--gl-navy)]">{factor}</td>
                  <td className="py-3 pr-3 text-slate-600">{gold}</td>
                  <td className="py-3 text-slate-600">{pl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="mt-8 space-y-5 md:hidden" aria-label="Gold loan versus personal loan">
          {rows.map(([factor, gold, pl]) => (
            <li key={factor} className="border-t border-[var(--gl-border)] pt-3">
              <p className="text-sm font-bold text-[var(--gl-navy)]">{factor}</p>
              <p className="mt-1.5 text-[0.9375rem] text-slate-600">
                <span className="font-semibold text-[var(--gl-navy)]">Gold: </span>
                {gold}
              </p>
              <p className="mt-1 text-[0.9375rem] text-slate-600">
                <span className="font-semibold text-[var(--gl-navy)]">Personal: </span>
                {pl}
              </p>
            </li>
          ))}
        </ul>

        <Link
          href="/finance/loans/personal-loan"
          className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--gl-navy)] underline-offset-2 hover:underline"
        >
          Compare Borrowing Options →
        </Link>
      </div>
    </section>
  );
}

export function GoldLoanApplicationJourney() {
  return (
    <section
      id="gl-application"
      aria-labelledby="gl-application-heading"
      className="full-bleed bg-[var(--gl-surface-4)]"
    >
      <div className="site-container gl-section px-4">
        <h2 id="gl-application-heading" className="gl-h2">
          How a Gold Loan Typically Works
        </h2>
        <p className="gl-lede">
          From requirement through release. Do not promise instant disbursement.
        </p>
        <ol className="mt-8 space-y-0" aria-label="Gold loan application journey">
          {GOLD_LOAN_APPLICATION_STEPS.map((step, i) => (
            <li key={step} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--gl-surface-2)] text-xs font-bold text-[var(--gl-navy)] ring-1 ring-[var(--gl-border)]">
                  {i + 1}
                </span>
                {i < GOLD_LOAN_APPLICATION_STEPS.length - 1 ? (
                  <span className="w-px flex-1 bg-[var(--gl-border)]" aria-hidden />
                ) : null}
              </div>
              <p className="pb-4 pt-1 text-[0.9375rem] font-bold text-[var(--gl-navy)]">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
