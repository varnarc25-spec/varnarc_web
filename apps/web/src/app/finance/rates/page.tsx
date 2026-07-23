import type { Metadata } from 'next';
import { ContentLayout } from '@/components/layout/content-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { RelatedCalculators } from '@/components/finance/finance-product-card';
import { RatesChart } from '@/components/finance/rates-chart';
import { fetchFinanceRates } from '@/services/finance';

export const metadata: Metadata = {
  title: 'Interest Rates',
  description: 'Latest benchmark and product interest rates from banks and lenders.',
  alternates: { canonical: '/finance/rates' },
};

export const revalidate = 60;

function buildChartData(
  rows: Awaited<ReturnType<typeof fetchFinanceRates>>['data'],
): Array<{ label: string; rate: number }> {
  return rows.slice(0, 12).map((row) => {
    const bankName = row.bank?.name || 'Unknown';
    const product = row.productType || row.loan?.name || 'Rate';
    const date = new Date(row.effectiveFrom).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    });
    return {
      label: `${bankName} · ${product} (${date})`.slice(0, 40),
      rate: Number(row.rate),
    };
  });
}

export default async function FinanceRatesPage() {
  const { data } = await fetchFinanceRates({ limit: 48 });
  const chartData = buildChartData(data);

  return (
    <ContentLayout
      title="Interest rates"
      description="Track current rates across loan products and providers."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Finance', href: '/finance' },
        { label: 'Interest rates' },
      ]}
    >
      {chartData.length ? <RatesChart data={chartData} /> : null}

      {data.length ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Bank</th>
                <th className="px-4 py-3 font-semibold">Rate</th>
                <th className="px-4 py-3 font-semibold">Tenure</th>
                <th className="px-4 py-3 font-semibold">Effective</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">{row.productType || row.loan?.name || '—'}</td>
                  <td className="px-4 py-3">{row.bank?.name || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-[#0b1f3a]">{row.rate}%</td>
                  <td className="px-4 py-3">
                    {row.minTenure || row.maxTenure
                      ? `${row.minTenure ?? '—'}–${row.maxTenure ?? '—'} mo`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">{new Date(row.effectiveFrom).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No rates yet" message="Interest rate data will appear here once published." />
      )}

      <RelatedCalculators
        links={[
          { href: '/calculators/emi', label: 'EMI Calculator' },
          { href: '/calculators/sip', label: 'SIP Calculator' },
        ]}
      />
    </ContentLayout>
  );
}
