'use client';

import Link from 'next/link';
import type { FinanceLoan } from '@/services/finance';
import type { CursorMeta } from '@/services/api-client';
import { CmsMediaImage } from '@/components/cms/cms-media-image';
import {
  formatInr,
  formatLoanRateLabel,
  formatTenureMonths,
  lenderInitials,
  loanAmountLabel,
  loanDetailHref,
  toNumber,
} from '@/components/loans/loan-format';
import {
  LoanCompareShell,
  LoanCompareStickyCta,
  LoanCompareToggle,
} from '@/components/loans/loan-compare-toggle.client';
import { LoanSortSelect } from '@/components/loans/loan-filters';
import { usePersonalLoanDecision } from '@/components/loans/personal-loan-decision-context';
import {
  prepareLoanCatalog,
  processingFeeDisplay,
  shouldExposePaginationUi,
} from '@/lib/loan-catalog';
import { calculatorHref, financeEligibilityPath } from '@/lib/finance-routes';
import { illustrativePersonalLoanOfferEmi } from '@/lib/personal-loan-page';

function OfferRow({ loan }: { loan: FinanceLoan }) {
  const { amount, tenureMonths } = usePersonalLoanDecision();
  const rate = formatLoanRateLabel(loan);
  const amountLabel = loanAmountLabel(loan);
  const tenure = formatTenureMonths(loan.tenureMin, loan.tenureMax);
  const fee = processingFeeDisplay(loan);
  const href = loanDetailHref(loan);
  const lenderName = loan.bank?.name ?? 'Lender';
  const offerEmi = illustrativePersonalLoanOfferEmi(loan, amount, tenureMonths);
  const startingRate = toNumber(loan.interestRateMin) ?? toNumber(loan.interestRate);

  const emiCalcHref = calculatorHref('personal-loan-emi', {
    amount,
    rate: startingRate ?? undefined,
    tenure: Math.round(tenureMonths / 12),
    tenureUnit: 'years',
  });

  return (
    <article className="rounded-[var(--pl-radius-md)] bg-white p-4 lg:rounded-none lg:bg-transparent lg:p-0">
      {/* Mobile card */}
      <div className="space-y-3 lg:hidden">
        <div className="flex items-start gap-3">
          <LenderMark loan={loan} lenderName={lenderName} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500">{lenderName}</p>
            <h3 className="mt-0.5 text-sm font-bold leading-snug text-[#0b1f3a]">
              <Link
                href={href}
                className="hover:text-[#f97316] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]"
              >
                {loan.name}
              </Link>
            </h3>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
          <div>
            <dt className="pl-metric-label">Interest Rate</dt>
            <dd className="mt-0.5 text-sm font-bold tabular-nums text-[var(--pl-navy)]">
              {rate.label}
            </dd>
          </div>
          <div>
            <dt className="pl-metric-label">Illustrative EMI</dt>
            <dd className="mt-0.5 text-sm font-bold tabular-nums text-[var(--pl-navy)]">
              {offerEmi.status === 'ok'
                ? `${formatInr(Math.round(offerEmi.monthlyEmi))}/mo`
                : offerEmi.message}
            </dd>
          </div>
          <div>
            <dt className="pl-metric-label">Loan Amount</dt>
            <dd className="mt-0.5 text-xs font-semibold text-[var(--pl-navy)]">
              {amountLabel ?? 'Not currently available'}
            </dd>
          </div>
          <div>
            <dt className="pl-metric-label">Tenure</dt>
            <dd className="mt-0.5 text-xs font-semibold text-[var(--pl-navy)]">
              {tenure ?? 'Not currently available'}
            </dd>
          </div>
          <div>
            <dt className="pl-metric-label">Processing Fee</dt>
            <dd className="mt-0.5 text-xs font-semibold text-[var(--pl-navy)]">{fee}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={href}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#0b1f3a] px-3 text-xs font-semibold text-white hover:bg-[#122b4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]"
          >
            View Details
          </Link>
          <Link
            href={emiCalcHref}
            className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:text-[#f97316] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]"
          >
            Calculate EMI
          </Link>
          <LoanCompareToggle loanId={loan.id} />
        </div>
      </div>

      {/* Desktop row */}
      <div className="hidden grid-cols-[minmax(10rem,1.2fr)_minmax(5.5rem,0.7fr)_minmax(6rem,0.8fr)_minmax(5.5rem,0.7fr)_minmax(5.5rem,0.7fr)_minmax(5rem,0.65fr)_minmax(9rem,1fr)] items-center gap-3 border-b border-[var(--pl-border)] py-3.5 lg:grid">
        <div className="flex min-w-0 items-center gap-2.5">
          <LenderMark loan={loan} lenderName={lenderName} />
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-[var(--pl-muted)]">{lenderName}</p>
            <p className="truncate text-sm font-bold text-[var(--pl-navy)]">
              <Link
                href={href}
                className="hover:text-[var(--pl-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-orange)]"
              >
                {loan.name}
              </Link>
            </p>
          </div>
        </div>
        <p className="text-sm font-bold tabular-nums text-[var(--pl-navy)]">{rate.label}</p>
        <div>
          <p className="pl-metric-label">Illustrative EMI</p>
          <p className="text-sm font-bold tabular-nums text-[var(--pl-navy)]">
            {offerEmi.status === 'ok'
              ? `${formatInr(Math.round(offerEmi.monthlyEmi))}/mo`
              : offerEmi.message}
          </p>
        </div>
        <p className="text-sm tabular-nums text-slate-700">{amountLabel ?? '—'}</p>
        <p className="text-sm text-slate-700">{tenure ?? '—'}</p>
        <p className="text-sm text-slate-700">{fee}</p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href={href}
            className="inline-flex min-h-9 items-center rounded-lg bg-[#0b1f3a] px-3 text-xs font-semibold text-white hover:bg-[#122b4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]"
          >
            View Details
          </Link>
          <Link
            href={emiCalcHref}
            className="inline-flex min-h-9 items-center rounded-lg px-2.5 text-xs font-semibold text-slate-600 hover:text-[#f97316] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]"
          >
            Calculate EMI
          </Link>
          <LoanCompareToggle loanId={loan.id} />
        </div>
      </div>
    </article>
  );
}

function LenderMark({ loan, lenderName }: { loan: FinanceLoan; lenderName: string }) {
  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-[#f8fafc]">
      {loan.bank?.logoUrl ? (
        <CmsMediaImage
          src={loan.bank.logoUrl}
          alt={loan.bank.logoAlt?.trim() || `${lenderName} logo`}
          width={40}
          height={40}
          sizes="40px"
          objectFit="contain"
          imgClassName="p-1"
          loading="lazy"
          fetchPriority="low"
        />
      ) : (
        <span className="text-xs font-bold tracking-wide text-[#0b1f3a]" aria-hidden>
          {lenderInitials(lenderName)}
        </span>
      )}
    </div>
  );
}

/**
 * Analytical comparison rows for Personal Loan offers (not hub discovery cards).
 */
export function PersonalLoanOfferResults({
  loans,
  featuredLoans,
  currentSort,
  pathname = '/finance/loans/personal-loan',
  cursorMeta,
  nextPageHref,
}: {
  loans: FinanceLoan[];
  featuredLoans: FinanceLoan[];
  currentSort?: string;
  pathname?: string;
  cursorMeta?: CursorMeta | null;
  nextPageHref?: string | null;
}) {
  const { catalog } = prepareLoanCatalog(loans, featuredLoans);
  const showPagination =
    Boolean(nextPageHref) && shouldExposePaginationUi(loans.length, cursorMeta ?? null);

  return (
    <LoanCompareShell>
      <div className="min-w-0 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2
              id="personal-loan-offers-heading"
              className="text-lg font-extrabold tracking-tight text-[#0b1f3a] sm:text-xl"
            >
              Compare Personal Loan Offers{' '}
              <span className="text-sm font-semibold text-slate-500">({catalog.length})</span>
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Illustrative EMI uses your selected amount and tenure with each product&apos;s
              starting rate when available.
            </p>
          </div>
          <LoanSortSelect currentSort={currentSort} pathname={pathname} />
        </div>

        {catalog.length ? (
          <div className="overflow-hidden rounded-[var(--pl-radius-lg)] bg-white">
            <div
              className="hidden grid-cols-[minmax(10rem,1.2fr)_minmax(5.5rem,0.7fr)_minmax(6rem,0.8fr)_minmax(5.5rem,0.7fr)_minmax(5.5rem,0.7fr)_minmax(5rem,0.65fr)_minmax(9rem,1fr)] gap-3 border-b border-[var(--pl-border)] bg-[var(--pl-navy)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white lg:grid"
              role="row"
            >
              <span>Lender / Product</span>
              <span>Interest Rate</span>
              <span>Illustrative EMI</span>
              <span>Loan Amount</span>
              <span>Tenure</span>
              <span>Fee</span>
              <span className="text-right">Action</span>
            </div>
            <div className="divide-y divide-[var(--pl-border)] px-0 lg:px-4">
              {catalog.map((loan) => (
                <OfferRow key={loan.id} loan={loan} />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-[var(--pl-radius-lg)] bg-white px-4 py-5 text-center sm:px-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pl-muted)]">
              Search results
            </p>
            <h3 className="mt-1 text-sm font-bold text-[var(--pl-navy)]">
              No matching Personal Loans
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-[var(--pl-muted)] sm:text-sm">
              Try adjusting your amount, tenure or filters to explore more available options.
            </p>
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={pathname}
                className="inline-flex min-h-10 items-center rounded-[var(--pl-radius-md)] bg-[var(--pl-navy)] px-4 text-xs font-semibold text-white transition hover:bg-[var(--pl-navy-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-orange)]"
              >
                Clear Filters
              </Link>
              <a
                href="#personal-loan-snapshot"
                className="inline-flex min-h-10 items-center text-xs font-semibold text-slate-600 transition hover:text-[var(--pl-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pl-orange)]"
              >
                Adjust Amount
              </a>
            </div>
          </div>
        )}

        {showPagination && nextPageHref ? (
          <div className="flex justify-center pt-2">
            <Link
              href={nextPageHref}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-[#0b1f3a] ring-1 ring-slate-200/80 hover:text-[#f97316] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]"
            >
              Load more personal loans →
            </Link>
          </div>
        ) : null}

        <p className="text-xs text-slate-500">
          Optional:{' '}
          <Link
            href={financeEligibilityPath({ loanType: 'personal-loan' })}
            className="font-semibold text-slate-600 underline-offset-2 hover:text-[#f97316] hover:underline"
          >
            Check Eligibility
          </Link>{' '}
          for a fuller profile estimate. Product EMI links never use maximum loan amounts as
          principal.
        </p>

        <LoanCompareStickyCta />
      </div>
    </LoanCompareShell>
  );
}
