'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';

export function AdCreateForm({
  campaigns,
  placements,
}: {
  campaigns: Array<{ id: string; name: string }>;
  placements: Array<{ id: string; name: string; slug: string }>;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    campaignId: campaigns[0]?.id || '',
    placementId: placements[0]?.id || '',
    type: 'BANNER',
    provider: 'DIRECT',
    creativeUrl: '',
    targetUrl: '',
    adsenseSlot: '',
    adsenseClient: '',
    htmlContent: '',
  });

  async function submit() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/advertisements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          campaignId: form.campaignId,
          placementId: form.placementId || null,
          type: form.type,
          provider: form.provider,
          contentType:
            form.type === 'ADSENSE'
              ? 'SCRIPT_SLOT'
              : form.type === 'HTML'
                ? 'HTML'
                : form.type === 'CTA'
                  ? 'TEXT'
                  : 'IMAGE',
          creativeUrl: form.creativeUrl || null,
          targetUrl: form.targetUrl || null,
          adsenseSlot: form.adsenseSlot || null,
          adsenseClient: form.adsenseClient || null,
          htmlContent: form.htmlContent || null,
          status: 'DRAFT',
        }),
      });
      const json = (await res.json()) as { error?: { message?: string }; data?: { id: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Failed to create');
      setMessage('Created');
      if (json.data?.id) router.push(`/advertisements/${json.data.id}`);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-8 space-y-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <h2 className="font-semibold">Create advertisement</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <input
          className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
          placeholder="Slug"
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
        />
        <select
          className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
          value={form.campaignId}
          onChange={(e) => setForm((f) => ({ ...f, campaignId: e.target.value }))}
        >
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
          value={form.placementId}
          onChange={(e) => setForm((f) => ({ ...f, placementId: e.target.value }))}
        >
          <option value="">No placement</option>
          {placements.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.slug})
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
        >
          {['BANNER', 'ADSENSE', 'HTML', 'AFFILIATE', 'SPONSORED', 'NATIVE', 'CTA', 'INTERNAL'].map(
            (t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ),
          )}
        </select>
        <select
          className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
          value={form.provider}
          onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
        >
          {['DIRECT', 'GOOGLE_ADSENSE', 'AFFILIATE', 'INTERNAL'].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
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
        {form.type === 'ADSENSE' ? (
          <>
            <input
              className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
              placeholder="AdSense client"
              value={form.adsenseClient}
              onChange={(e) => setForm((f) => ({ ...f, adsenseClient: e.target.value }))}
            />
            <input
              className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 text-sm"
              placeholder="AdSense slot"
              value={form.adsenseSlot}
              onChange={(e) => setForm((f) => ({ ...f, adsenseSlot: e.target.value }))}
            />
          </>
        ) : null}
      </div>
      {form.type === 'HTML' || form.type === 'CTA' ? (
        <textarea
          className="min-h-24 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2 text-sm"
          placeholder="HTML / CTA content"
          value={form.htmlContent}
          onChange={(e) => setForm((f) => ({ ...f, htmlContent: e.target.value }))}
        />
      ) : null}
      <div className="flex items-center gap-3">
        <Button type="button" onClick={submit} disabled={loading || !form.campaignId}>
          Create
        </Button>
        {message ? <span className="text-sm text-[var(--varnarc-subtle)]">{message}</span> : null}
      </div>
    </div>
  );
}
