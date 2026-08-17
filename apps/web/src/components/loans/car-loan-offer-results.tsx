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
import { useCarLoanDecision } from '@/components/loans/car-loan-decision-context';
import {
  prepareLoanCatalog,
  processingFeeDisplay,
  shouldExposePaginationUi,
} from '@/lib/loan-catalog';
import { calculatorHref, financeEligibilityPath } from '@/lib/finance-routes';
import { formatCarRateTypeLabel, illustrativeCarLoanOfferEmi } from '@/lib/car-loan-page';
import {
  filterCarLoanCatalog,
  formatCarFinancingPercentLabel,
  formatCarVehicleConditionLabel,
  resolveCarLoanProductFields,
} from '@/lib/car-loan-product';
import { getRateFreshness } from '@/lib/loan-rate-freshness';
import type { LoanFilterState } from '@/components/loans/loan-filters';
import { trackAnalyticsEvent } from '@/lib/analytics-client';
import { useMemo } from 'react';

function hasCarLoanCatalogFilters(current?: LoanFilterState): boolean {
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
  const { loanRequirement, tenureMonths } = useCarLoanDecision();
  const rate = formatLoanRateLabel(loan);
  const amountLabel = loanAmountLabel(loan);
  const tenure = formatTenureMonths(loan.tenureMin, loan.tenureMax);
  const fee = processingFeeDisplay(loan);
  const href = loanDetailHref(loan);
  const lenderName = loan.bank?.name ?? 'Lender';
  const offerEmi = illustrativeCarLoanOfferEmi(loan, loanRequirement, tenureMonths);
  const startingRate = toNumber(loan.interestRateMin) ?? toNumber(loan.interestRate);
  const rateTypeLabel = formatCarRateTypeLabel(loan.rateType);
  const freshness = getRateFreshness(loan.rateLastVerifiedAt);
  const carFields = resolveCarLoanProductFields(loan);
  const vehicleLabel = formatCarVehicleConditionLabel(carFields.vehicleCondition);
  const financingLabel = formatCarFinancingPercentLabel(carFields);

  const emiCalcHref = calculatorHref('car-loan', {
    amount: loanRequirement,
    rate: startingRate ?? undefined,
    tenure: Math.round(tenureMonths / 12),
    tenureUnit: 'years',
  });

  return (
    <article className="rounded-[var(--cl-radius-md)] bg-white p-4 lg:rounded-none lg:bg-transparent lg:p-0">
      {/* Mobile card */}
      <div className="space-y-3 lg:hidden">
        <div className="flex items-start gap-3">
          <LenderMark loan={loan} lenderName={lenderName} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate text-xs font-medium text-slate-500">{lenderName}</p>
              {loan.featured ? (
                <span className="rounded bg-[var(--cl-navy)]/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                  Featured
                </span>
              ) : null}
              {loan.sponsored ? (
                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-900">
                  Sponsored
                </span>
              ) : null}
            </div>
            <h3 className="mt-0.5 text-sm font-bold leading-snug text-[var(--cl-navy)]">
              <Link
                href={href}
                className="hover:text-[var(--cl-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)]"
              >
                {loan.name}
              </Link>
            </h3>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
          <div>
            <dt className="cl-metric-label">Interest Rate</dt>
            <dd className="mt-0.5 text-sm font-bold tabular-nums text-[var(--cl-navy)]">
              {rate.label}
            </dd>
          </div>
          <div>
            <dt className="cl-metric-label">Illustrative EMI</dt>
            <dd className="mt-0.5 text-sm font-bold tabular-nums text-[var(--cl-navy)]">
              {offerEmi.status === 'ok'
                ? `${formatInr(Math.round(offerEmi.monthlyEmi))}/mo`
                : offerEmi.message}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="cl-metric-label">Rate Type</dt>
            <dd className="mt-0.5 text-sm font-bold text-[var(--cl-navy)]">{rateTypeLabel}</dd>
          </div>
          <div>
            <dt className="cl-metric-label">Loan Amount</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--cl-navy)]">
              {amountLabel ?? 'Not currently available'}
            </dd>
          </div>
          <div>
            <dt className="cl-metric-label">Tenure</dt>
            <dd className="mt-0.5 text-sm font-semibold text-[var(--cl-navy)]">
              {tenure ?? 'Not currently available'}
            </dd>
          </div>
          <div>
            <dt className="cl-metric-label">New / Used</dt>
            <dd className="mt-0.5 text-sm font-semibold text-[var(--cl-navy)]">{vehicleLabel}</dd>
          </div>
          <div>
            <dt className="cl-metric-label">Financing %</dt>
            <dd className="mt-0.5 text-sm font-semibold text-[var(--cl-navy)]">{financingLabel}</dd>
          </div>
          <div className="col-span-2">
            <dt className="cl-metric-label">Processing Fee</dt>
            <dd className="mt-0.5 text-sm font-semibold text-[var(--cl-navy)]">{fee}</dd>
          </div>
          <div className="col-span-2">
            <dt className="cl-metric-label">Verified Date</dt>
            <dd className="mt-0.5 text-sm font-semibold text-[var(--cl-navy)]">
              {freshness.verifiedLabel
                ? `Rates verified: ${freshness.verifiedLabel}`
                : 'Not currently available'}
            </dd>
            {freshness.publicNotice ? (
              <p className="mt-1 text-xs text-[var(--cl-muted)]">{freshness.publicNotice}</p>
            ) : null}
          </div>
        </dl>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={href}
            onClick={() => {
              try {
                trackAnalyticsEvent({
                  eventType: 'custom',
                  entityType: 'car_loan',
                  entityId: loan.id,
                  metadata: { action: 'car_offer_viewed' },
                });
              } catch {
                /* optional */
              }
            }}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--cl-navy)] px-3 text-xs font-semibold !text-white hover:bg-[var(--cl-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)]"
          >
            View Details
          </Link>
          <Link
            href={emiCalcHref}
            className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:text-[var(--cl-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)]"
          >
            Calculate EMI
          </Link>
          <CarLoanCompareToggle loanId={loan.id} />
        </div>
      </div>

      {/* Desktop row */}
      <div className="hidden grid-cols-[minmax(8rem,1.05fr)_minmax(3.5rem,0.45fr)_minmax(4rem,0.55fr)_minmax(4rem,0.55fr)_minmax(5rem,0.7fr)_minmax(4rem,0.55fr)_minmax(3.75rem,0.5fr)_minmax(3.5rem,0.45fr)_minmax(3.75rem,0.5fr)_minmax(8rem,0.9fr)] items-center gap-2 border-b border-[var(--cl-border)] py-3.5 lg:grid">
        <div className="flex min-w-0 items-center gap-2.5">
          <LenderMark loan={loan} lenderName={lenderName} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1">
              <p className="truncate text-xs font-medium text-[var(--cl-muted)]">{lenderName}</p>
              {loan.featured ? (
                <span className="rounded bg-[var(--cl-navy)]/90 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-white">
                  Featured
                </span>
              ) : null}
              {loan.sponsored ? (
                <span className="rounded bg-amber-50 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-amber-900">
                  Sponsored
                </span>
              ) : null}
            </div>
            <p className="truncate text-sm font-bold text-[var(--cl-navy)]">
              <Link
                href={href}
                className="hover:text-[var(--cl-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)]"
              >
                {loan.name}
              </Link>
            </p>
            {freshness.verifiedLabel ? (
              <p className="mt-0.5 truncate text-xs text-[var(--cl-muted)]">
                Rates verified: {freshness.verifiedLabel}
                {freshness.publicNotice ? ` · ${freshness.publicNotice}` : ''}
              </p>
            ) : (
              <p className="mt-0.5 truncate text-xs text-[var(--cl-muted)]">
                Verified date: Not currently available
              </p>
            )}
          </div>
        </div>
        <p className="text-xs font-semibold text-slate-600">{vehicleLabel}</p>
        <p className="text-sm font-bold tabular-nums text-[var(--cl-navy)]">{rate.label}</p>
        <div>
          <p className="text-sm font-bold tabular-nums text-[var(--cl-navy)]">
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
        <p className="text-xs font-semibold text-slate-600">{financingLabel}</p>
        <p className="text-xs text-slate-600">{rateTypeLabel}</p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href={href}
            className="inline-flex min-h-9 items-center rounded-lg bg-[var(--cl-navy)] px-3 text-xs font-semibold !text-white hover:bg-[var(--cl-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)]"
          >
            View Details
          </Link>
          <Link
            href={emiCalcHref}
            className="inline-flex min-h-9 items-center rounded-lg px-2.5 text-xs font-semibold text-slate-600 hover:text-[var(--cl-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)]"
          >
            Calculate EMI
          </Link>
          <CarLoanCompareToggle loanId={loan.id} />
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
        <span className="text-[10px] font-bold tracking-wide text-[var(--cl-navy)]" aria-hidden>
          {lenderInitials(lenderName)}
        </span>
      )}
    </div>
  );
}

function CarLoanCompareToggle({ loanId }: { loanId: string }) {
  return (
    <span
      onClick={() => {
        try {
          trackAnalyticsEvent({
            eventType: 'custom',
            entityType: 'car_loan',
            entityId: loanId,
            metadata: { action: 'car_offer_compare_clicked' },
          });
        } catch {
          /* optional */
        }
      }}
    >
      <LoanCompareToggle loanId={loanId} />
    </span>
  );
}

export function CarLoanOfferResults({
  loans,
  featuredLoans,
  currentSort,
  pathname = '/finance/loans/car-loan',
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
      filterCarLoanCatalog(baseCatalog, {
        vehicleCondition: filterState?.vehicleCondition,
        financingPercentMin: filterState?.financingPercentMin,
      }),
    [baseCatalog, filterState?.vehicleCondition, filterState?.financingPercentMin],
  );
  const showPagination =
    Boolean(nextPageHref) && shouldExposePaginationUi(loans.length, cursorMeta ?? null);
  const filtersActive = hasCarLoanCatalogFilters(filterState);

  return (
    <LoanCompareShell>
      <div className="min-w-0 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-700">
              Listed offers{' '}
              <span className="font-bold text-[var(--cl-navy)]">({catalog.length})</span>
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Illustrative EMI uses your loan requirement and tenure with each product&apos;s
              starting rate when available. New/Used and financing % appear only when product data
              supports them.
            </p>
          </div>
          <LoanSortSelect currentSort={currentSort} pathname={pathname} />
        </div>

        {loansFetchFailed ? (
          <div className="rounded-[var(--cl-radius-md)] bg-white px-4 py-4 text-center sm:px-5">
            <h3 className="text-sm font-bold text-[var(--cl-navy)]">
              We couldn&apos;t load Car Loan offers right now
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-[var(--cl-muted)]">
              Please try again in a moment. Planning tools above remain available.
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={pathname}
                className="inline-flex min-h-10 items-center rounded-[var(--cl-radius-md)] bg-[var(--cl-navy)] px-4 text-sm font-semibold !text-white transition duration-150 hover:bg-[var(--cl-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)]"
              >
                Try again
              </Link>
            </div>
          </div>
        ) : catalog.length ? (
          <div className="overflow-hidden rounded-[var(--cl-radius-lg)] bg-white">
            <div
              className="hidden grid-cols-[minmax(8rem,1.05fr)_minmax(3.5rem,0.45fr)_minmax(4rem,0.55fr)_minmax(4rem,0.55fr)_minmax(5rem,0.7fr)_minmax(4rem,0.55fr)_minmax(3.75rem,0.5fr)_minmax(3.5rem,0.45fr)_minmax(3.75rem,0.5fr)_minmax(8rem,0.9fr)] gap-2 border-b border-[var(--cl-border)] bg-[var(--cl-navy)] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-white lg:grid"
              role="row"
            >
              <span>Lender / Product</span>
              <span>New/Used</span>
              <span>Rate</span>
              <span>Illustrative EMI</span>
              <span>Loan Amount</span>
              <span>Tenure</span>
              <span>Fee</span>
              <span>Financing %</span>
              <span>Rate Type</span>
              <span className="text-right">Action</span>
            </div>
            <div className="divide-y divide-[var(--cl-border)] px-0 lg:px-4">
              {catalog.map((loan) => (
                <OfferRow key={loan.id} loan={loan} />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-[var(--cl-radius-md)] bg-white px-4 py-3 text-center sm:px-5">
            <div
              className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--cl-surface-4)]"
              aria-hidden
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 text-[var(--cl-navy)]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path d="M7 17a4 4 0 0 1-4-4V5h18v8a4 4 0 0 1-4 4H7ZM5 5l3-3h8l3 3M12 10v4M9 17l-2 4M15 17l2 4M7 21h10" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-[var(--cl-navy)]">
              {filtersActive ? 'No matching Car Loans' : 'No Car Loan offers are currently listed'}
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-[var(--cl-muted)]">
              {filtersActive
                ? 'Try changing your loan amount, tenure or filters to explore available options.'
                : "We're building our Car Loan comparison catalog. You can still estimate EMI, plan your down payment and explore Car Loan tools."}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-3">
              {filtersActive ? (
                <Link
                  href={pathname}
                  className="inline-flex min-h-10 items-center justify-center rounded-[var(--cl-radius-md)] bg-[var(--cl-navy)] px-4 text-sm font-semibold !text-white transition duration-150 hover:bg-[var(--cl-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)]"
                >
                  Clear Filters
                </Link>
              ) : (
                <>
                  <Link
                    href={calculatorHref('car-loan')}
                    className="inline-flex min-h-10 items-center justify-center rounded-[var(--cl-radius-md)] bg-[var(--cl-navy)] px-4 text-sm font-semibold !text-white transition duration-150 hover:bg-[var(--cl-navy-soft)] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)]"
                  >
                    Calculate Car Loan EMI
                  </Link>
                  <Link
                    href={financeEligibilityPath({ loanType: 'car' })}
                    className="inline-flex min-h-10 items-center justify-center rounded-[var(--cl-radius-md)] border border-[var(--cl-border)] bg-white px-4 text-sm font-semibold text-[var(--cl-navy)] transition duration-150 hover:border-[var(--cl-navy)]/30 hover:text-[var(--cl-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)]"
                  >
                    Check Car Loan Eligibility
                  </Link>
                </>
              )}
              <a
                href="#car-loan-snapshot"
                className="inline-flex min-h-10 items-center justify-center rounded-[var(--cl-radius-md)] border border-[var(--cl-border)] bg-white px-4 text-sm font-semibold text-[var(--cl-navy)] transition duration-150 hover:border-[var(--cl-navy)]/30 hover:text-[var(--cl-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)]"
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
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-[var(--cl-navy)] ring-1 ring-slate-200/80 hover:text-[var(--cl-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-orange)]"
            >
              Load more car loans →
            </Link>
          </div>
        ) : null}

        <p className="text-xs text-slate-500">
          Optional:{' '}
          <Link
            href={financeEligibilityPath({ loanType: 'car' })}
            className="font-semibold text-slate-600 underline-offset-2 hover:text-[var(--cl-orange)] hover:underline"
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
