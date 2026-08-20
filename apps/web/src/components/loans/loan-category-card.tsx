import Link from 'next/link';
import type { FinanceCategory } from '@/services/finance';
import { HubIcon } from '@/components/hub/hub-icons';
import { LoanIllustrationFrame } from '@/components/loans/loan-illustration-frame';
import { loanCategoryIcon } from '@/lib/loan-category-icons';
import { resolveLoanCategoryCardImage } from '@/lib/loan-visual-assets';
import { LOAN_HUB_CATEGORY_SLUGS } from '@/lib/loan-hub-categories';
import { loansHubPath } from '@/lib/finance-routes';
import { toNumber, formatInr } from '@/components/loans/loan-format';

export type LoanCategoryCardVariant = 'primary' | 'secondary';

/** Reliable structural stats only — never invents rates. */
export function loanCategoryStat(category: FinanceCategory): string | null {
  const minAmount = toNumber(category.typicalMinAmount);
  const maxAmount = toNumber(category.typicalMaxAmount);
  if (minAmount != null && maxAmount != null) {
    return `Typical amount range: ${formatInr(minAmount)} – ${formatInr(maxAmount)}`;
  }
  if (maxAmount != null) return `Typical amounts up to ${formatInr(maxAmount)}`;
  if (minAmount != null) return `Typical amounts from ${formatInr(minAmount)}`;

  const minTenure = category.typicalMinTenure;
  const maxTenure = category.typicalMaxTenure;
  if (minTenure != null && maxTenure != null && minTenure !== maxTenure) {
    return `Typical tenure: ${minTenure}–${maxTenure} months`;
  }
  if (maxTenure != null) return `Typical tenure up to ${maxTenure} months`;
  if (minTenure != null) return `Typical tenure from ${minTenure} months`;

  return null;
}

export function loanCategoryDescription(category: FinanceCategory): string {
  const text =
    category.shortDescription?.trim() ||
    category.description?.trim() ||
    category.introduction?.trim() ||
    '';
  return text || `Compare ${category.name.toLowerCase()} options from banks and lenders.`;
}

export function LoanCategoryCard({
  category,
  variant: _variant = 'secondary',
}: {
  category: FinanceCategory;
  variant?: LoanCategoryCardVariant;
}) {
  void _variant;
  const href = loansHubPath({ categorySlug: category.slug });
  const description = loanCategoryDescription(category);
  const stat = loanCategoryStat(category);
  const iconName = loanCategoryIcon(category.slug);
  const illustration = resolveLoanCategoryCardImage({
    slug: category.slug,
    featuredImage: category.featuredImage,
  });
  const illustrationAlt = `${category.name} illustration`;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 transition motion-reduce:transition-none hover:border-[#0b1f3a]/25 hover:shadow-[0_6px_20px_rgba(11,31,58,0.06)] focus-within:border-[#f97316]/50 focus-within:ring-2 focus-within:ring-[#f97316]/30">
      <Link
        href={href}
        className="absolute inset-0 z-[1] rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f97316]"
        aria-label={`Explore ${category.name}`}
      >
        <span className="sr-only">Explore {category.name}</span>
      </Link>

      <LoanIllustrationFrame
        src={illustration}
        alt={illustrationAlt}
        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
        aspect="4/3"
        objectFit="contain"
        hoverScale
        fallback={
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/80 bg-white text-[#0b1f3a] shadow-sm transition group-hover:-translate-y-0.5 motion-reduce:transform-none">
            <HubIcon name={iconName} className="h-6 w-6" />
          </span>
        }
      />

      <h3 className="relative z-[2] mt-3.5 text-base font-bold tracking-tight text-[#0b1f3a]">
        {category.name}
      </h3>

      <p className="relative z-[2] mt-1.5 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">
        {description}
      </p>

      {stat ? (
        <p className="relative z-[2] mt-2.5 text-xs font-medium text-slate-500">{stat}</p>
      ) : null}

      <p className="relative z-[2] mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0b1f3a] transition group-hover:text-[#f97316]">
        Explore
        <span
          className="inline-block transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
          aria-hidden
        >
          →
        </span>
      </p>
    </article>
  );
}

const PRIMARY_SLUGS = LOAN_HUB_CATEGORY_SLUGS.slice(0, 4);
const SECONDARY_SLUGS = LOAN_HUB_CATEGORY_SLUGS.slice(4);

function orderBySlugList(categories: FinanceCategory[], slugs: readonly string[]) {
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  return slugs.map((slug) => bySlug.get(slug)).filter((c): c is FinanceCategory => c != null);
}

export function splitLoanCategories(categories: FinanceCategory[]): {
  primary: FinanceCategory[];
  secondary: FinanceCategory[];
} {
  const primary = orderBySlugList(categories, PRIMARY_SLUGS);
  const secondary = orderBySlugList(categories, SECONDARY_SLUGS);
  return { primary, secondary };
}
