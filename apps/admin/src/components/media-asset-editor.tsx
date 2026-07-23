'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';

export function MediaAssetEditor({
  asset,
  usage,
}: {
  asset: {
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
  usage: Array<{ entityType: string; entityId: string; fieldName?: string | null; label?: string }>;
}) {
  const router = useRouter();
  const [alt, setAlt] = useState(asset.alt || '');
  const [caption, setCaption] = useState(asset.caption || '');
  const [description, setDescription] = useState(asset.description || '');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/media/${asset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alt: alt || null, caption: caption || null, description: description || null }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Save failed');
      setMessage('Saved');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setMessage(`${label} copied`);
  }

  const preview = asset.thumbnailUrl || asset.secureUrl || asset.url;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        {asset.resourceType === 'IMAGE' ? (
          <img src={preview} alt={asset.alt || asset.publicId} className="w-full rounded-lg border border-[var(--varnarc-border)]" />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-muted)]">
            {asset.resourceType}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void copy(asset.secureUrl, 'URL')}>
            Copy URL
          </Button>
          <Button type="button" onClick={() => void copy(asset.publicId, 'Public ID')}>
            Copy public ID
          </Button>
        </div>

        {asset.versions?.length ? (
          <div>
            <h3 className="mb-2 text-sm font-semibold">Optimized versions</h3>
            <ul className="space-y-1 text-xs text-[var(--varnarc-subtle)]">
              {asset.versions.map((v) => (
                <li key={v.id}>
                  <a href={v.url} target="_blank" rel="noreferrer" className="text-[var(--varnarc-brand)] hover:underline">
                    {v.label || 'version'}
                  </a>
                  {v.width ? ` — ${v.width}px` : ''}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-[var(--varnarc-subtle)]">Original name</dt>
          <dd>{asset.originalName || '—'}</dd>
          <dt className="text-[var(--varnarc-subtle)]">MIME</dt>
          <dd>{asset.mimeType || '—'}</dd>
          <dt className="text-[var(--varnarc-subtle)]">Size</dt>
          <dd>{asset.bytes ? `${Math.round(asset.bytes / 1024)} KB` : '—'}</dd>
          <dt className="text-[var(--varnarc-subtle)]">Dimensions</dt>
          <dd>{asset.width && asset.height ? `${asset.width}×${asset.height}` : '—'}</dd>
        </dl>

        <label className="block text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Alt text</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Caption</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Description</span>
          <textarea
            className="min-h-24 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <div className="flex items-center gap-3">
          <Button type="button" onClick={() => void save()} disabled={loading}>
            {loading ? 'Saving…' : 'Save metadata'}
          </Button>
          {message ? <span className="text-sm text-[var(--varnarc-subtle)]">{message}</span> : null}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Usage ({usage.length})</h3>
          {usage.length ? (
            <ul className="space-y-1 text-sm">
              {usage.map((u, i) => (
                <li key={`${u.entityType}-${u.entityId}-${i}`} className="text-[var(--varnarc-subtle)]">
                  {u.entityType} · {u.label || u.entityId}
                  {u.fieldName ? ` (${u.fieldName})` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--varnarc-subtle)]">Not referenced anywhere yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
