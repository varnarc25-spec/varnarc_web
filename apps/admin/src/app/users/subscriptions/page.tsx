import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type SubRow = {
  id: string;
  subscriptionType: string;
  target: string;
  createdAt: string;
  user?: { email?: string; displayName?: string | null };
};

export default async function UserSubscriptionsPage() {
  const result = await apiServerFetch<SubRow[]>('/users/subscriptions');

  return (
    <div className="space-y-8">
      <PageHeader title="User subscriptions" description="Newsletter and topic subscriptions." />
      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-auto rounded-lg border border-[var(--varnarc-border)]">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Target</th>
                <th className="px-3 py-2 text-left">Since</th>
              </tr>
            </thead>
            <tbody>
              {(result.data ?? []).map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-3 py-2">{row.user?.displayName || row.user?.email || '—'}</td>
                  <td className="px-3 py-2">{row.subscriptionType}</td>
                  <td className="px-3 py-2">{row.target}</td>
                  <td className="px-3 py-2">{new Date(row.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
