import Link from 'next/link';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { HubHeroSearch } from '@/components/hub/hub-hero-search';
import { HubHeroOverview } from '@/components/hub/hub-hero-overview';
import { HubHeroSteps } from '@/components/hub/hub-hero-steps';
import { HubHeroAsideStack } from '@/components/hub/hub-hero-aside-stack';
import { HubFinanceHeroActions } from '@/components/hub/hub-finance-hero-actions';
import type { HubHeroStep } from '@/lib/module-hub-configs';

export type HubCrumb = { label: string; href?: string };

export function HubHero({
  moduleKey = 'finance',
  badge,
  title,
  description,
  breadcrumbs,
  searchPlaceholder,
  popularLinks,
  heroSteps,
  overviewTitle,
  searchPath = '/search',
  showBreadcrumbs = true,
  popularLabel = 'Popular:',
  popularStyle = 'links',
}: {
  moduleKey?: string;
  badge: string;
  title: string;
  description: string;
  breadcrumbs?: HubCrumb[];
  searchPlaceholder: string;
  popularLinks?: Array<{ label: string; href: string }>;
  heroSteps: HubHeroStep[];
  overviewTitle?: string;
  searchPath?: string;
  showBreadcrumbs?: boolean;
  popularLabel?: string;
  popularStyle?: 'links' | 'pills';
}) {
  const isFinanceLayout = moduleKey === 'finance';

  return (
    <section className="full-bleed border-b border-slate-200/60 bg-[#f4f7fb]">
      <div className="site-container py-10 sm:py-12 lg:py-14">
        {showBreadcrumbs && breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
        <div
          className={
            isFinanceLayout
              ? 'grid gap-10 lg:grid-cols-[1fr_minmax(280px,420px)] lg:items-center lg:gap-12 xl:grid-cols-[1.05fr_0.95fr]'
              : 'grid gap-6 lg:grid-cols-3 lg:items-start lg:gap-5 xl:gap-6'
          }
        >
          <div className="min-w-0">
            <span className="inline-block rounded-full bg-blue-100/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-800">
              {badge}
            </span>
            <h1
              className={
                isFinanceLayout
                  ? 'mt-4 text-[1.75rem] font-extrabold tracking-tight text-[#0b1f3a] sm:text-4xl lg:text-[2.125rem] lg:leading-[1.2]'
                  : 'mt-4 text-3xl font-extrabold tracking-tight text-[#0b1f3a] sm:text-4xl lg:text-[2rem] lg:leading-tight xl:text-[2.5rem]'
              }
            >
              {title}
            </h1>
            <p className="hub-text-muted mt-4 max-w-xl leading-relaxed">{description}</p>

            {isFinanceLayout ? (
              <HubFinanceHeroActions
                searchPlaceholder={searchPlaceholder}
                searchPath={searchPath}
              />
            ) : (
              <div className="mt-6 max-w-xl">
                <HubHeroSearch placeholder={searchPlaceholder} searchPath={searchPath} />
              </div>
            )}

            {popularLinks?.length && !isFinanceLayout ? (
              <div className="mt-5">
                <div className="hub-text-meta">{popularLabel}</div>
                {popularStyle === 'pills' ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {popularLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="inline-flex min-h-9 items-center rounded-full border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    {popularLinks.map((link, i) => (
                      <span key={link.href} className="flex items-center gap-2">
                        <Link
                          href={link.href}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {link.label}
                        </Link>
                        {i < popularLinks.length - 1 ? (
                          <span className="text-slate-300" aria-hidden>
                            ·
                          </span>
                        ) : null}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {isFinanceLayout ? (
            <div className="min-w-0 lg:max-w-[420px] lg:justify-self-end xl:max-w-none">
              <HubHeroAsideStack steps={heroSteps} overviewTitle={overviewTitle} />
            </div>
          ) : (
            <>
              <div className="hidden min-w-0 lg:block lg:col-span-1">
                <HubHeroOverview title={overviewTitle} />
              </div>
              <div className="hidden min-w-0 lg:block lg:col-span-1">
                <HubHeroSteps steps={heroSteps} />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
