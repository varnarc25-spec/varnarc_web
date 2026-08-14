'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState, useTransition, type FormEvent } from 'react';
import type { FinanceCategory } from '@/services/finance';
import { isLoanHubCategorySlug } from '@/lib/loan-hub-categories';
import { financeEligibilityPath, loansHubPath } from '@/lib/finance-routes';
import { LOAN_CATALOG_FILTER_KEYS } from '@/lib/loan-path';

const TENURE_OPTIONS = [
  { label: '12 months', value: '12' },
  { label: '24 months', value: '24' },
  { label: '36 months', value: '36' },
  { label: '60 months', value: '60' },
  { label: '120 months', value: '120' },
  { label: '240 months', value: '240' },
];

const EMPLOYMENT_OPTIONS = [
  { label: 'Salaried', value: 'salaried' },
  { label: 'Self-employed', value: 'self-employed' },
  { label: 'Professional', value: 'professional' },
] as const;

const fieldClass =
  'mt-1.5 min-h-11 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus-visible:border-[#f97316]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]/30';

function formatAmountDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const n = Number(digits);
  if (!Number.isFinite(n)) return '';
  return new Intl.NumberFormat('en-IN').format(n);
}

function digitsOnly(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

/**
 * Interactive quick-finder only — keeps hero SEO copy on the server.
 * Uses startTransition so filter navigation stays responsive (INP).
 *
 * Hub mode: loan type + amount + tenure.
 * Category mode: amount + tenure + employment (no income / credit score).
 */
export function LoanHubQuickFinder({
  categories,
  activeCategorySlug,
  compareCtaLabel,
  eligibilityLabel,
}: {
  categories: FinanceCategory[];
  activeCategorySlug?: string;
  /** Category pages pass e.g. "Compare Personal Loans". Hub keeps default. */
  compareCtaLabel?: string;
  /** Category pages pass e.g. "Check eligibility". */
  eligibilityLabel?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const categoryMode = Boolean(activeCategorySlug && isLoanHubCategorySlug(activeCategorySlug));

  const [loanType, setLoanType] = useState(activeCategorySlug ?? '');
  const [amountDigits, setAmountDigits] = useState(() =>
    digitsOnly(searchParams.get('amountMin') ?? searchParams.get('amountMax')),
  );
  const [tenure, setTenure] = useState(() => searchParams.get('tenureMin') ?? '');
  const [employmentType, setEmploymentType] = useState(
    () => searchParams.get('employmentType') ?? '',
  );

  const amountDisplay = useMemo(() => formatAmountDisplay(amountDigits), [amountDigits]);
  const submitLabel = compareCtaLabel?.trim() || 'Compare Loans';
  const eligibilityText = eligibilityLabel?.trim() || 'Check eligibility';
  const eligibilityHref = categoryMode
    ? financeEligibilityPath({ loanType: activeCategorySlug })
    : '/finance/eligibility';

  function currentCatalogFilters(): Record<string, string | undefined> {
    const filters: Record<string, string | undefined> = {};
    for (const key of LOAN_CATALOG_FILTER_KEYS) {
      if (key === 'cursor') continue;
      const value = searchParams.get(key);
      if (value) filters[key] = value;
    }
    return filters;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const filters = currentCatalogFilters();

    if (amountDigits) filters.amountMin = amountDigits;
    else delete filters.amountMin;

    if (tenure) filters.tenureMin = tenure;
    else delete filters.tenureMin;

    if (categoryMode) {
      if (employmentType) filters.employmentType = employmentType;
      else delete filters.employmentType;
    }

    const targetSlug = categoryMode
      ? activeCategorySlug
      : loanType && isLoanHubCategorySlug(loanType)
        ? loanType
        : undefined;

    const href = targetSlug
      ? loansHubPath({ categorySlug: targetSlug, filters })
      : loansHubPath({ filters });

    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-3 rounded-2xl bg-[#0b1f3a]/[0.03] p-3 ring-1 ring-slate-200/70 sm:p-3.5"
      aria-label="Quick loan finder"
    >
      <div
        className={
          categoryMode
            ? 'grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-4'
            : 'grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-4'
        }
      >
        {categoryMode ? null : (
          <label className="block text-xs font-semibold text-slate-700 min-[400px]:col-span-2 lg:col-span-1">
            Loan type
            <select
              value={loanType}
              onChange={(e) => setLoanType(e.target.value)}
              className={fieldClass}
            >
              <option value="">All loans</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block text-xs font-semibold text-slate-700">
          Required loan amount
          <div className="relative mt-1.5">
            <span
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-medium text-slate-500"
              aria-hidden
            >
              ₹
            </span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              name="loanAmount"
              aria-label="Loan amount in Indian rupees"
              value={amountDisplay}
              onChange={(e) => setAmountDigits(e.target.value.replace(/\D/g, ''))}
              placeholder="5,00,000"
              className={`${fieldClass} mt-0 pl-7`}
            />
          </div>
        </label>

        <label className="block text-xs font-semibold text-slate-700">
          Preferred tenure
          <select
            name="preferredTenure"
            value={tenure}
            onChange={(e) => setTenure(e.target.value)}
            className={fieldClass}
            aria-label="Preferred tenure"
          >
            <option value="">Any tenure</option>
            {TENURE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        {categoryMode ? (
          <label className="block text-xs font-semibold text-slate-700">
            Employment type
            <select
              name="employmentType"
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              className={fieldClass}
              aria-label="Employment type"
            >
              <option value="">Any</option>
              {EMPLOYMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="flex flex-col justify-end gap-2 min-[400px]:col-span-2 lg:col-span-1">
          <button
            type="submit"
            disabled={pending}
            className="min-h-11 w-full rounded-xl bg-[#0b1f3a] px-4 text-sm font-semibold text-white transition hover:bg-[#122b4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? 'Updating…' : submitLabel}
          </button>
          <Link
            href={eligibilityHref}
            className="group inline-flex min-h-9 items-center justify-center text-center text-xs font-semibold text-slate-600 transition hover:text-[#f97316] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2"
          >
            {eligibilityText}
            <span
              className="ml-1 inline-block transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
              aria-hidden
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </form>
  );
}
