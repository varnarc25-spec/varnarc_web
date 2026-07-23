import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { RelatedArticles } from '@/components/finance/related-articles';
import { RecordContentView } from '@/components/record-content-view';
import { fetchFinanceGuide } from '@/services/finance';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data } = await fetchFinanceGuide(slug);
    return buildSeoMetadata({
      entityType: 'finance_guide',
      entityId: slug,
      path: `/finance/guides/${slug}`,
      title: data.title,
      description: data.summary,
    });
  } catch {
    return { title: 'Guide', alternates: { canonical: `/finance/guides/${slug}` } };
  }
}

export default async function FinanceGuideDetailPage({ params }: Props) {
  const { slug } = await params;
  let guide: Awaited<ReturnType<typeof fetchFinanceGuide>>['data'];

  try {
    const result = await fetchFinanceGuide(slug);
    guide = result.data;
  } catch {
    notFound();
  }

  return (
    <ContentLayout
      title={guide.title}
      description={guide.summary ?? undefined}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Finance', href: '/finance' },
        { label: 'Guides', href: '/finance/guides' },
        { label: guide.title },
      ]}
    >
      <RecordContentView
        entityType="finance_guide"
        entityId={guide.id}
        metadata={{ slug: guide.slug, title: guide.title }}
      />
      {guide.category ? (
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#f97316]">{guide.category}</p>
      ) : null}

      {guide.content ? (
        <div className="prose prose-slate max-w-none text-sm leading-relaxed whitespace-pre-line">
          {guide.content}
        </div>
      ) : guide.summary ? (
        <p className="text-sm leading-relaxed text-slate-700">{guide.summary}</p>
      ) : (
        <p className="text-sm text-slate-600">Full guide content coming soon.</p>
      )}

      <RelatedArticles />
    </ContentLayout>
  );
}
