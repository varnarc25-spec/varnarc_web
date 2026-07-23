'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@varnarc/ui';

export type BookmarkItem = {
  id: string;
  entityType: string;
  entityId: string;
  collectionName?: string | null;
  createdAt: string;
  title: string;
  href: string | null;
  subtitle?: string | null;
};

export function BookmarksList({ initialItems }: { initialItems: BookmarkItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [removing, setRemoving] = useState<string | null>(null);
  const [collectionFilter, setCollectionFilter] = useState<string>('all');

  const collections = useMemo(() => {
    const names = new Set<string>();
    for (const row of items) {
      if (row.collectionName) names.add(row.collectionName);
    }
    return Array.from(names).sort();
  }, [items]);

  const filtered =
    collectionFilter === 'all'
      ? items
      : collectionFilter === 'uncategorized'
        ? items.filter((row) => !row.collectionName)
        : items.filter((row) => row.collectionName === collectionFilter);

  async function remove(id: string) {
    setRemoving(id);
    try {
      const res = await fetch(`/api/user/bookmarks/${id}`, { method: 'DELETE' });
      if (!res.ok) return;
      setItems((prev) => prev.filter((row) => row.id !== id));
    } finally {
      setRemoving(null);
    }
  }

  if (!items.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {collections.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCollectionFilter('all')}
            className={`rounded-full px-3 py-1 text-sm ${collectionFilter === 'all' ? 'bg-[#f97316] text-white' : 'border border-[var(--varnarc-border)]'}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setCollectionFilter('uncategorized')}
            className={`rounded-full px-3 py-1 text-sm ${collectionFilter === 'uncategorized' ? 'bg-[#f97316] text-white' : 'border border-[var(--varnarc-border)]'}`}
          >
            Uncategorized
          </button>
          {collections.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setCollectionFilter(name)}
              className={`rounded-full px-3 py-1 text-sm ${collectionFilter === name ? 'bg-[#f97316] text-white' : 'border border-[var(--varnarc-border)]'}`}
            >
              {name}
            </button>
          ))}
        </div>
      ) : null}
    <ul className="divide-y divide-[var(--varnarc-border)] rounded-lg border border-[var(--varnarc-border)]">
      {filtered.map((row) => (
        <li key={row.id} className="flex items-start justify-between gap-4 p-4">
          <div className="min-w-0">
            {row.href ? (
              <Link href={row.href} className="font-medium text-[var(--varnarc-ink)] hover:text-[#f97316]">
                {row.title}
              </Link>
            ) : (
              <p className="font-medium text-[var(--varnarc-ink)]">{row.title}</p>
            )}
            <p className="mt-0.5 text-sm text-[var(--varnarc-subtle)]">
              {row.subtitle || row.entityType}
              {row.collectionName ? ` · ${row.collectionName}` : ''}
            </p>
            <time className="mt-1 block text-xs text-[var(--varnarc-subtle)]">
              {new Date(row.createdAt).toLocaleDateString()}
            </time>
          </div>
          <Button
            type="button"
            variant="ghost"
            disabled={removing === row.id}
            onClick={() => void remove(row.id)}
          >
            Remove
          </Button>
        </li>
      ))}
    </ul>
    </div>
  );
}
