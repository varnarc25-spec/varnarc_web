import Link from 'next/link';
import type { FinanceLoan } from '@/services/finance';
import { CmsMediaImage } from '@/components/cms/cms-media-image';
import { LoanSponsoredDisclosure } from '@/components/loans/loan-disclaimer';
import { LoanCompareToggle } from '@/components/loans/loan-compare-toggle.client';
import {
  formatLoanRateLabel,
  formatTenureMonths,
  lenderInitials,
  loanAmountLabel,
  loanDetailHref,
} from '@/components/loans/loan-format';
import { processingFeeDisplay, productEmiLink } from '@/lib/loan-catalog';
import { getRateFreshness } from '@/lib/loan-rate-freshness';

function SpecItem({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className={`font-medium tracking-wide text-slate-500 ${compact ? 'text-xs' : 'text-xs'}`}>
        {label}
      </dt>
      <dd
        className={`mt-0.5 font-semibold leading-snug tabular-nums text-[#0b1f3a] ${
          compact ? 'text-xs' : 'text-sm'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

export function LoanProductCard({
  loan,
  enableCompare = true,
  variant = 'default',
}: {
  loan: FinanceLoan;
  enableCompare?: boolean;
  variant?: 'default' | 'featured';
}) {
  const isFeaturedLayout = variant === 'featured';
  const rate = formatLoanRateLabel(loan);
  const amount = loanAmountLabel(loan);
  const tenure = formatTenureMonths(loan.tenureMin, loan.tenureMax);
  const fee = processingFeeDisplay(loan);
  const freshness = getRateFreshness(loan.rateLastVerifiedAt);
  const href = loanDetailHref(loan);
  const eligibilityHref = `/finance/eligibility?loanId=${encodeURIComponent(loan.id)}`;
  const emi = productEmiLink(loan);
  const lenderName = loan.bank?.name ?? 'Lender';

  return (
    <article
      className={`flex h-full flex-col bg-white transition motion-reduce:transition-none ${
        isFeaturedLayout
          ? 'rounded-xl border border-slate-200/90 p-3.5 ring-1 ring-[#f97316]/15'
          : 'rounded-xl border border-slate-200/90 p-4 hover:border-slate-300 sm:p-4'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-[#f8fafc] ${
              isFeaturedLayout ? 'h-9 w-9' : 'h-10 w-10'
            }`}
          >
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
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-slate-500">{lenderName}</p>
            {(loan.featured || loan.sponsored) && (
              <div className="mt-1 flex flex-wrap gap-1 sm:hidden">
                {loan.featured ? (
                  <span className="rounded bg-[#0b1f3a]/90 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
                    Featured
                  </span>
                ) : null}
                {loan.sponsored ? (
                  <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900">
                    Sponsored
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="hidden shrink-0 flex-wrap items-start justify-end gap-1 sm:flex">
          {loan.featured ? (
            <span className="rounded bg-[#0b1f3a]/90 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
              Featured
            </span>
          ) : null}
          {loan.sponsored ? (
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900">
              Sponsored
            </span>
          ) : null}
        </div>
      </div>

      <h3
        className={`mt-2.5 font-bold leading-snug tracking-tight text-[#0b1f3a] ${
          isFeaturedLayout ? 'text-sm' : 'text-[0.95rem] sm:text-base'
        }`}
      >
        <Link
          href={href}
          className="hover:text-[#f97316] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2"
        >
          {loan.name}
        </Link>
      </h3>

      <div
        className={`mt-2.5 rounded-xl bg-[#f8fafc] ${isFeaturedLayout ? 'px-3 py-2' : 'px-3 py-2.5'}`}
      >
        <p className="text-xs font-medium text-slate-500">Interest rate</p>
        <p
          className={`mt-0.5 font-extrabold tracking-tight tabular-nums text-[#0b1f3a] ${
            isFeaturedLayout ? 'text-lg' : 'text-xl sm:text-[1.35rem]'
          }`}
        >
          {rate.rateDisplay}
          {rate.unit ? (
            <span className="ml-1 text-sm font-semibold text-slate-500">{rate.unit}</span>
          ) : null}
        </p>
        {rate.qualifier ? (
          <p className="mt-0.5 text-xs font-medium text-slate-500">{rate.qualifier}</p>
        ) : null}
      </div>

      <dl
        className={`mt-3 grid grid-cols-2 gap-x-3 ${
          isFeaturedLayout ? 'gap-y-2' : 'gap-y-2.5 sm:grid-cols-3'
        }`}
      >
        <SpecItem
          compact={isFeaturedLayout}
          label="Loan amount"
          value={amount ?? 'As per lender'}
        />
        <SpecItem compact={isFeaturedLayout} label="Tenure" value={tenure ?? 'As per lender'} />
        {!isFeaturedLayout ? <SpecItem label="Processing fee" value={fee} /> : null}
      </dl>

      <p className="mt-2.5 text-xs leading-snug text-slate-500">
        Rates verified {freshness.verifiedLabel ?? 'pending'}
      </p>
      {freshness.publicNotice ? (
        <p className="mt-1 text-xs leading-snug text-slate-500">{freshness.publicNotice}</p>
      ) : null}

      {loan.sponsored ? (
        <div className="mt-2">
          <LoanSponsoredDisclosure text={loan.sponsoredDisclosure} />
        </div>
      ) : null}

      <div
        className={`mt-3 flex flex-col gap-2 ${
          isFeaturedLayout ? '' : 'min-[420px]:flex-row min-[420px]:flex-wrap'
        }`}
      >
        <Link
          href={href}
          className={`inline-flex min-h-10 items-center justify-center rounded-xl bg-[#0b1f3a] px-4 text-sm font-semibold text-white transition hover:bg-[#122b4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2 ${
            isFeaturedLayout ? '' : 'min-[420px]:min-w-32'
          }`}
        >
          View Details
        </Link>
        {emi ? (
          <Link
            href={emi.href}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0b1f3a] transition hover:border-[#0b1f3a]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2"
          >
            Calculate EMI
          </Link>
        ) : null}
      </div>

      {!isFeaturedLayout ? (
        <Link
          href={eligibilityHref}
          className="mt-2 inline-flex min-h-9 items-center text-xs font-semibold text-slate-600 underline-offset-2 transition hover:text-[#f97316] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]"
        >
          Check eligibility →
        </Link>
      ) : null}

      {enableCompare ? <LoanCompareToggle loanId={loan.id} /> : null}
    </article>
  );
}
