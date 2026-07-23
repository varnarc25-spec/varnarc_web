'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';

export function AiEditorialPipeline() {
  const [limit, setLimit] = useState('5');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{
    processed: number;
    enriched: Array<{ id: string; title: string; skipped?: boolean; reason?: string; excerpt?: string; seoTitle?: string }>;
  } | null>(null);

  async function run() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/ai/features/editorial/enrich-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: Number(limit) || 5 }),
      });
      const json = (await res.json()) as {
        data?: { processed: number; enriched: typeof result extends null ? never : NonNullable<typeof result>['enriched'] };
        error?: { message?: string };
      };
      if (!res.ok) throw new Error(json.error?.message || 'Pipeline failed');
      setResult(json.data ?? null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <div>
        <h3 className="text-sm font-semibold">Editorial pipeline</h3>
        <p className="mt-1 text-xs text-[var(--varnarc-subtle)]">
          Auto-generate excerpt and SEO metadata for draft articles missing them.
        </p>
      </div>
      <label className="text-sm">
        <span className="mb-1 block text-[var(--varnarc-subtle)]">Max drafts per run</span>
        <input
          className="h-10 w-24 rounded-md border border-[var(--varnarc-border)] px-3"
          type="number"
          min={1}
          max={10}
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
        />
      </label>
      <Button type="button" onClick={() => void run()} disabled={loading}>
        {loading ? 'Processing…' : 'Enrich draft articles'}
      </Button>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
      {result ? (
        <div className="space-y-2 text-sm">
          <p className="font-medium">Processed {result.processed} article(s)</p>
          <ul className="space-y-1 text-[var(--varnarc-subtle)]">
            {result.enriched.map((row) => (
              <li key={row.id}>
                {row.title}
                {row.skipped ? ` — skipped (${row.reason})` : row.seoTitle ? ` — SEO: ${row.seoTitle}` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
