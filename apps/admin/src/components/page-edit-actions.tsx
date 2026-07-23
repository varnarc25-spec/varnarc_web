'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@varnarc/ui';
import { RichTextEditor } from '@/components/rich-text-editor';
import { AiSeoAssistant } from '@/components/ai-seo-assistant';
import { DateTimeLocalInput } from '@/components/datetime-local-input';

function toLocalInputValue(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function apiErrorMessage(json: { error?: { message?: string; code?: string } }, fallback: string) {
  if (json.error?.code === 'DUPLICATE_SLUG') {
    return 'Slug already exists. Choose a unique slug.';
  }
  return json.error?.message || fallback;
}

function looksLikeHtml(content: string) {
  return /^\s*</.test(content) || /<(?:p|h[1-6]|ul|ol|blockquote|div|img|iframe)\b/i.test(content);
}

export function PageEditActions({
  pageId,
  title,
  slug,
  content,
  status,
  seoTitle,
  seoDescription,
  publishedAt = null,
}: {
  pageId: string;
  title: string;
  slug: string;
  content: string | null;
  status: string;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt?: string | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    title,
    slug,
    content: content || '',
    seoTitle: seoTitle || '',
    seoDescription: seoDescription || '',
    scheduleAt: toLocalInputValue(publishedAt),
  });
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [autosaveState, setAutosaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const skipAutosave = useRef(true);
  const formRef = useRef(form);
  formRef.current = form;

  const buildPayload = useCallback(() => {
    const f = formRef.current;
    return {
      pageId,
      title: f.title,
      slug: f.slug,
      content: f.content,
      seo: {
        title: f.seoTitle || null,
        description: f.seoDescription || null,
      },
    };
  }, [pageId]);

  const save = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) {
        setLoading(true);
        setMessage(null);
      } else {
        setAutosaveState('saving');
      }
      try {
        const res = await fetch('/api/admin/cms/pages/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPayload()),
        });
        const json = (await res.json()) as { error?: { message?: string; code?: string } };
        if (!res.ok) throw new Error(apiErrorMessage(json, 'Failed to save'));
        if (opts?.silent) setAutosaveState('saved');
        else {
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
  }, [form.title, form.slug, form.content, form.seoTitle, form.seoDescription, save]);

  async function action(path: string) {
    setLoading(true);
    setMessage(null);
    try {
      await save({ silent: true });
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId }),
      });
      const json = (await res.json()) as {
        data?: { id: string };
        error?: { message?: string; code?: string };
      };
      if (!res.ok) throw new Error(apiErrorMessage(json, 'Action failed'));
      if (json.data?.id && path.includes('duplicate')) {
        router.push(`/pages/${json.data.id}`);
      }
      setMessage('Done');
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
      const res = await fetch('/api/admin/cms/pages/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
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

  async function openPreview() {
    setLoading(true);
    setMessage(null);
    try {
      await save({ silent: true });
      const res = await fetch(`/api/admin/cms/pages/preview?pageId=${pageId}`);
      const json = (await res.json()) as {
        data?: { title?: string; content?: string | null };
        error?: { message?: string };
      };
      if (!res.ok) throw new Error(json.error?.message || 'Preview failed');
      const titleText = json.data?.title || form.title;
      const body = json.data?.content || form.content;
      setPreviewHtml(
        looksLikeHtml(body || '')
          ? `<article><h1>${escapeHtml(titleText)}</h1><div class="prose prose-sm max-w-none">${body}</div></article>`
          : `<article><h1>${escapeHtml(titleText)}</h1><pre style="white-space:pre-wrap;font:inherit">${escapeHtml(body || '')}</pre></article>`,
      );
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
      const res = await fetch('/api/admin/cms/pages/reject-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, notes: notes || null }),
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

  return (
    <div className="space-y-4">
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
      <div>
        <span className="mb-1 block text-sm text-[var(--varnarc-subtle)]">Content</span>
        <RichTextEditor
          value={form.content}
          onChange={(content) => setForm((f) => ({ ...f, content }))}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">SEO title</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={form.seoTitle}
            onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--varnarc-subtle)]">SEO description</span>
          <input
            className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={form.seoDescription}
            onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
          />
        </label>
      </div>

      <AiSeoAssistant
        initialTitle={form.title}
        initialContent={form.content}
        entityType="page"
        path={`/pages/${form.slug}`}
        onApply={(seo) =>
          setForm((f) => ({
            ...f,
            seoTitle: seo.title,
            seoDescription: seo.description,
          }))
        }
      />

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
          <Button
            type="button"
            onClick={() => action('/api/admin/cms/pages/submit-review')}
            disabled={loading}
          >
            Submit review
          </Button>
        ) : null}
        {status === 'REVIEW' ? (
          <>
            <Button type="button" onClick={() => action('/api/admin/cms/pages/approve-review')} disabled={loading}>
              Approve review
            </Button>
            <Button type="button" variant="secondary" onClick={rejectReview} disabled={loading}>
              Reject
            </Button>
          </>
        ) : null}
        {status !== 'PUBLISHED' ? (
          <Button type="button" onClick={() => action('/api/admin/cms/pages/publish')} disabled={loading}>
            Publish
          </Button>
        ) : null}
        <Button type="button" onClick={() => action('/api/admin/cms/pages/duplicate')} disabled={loading}>
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
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
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
