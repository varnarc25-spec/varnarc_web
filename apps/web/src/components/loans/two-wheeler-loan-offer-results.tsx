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
import { useTwoWheelerDecision } from '@/components/loans/two-wheeler-loan-decision-context';
import {
  prepareLoanCatalog,
  processingFeeDisplay,
  shouldExposePaginationUi,
} from '@/lib/loan-catalog';
import { calculatorHref, financeEligibilityPath } from '@/lib/finance-routes';
import { formatTwRateTypeLabel, illustrativeTwOfferEmi } from '@/lib/two-wheeler-loan-page';
import {
  filterTwLoanCatalog,
  formatTwFinancingPercentLabel,
  formatTwVehicleConditionLabel,
  resolveTwProductFields,
} from '@/lib/two-wheeler-loan-product';
import { getRateFreshness } from '@/lib/loan-rate-freshness';
import type { LoanFilterState } from '@/components/loans/loan-filters';
import { trackAnalyticsEvent } from '@/lib/analytics-client';
import { useMemo } from 'react';

function hasTwCatalogFilters(current?: LoanFilterState): boolean {
  if (!current) return false;
  return Boolean(
    current.bankId ||
    current.rateMax ||
    current.amountMin ||
    current.tenureMin ||
    current.processingFeeMax ||
    current.creditScoreMaxRequired ||
    current.employmentType ||
    current.vehicleCondition ||
    current.financingPercentMin,
  );
}

function OfferRow({ loan }: { loan: FinanceLoan }) {
  const { loanRequirement, tenureMonths } = useTwoWheelerDecision();
  const rate = formatLoanRateLabel(loan);
  const amountLabel = loanAmountLabel(loan);
  const tenure = formatTenureMonths(loan.tenureMin, loan.tenureMax);
  const fee = processingFeeDisplay(loan);
  const href = loanDetailHref(loan);
  const lenderName = loan.bank?.name ?? 'Lender';
  const offerEmi = illustrativeTwOfferEmi(loan, loanRequirement, tenureMonths);
  const startingRate = toNumber(loan.interestRateMin) ?? toNumber(loan.interestRate);
  const rateTypeLabel = formatTwRateTypeLabel(loan.rateType);
  const freshness = getRateFreshness(loan.rateLastVerifiedAt);
  const twFields = resolveTwProductFields(loan);
  const vehicleLabel = formatTwVehicleConditionLabel(twFields.vehicleCondition);

  const emiCalcHref = calculatorHref('bike-loan-emi', {
    amount: loanRequirement,
    rate: startingRate ?? undefined,
    tenure: Math.round(tenureMonths / 12),
    tenureUnit: 'years',
  });

  return (
    <article className="rounded-[var(--tw-radius-md)] bg-white p-4 lg:rounded-none lg:bg-transparent lg:p-0">
      <div className="space-y-3 lg:hidden">
        <div className="flex items-start gap-3">
          <LenderMark loan={loan} lenderName={lenderName} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-500">{lenderName}</p>
            <h3 className="mt-0.5 text-sm font-bold leading-snug text-[var(--tw-navy)]">
              <Link
                href={href}
                className="hover:text-[var(--tw-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tw-orange)]"
              >
                {loan.name}
              </Link>
            </h3>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--tw-muted)]">
              Interest Rate
            </dt>
            <dd className="mt-0.5 text-sm font-bold tabular-nums text-[var(--tw-navy)]">
              {rate.label}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--tw-muted)]">
              Illustrative EMI
            </dt>
            <dd className="mt-0.5 text-sm font-bold tabular-nums text-[var(--tw-navy)]">
              {offerEmi.status === 'ok'
                ? `${formatInr(Math.round(offerEmi.monthlyEmi))}/mo`
                : offerEmi.message}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--tw-muted)]">
              Loan Amount
            </dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--tw-navy)]">
              {amountLabel ?? 'Not currently available'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--tw-muted)]">
              Tenure
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-[var(--tw-navy)]">
              {tenure ?? 'Not currently available'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--tw-muted)]">
              New / Used
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-[var(--tw-navy)]">{vehicleLabel}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--tw-muted)]">
              Processing Fee
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-[var(--tw-navy)]">{fee}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--tw-muted)]">
              Verified Date
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-[var(--tw-navy)]">
              {freshness.verifiedLabel
                ? `Rates verified: ${freshness.verifiedLabel}`
                : 'Not currently available'}
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={href}
            onClick={() => {
              try {
                trackAnalyticsEvent({
                  eventType: 'custom',
                  entityType: 'two_wheeler_loan',
                  entityId: loan.id,
                  metadata: { action: 'tw_offer_viewed' },
                });
              } catch {
                /* optional */
              }
            }}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--tw-navy)] px-3 text-xs font-semibold !text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tw-orange)]"
          >
            View Details
          </Link>
          <Link
            href={emiCalcHref}
            className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:text-[var(--tw-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tw-orange)]"
          >
            Calculate EMI
          </Link>
          <LoanCompareToggle loanId={loan.id} />
        </div>
      </div>

      {/* Desktop row */}
      <div className="hidden grid-cols-[minmax(8rem,1.1fr)_minmax(3.5rem,0.45fr)_minmax(4rem,0.55fr)_minmax(4rem,0.55fr)_minmax(5rem,0.7fr)_minmax(4rem,0.55fr)_minmax(3.75rem,0.5fr)_minmax(8rem,0.9fr)] items-center gap-2 border-b border-[var(--tw-border)] py-3.5 lg:grid">
        <div className="flex min-w-0 items-center gap-2.5">
          <LenderMark loan={loan} lenderName={lenderName} />
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-[var(--tw-muted)]">{lenderName}</p>
            <p className="truncate text-sm font-bold text-[var(--tw-navy)]">
              <Link
                href={href}
                className="hover:text-[var(--tw-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tw-orange)]"
              >
                {loan.name}
              </Link>
            </p>
            {freshness.verifiedLabel ? (
              <p className="mt-0.5 truncate text-xs text-[var(--tw-muted)]">
                Rates verified: {freshness.verifiedLabel}
              </p>
            ) : null}
          </div>
        </div>
        <p className="text-sm font-bold tabular-nums text-[var(--tw-navy)]">{rate.label}</p>
        <div>
          <p className="text-sm font-bold tabular-nums text-[var(--tw-navy)]">
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
        <p className="text-xs font-semibold text-slate-600">{vehicleLabel}</p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href={href}
            className="inline-flex min-h-9 items-center rounded-lg bg-[var(--tw-navy)] px-3 text-xs font-semibold !text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tw-orange)]"
          >
            View Details
          </Link>
          <Link
            href={emiCalcHref}
            className="inline-flex min-h-9 items-center rounded-lg px-2.5 text-xs font-semibold text-slate-600 hover:text-[var(--tw-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tw-orange)]"
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
        <span className="text-xs font-bold tracking-wide text-[var(--tw-navy)]" aria-hidden>
          {lenderInitials(lenderName)}
        </span>
      )}
    </div>
  );
}

export function TwoWheelerLoanOfferResults({
  loans,
  featuredLoans,
  currentSort,
  pathname = '/finance/loans/two-wheeler-loan',
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
  const { catalog: baseCatalog } = prepareLoanCatalog(loans, featuredLoans);
  const catalog = useMemo(
    () =>
      filterTwLoanCatalog(baseCatalog, {
        vehicleCondition: filterState?.vehicleCondition,
        financingPercentMin: filterState?.financingPercentMin
          ? Number(filterState.financingPercentMin)
          : undefined,
      }),
    [baseCatalog, filterState?.vehicleCondition, filterState?.financingPercentMin],
  );
  const showPagination =
    Boolean(nextPageHref) && shouldExposePaginationUi(loans.length, cursorMeta ?? null);
  const filtersActive = hasTwCatalogFilters(filterState);

  return (
    <LoanCompareShell>
      <div className="min-w-0 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-700">
              Listed offers{' '}
              <span className="font-bold text-[var(--tw-navy)]">({catalog.length})</span>
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Illustrative EMI uses your loan requirement and tenure with each product&apos;s
              starting rate when available.
            </p>
          </div>
          <LoanSortSelect currentSort={currentSort} pathname={pathname} />
        </div>

        {loansFetchFailed ? (
          <div className="rounded-[var(--tw-radius-md)] bg-white px-4 py-4 text-center sm:px-5">
            <h3 className="text-sm font-bold text-[var(--tw-navy)]">
              We couldn&apos;t load Two-Wheeler Loan offers right now
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-[var(--tw-muted)]">
              Please try again in a moment. Planning tools above remain available.
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={pathname}
                className="inline-flex min-h-10 items-center rounded-[var(--tw-radius-md)] bg-[var(--tw-navy)] px-4 text-sm font-semibold !text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tw-orange)]"
              >
                Try again
              </Link>
            </div>
          </div>
        ) : catalog.length ? (
          <div className="overflow-hidden rounded-[var(--tw-radius-md)] bg-white">
            <div
              className="hidden grid-cols-[minmax(8rem,1.1fr)_minmax(3.5rem,0.45fr)_minmax(4rem,0.55fr)_minmax(4rem,0.55fr)_minmax(5rem,0.7fr)_minmax(4rem,0.55fr)_minmax(3.75rem,0.5fr)_minmax(8rem,0.9fr)] gap-2 border-b border-[var(--tw-border)] bg-[var(--tw-navy)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white lg:grid"
              role="row"
            >
              <span>Lender / Product</span>
              <span>Rate</span>
              <span>Illustrative EMI</span>
              <span>Loan Amount</span>
              <span>Tenure</span>
              <span>Fee</span>
              <span>New/Used</span>
              <span className="text-right">Action</span>
            </div>
            <div className="divide-y divide-[var(--tw-border)] px-0 lg:px-4">
              {catalog.map((loan) => (
                <OfferRow key={loan.id} loan={loan} />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-[var(--tw-radius-md)] bg-white px-4 py-3 text-center sm:px-5">
            <h3 className="text-sm font-bold text-[var(--tw-navy)]">
              {filtersActive
                ? 'No matching Two-Wheeler Loans'
                : 'No Two-Wheeler Loan offers are currently listed'}
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-[var(--tw-muted)]">
              {filtersActive
                ? 'Try changing your loan amount, tenure or filters to explore available options.'
                : "We're building our Two-Wheeler Loan comparison catalog. You can still estimate EMI, plan your down payment and explore planning tools."}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-3">
              {filtersActive ? (
                <Link
                  href={pathname}
                  className="inline-flex min-h-10 items-center justify-center rounded-[var(--tw-radius-md)] bg-[var(--tw-navy)] px-4 text-sm font-semibold !text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tw-orange)]"
                >
                  Clear Filters
                </Link>
              ) : (
                <>
                  <Link
                    href={calculatorHref('bike-loan-emi')}
                    className="inline-flex min-h-10 items-center justify-center rounded-[var(--tw-radius-md)] bg-[var(--tw-navy)] px-4 text-sm font-semibold !text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tw-orange)]"
                  >
                    Calculate Two-Wheeler Loan EMI
                  </Link>
                  <Link
                    href={financeEligibilityPath({ loanType: 'two-wheeler' })}
                    className="inline-flex min-h-10 items-center justify-center rounded-[var(--tw-radius-md)] border border-[var(--tw-border)] bg-white px-4 text-sm font-semibold text-[var(--tw-navy)] hover:text-[var(--tw-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tw-orange)]"
                  >
                    Check Eligibility
                  </Link>
                </>
              )}
              <a
                href="#tw-snapshot"
                className="inline-flex min-h-10 items-center justify-center rounded-[var(--tw-radius-md)] border border-[var(--tw-border)] bg-white px-4 text-sm font-semibold text-[var(--tw-navy)] hover:text-[var(--tw-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tw-orange)]"
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
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-[var(--tw-navy)] ring-1 ring-slate-200/80 hover:text-[var(--tw-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tw-orange)]"
            >
              Load more two-wheeler loans →
            </Link>
          </div>
        ) : null}

        <p className="text-xs text-slate-500">
          Optional:{' '}
          <Link
            href={financeEligibilityPath({ loanType: 'two-wheeler' })}
            className="font-semibold text-slate-600 underline-offset-2 hover:text-[var(--tw-orange)] hover:underline"
          >
            Check Eligibility
          </Link>{' '}
          for a fuller profile estimate.
        </p>

        <LoanCompareStickyCta />
      </div>
    </LoanCompareShell>
  );
}
