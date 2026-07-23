'use client';

import { useEffect, useState } from 'react';
import { Button } from '@varnarc/ui';

type MediaAsset = {
  id: string;
  publicId: string;
  url: string;
  secureUrl: string | null;
  resourceType: string;
  alt: string | null;
};

export function MediaPicker({
  value,
  previewUrl,
  onChange,
}: {
  value: string | null;
  previewUrl?: string | null;
  onChange: (id: string | null, previewUrl?: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ limit: '24' });
        if (search.trim()) qs.set('search', search.trim());
        const res = await fetch(`/api/admin/cms/media/list?${qs.toString()}`);
        const json = (await res.json()) as { data?: MediaAsset[] };
        if (!cancelled) setAssets(Array.isArray(json.data) ? json.data : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, search]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        {value && (previewUrl || value) ? (
          <img
            src={previewUrl || ''}
            alt="Featured"
            className="h-16 w-16 rounded object-cover border border-[var(--varnarc-border)]"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded border border-dashed border-[var(--varnarc-border)] text-xs text-[var(--varnarc-subtle)]">
            None
          </div>
        )}
        <Button type="button" onClick={() => setOpen(true)}>
          Choose image
        </Button>
        {value ? (
          <Button type="button" onClick={() => onChange(null, null)}>
            Clear
          </Button>
        ) : null}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-lg bg-[var(--varnarc-surface)] p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-semibold">Select featured image</h3>
              <Button type="button" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
            <input
              className="mb-3 h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
              placeholder="Search media…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {loading ? (
              <p className="text-sm text-[var(--varnarc-subtle)]">Loading…</p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {assets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    className="rounded border border-[var(--varnarc-border)] p-2 text-left hover:border-[var(--varnarc-brand)]"
                    onClick={() => {
                      onChange(asset.id, asset.secureUrl || asset.url);
                      setOpen(false);
                    }}
                  >
                    {asset.resourceType === 'IMAGE' ? (
                      <img
                        src={asset.secureUrl || asset.url}
                        alt={asset.alt || asset.publicId}
                        className="mb-1 aspect-square w-full rounded object-cover"
                      />
                    ) : (
                      <div className="mb-1 flex aspect-square items-center justify-center text-xs text-[var(--varnarc-subtle)]">
                        File
                      </div>
                    )}
                    <span className="line-clamp-1 text-xs">{asset.alt || asset.publicId}</span>
                  </button>
                ))}
                {!assets.length ? (
                  <p className="col-span-full text-sm text-[var(--varnarc-subtle)]">No media found.</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
