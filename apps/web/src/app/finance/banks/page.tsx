import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { FinanceProductCard } from '@/components/finance/finance-product-card';
import { fetchFinanceBanks } from '@/services/finance';

export const metadata: Metadata = {
  title: 'Banks',
  description: 'Browse partner banks and financial institutions.',
  alternates: { canonical: '/finance/banks' },
};

export const revalidate = 60;

export default async function FinanceBanksPage() {
  const { data } = await fetchFinanceBanks({ limit: 48 });

  return (
    <ContentLayout
      title="Banks"
      description="Partner banks offering loans, credit cards, and more."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Finance', href: '/finance' },
        { label: 'Banks' },
      ]}
    >
      {data.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.map((bank) => (
            <FinanceProductCard
              key={bank.id}
              name={bank.name}
              href={`/finance/banks/${bank.slug}`}
              description={bank.description}
              meta={
                bank._count
                  ? `${bank._count.loans ?? 0} loans · ${bank._count.creditCards ?? 0} cards`
                  : undefined
              }
              featured={bank.featured}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No banks yet" message="Published banks will appear here." />
      )}

      <p className="mt-8 text-sm text-slate-600">
        Looking for products? Browse{' '}
        <Link href="/finance/loans" className="font-medium text-[#f97316] hover:underline">
          loans
        </Link>{' '}
        or{' '}
        <Link href="/finance/credit-cards" className="font-medium text-[#f97316] hover:underline">
          credit cards
        </Link>
        .
      </p>
    </ContentLayout>
  );
}
