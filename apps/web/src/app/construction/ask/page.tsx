import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { AskConstructionSearch } from '@/components/construction/ask/ask-construction-search';
import { AskResultsClient } from '@/components/construction/ask/ask-results-client';
import { buildConstructionMetadata } from '@/lib/construction/seo';
import { resolveAskConstructionQuery } from '@/lib/construction/ask';
import { cx } from '@/components/construction/styles';

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  return buildConstructionMetadata({
    title: 'Ask Varnarc Construction | Search tools & guides',
    description:
      'Interpret construction questions and jump to estimators, calculators, comparisons and guides.',
    path: '/construction/ask',
    searchParams: params,
    forceNoIndex: true,
  });
}

/**
 * Low-confidence Ask results — navigation only (noindex).
 * Crawlable architecture remains on normal Construction pages.
 */
export default async function ConstructionAskPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = (params.q ?? '').trim().slice(0, 120);
  const decision = q ? resolveAskConstructionQuery(q) : null;

  return (
    <ContentLayout
      title="Ask Varnarc Construction"
      description="We interpret common construction questions and suggest the best Varnarc tools. Prefer browsing guides and calculators when you want crawlable pages."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Ask' },
      ]}
    >
      <div className="max-w-2xl">
        <AskConstructionSearch initialQuery={q} autoFocus={!q} />
      </div>

      {q && decision ? (
        <AskResultsClient
          query={q}
          intent={decision.parse.intent}
          category={decision.parse.category}
          confidence={decision.parse.confidence}
          values={decision.parse.values}
          correctedTokens={decision.parse.correctedTokens}
          results={decision.results}
        />
      ) : (
        <p className="mt-6 max-w-2xl text-sm text-slate-600">
          Try questions like “cement required for 1500 sqft” or browse{' '}
          <Link href="/construction/guides" className={cx.link}>
            guides
          </Link>
          ,{' '}
          <Link href="/construction/estimate" className={cx.link}>
            cost estimator
          </Link>
          , and{' '}
          <Link href="/construction/cement-calculator" className={cx.link}>
            material calculators
          </Link>
          .
        </p>
      )}
    </ContentLayout>
  );
}
