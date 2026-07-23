import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type ActivityRow = {
  id: string;
  activityType: string;
  entityType?: string | null;
  createdAt: string;
  user?: { email?: string; displayName?: string | null };
};

export default async function UserActivityPage() {
  const result = await apiServerFetch<{
    recentCount?: number;
    items?: ActivityRow[];
  }>('/users/activity');

  return (
    <div className="space-y-8">
      <PageHeader title="User activity" description="Platform-wide user activity feed." />
      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <p className="text-sm text-[var(--varnarc-subtle)]">
            {result.data?.recentCount ?? 0} events in the last 7 days
          </p>
          <div className="overflow-auto rounded-lg border border-[var(--varnarc-border)]">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
                  <th className="px-3 py-2 text-left">User</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Entity</th>
                  <th className="px-3 py-2 text-left">When</th>
                </tr>
              </thead>
              <tbody>
                {(result.data?.items ?? []).map((row) => (
                  <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                    <td className="px-3 py-2">{row.user?.displayName || row.user?.email || '—'}</td>
                    <td className="px-3 py-2">{row.activityType}</td>
                    <td className="px-3 py-2">{row.entityType || '—'}</td>
                    <td className="px-3 py-2">{new Date(row.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
