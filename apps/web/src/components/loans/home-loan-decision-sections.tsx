'use client';

import Link from 'next/link';
import { useId, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  ClipboardCheck,
  FileText,
  GitCompareArrows,
  Home,
  IndianRupee,
  Send,
  ShieldCheck,
  UserRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { formatInr } from '@/components/loans/loan-format';
import { useHomeLoanDecision } from '@/components/loans/home-loan-decision-context';
import { calculateEmi } from '@/lib/emi';
import { processingFeeDisplay } from '@/lib/loan-catalog';
import { calculatorHref, comparePath, financeEligibilityPath } from '@/lib/finance-routes';
import {
  HOME_LOAN_APPLICANT_DOCS,
  HOME_LOAN_FEE_TYPES,
  HOME_LOAN_FIXED_POINTS,
  HOME_LOAN_FLOATING_POINTS,
  HOME_LOAN_JOINT_NOTES,
  HOME_LOAN_PROPERTY_DOCS,
  HOME_LOAN_RATE_COMPARE_ITEMS,
  HOME_LOAN_SALARIED_NOTES,
  HOME_LOAN_SELF_EMPLOYED_NOTES,
  HOME_LOAN_TIMELINE_STEPS,
  estimateHomeLoanBalanceTransfer,
  estimateHomeLoanPrepaymentImpact,
  type PrepaymentMode,
} from '@/lib/home-loan-page';
import type { FinanceLoan } from '@/services/finance';

const JOURNEY_ICONS: LucideIcon[] = [
  Home,
  IndianRupee,
  GitCompareArrows,
  ClipboardCheck,
  Send,
  ShieldCheck,
  Building2,
  BadgeCheck,
  FileText,
  Wallet,
];

export function HomeLoanLtvSection() {
  const { propertyValue, loanRequirement, ltvPercent } = useHomeLoanDecision();
  const loanPct = ltvPercent != null ? Math.min(100, Math.max(0, ltvPercent)) : 0;
  const downPct = 100 - loanPct;

  return (
    <section
      id="home-loan-ltv"
      aria-labelledby="home-loan-ltv-heading"
      className="full-bleed bg-[var(--hl-surface-4)]"
    >
      <div className="site-container hl-section px-4">
        <p className="hl-eyebrow">Loan-to-Value</p>
        <h2 id="home-loan-ltv-heading" className="hl-h2">
          Understand Your Loan-to-Value (LTV)
        </h2>
        <p className="hl-lede">
          LTV is the loan amount as a percentage of property value. Lenders may use it as one factor
          when deciding how much of a property&apos;s value they are willing to finance.
        </p>

        <div className="mt-8 max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--hl-muted)]">
            Loan-to-Value
          </p>
          <p className="hl-metric-value mt-2 text-[3rem] leading-none sm:text-[3.75rem]">
            {ltvPercent != null ? `${ltvPercent.toFixed(0)}%` : '—'}
          </p>
          <p className="mt-3 text-sm text-slate-600">
            {formatInr(loanRequirement)} ÷ {formatInr(propertyValue)} × 100
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--hl-muted)]">
                Property value
              </p>
              <p className="mt-1 text-base font-bold tabular-nums text-[var(--hl-navy)]">
                {formatInr(propertyValue)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--hl-muted)]">
                Loan financed
              </p>
              <p className="mt-1 text-base font-bold tabular-nums text-[var(--hl-navy)]">
                {formatInr(loanRequirement)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--hl-muted)]">
                Down payment / equity
              </p>
              <p className="mt-1 text-base font-bold tabular-nums text-[var(--hl-navy)]">
                {formatInr(propertyValue - loanRequirement)}
              </p>
            </div>
          </div>

          <div
            className="mt-5 flex h-10 overflow-hidden rounded-[var(--hl-radius-sm)]"
            role="img"
            aria-label={`Equity ${downPct.toFixed(1)} percent, financed ${loanPct.toFixed(1)} percent`}
          >
            <div
              className="bg-[var(--hl-orange)]"
              style={{ width: `${downPct}%`, minWidth: downPct > 0 ? '2rem' : 0 }}
            />
            <div className="flex-1 bg-[var(--hl-navy)]" />
          </div>
          <p className="mt-2 text-xs text-[var(--hl-muted)]">
            Orange = down payment / equity · Navy = financed. Planning visual only — not an approval
            meter.
          </p>

          <Link
            href={calculatorHref('home-loan-emi', {
              amount: loanRequirement,
            })}
            className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--hl-navy)] underline-offset-2 hover:text-[var(--hl-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)]"
          >
            Open Home Loan EMI Calculator →
          </Link>
        </div>
      </div>
    </section>
  );
}

function FixedRateVisual() {
  return (
    <svg
      viewBox="0 0 280 88"
      className="mt-5 h-[5.5rem] w-full sm:h-[6rem]"
      role="img"
      aria-label="Fixed rate illustrated as a stable horizontal path"
    >
      <line
        x1="12"
        y1="40"
        x2="268"
        y2="40"
        stroke="var(--hl-navy, #0b1f3a)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="40" cy="40" r="5.5" fill="var(--hl-navy, #0b1f3a)" />
      <circle cx="140" cy="40" r="5.5" fill="var(--hl-navy, #0b1f3a)" />
      <circle cx="240" cy="40" r="5.5" fill="var(--hl-navy, #0b1f3a)" />
      <text x="12" y="72" fill="#64748b" fontSize="11" fontFamily="system-ui,sans-serif">
        Stable path
      </text>
    </svg>
  );
}

function FloatingRateVisual() {
  return (
    <svg
      viewBox="0 0 280 88"
      className="mt-5 h-[5.5rem] w-full sm:h-[6rem]"
      role="img"
      aria-label="Floating rate illustrated as a gently changing path"
    >
      <path
        d="M12 48 C48 48, 62 24, 100 32 S158 58, 196 28 S240 46, 268 36"
        fill="none"
        stroke="var(--hl-navy, #0b1f3a)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="100" cy="32" r="5.5" fill="var(--hl-navy, #0b1f3a)" />
      <circle cx="196" cy="28" r="6.5" fill="var(--hl-orange, #f97316)" />
      <circle cx="268" cy="36" r="5.5" fill="var(--hl-navy, #0b1f3a)" />
      <text x="12" y="72" fill="#64748b" fontSize="11" fontFamily="system-ui,sans-serif">
        May change over time
      </text>
    </svg>
  );
}

export function HomeLoanFixedVsFloating() {
  return (
    <section
      id="home-loan-fixed-vs-floating"
      aria-labelledby="home-loan-fixed-vs-floating-heading"
      className="full-bleed bg-[var(--hl-surface-1)]"
    >
      <div className="site-container hl-section px-4">
        <p className="hl-eyebrow">Rate Type</p>
        <h2 id="home-loan-fixed-vs-floating-heading" className="hl-h2">
          Fixed vs Floating Home Loan Rates
        </h2>
        <p className="hl-lede">
          Neither rate type is universally better. Compare product terms, reset rules and your
          repayment horizon.
        </p>

        <div className="mt-8 grid items-stretch gap-5 lg:grid-cols-2">
          <article className="flex h-full flex-col bg-[var(--hl-surface-2)] p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--hl-muted)]">
              Fixed Rate
            </p>
            <h3 className="mt-1 text-lg font-bold text-[var(--hl-navy)]">More predictable path</h3>
            <FixedRateVisual />
            <ul className="mt-4 flex-1 space-y-2.5">
              {HOME_LOAN_FIXED_POINTS.map((point) => (
                <li key={point} className="text-sm leading-relaxed text-slate-600">
                  {point}
                </li>
              ))}
            </ul>
            <Link
              href={comparePath('fixed-vs-floating-home-loan')}
              className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-[var(--hl-navy)] underline-offset-2 hover:text-[var(--hl-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)]"
            >
              Learn more →
            </Link>
          </article>
          <article className="flex h-full flex-col bg-[var(--hl-surface-4)] p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--hl-muted)]">
              Floating Rate
            </p>
            <h3 className="mt-1 text-lg font-bold text-[var(--hl-navy)]">May move with terms</h3>
            <FloatingRateVisual />
            <ul className="mt-4 flex-1 space-y-2.5">
              {HOME_LOAN_FLOATING_POINTS.map((point) => (
                <li key={point} className="text-sm leading-relaxed text-slate-600">
                  {point}
                </li>
              ))}
            </ul>
            <Link
              href={comparePath('fixed-vs-floating-home-loan')}
              className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-[var(--hl-navy)] underline-offset-2 hover:text-[var(--hl-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)]"
            >
              Learn more →
            </Link>
          </article>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-bold text-[var(--hl-navy)]">Things to compare</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {HOME_LOAN_RATE_COMPARE_ITEMS.map((item) => (
              <li
                key={item}
                className="rounded-full bg-[var(--hl-surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--hl-navy)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Link
          href={comparePath('fixed-vs-floating-home-loan')}
          className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--hl-navy)] underline-offset-2 hover:text-[var(--hl-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)]"
        >
          Learn more about Home Loan rates →
        </Link>
      </div>
    </section>
  );
}

export function HomeLoanInterestOverTime() {
  const { loanRequirement, ratePercent, tenureYears } = useHomeLoanDecision();
  const tenures = [10, 15, 20, 25, 30] as const;

  const bars = useMemo(
    () =>
      tenures.map((years) => {
        const result = calculateEmi({
          principal: loanRequirement,
          annualRatePercent: ratePercent,
          tenureMonths: years * 12,
        });
        return { years, totalInterest: result?.totalInterest ?? 0 };
      }),
    [loanRequirement, ratePercent],
  );

  const maxInterest = Math.max(...bars.map((b) => b.totalInterest), 1);

  return (
    <section
      id="home-loan-interest-over-time"
      aria-labelledby="home-loan-interest-over-time-heading"
      className="full-bleed bg-[var(--hl-surface-2)]"
    >
      <div className="site-container hl-section px-4">
        <p className="hl-eyebrow">Total Interest</p>
        <h2 id="home-loan-interest-over-time-heading" className="hl-h2">
          How Much Interest Could You Pay Over Time?
        </h2>
        <p className="hl-lede">
          Illustrative total interest at your current loan requirement and rate across common
          tenures. Longer tenures typically accumulate more interest.
        </p>

        <p className="mt-8 text-sm font-bold text-[var(--hl-navy)]">
          Total Interest by Loan Tenure
        </p>
        <div className="mt-4 max-w-3xl space-y-3.5" role="list">
          {bars.map(({ years, totalInterest }) => {
            const widthPct = maxInterest > 0 ? (totalInterest / maxInterest) * 100 : 0;
            const selected = years === tenureYears;
            const label = `${years} years: ${formatInr(Math.round(totalInterest))} total interest`;
            return (
              <div
                key={years}
                role="listitem"
                className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3"
              >
                <p className="text-xs font-semibold tabular-nums text-[var(--hl-navy)]">
                  {years} years
                </p>
                <div
                  className="relative h-7 rounded-[var(--hl-radius-sm)] bg-white"
                  role="img"
                  aria-label={label}
                >
                  <div
                    className={`absolute inset-y-0 left-0 rounded-[var(--hl-radius-sm)] transition-all duration-150 motion-reduce:transition-none ${
                      selected ? 'bg-[var(--hl-navy)]' : 'bg-[var(--hl-navy)]/70'
                    }`}
                    style={{ width: `${Math.max(widthPct, 2)}%` }}
                  />
                  {selected ? (
                    <span
                      className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 translate-x-1 rounded-full bg-[var(--hl-orange)] ring-2 ring-white"
                      style={{ left: `calc(${Math.max(widthPct, 2)}% - 5px)` }}
                      aria-hidden
                    />
                  ) : null}
                </div>
                <p className="min-w-[5.5rem] text-right text-sm font-bold tabular-nums text-[var(--hl-navy)]">
                  {totalInterest > 0 ? formatInr(Math.round(totalInterest)) : '—'}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-7 rounded-[var(--hl-radius-lg)] bg-[var(--hl-surface-1)] px-4 py-5 sm:px-6">
          <p className="hl-metric-label">Tenure tradeoff</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <span className="shrink-0 text-sm font-bold text-[var(--hl-navy)]">Higher EMI</span>
            <div className="relative h-2 w-full flex-1" aria-hidden>
              <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-[var(--hl-navy)]/25" />
              <div className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-[var(--hl-navy)]/70" />
              <span className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-x-0.5 -translate-y-1/2 rounded-full bg-[var(--hl-navy)] ring-[3px] ring-white" />
              <span className="absolute right-0 top-1/2 h-3.5 w-3.5 translate-x-0.5 -translate-y-1/2 rounded-full bg-slate-400 ring-[3px] ring-white" />
              <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--hl-orange)] ring-2 ring-white" />
            </div>
            <span className="shrink-0 text-sm font-bold text-[var(--hl-navy)]">
              Higher total interest
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Shorter tenure typically raises EMI but may reduce total interest. Longer tenure lowers
            EMI but may increase lifetime interest. Product conditions can change the outcome.
          </p>
        </div>

        <p className="mt-4 text-xs text-[var(--hl-muted)]">
          Bars compare illustrative total interest only — not EMI or approval outcomes.
        </p>
      </div>
    </section>
  );
}

export function HomeLoanEligibilityProfile() {
  const { applicantType, setApplicantType } = useHomeLoanDecision();
  const tabsId = useId();
  const [tab, setTab] = useState<'salaried' | 'self-employed' | 'joint'>(
    applicantType === 'self-employed'
      ? 'self-employed'
      : applicantType === 'joint'
        ? 'joint'
        : 'salaried',
  );

  const notes =
    tab === 'salaried'
      ? HOME_LOAN_SALARIED_NOTES
      : tab === 'self-employed'
        ? HOME_LOAN_SELF_EMPLOYED_NOTES
        : HOME_LOAN_JOINT_NOTES;

  return (
    <section
      id="home-loan-eligibility"
      aria-labelledby="home-loan-eligibility-heading"
      className="full-bleed bg-[var(--hl-surface-1)]"
    >
      <div className="site-container hl-section px-4">
        <p className="hl-eyebrow">Eligibility</p>
        <h2 id="home-loan-eligibility-heading" className="hl-h2">
          What Affects Home Loan Eligibility?
        </h2>
        <p className="hl-lede">
          Lenders assess multiple factors together. Thresholds are product-specific — this page does
          not invent universal cutoffs or LTV caps.
        </p>

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            {/* Desktop applicant + property grouping */}
            <div className="hidden md:block">
              <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--hl-muted)]">
                Applicant Profile
              </p>
              <div
                className="relative mx-auto aspect-square w-full max-w-[360px]"
                role="img"
                aria-label="Applicant profile factors: income, credit profile, existing EMIs, and employment or business stability"
              >
                <svg
                  viewBox="0 0 280 280"
                  className="absolute inset-0 h-full w-full"
                  fill="none"
                  aria-hidden
                >
                  {[
                    [140, 40],
                    [40, 140],
                    [240, 140],
                    [140, 240],
                  ].map(([x, y], i) => (
                    <line
                      key={i}
                      x1="140"
                      y1="140"
                      x2={x}
                      y2={y}
                      stroke="#c5d0de"
                      strokeWidth="1.5"
                    />
                  ))}
                </svg>
                <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-[var(--hl-navy)] text-white shadow-sm">
                  <UserRound className="h-8 w-8" strokeWidth={1.75} aria-hidden />
                  <span className="mt-1 text-[9px] font-semibold uppercase tracking-wide">
                    Applicant
                  </span>
                </div>
                {(
                  [
                    ['Income', 'left-1/2 top-0 -translate-x-1/2'],
                    ['Credit Profile', 'left-0 top-1/2 -translate-y-1/2'],
                    ['Existing EMIs', 'right-0 top-1/2 -translate-y-1/2'],
                    ['Employment / Business', 'bottom-0 left-1/2 -translate-x-1/2'],
                  ] as const
                ).map(([label, pos]) => (
                  <span
                    key={label}
                    className={`absolute ${pos} rounded-full bg-[var(--hl-surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--hl-navy)]`}
                  >
                    {label}
                  </span>
                ))}
              </div>

              <div className="mt-8">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--hl-muted)]">
                  Home Loan Profile
                </p>
                <ul
                  className="mt-3 flex flex-wrap gap-2"
                  aria-label="Home loan eligibility factors"
                >
                  {[
                    'Property Value',
                    'Loan Requirement',
                    'Tenure',
                    'Co-applicant',
                    'Property Assessment',
                  ].map((label) => (
                    <li
                      key={label}
                      className="rounded-full bg-[var(--hl-surface-4)] px-3 py-1.5 text-xs font-semibold text-[var(--hl-navy)]"
                    >
                      {label}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-col items-start gap-1.5">
                  <span className="h-6 w-px bg-[var(--hl-navy)]/30" aria-hidden />
                  <p className="rounded-full bg-[var(--hl-navy)] px-3.5 py-1.5 text-xs font-semibold text-white">
                    Lender Assessment
                  </p>
                  <p className="max-w-sm text-xs leading-relaxed text-[var(--hl-muted)]">
                    Illustrative factor groups only — not an approval score or probability.
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile stacked */}
            <div className="md:hidden">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--hl-navy)] text-white">
                <UserRound className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              </div>
              <p className="mb-3 text-center text-sm font-semibold text-[var(--hl-navy)]">
                Applicant Profile
              </p>
              <ul
                className="space-y-2 border-l border-[var(--hl-border)] pl-4"
                aria-label="Applicant factors"
              >
                {['Income', 'Credit Profile', 'Existing EMIs', 'Employment / Business'].map(
                  (label) => (
                    <li
                      key={label}
                      className="relative text-sm font-semibold text-[var(--hl-navy)]"
                    >
                      <span
                        className="absolute -left-[1.3rem] top-1.5 h-2 w-2 rounded-full bg-[var(--hl-navy)]/50"
                        aria-hidden
                      />
                      {label}
                    </li>
                  ),
                )}
              </ul>
              <p className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-wide text-[var(--hl-muted)]">
                Home Loan Profile
              </p>
              <ul
                className="space-y-2 border-l border-[var(--hl-border)] pl-4"
                aria-label="Home loan factors"
              >
                {[
                  'Property Value',
                  'Loan Requirement',
                  'Tenure',
                  'Co-applicant',
                  'Property Assessment',
                ].map((label) => (
                  <li key={label} className="relative text-sm font-semibold text-[var(--hl-navy)]">
                    <span
                      className="absolute -left-[1.3rem] top-1.5 h-2 w-2 rounded-full bg-[var(--hl-orange)]"
                      aria-hidden
                    />
                    {label}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm font-semibold text-[var(--hl-navy)]">
                ↓ Lender Assessment
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--hl-muted)]">
                Illustrative factor groups only — not an approval score or probability.
              </p>
            </div>

            <p className="sr-only">
              Eligibility factors include income, credit history, existing obligations, employment
              or business profile, property value, requested loan amount, tenure and co-applicant
              details where applicable. This is not an approval probability.
            </p>
          </div>

          <div>
            <div
              className="inline-flex w-full flex-wrap rounded-full bg-[var(--hl-surface-2)] p-1 sm:w-auto"
              role="tablist"
              aria-label="Applicant type guidance"
              onKeyDown={(e) => {
                const order = ['salaried', 'self-employed', 'joint'] as const;
                const idx = order.indexOf(tab);
                if (idx < 0) return;
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const next =
                    e.key === 'ArrowRight'
                      ? order[(idx + 1) % order.length]!
                      : order[(idx - 1 + order.length) % order.length]!;
                  setTab(next);
                  setApplicantType(next);
                  document.getElementById(`${tabsId}-${next}`)?.focus();
                }
              }}
            >
              {(
                [
                  ['salaried', 'Salaried'],
                  ['self-employed', 'Self-Employed'],
                  ['joint', 'Joint Application'],
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
                  onClick={() => {
                    setTab(key);
                    setApplicantType(key);
                  }}
                  className={`min-h-11 flex-1 rounded-full px-3 text-xs font-semibold transition duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)] sm:flex-none sm:px-4 ${
                    tab === key
                      ? 'bg-[var(--hl-navy)] text-white'
                      : 'bg-transparent text-[var(--hl-navy)] hover:bg-white/80'
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
              className="mt-4 bg-[var(--hl-surface-2)] p-5"
            >
              <ul className="space-y-2.5">
                {notes.map((note) => (
                  <li key={note} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--hl-navy)]"
                      aria-hidden
                    />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <Link
          href={financeEligibilityPath({ loanType: 'home-loan' })}
          className="mt-8 inline-flex min-h-11 items-center rounded-[var(--hl-radius-md)] bg-[var(--hl-navy)] px-4 text-sm font-semibold !text-white hover:bg-[var(--hl-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)]"
        >
          Check Home Loan Eligibility →
        </Link>
      </div>
    </section>
  );
}

export function HomeLoanPrepaymentImpact() {
  const { loanRequirement, ratePercent, tenureYears } = useHomeLoanDecision();
  const [outstanding, setOutstanding] = useState(loanRequirement);
  const [rate, setRate] = useState(ratePercent);
  const [remainingYears, setRemainingYears] = useState(tenureYears);
  const [prepayAmount, setPrepayAmount] = useState(Math.round(loanRequirement * 0.1));
  const [mode, setMode] = useState<PrepaymentMode>('reduce-tenure');
  const modeId = useId();

  const impact = useMemo(
    () =>
      estimateHomeLoanPrepaymentImpact({
        outstanding,
        annualRatePercent: rate,
        remainingMonths: remainingYears * 12,
        prepaymentAmount: prepayAmount,
        mode,
      }),
    [outstanding, rate, remainingYears, prepayAmount, mode],
  );

  const remainingMonthsAfter =
    impact && impact.mode === 'reduce-tenure'
      ? Math.max(0, remainingYears * 12 - impact.monthsSaved)
      : remainingYears * 12;

  return (
    <section
      id="home-loan-prepayment"
      aria-labelledby="home-loan-prepayment-heading"
      className="full-bleed bg-[var(--hl-surface-1)]"
    >
      <div className="site-container hl-section px-4">
        <p className="hl-eyebrow">Prepayment</p>
        <h2 id="home-loan-prepayment-heading" className="hl-h2">
          Could Prepayment Reduce Your Home Loan Cost?
        </h2>
        <p className="hl-lede">
          Illustrative prepayment impact using a reducing-balance model. Does not model lender
          lock-ins or prepayment charges.
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
            max={30}
          />
          <InputField
            label="Prepayment amount (₹)"
            value={prepayAmount}
            onChange={setPrepayAmount}
          />
        </div>

        <div className="mt-5">
          <p id={`${modeId}-label`} className="hl-metric-label">
            Strategy
          </p>
          <div
            className="mt-2 inline-flex w-full flex-wrap rounded-full bg-[var(--hl-surface-2)] p-1 sm:w-auto"
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
                className={`min-h-10 flex-1 rounded-full px-4 text-xs font-semibold transition duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)] sm:flex-none ${
                  mode === key
                    ? 'bg-[var(--hl-navy)] text-white'
                    : 'bg-transparent text-[var(--hl-navy)] hover:bg-white/80'
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
                <dt className="hl-metric-label">Potential Interest Saved</dt>
                <dd className="hl-metric-value mt-1.5 text-3xl sm:text-4xl">
                  {formatInr(Math.round(impact.interestSaved))}
                </dd>
              </div>
              {impact.mode === 'reduce-tenure' && impact.monthsSaved > 0 ? (
                <div>
                  <dt className="hl-metric-label">Potential Time Saved</dt>
                  <dd className="hl-metric-value mt-1.5 text-3xl sm:text-4xl">
                    {impact.monthsSaved}{' '}
                    <span className="text-lg font-semibold text-[var(--hl-muted)]">
                      {impact.monthsSaved === 1 ? 'month' : 'months'}
                    </span>
                  </dd>
                </div>
              ) : (
                <div>
                  <dt className="hl-metric-label">Revised EMI</dt>
                  <dd className="hl-metric-value mt-1.5 text-3xl sm:text-4xl">
                    {formatInr(Math.round(impact.revised.monthlyEmi))}
                    <span className="ml-1 text-base font-semibold text-[var(--hl-muted)]">
                      /month
                    </span>
                  </dd>
                </div>
              )}
            </dl>
            <dl className="mt-5 grid gap-3 border-t border-[var(--hl-border)] pt-4 sm:grid-cols-2">
              {impact.mode === 'reduce-tenure' ? (
                <div>
                  <dt className="text-xs text-[var(--hl-muted)]">Revised tenure</dt>
                  <dd className="mt-0.5 text-sm font-bold tabular-nums text-[var(--hl-navy)]">
                    {Math.floor(remainingMonthsAfter / 12)} years{' '}
                    {remainingMonthsAfter % 12 ? `${remainingMonthsAfter % 12} mo` : ''}
                    <span className="ml-2 font-medium text-[var(--hl-muted)]">
                      (was {remainingYears} years)
                    </span>
                  </dd>
                </div>
              ) : (
                <div>
                  <dt className="text-xs text-[var(--hl-muted)]">Original EMI</dt>
                  <dd className="mt-0.5 text-sm font-bold tabular-nums text-[var(--hl-navy)]">
                    {formatInr(Math.round(impact.original.monthlyEmi))}/month
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-[var(--hl-muted)]">Strategy</dt>
                <dd className="mt-0.5 text-sm font-semibold text-[var(--hl-navy)]">
                  {impact.mode === 'reduce-tenure' ? 'Reduce tenure' : 'Reduce EMI'}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="mt-6 text-sm text-[var(--hl-muted)]">
            Enter valid outstanding principal, rate, tenure and a prepayment amount less than
            outstanding to see illustrative savings.
          </p>
        )}

        <div className="mt-8 space-y-5" aria-label="Repayment timeline comparison">
          <TimelineBar label="Original" variant="standard" />
          <TimelineBar
            label="With Prepayment"
            variant="prepay"
            shortened={impact != null && impact.monthsSaved > 0}
            remainingRatio={
              impact && remainingYears * 12 > 0
                ? Math.max(
                    0.22,
                    Math.min(1, (remainingYears * 12 - impact.monthsSaved) / (remainingYears * 12)),
                  )
                : 1
            }
            prepayAtRatio={0.45}
          />
        </div>

        <Link
          href={calculatorHref('loan-prepayment')}
          className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--hl-navy)] underline-offset-2 hover:text-[var(--hl-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)]"
        >
          Open Loan Prepayment Calculator →
        </Link>
      </div>
    </section>
  );
}

export function HomeLoanBalanceTransfer() {
  const { loanRequirement, ratePercent, tenureYears } = useHomeLoanDecision();
  const [outstanding, setOutstanding] = useState(loanRequirement);
  const [currentRate, setCurrentRate] = useState(ratePercent);
  const [newRate, setNewRate] = useState(Math.max(0, ratePercent - 0.5));
  const [remainingYears, setRemainingYears] = useState(tenureYears);
  const [transferCost, setTransferCost] = useState(25_000);

  const impact = useMemo(
    () =>
      estimateHomeLoanBalanceTransfer({
        outstanding,
        currentRatePercent: currentRate,
        newRatePercent: newRate,
        remainingMonths: remainingYears * 12,
        transferCost,
      }),
    [outstanding, currentRate, newRate, remainingYears, transferCost],
  );

  return (
    <section
      id="home-loan-balance-transfer"
      aria-labelledby="home-loan-balance-transfer-heading"
      className="full-bleed bg-[var(--hl-surface-2)]"
    >
      <div className="site-container hl-section px-4">
        <p className="hl-eyebrow">Balance Transfer</p>
        <h2 id="home-loan-balance-transfer-heading" className="hl-h2">
          Would a Home Loan Balance Transfer Save Money?
        </h2>
        <p className="hl-lede">
          Illustrative comparison when moving an existing home loan to another lender. Transfer
          costs are user-entered only — savings are not guaranteed.
        </p>

        <div
          className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4"
          aria-hidden
        >
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--hl-muted)]">
              Current Loan
            </p>
            <div className="mt-2 h-1.5 rounded-full bg-[var(--hl-navy)]/70" />
          </div>
          <div className="flex shrink-0 flex-col items-center gap-1 px-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--hl-orange)]">
              Transfer
            </span>
            <span className="h-3 w-px bg-[var(--hl-orange)] sm:h-px sm:w-8" />
            <span className="hidden text-[var(--hl-orange)] sm:inline" aria-hidden>
              ↓
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--hl-muted)]">
              New Loan
            </p>
            <div className="mt-2 h-1.5 rounded-full bg-[var(--hl-navy)]/40" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InputField
            label="Outstanding principal (₹)"
            value={outstanding}
            onChange={setOutstanding}
          />
          <InputField
            label="Current rate (% p.a.)"
            value={currentRate}
            onChange={setCurrentRate}
            step={0.1}
          />
          <InputField
            label="Proposed new rate (% p.a.)"
            value={newRate}
            onChange={setNewRate}
            step={0.1}
          />
          <InputField
            label="Remaining tenure (years)"
            value={remainingYears}
            onChange={setRemainingYears}
            min={1}
            max={30}
          />
          <InputField
            label="Estimated transfer cost (₹)"
            value={transferCost}
            onChange={setTransferCost}
          />
        </div>

        {impact ? (
          <>
            <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-12">
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--hl-muted)]">
                  Current Home Loan
                </h3>
                <dl className="mt-3 space-y-3">
                  <div className="flex items-baseline justify-between gap-3 border-b border-[var(--hl-border)] pb-2">
                    <dt className="text-xs text-[var(--hl-muted)]">Rate</dt>
                    <dd className="text-sm font-bold tabular-nums text-[var(--hl-navy)]">
                      {currentRate.toFixed(2)}% p.a.
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 border-b border-[var(--hl-border)] pb-2">
                    <dt className="text-xs text-[var(--hl-muted)]">EMI</dt>
                    <dd className="text-sm font-bold tabular-nums text-[var(--hl-navy)]">
                      {formatInr(Math.round(impact.current.monthlyEmi))}/month
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 border-b border-[var(--hl-border)] pb-2">
                    <dt className="text-xs text-[var(--hl-muted)]">Remaining interest</dt>
                    <dd className="text-sm font-bold tabular-nums text-[var(--hl-navy)]">
                      {formatInr(Math.round(impact.current.totalInterest))}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-xs text-[var(--hl-muted)]">Remaining tenure</dt>
                    <dd className="text-sm font-bold tabular-nums text-[var(--hl-navy)]">
                      {remainingYears} years
                    </dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--hl-muted)]">
                  After Transfer
                </h3>
                <dl className="mt-3 space-y-3">
                  <div className="flex items-baseline justify-between gap-3 border-b border-[var(--hl-border)] pb-2">
                    <dt className="text-xs text-[var(--hl-muted)]">New rate</dt>
                    <dd className="text-sm font-bold tabular-nums text-[var(--hl-navy)]">
                      {newRate.toFixed(2)}% p.a.
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 border-b border-[var(--hl-border)] pb-2">
                    <dt className="text-xs text-[var(--hl-muted)]">New EMI</dt>
                    <dd className="text-sm font-bold tabular-nums text-[var(--hl-navy)]">
                      {formatInr(Math.round(impact.proposed.monthlyEmi))}/month
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 border-b border-[var(--hl-border)] pb-2">
                    <dt className="text-xs text-[var(--hl-muted)]">Estimated interest</dt>
                    <dd className="text-sm font-bold tabular-nums text-[var(--hl-navy)]">
                      {formatInr(Math.round(impact.proposed.totalInterest))}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-xs text-[var(--hl-muted)]">Transfer cost</dt>
                    <dd className="text-sm font-bold tabular-nums text-[var(--hl-navy)]">
                      {formatInr(Math.round(impact.transferCost))}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-8 border-t border-[var(--hl-border)] pt-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="hl-metric-label">
                    {impact.netSavings >= 0
                      ? 'Estimated Net Savings'
                      : 'Estimated Net Cost Increase'}
                  </p>
                  <p className="hl-metric-value mt-1.5 text-3xl sm:text-4xl">
                    {formatInr(Math.abs(Math.round(impact.netSavings)))}
                  </p>
                  <p className="mt-1 text-xs text-[var(--hl-muted)]">
                    After transfer cost · illustrative only
                    {impact.netSavings < 0
                      ? '. Under these assumptions, a transfer may not reduce total cost.'
                      : ''}
                  </p>
                </div>
                <div>
                  <p className="hl-metric-label">Break-Even</p>
                  <p className="hl-metric-value mt-1.5 text-3xl sm:text-4xl">
                    {impact.breakEvenMonths != null && impact.netSavings >= 0 ? (
                      <>
                        {impact.breakEvenMonths}{' '}
                        <span className="text-lg font-semibold text-[var(--hl-muted)]">
                          {impact.breakEvenMonths === 1 ? 'month' : 'months'}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-semibold text-[var(--hl-muted)]">
                        Not applicable under these assumptions
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-6 text-sm text-[var(--hl-muted)]">
            Enter valid outstanding principal, rates and remaining tenure to see an illustrative
            comparison.
          </p>
        )}

        <p className="mt-4 text-xs text-[var(--hl-muted)]">
          Net savings = gross interest saved − transfer cost. Negative net savings means the
          transfer may not be beneficial under these assumptions. No savings are fabricated when
          inputs are invalid.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={calculatorHref('loan-prepayment')}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--hl-navy)] underline-offset-2 hover:text-[var(--hl-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)]"
          >
            Open Prepayment Calculator →
          </Link>
          <Link
            href="/finance/loans/methodology"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-slate-600 hover:text-[var(--hl-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)]"
          >
            Loan comparison methodology →
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HomeLoanFeesAndCharges({ loans }: { loans: FinanceLoan[] }) {
  const withFees = loans
    .map((loan) => ({
      id: loan.id,
      name: loan.name,
      lender: loan.bank?.name ?? 'Lender',
      fee: processingFeeDisplay(loan),
      hasExplicitFee:
        loan.processingFeeText?.trim() ||
        loan.processingFee != null ||
        loan.processingFeeMin != null ||
        loan.processingFeeMax != null,
    }))
    .filter((row) => row.hasExplicitFee)
    .slice(0, 6);

  return (
    <section
      id="home-loan-fees"
      aria-labelledby="home-loan-fees-heading"
      className="full-bleed bg-[var(--hl-surface-3)]"
    >
      <div className="site-container hl-section px-4">
        <p className="hl-eyebrow">Fees & Charges</p>
        <h2 id="home-loan-fees-heading" className="hl-h2">
          Look Beyond the Interest Rate
        </h2>
        <p className="hl-lede">
          The headline rate is only one part of the total cost of borrowing. Confirm all charges on
          the sanction letter.
        </p>

        <div
          className="mt-8 flex flex-col items-stretch gap-2.5 rounded-[var(--hl-radius-lg)] bg-[var(--hl-surface-2)] px-4 py-7 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3 sm:px-7 sm:py-8"
          aria-label="Total financing cost formula"
        >
          {(
            [
              'Interest',
              'Processing Fee',
              'Legal / Valuation Costs',
              'Other Applicable Charges',
            ] as const
          ).map((term, index) => (
            <span key={term} className="contents">
              {index > 0 ? (
                <span
                  className="flex justify-center text-sm font-bold text-[var(--hl-orange)]"
                  aria-hidden
                >
                  +
                </span>
              ) : null}
              <span className="inline-flex min-h-12 items-center justify-center rounded-[var(--hl-radius-md)] bg-white px-4 text-xs font-extrabold uppercase tracking-wide text-[var(--hl-navy)] sm:min-h-[3.25rem] sm:text-sm">
                {term}
              </span>
            </span>
          ))}
          <span
            className="flex justify-center text-lg font-bold text-[var(--hl-orange)] sm:text-base"
            aria-hidden
          >
            <span className="sm:hidden">↓</span>
            <span className="hidden sm:inline">=</span>
          </span>
          <span className="inline-flex min-h-12 items-center justify-center rounded-[var(--hl-radius-md)] bg-[var(--hl-navy)] px-4 text-xs font-extrabold uppercase tracking-wide text-white sm:min-h-[3.25rem] sm:text-sm">
            Total Financing Cost
          </span>
        </div>

        <ul className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {HOME_LOAN_FEE_TYPES.map((item) => (
            <li key={item.key} className="border-t border-[var(--hl-border)] pt-3.5">
              <p className="text-sm font-bold text-[var(--hl-navy)]">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.detail}</p>
            </li>
          ))}
        </ul>

        {withFees.length ? (
          <div className="mt-8 overflow-x-auto rounded-[var(--hl-radius-lg)] bg-white">
            <table className="min-w-full border-collapse text-left text-sm">
              <caption className="sr-only">Verified processing fee comparison</caption>
              <thead>
                <tr className="border-b border-[var(--hl-border)] text-[11px] uppercase tracking-wide text-[var(--hl-muted)]">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Lender / Product
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Processing Fee
                  </th>
                </tr>
              </thead>
              <tbody>
                {withFees.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--hl-border)]">
                    <th scope="row" className="px-4 py-3 font-semibold text-[var(--hl-navy)]">
                      {row.lender}
                      <span className="mt-0.5 block text-xs font-normal text-slate-500">
                        {row.name}
                      </span>
                    </th>
                    <td className="px-4 py-3 tabular-nums text-slate-700">{row.fee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-6 text-sm text-[var(--hl-muted)]">
            Product-level fee comparison appears when verified processing fee data is available.
            Missing values are never shown as 0%.
          </p>
        )}
      </div>
    </section>
  );
}

export function HomeLoanDocuments() {
  return (
    <section
      id="home-loan-documents"
      aria-labelledby="home-loan-documents-heading"
      className="full-bleed bg-[var(--hl-surface-2)]"
    >
      <div className="site-container hl-section px-4">
        <p className="hl-eyebrow">Documentation</p>
        <h2 id="home-loan-documents-heading" className="hl-h2">
          Documents Commonly Required for a Home Loan
        </h2>
        <p className="hl-lede">
          Requirements vary by lender, applicant profile, property and transaction type.
        </p>

        <div className="mt-7 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--hl-navy)] text-white">
                <UserRound className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <h3 className="text-base font-bold text-[var(--hl-navy)]">Applicant Documents</h3>
            </div>
            <ul className="mt-4 space-y-2.5 border-t border-[var(--hl-border)] pt-4">
              {HOME_LOAN_APPLICANT_DOCS.map((doc) => (
                <li key={doc} className="flex gap-2 text-sm text-slate-600">
                  <FileText
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--hl-muted)]"
                    strokeWidth={2}
                    aria-hidden
                  />
                  {doc}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--hl-navy)] text-white">
                <Home className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <h3 className="text-base font-bold text-[var(--hl-navy)]">Property Documents</h3>
            </div>
            <ul className="mt-4 space-y-2.5 border-t border-[var(--hl-border)] pt-4">
              {HOME_LOAN_PROPERTY_DOCS.map((doc) => (
                <li key={doc} className="flex gap-2 text-sm text-slate-600">
                  <Building2
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--hl-muted)]"
                    strokeWidth={2}
                    aria-hidden
                  />
                  {doc}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-6 text-sm text-[var(--hl-muted)]">
          Under-construction, resale and self-construction cases may need additional diligence.
          Confirm the exact list with your lender before submission.
        </p>
      </div>
    </section>
  );
}

export function HomeLoanApplicationJourney() {
  return (
    <section
      id="home-loan-application-journey"
      aria-labelledby="home-loan-application-journey-heading"
      className="full-bleed bg-[var(--hl-surface-4)]"
    >
      <div className="site-container hl-section px-4">
        <h2 id="home-loan-application-journey-heading" className="hl-h2">
          How a Home Loan Typically Progresses
        </h2>
        <p className="hl-lede">
          A typical path from property planning to disbursement. Steps and timelines vary by lender
          and property type.
        </p>

        <ol className="relative mt-8 space-y-0 lg:hidden">
          {HOME_LOAN_TIMELINE_STEPS.map((step, index) => {
            const Icon = JOURNEY_ICONS[index] ?? BadgeCheck;
            const isLast = index === HOME_LOAN_TIMELINE_STEPS.length - 1;
            return (
              <li key={step} className="relative flex gap-3 pb-4">
                {!isLast ? (
                  <span
                    className="absolute left-[15px] top-8 bottom-0 w-px bg-[var(--hl-navy)]/25"
                    aria-hidden
                  />
                ) : null}
                <span className="relative z-[1] inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--hl-navy)]/20 bg-white text-[var(--hl-navy)]">
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--hl-muted)]">
                    Step {index + 1}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-[var(--hl-navy)]">{step}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 hidden lg:block">
          {[0, 1].map((row) => {
            const slice = HOME_LOAN_TIMELINE_STEPS.slice(row * 5, row * 5 + 5);
            return (
              <ol
                key={row}
                className={`relative grid grid-cols-5 gap-4 ${row === 1 ? 'mt-6' : ''}`}
              >
                {slice.map((step, i) => {
                  const index = row * 5 + i;
                  const Icon = JOURNEY_ICONS[index] ?? BadgeCheck;
                  const isLastInRow = i === slice.length - 1;
                  return (
                    <li key={step} className="relative min-w-0">
                      {!isLastInRow ? (
                        <span
                          className="absolute left-8 right-0 top-[15px] h-px bg-[var(--hl-navy)]/25"
                          aria-hidden
                        />
                      ) : null}
                      <span className="relative z-[1] inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--hl-navy)]/20 bg-white text-[var(--hl-navy)]">
                        <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                      </span>
                      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--hl-muted)]">
                        Step {index + 1}
                      </p>
                      <p className="mt-0.5 text-sm font-bold leading-snug text-[var(--hl-navy)]">
                        {step}
                      </p>
                    </li>
                  );
                })}
              </ol>
            );
          })}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-[var(--hl-muted)]">
          Varnarc helps users compare and calculate. Final eligibility, property verification,
          approval and disbursement are determined by the lender.
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
        className="mt-1.5 min-h-11 w-full rounded-[var(--hl-radius-md)] border border-[var(--hl-border)] bg-white px-3 text-sm font-semibold tabular-nums text-[var(--hl-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)]/30"
      />
    </label>
  );
}

function TimelineBar({
  label,
  variant,
  shortened,
  remainingRatio = 0.68,
  prepayAtRatio = 0.48,
}: {
  label: string;
  variant: 'standard' | 'prepay';
  shortened?: boolean;
  remainingRatio?: number;
  prepayAtRatio?: number;
}) {
  const widthPct =
    variant === 'standard' ? 100 : shortened ? Math.round(remainingRatio * 100) : 100;
  const markerPct = Math.round(Math.min(prepayAtRatio, remainingRatio) * 100);

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--hl-muted)]">
        {label}
      </p>
      <div className="mt-3" aria-hidden>
        <div className="relative h-2 rounded-full bg-slate-200/80">
          <div
            className={`absolute inset-y-0 left-0 rounded-full bg-[var(--hl-navy)]/70 transition-[width] duration-200 motion-reduce:transition-none`}
            style={{ width: `${widthPct}%` }}
          />
          {variant === 'prepay' ? (
            <span
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--hl-orange)] ring-[3px] ring-white"
              style={{ left: `${markerPct}%` }}
            />
          ) : null}
        </div>
        <div className="relative mt-2 flex justify-between text-[11px] text-[var(--hl-muted)]">
          <span>Start</span>
          {variant === 'prepay' ? (
            <span
              className="absolute -translate-x-1/2 font-semibold text-[var(--hl-orange)]"
              style={{ left: `${markerPct}%` }}
            >
              ↑ Prepayment
            </span>
          ) : null}
          <span>{variant === 'prepay' && shortened ? 'Earlier end' : 'End'}</span>
        </div>
      </div>
    </div>
  );
}

export {
  HomeLoanEligibilityProfile as HomeLoanEligibilitySection,
  HomeLoanPrepaymentImpact as HomeLoanPrepaymentSection,
  HomeLoanApplicationJourney as HomeLoanApplicationTimeline,
};
