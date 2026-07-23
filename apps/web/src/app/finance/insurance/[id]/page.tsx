import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';
import { AdBanner } from '@/components/business/ad-banner';
import {
  AffiliateCta,
  FinanceDetailSection,
  RelatedCalculators,
} from '@/components/finance/finance-product-card';
import { FinanceReviewsSection } from '@/components/finance/finance-reviews';
import { RelatedArticles } from '@/components/finance/related-articles';
import { fetchFinanceInsuranceProduct } from '@/services/finance';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { ApiError } from '@/services/api-client';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const { data } = await fetchFinanceInsuranceProduct(id);
    return buildSeoMetadata({
      entityType: 'insurance',
      entityId: data.id,
      path: `/finance/insurance/${id}`,
      title: data.seoTitle || data.name,
      description: data.seoDescription || data.coverage,
    });
  } catch {
    return { title: 'Insurance', alternates: { canonical: `/finance/insurance/${id}` } };
  }
}

export default async function FinanceInsuranceDetailPage({ params }: Props) {
  const { id } = await params;
  let product: Awaited<ReturnType<typeof fetchFinanceInsuranceProduct>>['data'] | null = null;

  try {
    const result = await fetchFinanceInsuranceProduct(id);
    product = result.data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const title = product.seoTitle || product.name;
  const description = product.seoDescription || product.coverage;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
          { '@type': 'ListItem', position: 2, name: 'Finance', item: '/finance' },
          { '@type': 'ListItem', position: 3, name: 'Insurance', item: '/finance/insurance' },
          { '@type': 'ListItem', position: 4, name: product.name },
        ],
      },
      {
        '@type': 'FinancialProduct',
        name: product.name,
        description: description || undefined,
        provider: { '@type': 'Organization', name: product.providerName },
      },
    ],
  };

  return (
    <PageShell
      title={title}
      description={description ?? undefined}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Finance', href: '/finance' },
        { label: 'Insurance', href: '/finance/insurance' },
        { label: product.name },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AdBanner slot="content-top" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Provider" value={product.providerName} />
        <Stat label="Premium" value={product.premium != null ? String(product.premium) : '—'} />
        <Stat label="Category" value={product.category?.name || '—'} />
      </div>

      {product.coverage ? <FinanceDetailSection title="Coverage">{product.coverage}</FinanceDetailSection> : null}
      {product.benefits ? <FinanceDetailSection title="Benefits">{product.benefits}</FinanceDetailSection> : null}
      {product.affiliateUrl ? <div className="mt-8"><AffiliateCta url={product.affiliateUrl} label="Get a quote" /></div> : null}

      <FinanceReviewsSection entity="insurance" id={id} />

      <RelatedCalculators links={[{ href: '/calculators/income-tax', label: 'Income Tax Calculator' }]} />
      <RelatedArticles />
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-extrabold text-[#0b1f3a]">{value}</div>
    </div>
  );
}
