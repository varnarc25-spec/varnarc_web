import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContentLayout } from '@/components/layout/content-layout';
import { MarkdownContent } from '@/components/shared/markdown-content';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { fetchPageBySlug } from '@/services/content';
import { ApiError } from '@/services/api-client';
import { RecordContentView } from '@/components/record-content-view';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data } = await fetchPageBySlug(slug);
    return buildSeoMetadata({
      entityType: 'page',
      entityId: data.id,
      path: `/p/${slug}`,
      title: data.seo?.title || data.title,
      description: data.seo?.description,
    });
  } catch {
    return { title: 'Page' };
  }
}

export default async function CmsPageRoute({ params }: Props) {
  const { slug } = await params;
  try {
    const { data } = await fetchPageBySlug(slug);
    return (
      <>
        <RecordContentView entityType="page" entityId={data.id} metadata={{ slug, title: data.title }} />
        <ContentLayout
        title={data.title}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: data.title },
        ]}
      >
        <MarkdownContent content={data.content || ''} />
      </ContentLayout>
      </>
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}
