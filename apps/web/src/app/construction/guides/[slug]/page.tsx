import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { RelatedArticles } from '@/components/construction/related-articles';
import { RelatedCalculators } from '@/components/construction/construction-material-card';
import { GuideClusterLinkBlocks } from '@/components/construction/guide-clusters/guide-cluster-link-blocks';
import { fetchConstructionGuide } from '@/services/construction';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { constructionHubBreadcrumbs } from '@/lib/construction/seo';
import { notFound } from 'next/navigation';
import { buildGuideClusterLanding, resolveClusterSlugForCmsGuide } from '@varnarc/validation';
import { cx } from '@/components/construction/styles';

type Props = { params: Promise<{ slug: string }> };

const DEFAULT_CALCULATORS = [
  { href: '/calculators/construction-cost', label: 'Construction Cost Calculator' },
  { href: '/construction/cement-calculator', label: 'Cement Calculator' },
  { href: '/construction/concrete-calculator', label: 'Concrete Calculator' },
  { href: '/construction/steel-calculator', label: 'Steel Calculator' },
];

const GUIDE_CALCULATORS: Record<string, Array<{ href: string; label: string }>> = {
  'cement-buying-guide': [
    { href: '/construction/cement-calculator', label: 'Cement Calculator' },
    { href: '/construction/concrete-calculator', label: 'Concrete Calculator' },
    { href: '/construction/sand-calculator', label: 'Sand Calculator' },
    { href: '/construction/aggregate-calculator', label: 'Aggregate Calculator' },
    { href: '/construction/plaster-calculator', label: 'Plaster Calculator' },
  ],
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data } = await fetchConstructionGuide(slug);
    return buildSeoMetadata({
      entityType: 'construction_guide',
      entityId: slug,
      path: `/construction/guides/${slug}`,
      title: data.title,
      description: data.summary,
    });
  } catch {
    return { title: 'Guide', alternates: { canonical: `/construction/guides/${slug}` } };
  }
}

export default async function ConstructionGuideDetailPage({ params }: Props) {
  const { slug } = await params;
  let guide: Awaited<ReturnType<typeof fetchConstructionGuide>>['data'];

  try {
    const result = await fetchConstructionGuide(slug);
    guide = result.data;
  } catch {
    notFound();
  }

  const clusterSlug = resolveClusterSlugForCmsGuide(slug);
  const clusterLanding = clusterSlug ? buildGuideClusterLanding(clusterSlug) : null;
  const calculatorLinks = GUIDE_CALCULATORS[slug] ?? DEFAULT_CALCULATORS;
  const path = `/construction/guides/${slug}`;

  return (
    <ContentLayout
      title={guide.title}
      description={guide.summary ?? undefined}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Guides', href: '/construction/guides' },
        { label: guide.title },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Guides', path: '/construction/guides' },
          { name: guide.title, path },
        ])}
        article={{
          title: guide.title,
          description: guide.summary,
          path,
        }}
      />

      {guide.category ? (
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#f97316]">
          {guide.category}
        </p>
      ) : null}

      {clusterLanding ? (
        <p className="mb-4 text-sm text-slate-600">
          Part of the{' '}
          <Link href={clusterLanding.canonicalPath} className="font-semibold text-[#f97316]">
            {clusterLanding.title}
          </Link>{' '}
          topic hub.
        </p>
      ) : null}

      {guide.content ? (
        <div className="prose prose-slate max-w-none whitespace-pre-line text-sm leading-relaxed">
          {guide.content}
        </div>
      ) : guide.summary ? (
        <p className="text-sm leading-relaxed text-slate-700">{guide.summary}</p>
      ) : (
        <p className="text-sm text-slate-600">Full guide content coming soon.</p>
      )}

      {clusterLanding ? (
        <div className="mt-10">
          <GuideClusterLinkBlocks landing={clusterLanding} />
        </div>
      ) : (
        <RelatedCalculators links={calculatorLinks} />
      )}

      <RelatedArticles />

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/construction/topics" className={cx.secondaryBtn}>
          Topic hubs
        </Link>
        <Link href="/construction/guides" className={cx.secondaryBtn}>
          All guides
        </Link>
      </div>
    </ContentLayout>
  );
}
