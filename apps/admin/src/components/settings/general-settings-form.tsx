'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';

type GeneralSettings = {
  siteName?: string;
  siteTagline?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  copyrightText?: string | null;
  companyName?: string | null;
  companyAddress?: string | null;
  timezone?: string;
  locale?: string;
};

export function GeneralSettingsForm({ initial }: { initial: GeneralSettings }) {
  const [form, setForm] = useState<GeneralSettings>(initial);
  const [message, setMessage] = useState<string | null>(null);

  function update<K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setMessage(null);
    const res = await fetch('/api/admin/settings/general', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    if (!res.ok) throw new Error(json.error?.message || 'Save failed');
    setMessage('Saved.');
  }

  return (
    <div className="space-y-4 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          Site name
          <input
            className="mt-1 block h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={form.siteName ?? ''}
            onChange={(e) => update('siteName', e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Tagline
          <input
            className="mt-1 block h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={form.siteTagline ?? ''}
            onChange={(e) => update('siteTagline', e.target.value || null)}
          />
        </label>
        <label className="block text-sm">
          Logo URL
          <input
            className="mt-1 block h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={form.logoUrl ?? ''}
            onChange={(e) => update('logoUrl', e.target.value || null)}
          />
        </label>
        <label className="block text-sm">
          Favicon URL
          <input
            className="mt-1 block h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={form.faviconUrl ?? ''}
            onChange={(e) => update('faviconUrl', e.target.value || null)}
          />
        </label>
        <label className="block text-sm">
          Contact email
          <input
            type="email"
            className="mt-1 block h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={form.contactEmail ?? ''}
            onChange={(e) => update('contactEmail', e.target.value || null)}
          />
        </label>
        <label className="block text-sm">
          Contact phone
          <input
            className="mt-1 block h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={form.contactPhone ?? ''}
            onChange={(e) => update('contactPhone', e.target.value || null)}
          />
        </label>
        <label className="block text-sm md:col-span-2">
          Copyright text
          <input
            className="mt-1 block h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={form.copyrightText ?? ''}
            onChange={(e) => update('copyrightText', e.target.value || null)}
          />
        </label>
        <label className="block text-sm">
          Company name
          <input
            className="mt-1 block h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={form.companyName ?? ''}
            onChange={(e) => update('companyName', e.target.value || null)}
          />
        </label>
        <label className="block text-sm">
          Timezone
          <input
            className="mt-1 block h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={form.timezone ?? 'UTC'}
            onChange={(e) => update('timezone', e.target.value)}
          />
        </label>
        <label className="block text-sm md:col-span-2">
          Company address
          <textarea
            className="mt-1 w-full rounded-md border border-[var(--varnarc-border)] p-3 text-sm"
            rows={2}
            value={form.companyAddress ?? ''}
            onChange={(e) => update('companyAddress', e.target.value || null)}
          />
        </label>
        <label className="block text-sm">
          Locale
          <input
            className="mt-1 block h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={form.locale ?? 'en'}
            onChange={(e) => update('locale', e.target.value)}
          />
        </label>
      </div>
      <Button type="button" onClick={() => void save().catch((e) => setMessage(e instanceof Error ? e.message : 'Save failed'))}>
        Save general settings
      </Button>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}
