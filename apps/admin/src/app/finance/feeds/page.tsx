import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { FinanceRateFeedForm, FinanceRateFeedSyncButton } from '@/components/finance-forms';
import { apiServerFetch } from '@/lib/api';

type FeedRow = {
  id: string;
  name: string;
  provider?: string | null;
  endpointUrl?: string | null;
  productType?: string | null;
  lastSyncedAt?: string | null;
  lastStatus?: string | null;
};

export default async function FinanceFeedsAdminPage() {
  const result = await apiServerFetch<FeedRow[]>('/finance/admin/rate-feeds?limit=50');
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Live rate feeds"
        description="Configure automated interest rate feed sources. HTTP JSON feeds sync hourly; mock feeds generate demo rates."
        actions={<Badge>{rows.length} feeds</Badge>}
      />

      <FinanceRateFeedForm />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load rate feeds</CardTitle>
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
                <th className="px-4 py-3 font-medium">Product type</th>
                <th className="px-4 py-3 font-medium">Endpoint</th>
                <th className="px-4 py-3 font-medium">Last synced</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3">{row.provider || '—'}</td>
                  <td className="px-4 py-3">{row.productType || '—'}</td>
                  <td className="px-4 py-3 break-all text-xs">{row.endpointUrl || '—'}</td>
                  <td className="px-4 py-3">
                    {row.lastSyncedAt ? new Date(row.lastSyncedAt).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-xs">{row.lastStatus || '—'}</td>
                  <td className="px-4 py-3">
                    <FinanceRateFeedSyncButton id={row.id} />
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No rate feeds configured yet.
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
