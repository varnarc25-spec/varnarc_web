import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AutomobileSeo } from '@/components/automobile/automobile-seo';
import { PageShell } from '@/components/layout/page-shell';
import { HubFaqSection } from '@/components/hub/hub-faq-section';
import { CalculatorRunner } from '@/features/calculators/calculator-runner';
import { automobileHubBreadcrumbs, buildAutomobilePageMetadata } from '@/lib/automobile/seo';
import { AutomobileFormulaTool, AUTOMOBILE_FORMULA_TOOLS } from '@/components/automobile/formula-tool';
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

const CALC_FAQS: Record<string, Array<{ question: string; answer: string }>> = {
  'car-loan': [
    {
      question: 'Is this car loan EMI a bank offer?',
      answer:
        'No. Results are educational estimates based on the inputs you enter. Final EMI depends on the lender’s rate, fees and eligibility.',
    },
    {
      question: 'Should I use ex-showroom or on-road price?',
      answer:
        'Prefer an estimated on-road amount for your city (tax, insurance, dealer charges). Using only ex-showroom understates the financed amount.',
    },
  ],
  fuel: [
    {
      question: 'How accurate is the fuel cost estimate?',
      answer:
        'It depends on real mileage, traffic and fuel price. Use recent local fuel rates and your typical monthly kilometres for a closer plan.',
    },
    {
      question: 'Can I compare petrol vs diesel running cost?',
      answer:
        'Run the calculator twice with each fuel price and mileage claim, then compare monthly totals alongside insurance and maintenance.',
    },
  ],
  mileage: [
    {
      question: 'Why does real mileage differ from brochure figures?',
      answer:
        'Test-cycle mileage often differs from city/highway mix, load and driving style. Track a few tanks for a personal baseline.',
    },
    {
      question: 'How do I use mileage in ownership planning?',
      answer:
        'Combine calculated km/l with monthly distance in the fuel cost calculator to estimate running spend before buying.',
    },
  ],
  'car-insurance': [
    {
      question: 'Is this insurance premium a binding quote?',
      answer:
        'No. It is an indicative planner. Insurers price by IDV, location, NCB, add-ons and underwriting — always get a formal quote.',
    },
    {
      question: 'What should I budget besides premium?',
      answer:
        'Include compulsory personal accident cover and any add-ons you need. Renewals and no-claim bonus affect year-two cost.',
    },
  ],
  depreciation: [
    {
      question: 'Does depreciation equal resale value?',
      answer:
        'Depreciation estimates help plan total cost of ownership. Actual resale depends on demand, condition, service history and market timing.',
    },
    {
      question: 'How many years should I model?',
      answer:
        'Many buyers plan 3–5 years of ownership. Try a few horizons and include EMI + fuel + insurance for a fuller picture.',
    },
  ],
  'maintenance-cost': [
    {
      question: 'Are service costs the same everywhere?',
      answer:
        'Labour and parts vary by city and authorised vs independent workshops. Use estimates as a budget band, then confirm locally.',
    },
    {
      question: 'What else belongs in ownership cost?',
      answer:
        'Add EMI (if financed), fuel, insurance, tyres and unexpected repairs. Pair this tool with the other automobile calculators.',
    },
  ],
};

type CalculatorDetail = {
  id: string;
  name: string;
  description?: string | null;
  slug: string;
  settings?: {
    mode?: string;
    layout?: string;
    steps?: Array<{ title: string; fields: string[] }>;
    fieldVisibility?: Record<string, Record<string, string[]>>;
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
  const faqs = CALC_FAQS[slug] ?? [];
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

  const siblings = AUTOMOBILE_CALCULATOR_LINKS.filter((l) => l.href !== defaults.path).map((l) => ({
    label: l.label,
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
        faqs={faqs}
      />
      <PageShell
        title={defaults.h1}
        description={defaults.description}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Automobile', href: '/automobile' },
          { label: 'Calculators', href: '/automobile/calculators' },
          { label: defaults.label },
        ]}
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
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-extrabold text-[#0b1f3a]">Quick planner</h2>
            <AutomobileFormulaTool slug={slug} />
          </section>
        ) : null}

        <HubFaqSection
          title="Ownership planning FAQs"
          faqs={faqs.map((f, i) => ({
            id: `${slug}-faq-${i}`,
            question: f.question,
            answer: f.answer,
          }))}
        />

        <section className="mt-10">
          <h2 className="text-lg font-extrabold text-[#0b1f3a]">More ownership tools</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {siblings.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-[#0b1f3a] hover:border-[#ea580c]"
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </PageShell>
    </>
  );
}
