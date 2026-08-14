import { Suspense, type ReactNode } from 'react';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { AdBanner } from '@/components/business/ad-banner';
import { LoanDisclaimer } from '@/components/loans/loan-disclaimer';
import { LoanHubHero } from '@/components/loans/loan-hub-hero';
import {
  LoanFilters,
  LoanActiveFilterChips,
  type LoanFilterState,
} from '@/components/loans/loan-filters';
import { LoanProductResults } from '@/components/loans/loan-product-results';
import { JsonLd, breadcrumbJsonLd } from '@/components/seo/json-ld';
import type { FinanceBank, FinanceCategory, FinanceLoan } from '@/services/finance';
import type { CursorMeta } from '@/services/api-client';
import type { LoanCategorySlug } from '@/lib/loan-hub-categories';
import { loanCategoryCanonicalPath } from '@/lib/loan-path';

export type LoanCatalogViewProps = {
  mode: 'hub' | 'category';
  categorySlug?: LoanCategorySlug;
  category?: FinanceCategory | null;
  h1: string;
  intro: string;
  heroImageUrl?: string | null;
  heroImageAlt?: string | null;
  categories: FinanceCategory[];
  banks: FinanceBank[];
  loans: FinanceLoan[];
  featuredLoans: FinanceLoan[];
  filterState: LoanFilterState;
  sort: string;
  cursorMeta?: CursorMeta | null;
  nextPageHref?: string | null;
  /** Streamed below-fold content (guides, FAQ, EMI, education). */
  belowFold?: ReactNode;
};

export function LoanCatalogView(props: LoanCatalogViewProps) {
  const {
    mode,
    categorySlug,
    category,
    h1,
    intro,
    heroImageUrl,
    heroImageAlt,
    categories,
    banks,
    loans,
    featuredLoans,
    filterState,
    sort,
    cursorMeta,
    nextPageHref,
    belowFold,
  } = props;

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://varnarc.com';
  const pathname =
    mode === 'category' && categorySlug
      ? loanCategoryCanonicalPath(categorySlug)
      : '/finance/loans';

  const breadcrumbItems =
    mode === 'category' && category
      ? [
          { name: 'Home', url: `${siteUrl}/` },
          { name: 'Finance', url: `${siteUrl}/finance` },
          { name: 'Loans', url: `${siteUrl}/finance/loans` },
          { name: category.name, url: `${siteUrl}${pathname}` },
        ]
      : [
          { name: 'Home', url: `${siteUrl}/` },
          { name: 'Finance', url: `${siteUrl}/finance` },
          { name: 'Loans', url: `${siteUrl}/finance/loans` },
        ];

  const uiBreadcrumbs =
    mode === 'category' && category
      ? [
          { label: 'Home', href: '/' },
          { label: 'Finance', href: '/finance' },
          { label: 'Loans', href: '/finance/loans' },
          { label: category.name },
        ]
      : [{ label: 'Home', href: '/' }, { label: 'Finance', href: '/finance' }, { label: 'Loans' }];

  return (
    <main className="w-full bg-white">
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />

      {/* Hero — white */}
      <div className="full-bleed bg-white">
        <div className="site-container px-4 pt-6 pb-4 sm:pt-8 sm:pb-5">
          <Breadcrumbs items={uiBreadcrumbs} />

          <div className="mt-3">
            <LoanHubHero
              title={h1}
              intro={intro}
              categories={categories}
              activeCategorySlug={categorySlug ?? filterState.categorySlug}
              heroImageUrl={heroImageUrl}
              heroImageAlt={heroImageAlt}
            />
          </div>

          <p className="mt-2.5 text-xs leading-relaxed text-slate-500">
            Informational comparison only — not a loan offer or approval. Confirm rates and terms
            with the lender.
          </p>
        </div>
      </div>

      {/* Catalog — very light gray */}
      <div className="full-bleed bg-[var(--varnarc-bg,#f7f8fb)]">
        <div className="site-container px-4 py-6 sm:py-8">
          <div className="mb-5">
            <AdBanner slot="content-top" />
          </div>

          <div className="grid items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6">
            <Suspense
              fallback={
                <div className="rounded-2xl bg-white p-4 text-sm text-slate-500 ring-1 ring-slate-200/80">
                  Loading filters…
                </div>
              }
            >
              <LoanFilters categories={categories} banks={banks} current={filterState} />
            </Suspense>

            <div className="min-w-0">
              <Suspense fallback={null}>
                <LoanActiveFilterChips
                  current={filterState}
                  categories={categories}
                  banks={banks}
                />
              </Suspense>
              <LoanProductResults
                loans={loans}
                featuredLoans={featuredLoans}
                currentSort={sort}
                pathname={pathname}
                cursorMeta={cursorMeta}
                nextPageHref={nextPageHref}
              />
            </div>
          </div>

          <div className="mt-6">
            <LoanDisclaimer />
          </div>
        </div>
      </div>

      {belowFold ? (
        <Suspense
          fallback={
            <div className="full-bleed bg-[var(--varnarc-bg,#f7f8fb)]">
              <div className="site-container px-4 py-16 text-sm text-slate-500">
                Loading loan guides and education…
              </div>
            </div>
          }
        >
          {belowFold}
        </Suspense>
      ) : null}
    </main>
  );
}
