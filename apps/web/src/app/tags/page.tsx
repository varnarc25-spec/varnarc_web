import type { Metadata } from 'next';
import Link from 'next/link';
import { ModuleHubShell } from '@/components/hub/module-hub-shell';
import { HubSectionHeader } from '@/components/hub/hub-section-header';
import { HubIconGrid } from '@/components/hub/hub-icon-grid';
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

const popularLinks = [
  { label: 'Finance', href: '/tags/finance' },
  { label: 'EMI', href: '/tags/emi' },
  { label: 'Solar', href: '/tags/solar' },
];

export default async function TagsPage() {
  const { data } = await fetchTags(100);
  const tags = data.length
    ? data
    : fallbackTags.map((slug) => ({ id: slug, name: slug, slug, _count: { articles: 0 } }));

  const tagItems = tags.map((tag) => ({
    label: `#${tag.name}`,
    description: tag._count?.articles != null ? `${tag._count.articles} articles` : 'Browse topic',
    href: `/tags/${tag.slug}`,
    icon: 'tag',
  }));

  return (
    <ModuleHubShell
      moduleKey="tags"
      title="Browse by topic"
      description="Explore articles, guides, and tools organized by topic tags."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Tags' }]}
      popularLinks={popularLinks}
      overviewTitle="Topics overview"
    >
      <section>
        <HubSectionHeader title="All tags" />
        {tagItems.length ? (
          <HubIconGrid items={tagItems} columns={4} />
        ) : (
          <EmptyState title="No tags yet" message="CMS tags will appear here when created." />
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        {tags.slice(0, 20).map((tag) => (
          <Link
            key={tag.id}
            href={`/tags/${tag.slug}`}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#0b1f3a] hover:border-blue-400 hover:text-blue-600"
          >
            #{tag.name}
          </Link>
        ))}
      </div>
    </ModuleHubShell>
  );
}
