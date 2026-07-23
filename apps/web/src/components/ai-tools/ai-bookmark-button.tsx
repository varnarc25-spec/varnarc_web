'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';

type Bookmark = { id: string; toolId: string; collectionName?: string | null };

const inputClass =
  'h-9 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm';

export function AiBookmarkButton({
  toolId,
  initialBookmarkId,
  initialCollection,
  collections = [],
}: {
  toolId: string;
  initialBookmarkId?: string | null;
  initialCollection?: string | null;
  collections?: string[];
}) {
  const [bookmarkId, setBookmarkId] = useState<string | null>(initialBookmarkId ?? null);
  const [collectionName, setCollectionName] = useState(initialCollection ?? '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/ai-tools/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId,
          collectionName: collectionName.trim() || null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
        data?: Bookmark;
      };
      if (res.status === 401) {
        setMessage(json.error?.message || 'Sign in to bookmark tools.');
        return;
      }
      if (!res.ok) throw new Error(json.error?.message || 'Failed to bookmark');
      setBookmarkId(json.data?.id ?? 'saved');
      setMessage(collectionName ? `Saved to “${collectionName}”.` : 'Bookmarked.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Bookmark failed');
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!bookmarkId) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/ai-tools/bookmarks/${bookmarkId}`, { method: 'DELETE' });
      const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      if (res.status === 401) {
        setMessage(json.error?.message || 'Sign in to manage bookmarks.');
        return;
      }
      if (!res.ok) throw new Error(json.error?.message || 'Failed to remove bookmark');
      setBookmarkId(null);
      setMessage('Bookmark removed.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Bookmark failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <h3 className="font-semibold">Bookmark</h3>
      <input
        className={inputClass}
        list="ai-bookmark-collections"
        placeholder="Collection name (optional)"
        value={collectionName}
        onChange={(e) => setCollectionName(e.target.value)}
      />
      <datalist id="ai-bookmark-collections">
        {collections.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={loading} onClick={() => void save()}>
          {loading ? 'Saving…' : bookmarkId ? 'Update bookmark' : 'Bookmark'}
        </Button>
        {bookmarkId ? (
          <Button type="button" variant="secondary" disabled={loading} onClick={() => void remove()}>
            Remove
          </Button>
        ) : null}
      </div>
      {message ? <p className="text-xs text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}
