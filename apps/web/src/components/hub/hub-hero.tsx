import Link from 'next/link';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { HubHeroSearch } from '@/components/hub/hub-hero-search';
import { HubHeroAside } from '@/components/hub/hub-hero-aside';
import type { HubHeroStep } from '@/lib/module-hub-configs';

export type HubCrumb = { label: string; href?: string };

export function HubHero({
  badge,
  title,
  description,
  breadcrumbs,
  searchPlaceholder,
  popularLinks,
  heroSteps,
  overviewTitle,
  searchPath = '/search',
}: {
  badge: string;
  title: string;
  description: string;
  breadcrumbs?: HubCrumb[];
  searchPlaceholder: string;
  popularLinks?: Array<{ label: string; href: string }>;
  heroSteps: HubHeroStep[];
  overviewTitle?: string;
  searchPath?: string;
}) {
  return (
    <section className="full-bleed bg-gradient-to-b from-sky-50 via-sky-50/60 to-white">
      <div className="site-container px-4 py-8 sm:py-10 lg:py-12">
        {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
        <div className="grid gap-10 lg:grid-cols-[1fr,minmax(280px,360px)] lg:items-start">
          <div>
            <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700">
              {badge}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0b1f3a] sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600 sm:text-lg">{description}</p>
            <div className="mt-6 max-w-xl">
              <HubHeroSearch placeholder={searchPlaceholder} searchPath={searchPath} />
            </div>
            {popularLinks?.length ? (
              <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="text-slate-500">Popular:</span>
                {popularLinks.map((link, i) => (
                  <span key={link.href} className="flex items-center gap-2">
                    <Link href={link.href} className="font-medium text-blue-600 hover:underline">
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
            ) : null}
          </div>
          <div className="hidden lg:block">
            <HubHeroAside overviewTitle={overviewTitle} steps={heroSteps} />
          </div>
        </div>
      </div>
    </section>
  );
}
