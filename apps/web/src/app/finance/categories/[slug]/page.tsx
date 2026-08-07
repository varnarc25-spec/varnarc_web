import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { FinanceProductCard } from '@/components/finance/finance-product-card';
import {
  fetchFinanceCreditCards,
  fetchFinanceCategoryBySlug,
  fetchFinanceInsurance,
  fetchFinanceInvestments,
  fetchFinanceLoans,
} from '@/services/finance';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data } = await fetchFinanceCategoryBySlug(slug);
    return buildSeoMetadata({
      entityType: 'finance_category',
      entityId: data.id,
      path: `/finance/categories/${slug}`,
      title: data.name,
      description: data.description || `Browse ${data.name} financial products and guides.`,
    });
  } catch {
    return { title: 'Category', alternates: { canonical: `/finance/categories/${slug}` } };
  }
}

export const revalidate = 60;

export default async function FinanceCategoryPage({ params }: Props) {
  const { slug } = await params;
  let category: Awaited<ReturnType<typeof fetchFinanceCategoryBySlug>>['data'];

  try {
    const result = await fetchFinanceCategoryBySlug(slug);
    category = result.data;
  } catch {
    notFound();
  }

  const [loansRes, cardsRes, insuranceRes, investmentsRes] = await Promise.all([
    fetchFinanceLoans({ categoryId: category.id, limit: 12 }),
    fetchFinanceCreditCards({ categoryId: category.id, limit: 12 }),
    fetchFinanceInsurance({ categoryId: category.id, limit: 12 }),
    fetchFinanceInvestments({ categoryId: category.id, limit: 12 }),
  ]);

  const products = [
    ...loansRes.data.map((item) => ({
      id: item.id,
      name: item.name,
      href: `/finance/loans/${item.id}`,
      description: item.bank?.name ? `${item.bank.name} · ${item.loanType}` : item.loanType,
      featured: item.featured,
    })),
    ...cardsRes.data.map((item) => ({
      id: item.id,
      name: item.name,
      href: `/finance/credit-cards/${item.id}`,
      description: item.bank?.name ?? 'Credit card',
      featured: item.featured,
    })),
    ...insuranceRes.data.map((item) => ({
      id: item.id,
      name: item.name,
      href: `/finance/insurance/${item.id}`,
      description: item.providerName,
      featured: item.featured,
    })),
    ...investmentsRes.data.map((item) => ({
      id: item.id,
      name: item.name,
      href: `/finance/investments/${item.id}`,
      description: item.providerName,
      featured: item.featured,
    })),
  ];

  return (
    <ContentLayout
      title={category.name}
      description={category.description ?? `Products and resources in ${category.name}.`}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Finance', href: '/finance' },
        { label: category.name },
      ]}
    >
      {products.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((item) => (
            <FinanceProductCard
              key={item.id}
              name={item.name}
              href={item.href}
              description={item.description}
              featured={item.featured}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No products in this category"
          message="Published products tagged with this category will appear here."
        />
      )}

      <div className="mt-8">
        <Link href="/finance" className="text-sm font-medium text-[#f97316] hover:underline">
          ← Back to Finance
        </Link>
      </div>
    </ContentLayout>
  );
}
