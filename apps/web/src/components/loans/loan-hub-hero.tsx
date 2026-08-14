import Link from 'next/link';
import type { FinanceCategory } from '@/services/finance';
import { HubIcon } from '@/components/hub/hub-icons';
import { CmsMediaImage, CmsMediaPreload } from '@/components/cms/cms-media-image';
import { LoanHubQuickFinder } from '@/components/loans/loan-hub-quick-finder';
import { loanCategoryIcon } from '@/lib/loan-category-icons';
import { LOAN_HERO_ASSET, isVarnarcHubAsset } from '@/lib/loan-visual-assets';

const TRUST_POINTS = [
  'Compare multiple lenders',
  'Estimate monthly EMI',
  'Explore without signing in',
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
}: {
  title: string;
  intro: string;
  categories: FinanceCategory[];
  activeCategorySlug?: string;
  heroImageUrl?: string | null;
  heroImageAlt?: string | null;
}) {
  // Prefer first-party hub art only — mixed CMS photography breaks visual system.
  const illustrationSrc =
    (isVarnarcHubAsset(heroImageUrl) ? heroImageUrl!.trim() : null) || LOAN_HERO_ASSET;
  const illustrationAlt = heroImageAlt?.trim() || `${title} illustration`;

  return (
    <header className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-[#f8fafc] to-[#fff7ed]/50">
      <CmsMediaPreload href={illustrationSrc} media={HERO_MEDIA} />

      <div className="grid items-start gap-3 p-3.5 sm:gap-5 sm:p-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(200px,0.65fr)] lg:items-center lg:gap-6 lg:p-6">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#f97316]">
            Finance · Loans
          </p>
          <h1 className="mt-1 text-[1.375rem] font-extrabold tracking-tight text-[#0b1f3a] sm:text-[1.75rem] sm:leading-tight">
            {title}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-600">{intro}</p>

          <ul className="mt-2.5 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1">
            {TRUST_POINTS.map((label) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 text-[11px] text-slate-500"
              >
                <span className="text-[#f97316]" aria-hidden>
                  ✓
                </span>
                {label}
              </li>
            ))}
          </ul>

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

          <LoanHubQuickFinder categories={categories} activeCategorySlug={activeCategorySlug} />
        </div>

        <div className="relative mx-auto hidden w-full max-w-[220px] sm:block md:max-w-[260px] lg:max-w-none">
          <div className="relative z-[1] mx-auto aspect-video w-full max-h-[180px] opacity-90 sm:max-h-[200px] md:max-h-[220px] lg:max-h-[240px]">
            <CmsMediaImage
              src={illustrationSrc}
              alt={illustrationAlt}
              width={640}
              height={360}
              media={HERO_MEDIA}
              sizes="(max-width: 640px) 0px, (max-width: 1024px) 260px, 360px"
              objectFit="contain"
              loading="eager"
              fetchPriority="high"
              imgClassName="max-h-[180px] sm:max-h-[200px] md:max-h-[220px] lg:max-h-[240px]"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
