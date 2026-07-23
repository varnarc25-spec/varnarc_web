import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type Subscription = {
  id: string;
  status: string;
  startsAt: string;
  endsAt?: string | null;
  user?: { email?: string; displayName?: string | null };
  plan?: { name?: string; slug?: string };
};

export default async function PremiumSubscriptionsPage() {
  const result = await apiServerFetch<Subscription[]>('/premium/admin/subscriptions?limit=50');
  const rows = result.data ?? [];

  return (
    <div className="space-y-8">
      <PageHeader title="Premium subscriptions" description="Paid memberships across all users." />
      <Link href="/premium" className="text-sm text-[var(--varnarc-brand)] hover:underline">
        ← Premium overview
      </Link>

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load subscriptions</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ends</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-3">
                    <p className="font-medium">{row.user?.displayName ?? row.user?.email ?? '—'}</p>
                    <p className="text-xs text-slate-500">{row.user?.email}</p>
                  </td>
                  <td className="px-4 py-3">{row.plan?.name ?? '—'}</td>
                  <td className="px-4 py-3 capitalize">{row.status.toLowerCase()}</td>
                  <td className="px-4 py-3">
                    {row.endsAt ? new Date(row.endsAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
