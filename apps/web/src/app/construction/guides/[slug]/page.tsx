import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { RelatedArticles } from '@/components/construction/related-articles';
import { RelatedCalculators } from '@/components/construction/construction-material-card';
import { fetchConstructionGuide } from '@/services/construction';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ slug: string }> };

const DEFAULT_CALCULATORS = [
  { href: '/calculators/construction-cost', label: 'Construction Cost Calculator' },
  { href: '/calculators/cement', label: 'Cement Calculator' },
  { href: '/calculators/concrete', label: 'Concrete Calculator' },
  { href: '/calculators/steel', label: 'Steel Calculator' },
];

const GUIDE_CALCULATORS: Record<string, Array<{ href: string; label: string }>> = {
  'cement-buying-guide': [
    { href: '/calculators/cement', label: 'Cement Calculator' },
    { href: '/calculators/concrete', label: 'Concrete Calculator' },
    { href: '/calculators/sand', label: 'Sand Calculator' },
    { href: '/calculators/aggregate', label: 'Aggregate Calculator' },
    { href: '/calculators/plaster', label: 'Plaster Calculator' },
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

  const calculatorLinks = GUIDE_CALCULATORS[slug] ?? DEFAULT_CALCULATORS;

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
      {guide.category ? (
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#f97316]">{guide.category}</p>
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

      <RelatedCalculators links={calculatorLinks} />
      <RelatedArticles />
    </ContentLayout>
  );
}
