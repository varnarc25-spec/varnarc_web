import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { FinanceCsvToolbar, FinanceListSearch } from '@/components/finance-admin-toolbar';
import { FinanceInsuranceForm, FinancePublishButton } from '@/components/finance-forms';
import { apiServerFetch } from '@/lib/api';

type InsuranceRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  providerName: string;
  premium?: number | string | null;
};

export default async function FinanceInsuranceAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '50' });
  if (params.search) qs.set('search', params.search);

  const result = await apiServerFetch<InsuranceRow[]>(`/finance/admin/insurance?${qs.toString()}`);
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Insurance"
        description="Manage insurance products and providers."
        actions={<Badge>{rows.length} loaded</Badge>}
      />

      <FinanceListSearch defaultValue={params.search} />
      <FinanceCsvToolbar entity="insurance" />
      <FinanceInsuranceForm />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load insurance products</CardTitle>
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
                <th className="px-4 py-3 font-medium">Premium</th>
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
                  <td className="px-4 py-3">{row.premium != null ? row.premium : '—'}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">
                    <FinancePublishButton entity="insurance" id={row.id} status={row.status} />
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No insurance products yet.
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
