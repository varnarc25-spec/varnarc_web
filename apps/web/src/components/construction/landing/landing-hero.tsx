'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { AskConstructionSearch } from '@/components/construction/ask/ask-construction-search';
import { cn, cx } from '@/components/construction/styles';
import { LANDING_SEARCH_EXAMPLES } from '@/lib/construction/landing';
import { resolveAskConstructionQuery, askResultsPath } from '@/lib/construction/ask';
import { trackAskResultClicked, trackLandingCtaClicked } from '@/lib/construction/analytics';
import { useRouter } from 'next/navigation';

const TRUST_ITEMS = [
  { label: 'Accurate estimates', icon: 'chart' },
  { label: 'City-wise rates', icon: 'pin' },
  { label: 'Detailed BOQ', icon: 'list' },
  { label: 'Save & manage projects', icon: 'folder' },
  { label: 'Find trusted professionals', icon: 'people' },
] as const;

const CHECKLIST = [
  'Estimate costs',
  'Plan materials',
  'Control budget',
  'Complete with confidence',
] as const;

function TrustIcon({ name }: { name: (typeof TRUST_ITEMS)[number]['icon'] }) {
  const common = {
    viewBox: '0 0 20 20',
    className: 'h-4 w-4 shrink-0 text-[#f97316]',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };
  if (name === 'chart') {
    return (
      <svg {...common}>
        <path d="M3 16V8M8 16V4M13 16v-6M18 16V6" />
      </svg>
    );
  }
  if (name === 'pin') {
    return (
      <svg {...common}>
        <path d="M10 17s5-4.2 5-8a5 5 0 1 0-10 0c0 3.8 5 8 5 8Z" />
        <circle cx="10" cy="9" r="1.6" />
      </svg>
    );
  }
  if (name === 'list') {
    return (
      <svg {...common}>
        <path d="M6 5h11M6 10h11M6 15h11M3.5 5h.01M3.5 10h.01M3.5 15h.01" />
      </svg>
    );
  }
  if (name === 'folder') {
    return (
      <svg {...common}>
        <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h3L9 6.5h6.5A1.5 1.5 0 0 1 17 8v7.5A1.5 1.5 0 0 1 15.5 17h-11A1.5 1.5 0 0 1 3 15.5v-9Z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="7" cy="7" r="2.2" />
      <circle cx="13.5" cy="7.5" r="2" />
      <path d="M3 16c.4-2.4 2.2-4 4.2-4s3.8 1.6 4.2 4M12 12.2c1.7 0 3.3 1.2 3.8 3.3" />
    </svg>
  );
}

function HouseIllustration() {
  return (
    <svg
      viewBox="0 0 280 160"
      className="mx-auto h-auto w-full max-w-[280px] text-[#0b1f3a]"
      role="img"
      aria-label="Line illustration of a house from foundation to roof"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M24 148h232" stroke="#94a3b8" />
        <path d="M48 148V92h184v56" />
        <path d="M40 94 140 36l100 58" />
        <path d="M140 36v-10" />
        <rect x="118" y="28" width="44" height="8" rx="1" />
        <rect x="72" y="108" width="36" height="40" />
        <rect x="172" y="102" width="40" height="28" />
        <path d="M172 116h40M192 102v28" stroke="#94a3b8" />
        <path d="M80 108v40M90 108v40M100 108v40" stroke="#cbd5e1" />
        <rect x="118" y="112" width="28" height="36" fill="#fff7ed" stroke="#f97316" />
        <path d="M132 148V124" stroke="#f97316" />
        <circle cx="140" cy="136" r="1.4" fill="#f97316" stroke="none" />
        <path d="M56 148h168" stroke="#f97316" strokeWidth="1.2" />
      </g>
    </svg>
  );
}

export function ConstructionLandingHero() {
  const router = useRouter();
  const [sticky, setSticky] = useState(false);
  const heroRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setSticky(!entry.isIntersecting);
      },
      { rootMargin: '-64px 0px 0px 0px', threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function runExample(label: string, fallbackHref: string) {
    const decision = resolveAskConstructionQuery(label);
    const href =
      decision.autoRoute && decision.href
        ? decision.href
        : (decision.results[0]?.href ?? askResultsPath(label));
    trackAskResultClicked({
      intent: decision.parse.intent,
      result_type: 'example',
      path: href || fallbackHref,
    });
    trackLandingCtaClicked({ cta_key: 'hero_example', surface: 'hero', path: href });
    router.push(href || fallbackHref);
  }

  return (
    <>
      <section
        ref={heroRef}
        className="full-bleed overflow-x-hidden border-b border-slate-200/70 bg-[#f4f7fb]"
        aria-labelledby="construction-landing-h1"
      >
        <div className="site-container py-8 sm:py-10 lg:py-12">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Home & Construction' }]} />

          <div className="mt-5 grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)] lg:items-start lg:gap-10">
            <div className="min-w-0">
              <h1
                id="construction-landing-h1"
                className="text-[1.7rem] font-extrabold tracking-tight text-[#0b1f3a] sm:text-4xl lg:text-[2.35rem] lg:leading-[1.15]"
              >
                Plan, quantify and manage your construction project
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Calculate costs, estimate materials, generate BOQ, compare options and connect with
                trusted professionals — all in one place.
              </p>

              <ul className="mt-5 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                {TRUST_ITEMS.map((item) => (
                  <li
                    key={item.label}
                    className="flex min-h-11 items-center gap-2 text-sm font-medium text-[#0b1f3a]"
                  >
                    <TrustIcon name={item.icon} />
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Link
                  href="/construction/project/new"
                  onClick={() =>
                    trackLandingCtaClicked({
                      cta_key: 'hero_create_project',
                      surface: 'hero',
                      path: '/construction/project/new',
                    })
                  }
                  className={cn(cx.accentBtn, 'w-full sm:w-auto sm:min-w-[10.5rem]')}
                >
                  Create project
                </Link>
                <Link
                  href="/construction/boq"
                  onClick={() =>
                    trackLandingCtaClicked({
                      cta_key: 'hero_open_boq',
                      surface: 'hero',
                      path: '/construction/boq',
                    })
                  }
                  className={cn(cx.secondaryBtn, 'w-full sm:w-auto sm:min-w-[10.5rem]')}
                >
                  Open BOQ
                </Link>
              </div>
            </div>

            <aside
              className="min-w-0 rounded-[12px] border border-slate-200 bg-white p-5 shadow-[0_1px_8px_rgba(15,23,42,0.06)] sm:p-6"
              aria-labelledby="construction-hero-card-heading"
            >
              <HouseIllustration />
              <h2
                id="construction-hero-card-heading"
                className="mt-4 text-base font-bold leading-snug text-[#0b1f3a] sm:text-lg"
              >
                From foundation to finish, build smarter with Varnarc
              </h2>
              <ul className="mt-4 space-y-2.5">
                {CHECKLIST.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#fff7ed] text-xs font-bold text-[#f97316]"
                      aria-hidden
                    >
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>

          <div className="mt-8 max-w-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ask Varnarc Construction
            </p>
            <AskConstructionSearch
              id="construction-intent-search"
              placeholder="cement required for 1500 sqft, cost to build 3 BHK in Hyderabad…"
            />
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Try an example
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {LANDING_SEARCH_EXAMPLES.map((example) => (
                <li key={example.label}>
                  <button
                    type="button"
                    onClick={() => runExample(example.label, example.href)}
                    className={cn(
                      'rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-[#0b1f3a]',
                      'hover:border-[#f97316] hover:text-[#f97316]',
                      cx.focus,
                    )}
                  >
                    {example.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {sticky ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-lg gap-2">
            <Link
              href="/construction/boq"
              className={cn(cx.secondaryBtn, 'flex-1')}
              onClick={() =>
                trackLandingCtaClicked({
                  cta_key: 'sticky_boq',
                  surface: 'mobile_sticky',
                  path: '/construction/boq',
                })
              }
            >
              Open BOQ
            </Link>
            <Link
              href="/construction/project/new"
              className={cn(cx.accentBtn, 'flex-1')}
              onClick={() =>
                trackLandingCtaClicked({
                  cta_key: 'sticky_create_project',
                  surface: 'mobile_sticky',
                  path: '/construction/project/new',
                })
              }
            >
              Create project
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
