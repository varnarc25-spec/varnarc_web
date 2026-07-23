'use client';

import { useEffect, useState } from 'react';
import { Button } from '@varnarc/ui';

type SummarizeResult = { summary: string; style: string };

export function AiSummarizerPanel({
  initialText = '',
  apiPath = '/api/admin/ai/features/summarize',
  compact = false,
}: {
  initialText?: string;
  apiPath?: string;
  compact?: boolean;
}) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [text, setText] = useState(initialText);
  const [style, setStyle] = useState<'brief' | 'bullets' | 'paragraph'>('brief');
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/admin/ai/features/status');
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
    if (text.trim().length < 20) {
      setMessage('Enter at least 20 characters to summarize');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, style }),
      });
      const json = (await res.json()) as { data?: SummarizeResult; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Summarize failed');
      setSummary(json.data?.summary ?? null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={compact ? 'space-y-3' : 'rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4 space-y-4'}>
      {!compact ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">AI summarizer</h3>
            {configured === false ? (
              <span className="text-xs text-amber-700">LLM not configured</span>
            ) : configured ? (
              <span className="text-xs text-emerald-700">Ready</span>
            ) : null}
          </div>
          <p className="text-xs text-[var(--varnarc-subtle)]">
            Condense articles, guides, or long notes into brief summaries, bullets, or a paragraph.
          </p>
        </>
      ) : null}

      <label className="block text-sm">
        <span className="mb-1 block text-[var(--varnarc-subtle)]">Text to summarize</span>
        <textarea
          className="min-h-28 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2 text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-[var(--varnarc-subtle)]">Style</span>
        <select
          className="h-10 rounded-md border border-[var(--varnarc-border)] px-3"
          value={style}
          onChange={(e) => setStyle(e.target.value as typeof style)}
        >
          <option value="brief">Brief (2–3 sentences)</option>
          <option value="bullets">Bullet points</option>
          <option value="paragraph">Single paragraph</option>
        </select>
      </label>

      <Button type="button" onClick={summarize} disabled={loading || configured === false}>
        {loading ? 'Summarizing…' : 'Summarize'}
      </Button>

      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}

      {summary ? (
        <div className="rounded-md border border-[var(--varnarc-border)] bg-white p-3 text-sm whitespace-pre-wrap">
          {summary}
        </div>
      ) : null}
    </div>
  );
}
