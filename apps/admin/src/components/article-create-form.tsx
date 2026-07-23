'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';
import { ArticleAiPanel } from '@/components/article-ai-panel';
import { ArticleContentEditor } from '@/components/article-content-editor';
import { ArticleSeoGenerator } from '@/components/article-seo-generator';
import { normalizeArticleContent } from '@/lib/article-content';

export function ArticleCreateForm({
  seedTopic,
  seedVertical,
}: {
  seedTopic?: string;
  seedVertical?: 'finance' | 'construction' | 'automobile' | 'solar' | 'general';
}) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/cms/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          excerpt: excerpt || null,
          content,
          status: 'DRAFT',
          tagIds: [],
          seo: {
            title: seoTitle || null,
            description: seoDescription || null,
            metaKeywords: seoKeywords || null,
          },
        }),
      });
      const json = (await res.json()) as {
        data?: { id: string };
        error?: { message?: string };
      };
      if (!res.ok) throw new Error(json.error?.message || 'Failed to create article');
      router.push(`/articles/${json.data?.id}`);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 space-y-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <h3 className="text-sm font-semibold">Create article</h3>

      <ArticleAiPanel
        mode="create"
        title={title}
        content={content}
        seedTopic={seedTopic}
        seedVertical={seedVertical}
        onApplyDraft={(draft) => {
          setTitle(draft.title);
          setSlug(draft.slug);
          setExcerpt(draft.excerpt || '');
          setContent(normalizeArticleContent(draft.content));
        }}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Title</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSlug(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/^-|-$/g, ''),
              );
            }}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[varnarc-subtle)]">Slug</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block text-[var(--varnarc-subtle)]">Summary</span>
        <input
          className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-[var(--varnarc-subtle)]">Content</span>
        <ArticleContentEditor value={content} onChange={setContent} />
      </label>

      <div className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
        <h3 className="mb-3 text-sm font-semibold">SEO metadata</h3>
        <ArticleSeoGenerator
          articleTitle={title}
          excerpt={excerpt}
          content={content}
          slug={slug}
          onApply={(seo) => {
            setSeoTitle(seo.title);
            setSeoDescription(seo.description);
            setSeoKeywords(seo.metaKeywords);
          }}
        />
        <div className="grid gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">SEO title</span>
            <input
              className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Meta description</span>
            <textarea
              className="min-h-16 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2 text-sm"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Keywords</span>
            <input
              className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={loading || !title || !slug || !hasEditorContent(content)}>
          {loading ? 'Creating…' : 'Create draft'}
        </Button>
        {message ? <span className="text-sm text-[var(--varnarc-subtle)]">{message}</span> : null}
      </div>
    </div>
  );
}

function hasEditorContent(html: string) {
  return html.replace(/<[^>]+>/g, '').trim().length > 0;
}
