import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';
import { AdBanner } from '@/components/business/ad-banner';
import { CalculatorRunner } from '@/features/calculators/calculator-runner';
import {
  CalculatorRelatedArticles,
  type RelatedArticle,
} from '@/features/calculators/calculator-related-articles';
import { CalculatorInfoPanel } from '@/features/calculators/calculator-info-panel';
import { BookmarkButton } from '@/components/bookmark-button';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { apiPublicFetch, ApiError } from '@/services/api-client';
import { RecordContentView } from '@/components/record-content-view';
import { SectionErrorBoundary } from '@/components/shared/section-error-boundary';

type Props = { params: Promise<{ slug: string }> };

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
  settings?: {
    mode?: string;
    steps?: Array<{ title: string; fields: string[] }>;
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data } = await apiPublicFetch<CalculatorDetail>(`/calculators/slug/${slug}`, {
      cache: 'no-store',
    });
    return buildSeoMetadata({
      entityType: 'calculator',
      entityId: data.id,
      path: `/calculators/${slug}`,
      title: data.seoTitle || data.name,
      description: data.seoDescription || data.description,
    });
  } catch {
    return { title: titleFromSlug(slug), alternates: { canonical: `/calculators/${slug}` } };
  }
}

export default async function CalculatorDetailPage({ params }: Props) {
  const { slug } = await params;
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
      apiPublicFetch<Array<{ name: string; slug: string }>>(`/calculators/${data.id}/related`).catch(
        () => ({ data: [] as Array<{ name: string; slug: string }> }),
      ),
      apiPublicFetch<RelatedArticle[]>(`/calculators/${data.id}/related-articles${articlesQs}`).catch(
        () => ({ data: [] as RelatedArticle[] }),
      ),
    ]);
    relatedCalcs = Array.isArray(relatedRes.data) ? relatedRes.data : [];
    relatedArticles = Array.isArray(articlesRes.data) ? articlesRes.data : [];
  } catch (e) {
    if (!(e instanceof ApiError) || (e.status !== 404 && e.status !== 0)) {
      // keep empty
    }
  }

  const name = calc?.name || titleFromSlug(slug);
  const description = calc?.description ?? undefined;
  const defaultFaq = [
    {
      q: `How does the ${name} work?`,
      a: description || 'Enter your inputs and click Calculate to see instant results.',
    },
  ];
  const faq = normalizeFaq(calc?.settings?.faq, defaultFaq);

  const calculatorSettings =
    calc?.settings && slug === 'loan'
      ? { ...calc.settings, mode: undefined, steps: undefined }
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
          { '@type': 'HowToStep', name: 'Save or share', text: 'Optionally save or share your result.' },
        ],
      },
    ],
  };

  return (
    <PageShell
      title={name}
      description={description ?? 'Interactive calculator powered by the Varnarc Calculator Engine.'}
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-5 lg:items-start">
          <div className="space-y-4 lg:col-span-3">
            {calc?.id ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <BookmarkButton entityType="calculator" entityId={calc.id} />
              </div>
            ) : null}
            {calc?.id ? (
              <SectionErrorBoundary>
                <CalculatorRunner
                  calculatorId={calc.id}
                  name={name}
                  calculatorSlug={slug}
                  fields={calc.fields ?? []}
                  resultTemplate={calc.resultTemplate}
                  settings={calculatorSettings}
                />
              </SectionErrorBoundary>
            ) : (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Calculator not found or API unavailable.
              </p>
            )}
          </div>

          {calc?.id ? (
            <div className="space-y-5 lg:col-span-2">
              <AdBanner slot="calculator-sidebar" />
              <CalculatorInfoPanel
                name={name}
                slug={slug}
                description={description}
                faq={faq}
                relatedCalculators={relatedCalcs}
                relatedArticles={relatedArticles}
              />
            </div>
          ) : null}
        </div>

        <AdBanner slot="calculator-bottom" />

        {calc?.id ? (
          <SectionErrorBoundary>
            <CalculatorRelatedArticles
              calculatorId={calc.id}
              initialArticles={relatedArticles}
              relatedArticlesSettings={calc.settings?.relatedArticles}
              topicField={calc.settings?.relatedArticles?.topicField}
              defaultTopic={defaultLoanTopic}
            />
          </SectionErrorBoundary>
        ) : null}
      </div>
    </PageShell>
  );
}
