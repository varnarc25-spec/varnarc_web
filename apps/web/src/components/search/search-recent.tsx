'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type RecentRow = { query: string; createdAt?: string };

export function SearchRecent() {
  const [items, setItems] = useState<RecentRow[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void fetch('/api/search/recent?limit=8')
      .then(async (res) => {
        if (res.status === 401) return;
        const json = (await res.json().catch(() => ({}))) as { data?: RecentRow[] };
        if (Array.isArray(json.data)) setItems(json.data);
      })
      .finally(() => setReady(true));
  }, []);

  if (!ready || !items.length) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--varnarc-subtle)]">
        Recent searches
      </p>
      <ul className="flex flex-wrap gap-2">
        {items.map((r) => (
          <li key={`${r.query}-${r.createdAt ?? ''}`}>
            <Link
              href={`/search?q=${encodeURIComponent(r.query)}`}
              className="rounded-md border border-[var(--varnarc-border)] px-2.5 py-1 text-xs hover:bg-[var(--varnarc-muted)]"
            >
              {r.query}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
