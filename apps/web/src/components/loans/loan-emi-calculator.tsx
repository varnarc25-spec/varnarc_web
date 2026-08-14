'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  calculateEmi,
  EMI_LIMITS,
  EMI_VALIDATION_MESSAGES,
  monthsFromTenure,
  validateEmiInputs,
  type EmiValidationError,
} from '@/lib/emi';
import { parseEmiQuery, serializeEmiQuery } from '@/lib/emi-query';
import { calculatorHref } from '@/lib/finance-routes';
import { ContextualLinkList } from '@/components/loans/contextual-link-list';
import { contextualLinksForSection } from '@/lib/loan-contextual-links';

const DEFAULT_AMOUNT = 5_00_000;
const DEFAULT_RATE = 10;
const DEFAULT_TENURE_YEARS = 5;

function formatInr(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function parsePositive(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return n;
}

function clampPrefillAmount(n: number | undefined): number {
  if (n == null || !Number.isFinite(n) || n <= 0) return DEFAULT_AMOUNT;
  return Math.min(Math.max(Math.round(n), EMI_LIMITS.amountMin), EMI_LIMITS.amountMax);
}

function clampPrefillMonths(n: number | undefined): { value: number; unit: 'months' | 'years' } {
  if (n == null || !Number.isFinite(n) || n <= 0) {
    return { value: DEFAULT_TENURE_YEARS, unit: 'years' };
  }
  const months = Math.min(
    Math.max(Math.round(n), EMI_LIMITS.tenureMonthsMin),
    EMI_LIMITS.tenureMonthsMax,
  );
  if (months >= 12 && months % 12 === 0) {
    return { value: months / 12, unit: 'years' };
  }
  return { value: months, unit: 'months' };
}

function PrincipalInterestDonut({ principal, interest }: { principal: number; interest: number }) {
  const total = principal + interest || 1;
  const principalPct = (principal / total) * 100;
  const interestPct = (interest / total) * 100;
  const principalDeg = (principal / total) * 360;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5">
      <div
        className="relative h-28 w-28 shrink-0 rounded-full"
        style={{
          background: `conic-gradient(#0b1f3a 0deg ${principalDeg}deg, #f97316 ${principalDeg}deg 360deg)`,
        }}
        role="img"
        aria-label={`Principal ${principalPct.toFixed(0)} percent, interest ${interestPct.toFixed(0)} percent of total repayment`}
      >
        <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white text-center">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
            Split
          </span>
        </div>
      </div>
      <ul className="w-full space-y-2 text-xs">
        <li className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 font-medium text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0b1f3a]" aria-hidden />
            Principal
          </span>
          <span className="font-semibold tabular-nums text-[#0b1f3a]">
            {formatInr(principal)}
            <span className="ml-1 font-normal text-slate-500">({principalPct.toFixed(0)}%)</span>
          </span>
        </li>
        <li className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 font-medium text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-[#f97316]" aria-hidden />
            Interest
          </span>
          <span className="font-semibold tabular-nums text-[#0b1f3a]">
            {formatInr(interest)}
            <span className="ml-1 font-normal text-slate-500">({interestPct.toFixed(0)}%)</span>
          </span>
        </li>
        {/* Accessible stacked bar fallback */}
        <li className="pt-1" aria-hidden>
          <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="bg-[#0b1f3a]" style={{ width: `${principalPct}%` }} />
            <div className="bg-[#f97316]" style={{ width: `${interestPct}%` }} />
          </div>
        </li>
      </ul>
    </div>
  );
}

export function LoanEmiCalculator({
  initialAmount,
  initialRate,
  initialTenure,
  initialTenureUnit,
  initialTenureMonths,
  title = 'Loan EMI Calculator',
  eyebrow = 'Estimate repayment',
  description = 'Estimate monthly repayment before you shortlist lenders. Defaults are for illustration only.',
  amountPresets,
}: {
  initialAmount?: number;
  initialRate?: number;
  initialTenure?: number;
  initialTenureUnit?: 'months' | 'years';
  /** @deprecated Prefer initialTenure + initialTenureUnit */
  initialTenureMonths?: number;
  title?: string;
  eyebrow?: string;
  description?: string;
  amountPresets?: ReadonlyArray<{ label: string; amount: number }>;
}) {
  const searchParams = useSearchParams();
  const parsedUrl = parseEmiQuery(searchParams);

  const legacyMonths =
    initialTenureMonths != null && Number.isFinite(initialTenureMonths)
      ? clampPrefillMonths(initialTenureMonths)
      : null;

  const prefillAmount = clampPrefillAmount(
    initialAmount ?? (!parsedUrl.usedDefaults.amount ? parsedUrl.amount : undefined),
  );
  const prefillRate =
    initialRate != null && Number.isFinite(initialRate)
      ? initialRate
      : !parsedUrl.usedDefaults.rate
        ? parsedUrl.rate
        : DEFAULT_RATE;
  const prefillTenure =
    legacyMonths ??
    (initialTenure != null
      ? {
          value: initialTenure,
          unit: (initialTenureUnit ?? 'years') as 'months' | 'years',
        }
      : !parsedUrl.usedDefaults.tenure
        ? { value: parsedUrl.tenure, unit: parsedUrl.tenureUnit }
        : { value: DEFAULT_TENURE_YEARS, unit: 'years' as const });

  const [amount, setAmount] = useState(String(prefillAmount));
  const [rate, setRate] = useState(String(prefillRate));
  const [tenureValue, setTenureValue] = useState(String(prefillTenure.value));
  const [tenureUnit, setTenureUnit] = useState<'months' | 'years'>(prefillTenure.unit);

  useEffect(() => {
    setAmount(String(prefillAmount));
    setRate(String(prefillRate));
    setTenureValue(String(prefillTenure.value));
    setTenureUnit(prefillTenure.unit);
    // Prefill only when URL / server props change.
  }, [
    initialAmount,
    initialRate,
    initialTenure,
    initialTenureUnit,
    initialTenureMonths,
    searchParams.toString(),
  ]);

  const parsed = useMemo(() => {
    const principal = parsePositive(amount);
    const annualRatePercent = parsePositive(rate);
    const tenureRaw = parsePositive(tenureValue);
    const tenureMonths = tenureRaw == null ? 0 : monthsFromTenure(tenureRaw, tenureUnit);

    return {
      principal: principal ?? NaN,
      annualRatePercent: annualRatePercent ?? NaN,
      tenureMonths,
    };
  }, [amount, rate, tenureValue, tenureUnit]);

  const validationError: EmiValidationError | null = validateEmiInputs(parsed);
  const result = validationError ? null : calculateEmi(parsed);

  const productSlug = parsedUrl.product;
  const productNotice = productSlug
    ? `Illustrative calculation using ${productSlug
        .split('-')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ')}'s displayed starting rate. Actual rates may differ.`
    : null;

  const fullCalcHref = useMemo(() => {
    const tenureRaw = parsePositive(tenureValue);
    const qs = serializeEmiQuery({
      amount:
        Number.isFinite(parsed.principal) && parsed.principal > 0 ? parsed.principal : undefined,
      rate:
        Number.isFinite(parsed.annualRatePercent) && parsed.annualRatePercent >= 0
          ? parsed.annualRatePercent
          : undefined,
      tenure: tenureRaw ?? undefined,
      tenureUnit,
      product: productSlug ?? undefined,
      lender: parsedUrl.lender ?? undefined,
      category: parsedUrl.category ?? undefined,
    }).toString();
    const base = calculatorHref('emi');
    return qs ? `${base}?${qs}` : base;
  }, [parsed, tenureValue, tenureUnit, productSlug, parsedUrl.lender, parsedUrl.category]);

  const related = contextualLinksForSection('emi');

  const inputClass =
    'mt-1.5 min-h-11 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-sm text-slate-900 transition focus-visible:border-[#f97316]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]/30';

  return (
    <section
      aria-labelledby="loan-emi-calculator-heading"
      className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/80"
    >
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#f97316]">
              {eyebrow}
            </p>
            <h2
              id="loan-emi-calculator-heading"
              className="mt-1 text-xl font-extrabold tracking-tight text-[#0b1f3a] sm:text-2xl"
            >
              {title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{description}</p>
            {productNotice ? (
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{productNotice}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
          <div className="space-y-3.5 rounded-2xl bg-[#f8fafc] p-4 sm:p-5">
            {amountPresets?.length ? (
              <div>
                <p className="text-xs font-semibold text-slate-700">Quick amounts</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {amountPresets.map((preset) => (
                    <button
                      key={preset.amount}
                      type="button"
                      onClick={() => setAmount(String(preset.amount))}
                      className="inline-flex min-h-9 items-center rounded-full bg-white px-3 text-xs font-semibold text-[#0b1f3a] ring-1 ring-slate-200/80 transition hover:text-[#f97316] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <label className="block text-xs font-semibold text-slate-700">
              Loan amount
              <input
                type="number"
                inputMode="decimal"
                min={EMI_LIMITS.amountMin}
                max={EMI_LIMITS.amountMax}
                step={1000}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="block text-xs font-semibold text-slate-700">
              Interest rate (% p.a.)
              <input
                type="number"
                inputMode="decimal"
                min={EMI_LIMITS.rateMin}
                max={EMI_LIMITS.rateMax}
                step={0.1}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className={inputClass}
              />
            </label>

            <fieldset>
              <legend className="text-xs font-semibold text-slate-700">Loan tenure</legend>
              <div className="mt-1.5 flex gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  max={
                    tenureUnit === 'years'
                      ? EMI_LIMITS.tenureMonthsMax / 12
                      : EMI_LIMITS.tenureMonthsMax
                  }
                  step={1}
                  value={tenureValue}
                  onChange={(e) => setTenureValue(e.target.value)}
                  aria-label="Tenure value"
                  className={`${inputClass} mt-0 min-w-0 flex-1`}
                />
                <div
                  className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5"
                  role="group"
                  aria-label="Tenure unit"
                >
                  {(['months', 'years'] as const).map((unit) => {
                    const active = tenureUnit === unit;
                    return (
                      <button
                        key={unit}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          const current = parsePositive(tenureValue);
                          if (current != null && current > 0 && tenureUnit !== unit) {
                            if (unit === 'years' && tenureUnit === 'months') {
                              setTenureValue(
                                String(Math.max(1, Math.round((current / 12) * 10) / 10)),
                              );
                            } else if (unit === 'months' && tenureUnit === 'years') {
                              setTenureValue(String(Math.max(1, Math.round(current * 12))));
                            }
                          }
                          setTenureUnit(unit);
                        }}
                        className={`min-h-11 rounded-lg px-3 text-xs font-semibold capitalize transition ${
                          active ? 'bg-[#0b1f3a] text-white' : 'text-slate-600 hover:text-[#0b1f3a]'
                        }`}
                        style={active ? { color: '#ffffff' } : undefined}
                      >
                        {unit}
                      </button>
                    );
                  })}
                </div>
              </div>
            </fieldset>

            {validationError ? (
              <p className="text-xs font-medium text-red-600" role="alert">
                {EMI_VALIDATION_MESSAGES[validationError]}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl bg-[#0b1f3a]/[0.03] p-4 ring-1 ring-slate-200/70 sm:p-5">
            {result ? (
              <>
                <dl className="space-y-3">
                  <div className="rounded-xl bg-white px-4 py-3.5 ring-1 ring-slate-200/60">
                    <dt className="text-xs font-medium text-slate-500">Estimated monthly EMI</dt>
                    <dd className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums text-[#0b1f3a] sm:text-[2rem]">
                      {formatInr(result.monthlyEmi)}
                    </dd>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/80 px-3 py-2.5">
                      <dt className="text-[11px] font-medium text-slate-500">Total interest</dt>
                      <dd className="mt-0.5 text-base font-bold tabular-nums text-[#0b1f3a]">
                        {formatInr(result.totalInterest)}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-white/80 px-3 py-2.5">
                      <dt className="text-[11px] font-medium text-slate-500">Total repayment</dt>
                      <dd className="mt-0.5 text-base font-bold tabular-nums text-[#0b1f3a]">
                        {formatInr(result.totalRepayment)}
                      </dd>
                    </div>
                  </div>
                </dl>

                <div className="mt-4 pt-4">
                  <p className="mb-3 text-xs font-semibold text-[#0b1f3a]">Principal vs interest</p>
                  <PrincipalInterestDonut
                    principal={result.principal}
                    interest={result.totalInterest}
                  />
                </div>

                <Link
                  href={fullCalcHref}
                  className="group mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-[#0b1f3a] transition hover:text-[#f97316]"
                >
                  View full repayment schedule
                  <span
                    className="ml-1 inline-block transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
                    aria-hidden
                  >
                    →
                  </span>
                </Link>
              </>
            ) : (
              <p className="text-sm text-slate-600">Adjust the inputs to see an EMI estimate.</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-slate-100 px-5 py-4 sm:px-6">
        <ContextualLinkList links={related} label="Related calculators" />
        <p className="text-[11px] leading-relaxed text-slate-500">
          Illustrative estimate. Actual lender terms may differ.
        </p>
      </div>
    </section>
  );
}
