'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { FinanceLoan } from '@/services/finance';
import type { CursorMeta } from '@/services/api-client';
import {
  formatInr,
  formatLoanRateLabel,
  formatTenureMonths,
  loanAmountLabel,
  loanDetailHref,
} from '@/components/loans/loan-format';
import {
  LoanCompareShell,
  LoanCompareStickyCta,
} from '@/components/loans/loan-compare-toggle.client';
import { LoanSortSelect, type LoanFilterState } from '@/components/loans/loan-filters';
import { useLapDecision } from '@/components/loans/loan-against-property-decision-context';
import {
  prepareLoanCatalog,
  processingFeeDisplay,
  shouldExposePaginationUi,
} from '@/lib/loan-catalog';
import { calculatorHref } from '@/lib/finance-routes';
import { illustrativeLapOfferEmi } from '@/lib/loan-against-property-page';
import { resolveLapProductFields } from '@/lib/loan-against-property-product';
import { getRateFreshness } from '@/lib/loan-rate-freshness';

function OfferCard({ loan }: { loan: FinanceLoan }) {
  const { requiredLoan, tenureYears } = useLapDecision();
  const tenureMonths = tenureYears * 12;
  const fields = resolveLapProductFields(loan);
  const offerEmi = illustrativeLapOfferEmi(loan, requiredLoan, tenureMonths);
  const rate = formatLoanRateLabel(loan);
  const freshness = getRateFreshness(loan.rateLastVerifiedAt);
  const fee = processingFeeDisplay(loan);
  const href = loanDetailHref(loan);

  return (
    <article className="rounded-[var(--lap-radius-md)] bg-white p-4 ring-1 ring-[var(--lap-border)]">
      <p className="text-[0.8125rem] font-medium text-[var(--lap-muted)]">
        {loan.bank?.name?.trim() || 'Lender'}
      </p>
      <h3 className="mt-0.5 text-sm font-bold text-[var(--lap-navy)]">
        <Link href={href} className="hover:text-[var(--lap-orange)]">
          {loan.name}
        </Link>
      </h3>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="lap-metric-label">Interest Rate</dt>
          <dd className="font-bold tabular-nums text-[var(--lap-navy)]">{rate.label}</dd>
        </div>
        <div>
          <dt className="lap-metric-label">Illustrative EMI</dt>
          <dd className="font-bold tabular-nums text-[var(--lap-navy)]">
            {offerEmi.status === 'ok'
              ? `${formatInr(Math.round(offerEmi.monthlyEmi))}/mo`
              : offerEmi.message}
          </dd>
        </div>
        <div>
          <dt className="lap-metric-label">Loan Amount</dt>
          <dd className="font-semibold">{loanAmountLabel(loan) ?? 'Not currently available'}</dd>
        </div>
        <div>
          <dt className="lap-metric-label">Tenure</dt>
          <dd className="font-semibold">
            {formatTenureMonths(loan.tenureMin, loan.tenureMax) ?? 'Not currently available'}
          </dd>
        </div>
        <div>
          <dt className="lap-metric-label">Processing Fee</dt>
          <dd className="font-semibold">{fee}</dd>
        </div>
        <div>
          <dt className="lap-metric-label">Rate Type</dt>
          <dd className="font-semibold">{fields.rateTypeLabel}</dd>
        </div>
        {fields.propertyTypeSummary ? (
          <div className="col-span-2">
            <dt className="lap-metric-label">Property Type (product)</dt>
            <dd className="font-semibold">{fields.propertyTypeSummary}</dd>
          </div>
        ) : null}
        {fields.illustrativeLtvPercent != null ? (
          <div>
            <dt className="lap-metric-label">Product LTV (listed)</dt>
            <dd className="font-semibold tabular-nums">{fields.illustrativeLtvPercent}%</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--lap-muted)]">
        {freshness.verifiedLabel
          ? `Rates verified: ${freshness.verifiedLabel}`
          : 'Verified date: Not currently available'}
      </p>
      <div className="mt-3 flex gap-2">
        <Link
          href={href}
          className="inline-flex min-h-10 items-center rounded-lg bg-[var(--lap-navy)] px-3 text-sm font-semibold !text-white"
        >
          View Details
        </Link>
        <Link
          href={calculatorHref('loan-against-property-emi')}
          className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-200"
        >
          Calculate EMI
        </Link>
      </div>
    </article>
  );
}

export function LoanAgainstPropertyOfferResults({
  loans,
  featuredLoans,
  filterState,
  sort,
  cursorMeta,
  nextPageHref,
  loansFetchFailed = false,
  pathname = '/finance/loans/loan-against-property',
}: {
  loans: FinanceLoan[];
  featuredLoans: FinanceLoan[];
  filterState: LoanFilterState;
  sort: string;
  cursorMeta?: CursorMeta | null;
  nextPageHref?: string | null;
  loansFetchFailed?: boolean;
  pathname?: string;
}) {
  const { catalog } = useMemo(
    () => prepareLoanCatalog(loans, featuredLoans),
    [loans, featuredLoans],
  );
  const filtersActive = Boolean(
    filterState.amountMin ||
    filterState.rateMax ||
    filterState.bankId ||
    filterState.tenureMin ||
    (filterState.sort && filterState.sort !== 'recommended'),
  );
  const showPagination =
    Boolean(nextPageHref) && shouldExposePaginationUi(loans.length, cursorMeta ?? null);

  return (
    <LoanCompareShell>
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-700">
            Listed offers{' '}
            <span className="font-bold text-[var(--lap-navy)]">({catalog.length})</span>
          </p>
          <LoanSortSelect currentSort={sort} pathname={pathname} />
        </div>

        {loansFetchFailed ? (
          <div className="rounded-[var(--lap-radius-md)] bg-white px-4 py-6 text-center">
            <h3 className="text-sm font-bold text-[var(--lap-navy)]">Unable to load offers</h3>
            <p className="mt-1 text-sm text-[var(--lap-muted)]">
              Try again shortly, or continue with the planning tools above.
            </p>
          </div>
        ) : catalog.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {catalog.map((loan) => (
              <OfferCard key={loan.id} loan={loan} />
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--lap-radius-md)] bg-white px-4 py-6 text-center">
            <h3 className="text-sm font-bold text-[var(--lap-navy)] sm:text-base">
              {filtersActive
                ? 'No matching Loan Against Property offers'
                : 'No Loan Against Property offers are currently listed'}
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-[var(--lap-muted)]">
              {filtersActive ? 'Try changing filters or amount/tenure inputs.' : 'You can still:'}
            </p>
            {!filtersActive ? (
              <ul className="mx-auto mt-3 max-w-sm space-y-1 text-left text-[0.9375rem] text-slate-600">
                {[
                  'Estimate Loan Capacity',
                  'Calculate EMI',
                  'Check LTV',
                  'Evaluate Repayment Capacity',
                  'Check Eligibility',
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-[var(--lap-orange)]" aria-hidden>
                      ·
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <a
                href="#lap-capacity"
                className="inline-flex min-h-11 items-center rounded-[var(--lap-radius-md)] bg-[var(--lap-navy)] px-4 text-sm font-semibold !text-white"
              >
                Estimate Loan Capacity
              </a>
              <a
                href="#lap-tenure"
                className="inline-flex min-h-11 items-center rounded-[var(--lap-radius-md)] border border-[var(--lap-border)] px-4 text-sm font-semibold text-[var(--lap-navy)]"
              >
                Calculate EMI
              </a>
              <a
                href="#lap-ltv"
                className="inline-flex min-h-11 items-center rounded-[var(--lap-radius-md)] border border-[var(--lap-border)] px-4 text-sm font-semibold text-[var(--lap-navy)]"
              >
                Check LTV
              </a>
              <a
                href="#lap-foir"
                className="inline-flex min-h-11 items-center rounded-[var(--lap-radius-md)] border border-[var(--lap-border)] px-4 text-sm font-semibold text-[var(--lap-navy)]"
              >
                Evaluate Repayment Capacity
              </a>
              <Link
                href="/finance/eligibility"
                className="inline-flex min-h-11 items-center rounded-[var(--lap-radius-md)] border border-[var(--lap-border)] px-4 text-sm font-semibold text-[var(--lap-navy)]"
              >
                Check Eligibility
              </Link>
            </div>
          </div>
        )}

        {showPagination && nextPageHref ? (
          <div className="flex justify-center pt-2">
            <Link
              href={nextPageHref}
              className="inline-flex min-h-11 items-center rounded-xl bg-white px-5 text-sm font-semibold text-[var(--lap-navy)] ring-1 ring-slate-200"
            >
              Load more LAP offers →
            </Link>
          </div>
        ) : null}

        <LoanCompareStickyCta />
      </div>
    </LoanCompareShell>
  );
}
