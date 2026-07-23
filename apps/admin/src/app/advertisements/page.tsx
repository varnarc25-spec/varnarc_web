import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import Link from 'next/link';
import { apiServerFetch } from '@/lib/api';
import { AdCreateForm } from '@/components/ad-create-form';

type AdRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  type: string;
  provider: string;
  updatedAt: string;
  placement?: { slug: string } | null;
  campaign?: { name: string };
};

type CampaignRow = { id: string; name: string };
type PlacementRow = { id: string; name: string; slug: string };

export default async function AdvertisementsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; type?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '50' });
  if (params.status) qs.set('status', params.status);
  if (params.search) qs.set('search', params.search);
  if (params.type) qs.set('type', params.type);

  const [adsResult, campaignsResult, placementsResult] = await Promise.all([
    apiServerFetch<AdRow[]>(`/advertisements?${qs.toString()}`),
    apiServerFetch<CampaignRow[]>('/advertisements/campaigns?limit=100'),
    apiServerFetch<PlacementRow[]>('/advertisements/placements?limit=100'),
  ]);

  const ads = Array.isArray(adsResult.data) ? adsResult.data : [];
  const campaigns = Array.isArray(campaignsResult.data) ? campaignsResult.data : [];
  const placements = Array.isArray(placementsResult.data) ? placementsResult.data : [];

  return (
    <div>
      <PageHeader
        title="Advertisements"
        description="Direct banners, AdSense, affiliates, sponsored and internal promotions."
        actions={<Badge>{ads.length} loaded</Badge>}
      />

      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <Link href="/advertisements/campaigns" className="text-[var(--varnarc-brand)] hover:underline">
          Campaigns
        </Link>
        <Link href="/advertisements/placements" className="text-[var(--varnarc-brand)] hover:underline">
          Placements
        </Link>
        <Link href="/advertisements/analytics" className="text-[var(--varnarc-brand)] hover:underline">
          Analytics
        </Link>
      </div>

      <AdCreateForm campaigns={campaigns} placements={placements} />

      <form className="mb-6 flex flex-wrap gap-3">
        <input
          name="search"
          defaultValue={params.search || ''}
          placeholder="Search ads…"
          className="h-10 w-full max-w-md rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm"
        />
        <select
          name="status"
          defaultValue={params.status || ''}
          className="h-10 rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm"
        >
          <option value="">All statuses</option>
          {['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'ENDED', 'ARCHIVED'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-10 rounded-md bg-[var(--varnarc-brand)] px-4 text-sm font-medium text-white"
        >
          Filter
        </button>
      </form>

      {adsResult.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load advertisements</CardTitle>
            <CardDescription>{adsResult.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Placement</th>
                <th className="px-4 py-3 font-medium">Campaign</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((ad) => (
                <tr key={ad.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3">
                    <Link href={`/advertisements/${ad.id}`} className="font-medium hover:underline">
                      {ad.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{ad.type}</td>
                  <td className="px-4 py-3">{ad.status}</td>
                  <td className="px-4 py-3">{ad.placement?.slug || '—'}</td>
                  <td className="px-4 py-3">{ad.campaign?.name || '—'}</td>
                </tr>
              ))}
              {!ads.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No advertisements yet.
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
