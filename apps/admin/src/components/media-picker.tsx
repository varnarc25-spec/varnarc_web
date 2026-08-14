'use client';

import { useEffect, useState } from 'react';
import { Button } from '@varnarc/ui';

export type MediaPickerAsset = {
  id: string;
  publicId: string;
  url: string;
  secureUrl: string | null;
  resourceType: string;
  title?: string | null;
  alt: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
};

export type MediaPickerSelection = {
  id: string | null;
  url: string | null;
  alt?: string | null;
  title?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
};

export function MediaPicker({
  value,
  previewUrl,
  label = 'Select image',
  onChange,
  onSelect,
}: {
  value: string | null;
  previewUrl?: string | null;
  label?: string;
  /** Legacy: id + preview URL only */
  onChange: (id: string | null, previewUrl?: string | null) => void;
  /** Rich selection including alt/title/dimensions when available */
  onSelect?: (selection: MediaPickerSelection) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [assets, setAssets] = useState<MediaPickerAsset[]>([]);
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
        const json = (await res.json()) as { data?: MediaPickerAsset[] };
        if (!cancelled) setAssets(Array.isArray(json.data) ? json.data : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, search]);

  function selectAsset(asset: MediaPickerAsset | null) {
    if (!asset) {
      onChange(null, null);
      onSelect?.({
        id: null,
        url: null,
        alt: null,
        title: null,
        caption: null,
        width: null,
        height: null,
      });
      return;
    }
    const url = asset.secureUrl || asset.url;
    onChange(asset.id, url);
    onSelect?.({
      id: asset.id,
      url,
      alt: asset.alt ?? null,
      title: asset.title ?? null,
      caption: asset.caption ?? null,
      width: asset.width ?? null,
      height: asset.height ?? null,
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        {value && (previewUrl || value) ? (
          <img
            src={previewUrl || ''}
            alt=""
            width={64}
            height={64}
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
          <Button type="button" onClick={() => selectAsset(null)}>
            Clear
          </Button>
        ) : null}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-lg bg-[var(--varnarc-surface)] p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-semibold">{label}</h3>
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
                      selectAsset(asset);
                      setOpen(false);
                    }}
                  >
                    <img
                      src={asset.secureUrl || asset.url}
                      alt={asset.alt || ''}
                      width={120}
                      height={120}
                      className="mb-1 aspect-square w-full rounded object-cover"
                    />
                    <p className="truncate text-[11px] text-[var(--varnarc-subtle)]">
                      {asset.title || asset.alt || asset.publicId}
                    </p>
                    {asset.width && asset.height ? (
                      <p className="text-[10px] text-[var(--varnarc-subtle)]">
                        {asset.width}×{asset.height}
                      </p>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
