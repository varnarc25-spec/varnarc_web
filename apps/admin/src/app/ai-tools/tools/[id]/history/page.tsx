import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type HistoryRow = {
  id: string;
  action: string;
  createdAt: string;
  user?: { displayName?: string | null; email?: string | null } | null;
  newValue?: Record<string, unknown> | null;
};

export default async function AiToolHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await apiServerFetch<HistoryRow[]>(`/ai-tools/admin/${id}/history`);
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader title="Tool history" description="Audit trail for this AI tool." />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load history</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Actor</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3">{new Date(row.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium">{row.action}</td>
                  <td className="px-4 py-3">{row.user?.displayName || row.user?.email || 'System'}</td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No history yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-sm">
        <Link href="/ai-tools/tools" className="text-[var(--varnarc-brand)] hover:underline">
          Back to tools
        </Link>
      </p>
    </div>
  );
}
