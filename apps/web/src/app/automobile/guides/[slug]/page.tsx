import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { RelatedCalculators } from '@/components/automobile/vehicle-card';
import { AUTOMOBILE_CALCULATOR_LINKS, fetchAutomobileGuide } from '@/services/automobile';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data } = await fetchAutomobileGuide(slug);
    return buildSeoMetadata({
      entityType: 'automobile_guide',
      entityId: slug,
      path: `/automobile/guides/${slug}`,
      title: data.title,
      description: data.summary,
    });
  } catch {
    return { title: 'Guide', alternates: { canonical: `/automobile/guides/${slug}` } };
  }
}

export default async function AutomobileGuideDetailPage({ params }: Props) {
  const { slug } = await params;
  let guide: Awaited<ReturnType<typeof fetchAutomobileGuide>>['data'];

  try {
    const result = await fetchAutomobileGuide(slug);
    guide = result.data;
  } catch {
    notFound();
  }

  const body = guide.body || guide.content;

  return (
    <ContentLayout
      title={guide.title}
      description={guide.summary ?? undefined}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Automobile', href: '/automobile' },
        { label: 'Guides', href: '/automobile/guides' },
        { label: guide.title },
      ]}
    >
      {body ? (
        <div className="prose prose-slate max-w-none whitespace-pre-line text-sm leading-relaxed">
          {body}
        </div>
      ) : guide.summary ? (
        <p className="text-sm leading-relaxed text-slate-700">{guide.summary}</p>
      ) : (
        <p className="text-sm text-slate-600">Full guide content coming soon.</p>
      )}

      <RelatedCalculators links={AUTOMOBILE_CALCULATOR_LINKS} />
    </ContentLayout>
  );
}
