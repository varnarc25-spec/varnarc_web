import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { RelatedArticles } from '@/components/finance/related-articles';
import { fetchFinanceGuides } from '@/services/finance';

export const metadata: Metadata = {
  title: 'Finance Guides',
  description: 'Educational guides on loans, investments, insurance, and personal finance.',
  alternates: { canonical: '/finance/guides' },
};

export const revalidate = 60;

export default async function FinanceGuidesPage() {
  const { data } = await fetchFinanceGuides();

  return (
    <ContentLayout
      title="Finance guides"
      description="Step-by-step guides to help you make smarter financial decisions."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Finance', href: '/finance' },
        { label: 'Guides' },
      ]}
    >
      {data.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((guide) => (
            <Link
              key={guide.slug}
              href={`/finance/guides/${guide.slug}`}
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
        <EmptyState title="No guides yet" message="Finance guides will appear here once published." />
      )}

      <RelatedArticles />
    </ContentLayout>
  );
}
