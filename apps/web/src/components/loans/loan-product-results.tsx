import Link from 'next/link';
import type { FinanceLoan } from '@/services/finance';
import type { CursorMeta } from '@/services/api-client';
import { LoanProductCard } from '@/components/loans/loan-product-card';
import { LoanSortSelect } from '@/components/loans/loan-filters';
import {
  LoanCompareShell,
  LoanCompareStickyCta,
} from '@/components/loans/loan-compare-toggle.client';
import { LoanSectionHeader } from '@/components/loans/loan-section-header';
import { EmptyState } from '@/components/shared/empty-state';
import { prepareLoanCatalog, shouldExposePaginationUi } from '@/lib/loan-catalog';

/**
 * Server-rendered catalog results. Compare interaction lives in client islands.
 */
export function LoanProductResults({
  loans,
  featuredLoans,
  currentSort,
  pathname = '/finance/loans',
  cursorMeta,
  nextPageHref,
}: {
  loans: FinanceLoan[];
  featuredLoans: FinanceLoan[];
  currentSort?: string;
  pathname?: string;
  cursorMeta?: CursorMeta | null;
  /** Ready for load-more; only rendered when threshold + hasMore. */
  nextPageHref?: string | null;
}) {
  const { featured, catalog, showFeatured, featuredTotal } = prepareLoanCatalog(
    loans,
    featuredLoans,
  );
  const showPagination =
    Boolean(nextPageHref) && shouldExposePaginationUi(loans.length, cursorMeta ?? null);
  const showViewAllFeatured = featuredTotal > featured.length;

  return (
    <LoanCompareShell>
      <div className="min-w-0 space-y-7">
        {showFeatured ? (
          <section aria-labelledby="featured-loans-heading" className="min-w-0">
            <LoanSectionHeader
              id="featured-loans-heading"
              eyebrow="Editor picks"
              title="Featured Loan Offers"
              description="Highlighted for visibility — not a guarantee of best rates or approval."
              action={
                showViewAllFeatured
                  ? { href: `${pathname}?featured=1`, label: 'View all featured →' }
                  : { href: '/finance/loans/methodology', label: 'How we feature loans →' }
              }
            />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((loan) => (
                <div key={`featured-${loan.id}`} className="min-w-0">
                  <LoanProductCard loan={loan} variant="featured" />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="all-loans-heading" className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2
                id="all-loans-heading"
                className="text-lg font-extrabold tracking-tight text-[#0b1f3a] sm:text-xl"
              >
                All Loan Offers{' '}
                <span className="text-sm font-semibold text-slate-500">({catalog.length})</span>
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Compare rates, amounts, tenure and fees across lenders.
              </p>
            </div>
            <LoanSortSelect currentSort={currentSort} pathname={pathname} />
          </div>

          {catalog.length ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {catalog.map((loan) => (
                <LoanProductCard key={loan.id} loan={loan} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No matching loans"
              message="Try adjusting filters. Published loan products from the admin catalog will appear here."
            />
          )}

          {showPagination && nextPageHref ? (
            <div className="mt-6 flex justify-center">
              <Link
                href={nextPageHref}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-[#0b1f3a] hover:border-[#0b1f3a]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]"
              >
                Load more loans
              </Link>
            </div>
          ) : null}
        </section>

        <LoanCompareStickyCta />
      </div>
    </LoanCompareShell>
  );
}
