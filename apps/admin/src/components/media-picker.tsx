'use client';

import { useEffect, useRef, useState } from 'react';
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

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function MediaPicker({
  value,
  previewUrl,
  label = 'Select image',
  accept = 'image/*,.pdf',
  onChange,
  onSelect,
}: {
  value: string | null;
  previewUrl?: string | null;
  label?: string;
  accept?: string;
  /** Legacy: id + preview URL only */
  onChange: (id: string | null, previewUrl?: string | null) => void;
  /** Rich selection including alt/title/dimensions when available */
  onSelect?: (selection: MediaPickerSelection) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [assets, setAssets] = useState<MediaPickerAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [urlOpen, setUrlOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const shownUrl = previewUrl || null;
  const hasSelection = Boolean(value || shownUrl);

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

  function emit(selection: MediaPickerSelection) {
    onChange(selection.id, selection.url);
    onSelect?.(selection);
  }

  function selectAsset(asset: MediaPickerAsset | null) {
    if (!asset) {
      emit({
        id: null,
        url: null,
        alt: null,
        title: null,
        caption: null,
        width: null,
        height: null,
      });
      setUrlDraft('');
      return;
    }
    const url = asset.secureUrl || asset.url;
    emit({
      id: asset.id,
      url,
      alt: asset.alt ?? null,
      title: asset.title ?? null,
      caption: asset.caption ?? null,
      width: asset.width ?? null,
      height: asset.height ?? null,
    });
  }

  function applyUrl() {
    const next = urlDraft.trim();
    setError(null);
    if (!next) {
      setError('Paste an image or PDF URL.');
      return;
    }
    if (!isHttpUrl(next) || next.length > 500) {
      setError('Enter a valid http(s) URL (max 500 characters).');
      return;
    }
    emit({
      id: null,
      url: next,
      alt: null,
      title: null,
      caption: null,
      width: null,
      height: null,
    });
    setUrlOpen(false);
  }

  async function uploadLocalFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/media/upload', { method: 'POST', body: form });
      const json = (await res.json()) as {
        data?: {
          id?: string;
          url?: string;
          secureUrl?: string | null;
          alt?: string | null;
          title?: string | null;
          caption?: string | null;
          width?: number | null;
          height?: number | null;
        };
        error?: { message?: string };
      };
      if (!res.ok) throw new Error(json.error?.message || 'Upload failed');
      const asset = json.data;
      const url = asset?.secureUrl || asset?.url || null;
      if (!asset?.id || !url) throw new Error('Upload returned no media asset');
      emit({
        id: asset.id,
        url,
        alt: asset.alt ?? null,
        title: asset.title ?? null,
        caption: asset.caption ?? null,
        width: asset.width ?? null,
        height: asset.height ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        {shownUrl ? (
          shownUrl.toLowerCase().includes('.pdf') ? (
            <a
              href={shownUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-16 w-16 items-center justify-center rounded border border-[var(--varnarc-border)] text-xs text-[var(--varnarc-brand)]"
            >
              PDF
            </a>
          ) : (
            <img
              src={shownUrl}
              alt=""
              width={64}
              height={64}
              className="h-16 w-16 rounded object-cover border border-[var(--varnarc-border)]"
            />
          )
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded border border-dashed border-[var(--varnarc-border)] text-xs text-[var(--varnarc-subtle)]">
            None
          </div>
        )}
        <Button type="button" onClick={() => setOpen(true)}>
          Library
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? 'Uploading…' : 'Upload file'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setUrlOpen((openNow) => !openNow)}>
          Use URL
        </Button>
        {hasSelection ? (
          <Button type="button" variant="secondary" onClick={() => selectAsset(null)}>
            Clear
          </Button>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadLocalFile(file);
            e.target.value = '';
          }}
        />
      </div>

      {urlOpen ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="h-10 min-w-[16rem] flex-1 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
            placeholder="https://…"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
          />
          <Button type="button" onClick={applyUrl}>
            Apply URL
          </Button>
        </div>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {shownUrl && !value ? (
        <p className="truncate text-xs text-[var(--varnarc-subtle)]">{shownUrl}</p>
      ) : null}

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
                    <p className="truncate text-xs text-[var(--varnarc-subtle)]">
                      {asset.title || asset.alt || asset.publicId}
                    </p>
                    {asset.width && asset.height ? (
                      <p className="text-xs text-[var(--varnarc-subtle)]">
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
