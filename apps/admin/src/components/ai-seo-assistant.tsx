'use client';

import { useEffect, useState } from 'react';
import { Button } from '@varnarc/ui';

export type AiSeoResult = {
  title: string;
  description: string;
  metaKeywords: string | null;
  ogTitle: string;
  ogDescription: string;
  suggestions: string[];
};

export function AiSeoAssistant({
  initialTitle = '',
  initialContent = '',
  initialExcerpt = '',
  entityType = 'general',
  path = '',
  onApply,
}: {
  initialTitle?: string;
  initialContent?: string;
  initialExcerpt?: string;
  entityType?: 'article' | 'page' | 'calculator' | 'guide' | 'product' | 'review' | 'general';
  path?: string;
  onApply?: (seo: AiSeoResult) => void;
}) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [excerpt, setExcerpt] = useState(initialExcerpt);
  const [result, setResult] = useState<AiSeoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
    setExcerpt(initialExcerpt);
  }, [initialTitle, initialContent, initialExcerpt]);

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

  async function generate() {
    if (!title.trim()) {
      setMessage('Title is required');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/ai/features/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content || null,
          excerpt: excerpt || null,
          entityType,
          path: path || null,
        }),
      });
      const json = (await res.json()) as { data?: AiSeoResult; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'SEO generation failed');
      if (!json.data) throw new Error('Empty response');
      setResult(json.data);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">AI SEO assistant</h3>
        {configured === false ? (
          <span className="text-xs text-amber-700">LLM not configured</span>
        ) : configured ? (
          <span className="text-xs text-emerald-700">Ready</span>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Page title</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Excerpt / summary</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
          />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Content (optional)</span>
          <textarea
            className="min-h-24 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2 text-sm"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </label>
      </div>

      <Button type="button" onClick={generate} disabled={loading || configured === false}>
        {loading ? 'Generating…' : 'Generate SEO metadata'}
      </Button>

      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}

      {result ? (
        <div className="space-y-3 rounded-md border border-[var(--varnarc-border)] bg-white p-3 text-sm">
          <Row label="SEO title" value={result.title} />
          <Row label="Meta description" value={result.description} />
          {result.metaKeywords ? <Row label="Keywords" value={result.metaKeywords} /> : null}
          <Row label="OG title" value={result.ogTitle} />
          <Row label="OG description" value={result.ogDescription} />
          {result.suggestions.length ? (
            <div>
              <p className="text-xs font-medium text-[var(--varnarc-subtle)]">Suggestions</p>
              <ul className="mt-1 list-inside list-disc text-xs text-[var(--varnarc-subtle)]">
                {result.suggestions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {onApply ? (
            <Button type="button" variant="secondary" onClick={() => onApply(result)}>
              Apply to form
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--varnarc-subtle)]">{label}</p>
      <p className="mt-0.5">{value}</p>
    </div>
  );
}
