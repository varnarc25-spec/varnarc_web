import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';
import { AdBanner } from '@/components/business/ad-banner';
import {
  AffiliateCta,
  FinanceDetailSection,
  FinanceProsCons,
  RelatedCalculators,
} from '@/components/finance/finance-product-card';
import { FinanceReviewsSection } from '@/components/finance/finance-reviews';
import { RelatedArticles } from '@/components/finance/related-articles';
import { fetchFinanceCreditCard } from '@/services/finance';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { ApiError } from '@/services/api-client';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const { data } = await fetchFinanceCreditCard(id);
    return buildSeoMetadata({
      entityType: 'credit_card',
      entityId: data.id,
      path: `/finance/credit-cards/${id}`,
      title: data.seoTitle || data.name,
      description: data.seoDescription || data.description,
    });
  } catch {
    return { title: 'Credit Card', alternates: { canonical: `/finance/credit-cards/${id}` } };
  }
}

export default async function FinanceCreditCardDetailPage({ params }: Props) {
  const { id } = await params;
  let card: Awaited<ReturnType<typeof fetchFinanceCreditCard>>['data'] | null = null;

  try {
    const result = await fetchFinanceCreditCard(id);
    card = result.data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const title = card.seoTitle || card.name;
  const description = card.seoDescription || card.description;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
          { '@type': 'ListItem', position: 2, name: 'Finance', item: '/finance' },
          { '@type': 'ListItem', position: 3, name: 'Credit cards', item: '/finance/credit-cards' },
          { '@type': 'ListItem', position: 4, name: card.name },
        ],
      },
      {
        '@type': 'Product',
        name: card.name,
        description: description || undefined,
        brand: card.bank?.name ? { '@type': 'Brand', name: card.bank.name } : undefined,
        offers: card.annualFee != null
          ? { '@type': 'Offer', price: Number(card.annualFee), priceCurrency: 'INR' }
          : undefined,
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
        { label: 'Credit cards', href: '/finance/credit-cards' },
        { label: card.name },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AdBanner slot="content-top" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Bank" value={card.bank?.name || '—'} />
        <Stat label="Annual fee" value={card.annualFee != null ? String(card.annualFee) : '—'} />
        <Stat label="Joining fee" value={card.joiningFee != null ? String(card.joiningFee) : '—'} />
        <Stat label="Lounge access" value={card.loungeAccess ? 'Yes' : 'No'} />
      </div>

      {card.description ? <FinanceDetailSection title="Overview">{card.description}</FinanceDetailSection> : null}
      {card.rewards ? <FinanceDetailSection title="Rewards">{card.rewards}</FinanceDetailSection> : null}
      {card.cashback ? <FinanceDetailSection title="Cashback">{card.cashback}</FinanceDetailSection> : null}
      <FinanceProsCons pros={card.pros} cons={card.cons} />
      {card.affiliateUrl ? <div className="mt-8"><AffiliateCta url={card.affiliateUrl} label="Apply for card" /></div> : null}

      <FinanceReviewsSection entity="credit-cards" id={id} />

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
