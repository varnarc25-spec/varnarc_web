'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@varnarc/ui';
import { MediaPicker } from '@/components/media-picker';

const ASSET_TYPES = [
  'logo',
  'dark_logo',
  'favicon',
  'apple_touch_icon',
  'og_image',
] as const;

export function ThemeAssetForm({ themeId }: { themeId: string }) {
  const router = useRouter();
  const [type, setType] = useState<(typeof ASSET_TYPES)[number]>('logo');
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/themes/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeId,
          type,
          mediaId,
          url: url || previewUrl || null,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed to save asset');
      setMessage('Saved');
      setUrl('');
      setMediaId(null);
      setPreviewUrl(null);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <h3 className="text-sm font-semibold">Add / update theme asset</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Type</span>
          <select
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={type}
            onChange={(e) => setType(e.target.value as (typeof ASSET_TYPES)[number])}
          >
            {ASSET_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">URL (optional if media selected)</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
          />
        </label>
      </div>
      <div>
        <span className="mb-1 block text-sm text-[var(--varnarc-subtle)]">Media library</span>
        <MediaPicker
          value={mediaId}
          previewUrl={previewUrl}
          onChange={(id, preview) => {
            setMediaId(id);
            setPreviewUrl(preview || null);
            if (preview) setUrl(preview);
          }}
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={loading || (!url && !mediaId)}>
          {loading ? 'Saving…' : 'Save asset'}
        </Button>
        {message ? <span className="text-sm text-[var(--varnarc-subtle)]">{message}</span> : null}
      </div>
    </div>
  );
}
