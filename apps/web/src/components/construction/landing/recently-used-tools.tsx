'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ConstructionSection } from '@/components/construction/construction-section';
import { cn, cx } from '@/components/construction/styles';
import {
  clearRecentConstructionTools,
  fetchServerRecentConstructionTools,
  listLocalRecentConstructionTools,
  removeRecentConstructionTool,
  type RecentConstructionToolItem,
} from '@/lib/construction/recent-tools';

function formatUsedAt(ts: number): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleDateString();
  }
}

/**
 * Recently used construction tools.
 * Guests: localStorage only. Signed-in: UserActivity, with local as instant cache.
 */
export function ConstructionRecentlyUsedTools() {
  const [items, setItems] = useState<RecentConstructionToolItem[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const hydrate = useCallback(async () => {
    const local = listLocalRecentConstructionTools();
    setItems(local);

    const server = await fetchServerRecentConstructionTools();
    if (server === null) {
      setAuthenticated(false);
      setReady(true);
      return;
    }
    setAuthenticated(true);
    // Prefer server order for signed-in; keep local-only newer entries merged ahead.
    const bySlug = new Map<string, RecentConstructionToolItem>();
    for (const row of server) bySlug.set(row.calculatorSlug, row);
    for (const row of local) {
      const existing = bySlug.get(row.calculatorSlug);
      if (!existing || row.usedAt > existing.usedAt) {
        bySlug.set(row.calculatorSlug, { ...row, activityId: existing?.activityId });
      }
    }
    const merged = [...bySlug.values()].sort((a, b) => b.usedAt - a.usedAt).slice(0, 8);
    setItems(merged);
    setReady(true);
  }, []);

  useEffect(() => {
    void hydrate();
    const onChange = () => {
      void hydrate();
    };
    window.addEventListener('varnarc:construction-recent-tools', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('varnarc:construction-recent-tools', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, [hydrate]);

  async function onRemove(item: RecentConstructionToolItem) {
    setBusy(true);
    try {
      await removeRecentConstructionTool(item);
      await hydrate();
    } finally {
      setBusy(false);
    }
  }

  async function onClear() {
    const msg = authenticated
      ? 'Clear recently used construction tools from your account and this browser?'
      : 'Clear recently used construction tools stored in this browser?';
    if (!window.confirm(msg)) return;
    setBusy(true);
    try {
      await clearRecentConstructionTools(authenticated);
      setItems([]);
    } finally {
      setBusy(false);
    }
  }

  if (!ready || !items.length) return null;

  return (
    <ConstructionSection
      id="recently-used-tools"
      title="Recently used"
      description={
        authenticated
          ? 'Pick up tools you used recently. Synced to your account.'
          : 'Stored only in this browser — we do not track logged-out visitors on the server.'
      }
      action={{
        href: '/construction/saved-calculations',
        label: 'Saved calculations →',
      }}
    >
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.calculatorSlug} className={cn(cx.card, 'flex h-full flex-col p-4')}>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-[#0b1f3a]">{item.label}</h3>
              <p className="mt-1 text-xs text-slate-500">Last used {formatUsedAt(item.usedAt)}</p>
              {item.resultSummary ? (
                <p className="mt-2 text-sm text-slate-700">{item.resultSummary}</p>
              ) : (
                <p className="mt-2 text-xs text-slate-500">Continue where you left off</p>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={item.href} className={cx.primaryBtn}>
                Continue
              </Link>
              <button
                type="button"
                className={cx.secondaryBtn}
                disabled={busy}
                onClick={() => void onRemove(item)}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <button
          type="button"
          className="text-xs font-semibold text-slate-500 underline-offset-2 hover:text-[#0b1f3a] hover:underline"
          disabled={busy}
          onClick={() => void onClear()}
        >
          Clear recent activity
        </button>
      </div>
    </ConstructionSection>
  );
}
