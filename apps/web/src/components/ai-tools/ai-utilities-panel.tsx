'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';

const inputClass =
  'h-10 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm';

const UTILITIES = [
  { value: 'prompt-generator', label: 'Prompt generator' },
  { value: 'text-summarizer', label: 'Text summarizer' },
  { value: 'seo-title', label: 'SEO title' },
  { value: 'meta-description', label: 'Meta description' },
  { value: 'keyword-cluster', label: 'Keyword cluster' },
  { value: 'regex-generator', label: 'Regex generator' },
  { value: 'json-formatter', label: 'JSON formatter' },
  { value: 'markdown-converter', label: 'Markdown converter' },
] as const;

type UtilityResult = {
  utility: string;
  output: string;
  [key: string]: unknown;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export function AiUtilitiesPanel() {
  const [utility, setUtility] = useState<(typeof UTILITIES)[number]['value']>('prompt-generator');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UtilityResult | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${apiUrl}/ai-tools/utilities/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utility, input }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        data?: UtilityResult;
        error?: { message?: string };
      };
      if (!res.ok || json.success === false) {
        throw new Error(json.error?.message || 'Utility failed');
      }
      setResult(json.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Utility failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          Utility
          <select
            className={`${inputClass} mt-1`}
            value={utility}
            onChange={(e) => setUtility(e.target.value as typeof utility)}
          >
            {UTILITIES.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm">
        Input
        <textarea
          className="mt-1 min-h-32 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 py-2 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste text or a task description…"
          required
        />
      </label>
      <Button type="submit" disabled={loading || !input.trim()}>
        {loading ? 'Running…' : 'Run utility'}
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {result ? (
        <div className="rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] p-3">
          <h3 className="text-sm font-semibold">Result</h3>
          <pre className="mt-2 whitespace-pre-wrap break-words text-sm">{result.output}</pre>
        </div>
      ) : null}
    </form>
  );
}
