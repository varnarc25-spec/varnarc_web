import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { fetchTags } from '@/services/content';

export const metadata: Metadata = {
  title: 'Tags',
  description: 'Browse content by tag.',
  alternates: { canonical: '/tags' },
};

export const revalidate = 60;

const fallbackTags = [
  'emi',
  'home-loan',
  'sip',
  'gst',
  'construction',
  'paint',
  'solar',
  'cars',
  'insurance',
  'tax',
];

export default async function TagsPage() {
  const { data } = await fetchTags(100);
  const tags = data.length
    ? data
    : fallbackTags.map((slug) => ({ id: slug, name: slug, slug, _count: { articles: 0 } }));

  return (
    <ContentLayout
      title="Tags"
      description="Browse articles and tools by topic."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Tags' }]}
    >
      {tags.length ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#0b1f3a] transition hover:border-[#f97316] hover:text-[#f97316] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316]"
            >
              #{tag.name}
              {tag._count?.articles != null ? (
                <span className="ml-2 text-xs text-slate-400">{tag._count.articles}</span>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No tags yet" message="CMS tags will appear here when created." />
      )}
    </ContentLayout>
  );
}
