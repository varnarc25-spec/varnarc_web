import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { fetchFinancePortfolio } from '@/services/finance';

export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'View your finance portfolio holdings.',
  alternates: { canonical: '/finance/portfolio' },
};

export default async function FinancePortfolioPage() {
  const { data, unauthorized } = await fetchFinancePortfolio();

  return (
    <ContentLayout
      title="Portfolio"
      description="Track loans, investments, and insurance in one place."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Finance', href: '/finance' },
        { label: 'Portfolio' },
      ]}
    >
      {unauthorized ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm text-amber-900">Sign in to view your portfolio.</p>
          <Link
            href="/auth/login?returnTo=/finance/portfolio"
            className="mt-3 inline-flex rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b1f3a]/90"
          >
            Log in
          </Link>
        </div>
      ) : data?.length ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Value</th>
                <th className="px-4 py-3 font-semibold">Allocation</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-[#0b1f3a]">{item.name}</td>
                  <td className="px-4 py-3">{item.type}</td>
                  <td className="px-4 py-3">{item.value != null ? `₹${item.value}` : '—'}</td>
                  <td className="px-4 py-3">
                    {item.allocation != null ? `${item.allocation}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No portfolio items" message="Your holdings will appear here once linked." />
      )}
    </ContentLayout>
  );
}
