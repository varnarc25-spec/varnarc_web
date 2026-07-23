import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import Link from 'next/link';
import { apiServerFetch } from '@/lib/api';
import { CampaignCreateForm } from '@/components/campaign-create-form';

type CampaignRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  _count?: { ads: number };
};

export default async function CampaignsPage() {
  const result = await apiServerFetch<CampaignRow[]>('/advertisements/campaigns?limit=100');
  const campaigns = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Ad campaigns"
        description="Schedule and prioritize advertisement campaigns."
        actions={<Badge>{campaigns.length} loaded</Badge>}
      />
      <Link href="/advertisements" className="mb-4 inline-block text-sm text-[var(--varnarc-brand)] hover:underline">
        ← Advertisements
      </Link>
      <CampaignCreateForm />
      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load campaigns</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Ads</th>
                <th className="px-4 py-3 font-medium">Window</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.status}</td>
                  <td className="px-4 py-3">{c._count?.ads ?? 0}</td>
                  <td className="px-4 py-3 text-[var(--varnarc-subtle)]">
                    {c.startsAt ? new Date(c.startsAt).toLocaleDateString() : '—'} →{' '}
                    {c.endsAt ? new Date(c.endsAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {!campaigns.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No campaigns yet.
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
