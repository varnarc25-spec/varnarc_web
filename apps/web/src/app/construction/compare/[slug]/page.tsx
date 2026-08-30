import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EditorialCompareView } from '@/components/construction/compare-hub/editorial-compare-view';
import {
  getEditorialComparison,
  listEditorialComparisonSlugs,
} from '@/lib/construction/compare-hub/catalog';
import { resolveConstructionIndexing } from '@/lib/construction/seo';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return listEditorialComparisonSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getEditorialComparison(slug);
  if (!page) return { title: 'Comparison' };

  const indexing = resolveConstructionIndexing({
    pathname: `/construction/compare/${slug}`,
  });

  return {
    title: page.seoTitle,
    description: page.seoDescription,
    alternates: { canonical: indexing.canonicalUrl },
    robots: indexing.robots,
  };
}

export default async function EditorialComparePage({ params }: Props) {
  const { slug } = await params;
  const page = getEditorialComparison(slug);
  if (!page) notFound();
  return <EditorialCompareView page={page} />;
}
