'use client';

/**
 * Privacy-conscious recently-used construction tools.
 * Guests: localStorage only (no server tracking).
 * Signed-in: also mirrored to UserActivity via BFF.
 */

import {
  RECENT_CONSTRUCTION_TOOLS_LIMIT,
  RECENT_CONSTRUCTION_TOOLS_STORAGE_KEY,
  buildConstructionToolResultSummary,
  constructionToolHref,
  constructionToolLabel,
  type RecentConstructionToolItem,
} from '@varnarc/validation';

export type { RecentConstructionToolItem };

type StoredDraft = {
  items: RecentConstructionToolItem[];
  savedAt: number;
};

function readLocal(): RecentConstructionToolItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_CONSTRUCTION_TOOLS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredDraft;
    if (!Array.isArray(parsed.items)) return [];
    return parsed.items
      .filter(
        (item) =>
          item &&
          typeof item.calculatorSlug === 'string' &&
          typeof item.href === 'string' &&
          typeof item.usedAt === 'number',
      )
      .slice(0, RECENT_CONSTRUCTION_TOOLS_LIMIT);
  } catch {
    return [];
  }
}

function writeLocal(items: RecentConstructionToolItem[]) {
  if (typeof window === 'undefined') return;
  try {
    const draft: StoredDraft = {
      items: items.slice(0, RECENT_CONSTRUCTION_TOOLS_LIMIT),
      savedAt: Date.now(),
    };
    localStorage.setItem(RECENT_CONSTRUCTION_TOOLS_STORAGE_KEY, JSON.stringify(draft));
    window.dispatchEvent(new CustomEvent('varnarc:construction-recent-tools'));
  } catch {
    /* quota / private mode */
  }
}

export function listLocalRecentConstructionTools(): RecentConstructionToolItem[] {
  return readLocal();
}

export function upsertLocalRecentConstructionTool(
  item: Omit<RecentConstructionToolItem, 'usedAt' | 'activityId'> & { usedAt?: number },
): RecentConstructionToolItem[] {
  const nextItem: RecentConstructionToolItem = {
    calculatorSlug: item.calculatorSlug,
    label: item.label,
    href: item.href,
    resultSummary: item.resultSummary ?? null,
    usedAt: item.usedAt ?? Date.now(),
  };
  const prev = readLocal().filter((r) => r.calculatorSlug !== nextItem.calculatorSlug);
  const items = [nextItem, ...prev].slice(0, RECENT_CONSTRUCTION_TOOLS_LIMIT);
  writeLocal(items);
  return items;
}

export function removeLocalRecentConstructionTool(calculatorSlug: string) {
  writeLocal(readLocal().filter((r) => r.calculatorSlug !== calculatorSlug));
}

export function clearLocalRecentConstructionTools() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(RECENT_CONSTRUCTION_TOOLS_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('varnarc:construction-recent-tools'));
  } catch {
    /* ignore */
  }
}

/** Record a tool use: always local; optionally sync to UserActivity when authenticated. */
export function recordRecentConstructionToolUse(input: {
  calculatorSlug: string;
  sourcePath?: string | null;
  outputs?: unknown;
  unitSummary?: unknown;
  label?: string;
}) {
  const label = input.label ?? constructionToolLabel(input.calculatorSlug);
  const href = constructionToolHref(input.calculatorSlug, input.sourcePath);
  const resultSummary = buildConstructionToolResultSummary({
    outputs: input.outputs,
    unitSummary: input.unitSummary,
  });

  upsertLocalRecentConstructionTool({
    calculatorSlug: input.calculatorSlug,
    label,
    href,
    resultSummary,
  });

  if (typeof window === 'undefined') return;

  void fetch('/api/user/construction-tools/recent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      calculatorSlug: input.calculatorSlug,
      label,
      href,
      resultSummary,
    }),
  }).catch(() => {
    /* guest / offline — local already saved; no server tracking required */
  });
}

export async function fetchServerRecentConstructionTools(): Promise<
  RecentConstructionToolItem[] | null
> {
  try {
    const res = await fetch(
      `/api/user/construction-tools/recent?limit=${RECENT_CONSTRUCTION_TOOLS_LIMIT}`,
      { cache: 'no-store' },
    );
    if (res.status === 401) return null;
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: {
        items?: Array<{
          id: string;
          calculatorSlug: string;
          label: string;
          href: string;
          resultSummary: string | null;
          usedAt: string;
        }>;
      };
    };
    const items = json.data?.items;
    if (!Array.isArray(items)) return [];
    return items.map((row) => ({
      calculatorSlug: row.calculatorSlug,
      label: row.label,
      href: row.href,
      resultSummary: row.resultSummary,
      usedAt: new Date(row.usedAt).getTime(),
      activityId: row.id,
    }));
  } catch {
    return null;
  }
}

export async function removeRecentConstructionTool(item: RecentConstructionToolItem) {
  removeLocalRecentConstructionTool(item.calculatorSlug);
  if (item.activityId) {
    await fetch(`/api/user/construction-tools/recent/${item.activityId}`, {
      method: 'DELETE',
    }).catch(() => undefined);
  } else {
    // Signed-in list may not have hydrated activityId yet — clear by re-fetch after local remove.
    await fetch(`/api/user/construction-tools/recent?limit=${RECENT_CONSTRUCTION_TOOLS_LIMIT}`, {
      cache: 'no-store',
    })
      .then(async (res) => {
        if (!res.ok) return;
        const json = (await res.json()) as {
          data?: { items?: Array<{ id: string; calculatorSlug: string }> };
        };
        const match = json.data?.items?.find((r) => r.calculatorSlug === item.calculatorSlug);
        if (match?.id) {
          await fetch(`/api/user/construction-tools/recent/${match.id}`, {
            method: 'DELETE',
          });
        }
      })
      .catch(() => undefined);
  }
}

export async function clearRecentConstructionTools(authenticated: boolean) {
  clearLocalRecentConstructionTools();
  if (authenticated) {
    await fetch('/api/user/construction-tools/recent', { method: 'DELETE' }).catch(() => undefined);
  }
}
