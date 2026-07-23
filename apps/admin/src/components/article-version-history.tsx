'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@varnarc/ui';

export type ArticleVersionRow = {
  id: string;
  version: number;
  title: string;
  createdAt: string;
};

type VersionDetail = ArticleVersionRow & {
  content: string;
};

function looksLikeHtml(content: string) {
  return /^\s*</.test(content) || /<(?:p|h[1-6]|ul|ol|blockquote|div|img|iframe)\b/i.test(content);
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function diffLines(before: string, after: string) {
  const left = before.split('\n');
  const right = after.split('\n');
  const max = Math.max(left.length, right.length);
  const rows: Array<{ type: 'same' | 'removed' | 'added'; text: string }> = [];

  for (let i = 0; i < max; i += 1) {
    const a = left[i];
    const b = right[i];
    if (a === b) {
      if (a) rows.push({ type: 'same', text: a });
    } else {
      if (a) rows.push({ type: 'removed', text: a });
      if (b) rows.push({ type: 'added', text: b });
    }
  }
  return rows;
}

export function ArticleVersionHistory({
  articleId,
  versions,
  currentTitle,
  currentContent,
}: {
  articleId: string;
  versions: ArticleVersionRow[];
  currentTitle: string;
  currentContent: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');
  const [detail, setDetail] = useState<VersionDetail | null>(null);
  const [compareData, setCompareData] = useState<{
    left: VersionDetail;
    right: VersionDetail;
  } | null>(null);

  const options = useMemo(
    () => [
      { id: 'current', label: 'Current draft', version: 0 },
      ...versions.map((v) => ({ id: v.id, label: `v${v.version} — ${v.title}`, version: v.version })),
    ],
    [versions],
  );

  const fetchVersion = useCallback(
    async (versionId: string): Promise<VersionDetail> => {
      if (versionId === 'current') {
        return {
          id: 'current',
          version: 0,
          title: currentTitle,
          content: currentContent,
          createdAt: new Date().toISOString(),
        };
      }
      const res = await fetch(
        `/api/admin/cms/articles/versions/detail?articleId=${articleId}&versionId=${versionId}`,
      );
      const json = (await res.json()) as { data?: VersionDetail; error?: { message?: string } };
      if (!res.ok || !json.data) {
        throw new Error(json.error?.message || 'Failed to load version');
      }
      return json.data;
    },
    [articleId, currentContent, currentTitle],
  );

  async function viewVersion(versionId: string) {
    setLoading(true);
    setMessage(null);
    try {
      setDetail(await fetchVersion(versionId));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function runCompare() {
    if (!compareA || !compareB || compareA === compareB) {
      setMessage('Pick two different versions to compare');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const [left, right] = await Promise.all([fetchVersion(compareA), fetchVersion(compareB)]);
      setCompareData({ left, right });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function restore(versionId: string) {
    if (!window.confirm('Restore this version into the current draft? Unsaved changes will be replaced.')) {
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/cms/articles/versions/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, versionId }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Restore failed');
      setMessage('Version restored');
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  const titleDiff = compareData ? diffLines(compareData.left.title, compareData.right.title) : [];
  const contentDiff = compareData
    ? diffLines(
        looksLikeHtml(compareData.left.content)
          ? stripHtml(compareData.left.content)
          : compareData.left.content,
        looksLikeHtml(compareData.right.content)
          ? stripHtml(compareData.right.content)
          : compareData.right.content,
      )
    : [];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Revision history</h2>
        {message ? <span className="text-sm text-[var(--varnarc-subtle)]">{message}</span> : null}
      </div>

      <div className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
        <h3 className="mb-2 text-sm font-semibold">Compare versions</h3>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">From</span>
            <select
              className="h-10 min-w-[12rem] rounded-md border border-[var(--varnarc-border)] px-3"
              value={compareA}
              onChange={(e) => setCompareA(e.target.value)}
            >
              <option value="">Select…</option>
              {options.map((opt) => (
                <option key={`a-${opt.id}`} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[var(--varnarc-subtle)]">To</span>
            <select
              className="h-10 min-w-[12rem] rounded-md border border-[var(--varnarc-border)] px-3"
              value={compareB}
              onChange={(e) => setCompareB(e.target.value)}
            >
              <option value="">Select…</option>
              {options.map((opt) => (
                <option key={`b-${opt.id}`} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" onClick={runCompare} disabled={loading}>
            Compare
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
            <tr>
              <th className="px-4 py-3 font-medium">Version</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {versions.map((v) => (
              <tr key={v.id} className="border-b border-[var(--varnarc-border)]">
                <td className="px-4 py-3">v{v.version}</td>
                <td className="px-4 py-3">{v.title}</td>
                <td className="px-4 py-3 text-[var(--varnarc-subtle)]">
                  {new Date(v.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="text-[var(--varnarc-brand)] hover:underline"
                      onClick={() => viewVersion(v.id)}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="text-[var(--varnarc-brand)] hover:underline"
                      onClick={() => restore(v.id)}
                      disabled={loading}
                    >
                      Restore
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!versions.length ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                  No revisions yet. Publish to create the first version snapshot.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {detail ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">
                  {detail.version ? `Version v${detail.version}` : 'Current draft'}
                </h3>
                <p className="text-sm text-[var(--varnarc-subtle)]">{detail.title}</p>
              </div>
              <Button type="button" onClick={() => setDetail(null)}>
                Close
              </Button>
            </div>
            {looksLikeHtml(detail.content) ? (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: detail.content }}
              />
            ) : (
              <pre className="whitespace-pre-wrap text-sm">{detail.content}</pre>
            )}
          </div>
        </div>
      ) : null}

      {compareData ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-5xl overflow-auto rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">
                Compare v{compareData.left.version || 'draft'} → v{compareData.right.version || 'draft'}
              </h3>
              <Button type="button" onClick={() => setCompareData(null)}>
                Close
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="mb-2 text-sm font-medium">Title</h4>
                <DiffBlock rows={titleDiff} />
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium">Content</h4>
                <DiffBlock rows={contentDiff} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function DiffBlock({ rows }: { rows: Array<{ type: 'same' | 'removed' | 'added'; text: string }> }) {
  if (!rows.length) {
    return <p className="text-sm text-[var(--varnarc-subtle)]">No differences.</p>;
  }
  return (
    <div className="max-h-80 overflow-auto rounded border border-[var(--varnarc-border)] p-3 font-mono text-xs">
      {rows.map((row, index) => (
        <div
          key={`${row.type}-${index}`}
          className={
            row.type === 'removed'
              ? 'bg-red-50 text-red-800'
              : row.type === 'added'
                ? 'bg-green-50 text-green-800'
                : 'text-[var(--varnarc-subtle)]'
          }
        >
          {row.type === 'removed' ? '- ' : row.type === 'added' ? '+ ' : '  '}
          {row.text}
        </div>
      ))}
    </div>
  );
}
