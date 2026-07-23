'use client';

import { useEffect, useState } from 'react';
import { Button, PageHeader } from '@varnarc/ui';

type SitemapStatus = {
  indexUrl?: string;
  types?: Array<{ type: string; count: number; url: string }>;
  lastRebuild?: string;
};

export default function SeoSitemapsPage() {
  const [data, setData] = useState<SitemapStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/admin/seo/sitemaps');
    const json = (await res.json()) as { data?: SitemapStatus };
    setData(json.data ?? null);
  }

  useEffect(() => {
    void load();
  }, []);

  async function rebuild() {
    setMessage(null);
    const res = await fetch('/api/admin/seo/sitemaps', { method: 'POST' });
    if (!res.ok) {
      setMessage('Rebuild failed');
      return;
    }
    setMessage('Sitemap cache cleared and rebuilt.');
    await load();
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Sitemaps" description="Module sitemaps and rebuild controls." />
      <Button type="button" onClick={() => void rebuild()}>
        Rebuild sitemaps
      </Button>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
      <p className="text-sm text-[var(--varnarc-subtle)]">Index: {data?.indexUrl ?? '—'}</p>
      <div className="overflow-auto rounded-lg border border-[var(--varnarc-border)]">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">URLs</th>
              <th className="px-3 py-2 text-left">URL</th>
            </tr>
          </thead>
          <tbody>
            {(data?.types ?? []).map((row) => (
              <tr key={row.type} className="border-b border-[var(--varnarc-border)]">
                <td className="px-3 py-2">{row.type}</td>
                <td className="px-3 py-2">{row.count}</td>
                <td className="px-3 py-2 font-mono text-xs">{row.url}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
