'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  calculatePrincipalFromEmi,
  estimateAffordableEmi,
  ILLUSTRATIVE_FOIR_RATIO,
  monthsFromTenure,
} from '@/lib/emi';
import { calculatorHref } from '@/lib/finance-routes';
import { usePersonalLoanDecision } from '@/components/loans/personal-loan-decision-context';

const fieldClass =
  'mt-1.5 min-h-11 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-sm text-slate-900 transition focus-visible:border-[#f97316]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]/30';

function formatInr(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function parseNonNeg(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/**
 * Compact affordability estimate for Personal Loan decision page.
 * Uses an illustrative FOIR — not lender eligibility.
 */
export function PersonalLoanAffordabilityPanel({ compact = false }: { compact?: boolean }) {
  const { tenureYears, ratePercent } = usePersonalLoanDecision();
  const [income, setIncome] = useState('75000');
  const [existingEmis, setExistingEmis] = useState('15000');
  const [localTenureYears, setLocalTenureYears] = useState(String(tenureYears));
  const [rate, setRate] = useState(String(ratePercent));

  const estimate = useMemo(() => {
    const monthlyIncome = parseNonNeg(income);
    const emis = parseNonNeg(existingEmis) ?? 0;
    const years = parseNonNeg(localTenureYears);
    const annualRate = parseNonNeg(rate);
    if (monthlyIncome == null || years == null || annualRate == null) return null;

    const affordableEmi = estimateAffordableEmi({
      monthlyIncome,
      existingEmis: emis,
      foirRatio: ILLUSTRATIVE_FOIR_RATIO,
    });
    if (affordableEmi == null) return null;

    const tenureMonths = monthsFromTenure(years, 'years');
    const indicativeAmount = calculatePrincipalFromEmi({
      monthlyEmi: affordableEmi,
      annualRatePercent: annualRate,
      tenureMonths,
    });

    return { affordableEmi, indicativeAmount, tenureMonths };
  }, [income, existingEmis, localTenureYears, rate]);

  return (
    <div className={compact ? 'space-y-3' : undefined}>
      {!compact ? (
        <div className="mb-4">
          <h3 className="text-lg font-extrabold text-[#0b1f3a]">Estimate affordability</h3>
          <p className="mt-1 text-sm text-slate-600">
            Indicative estimate only. Lenders use their own eligibility and underwriting criteria.
          </p>
        </div>
      ) : (
        <p className="text-xs leading-relaxed text-slate-500">
          Indicative estimate only. Lenders use their own eligibility and underwriting criteria. Do
          not treat this as approval for a specific amount.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="grid gap-3 rounded-2xl bg-[#f8fafc] p-4 ring-1 ring-slate-200/80 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-700">
            Monthly income
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-700">
            Existing monthly EMIs
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={500}
              value={existingEmis}
              onChange={(e) => setExistingEmis(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-700">
            Desired tenure (years)
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={7}
              step={1}
              value={localTenureYears}
              onChange={(e) => setLocalTenureYears(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-700">
            Expected interest rate (% p.a.)
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
        </div>

        <div className="rounded-2xl bg-[#0b1f3a] p-5 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#fdba74]">
            Indicative result
          </p>
          {estimate ? (
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-xs text-white/70">Indicative affordable EMI</dt>
                <dd className="mt-1 text-2xl font-extrabold tabular-nums">
                  {formatInr(estimate.affordableEmi)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-white/70">Indicative borrowing range (up to)</dt>
                <dd className="mt-1 text-2xl font-extrabold tabular-nums">
                  {estimate.indicativeAmount != null ? formatInr(estimate.indicativeAmount) : '—'}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-white/80">Enter valid inputs to see an estimate.</p>
          )}
          <p className="mt-4 text-xs leading-relaxed text-white/65">
            Uses an illustrative {(ILLUSTRATIVE_FOIR_RATIO * 100).toFixed(0)}% income-to-EMI comfort
            ratio for demonstration. Not a lender eligibility result.
          </p>
          <Link
            href={calculatorHref('loan-eligibility')}
            className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-[#fdba74] transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]"
          >
            Open Personal Loan Eligibility Calculator →
          </Link>
        </div>
      </div>
    </div>
  );
}

/** @deprecated Prefer PersonalLoanAffordabilityPanel nested in the snapshot. */
export function PersonalLoanAffordability() {
  return (
    <section
      id="personal-loan-affordability"
      aria-labelledby="personal-loan-affordability-heading"
      className="full-bleed bg-white"
    >
      <div className="site-container px-4 py-10 sm:py-12">
        <h2
          id="personal-loan-affordability-heading"
          className="text-xl font-extrabold tracking-tight text-[#0b1f3a]"
        >
          How much personal loan can I afford?
        </h2>
        <div className="mt-5">
          <PersonalLoanAffordabilityPanel />
        </div>
      </div>
    </section>
  );
}
