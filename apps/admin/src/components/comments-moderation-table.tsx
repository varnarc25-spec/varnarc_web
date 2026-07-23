'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@varnarc/ui';

type CommentRow = {
  id: string;
  body: string;
  status: string;
  createdAt: string;
  user?: { displayName?: string | null; email?: string | null; username?: string | null } | null;
  article?: { title: string; slug: string } | null;
};

export function CommentsModerationTable({
  rows,
  publicWebUrl,
}: {
  rows: CommentRow[];
  publicWebUrl: string;
}) {
  const [items, setItems] = useState(rows);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((row) => row.id)));
    }
  }

  async function moderate(ids: string[], status: 'PUBLISHED' | 'ARCHIVED' | 'REVIEW') {
    if (!ids.length) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/article-comments/moderation/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || 'Moderation failed');
      setItems((prev) =>
        prev.map((row) => (ids.includes(row.id) ? { ...row, status } : row)),
      );
      setSelected(new Set());
      setMessage(`${ids.length} comment(s) updated`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={loading || selected.size === 0}
          onClick={() => void moderate([...selected], 'PUBLISHED')}
        >
          Approve selected
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={loading || selected.size === 0}
          onClick={() => void moderate([...selected], 'ARCHIVED')}
        >
          Archive selected
        </Button>
      </div>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={items.length > 0 && selected.size === items.length}
                  onChange={toggleAll}
                  aria-label="Select all"
                />
              </th>
              <th className="px-4 py-3">Article</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Comment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Posted</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No comments found.
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggle(row.id)}
                      aria-label={`Select comment ${row.id}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {row.article ? (
                      <a
                        href={`${publicWebUrl}/articles/${row.article.slug}#comments`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-[var(--varnarc-brand)] hover:underline"
                      >
                        {row.article.title}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.user?.displayName || row.user?.username || row.user?.email || '—'}
                  </td>
                  <td className="max-w-md px-4 py-3 text-slate-700">{row.body}</td>
                  <td className="px-4 py-3 capitalize">{row.status.toLowerCase()}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {row.status !== 'PUBLISHED' ? (
                        <button
                          type="button"
                          className="text-xs text-green-700 hover:underline"
                          disabled={loading}
                          onClick={() => void moderate([row.id], 'PUBLISHED')}
                        >
                          Approve
                        </button>
                      ) : null}
                      {row.status !== 'ARCHIVED' ? (
                        <button
                          type="button"
                          className="text-xs text-red-700 hover:underline"
                          disabled={loading}
                          onClick={() => void moderate([row.id], 'ARCHIVED')}
                        >
                          Archive
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Link href="/articles" className="text-sm text-[var(--varnarc-brand)] hover:underline">
        Back to articles
      </Link>
    </div>
  );
}
