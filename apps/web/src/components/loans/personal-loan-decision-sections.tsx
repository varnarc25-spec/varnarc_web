'use client';

import Link from 'next/link';
import { useId, useState, type ReactNode } from 'react';
import {
  BadgeCheck,
  Calculator,
  ClipboardCheck,
  GitCompareArrows,
  IndianRupee,
  Send,
  ShieldCheck,
  UserRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { processingFeeDisplay } from '@/lib/loan-catalog';
import {
  calculatorHref,
  financeCreditScorePath,
  financeEligibilityPath,
} from '@/lib/finance-routes';
import {
  PERSONAL_LOAN_CONSIDER_CAREFUL,
  PERSONAL_LOAN_CONSIDER_USEFUL,
  PERSONAL_LOAN_FEE_TYPES,
  PERSONAL_LOAN_SALARIED_NOTES,
  PERSONAL_LOAN_SELF_EMPLOYED_NOTES,
  PERSONAL_LOAN_TIMELINE_STEPS,
} from '@/lib/personal-loan-page';
import type { FinanceLoan } from '@/services/finance';

const ELIGIBILITY_FACTORS = [
  'Income',
  'Credit History',
  'Existing EMIs',
  'Employment',
  'Loan Amount',
  'Tenure',
] as const;

const JOURNEY_ICONS: LucideIcon[] = [
  IndianRupee,
  GitCompareArrows,
  Calculator,
  ClipboardCheck,
  Send,
  ShieldCheck,
  BadgeCheck,
  Wallet,
];

export function PersonalLoanEligibilityProfile() {
  const [employmentTab, setEmploymentTab] = useState<'salaried' | 'self-employed'>('salaried');
  const tabsId = useId();

  return (
    <section
      id="personal-loan-eligibility"
      aria-labelledby="personal-loan-eligibility-heading"
      className="full-bleed bg-[var(--pl-surface-4,#eef2f7)]"
    >
      <div className="site-container pl-section px-4">
        <p className="pl-eyebrow">Eligibility</p>
        <h2 id="personal-loan-eligibility-heading" className="pl-h2">
          What Affects Personal Loan Eligibility?
        </h2>
        <p className="pl-lede">
          Lenders assess multiple factors together. Thresholds are product-specific — this page does
          not invent universal cutoffs.
        </p>

        <div className="mt-8 grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            {/* Desktop radial with connectors */}
            <div
              className="relative mx-auto hidden aspect-square w-full max-w-[360px] md:block"
              aria-hidden
            >
              <svg viewBox="0 0 360 360" className="absolute inset-0 h-full w-full" fill="none">
                {[
                  [180, 36],
                  [52, 108],
                  [308, 108],
                  [52, 252],
                  [308, 252],
                  [180, 324],
                ].map(([x, y], i) => (
                  <line
                    key={i}
                    x1="180"
                    y1="180"
                    x2={x}
                    y2={y}
                    stroke="#c5d0de"
                    strokeWidth="1.5"
                  />
                ))}
                {[
                  [180, 36],
                  [52, 108],
                  [308, 108],
                  [52, 252],
                  [308, 252],
                  [180, 324],
                ].map(([x, y], i) => (
                  <circle key={`n-${i}`} cx={x} cy={y} r="3" fill="#94a3b8" />
                ))}
              </svg>
              <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-[var(--pl-navy)] text-white">
                <UserRound className="h-8 w-8 text-white" strokeWidth={1.75} />
              </div>
              <p className="absolute left-1/2 top-[calc(50%+4.1rem)] -translate-x-1/2 text-center text-xs font-semibold text-[var(--pl-navy)]">
                Applicant Profile
              </p>
              {(
                [
                  ['Income', 'left-1/2 top-0 -translate-x-1/2'],
                  ['Credit History', 'left-0 top-[20%]'],
                  ['Existing EMIs', 'right-0 top-[20%]'],
                  ['Employment', 'left-0 top-[64%]'],
                  ['Loan Amount', 'right-0 top-[64%]'],
                  ['Tenure', 'bottom-0 left-1/2 -translate-x-1/2'],
                ] as const
              ).map(([label, pos]) => (
                <span
                  key={label}
                  className={`absolute ${pos} rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--pl-navy)]`}
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="md:hidden">
              <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--pl-navy)] text-white">
                <UserRound className="h-7 w-7" strokeWidth={1.75} aria-hidden />
              </div>
              <p className="mb-4 text-center text-xs font-semibold text-[var(--pl-navy)]">
                Applicant Profile
              </p>
              <ul
                className="relative space-y-2.5 border-l border-[var(--pl-border)] pl-4"
                aria-label="Eligibility factors"
              >
                {ELIGIBILITY_FACTORS.map((label) => (
                  <li key={label} className="relative text-sm font-semibold text-[var(--pl-navy)]">
                    <span
                      className="absolute -left-[1.3rem] top-1.5 h-2 w-2 rounded-full bg-[var(--pl-navy)]/50"
                      aria-hidden
                    />
                    {label}
                  </li>
                ))}
                <li className="relative pt-1 text-sm font-semibold text-[var(--pl-muted)]">
                  <span
                    className="absolute -left-[1.3rem] top-2.5 h-2 w-2 rounded-full bg-[var(--pl-orange)]"
                    aria-hidden
                  />
                  Lender Assessment
                </li>
              </ul>
            </div>

            <p className="mt-6 hidden text-center text-xs font-semibold text-[var(--pl-muted)] md:block">
              ↓ Lender Assessment
            </p>
            <p className="sr-only">
              Eligibility factors include income, credit history, existing monthly obligations,
              employment or business stability, requested loan amount, requested tenure, and
              lender-specific criteria.
            </p>
          </div>

          <div>
            <div
              className="inline-flex rounded-full bg-[var(--pl-surface-2)] p-1"
              role="tablist"
              aria-label="Employment type guidance"
            >
              {(
                [
                  ['salaried', 'Salaried'],
                  ['self-employed', 'Self-Employed'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  id={`${tabsId}-${key}`}
                  aria-selected={employmentTab === key}
                  aria-controls={`${tabsId}-panel`}
                  tabIndex={employmentTab === key ? 0 : -1}
                  onClick={() => setEmploymentTab(key)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                      e.preventDefault();
                      setEmploymentTab(key === 'salaried' ? 'self-employed' : 'salaried');
                    }
                  }}
                  className={`min-h-10 rounded-full px-4 text-xs font-semibold transition motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-orange)] ${
                    employmentTab === key
                      ? 'bg-[var(--pl-navy)] text-white'
                      : 'bg-transparent text-[var(--pl-navy)] hover:bg-white/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div
              id={`${tabsId}-panel`}
              role="tabpanel"
              aria-labelledby={`${tabsId}-${employmentTab}`}
              className="mt-4 rounded-[var(--pl-radius-lg)] bg-white/70 p-5"
            >
              <ul className="space-y-2.5">
                {(employmentTab === 'salaried'
                  ? PERSONAL_LOAN_SALARIED_NOTES
                  : PERSONAL_LOAN_SELF_EMPLOYED_NOTES
                ).map((note) => (
                  <li key={note} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--pl-orange)]"
                      aria-hidden
                    />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-[var(--pl-radius-lg)] bg-white/70 p-5 sm:p-6">
          <h3 className="text-base font-bold text-[var(--pl-navy)]">Credit profile scale</h3>
          <p className="mt-1 text-sm text-slate-600">
            Credit score is one of several factors lenders may consider.
          </p>
          <div className="mt-4 max-w-xl" aria-hidden>
            <div className="flex justify-between text-xs font-semibold tabular-nums text-[var(--pl-muted)]">
              <span>300</span>
              <span>900</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gradient-to-r from-[#d5dde8] via-[#a8b8cb] to-[var(--pl-navy)]" />
            <div className="mt-2 flex justify-between text-xs font-medium text-[var(--pl-muted)]">
              <span>Lower</span>
              <span>Fair</span>
              <span>Good</span>
              <span>Strong</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-[var(--pl-muted)]">
            Educational scale only — not an approval meter.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={financeEligibilityPath({ loanType: 'personal-loan' })}
              className="inline-flex min-h-11 items-center rounded-[var(--pl-radius-md)] bg-[var(--pl-navy)] px-4 text-sm font-semibold text-white hover:bg-[var(--pl-navy-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-orange)]"
            >
              Check Personal Loan Eligibility →
            </Link>
            <Link
              href={financeCreditScorePath()}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-slate-600 hover:text-[var(--pl-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-orange)]"
            >
              Learn about credit scores →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PersonalLoanTrueCost({ loans }: { loans: FinanceLoan[] }) {
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
      id="personal-loan-true-cost"
      aria-labelledby="personal-loan-true-cost-heading"
      className="full-bleed bg-[var(--pl-surface-1,#fff)]"
    >
      <div className="site-container pl-section px-4">
        <p className="pl-eyebrow">True Cost</p>
        <h2 id="personal-loan-true-cost-heading" className="pl-h2">
          Look Beyond the Interest Rate
        </h2>
        <p className="pl-lede">
          The headline rate is only one part of the total cost of borrowing.
        </p>

        <div
          className="mt-8 flex flex-col items-stretch gap-2.5 rounded-[var(--pl-radius-lg)] bg-[var(--pl-surface-2)] px-4 py-7 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3 sm:px-7 sm:py-9"
          aria-label="Total borrowing cost formula"
        >
          <FormulaChip>Interest</FormulaChip>
          <Plus />
          <FormulaChip>Processing Fee</FormulaChip>
          <Plus />
          <FormulaChip>Other Applicable Charges</FormulaChip>
          <span
            className="flex justify-center text-lg font-bold text-[var(--pl-orange)] sm:text-base"
            aria-hidden
          >
            <span className="sm:hidden">↓</span>
            <span className="hidden sm:inline">=</span>
          </span>
          <FormulaChip accent>Total Borrowing Cost</FormulaChip>
        </div>

        <ul className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {PERSONAL_LOAN_FEE_TYPES.map((item) => (
            <li key={item.key} className="border-t border-[var(--pl-border)] pt-3.5">
              <p className="text-sm font-bold text-[var(--pl-navy)]">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.detail}</p>
            </li>
          ))}
        </ul>

        {withFees.length ? (
          <div className="mt-8 overflow-x-auto rounded-[var(--pl-radius-lg)] bg-[var(--pl-surface-2)]">
            <table className="min-w-full border-collapse text-left text-sm">
              <caption className="sr-only">Verified processing fee comparison</caption>
              <thead>
                <tr className="border-b border-[var(--pl-border)] text-xs uppercase tracking-wide text-[var(--pl-muted)]">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Lender
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Processing Fee
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Prepayment
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Foreclosure
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Other Known Charges
                  </th>
                </tr>
              </thead>
              <tbody>
                {withFees.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--pl-border)]">
                    <th scope="row" className="px-4 py-3 font-semibold text-[var(--pl-navy)]">
                      {row.lender}
                      <span className="mt-0.5 block text-xs font-normal text-slate-500">
                        {row.name}
                      </span>
                    </th>
                    <td className="px-4 py-3 tabular-nums text-slate-700">{row.fee}</td>
                    <td className="px-4 py-3 text-slate-500">Not currently available</td>
                    <td className="px-4 py-3 text-slate-500">Not currently available</td>
                    <td className="px-4 py-3 text-slate-500">Not currently available</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-6 text-sm text-[var(--pl-muted)]">
            Product-level fee comparison appears when verified processing fee data is available.
            Missing values are never shown as 0%.
          </p>
        )}
      </div>
    </section>
  );
}

function Plus() {
  return (
    <span className="flex justify-center text-sm font-bold text-[var(--pl-orange)]" aria-hidden>
      +
    </span>
  );
}

function FormulaChip({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return (
    <span
      className={`inline-flex min-h-[3.25rem] items-center justify-center rounded-[var(--pl-radius-md)] px-4 text-sm font-extrabold uppercase tracking-[0.06em] sm:min-h-[3.5rem] sm:px-6 sm:text-[0.9375rem] ${
        accent ? 'bg-[var(--pl-navy)] text-white' : 'bg-white text-[var(--pl-navy)]'
      }`}
    >
      {children}
    </span>
  );
}

export function PersonalLoanPrepaymentImpact() {
  return (
    <section
      id="personal-loan-prepayment"
      aria-labelledby="personal-loan-prepayment-heading"
      className="full-bleed bg-[var(--pl-surface-3,#faf7f2)]"
    >
      <div className="site-container pl-section px-4">
        <p className="pl-eyebrow">Prepayment</p>
        <h2 id="personal-loan-prepayment-heading" className="pl-h2">
          Could Prepayment Reduce Your Loan Cost?
        </h2>
        <p className="pl-lede">
          Prepayment may reduce remaining interest and/or remaining tenure — subject to lender
          charges and timing.
        </p>

        <div className="mt-7 space-y-6">
          <div>
            <p className="pl-metric-label">Standard repayment</p>
            <div className="mt-3" aria-hidden>
              <div className="relative h-2 rounded-full bg-slate-200/80">
                <div className="absolute inset-y-0 left-0 w-full rounded-full bg-[var(--pl-navy)]/70" />
                {[0, 25, 50, 75, 100].map((p) => (
                  <span
                    key={p}
                    className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[var(--pl-navy)] ring-2 ring-[var(--pl-surface-3)]"
                    style={{ left: `calc(${p}% - 5px)` }}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-xs text-[var(--pl-muted)]">
                <span>Start</span>
                <span>End</span>
              </div>
            </div>
          </div>

          <div>
            <p className="pl-metric-label">With prepayment</p>
            <div className="mt-3" aria-hidden>
              <div className="relative h-2 rounded-full bg-slate-200/80">
                <div className="absolute inset-y-0 left-0 w-[68%] rounded-full bg-[var(--pl-navy)]/50" />
                {[0, 24, 68].map((p) => (
                  <span
                    key={p}
                    className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[var(--pl-navy)] ring-2 ring-[var(--pl-surface-3)]"
                    style={{ left: `calc(${p}% - 5px)` }}
                  />
                ))}
                <span className="absolute left-[48%] top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--pl-orange)] ring-[3px] ring-[var(--pl-surface-3)]" />
              </div>
              <div className="relative mt-2 flex justify-between text-xs text-[var(--pl-muted)]">
                <span>Start</span>
                <span className="absolute left-[48%] -translate-x-1/2 font-semibold text-[var(--pl-orange)]">
                  ↑ Prepayment
                </span>
                <span>Earlier end</span>
              </div>
            </div>
          </div>
        </div>

        <ul className="mt-6 space-y-1.5 text-sm text-slate-600">
          <li>
            Savings depend on outstanding principal, prepayment amount, timing, rate, remaining
            tenure and lender charges.
          </li>
          <li>
            Timelines above are illustrative concepts — calculated interest/time saved appear in the
            prepayment calculator when you enter loan details.
          </li>
        </ul>

        <Link
          href={calculatorHref('loan-prepayment')}
          className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--pl-navy)] underline-offset-2 hover:text-[var(--pl-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-orange)]"
        >
          Calculate Prepayment Savings →
        </Link>
      </div>
    </section>
  );
}

export function PersonalLoanShouldYouConsider() {
  return (
    <section
      id="should-you-consider-personal-loan"
      aria-labelledby="should-you-consider-heading"
      className="full-bleed bg-[var(--pl-surface-2,#f4f6f9)]"
    >
      <div className="site-container pl-section px-4">
        <h2 id="should-you-consider-heading" className="pl-h2">
          Should You Consider a Personal Loan?
        </h2>
        <p className="pl-lede">
          Educational framing only — not financial advice or a recommendation to borrow.
        </p>

        <div className="mt-7 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[var(--pl-radius-lg)] bg-[#e8eef5] p-5 sm:p-6">
            <h3 className="text-base font-bold text-[var(--pl-navy)]">
              A Personal Loan May Be Useful When
            </h3>
            <ul className="mt-4 space-y-2.5">
              {PERSONAL_LOAN_CONSIDER_USEFUL.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-slate-600">
                  <span className="mt-0.5 text-[var(--pl-navy)]" aria-hidden>
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[var(--pl-radius-lg)] bg-[#f3ebe3] p-5 sm:p-6">
            <h3 className="text-base font-bold text-[var(--pl-navy)]">Think Carefully When</h3>
            <ul className="mt-4 space-y-2.5">
              {PERSONAL_LOAN_CONSIDER_CAREFUL.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-slate-600">
                  <span className="mt-0.5 text-[var(--pl-muted)]" aria-hidden>
                    ·
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PersonalLoanBorrowingOptions() {
  const panels = [
    {
      title: 'Personal Loan',
      points: [
        ['Collateral', 'Usually unsecured'],
        ['Repayment', 'Defined EMI'],
        ['Typical purpose', 'Defined lump-sum needs'],
        ['Key consideration', 'No pledged asset, but pricing depends on borrower/lender profile'],
      ],
      href: undefined as string | undefined,
      current: true,
    },
    {
      title: 'Credit Card',
      points: [
        ['Collateral', 'Usually unsecured'],
        ['Repayment', 'Revolving / flexible'],
        ['Typical purpose', 'Short-term or revolving spend'],
        [
          'Key consideration',
          'Carrying balances can result in substantial borrowing cost depending on card terms',
        ],
      ],
      href: '/finance/credit-cards',
    },
    {
      title: 'Loan Against Property',
      points: [
        ['Collateral', 'Property'],
        ['Repayment', 'Defined EMI'],
        ['Typical purpose', 'Larger financing needs'],
        ['Key consideration', 'Property is pledged and may be at risk if obligations are not met'],
      ],
      href: '/finance/loans/loan-against-property',
    },
    {
      title: 'Gold Loan',
      points: [
        ['Collateral', 'Eligible gold'],
        ['Repayment', 'Lender-specific terms'],
        ['Typical purpose', 'Secured short-to-medium needs'],
        [
          'Key consideration',
          'Secured borrowing with lender-specific valuation and repayment terms',
        ],
      ],
      href: '/finance/loans/gold-loan',
    },
  ];

  return (
    <section
      id="compare-borrowing-options"
      aria-labelledby="compare-borrowing-options-heading"
      className="full-bleed bg-[var(--pl-surface-1,#fff)]"
    >
      <div className="site-container pl-section px-4">
        <h2 id="compare-borrowing-options-heading" className="pl-h2">
          Compare Other Borrowing Options
        </h2>
        <p className="pl-lede">
          No option is universally cheaper or better — match the product to purpose, risk and
          repayment comfort.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {panels.map((panel) => (
            <article
              key={panel.title}
              className={`flex h-full flex-col rounded-[var(--pl-radius-lg)] p-5 transition motion-reduce:transition-none ${
                panel.current
                  ? 'bg-[var(--pl-navy)] text-white'
                  : 'bg-[var(--pl-surface-2)] text-[var(--pl-navy)] hover:bg-[var(--pl-surface-4)]'
              }`}
            >
              {panel.current ? (
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#fdba74]">
                  You&apos;re viewing
                </p>
              ) : (
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-transparent">
                  Option
                </p>
              )}
              <h3 className={`mt-1 text-base font-bold ${panel.current ? 'text-white' : ''}`}>
                {panel.title}
              </h3>
              <dl className="mt-3 flex-1 space-y-2.5">
                {panel.points.map(([label, value]) => (
                  <div key={label}>
                    <dt
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        panel.current ? 'text-[#fdba74]' : 'text-[var(--pl-muted)]'
                      }`}
                    >
                      {label}
                    </dt>
                    <dd
                      className={`mt-0.5 text-sm leading-relaxed ${
                        panel.current ? 'text-white/90' : 'text-slate-600'
                      }`}
                    >
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              {panel.href ? (
                <Link
                  href={panel.href}
                  className="mt-4 inline-flex min-h-10 text-xs font-semibold text-[var(--pl-navy)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-orange)]"
                >
                  Explore →
                </Link>
              ) : (
                <span className="mt-4 inline-flex min-h-10 text-xs font-semibold text-[#fdba74]">
                  Current option
                </span>
              )}
            </article>
          ))}
        </div>

        <Link
          href="/finance/loans"
          className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--pl-navy)] underline-offset-2 hover:text-[var(--pl-orange)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-orange)]"
        >
          Compare Borrowing Options →
        </Link>
      </div>
    </section>
  );
}

export function PersonalLoanApplicationJourney() {
  return (
    <section
      id="personal-loan-application-journey"
      aria-labelledby="personal-loan-application-journey-heading"
      className="full-bleed bg-[var(--pl-surface-4,#eef2f7)]"
    >
      <div className="site-container pl-section px-4">
        <h2 id="personal-loan-application-journey-heading" className="pl-h2">
          How a Personal Loan Application Typically Works
        </h2>
        <p className="pl-lede">
          A typical path from planning to disbursement. Steps and timelines vary by lender.
        </p>

        {/* Mobile / tablet vertical */}
        <ol className="relative mt-8 space-y-0 xl:hidden">
          {PERSONAL_LOAN_TIMELINE_STEPS.map((step, index) => {
            const Icon = JOURNEY_ICONS[index] ?? BadgeCheck;
            const isLast = index === PERSONAL_LOAN_TIMELINE_STEPS.length - 1;
            return (
              <li key={step} className="relative flex gap-3 pb-5">
                {!isLast ? (
                  <span
                    className="absolute left-[15px] top-8 bottom-0 w-px bg-[var(--pl-border)]"
                    aria-hidden
                  />
                ) : null}
                <span className="relative z-[1] inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--pl-navy)] text-white">
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pl-muted)]">
                    Step {index + 1}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-[var(--pl-navy)]">{step}</p>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Large desktop: two connected rows of 4 */}
        <div className="mt-8 hidden xl:block">
          {[0, 1].map((row) => {
            const slice = PERSONAL_LOAN_TIMELINE_STEPS.slice(row * 4, row * 4 + 4);
            return (
              <ol
                key={row}
                className={`relative grid grid-cols-4 gap-4 ${row === 1 ? 'mt-8' : ''}`}
              >
                {slice.map((step, i) => {
                  const index = row * 4 + i;
                  const Icon = JOURNEY_ICONS[index] ?? BadgeCheck;
                  const isLastInRow = i === slice.length - 1;
                  return (
                    <li key={step} className="relative min-w-0 pr-4">
                      {!isLastInRow ? (
                        <span
                          className="absolute left-8 right-0 top-[15px] h-px bg-[var(--pl-border)]"
                          aria-hidden
                        />
                      ) : null}
                      <span className="relative z-[1] inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--pl-navy)] text-white">
                        <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                      </span>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--pl-muted)]">
                        Step {index + 1}
                      </p>
                      <p className="mt-0.5 text-sm font-bold leading-snug text-[var(--pl-navy)]">
                        {step}
                      </p>
                    </li>
                  );
                })}
              </ol>
            );
          })}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-[var(--pl-muted)]">
          Varnarc helps users compare and calculate. Final eligibility, verification, approval and
          disbursement are determined by the lender. Instant approval, same-day disbursement or
          guaranteed approval are not promised unless tied to a specific verified product and
          appropriately qualified.
        </p>
      </div>
    </section>
  );
}

export {
  PersonalLoanEligibilityProfile as PersonalLoanEligibilitySection,
  PersonalLoanPrepaymentImpact as PersonalLoanPrepaymentSection,
  PersonalLoanBorrowingOptions as PersonalLoanOtherBorrowingOptions,
  PersonalLoanApplicationJourney as PersonalLoanApplicationTimeline,
};
