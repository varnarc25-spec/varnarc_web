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
      <div className="rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-bg)] p-3 text-sm text-[var(--varnarc-subtle)]">
        <p className="font-medium text-[var(--varnarc-ink)]">Google indexing checklist</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            Set <code className="text-xs">GOOGLE_SITE_VERIFICATION</code> in web env (HTML-tag
            content from Search Console) and redeploy.
          </li>
          <li>
            Verify property <code className="text-xs">https://varnarc.com</code> in{' '}
            <a
              className="underline"
              href="https://search.google.com/search-console"
              target="_blank"
              rel="noreferrer"
            >
              Google Search Console
            </a>
            .
          </li>
          <li>
            Submit sitemap: <code className="text-xs">https://varnarc.com/sitemap.xml</code>
          </li>
          <li>
            Confirm Construction nested index resolves:{' '}
            <code className="text-xs">/sitemap/construction.xml</code>
          </li>
          <li>Use Admin → Sitemaps → Rebuild after large content publishes.</li>
        </ol>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.googleSearchConsoleVerified ?? false}
          onChange={(e) =>
            setForm((f) => ({ ...f, googleSearchConsoleVerified: e.target.checked }))
          }
        />
        Google Search Console verified (ops status flag — does not replace env verification)
      </label>
      <label className="block text-sm">
        Search Console site URL
        <input
          className="mt-1 block h-10 w-full max-w-md rounded-md border border-[var(--varnarc-border)] px-3"
          value={form.googleSearchConsoleSiteUrl ?? ''}
          onChange={(e) =>
            setForm((f) => ({ ...f, googleSearchConsoleSiteUrl: e.target.value || null }))
          }
          placeholder="https://varnarc.com/"
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
      <Button
        type="button"
        onClick={() =>
          void save().catch((e) => setMessage(e instanceof Error ? e.message : 'Save failed'))
        }
      >
        Save
      </Button>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}
