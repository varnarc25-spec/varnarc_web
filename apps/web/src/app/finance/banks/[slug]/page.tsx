import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { FinanceProductCard } from '@/components/finance/finance-product-card';
import { RelatedArticles } from '@/components/finance/related-articles';
import {
  fetchFinanceBankBySlug,
  fetchFinanceCreditCards,
  fetchFinanceLoans,
} from '@/services/finance';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data } = await fetchFinanceBankBySlug(slug);
    return buildSeoMetadata({
      entityType: 'bank',
      entityId: data.id,
      path: `/finance/banks/${slug}`,
      title: data.name,
      description: data.description || `${data.name} loans and credit cards.`,
      image: data.logoUrl,
    });
  } catch {
    return { title: 'Bank', alternates: { canonical: `/finance/banks/${slug}` } };
  }
}

export default async function FinanceBankDetailPage({ params }: Props) {
  const { slug } = await params;
  let bank: Awaited<ReturnType<typeof fetchFinanceBankBySlug>>['data'];

  try {
    const result = await fetchFinanceBankBySlug(slug);
    bank = result.data;
  } catch {
    notFound();
  }

  const [loansRes, cardsRes] = await Promise.all([
    fetchFinanceLoans({ bankId: bank.id, limit: 12 }),
    fetchFinanceCreditCards({ bankId: bank.id, limit: 12 }),
  ]);

  const loans = loansRes.data;
  const cards = cardsRes.data;

  return (
    <PageShell
      title={bank.name}
      description={bank.description ?? undefined}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Finance', href: '/finance' },
        { label: 'Banks', href: '/finance/banks' },
        { label: bank.name },
      ]}
    >
      {bank.website ? (
        <p className="mb-6">
          <a
            href={bank.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#f97316] hover:underline"
          >
            Visit website →
          </a>
        </p>
      ) : null}

      {bank.description ? (
        <section className="mb-10">
          <h2 className="text-lg font-extrabold text-[#0b1f3a]">About</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">{bank.description}</p>
        </section>
      ) : null}

      {loans.length ? (
        <section className="mb-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-extrabold text-[#0b1f3a]">Loans</h2>
            <Link href={`/finance/loans?bankId=${bank.id}`} className="text-sm text-[#f97316] hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loans.map((loan) => (
              <FinanceProductCard
                key={loan.id}
                name={loan.name}
                href={`/finance/loans/${loan.id}`}
                description={loan.loanType}
                meta={loan.interestRate != null ? `${loan.interestRate}% p.a.` : undefined}
                featured={loan.featured}
              />
            ))}
          </div>
        </section>
      ) : null}

      {cards.length ? (
        <section className="mb-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-extrabold text-[#0b1f3a]">Credit cards</h2>
            <Link href={`/finance/credit-cards?bankId=${bank.id}`} className="text-sm text-[#f97316] hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <FinanceProductCard
                key={card.id}
                name={card.name}
                href={`/finance/credit-cards/${card.id}`}
                description={card.description}
                featured={card.featured}
              />
            ))}
          </div>
        </section>
      ) : null}

      {!loans.length && !cards.length ? (
        <p className="text-sm text-slate-600">No published loan or card products for this bank yet.</p>
      ) : null}

      <RelatedArticles />
    </PageShell>
  );
}
