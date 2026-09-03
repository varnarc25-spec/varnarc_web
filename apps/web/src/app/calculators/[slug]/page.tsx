import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { CalculatorRunner } from '@/features/calculators/calculator-runner';
import {
  CalculatorRelatedArticles,
  type RelatedArticle,
} from '@/features/calculators/calculator-related-articles';
import { CalculatorWorkspace } from '@/features/calculators/calculator-workspace';
import { CalculatorHeroIllustration } from '@/components/calculators/calculator-hero-illustration';
import { BookmarkButton } from '@/components/bookmark-button';
import { AUTOMOBILE_CALCULATOR_FAQS } from '@/lib/automobile/calculator-faqs';
import {
  automobileCalcPageKeyFromSlug,
  AUTOMOBILE_PAGE_DEFAULTS,
} from '@/lib/automobile/seo-pages';
import { AUTOMOBILE_CALCULATOR_LINKS } from '@/services/automobile';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { apiPublicFetch, ApiError } from '@/services/api-client';
import { RecordContentView } from '@/components/record-content-view';
import { SectionErrorBoundary } from '@/components/shared/section-error-boundary';
import {
  calculatorCanonicalPath,
  calculatorContextNotice,
  hasCalculatorQueryParams,
  parseCalculatorParams,
} from '@/lib/calculator-query';
import { loansHubPath } from '@/lib/finance-routes';
import { isLoanHubCategorySlug } from '@/lib/loan-hub-categories';
import Link from 'next/link';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function titleFromSlug(slug: string) {
  return slug
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

function normalizeFaq(
  faq: unknown,
  fallback: Array<{ q: string; a: string }>,
): Array<{ q: string; a: string }> {
  if (!Array.isArray(faq)) return fallback;
  const items = faq
    .filter((item): item is { q: string; a: string } => {
      return Boolean(item && typeof item === 'object' && 'q' in item && 'a' in item);
    })
    .map((item) => ({ q: String(item.q), a: String(item.a) }));
  return items.length ? items : fallback;
}

type CalculatorDetail = {
  id: string;
  name: string;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  slug: string;
  illustrationUrl?: string | null;
  illustrationAlt?: string | null;
  settings?: {
    mode?: string;
    layout?: string;
    steps?: Array<{ title: string; fields: string[] }>;
    fieldVisibility?: Record<string, Record<string, string[]>>;
    faq?: Array<{ q: string; a: string }>;
    relatedArticles?: {
      topicField?: string;
      topicCategorySlugs?: Record<string, string>;
      categorySlug?: string;
    };
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

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const flat: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(sp)) {
    flat[key] = Array.isArray(value) ? value[0] : value;
  }
  const filtered = hasCalculatorQueryParams(flat);
  const canonical = calculatorCanonicalPath(slug);

  try {
    const { data } = await apiPublicFetch<CalculatorDetail>(`/calculators/slug/${slug}`, {
      cache: 'no-store',
    });
    const metadata = await buildSeoMetadata({
      entityType: 'calculator',
      entityId: data.id,
      path: canonical,
      title: data.seoTitle || data.name,
      description: data.seoDescription || data.description,
    });
    return {
      ...metadata,
      alternates: { ...metadata.alternates, canonical },
      robots: filtered
        ? { index: false, follow: true }
        : (metadata.robots ?? { index: true, follow: true }),
    };
  } catch {
    return {
      title: titleFromSlug(slug),
      alternates: { canonical },
      robots: filtered ? { index: false, follow: true } : { index: true, follow: true },
    };
  }
}

export default async function CalculatorDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const parsedQuery = parseCalculatorParams(sp);
  const contextNotice = calculatorContextNotice(parsedQuery);
  let calc: CalculatorDetail | null = null;
  let relatedArticles: RelatedArticle[] = [];
  let relatedCalcs: Array<{ name: string; slug: string }> = [];
  const defaultLoanTopic = 'home';

  try {
    const { data } = await apiPublicFetch<CalculatorDetail>(`/calculators/slug/${slug}`, {
      cache: 'no-store',
    });
    calc = data;
    const topic =
      data.settings?.relatedArticles?.topicField === 'loanType' ? defaultLoanTopic : undefined;
    const articlesQs = topic ? `?topic=${encodeURIComponent(topic)}` : '';
    const [relatedRes, articlesRes] = await Promise.all([
      apiPublicFetch<Array<{ name: string; slug: string }>>(
        `/calculators/${data.id}/related`,
      ).catch(() => ({ data: [] as Array<{ name: string; slug: string }> })),
      apiPublicFetch<RelatedArticle[]>(
        `/calculators/${data.id}/related-articles${articlesQs}`,
      ).catch(() => ({ data: [] as RelatedArticle[] })),
    ]);
    relatedCalcs = Array.isArray(relatedRes.data) ? relatedRes.data : [];
    relatedArticles = Array.isArray(articlesRes.data) ? articlesRes.data : [];
  } catch (e) {
    if (!(e instanceof ApiError) || (e.status !== 404 && e.status !== 0)) {
      // keep empty
    }
  }

  const autoPageKey = automobileCalcPageKeyFromSlug(slug);
  const autoDefaults = autoPageKey ? AUTOMOBILE_PAGE_DEFAULTS[autoPageKey] : null;
  const name = autoDefaults?.h1 || calc?.name || titleFromSlug(slug);
  const description = autoDefaults?.description ?? calc?.description ?? undefined;
  const autoFaqs = (AUTOMOBILE_CALCULATOR_FAQS[slug] ?? []).map((item) => ({
    q: item.question,
    a: item.answer,
  }));
  const defaultFaq = autoFaqs.length
    ? autoFaqs
    : [
        {
          q: `How does the ${name} work?`,
          a: description || 'Enter your inputs and click Calculate to see instant results.',
        },
      ];
  const faq = normalizeFaq(calc?.settings?.faq, defaultFaq);
  const relatedFromAuto = autoDefaults
    ? AUTOMOBILE_CALCULATOR_LINKS.filter((l) => l.href !== autoDefaults.path).map((l) => ({
        name: l.label,
        slug: l.href.split('/').pop() || l.href,
        href: l.href,
      }))
    : [];
  const relatedMerged: Array<{ name: string; slug: string; href?: string }> = [
    ...relatedCalcs.map((c) => ({ name: c.name, slug: c.slug, href: `/calculators/${c.slug}` })),
    ...relatedFromAuto,
  ].filter(
    (item, index, list) =>
      list.findIndex((x) => (x.href ?? x.slug) === (item.href ?? item.slug)) === index,
  );

  const singlePageSlugs = new Set(['loan', 'emi', 'age']);
  const useWizard =
    !singlePageSlugs.has(slug) &&
    calc?.settings?.mode === 'wizard' &&
    calc.settings.steps?.length &&
    calc.settings.layout !== 'single';

  const calculatorSettings = calc?.settings
    ? useWizard
      ? calc.settings
      : { ...calc.settings, mode: undefined, steps: undefined }
    : calc?.settings;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
          { '@type': 'ListItem', position: 2, name: 'Calculators', item: '/calculators' },
          { '@type': 'ListItem', position: 3, name },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
      {
        '@type': 'HowTo',
        name: `How to use ${name}`,
        step: [
          { '@type': 'HowToStep', name: 'Enter inputs', text: 'Fill in the calculator fields.' },
          { '@type': 'HowToStep', name: 'Calculate', text: 'Click Calculate to see results.' },
          {
            '@type': 'HowToStep',
            name: 'Save or share',
            text: 'Optionally save or share your result.',
          },
        ],
      },
    ],
  };

  return (
    <PageShell
      title={name}
      description={
        description ?? 'Interactive calculator powered by the Varnarc Calculator Engine.'
      }
      illustration={
        <CalculatorHeroIllustration
          slug={slug}
          src={calc?.illustrationUrl}
          alt={calc?.illustrationAlt}
        />
      }
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Calculators', href: '/calculators' },
        { label: name },
      ]}
    >
      {calc?.id ? (
        <RecordContentView
          entityType="calculator"
          entityId={calc.id}
          metadata={{ slug, title: name }}
        />
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CalculatorWorkspace
        name={name}
        slug={slug}
        description={description}
        faq={faq}
        relatedCalculators={relatedMerged}
        relatedArticles={relatedArticles}
      >
        {calc?.id ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <BookmarkButton entityType="calculator" entityId={calc.id} />
          </div>
        ) : null}
        {contextNotice ? (
          <p className="rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-xs leading-relaxed text-slate-600">
            {contextNotice}
          </p>
        ) : null}
        {(() => {
          const categorySlug =
            parsedQuery.category && isLoanHubCategorySlug(parsedQuery.category)
              ? parsedQuery.category
              : null;
          const categoryByCalc: Record<string, { href: string; label: string }> = {
            'personal-loan-emi': {
              href: '/finance/loans/personal-loan',
              label: 'Compare Personal Loans',
            },
            'home-loan-emi': { href: '/finance/loans/home-loan', label: 'Compare Home Loans' },
            'car-loan': { href: '/finance/loans/car-loan', label: 'Compare Car Loans' },
            'education-loan-emi': {
              href: '/finance/loans/education-loan',
              label: 'Compare Education Loans',
            },
            'business-loan-emi': {
              href: '/finance/loans/business-loan',
              label: 'Compare Business Loans',
            },
            'gold-loan-emi': { href: '/finance/loans/gold-loan', label: 'Compare Gold Loans' },
            'bike-loan-emi': {
              href: '/finance/loans/two-wheeler-loan',
              label: 'Compare Two-Wheeler Loans',
            },
            'loan-against-property-emi': {
              href: '/finance/loans/loan-against-property',
              label: 'Compare Loan Against Property',
            },
            emi: { href: '/finance/loans', label: 'Browse all loans' },
          };
          const related = categorySlug
            ? {
                href: loansHubPath({ categorySlug }),
                label: `Compare ${categorySlug.replace(/-/g, ' ')} →`,
              }
            : categoryByCalc[slug];
          if (!related) return null;
          return (
            <p className="text-sm">
              <Link
                href={related.href}
                className="font-semibold text-[#0b1f3a] underline-offset-2 hover:text-[#f97316] hover:underline"
              >
                {related.label.endsWith('→') ? related.label : `${related.label} →`}
              </Link>
            </p>
          );
        })()}
        {calc?.id ? (
          <SectionErrorBoundary>
            <Suspense
              fallback={
                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
                  Loading calculator…
                </div>
              }
            >
              <CalculatorRunner
                calculatorId={calc.id}
                name={name}
                calculatorSlug={slug}
                fields={calc.fields ?? []}
                resultTemplate={calc.resultTemplate}
                settings={calculatorSettings}
              />
            </Suspense>
          </SectionErrorBoundary>
        ) : (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Calculator not found or API unavailable.
          </p>
        )}
      </CalculatorWorkspace>
      {calc?.id ? (
        <div className="mt-8">
          <SectionErrorBoundary>
            <CalculatorRelatedArticles
              calculatorId={calc.id}
              initialArticles={relatedArticles}
              relatedArticlesSettings={calc.settings?.relatedArticles}
              topicField={calc.settings?.relatedArticles?.topicField}
              defaultTopic={defaultLoanTopic}
            />
          </SectionErrorBoundary>
        </div>
      ) : null}
    </PageShell>
  );
}
