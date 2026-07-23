'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Button } from '@varnarc/ui';
import { MediaUploadZone } from '@/components/media-upload-zone';

export type MediaAssetRow = {
  id: string;
  publicId: string;
  url: string;
  secureUrl: string | null;
  thumbnailUrl?: string | null;
  resourceType: string;
  alt: string | null;
  originalName?: string | null;
  bytes?: number | null;
  width?: number | null;
  height?: number | null;
  createdAt: string;
};

type MediaFolderRow = {
  id: string;
  name: string;
  slug: string;
  path?: string | null;
  parentId?: string | null;
};

export function MediaBrowser({
  initialAssets,
  folders,
  folderId,
  search,
  resourceType,
}: {
  initialAssets: MediaAssetRow[];
  folders: MediaFolderRow[];
  folderId?: string | null;
  search?: string;
  resourceType?: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(() => router.refresh(), [router]);

  async function bulkDelete() {
    if (!selected.length) return;
    setDeleting(true);
    try {
      await fetch('/api/admin/media/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selected }),
      });
      setSelected([]);
      refresh();
    } finally {
      setDeleting(false);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-2 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--varnarc-subtle)]">
          Folders
        </p>
        <Link
          href="/media"
          className={`block rounded px-2 py-1.5 text-sm ${!folderId ? 'bg-[var(--varnarc-muted)] font-medium' : 'hover:bg-[var(--varnarc-muted)]'}`}
        >
          All assets
        </Link>
        {folders.map((folder) => (
          <Link
            key={folder.id}
            href={`/media?folderId=${folder.id}`}
            className={`block rounded px-2 py-1.5 text-sm ${folderId === folder.id ? 'bg-[var(--varnarc-muted)] font-medium' : 'hover:bg-[var(--varnarc-muted)]'}`}
          >
            {folder.name}
          </Link>
        ))}
        <Link href="/media/folders" className="mt-2 block text-xs text-[var(--varnarc-brand)] hover:underline">
          Manage folders →
        </Link>
      </aside>

      <div className="space-y-4">
        <MediaUploadZone folderId={folderId} onUploaded={refresh} />

        <form className="flex flex-wrap items-end gap-3" method="get">
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Search</span>
            <input
              name="search"
              defaultValue={search || ''}
              placeholder="Alt, name, public ID…"
              className="h-10 w-56 rounded-md border border-[var(--varnarc-border)] px-3"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Type</span>
            <select
              name="resourceType"
              defaultValue={resourceType || ''}
              className="h-10 rounded-md border border-[var(--varnarc-border)] px-3"
            >
              <option value="">All types</option>
              <option value="IMAGE">Images</option>
              <option value="VIDEO">Videos</option>
              <option value="DOCUMENT">Documents</option>
              <option value="RAW">Other</option>
            </select>
          </label>
          {folderId ? <input type="hidden" name="folderId" value={folderId} /> : null}
          <Button type="submit">Filter</Button>
        </form>

        {selected.length ? (
          <div className="flex items-center gap-3 rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] px-3 py-2 text-sm">
            <span>{selected.length} selected</span>
            <Button type="button" disabled={deleting} onClick={() => void bulkDelete()}>
              {deleting ? 'Deleting…' : 'Delete selected'}
            </Button>
            <Button type="button" onClick={() => setSelected([])}>
              Clear
            </Button>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {initialAssets.map((asset) => {
            const preview = asset.thumbnailUrl || asset.secureUrl || asset.url;
            const checked = selected.includes(asset.id);
            return (
              <div
                key={asset.id}
                className={`relative overflow-hidden rounded-lg border bg-[var(--varnarc-surface)] ${
                  checked ? 'border-[var(--varnarc-brand)] ring-1 ring-[var(--varnarc-brand)]' : 'border-[var(--varnarc-border)]'
                }`}
              >
                <label className="absolute left-2 top-2 z-10">
                  <input type="checkbox" checked={checked} onChange={() => toggle(asset.id)} />
                </label>
                <Link href={`/media/${asset.id}`} className="block p-2">
                  {asset.resourceType === 'IMAGE' ? (
                    <img
                      src={preview}
                      alt={asset.alt || asset.publicId}
                      className="mb-2 aspect-square w-full rounded object-cover"
                    />
                  ) : (
                    <div className="mb-2 flex aspect-square items-center justify-center rounded bg-[var(--varnarc-muted)] text-xs text-[var(--varnarc-subtle)]">
                      {asset.resourceType}
                    </div>
                  )}
                  <p className="line-clamp-1 text-xs font-medium">
                    {asset.alt || asset.originalName || asset.publicId}
                  </p>
                  <p className="line-clamp-1 font-mono text-[10px] text-[var(--varnarc-subtle)]">
                    {asset.publicId}
                  </p>
                </Link>
              </div>
            );
          })}
          {!initialAssets.length ? (
            <p className="col-span-full py-12 text-center text-sm text-[var(--varnarc-subtle)]">
              No media assets yet. Upload files above or register metadata manually.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
