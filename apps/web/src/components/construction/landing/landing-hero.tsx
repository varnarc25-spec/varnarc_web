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
        className="full-bleed border-b border-slate-200/70 bg-[#f4f7fb]"
        aria-labelledby="construction-landing-h1"
      >
        <div className="site-container py-8 sm:py-10 lg:py-12">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Home & Construction' }]} />

          <div className="mt-2 max-w-3xl">
            <h1
              id="construction-landing-h1"
              className="text-[1.75rem] font-extrabold tracking-tight text-[#0b1f3a] sm:text-4xl lg:text-[2.35rem] lg:leading-[1.15]"
            >
              Plan your construction with confidence
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Estimate costs, calculate materials, compare options and plan your project with
              transparent construction tools.
            </p>
          </div>

          <div className="mt-6 max-w-2xl">
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

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/construction/estimate"
              onClick={() =>
                trackLandingCtaClicked({
                  cta_key: 'hero_estimate',
                  surface: 'hero',
                  path: '/construction/estimate',
                })
              }
              className={cx.primaryBtn}
            >
              Quick estimate
            </Link>
            <Link
              href="/construction/cement-calculator"
              onClick={() =>
                trackLandingCtaClicked({
                  cta_key: 'hero_materials',
                  surface: 'hero',
                  path: '/construction/cement-calculator',
                })
              }
              className={cx.secondaryBtn}
            >
              Material calculators
            </Link>
          </div>
        </div>
      </section>

      {sticky ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-lg gap-2">
            <button
              type="button"
              className={cn(cx.secondaryBtn, 'flex-1')}
              onClick={() => {
                heroRef.current?.scrollIntoView({ behavior: 'smooth' });
                document.getElementById('construction-intent-search')?.focus();
                trackLandingCtaClicked({ cta_key: 'sticky_search', surface: 'mobile_sticky' });
              }}
            >
              Ask
            </button>
            <Link
              href="/construction/estimate"
              className={cn(cx.primaryBtn, 'flex-1')}
              onClick={() =>
                trackLandingCtaClicked({
                  cta_key: 'sticky_estimate',
                  surface: 'mobile_sticky',
                  path: '/construction/estimate',
                })
              }
            >
              Calculate
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
