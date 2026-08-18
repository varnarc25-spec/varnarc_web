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
import { useGoldLoanDecision } from '@/components/loans/gold-loan-decision-context';
import {
  prepareLoanCatalog,
  processingFeeDisplay,
  shouldExposePaginationUi,
} from '@/lib/loan-catalog';
import { calculatorHref } from '@/lib/finance-routes';
import { illustrativeGoldLoanOfferEmi } from '@/lib/gold-loan-page';
import {
  formatGoldRepaymentProductLabel,
  resolveGoldLoanProductFields,
} from '@/lib/gold-loan-product';
import { getRateFreshness } from '@/lib/loan-rate-freshness';

function OfferCard({ loan }: { loan: FinanceLoan }) {
  const { requiredLoan, tenureMonths } = useGoldLoanDecision();
  const fields = resolveGoldLoanProductFields(loan);
  const offerEmi = illustrativeGoldLoanOfferEmi(loan, requiredLoan, tenureMonths);
  const rate = formatLoanRateLabel(loan);
  const freshness = getRateFreshness(loan.rateLastVerifiedAt);
  const fee = processingFeeDisplay(loan);
  const href = loanDetailHref(loan);

  return (
    <article className="rounded-[var(--gl-radius-md)] bg-white p-4 ring-1 ring-[var(--gl-border)]">
      <p className="text-xs font-medium text-[var(--gl-muted)]">
        {loan.bank?.name?.trim() || 'Lender'}
      </p>
      <h3 className="mt-0.5 text-sm font-bold text-[var(--gl-navy)]">
        <Link href={href} className="hover:text-[var(--gl-orange)]">
          {loan.name}
        </Link>
      </h3>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="gl-metric-label">Interest Rate</dt>
          <dd className="font-bold tabular-nums text-[var(--gl-navy)]">{rate.label}</dd>
        </div>
        <div>
          <dt className="gl-metric-label">Illustrative EMI</dt>
          <dd className="font-bold tabular-nums text-[var(--gl-navy)]">
            {offerEmi.status === 'ok'
              ? `${formatInr(Math.round(offerEmi.monthlyEmi))}/mo`
              : offerEmi.message}
          </dd>
        </div>
        <div>
          <dt className="gl-metric-label">Loan Amount</dt>
          <dd className="font-semibold">{loanAmountLabel(loan) ?? 'Not currently available'}</dd>
        </div>
        <div>
          <dt className="gl-metric-label">Tenure</dt>
          <dd className="font-semibold">
            {formatTenureMonths(loan.tenureMin, loan.tenureMax) ?? 'Not currently available'}
          </dd>
        </div>
        <div>
          <dt className="gl-metric-label">Processing Fee</dt>
          <dd className="font-semibold">{fee}</dd>
        </div>
        <div>
          <dt className="gl-metric-label">Repayment Options</dt>
          <dd className="font-semibold">{formatGoldRepaymentProductLabel(fields.repaymentType)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-[var(--gl-muted)]">
        {freshness.verifiedLabel
          ? `Rates verified: ${freshness.verifiedLabel}`
          : 'Verified date: Not currently available'}
      </p>
      <div className="mt-3 flex gap-2">
        <Link
          href={href}
          className="inline-flex min-h-10 items-center rounded-lg bg-[var(--gl-navy)] px-3 text-xs font-semibold !text-white"
        >
          View Details
        </Link>
        <Link
          href={calculatorHref('gold-loan-emi')}
          className="inline-flex min-h-10 items-center rounded-lg px-3 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
        >
          Calculate EMI
        </Link>
      </div>
    </article>
  );
}

export function GoldLoanOfferResults({
  loans,
  featuredLoans,
  filterState,
  sort,
  cursorMeta,
  nextPageHref,
  loansFetchFailed = false,
  pathname = '/finance/loans/gold-loan',
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
            <span className="font-bold text-[var(--gl-navy)]">({catalog.length})</span>
          </p>
          <LoanSortSelect currentSort={sort} pathname={pathname} />
        </div>

        {loansFetchFailed ? (
          <div className="rounded-[var(--gl-radius-md)] bg-white px-4 py-6 text-center">
            <h3 className="text-sm font-bold text-[var(--gl-navy)]">Unable to load offers</h3>
            <p className="mt-1 text-sm text-[var(--gl-muted)]">
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
          <div className="rounded-[var(--gl-radius-md)] bg-white px-4 py-6 text-center">
            <h3 className="text-sm font-bold text-[var(--gl-navy)] sm:text-base">
              {filtersActive
                ? 'No matching Gold Loans'
                : 'No verified Gold Loan offers are currently listed'}
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-[var(--gl-muted)]">
              {filtersActive
                ? 'Try changing filters or amount/tenure inputs.'
                : 'Meanwhile you can:'}
            </p>
            {!filtersActive ? (
              <ul className="mx-auto mt-3 max-w-sm space-y-1 text-left text-[0.9375rem] text-slate-600">
                {[
                  'Estimate Gold Value',
                  'Calculate Repayment',
                  'Check Eligibility',
                  'Understand Gold Loan Rules',
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-[var(--gl-orange)]" aria-hidden>
                      ·
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <a
                href="#gl-valuation"
                className="inline-flex min-h-11 items-center rounded-[var(--gl-radius-md)] bg-[var(--gl-navy)] px-4 text-sm font-semibold !text-white"
              >
                Estimate Gold Value
              </a>
              <a
                href="#gl-repayment"
                className="inline-flex min-h-11 items-center rounded-[var(--gl-radius-md)] border border-[var(--gl-border)] px-4 text-sm font-semibold text-[var(--gl-navy)]"
              >
                Calculate Repayment
              </a>
              <Link
                href="/finance/eligibility"
                className="inline-flex min-h-11 items-center rounded-[var(--gl-radius-md)] border border-[var(--gl-border)] px-4 text-sm font-semibold text-[var(--gl-navy)]"
              >
                Check Eligibility
              </Link>
              <a
                href="#gl-regulatory"
                className="inline-flex min-h-11 items-center rounded-[var(--gl-radius-md)] border border-[var(--gl-border)] px-4 text-sm font-semibold text-[var(--gl-navy)]"
              >
                Understand Rules
              </a>
            </div>
          </div>
        )}

        {showPagination && nextPageHref ? (
          <div className="flex justify-center pt-2">
            <Link
              href={nextPageHref}
              className="inline-flex min-h-11 items-center rounded-xl bg-white px-5 text-sm font-semibold text-[var(--gl-navy)] ring-1 ring-slate-200"
            >
              Load more gold loans →
            </Link>
          </div>
        ) : null}

        <LoanCompareStickyCta />
      </div>
    </LoanCompareShell>
  );
}
