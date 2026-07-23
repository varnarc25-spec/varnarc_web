'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';

type BatchResult = {
  processed: number;
  results: Array<{ id?: string | null; label?: string | null; summary: string; style: string }>;
};

export function AiBatchSummarizer() {
  const [raw, setRaw] = useState('');
  const [style, setStyle] = useState<'brief' | 'bullets' | 'paragraph'>('brief');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<BatchResult | null>(null);

  async function runBatch() {
    const chunks = raw
      .split(/\n---+\n/)
      .map((text, index) => ({ id: String(index + 1), label: `Document ${index + 1}`, text: text.trim() }))
      .filter((item) => item.text.length >= 20);

    if (!chunks.length) {
      setMessage('Add at least one document (20+ chars). Separate documents with a line containing only ---');
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/ai/features/summarize/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: chunks, style }),
      });
      const json = (await res.json()) as { data?: BatchResult; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Batch summarize failed');
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
        <h3 className="text-sm font-semibold">Batch summarizer</h3>
        <p className="mt-1 text-xs text-[var(--varnarc-subtle)]">
          Paste multiple long documents separated by <code>---</code> on its own line (up to 20 per run).
        </p>
      </div>
      <textarea
        className="min-h-40 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2 text-sm"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={'Document 1 text...\n---\nDocument 2 text...'}
      />
      <label className="text-sm">
        <span className="mb-1 block text-[var(--varnarc-subtle)]">Style</span>
        <select
          className="h-10 rounded-md border border-[var(--varnarc-border)] px-3"
          value={style}
          onChange={(e) => setStyle(e.target.value as typeof style)}
        >
          <option value="brief">Brief</option>
          <option value="bullets">Bullets</option>
          <option value="paragraph">Paragraph</option>
        </select>
      </label>
      <Button type="button" onClick={() => void runBatch()} disabled={loading}>
        {loading ? 'Summarizing…' : 'Run batch'}
      </Button>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
      {result?.results?.length ? (
        <div className="space-y-3">
          {result.results.map((row, index) => (
            <div key={`${row.id ?? index}`} className="rounded-md border border-[var(--varnarc-border)] bg-white p-3 text-sm">
              <p className="font-medium">{row.label || `Document ${index + 1}`}</p>
              <p className="mt-2 whitespace-pre-wrap text-[var(--varnarc-subtle)]">{row.summary}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
