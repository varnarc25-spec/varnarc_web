'use client';

import { useEffect, useState } from 'react';
import { Button } from '@varnarc/ui';

type BookmarkButtonProps = {
  entityType: string;
  entityId: string;
  label?: string;
  className?: string;
  showCollection?: boolean;
};

export function BookmarkButton({
  entityType,
  entityId,
  label = 'Bookmark',
  className,
  showCollection = false,
}: BookmarkButtonProps) {
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const [collectionName, setCollectionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const qs = new URLSearchParams({ entityType, entityId, limit: '1' });
        const res = await fetch(`/api/user/bookmarks?${qs}`);
        if (res.status === 401) {
          if (!cancelled) setAuthRequired(true);
          return;
        }
        if (!res.ok) return;
        const json = (await res.json()) as {
          data?: Array<{ id: string; collectionName?: string | null }>;
        };
        const row = json.data?.[0];
        if (!cancelled && row) {
          setBookmarkId(row.id);
          setCollectionName(row.collectionName ?? '');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entityType, entityId]);

  async function save() {
    if (authRequired) {
      window.location.href = '/auth/login';
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/user/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          collectionName: collectionName.trim() || null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
        data?: { id: string };
      };
      if (res.status === 401) {
        window.location.href = '/auth/login';
        return;
      }
      if (!res.ok) throw new Error(json.error?.message || 'Failed to bookmark');
      setBookmarkId(json.data?.id ?? 'saved');
      setMessage(bookmarkId ? 'Bookmark updated.' : 'Saved to bookmarks.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Bookmark failed');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!bookmarkId) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/user/bookmarks/${bookmarkId}`, { method: 'DELETE' });
      if (res.status === 401) {
        window.location.href = '/auth/login';
        return;
      }
      if (!res.ok) throw new Error('Failed to remove bookmark');
      setBookmarkId(null);
      setMessage('Bookmark removed.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to remove');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Button type="button" variant="secondary" disabled className={className}>
        …
      </Button>
    );
  }

  return (
    <div className={className}>
      {showCollection ? (
        <input
          className="mb-2 h-9 w-full rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] px-3 text-sm"
          placeholder="Collection (optional)"
          value={collectionName}
          onChange={(e) => setCollectionName(e.target.value)}
        />
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {bookmarkId ? (
          <>
            <Button type="button" variant="secondary" disabled={saving} onClick={() => void remove()}>
              {saving ? '…' : 'Saved'}
            </Button>
            {showCollection ? (
              <Button type="button" variant="ghost" disabled={saving} onClick={() => void save()}>
                Update collection
              </Button>
            ) : null}
          </>
        ) : (
          <Button type="button" variant="secondary" disabled={saving} onClick={() => void save()}>
            {saving ? 'Saving…' : label}
          </Button>
        )}
      </div>
      {message ? <p className="mt-1 text-xs text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}
