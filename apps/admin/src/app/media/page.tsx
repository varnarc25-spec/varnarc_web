import Link from 'next/link';
import { Badge, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { MediaBrowser, type MediaAssetRow } from '@/components/media-browser';
import { MediaRegisterForm } from '@/components/media-register-form';

type MediaFolderRow = {
  id: string;
  name: string;
  slug: string;
  path?: string | null;
  parentId?: string | null;
};

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; folderId?: string; resourceType?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '48' });
  if (params.search) qs.set('search', params.search);
  if (params.folderId) qs.set('folderId', params.folderId);
  if (params.resourceType) qs.set('resourceType', params.resourceType);

  const [mediaResult, foldersResult] = await Promise.all([
    apiServerFetch<MediaAssetRow[]>(`/media?${qs.toString()}`),
    apiServerFetch<MediaFolderRow[]>('/media/folders?parentId=all'),
  ]);

  const assets = Array.isArray(mediaResult.data) ? mediaResult.data : [];
  const folders = Array.isArray(foldersResult.data) ? foldersResult.data : [];

  return (
    <div>
      <PageHeader
        title="Media library"
        description="Upload, organize, and reuse digital assets across the platform."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{assets.length} shown</Badge>
            <Link href="/media/folders" className="text-sm text-[var(--varnarc-brand)] hover:underline">
              Folders
            </Link>
            <Link href="/media/collections" className="text-sm text-[var(--varnarc-brand)] hover:underline">
              Collections
            </Link>
          </div>
        }
      />

      {mediaResult.error ? (
        <p className="mb-4 text-sm text-red-600">{mediaResult.error}</p>
      ) : null}

      <details className="mb-4 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-3">
        <summary className="cursor-pointer text-sm font-medium">Register existing CDN asset</summary>
        <div className="mt-3">
          <MediaRegisterForm />
        </div>
      </details>

      <MediaBrowser
        initialAssets={assets}
        folders={folders}
        folderId={params.folderId || null}
        search={params.search}
        resourceType={params.resourceType}
      />
    </div>
  );
}
