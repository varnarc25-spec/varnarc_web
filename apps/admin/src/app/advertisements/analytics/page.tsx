import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import Link from 'next/link';
import { apiServerFetch } from '@/lib/api';

type AnalyticsSummary = {
  impressions: number;
  clicks: number;
  ctr: number;
  topAds: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    placement: string | null;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
};

export default async function AdAnalyticsPage() {
  const result = await apiServerFetch<AnalyticsSummary>('/advertisements/analytics/summary');
  const data = result.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ad analytics"
        description="Impressions, clicks, and CTR by advertisement."
        actions={
          <Badge>
            {data ? `${(data.ctr * 100).toFixed(2)}% CTR` : '—'}
          </Badge>
        }
      />
      <Link href="/advertisements" className="text-sm text-[var(--varnarc-brand)] hover:underline">
        ← Advertisements
      </Link>

      {result.error || !data ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load analytics</CardTitle>
            <CardDescription>{result.error || 'No data'}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>{data.impressions}</CardTitle>
                <CardDescription>Impressions</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{data.clicks}</CardTitle>
                <CardDescription>Clicks</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{(data.ctr * 100).toFixed(2)}%</CardTitle>
                <CardDescription>CTR</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Ad</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Placement</th>
                  <th className="px-4 py-3 font-medium">Impr.</th>
                  <th className="px-4 py-3 font-medium">Clicks</th>
                  <th className="px-4 py-3 font-medium">CTR</th>
                </tr>
              </thead>
              <tbody>
                {data.topAds.map((ad) => (
                  <tr key={ad.id} className="border-b border-[var(--varnarc-border)]">
                    <td className="px-4 py-3">
                      <Link href={`/advertisements/${ad.id}`} className="hover:underline">
                        {ad.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{ad.type}</td>
                    <td className="px-4 py-3">{ad.placement || '—'}</td>
                    <td className="px-4 py-3">{ad.impressions}</td>
                    <td className="px-4 py-3">{ad.clicks}</td>
                    <td className="px-4 py-3">{(ad.ctr * 100).toFixed(2)}%</td>
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
