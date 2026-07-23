import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type Summary = {
  subscribed: number;
  unsubscribed: number;
  total: number;
};

type Subscriber = {
  id: string;
  email: string;
  status: string;
  subscribedAt: string;
  unsubscribedAt?: string | null;
};

export default async function NewsletterSubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const params = await searchParams;
  const status = params.status === 'subscribed' || params.status === 'unsubscribed' ? params.status : 'all';
  const search = params.search?.trim() ?? '';

  const qs = new URLSearchParams({ limit: '50', status });
  if (search) qs.set('search', search);

  const [summaryResult, listResult] = await Promise.all([
    apiServerFetch<Summary>('/newsletter/dashboard'),
    apiServerFetch<Subscriber[]>(`/newsletter/subscribers?${qs.toString()}`),
  ]);

  const subscribers = listResult.data ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Newsletter subscribers"
        description="Emails collected from the public site, homepage, and footer forms."
      />
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/notifications" className="text-[var(--varnarc-brand)] hover:underline">
          Notifications
        </Link>
        <Link href="/notifications/campaigns" className="text-[var(--varnarc-brand)] hover:underline">
          Campaigns
        </Link>
        <Link href="/notifications/newsletter-templates" className="text-[var(--varnarc-brand)] hover:underline">
          Newsletter templates
        </Link>
      </div>

      {summaryResult.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load summary</CardTitle>
            <CardDescription>{summaryResult.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Kpi label="Subscribed" value={summaryResult.data?.subscribed ?? 0} />
          <Kpi label="Unsubscribed" value={summaryResult.data?.unsubscribed ?? 0} />
          <Kpi label="Total" value={summaryResult.data?.total ?? 0} />
        </div>
      )}

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div>
          <label htmlFor="status" className="mb-1 block text-xs font-medium text-slate-600">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
        </div>
        <div className="min-w-[220px] flex-1">
          <label htmlFor="search" className="mb-1 block text-xs font-medium text-slate-600">
            Search email
          </label>
          <input
            id="search"
            name="search"
            type="search"
            defaultValue={search}
            placeholder="you@example.com"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-[var(--varnarc-brand)] px-4 py-2 text-sm font-medium text-white"
        >
          Filter
        </button>
      </form>

      {listResult.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load subscribers</CardTitle>
            <CardDescription>{listResult.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Subscribed</th>
                <th className="px-4 py-3">Unsubscribed</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No subscribers yet.
                  </td>
                </tr>
              ) : (
                subscribers.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{row.email}</td>
                    <td className="px-4 py-3 capitalize">{row.status}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.subscribedAt ? new Date(row.subscribedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.unsubscribedAt ? new Date(row.unsubscribedAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value.toLocaleString()}</CardTitle>
      </CardHeader>
    </Card>
  );
}
