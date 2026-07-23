'use client';

import { useEffect, useState } from 'react';
import { Button } from '@varnarc/ui';

type Vertical = 'finance' | 'construction' | 'automobile' | 'solar' | 'general';

export type ArticleAiDraft = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  seo?: {
    title?: string;
    description?: string;
    metaKeywords?: string;
  } | null;
  suggestedRelatedTopics?: string[];
};

type ArticleAiPanelProps = {
  mode: 'create' | 'edit';
  title?: string;
  content?: string;
  seedTopic?: string;
  seedVertical?: Vertical;
  onApplyDraft: (draft: ArticleAiDraft) => void;
  onApplyExcerpt?: (excerpt: string) => void;
  onApplyContent?: (content: string) => void;
  onApplySeo?: (seo: { title?: string; description?: string; metaKeywords?: string }) => void;
  onApplySummary?: (summary: string) => void;
};

export function ArticleAiPanel({
  mode,
  title = '',
  content = '',
  seedTopic,
  seedVertical,
  onApplyDraft,
  onApplyExcerpt,
  onApplyContent,
  onApplySeo,
  onApplySummary,
}: ArticleAiPanelProps) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [topic, setTopic] = useState(title || '');
  const [vertical, setVertical] = useState<Vertical>('general');
  const [tone, setTone] = useState<'informative' | 'beginner-friendly' | 'expert'>('informative');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/cms/articles/ai/status');
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

  useEffect(() => {
    if (seedTopic?.trim()) {
      setTopic(seedTopic.trim());
      setMessage('Topic loaded from trending suggestions — click Generate draft when ready.');
    }
  }, [seedTopic]);

  useEffect(() => {
    if (seedVertical) setVertical(seedVertical);
  }, [seedVertical]);

  async function postAi<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as { data?: T; error?: { message?: string } };
    if (!res.ok) throw new Error(json.error?.message || 'AI request failed');
    if (!json.data) throw new Error('Empty AI response');
    return json.data;
  }

  async function generateDraft() {
    if (!topic.trim()) {
      setMessage('Enter a topic first');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const data = await postAi<ArticleAiDraft>('/api/admin/cms/articles/ai/generate-draft', {
        topic: topic.trim(),
        vertical,
        tone,
      });
      onApplyDraft(data);
      setSuggestions(data.suggestedRelatedTopics ?? []);
      setMessage('Draft generated — review and save when ready.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  }

  async function summarizeContent() {
    if (!content.trim() || content.trim().length < 20) {
      setMessage('Add more content before summarizing');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const data = await postAi<{ summary: string }>('/api/admin/ai/features/summarize', {
        text: content,
        style: 'brief',
      });
      if (onApplySummary) {
        onApplySummary(data.summary);
        setMessage('Summary applied to excerpt');
      } else if (onApplyExcerpt) {
        onApplyExcerpt(data.summary);
        setMessage('Summary applied to excerpt');
      } else {
        setMessage(data.summary);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Summarize failed');
    } finally {
      setLoading(false);
    }
  }

  async function generateSeo() {
    if (!title.trim()) {
      setMessage('Add a title first');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const data = await postAi<{
        title: string;
        description: string;
        metaKeywords?: string | null;
      }>('/api/admin/ai/features/seo', {
        title: title.trim(),
        content,
        excerpt: content.slice(0, 300),
        entityType: 'article',
      });
      if (onApplySeo) {
        onApplySeo({
          title: data.title,
          description: data.description,
          metaKeywords: data.metaKeywords ?? undefined,
        });
        setMessage('SEO metadata applied');
      } else if (onApplyExcerpt) {
        onApplyExcerpt(data.description);
        setMessage('Meta description applied to excerpt');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'SEO generation failed');
    } finally {
      setLoading(false);
    }
  }

  async function improve(mode: 'expand' | 'simplify' | 'seo' | 'excerpt') {
    if (!title.trim() || !content.trim()) {
      setMessage('Add a title and content before using improve tools');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const data = await postAi<{
        content?: string;
        excerpt?: string;
        seo?: { title?: string; description?: string };
      }>('/api/admin/cms/articles/ai/improve', {
        title: title.trim(),
        content,
        mode,
      });
      if (mode === 'excerpt' && data.excerpt && onApplyExcerpt) {
        onApplyExcerpt(data.excerpt);
        setMessage('Excerpt updated');
      } else if (data.content && onApplyContent) {
        onApplyContent(data.content);
        setMessage(mode === 'expand' ? 'Content expanded' : 'Content simplified');
      } else if (mode === 'seo' && data.seo?.description) {
        onApplyExcerpt?.(data.seo.description);
        setMessage('SEO description applied to excerpt field');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Improve failed');
    } finally {
      setLoading(false);
    }
  }

  async function suggestRelated() {
    if (!title.trim() || !content.trim()) {
      setMessage('Add a title and content first');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const data = await postAi<{ topics: string[] }>('/api/admin/cms/articles/ai/suggest-related', {
        title: title.trim(),
        content,
        limit: 5,
      });
      setSuggestions(data.topics ?? []);
      setMessage('Related topic ideas generated');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Suggestion failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-[var(--varnarc-brand)]/40 bg-[var(--varnarc-muted)]/40 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--varnarc-ink)]">AI writing assistant</h3>
        {configured === false ? (
          <span className="text-xs text-amber-700">Set OPENAI_API_KEY on the API server</span>
        ) : configured ? (
          <span className="text-xs text-emerald-700">Connected</span>
        ) : null}
      </div>

      <p className="mb-3 text-xs text-[var(--varnarc-subtle)]">
        Uses an OpenAI-compatible API from your backend. Cursor Pro powers the IDE — it does not provide
        an in-app API key for this admin panel.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Topic / brief</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. How to calculate home loan EMI in 2026"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Vertical</span>
          <select
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={vertical}
            onChange={(e) => setVertical(e.target.value as Vertical)}
          >
            <option value="finance">Finance</option>
            <option value="construction">Home & Construction</option>
            <option value="automobile">Automobile</option>
            <option value="solar">Solar & Energy</option>
            <option value="general">General</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Tone</span>
          <select
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={tone}
            onChange={(e) =>
              setTone(e.target.value as 'informative' | 'beginner-friendly' | 'expert')
            }
          >
            <option value="informative">Informative</option>
            <option value="beginner-friendly">Beginner-friendly</option>
            <option value="expert">Expert</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={generateDraft} disabled={loading || configured === false}>
          {loading ? 'Working…' : mode === 'create' ? 'Generate draft' : 'Generate from topic'}
        </Button>
        {mode === 'edit' ? (
          <>
            <Button type="button" variant="secondary" onClick={() => improve('expand')} disabled={loading}>
              Expand
            </Button>
            <Button type="button" variant="secondary" onClick={() => improve('simplify')} disabled={loading}>
              Simplify
            </Button>
            <Button type="button" variant="secondary" onClick={() => improve('excerpt')} disabled={loading}>
              Write excerpt
            </Button>
            <Button type="button" variant="secondary" onClick={summarizeContent} disabled={loading}>
              Summarize
            </Button>
            <Button type="button" variant="secondary" onClick={generateSeo} disabled={loading}>
              AI SEO
            </Button>
            <Button type="button" variant="secondary" onClick={suggestRelated} disabled={loading}>
              Suggest related
            </Button>
          </>
        ) : null}
      </div>

      {message ? <p className="mt-3 text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}

      {suggestions.length ? (
        <div className="mt-3">
          <p className="text-xs font-medium text-[var(--varnarc-subtle)]">Related article ideas</p>
          <ul className="mt-1 list-inside list-disc text-xs text-[var(--varnarc-subtle)]">
            {suggestions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
