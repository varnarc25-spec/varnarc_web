import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { MediaAssetEditor } from '@/components/media-asset-editor';

type AssetDetail = {
  id: string;
  publicId: string;
  url: string;
  secureUrl: string;
  thumbnailUrl?: string | null;
  resourceType: string;
  alt: string | null;
  caption: string | null;
  description: string | null;
  originalName?: string | null;
  mimeType?: string | null;
  bytes?: number | null;
  width?: number | null;
  height?: number | null;
  versions?: Array<{ id: string; label: string | null; url: string; width?: number | null; height?: number | null }>;
};

type UsageRef = {
  entityType: string;
  entityId: string;
  fieldName?: string | null;
  label?: string;
};

export default async function MediaAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [assetResult, usageResult] = await Promise.all([
    apiServerFetch<AssetDetail>(`/media/${id}`),
    apiServerFetch<UsageRef[]>(`/media/${id}/usage`),
  ]);

  if (assetResult.error || !assetResult.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Asset not found</CardTitle>
          <CardDescription>{assetResult.error || 'Unable to load asset.'}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const usage = Array.isArray(usageResult.data) ? usageResult.data : [];

  return (
    <div>
      <PageHeader
        title={assetResult.data.alt || assetResult.data.originalName || assetResult.data.publicId}
        description="Edit metadata, copy URLs, and review where this asset is used."
        actions={
          <Link href="/media" className="text-sm text-[var(--varnarc-brand)] hover:underline">
            ← Back to library
          </Link>
        }
      />
      <MediaAssetEditor asset={assetResult.data} usage={usage} />
    </div>
  );
}
