'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';

type RobotsSettings = {
  disallow?: string[];
  allow?: string[];
  crawlDelay?: number | null;
};

export function SeoRobotsForm({ initial }: { initial: RobotsSettings }) {
  const [disallow, setDisallow] = useState((initial.disallow ?? []).join('\n'));
  const [allow, setAllow] = useState((initial.allow ?? ['/']).join('\n'));
  const [crawlDelay, setCrawlDelay] = useState(String(initial.crawlDelay ?? ''));
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setMessage(null);
    const body = {
      disallow: disallow.split('\n').map((s) => s.trim()).filter(Boolean),
      allow: allow.split('\n').map((s) => s.trim()).filter(Boolean),
      crawlDelay: crawlDelay.trim() ? Number(crawlDelay) : null,
    };
    const res = await fetch('/api/admin/seo/robots', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    if (!res.ok) throw new Error(json.error?.message || 'Save failed');
    setMessage('Saved.');
  }

  return (
    <div className="space-y-4 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <label className="block text-sm">
        Allow paths (one per line)
        <textarea className="mt-1 w-full max-w-lg rounded-md border border-[var(--varnarc-border)] p-3 font-mono text-xs" rows={3} value={allow} onChange={(e) => setAllow(e.target.value)} />
      </label>
      <label className="block text-sm">
        Disallow paths (one per line)
        <textarea className="mt-1 w-full max-w-lg rounded-md border border-[var(--varnarc-border)] p-3 font-mono text-xs" rows={5} value={disallow} onChange={(e) => setDisallow(e.target.value)} />
      </label>
      <label className="block text-sm">
        Crawl delay (seconds, optional)
        <input className="mt-1 block h-10 w-32 rounded-md border border-[var(--varnarc-border)] px-3" value={crawlDelay} onChange={(e) => setCrawlDelay(e.target.value)} />
      </label>
      <Button type="button" onClick={() => void save().catch((e) => setMessage(e instanceof Error ? e.message : 'Save failed'))}>
        Save robots rules
      </Button>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}
