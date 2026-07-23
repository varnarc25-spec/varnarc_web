'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '@varnarc/ui';
import { MediaPicker } from '@/components/media-picker';
import { RelatedArticlesPicker } from '@/components/related-articles-picker';
import { ArticleAiPanel } from '@/components/article-ai-panel';
import { ArticleContentEditor } from '@/components/article-content-editor';
import { ArticleSeoGenerator } from '@/components/article-seo-generator';
import { DateTimeLocalInput } from '@/components/datetime-local-input';

type CategoryOption = { id: string; name: string; slug: string; parentId?: string | null };

function toLocalInputValue(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function looksLikeHtml(content: string) {
  return /^\s*</.test(content) || /<(?:p|h[1-6]|ul|ol|blockquote|div|img|iframe)\b/i.test(content);
}

function apiErrorMessage(json: { error?: { message?: string; code?: string } }, fallback: string) {
  if (json.error?.code === 'DUPLICATE_SLUG') {
    return 'Slug already exists. Choose a unique slug.';
  }
  return json.error?.message || fallback;
}

function parseSponsorMeta(metadata: unknown) {
  const root = metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>) : {};
  const sponsor =
    root.sponsor && typeof root.sponsor === 'object'
      ? (root.sponsor as Record<string, unknown>)
      : {};
  return {
    sponsored: Boolean(root.sponsored),
    sponsorName: typeof sponsor.name === 'string' ? sponsor.name : '',
    sponsorUrl: typeof sponsor.url === 'string' ? sponsor.url : '',
    sponsorDisclosure:
      typeof sponsor.disclosure === 'string' ? sponsor.disclosure : 'Sponsored content',
  };
}

export function ArticleEditActions({
  articleId,
  title,
  slug,
  excerpt,
  content,
  status,
  isFeatured = false,
  categoryId = null,
  featuredImageId = null,
  featuredImageUrl = null,
  relatedIds = [],
  relatedLabels = {},
  publishedAt = null,
  seoTitle = null,
  seoDescription = null,
  seoKeywords = null,
  metadata = null,
}: {
  articleId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: string;
  isFeatured?: boolean;
  categoryId?: string | null;
  featuredImageId?: string | null;
  featuredImageUrl?: string | null;
  relatedIds?: string[];
  relatedLabels?: Record<string, string>;
  publishedAt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  metadata?: unknown;
}) {
  const sponsorDefaults = parseSponsorMeta(metadata);
  const router = useRouter();
  const [form, setForm] = useState({
    title,
    slug,
    excerpt: excerpt || '',
    content,
    isFeatured,
    categoryId: categoryId || '',
    featuredImageId: featuredImageId || '',
    featuredImageUrl: featuredImageUrl || '',
    relatedIds,
    scheduleAt: toLocalInputValue(publishedAt),
    seoTitle: seoTitle || '',
    seoDescription: seoDescription || '',
    seoKeywords: seoKeywords || '',
    sponsored: sponsorDefaults.sponsored,
    sponsorName: sponsorDefaults.sponsorName,
    sponsorUrl: sponsorDefaults.sponsorUrl,
    sponsorDisclosure: sponsorDefaults.sponsorDisclosure,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [autosaveState, setAutosaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const skipAutosave = useRef(true);
  const formRef = useRef(form);
  const metadataRef = useRef(metadata);
  formRef.current = form;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/categories/tree`, {
          cache: 'no-store',
        });
        const json = (await res.json()) as {
          data?: Array<CategoryOption & { children?: CategoryOption[] }>;
        };
        if (cancelled) return;
        const flat: CategoryOption[] = [];
        for (const root of Array.isArray(json.data) ? json.data : []) {
          flat.push({ id: root.id, name: root.name, slug: root.slug, parentId: null });
          for (const child of root.children ?? []) {
            flat.push({
              id: child.id,
              name: child.name,
              slug: child.slug,
              parentId: root.id,
            });
          }
        }
        setCategories(flat);
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const buildPayload = useCallback(() => {
    const f = formRef.current;
    const baseMeta =
      metadataRef.current && typeof metadataRef.current === 'object'
        ? (metadataRef.current as Record<string, unknown>)
        : {};
    return {
      articleId,
      title: f.title,
      slug: f.slug,
      excerpt: f.excerpt || null,
      content: f.content,
      isFeatured: f.isFeatured,
      categoryId: f.categoryId || null,
      featuredImageId: f.featuredImageId || null,
      relatedIds: f.relatedIds,
      metadata: {
        ...baseMeta,
        sponsored: f.sponsored,
        sponsor: f.sponsored
          ? {
              name: f.sponsorName || null,
              url: f.sponsorUrl || null,
              disclosure: f.sponsorDisclosure || 'Sponsored content',
            }
          : null,
      },
      seo: {
        title: f.seoTitle || null,
        description: f.seoDescription || null,
        metaKeywords: f.seoKeywords || null,
      },
    };
  }, [articleId]);

  const save = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) {
        setLoading(true);
        setMessage(null);
      } else {
        setAutosaveState('saving');
      }
      try {
        const res = await fetch('/api/admin/cms/articles/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPayload()),
        });
        const json = (await res.json()) as { error?: { message?: string; code?: string } };
        if (!res.ok) throw new Error(apiErrorMessage(json, 'Failed to save'));
        if (opts?.silent) {
          setAutosaveState('saved');
        } else {
          setMessage('Saved');
          router.refresh();
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed';
        if (opts?.silent) setAutosaveState('error');
        else setMessage(msg);
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [buildPayload, router],
  );

  useEffect(() => {
    if (skipAutosave.current) {
      skipAutosave.current = false;
      return;
    }
    const t = setTimeout(() => {
      void save({ silent: true });
    }, 2500);
    return () => clearTimeout(t);
  }, [
    form.title,
    form.slug,
    form.excerpt,
    form.content,
    form.isFeatured,
    form.categoryId,
    form.featuredImageId,
    form.relatedIds,
    form.seoTitle,
    form.seoDescription,
    form.seoKeywords,
    save,
  ]);

  async function publish() {
    setLoading(true);
    setMessage(null);
    try {
      await save({ silent: true });
      const res = await fetch('/api/admin/cms/articles/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      });
      const json = (await res.json()) as { error?: { message?: string; code?: string } };
      if (!res.ok) throw new Error(apiErrorMessage(json, 'Failed to publish'));
      setMessage('Published');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function submitReview() {
    setLoading(true);
    setMessage(null);
    try {
      await save({ silent: true });
      const res = await fetch('/api/admin/cms/articles/submit-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      });
      const json = (await res.json()) as { error?: { message?: string; code?: string } };
      if (!res.ok) throw new Error(apiErrorMessage(json, 'Failed to submit'));
      setMessage('Submitted for review');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function approveReview() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/cms/articles/approve-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Approve failed');
      setMessage('Approved — returned to draft for publishing');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function rejectReview() {
    const notes = window.prompt('Rejection notes (optional)') ?? '';
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/cms/articles/reject-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, notes: notes || null }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Reject failed');
      setMessage('Rejected — returned to draft');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function schedule() {
    if (!form.scheduleAt) {
      setMessage('Pick a schedule date/time first');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await save({ silent: true });
      const res = await fetch('/api/admin/cms/articles/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          publishedAt: new Date(form.scheduleAt).toISOString(),
        }),
      });
      const json = (await res.json()) as { error?: { message?: string; code?: string } };
      if (!res.ok) throw new Error(apiErrorMessage(json, 'Failed to schedule'));
      setMessage('Scheduled');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function duplicate() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/cms/articles/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      });
      const json = (await res.json()) as {
        data?: { id: string };
        error?: { message?: string; code?: string };
      };
      if (!res.ok) throw new Error(apiErrorMessage(json, 'Failed to duplicate'));
      if (json.data?.id) router.push(`/articles/${json.data.id}`);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function openPreview() {
    setLoading(true);
    setMessage(null);
    try {
      await save({ silent: true });
      const res = await fetch(`/api/admin/cms/articles/preview?articleId=${articleId}`);
      const json = (await res.json()) as {
        data?: { title?: string; content?: string; excerpt?: string | null };
        error?: { message?: string };
      };
      if (!res.ok) throw new Error(json.error?.message || 'Preview failed');
      const titleText = json.data?.title || form.title;
      const body = json.data?.content || form.content;
      const bodyHtml = looksLikeHtml(body)
        ? body
        : `<pre style="white-space:pre-wrap;font:inherit">${escapeHtml(body)}</pre>`;
      setPreviewHtml(
        `<article><h1>${escapeHtml(titleText)}</h1><p><em>${escapeHtml(json.data?.excerpt || '')}</em></p>${bodyHtml}</article>`,
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <ArticleAiPanel
        mode="edit"
        title={form.title}
        content={form.content}
        onApplyDraft={(draft) => {
          setForm((f) => ({
            ...f,
            title: draft.title,
            slug: draft.slug,
            excerpt: draft.excerpt || '',
            content: draft.content,
          }));
          setMessage('AI draft applied — review and save.');
        }}
        onApplyExcerpt={(excerpt) => setForm((f) => ({ ...f, excerpt }))}
        onApplyContent={(content) => setForm((f) => ({ ...f, content }))}
        onApplySummary={(summary) => setForm((f) => ({ ...f, excerpt: summary }))}
        onApplySeo={(seo) =>
          setForm((f) => ({
            ...f,
            seoTitle: seo.title || f.seoTitle,
            seoDescription: seo.description || f.seoDescription,
            seoKeywords: seo.metaKeywords || f.seoKeywords,
            excerpt: seo.description || f.excerpt,
          }))
        }
      />

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Title</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Slug</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block text-[var(--varnarc-subtle)]">Summary</span>
        <input
          className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
          value={form.excerpt}
          onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-[var(--varnarc-subtle)]">Content</span>
        <ArticleContentEditor
          value={form.content}
          onChange={(content) => setForm((f) => ({ ...f, content }))}
        />
      </label>

      <div className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
        <h3 className="mb-3 text-sm font-semibold">SEO metadata</h3>
        <ArticleSeoGenerator
          articleTitle={form.title}
          excerpt={form.excerpt}
          content={form.content}
          slug={form.slug}
          onApply={(seo) =>
            setForm((f) => ({
              ...f,
              seoTitle: seo.title,
              seoDescription: seo.description,
              seoKeywords: seo.metaKeywords,
            }))
          }
        />
        <div className="grid gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">SEO title</span>
            <input
              className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={form.seoTitle}
              onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Meta description</span>
            <textarea
              className="min-h-16 w-full rounded-md border border-[var(--varnarc-border)] px-3 py-2 text-sm"
              value={form.seoDescription}
              onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">Keywords</span>
            <input
              className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
              value={form.seoKeywords}
              onChange={(e) => setForm((f) => ({ ...f, seoKeywords: e.target.value }))}
            />
          </label>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Category / subcategory</span>
          <select
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
          >
            <option value="">None</option>
            {categories
              .filter((c) => !c.parentId)
              .map((parent) => (
                <optgroup key={parent.id} label={parent.name}>
                  <option value={parent.id}>{parent.name} (parent)</option>
                  {categories
                    .filter((c) => c.parentId === parent.id)
                    .map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                </optgroup>
              ))}
          </select>
        </label>
        <label className="flex items-center gap-2 pt-6 text-sm">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
          />
          Featured on homepage
        </label>
      </div>

      <div className="rounded-lg border border-[var(--varnarc-border)] p-4">
        <h3 className="mb-3 text-sm font-semibold">Sponsored content</h3>
        <label className="mb-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.sponsored}
            onChange={(e) => setForm((f) => ({ ...f, sponsored: e.target.checked }))}
          />
          Mark as sponsored article
        </label>
        {form.sponsored ? (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-[var(--varnarc-subtle)]">Sponsor name</span>
              <input
                className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
                value={form.sponsorName}
                onChange={(e) => setForm((f) => ({ ...f, sponsorName: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-[var(--varnarc-subtle)]">Sponsor URL</span>
              <input
                className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
                value={form.sponsorUrl}
                onChange={(e) => setForm((f) => ({ ...f, sponsorUrl: e.target.value }))}
                placeholder="https://"
              />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-[var(--varnarc-subtle)]">Disclosure text</span>
              <input
                className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
                value={form.sponsorDisclosure}
                onChange={(e) => setForm((f) => ({ ...f, sponsorDisclosure: e.target.value }))}
              />
            </label>
          </div>
        ) : null}
      </div>

      <div>
        <span className="mb-1 block text-sm text-[var(--varnarc-subtle)]">Featured image</span>
        <MediaPicker
          value={form.featuredImageId || null}
          previewUrl={form.featuredImageUrl || null}
          onChange={(id, url) =>
            setForm((f) => ({
              ...f,
              featuredImageId: id || '',
              featuredImageUrl: url || '',
            }))
          }
        />
      </div>

      <div>
        <span className="mb-1 block text-sm text-[var(--varnarc-subtle)]">Related articles</span>
        <RelatedArticlesPicker
          value={form.relatedIds}
          excludeId={articleId}
          initialLabels={relatedLabels}
          onChange={(ids) => setForm((f) => ({ ...f, relatedIds: ids }))}
        />
        {Object.keys(relatedLabels).length ? (
          <p className="mt-1 text-xs text-[var(--varnarc-subtle)]">
            Current: {Object.values(relatedLabels).join(', ')}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">Schedule publish at</span>
          <DateTimeLocalInput
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={form.scheduleAt}
            onChange={(e) => setForm((f) => ({ ...f, scheduleAt: e.target.value }))}
          />
        </label>
        <Button type="button" onClick={schedule} disabled={loading}>
          Schedule
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => save()} disabled={loading}>
          Save
        </Button>
        <Button type="button" onClick={openPreview} disabled={loading}>
          Preview
        </Button>
        {status === 'DRAFT' || status === 'REVIEW' ? (
          <Button type="button" onClick={submitReview} disabled={loading}>
            Submit review
          </Button>
        ) : null}
        {status === 'REVIEW' ? (
          <>
            <Button type="button" onClick={approveReview} disabled={loading}>
              Approve review
            </Button>
            <Button type="button" variant="secondary" onClick={rejectReview} disabled={loading}>
              Reject
            </Button>
          </>
        ) : null}
        {status !== 'PUBLISHED' ? (
          <Button type="button" onClick={publish} disabled={loading}>
            Publish
          </Button>
        ) : null}
        <Button type="button" onClick={duplicate} disabled={loading}>
          Duplicate
        </Button>
        <span className="text-sm text-[var(--varnarc-subtle)]">Status: {status}</span>
        <span className="text-sm text-[var(--varnarc-subtle)]">
          {autosaveState === 'saving'
            ? 'Autosaving…'
            : autosaveState === 'saved'
              ? 'Autosaved'
              : autosaveState === 'error'
                ? 'Autosave failed'
                : null}
        </span>
        {message ? <span className="text-sm text-[var(--varnarc-subtle)]">{message}</span> : null}
      </div>

      {previewHtml ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex justify-between">
              <h3 className="font-semibold">Preview</h3>
              <Button type="button" onClick={() => setPreviewHtml(null)}>
                Close
              </Button>
            </div>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
