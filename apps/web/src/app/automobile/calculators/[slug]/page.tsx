import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AutomobileSeo } from '@/components/automobile/automobile-seo';
import { CalculatorHeroIllustration } from '@/components/calculators/calculator-hero-illustration';
import { PageShell } from '@/components/layout/page-shell';
import { CalculatorRunner } from '@/features/calculators/calculator-runner';
import { CalculatorWorkspace } from '@/features/calculators/calculator-workspace';
import { automobileHubBreadcrumbs, buildAutomobilePageMetadata } from '@/lib/automobile/seo';
import { AUTOMOBILE_CALCULATOR_FAQS } from '@/lib/automobile/calculator-faqs';
import {
  AutomobileFormulaTool,
  AUTOMOBILE_FORMULA_TOOLS,
} from '@/components/automobile/formula-tool';
import {
  AUTOMOBILE_CALC_PATH_SLUG,
  AUTOMOBILE_CALC_TOOL_SLUG,
  AUTOMOBILE_PAGE_DEFAULTS,
  automobileCalcPageKeyFromSlug,
} from '@/lib/automobile/seo-pages';
import { apiPublicFetch } from '@/services/api-client';
import { AUTOMOBILE_CALCULATOR_LINKS } from '@/services/automobile';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type CalculatorDetail = {
  id: string;
  name: string;
  description?: string | null;
  slug: string;
  illustrationUrl?: string | null;
  illustrationAlt?: string | null;
  settings?: {
    mode?: string;
    layout?: string;
    steps?: Array<{ title: string; fields: string[] }>;
    fieldVisibility?: Record<string, Record<string, string[]>>;
    faq?: Array<{ q: string; a: string }>;
  } | null;
  fields?: Array<{
    key: string;
    label: string;
    fieldType: string;
    defaultValue?: string | null;
    required?: boolean;
    options?: unknown;
    validation?: { min?: number; max?: number; step?: number } | null;
  }>;
  resultTemplate?: {
    cards?: Array<{ key: string; label: string; format?: string }>;
    table?: { title?: string; rows: Array<{ label: string; key: string; format?: string }> };
    chart?: { title?: string; keys: string[]; labels?: Record<string, string> };
    breakdown?: { title?: string; items: Array<{ label: string; key: string; format?: string }> };
  } | null;
};

export function generateStaticParams() {
  return Object.values(AUTOMOBILE_CALC_PATH_SLUG).map((slug) => ({ slug }));
}

export async function generateMetadata({ params, searchParams }: Props) {
  const { slug } = await params;
  const pageKey = automobileCalcPageKeyFromSlug(slug);
  if (!pageKey) return { title: 'Calculator' };
  const sp = await searchParams;
  return buildAutomobilePageMetadata(pageKey, { searchParams: sp });
}

export default async function AutomobileCalculatorLandingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const pageKey = automobileCalcPageKeyFromSlug(slug);
  if (!pageKey) notFound();

  const defaults = AUTOMOBILE_PAGE_DEFAULTS[pageKey];
  const landingFaqs = AUTOMOBILE_CALCULATOR_FAQS[slug] ?? [];
  const sp = await searchParams;
  void sp;

  const apiSlug = AUTOMOBILE_CALC_TOOL_SLUG[pageKey];
  let calc: CalculatorDetail | null = null;
  try {
    const { data } = await apiPublicFetch<CalculatorDetail>(`/calculators/slug/${apiSlug}`, {
      cache: 'no-store',
    });
    calc = data;
  } catch {
    calc = null;
  }

  const formulaTool = AUTOMOBILE_FORMULA_TOOLS[slug];
  const faq = landingFaqs.map((item) => ({ q: item.question, a: item.answer }));
  const relatedCalculators = AUTOMOBILE_CALCULATOR_LINKS.filter(
    (l) => l.href !== defaults.path,
  ).map((l) => ({
    name: l.label,
    slug: l.href.split('/').pop() || l.href,
    href: l.href,
  }));

  return (
    <>
      <AutomobileSeo
        breadcrumbs={automobileHubBreadcrumbs([
          { name: 'Calculators', path: '/automobile/calculators' },
          { name: defaults.label, path: defaults.path },
        ])}
        webApplication={{
          name: defaults.h1,
          description: defaults.description,
          path: defaults.path,
        }}
        faqs={landingFaqs}
      />
      <PageShell
        title={defaults.h1}
        description={defaults.description}
        illustration={
          <CalculatorHeroIllustration
            slug={slug}
            src={calc?.illustrationUrl}
            alt={calc?.illustrationAlt}
          />
        }
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Automobile', href: '/automobile' },
          { label: 'Calculators', href: '/automobile/calculators' },
          { label: defaults.label },
        ]}
      >
        <CalculatorWorkspace
          name={defaults.h1}
          slug={slug}
          description={defaults.description}
          faq={faq}
          relatedCalculators={relatedCalculators}
        >
          {calc ? (
            <Suspense fallback={<p className="text-sm text-slate-500">Loading calculator…</p>}>
              <CalculatorRunner
                calculatorId={calc.id}
                calculatorSlug={calc.slug}
                name={calc.name}
                fields={calc.fields ?? []}
                resultTemplate={calc.resultTemplate ?? null}
                settings={
                  calc.settings
                    ? { ...calc.settings, mode: undefined, steps: undefined }
                    : calc.settings
                }
              />
            </Suspense>
          ) : formulaTool ? (
            <AutomobileFormulaTool slug={slug} />
          ) : (
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              This ownership calculator is temporarily unavailable.{' '}
              <Link
                href={`/calculators/${apiSlug}`}
                className="font-medium text-[#ea580c] hover:underline"
              >
                Try the main calculator page →
              </Link>
            </p>
          )}
          {calc && formulaTool ? (
            <section className="mt-2">
              <h2 className="mb-3 text-lg font-extrabold text-[#0b1f3a]">Quick planner</h2>
              <AutomobileFormulaTool slug={slug} />
            </section>
          ) : null}
        </CalculatorWorkspace>
      </PageShell>
    </>
  );
}
