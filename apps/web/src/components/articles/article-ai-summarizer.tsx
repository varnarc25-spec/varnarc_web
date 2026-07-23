'use client';

import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '@/services/api-client';

export function ArticleAiSummarizer({ content, title }: { content: string; title: string }) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/ai/features/status`);
        const json = (await res.json()) as { data?: { configured?: boolean } };
        if (!cancelled) setConfigured(Boolean(json.data?.configured));
      } catch {
        if (!cancelled) setConfigured(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function summarize() {
    setOpen(true);
    if (summary) return;
    setLoading(true);
    setError(null);
    try {
      const plain = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const res = await fetch(`${getApiBaseUrl()}/ai/features/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `${title}\n\n${plain}`,
          style: 'brief',
        }),
      });
      const json = (await res.json()) as { data?: { summary: string }; error?: { message?: string } };
      if (!res.ok || !json.data?.summary) {
        throw new Error(json.error?.message || 'Summarize failed');
      }
      setSummary(json.data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  if (configured === false) return null;

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => void summarize()}
        className="rounded-full border border-[var(--varnarc-border)] px-4 py-2 text-sm font-medium text-[var(--varnarc-brand)] hover:bg-[var(--varnarc-muted)]"
      >
        {loading ? 'Summarizing…' : 'AI summary'}
      </button>
      {open ? (
        <div className="mt-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-muted)]/50 p-4 text-sm">
          <p className="mb-1 font-medium">Quick summary</p>
          {loading ? <p className="text-[var(--varnarc-subtle)]">Generating…</p> : null}
          {error ? <p className="text-red-600">{error}</p> : null}
          {summary ? <p className="whitespace-pre-wrap">{summary}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
