import Link from 'next/link';
import {
  LOAN_HUB_CATEGORY_FALLBACK,
  LOAN_HUB_CATEGORY_SLUGS,
  type LoanCategorySlug,
} from '@/lib/loan-hub-categories';
import { loanCategoryCanonicalPath, loansHubCanonicalPath } from '@/lib/loan-path';
import type { FinanceCategory } from '@/services/finance';

const SHORT_LABELS: Partial<Record<LoanCategorySlug, string>> = {
  'personal-loan': 'Personal',
  'home-loan': 'Home',
  'car-loan': 'Car',
  'education-loan': 'Education',
  'business-loan': 'Business',
  'gold-loan': 'Gold',
  'two-wheeler-loan': 'Two-Wheeler',
  'loan-against-property': 'Against Property',
};

function resolveLoanTypeLinks(categories?: FinanceCategory[]) {
  const bySlug = new Map(
    (categories ?? [])
      .filter((c) => LOAN_HUB_CATEGORY_SLUGS.includes(c.slug as LoanCategorySlug))
      .map((c) => [c.slug, c.name] as const),
  );

  return LOAN_HUB_CATEGORY_SLUGS.map((slug) => {
    const fallback = LOAN_HUB_CATEGORY_FALLBACK.find((c) => c.slug === slug);
    return {
      slug,
      label: SHORT_LABELS[slug] ?? bySlug.get(slug) ?? fallback?.name ?? slug,
      fullName: bySlug.get(slug) ?? fallback?.name ?? slug,
      href: loanCategoryCanonicalPath(slug),
    };
  });
}

/**
 * Horizontal loan-type switcher for category pages — jump between loan types
 * without returning to the loans hub.
 */
export function LoanTypeNav({
  currentSlug,
  categories,
}: {
  currentSlug: LoanCategorySlug | string;
  categories?: FinanceCategory[];
}) {
  const links = resolveLoanTypeLinks(categories);
  const hubHref = loansHubCanonicalPath();

  return (
    <nav className="mt-4" aria-label="Loan types">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        Browse loan types
      </p>
      <div className="mt-2 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
        <Link
          href={hubHref}
          className="inline-flex min-h-9 shrink-0 items-center rounded-full border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 transition hover:border-[#0b1f3a]/30 hover:text-[#0b1f3a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]"
        >
          All Loans
        </Link>
        {links.map((link) => {
          const active = link.slug === currentSlug;
          return (
            <Link
              key={link.slug}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              title={link.fullName}
              className={`inline-flex min-h-9 shrink-0 items-center rounded-full px-3.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] ${
                active
                  ? 'bg-[#0b1f3a] text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-[#0b1f3a]/30 hover:text-[#0b1f3a]'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
