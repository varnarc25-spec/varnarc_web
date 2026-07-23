import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import Link from 'next/link';
import { apiServerFetch } from '@/lib/api';
import { AdvertisementEditActions } from '@/components/advertisement-edit-actions';

type AdDetail = {
  id: string;
  name: string;
  slug: string;
  status: string;
  type: string;
  provider: string;
  creativeUrl: string | null;
  targetUrl: string | null;
  htmlContent: string | null;
  adsenseSlot: string | null;
  adsenseClient: string | null;
  priority: number;
};

export default async function AdvertisementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await apiServerFetch<AdDetail>(`/advertisements/${id}`);

  if (result.error || !result.data) {
    return (
      <div>
        <PageHeader title="Advertisement" description="Ad detail" />
        <Card>
          <CardHeader>
            <CardTitle>Unable to load advertisement</CardTitle>
            <CardDescription>{result.error || 'Not found'}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const ad = result.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={ad.name}
        description={`/${ad.slug}`}
        actions={<Badge>{ad.status}</Badge>}
      />
      <AdvertisementEditActions ad={ad} />
      <Link href="/advertisements" className="text-sm text-[var(--varnarc-brand)] hover:underline">
        Back to advertisements
      </Link>
    </div>
  );
}
