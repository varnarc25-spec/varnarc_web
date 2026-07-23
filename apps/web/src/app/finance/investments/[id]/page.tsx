import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';
import { AdBanner } from '@/components/business/ad-banner';
import { AffiliateCta, RelatedCalculators } from '@/components/finance/finance-product-card';
import { FinanceReviewsSection } from '@/components/finance/finance-reviews';
import { RelatedArticles } from '@/components/finance/related-articles';
import { fetchFinanceInvestment } from '@/services/finance';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { ApiError } from '@/services/api-client';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const { data } = await fetchFinanceInvestment(id);
    return buildSeoMetadata({
      entityType: 'investment',
      entityId: data.id,
      path: `/finance/investments/${id}`,
      title: data.seoTitle || data.name,
      description: data.seoDescription,
    });
  } catch {
    return { title: 'Investment', alternates: { canonical: `/finance/investments/${id}` } };
  }
}

export default async function FinanceInvestmentDetailPage({ params }: Props) {
  const { id } = await params;
  let product: Awaited<ReturnType<typeof fetchFinanceInvestment>>['data'] | null = null;

  try {
    const result = await fetchFinanceInvestment(id);
    product = result.data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const title = product.seoTitle || product.name;
  const description = product.seoDescription;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
          { '@type': 'ListItem', position: 2, name: 'Finance', item: '/finance' },
          { '@type': 'ListItem', position: 3, name: 'Investments', item: '/finance/investments' },
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
        { label: 'Investments', href: '/finance/investments' },
        { label: product.name },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AdBanner slot="content-top" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Provider" value={product.providerName} />
        <Stat label="Expected return" value={product.expectedReturn != null ? `${product.expectedReturn}%` : '—'} />
        <Stat label="Risk level" value={product.riskLevel || '—'} />
        <Stat label="Lock-in" value={product.lockInPeriod || '—'} />
      </div>

      {product.affiliateUrl ? <div className="mt-8"><AffiliateCta url={product.affiliateUrl} label="Start investing" /></div> : null}

      <FinanceReviewsSection entity="investments" id={id} />

      <RelatedCalculators
        links={[
          { href: '/calculators/sip', label: 'SIP Calculator' },
          { href: '/calculators/income-tax', label: 'Income Tax Calculator' },
        ]}
      />
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
