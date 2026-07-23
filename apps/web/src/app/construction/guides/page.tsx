import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { RelatedArticles } from '@/components/construction/related-articles';
import { fetchConstructionGuides } from '@/services/construction';

export const metadata: Metadata = {
  title: 'Construction Guides',
  description: 'Buying guides, material guides, and how-tos for home construction.',
  alternates: { canonical: '/construction/guides' },
};

export const revalidate = 60;

export default async function ConstructionGuidesPage() {
  const { data } = await fetchConstructionGuides();

  return (
    <ContentLayout
      title="Construction guides"
      description="Step-by-step guides to help you plan and build smarter."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Guides' },
      ]}
    >
      {data.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((guide) => (
            <Link
              key={guide.slug}
              href={`/construction/guides/${guide.slug}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              {guide.category ? (
                <span className="text-xs font-semibold uppercase tracking-wide text-[#f97316]">
                  {guide.category}
                </span>
              ) : null}
              <h2 className="mt-1 text-base font-extrabold text-[#0b1f3a]">{guide.title}</h2>
              {guide.summary ? (
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">{guide.summary}</p>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No guides yet" message="Construction guides will appear here once published." />
      )}

      <RelatedArticles />
    </ContentLayout>
  );
}
