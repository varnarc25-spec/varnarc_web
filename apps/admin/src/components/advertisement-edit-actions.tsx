'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';

export function AdvertisementEditActions({
  ad,
}: {
  ad: {
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
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: ad.name,
    slug: ad.slug,
    creativeUrl: ad.creativeUrl || '',
    targetUrl: ad.targetUrl || '',
    htmlContent: ad.htmlContent || '',
    adsenseSlot: ad.adsenseSlot || '',
    adsenseClient: ad.adsenseClient || '',
    priority: ad.priority,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/advertisements/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ad.id,
          name: form.name,
          slug: form.slug,
          creativeUrl: form.creativeUrl || null,
          targetUrl: form.targetUrl || null,
          htmlContent: form.htmlContent || null,
          adsenseSlot: form.adsenseSlot || null,
          adsenseClient: form.adsenseClient || null,
          priority: form.priority,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed to save');
      setMessage('Saved');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function publish() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/advertisements/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ad.id }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed to publish');
      setMessage('Published');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <input
          className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <input
          className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
        />
        <input
          className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
          placeholder="Creative URL"
          value={form.creativeUrl}
          onChange={(e) => setForm((f) => ({ ...f, creativeUrl: e.target.value }))}
        />
        <input
          className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
          placeholder="Target URL"
          value={form.targetUrl}
          onChange={(e) => setForm((f) => ({ ...f, targetUrl: e.target.value }))}
        />
        <input
          type="number"
          className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
          value={form.priority}
          onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) || 0 }))}
        />
      </div>
      <textarea
        className="min-h-24 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2 text-sm"
        placeholder="HTML content"
        value={form.htmlContent}
        onChange={(e) => setForm((f) => ({ ...f, htmlContent: e.target.value }))}
      />
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={save} disabled={loading}>
          Save
        </Button>
        {ad.status !== 'ACTIVE' ? (
          <Button type="button" onClick={publish} disabled={loading}>
            Publish
          </Button>
        ) : null}
        <span className="text-sm text-[var(--varnarc-subtle)]">
          {ad.type} · {ad.provider} · {ad.status}
        </span>
        {message ? <span className="text-sm text-[var(--varnarc-subtle)]">{message}</span> : null}
      </div>
    </div>
  );
}
