'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';

type Integrations = {
  googleSearchConsoleVerified?: boolean;
  googleSearchConsoleSiteUrl?: string | null;
  bingWebmasterVerified?: boolean;
};

export function SeoIntegrationsForm({ initial }: { initial: Integrations }) {
  const [form, setForm] = useState<Integrations>(initial);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setMessage(null);
    const res = await fetch('/api/admin/seo/integrations', {
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
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.googleSearchConsoleVerified ?? false}
          onChange={(e) => setForm((f) => ({ ...f, googleSearchConsoleVerified: e.target.checked }))}
        />
        Google Search Console verified
      </label>
      <label className="block text-sm">
        Search Console site URL
        <input
          className="mt-1 block h-10 w-full max-w-md rounded-md border border-[var(--varnarc-border)] px-3"
          value={form.googleSearchConsoleSiteUrl ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, googleSearchConsoleSiteUrl: e.target.value || null }))}
          placeholder="https://example.com/"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.bingWebmasterVerified ?? false}
          onChange={(e) => setForm((f) => ({ ...f, bingWebmasterVerified: e.target.checked }))}
        />
        Bing Webmaster verified
      </label>
      <Button type="button" onClick={() => void save().catch((e) => setMessage(e instanceof Error ? e.message : 'Save failed'))}>
        Save
      </Button>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}
