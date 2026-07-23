'use client';

import { useEffect, useState } from 'react';
import { Button } from '@varnarc/ui';
import { generateLocalSeo } from '@/lib/local-seo';

export type ArticleSeoFields = {
  title: string;
  description: string;
  metaKeywords: string;
};

export function ArticleSeoGenerator({
  articleTitle,
  excerpt,
  content,
  slug,
  onApply,
}: {
  articleTitle: string;
  excerpt: string;
  content: string;
  slug?: string;
  onApply: (seo: ArticleSeoFields) => void;
}) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<ArticleSeoFields | null>(null);

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
    if (!articleTitle.trim()) {
      setMessage('Add an article title first.');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      if (configured) {
        const res = await fetch('/api/admin/ai/features/seo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: articleTitle.trim(),
            content: content || null,
            excerpt: excerpt || null,
            entityType: 'article',
            path: slug ? `/articles/${slug}` : null,
          }),
        });
        const json = (await res.json()) as {
          data?: { title: string; description: string; metaKeywords?: string | null };
          error?: { message?: string };
        };
        if (!res.ok) throw new Error(json.error?.message || 'SEO generation failed');
        if (!json.data) throw new Error('Empty response');
        setPreview({
          title: json.data.title,
          description: json.data.description,
          metaKeywords: json.data.metaKeywords || '',
        });
        setMessage('SEO suggestions ready — review and apply.');
      } else {
        const local = generateLocalSeo({ title: articleTitle, excerpt, content });
        setPreview(local);
        setMessage('Generated using smart defaults (AI not configured).');
      }
    } catch (err) {
      const local = generateLocalSeo({ title: articleTitle, excerpt, content });
      setPreview(local);
      setMessage(
        err instanceof Error
          ? `${err.message} — showing smart defaults instead.`
          : 'Showing smart defaults instead.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-4 rounded-md border border-dashed border-[var(--varnarc-brand)]/40 bg-[var(--varnarc-muted)]/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-[var(--varnarc-ink)]">Auto-generate SEO</p>
          <p className="text-xs text-[var(--varnarc-subtle)]">
            Creates SEO title, meta description, and keywords from your article title and content.
          </p>
        </div>
        <Button type="button" size="sm" onClick={generate} disabled={loading}>
          {loading ? 'Generating…' : 'Generate SEO'}
        </Button>
      </div>

      {message ? <p className="mt-2 text-xs text-[var(--varnarc-subtle)]">{message}</p> : null}

      {preview ? (
        <div className="mt-3 space-y-2 rounded-md border border-[var(--varnarc-border)] bg-white p-3 text-sm">
          <PreviewRow label="SEO title" value={preview.title} />
          <PreviewRow label="Meta description" value={preview.description} />
          <PreviewRow label="Keywords" value={preview.metaKeywords} />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              onApply(preview);
              setMessage('SEO fields updated — save the article to keep them.');
            }}
          >
            Apply to fields below
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--varnarc-subtle)]">{label}</p>
      <p className="mt-0.5 text-[var(--varnarc-ink)]">{value}</p>
    </div>
  );
}
