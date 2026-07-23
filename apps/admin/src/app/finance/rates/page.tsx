import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { FinanceCsvToolbar, FinanceListSearch } from '@/components/finance-admin-toolbar';
import { FinanceRateForm } from '@/components/finance-forms';
import { apiServerFetch } from '@/lib/api';

type RateRow = {
  id: string;
  productType?: string | null;
  rate: number | string;
  source?: string | null;
  effectiveFrom: string;
  bank?: { name: string } | null;
};

type BankRow = { id: string; name: string };

export default async function FinanceRatesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '50' });
  if (params.search) qs.set('search', params.search);

  const [ratesResult, banksResult] = await Promise.all([
    apiServerFetch<RateRow[]>(`/finance/admin/interest-rates?${qs.toString()}`),
    apiServerFetch<BankRow[]>('/finance/admin/banks?limit=100'),
  ]);
  const rows = Array.isArray(ratesResult.data) ? ratesResult.data : [];
  const banks = Array.isArray(banksResult.data) ? banksResult.data : [];

  return (
    <div>
      <PageHeader
        title="Interest rates"
        description="Track benchmark and product interest rates."
        actions={<Badge>{rows.length} loaded</Badge>}
      />

      <FinanceListSearch defaultValue={params.search} />
      <FinanceCsvToolbar entity="rates" />
      <FinanceRateForm banks={banks} />

      {ratesResult.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load interest rates</CardTitle>
            <CardDescription>{ratesResult.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Product type</th>
                <th className="px-4 py-3 font-medium">Bank</th>
                <th className="px-4 py-3 font-medium">Rate</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Effective from</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3">{row.productType || '—'}</td>
                  <td className="px-4 py-3">{row.bank?.name || '—'}</td>
                  <td className="px-4 py-3">{row.rate}%</td>
                  <td className="px-4 py-3">{row.source || '—'}</td>
                  <td className="px-4 py-3">{new Date(row.effectiveFrom).toLocaleDateString()}</td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No interest rates yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
