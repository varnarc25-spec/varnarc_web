'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';

export type AdsenseSettings = {
  enabled?: boolean;
  client?: string | null;
  defaultSlot?: string | null;
  slots?: Record<string, string>;
};

const NAMED_SLOTS = [
  { slug: 'calculator-sidebar', label: 'Calculator sidebar' },
  { slug: 'calculator-bottom', label: 'Calculator bottom' },
  { slug: 'article-sidebar', label: 'Article sidebar' },
] as const;

export function AdsenseSettingsForm({ initial }: { initial: AdsenseSettings }) {
  const [form, setForm] = useState({
    enabled: initial.enabled !== false,
    client: initial.client ?? '',
    defaultSlot: initial.defaultSlot ?? '',
    namedSlots: Object.fromEntries(
      NAMED_SLOTS.map((item) => [item.slug, initial.slots?.[item.slug] ?? '']),
    ) as Record<string, string>,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const slots: Record<string, string> = {};
      for (const [slug, value] of Object.entries(form.namedSlots)) {
        const trimmed = value.trim();
        if (trimmed) slots[slug] = trimmed;
      }
      const res = await fetch('/api/admin/settings/adsense', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: form.enabled,
          client: form.client.trim() || null,
          defaultSlot: form.defaultSlot.trim() || null,
          slots,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Save failed');
      setMessage(
        'AdSense settings saved. The public site will pick them up within about a minute.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'mt-1 block h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3';

  return (
    <div className="space-y-4 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <p className="text-sm text-[var(--varnarc-subtle)]">
        These values are used on the public website: the AdSense loader in the page head, ads.txt,
        and fallback ad units when no campaign creative is assigned.
      </p>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
        />
        Enable Google AdSense on the public site
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          Publisher ID
          <input
            className={inputClass}
            placeholder="ca-pub-6274053387170397"
            value={form.client}
            onChange={(e) => setForm((prev) => ({ ...prev, client: e.target.value }))}
          />
        </label>
        <label className="block text-sm">
          Default ad unit slot
          <input
            className={inputClass}
            placeholder="1234567890"
            value={form.defaultSlot}
            onChange={(e) => setForm((prev) => ({ ...prev, defaultSlot: e.target.value }))}
          />
        </label>
        {NAMED_SLOTS.map((item) => (
          <label key={item.slug} className="block text-sm">
            {item.label} slot
            <input
              className={inputClass}
              placeholder="Optional numeric slot ID"
              value={form.namedSlots[item.slug] ?? ''}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  namedSlots: { ...prev.namedSlots, [item.slug]: e.target.value },
                }))
              }
            />
          </label>
        ))}
      </div>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="button" onClick={() => void save()} disabled={saving}>
        {saving ? 'Saving…' : 'Save AdSense settings'}
      </Button>
    </div>
  );
}
