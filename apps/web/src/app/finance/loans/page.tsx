import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { FinanceProductCard, RelatedCalculators } from '@/components/finance/finance-product-card';
import { fetchFinanceLoans } from '@/services/finance';

export const metadata: Metadata = {
  title: 'Loans',
  description: 'Compare home, personal, and business loan products.',
  alternates: { canonical: '/finance/loans' },
};

export const revalidate = 60;

export default async function FinanceLoansPage() {
  const { data } = await fetchFinanceLoans({ limit: 48 });

  return (
    <ContentLayout
      title="Loans"
      description="Compare interest rates, tenures, and eligibility across lenders."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Finance', href: '/finance' },
        { label: 'Loans' },
      ]}
    >
      {data.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.map((loan) => (
            <FinanceProductCard
              key={loan.id}
              name={loan.name}
              href={`/finance/loans/${loan.id}`}
              description={loan.description}
              meta={
                [
                  loan.bank?.name,
                  loan.loanType,
                  loan.interestRate != null ? `${loan.interestRate}% p.a.` : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || null
              }
              featured={loan.featured}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No loans yet" message="Published loan products will appear here." />
      )}

      <RelatedCalculators
        links={[
          { href: '/calculators/emi', label: 'EMI Calculator' },
          { href: '/calculators/income-tax', label: 'Income Tax Calculator' },
        ]}
      />
    </ContentLayout>
  );
}
