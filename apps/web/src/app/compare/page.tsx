import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { fetchComparisons } from '@/services/content';

export const metadata: Metadata = {
  title: 'Compare',
  description: 'Side-by-side product and service comparisons.',
  alternates: { canonical: '/compare' },
};

export const revalidate = 60;

export default async function CompareIndexPage() {
  const { data } = await fetchComparisons(50);

  return (
    <ContentLayout
      title="Comparisons"
      description="Side-by-side decisions backed by structured attributes."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Compare' }]}
    >
      {data.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => (
            <Link
              key={c.id}
              href={`/compare/${c.slug}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316]"
            >
              <h2 className="text-sm font-extrabold text-[#0b1f3a]">{c.title}</h2>
              <p className="mt-2 text-xs text-slate-500">
                {c._count?.items ?? 0} items · {c.status}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <EmptyState
            title="No published comparisons yet"
            message="Demo comparisons remain available while CMS data is seeded."
          />
          <div className="flex flex-wrap gap-3">
            <Link href="/compare/products" className="rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white">
              Demo: products
            </Link>
            <Link href="/compare/cars" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-[#0b1f3a]">
              Demo: cars
            </Link>
          </div>
        </div>
      )}
    </ContentLayout>
  );
}
