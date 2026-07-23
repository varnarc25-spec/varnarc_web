import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { FinanceCsvToolbar, FinanceListSearch } from '@/components/finance-admin-toolbar';
import { FinanceInvestmentForm, FinancePublishButton } from '@/components/finance-forms';
import { apiServerFetch } from '@/lib/api';

type InvestmentRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  providerName: string;
  expectedReturn?: number | string | null;
  riskLevel?: string | null;
};

export default async function FinanceInvestmentsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '50' });
  if (params.search) qs.set('search', params.search);

  const result = await apiServerFetch<InvestmentRow[]>(`/finance/admin/investments?${qs.toString()}`);
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Investments"
        description="Manage investment products and funds."
        actions={<Badge>{rows.length} loaded</Badge>}
      />

      <FinanceListSearch defaultValue={params.search} />
      <FinanceCsvToolbar entity="investments" />
      <FinanceInvestmentForm />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load investments</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Provider</th>
                <th className="px-4 py-3 font-medium">Return</th>
                <th className="px-4 py-3 font-medium">Risk</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.name}</div>
                    <div className="font-mono text-xs text-[var(--varnarc-subtle)]">{row.slug}</div>
                  </td>
                  <td className="px-4 py-3">{row.providerName}</td>
                  <td className="px-4 py-3">{row.expectedReturn != null ? `${row.expectedReturn}%` : '—'}</td>
                  <td className="px-4 py-3">{row.riskLevel || '—'}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">
                    <FinancePublishButton entity="investments" id={row.id} status={row.status} />
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No investments yet.
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
