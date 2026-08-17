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
import { useHomeLoanDecision } from '@/components/loans/home-loan-decision-context';
import {
  prepareLoanCatalog,
  processingFeeDisplay,
  shouldExposePaginationUi,
} from '@/lib/loan-catalog';
import { calculatorHref, financeEligibilityPath } from '@/lib/finance-routes';
import { formatRateTypeLabel, illustrativeHomeLoanOfferEmi } from '@/lib/home-loan-page';
import { getRateFreshness } from '@/lib/loan-rate-freshness';
import type { LoanFilterState } from '@/components/loans/loan-filters';

function hasHomeLoanCatalogFilters(current?: LoanFilterState): boolean {
  if (!current) return false;
  return Boolean(
    current.bankId ||
    current.rateMax ||
    current.amountMin ||
    current.tenureMin ||
    current.processingFeeMax ||
    current.creditScoreMaxRequired ||
    current.employmentType,
  );
}

function OfferRow({ loan }: { loan: FinanceLoan }) {
  const { loanRequirement, tenureMonths } = useHomeLoanDecision();
  const rate = formatLoanRateLabel(loan);
  const amountLabel = loanAmountLabel(loan);
  const tenure = formatTenureMonths(loan.tenureMin, loan.tenureMax);
  const fee = processingFeeDisplay(loan);
  const href = loanDetailHref(loan);
  const lenderName = loan.bank?.name ?? 'Lender';
  const offerEmi = illustrativeHomeLoanOfferEmi(loan, loanRequirement, tenureMonths);
  const startingRate = toNumber(loan.interestRateMin) ?? toNumber(loan.interestRate);
  const rateTypeLabel = formatRateTypeLabel(loan.rateType);
  const freshness = getRateFreshness(loan.rateLastVerifiedAt);

  const emiCalcHref = calculatorHref('home-loan-emi', {
    amount: loanRequirement,
    rate: startingRate ?? undefined,
    tenure: Math.round(tenureMonths / 12),
    tenureUnit: 'years',
  });

  return (
    <article className="rounded-[var(--hl-radius-md)] bg-white p-4 lg:rounded-none lg:bg-transparent lg:p-0">
      {/* Mobile card */}
      <div className="space-y-3 lg:hidden">
        <div className="flex items-start gap-3">
          <LenderMark loan={loan} lenderName={lenderName} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate text-xs font-medium text-slate-500">{lenderName}</p>
              {loan.featured ? (
                <span className="rounded bg-[var(--hl-navy)]/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                  Featured
                </span>
              ) : null}
              {loan.sponsored ? (
                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-900">
                  Sponsored
                </span>
              ) : null}
            </div>
            <h3 className="mt-0.5 text-sm font-bold leading-snug text-[var(--hl-navy)]">
              <Link
                href={href}
                className="hover:text-[var(--hl-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)]"
              >
                {loan.name}
              </Link>
            </h3>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
          <div>
            <dt className="hl-metric-label">Interest Rate</dt>
            <dd className="mt-0.5 text-sm font-bold tabular-nums text-[var(--hl-navy)]">
              {rate.label}
            </dd>
          </div>
          <div>
            <dt className="hl-metric-label">Illustrative EMI</dt>
            <dd className="mt-0.5 text-sm font-bold tabular-nums text-[var(--hl-navy)]">
              {offerEmi.status === 'ok'
                ? `${formatInr(Math.round(offerEmi.monthlyEmi))}/mo`
                : offerEmi.message}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="hl-metric-label">Rate Type</dt>
            <dd className="mt-0.5 text-sm font-bold text-[var(--hl-navy)]">{rateTypeLabel}</dd>
          </div>
          <div>
            <dt className="hl-metric-label">Loan Amount</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--hl-navy)]">
              {amountLabel ?? 'Not currently available'}
            </dd>
          </div>
          <div>
            <dt className="hl-metric-label">Tenure</dt>
            <dd className="mt-0.5 text-sm font-semibold text-[var(--hl-navy)]">
              {tenure ?? 'Not currently available'}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="hl-metric-label">Processing Fee</dt>
            <dd className="mt-0.5 text-sm font-semibold text-[var(--hl-navy)]">{fee}</dd>
          </div>
          <div className="col-span-2">
            <dt className="hl-metric-label">Verified Date</dt>
            <dd className="mt-0.5 text-sm font-semibold text-[var(--hl-navy)]">
              {freshness.verifiedLabel
                ? `Rates verified: ${freshness.verifiedLabel}`
                : 'Not currently available'}
            </dd>
            {freshness.publicNotice ? (
              <p className="mt-1 text-xs text-[var(--hl-muted)]">{freshness.publicNotice}</p>
            ) : null}
          </div>
        </dl>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={href}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--hl-navy)] px-3 text-xs font-semibold !text-white hover:bg-[var(--hl-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)]"
          >
            View Details
          </Link>
          <Link
            href={emiCalcHref}
            className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:text-[var(--hl-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)]"
          >
            Calculate EMI
          </Link>
          <LoanCompareToggle loanId={loan.id} />
        </div>
      </div>

      {/* Desktop row */}
      <div className="hidden grid-cols-[minmax(9rem,1.1fr)_minmax(4.5rem,0.6fr)_minmax(4.5rem,0.65fr)_minmax(5.5rem,0.75fr)_minmax(4.5rem,0.6fr)_minmax(4.5rem,0.6fr)_minmax(4rem,0.55fr)_minmax(8.5rem,0.95fr)] items-center gap-2.5 border-b border-[var(--hl-border)] py-3.5 lg:grid">
        <div className="flex min-w-0 items-center gap-2.5">
          <LenderMark loan={loan} lenderName={lenderName} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1">
              <p className="truncate text-[11px] font-medium text-[var(--hl-muted)]">
                {lenderName}
              </p>
              {loan.featured ? (
                <span className="rounded bg-[var(--hl-navy)]/90 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-white">
                  Featured
                </span>
              ) : null}
              {loan.sponsored ? (
                <span className="rounded bg-amber-50 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-amber-900">
                  Sponsored
                </span>
              ) : null}
            </div>
            <p className="truncate text-sm font-bold text-[var(--hl-navy)]">
              <Link
                href={href}
                className="hover:text-[var(--hl-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)]"
              >
                {loan.name}
              </Link>
            </p>
            {freshness.verifiedLabel ? (
              <p className="mt-0.5 truncate text-[11px] text-[var(--hl-muted)]">
                Rates verified: {freshness.verifiedLabel}
                {freshness.publicNotice ? ` · ${freshness.publicNotice}` : ''}
              </p>
            ) : (
              <p className="mt-0.5 truncate text-[11px] text-[var(--hl-muted)]">
                Verified date: Not currently available
              </p>
            )}
          </div>
        </div>
        <p className="text-sm font-bold tabular-nums text-[var(--hl-navy)]">{rate.label}</p>
        <p className="text-sm font-bold text-[var(--hl-navy)]">{rateTypeLabel}</p>
        <div>
          <p className="hl-metric-label">Illustrative EMI</p>
          <p className="text-sm font-bold tabular-nums text-[var(--hl-navy)]">
            {offerEmi.status === 'ok'
              ? `${formatInr(Math.round(offerEmi.monthlyEmi))}/mo`
              : offerEmi.message}
          </p>
        </div>
        <p className="text-sm tabular-nums text-slate-700">
          {amountLabel ?? 'Not currently available'}
        </p>
        <p className="text-sm text-slate-700">{tenure ?? 'Not currently available'}</p>
        <p className="text-sm text-slate-700">{fee}</p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href={href}
            className="inline-flex min-h-9 items-center rounded-lg bg-[var(--hl-navy)] px-3 text-xs font-semibold !text-white hover:bg-[var(--hl-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)]"
          >
            View Details
          </Link>
          <Link
            href={emiCalcHref}
            className="inline-flex min-h-9 items-center rounded-lg px-2.5 text-xs font-semibold text-slate-600 hover:text-[var(--hl-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)]"
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
        <span className="text-[10px] font-bold tracking-wide text-[var(--hl-navy)]" aria-hidden>
          {lenderInitials(lenderName)}
        </span>
      )}
    </div>
  );
}

/**
 * Analytical comparison rows for Home Loan offers (not hub discovery cards).
 */
export function HomeLoanOfferResults({
  loans,
  featuredLoans,
  currentSort,
  pathname = '/finance/loans/home-loan',
  cursorMeta,
  nextPageHref,
  filterState,
  loansFetchFailed = false,
}: {
  loans: FinanceLoan[];
  featuredLoans: FinanceLoan[];
  currentSort?: string;
  pathname?: string;
  cursorMeta?: CursorMeta | null;
  nextPageHref?: string | null;
  filterState?: LoanFilterState;
  loansFetchFailed?: boolean;
}) {
  const { catalog } = prepareLoanCatalog(loans, featuredLoans);
  const showPagination =
    Boolean(nextPageHref) && shouldExposePaginationUi(loans.length, cursorMeta ?? null);
  const filtersActive = hasHomeLoanCatalogFilters(filterState);

  return (
    <LoanCompareShell>
      <div className="min-w-0 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2
              id="home-loan-offers-heading"
              className="text-lg font-extrabold tracking-tight text-[var(--hl-navy)] sm:text-xl"
            >
              Compare Home Loan Offers{' '}
              <span className="text-sm font-semibold text-slate-500">({catalog.length})</span>
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Illustrative EMI uses your loan requirement and tenure with each product&apos;s
              starting rate when available.
            </p>
          </div>
          <LoanSortSelect currentSort={currentSort} pathname={pathname} />
        </div>

        {loansFetchFailed ? (
          <div className="rounded-[var(--hl-radius-md)] bg-white px-4 py-4 text-center sm:px-5">
            <h3 className="text-sm font-bold text-[var(--hl-navy)]">
              We couldn&apos;t load Home Loan offers right now
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-[var(--hl-muted)]">
              Please try again in a moment. Planning tools above remain available.
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={pathname}
                className="inline-flex min-h-10 items-center rounded-[var(--hl-radius-md)] bg-[var(--hl-navy)] px-4 text-sm font-semibold !text-white transition duration-150 hover:bg-[var(--hl-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)]"
              >
                Try again
              </Link>
            </div>
          </div>
        ) : catalog.length ? (
          <div className="overflow-hidden rounded-[var(--hl-radius-lg)] bg-white">
            <div
              className="hidden grid-cols-[minmax(9rem,1.1fr)_minmax(4.5rem,0.6fr)_minmax(4.5rem,0.65fr)_minmax(5.5rem,0.75fr)_minmax(4.5rem,0.6fr)_minmax(4.5rem,0.6fr)_minmax(4rem,0.55fr)_minmax(8.5rem,0.95fr)] gap-2.5 border-b border-[var(--hl-border)] bg-[var(--hl-navy)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white lg:grid"
              role="row"
            >
              <span>Lender / Product</span>
              <span>Rate</span>
              <span>Rate Type</span>
              <span>Illustrative EMI</span>
              <span>Loan Amount</span>
              <span>Tenure</span>
              <span>Fee</span>
              <span className="text-right">Action</span>
            </div>
            <div className="divide-y divide-[var(--hl-border)] px-0 lg:px-4">
              {catalog.map((loan) => (
                <OfferRow key={loan.id} loan={loan} />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-[var(--hl-radius-md)] bg-white px-4 py-3 text-center sm:px-5">
            <div
              className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--hl-surface-4)]"
              aria-hidden
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 text-[var(--hl-navy)]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-[var(--hl-navy)]">
              {filtersActive
                ? 'No matching Home Loans'
                : "Home Loan offers aren't listed right now"}
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-[var(--hl-muted)]">
              {filtersActive
                ? 'Try changing your loan amount, tenure or filters to explore available options.'
                : 'Check back soon, or continue with the planning tools above while products are being updated.'}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-3">
              {filtersActive ? (
                <Link
                  href={pathname}
                  className="inline-flex min-h-10 items-center justify-center rounded-[var(--hl-radius-md)] bg-[var(--hl-navy)] px-4 text-sm font-semibold !text-white transition duration-150 hover:bg-[var(--hl-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)]"
                >
                  Clear Filters
                </Link>
              ) : null}
              <a
                href="#home-loan-snapshot"
                className="inline-flex min-h-10 items-center justify-center rounded-[var(--hl-radius-md)] border border-[var(--hl-border)] bg-white px-4 text-sm font-semibold text-[var(--hl-navy)] transition duration-150 hover:border-[var(--hl-navy)]/30 hover:text-[var(--hl-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)]"
              >
                Adjust Loan Amount
              </a>
            </div>
          </div>
        )}

        {showPagination && nextPageHref ? (
          <div className="flex justify-center pt-2">
            <Link
              href={nextPageHref}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-[var(--hl-navy)] ring-1 ring-slate-200/80 hover:text-[var(--hl-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hl-orange)]"
            >
              Load more home loans →
            </Link>
          </div>
        ) : null}

        <p className="text-xs text-slate-500">
          Optional:{' '}
          <Link
            href={financeEligibilityPath({ loanType: 'home-loan' })}
            className="font-semibold text-slate-600 underline-offset-2 hover:text-[var(--hl-orange)] hover:underline"
          >
            Check Eligibility
          </Link>{' '}
          for a fuller profile estimate. Product EMI links use your selected loan requirement — not
          maximum product amounts.
        </p>

        <LoanCompareStickyCta />
      </div>
    </LoanCompareShell>
  );
}
