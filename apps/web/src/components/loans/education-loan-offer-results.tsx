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
import { useEducationLoanDecision } from '@/components/loans/education-loan-decision-context';
import {
  prepareLoanCatalog,
  processingFeeDisplay,
  shouldExposePaginationUi,
} from '@/lib/loan-catalog';
import { calculatorHref } from '@/lib/finance-routes';
import { illustrativeEducationLoanOfferEmi } from '@/lib/education-loan-page';
import {
  filterEducationLoanCatalog,
  formatEducationMoratoriumLabel,
  formatEducationSecurityLabel,
  formatEducationStudyCoverageLabel,
  resolveEducationLoanProductFields,
} from '@/lib/education-loan-product';
import { getRateFreshness } from '@/lib/loan-rate-freshness';

function OfferCard({ loan }: { loan: FinanceLoan }) {
  const { loanRequired, repaymentYears } = useEducationLoanDecision();
  const tenureMonths = repaymentYears * 12;
  const fields = resolveEducationLoanProductFields(loan);
  const offerEmi = illustrativeEducationLoanOfferEmi(loan, loanRequired, tenureMonths);
  const rate = formatLoanRateLabel(loan);
  const freshness = getRateFreshness(loan.rateLastVerifiedAt);
  const fee = processingFeeDisplay(loan);
  const href = loanDetailHref(loan);

  return (
    <article className="rounded-[var(--el-radius-md)] bg-white p-4 ring-1 ring-[var(--el-border)]">
      <p className="text-xs font-medium text-[var(--el-muted)]">
        {loan.bank?.name?.trim() || 'Lender'}
      </p>
      <h3 className="mt-0.5 text-sm font-bold text-[var(--el-navy)]">
        <Link href={href} className="hover:text-[var(--el-orange)]">
          {loan.name}
        </Link>
      </h3>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="el-metric-label">Domestic / Abroad</dt>
          <dd className="font-semibold text-[var(--el-navy)]">
            {formatEducationStudyCoverageLabel(fields.studyCoverage)}
          </dd>
        </div>
        <div>
          <dt className="el-metric-label">Secured / Unsecured</dt>
          <dd className="font-semibold text-[var(--el-navy)]">
            {formatEducationSecurityLabel(fields.securityType)}
          </dd>
        </div>
        <div>
          <dt className="el-metric-label">Interest Rate</dt>
          <dd className="font-bold tabular-nums text-[var(--el-navy)]">{rate.label}</dd>
        </div>
        <div>
          <dt className="el-metric-label">Illustrative EMI</dt>
          <dd className="font-bold tabular-nums text-[var(--el-navy)]">
            {offerEmi.status === 'ok'
              ? `${formatInr(Math.round(offerEmi.monthlyEmi))}/mo`
              : offerEmi.message}
          </dd>
        </div>
        <div>
          <dt className="el-metric-label">Loan Amount</dt>
          <dd className="font-semibold tabular-nums">
            {loanAmountLabel(loan) ?? 'Not currently available'}
          </dd>
        </div>
        <div>
          <dt className="el-metric-label">Moratorium</dt>
          <dd className="font-semibold">
            {formatEducationMoratoriumLabel(fields.moratoriumMonthsMax)}
          </dd>
        </div>
        <div>
          <dt className="el-metric-label">Tenure</dt>
          <dd className="font-semibold">
            {formatTenureMonths(loan.tenureMin, loan.tenureMax) ?? 'Not currently available'}
          </dd>
        </div>
        <div>
          <dt className="el-metric-label">Processing Fee</dt>
          <dd className="font-semibold">{fee}</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-[var(--el-muted)]">
        {freshness.verifiedLabel
          ? `Rates verified: ${freshness.verifiedLabel}`
          : 'Verified date: Not currently available'}
      </p>
      <div className="mt-3 flex gap-2">
        <Link
          href={href}
          className="inline-flex min-h-10 items-center rounded-lg bg-[var(--el-navy)] px-3 text-xs font-semibold !text-white hover:bg-[var(--el-navy-soft)] hover:!text-white"
        >
          View Details
        </Link>
        <Link
          href={calculatorHref('education-loan-emi')}
          className="inline-flex min-h-10 items-center rounded-lg px-3 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
        >
          Calculate EMI
        </Link>
      </div>
    </article>
  );
}

export function EducationLoanOfferResults({
  loans,
  featuredLoans,
  filterState,
  sort,
  cursorMeta,
  nextPageHref,
  loansFetchFailed = false,
  pathname = '/finance/loans/education-loan',
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
  const { studyLocation } = useEducationLoanDecision();
  const { catalog: baseCatalog } = prepareLoanCatalog(loans, featuredLoans);
  const catalog = useMemo(
    () =>
      filterEducationLoanCatalog(baseCatalog, {
        studyCoverage: studyLocation,
      }),
    [baseCatalog, studyLocation],
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
            <span className="font-bold text-[var(--el-navy)]">({catalog.length})</span>
          </p>
          <LoanSortSelect currentSort={sort} pathname={pathname} />
        </div>

        {loansFetchFailed ? (
          <div className="rounded-[var(--el-radius-md)] bg-white px-4 py-6 text-center">
            <h3 className="text-sm font-bold text-[var(--el-navy)]">Unable to load offers</h3>
            <p className="mt-1 text-sm text-[var(--el-muted)]">
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
          <div className="rounded-[var(--el-radius-md)] bg-white px-4 py-6 text-center">
            <h3 className="text-sm font-bold text-[var(--el-navy)]">
              {filtersActive
                ? 'No matching Education Loans'
                : 'No Education Loan offers are currently listed'}
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-[var(--el-muted)]">
              {filtersActive
                ? 'Try changing filters or study destination.'
                : "We're building our Education Loan comparison catalog. You can still plan study costs, model study-period interest and explore government support."}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              <Link
                href={calculatorHref('education-loan-emi')}
                className="inline-flex min-h-10 items-center rounded-[var(--el-radius-md)] bg-[var(--el-navy)] px-4 text-sm font-semibold !text-white"
              >
                Calculate Education Loan EMI
              </Link>
              <a
                href="#el-government-support"
                className="inline-flex min-h-10 items-center rounded-[var(--el-radius-md)] border border-[var(--el-border)] px-4 text-sm font-semibold text-[var(--el-navy)]"
              >
                Check Government Support
              </a>
            </div>
          </div>
        )}

        {showPagination && nextPageHref ? (
          <div className="flex justify-center pt-2">
            <Link
              href={nextPageHref}
              className="inline-flex min-h-11 items-center rounded-xl bg-white px-5 text-sm font-semibold text-[var(--el-navy)] ring-1 ring-slate-200"
            >
              Load more education loans →
            </Link>
          </div>
        ) : null}

        <LoanCompareStickyCta />
      </div>
    </LoanCompareShell>
  );
}
