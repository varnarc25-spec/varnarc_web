import { PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type ReviewRow = {
  id: string;
  resourceType: string;
  resourceKey: string;
  status: string;
  reason: string;
  createdAt: string;
  location?: { name: string } | null;
};

export default async function IntelligenceReviewsPage() {
  const result = await apiServerFetch<ReviewRow[]>('/construction/intelligence/reviews');
  const rows = result.data ?? [];

  return (
    <div>
      <PageHeader
        title="Rate review queue"
        description="Items that need a dated official extract or human verification. Empty of official prices is expected until import."
      />
      {result.error ? <p>{result.error}</p> : null}
      <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--varnarc-muted)] text-xs uppercase">
            <tr>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Resource</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-[var(--varnarc-subtle)]" colSpan={4}>
                  No review items.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-[var(--varnarc-border)]">
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2">
                    {row.resourceType} / {row.resourceKey}
                  </td>
                  <td className="px-3 py-2">{row.location?.name ?? '—'}</td>
                  <td className="px-3 py-2">{row.reason}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
