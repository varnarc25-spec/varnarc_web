import { Suspense } from 'react';
import Link from 'next/link';
import type { FinanceCategory } from '@/services/finance';
import { HubIcon } from '@/components/hub/hub-icons';
import { CmsMediaImage, CmsMediaPreload } from '@/components/cms/cms-media-image';
import { LoanHubQuickFinder } from '@/components/loans/loan-hub-quick-finder';
import { loanCategoryIcon } from '@/lib/loan-category-icons';
import { LOAN_HERO_ASSET, isVarnarcHubAsset } from '@/lib/loan-visual-assets';

const HUB_TRUST_POINTS = [
  'Compare multiple lenders',
  'Estimate monthly EMI',
  'Explore without signing in',
] as const;

/** Subtle benefits for dedicated category landings (e.g. Personal Loan). */
export const LOAN_CATEGORY_HERO_BENEFITS = [
  'Compare lenders',
  'Estimate EMI',
  'Review fees and repayment terms',
] as const;

const HERO_MEDIA = '(min-width: 640px)';

/**
 * Server-rendered hero: H1/intro/category nav stay in the initial HTML for SEO + LCP text.
 * Only the quick-finder form is a client island.
 */
export function LoanHubHero({
  title,
  intro,
  categories,
  activeCategorySlug,
  heroImageUrl,
  heroImageAlt,
  compareCtaLabel,
  eligibilityLabel,
  benefitPoints,
  /** When true, use the provided CMS/media URL as-is (category pages). */
  preferProvidedHeroImage = false,
}: {
  title: string;
  intro: string;
  categories: FinanceCategory[];
  activeCategorySlug?: string;
  heroImageUrl?: string | null;
  heroImageAlt?: string | null;
  compareCtaLabel?: string;
  eligibilityLabel?: string;
  benefitPoints?: readonly string[];
  preferProvidedHeroImage?: boolean;
}) {
  const categoryMode = Boolean(activeCategorySlug);
  const provided = heroImageUrl?.trim() || null;
  const illustrationSrc = preferProvidedHeroImage
    ? provided || LOAN_HERO_ASSET
    : (isVarnarcHubAsset(provided) ? provided : null) || LOAN_HERO_ASSET;
  const illustrationAlt = heroImageAlt?.trim() || `${title} illustration`;
  const points = benefitPoints?.length
    ? benefitPoints
    : categoryMode
      ? LOAN_CATEGORY_HERO_BENEFITS
      : HUB_TRUST_POINTS;

  return (
    <header className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-[#f8fafc] to-[#fff7ed]/40">
      <CmsMediaPreload href={illustrationSrc} media={HERO_MEDIA} />

      <div
        className={`grid items-start gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(180px,0.6fr)] lg:items-center ${
          categoryMode
            ? 'p-3.5 sm:gap-4 sm:p-4 lg:gap-5 lg:p-5'
            : 'p-3.5 sm:gap-5 sm:p-5 lg:gap-6 lg:p-6'
        }`}
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#f97316]">
            Finance · Loans
          </p>
          <h1
            className={`mt-1 font-extrabold tracking-tight text-[#0b1f3a] ${
              categoryMode
                ? 'text-[1.3125rem] leading-snug sm:text-[1.625rem]'
                : 'text-[1.375rem] sm:text-[1.75rem] sm:leading-tight'
            }`}
          >
            {title}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-600">{intro}</p>

          <ul className="mt-2.5 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1">
            {points.map((label) => (
              <li key={label} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <span className="text-[#f97316]" aria-hidden>
                  ✓
                </span>
                {label}
              </li>
            ))}
          </ul>

          {!categoryMode ? (
            <nav
              aria-label="Loan categories"
              className="-mx-1 mt-3 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:[scrollbar-width:thin] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:[&::-webkit-scrollbar]:block"
            >
              <Link
                href="/finance/loans"
                className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2 ${
                  !activeCategorySlug
                    ? 'border-[#0b1f3a] bg-[#0b1f3a]'
                    : 'border-slate-200 bg-white hover:border-[#0b1f3a]/40'
                }`}
                style={{ color: !activeCategorySlug ? '#ffffff' : '#334155' }}
              >
                All Loans
              </Link>
              {categories.map((cat) => {
                const active = activeCategorySlug === cat.slug;
                return (
                  <Link
                    key={cat.id}
                    href={`/finance/loans/${encodeURIComponent(cat.slug)}`}
                    className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2 ${
                      active
                        ? 'border-[#0b1f3a] bg-[#0b1f3a]'
                        : 'border-slate-200 bg-white hover:border-[#0b1f3a]/40'
                    }`}
                    style={{ color: active ? '#ffffff' : '#334155' }}
                  >
                    <HubIcon name={loanCategoryIcon(cat.slug)} className="h-3.5 w-3.5 opacity-80" />
                    {cat.name}
                  </Link>
                );
              })}
            </nav>
          ) : null}

          <Suspense
            fallback={
              <div
                className="mt-3 h-[7.5rem] rounded-2xl bg-[#0b1f3a]/[0.03] ring-1 ring-slate-200/70"
                aria-hidden
              />
            }
          >
            <LoanHubQuickFinder
              categories={categories}
              activeCategorySlug={activeCategorySlug}
              compareCtaLabel={compareCtaLabel}
              eligibilityLabel={eligibilityLabel}
            />
          </Suspense>
        </div>

        <div className="relative mx-auto hidden w-full max-w-[200px] sm:block md:max-w-[220px] lg:max-w-none">
          <div
            className={`relative z-[1] mx-auto aspect-video w-full opacity-90 ${
              categoryMode
                ? 'max-h-[150px] sm:max-h-[160px] md:max-h-[180px] lg:max-h-[190px]'
                : 'max-h-[180px] sm:max-h-[200px] md:max-h-[220px] lg:max-h-[240px]'
            }`}
          >
            <CmsMediaImage
              src={illustrationSrc}
              alt={illustrationAlt}
              width={640}
              height={360}
              media={HERO_MEDIA}
              sizes="(max-width: 640px) 0px, (max-width: 1024px) 220px, 320px"
              objectFit="contain"
              loading="eager"
              fetchPriority="high"
              imgClassName={
                categoryMode
                  ? 'max-h-[150px] sm:max-h-[160px] md:max-h-[180px] lg:max-h-[190px]'
                  : 'max-h-[180px] sm:max-h-[200px] md:max-h-[220px] lg:max-h-[240px]'
              }
            />
          </div>
        </div>
      </div>
    </header>
  );
}
