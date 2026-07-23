import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ComparisonDetailClient } from '@/components/comparison/comparison-detail-client';
import { JsonLd, breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from '@/components/seo/json-ld';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { apiPublicFetch, ApiError } from '@/services/api-client';
import type { ComparisonDetail } from '@/services/content';
import { RecordContentView } from '@/components/record-content-view';

type Props = { params: Promise<{ slug: string }> };

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

type RelatedContent = {
  reviews: Array<{ id: string; title: string; slug: string; overallScore?: number | string | null }>;
  articles: Array<{ id: string; title: string; slug: string; excerpt?: string | null }>;
  calculators: Array<{ id: string; name: string; slug: string; description?: string | null }>;
  affiliateOffers: Array<{ label: string; url: string; entityType: string; entityId: string; sponsored?: boolean }>;
  sponsoredAds: Array<{ id: string; name: string; title?: string | null; targetUrl?: string | null }>;
  domainComparisons: Array<{ module: string; title: string; slug: string; href: string }>;
  products: Array<{ id: string; name: string; slug: string }>;
};

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data } = await apiPublicFetch<ComparisonDetail & { seoTitle?: string | null; seoDescription?: string | null }>(
      `/comparisons/slug/${slug}`,
      { next: { revalidate: 60 } },
    );
    return buildSeoMetadata({
      entityType: 'comparison',
      entityId: data.id,
      path: `/compare/${slug}`,
      title: data.seoTitle || data.title,
      description: data.seoDescription || data.description,
    });
  } catch {
    return { title: 'Compare' };
  }
}

export default async function CompareDetailPage({ params }: Props) {
  const { slug } = await params;

  try {
    const [comparisonResult, relatedResult] = await Promise.all([
      apiPublicFetch<ComparisonDetail & { seoTitle?: string | null; seoDescription?: string | null; description?: string | null; recommendation?: string | null }>(
        `/comparisons/slug/${slug}`,
        { next: { revalidate: 60 } },
      ),
      apiPublicFetch<RelatedContent>(`/comparisons/slug/${slug}/related`, { next: { revalidate: 60 } }).catch(() => ({
        data: null,
      })),
    ]);

    const detail = comparisonResult.data;
    const url = `${siteUrl}/compare/${slug}`;

    const faqs = detail.attributes.slice(0, 5).map((attr) => {
      const values = Array.isArray(attr.values) ? attr.values : [];
      return {
        question: `How does ${attr.label} compare across options?`,
        answer: detail.items
          .map((item, idx) => `${item.label || item.product.name}: ${String(values[idx] ?? '—')}`)
          .join(' · '),
      };
    });

    return (
      <>
        <JsonLd
          data={[
            breadcrumbJsonLd([
              { name: 'Home', url: siteUrl },
              { name: 'Compare', url: `${siteUrl}/compare` },
              { name: detail.title, url },
            ]),
            itemListJsonLd({
              name: detail.title,
              url,
              items: detail.items.map((item, index) => ({
                name: item.label || item.product.name,
                url: item.product.slug ? `${siteUrl}/reviews/${item.product.slug}` : url,
                position: index + 1,
              })),
            }),
            ...(faqs.length ? [faqJsonLd(faqs)] : []),
          ]}
        />
        <RecordContentView
          entityType="comparison"
          entityId={detail.id}
          metadata={{ slug, title: detail.title }}
        />
        <ComparisonDetailClient detail={detail} related={relatedResult.data} />
      </>
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}
