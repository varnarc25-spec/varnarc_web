'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@varnarc/ui';

export type ReadingHistoryItem = {
  id: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  title: string;
  href: string | null;
  subtitle?: string | null;
  metadata?: unknown;
};

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'article', label: 'Articles' },
  { value: 'page', label: 'Pages' },
  { value: 'calculator', label: 'Calculators' },
  { value: 'review', label: 'Reviews' },
  { value: 'comparison', label: 'Comparisons' },
  { value: 'ai_tool', label: 'AI tools' },
  { value: 'directory', label: 'Directory' },
  { value: 'finance_guide', label: 'Finance guides' },
];

export function ReadingHistoryList({
  initialItems,
  initialEntityType = '',
}: {
  initialItems: ReadingHistoryItem[];
  initialEntityType?: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [entityType, setEntityType] = useState(initialEntityType);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  async function loadFilter(nextType: string) {
    setEntityType(nextType);
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: '50' });
      if (nextType) qs.set('entityType', nextType);
      const res = await fetch(`/api/user/reading-history?${qs.toString()}`);
      if (!res.ok) return;
      const json = (await res.json()) as { data?: ReadingHistoryItem[] };
      setItems(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    setRemoving(id);
    try {
      const res = await fetch(`/api/user/reading-history/${id}`, { method: 'DELETE' });
      if (!res.ok) return;
      setItems((prev) => prev.filter((row) => row.id !== id));
    } finally {
      setRemoving(null);
    }
  }

  async function clearAll() {
    if (!window.confirm('Clear your entire reading history?')) return;
    setClearing(true);
    try {
      const res = await fetch('/api/user/reading-history', { method: 'DELETE' });
      if (!res.ok) return;
      setItems([]);
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.value || 'all'}
              type="button"
              onClick={() => void loadFilter(filter.value)}
              disabled={loading}
              className={`rounded-full px-3 py-1 text-sm ${
                entityType === filter.value
                  ? 'bg-[#0b1f3a] text-white'
                  : 'bg-[var(--varnarc-muted)] text-[var(--varnarc-ink)] hover:bg-[var(--varnarc-border)]'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        {items.length ? (
          <Button type="button" variant="ghost" disabled={clearing} onClick={() => void clearAll()}>
            {clearing ? 'Clearing…' : 'Clear all'}
          </Button>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-[var(--varnarc-subtle)]">Loading…</p>
      ) : items.length ? (
        <ul className="divide-y divide-[var(--varnarc-border)] rounded-lg border border-[var(--varnarc-border)]">
          {items.map((row) => (
            <li key={row.id} className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                {row.href ? (
                  <Link
                    href={row.href}
                    className="font-medium text-[var(--varnarc-ink)] hover:text-[#f97316]"
                  >
                    {row.title}
                  </Link>
                ) : (
                  <p className="font-medium text-[var(--varnarc-ink)]">{row.title}</p>
                )}
                <p className="mt-0.5 text-sm text-[var(--varnarc-subtle)]">{row.subtitle || row.entityType}</p>
                <time className="mt-1 block text-xs text-[var(--varnarc-subtle)]">
                  Last read {new Date(row.createdAt).toLocaleString()}
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
      ) : (
        <p className="text-sm text-[var(--varnarc-subtle)]">No reading history for this filter.</p>
      )}
    </div>
  );
}
