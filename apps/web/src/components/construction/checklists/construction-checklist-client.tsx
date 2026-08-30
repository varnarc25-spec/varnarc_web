'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CONSTRUCTION_CHECKLIST_PROFESSIONAL_REVIEW_NOTE,
  CONSTRUCTION_CHECKLIST_QUALIFICATION,
  summarizeChecklistProgress,
  type ConstructionChecklistItem,
} from '@varnarc/validation';
import { cn } from '@/components/construction/styles';

export type ChecklistProgressMap = Record<
  string,
  { completed: boolean; notes: string; completedAt?: string | null }
>;

type ProjectOption = { id: string; name: string };

type Props = {
  slug: string;
  title: string;
  items: ConstructionChecklistItem[];
  qualification?: string;
  professionalReviewNote?: string;
};

const storageKey = (slug: string) => `varnarc.construction.checklist.${slug}`;

function loadLocal(slug: string): ChecklistProgressMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ChecklistProgressMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function ConstructionChecklistClient({
  slug,
  title,
  items,
  qualification = CONSTRUCTION_CHECKLIST_QUALIFICATION,
  professionalReviewNote = CONSTRUCTION_CHECKLIST_PROFESSIONAL_REVIEW_NOTE,
}: Props) {
  const [progress, setProgress] = useState<ChecklistProgressMap>({});
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState('');
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [authHint, setAuthHint] = useState(false);

  useEffect(() => {
    setProgress(loadLocal(slug));
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/construction/projects', { cache: 'no-store' });
        if (res.status === 401) {
          if (!cancelled) setAuthHint(true);
          return;
        }
        if (!res.ok) return;
        const json = (await res.json()) as {
          data?: ProjectOption[] | { items?: ProjectOption[] };
        };
        const list = Array.isArray(json.data)
          ? json.data
          : Array.isArray((json.data as { items?: ProjectOption[] })?.items)
            ? (json.data as { items: ProjectOption[] }).items
            : [];
        if (!cancelled) {
          setProjects(list.map((p) => ({ id: p.id, name: p.name })));
          setAuthHint(false);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistLocal = useCallback(
    (next: ChecklistProgressMap) => {
      setProgress(next);
      try {
        localStorage.setItem(storageKey(slug), JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [slug],
  );

  const summary = useMemo(() => summarizeChecklistProgress({ items, progress }), [items, progress]);

  const byCategory = useMemo(() => {
    const map = new Map<string, ConstructionChecklistItem[]>();
    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return Array.from(map.entries());
  }, [items]);

  function toggleComplete(id: string) {
    const cur = progress[id];
    const completed = !cur?.completed;
    persistLocal({
      ...progress,
      [id]: {
        completed,
        notes: cur?.notes ?? '',
        completedAt: completed ? new Date().toISOString() : null,
      },
    });
    setSaveMsg(null);
  }

  function setNotes(id: string, notes: string) {
    const cur = progress[id];
    persistLocal({
      ...progress,
      [id]: {
        completed: Boolean(cur?.completed),
        notes,
        completedAt: cur?.completedAt ?? null,
      },
    });
    setSaveMsg(null);
  }

  function onPrint() {
    window.print();
  }

  async function onSaveToProject() {
    setSaveError(null);
    setSaveMsg(null);
    if (!projectId) {
      setSaveError('Select a project to save progress.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/construction/projects/${projectId}/checklists/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checklistSlug: slug,
          items: progress,
        }),
      });
      if (res.status === 401) {
        setAuthHint(true);
        setSaveError('Log in to save checklist progress to a project.');
        return;
      }
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setSaveError(json.error?.message ?? 'Could not save progress.');
        return;
      }
      setSaveMsg('Progress saved to your project.');
    } finally {
      setSaving(false);
    }
  }

  async function loadFromProject() {
    if (!projectId) return;
    setSaveError(null);
    try {
      const res = await fetch(`/api/construction/projects/${projectId}/checklists/${slug}`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const json = (await res.json()) as {
        data?: { items?: ChecklistProgressMap };
      };
      if (json.data?.items) {
        const mapped: ChecklistProgressMap = {};
        for (const [k, v] of Object.entries(json.data.items)) {
          mapped[k] = {
            completed: Boolean(v.completed),
            notes: v.notes ?? '',
            completedAt: v.completedAt ?? null,
          };
        }
        persistLocal(mapped);
        setSaveMsg('Loaded progress from project.');
      }
    } catch {
      setSaveError('Could not load project progress.');
    }
  }

  return (
    <div className="space-y-8">
      <div className="print:hidden rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        {qualification}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-[#0b1f3a]">{summary.percentComplete}%</span> complete
          · {summary.completed}/{summary.total} items
          {summary.professionalPending > 0
            ? ` · ${summary.professionalPending} technical items still open`
            : ''}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onPrint}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            Print
          </button>
        </div>
      </div>

      <div className="print:hidden rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-sm font-bold text-[#0b1f3a]">Save to project</h2>
        <p className="mt-1 text-xs text-slate-500">
          Logged-in users can save completion and notes on a construction project. Local progress is
          kept in this browser until you save.
        </p>
        {authHint ? (
          <p className="mt-2 text-xs text-slate-600">
            <Link href="/login" className="font-semibold text-[#f97316]">
              Log in
            </Link>{' '}
            to load your projects.
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Project</span>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="min-w-[12rem] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={saving || !projectId}
            onClick={() => void onSaveToProject()}
            className="rounded-lg bg-[#0b1f3a] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save to project'}
          </button>
          <button
            type="button"
            disabled={!projectId}
            onClick={() => void loadFromProject()}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
          >
            Load from project
          </button>
        </div>
        {saveMsg ? <p className="mt-2 text-xs text-emerald-700">{saveMsg}</p> : null}
        {saveError ? <p className="mt-2 text-xs text-red-600">{saveError}</p> : null}
      </div>

      <div className="hidden print:block">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="mt-2 text-xs">{qualification}</p>
        <p className="mt-1 text-xs">
          Progress: {summary.completed}/{summary.total} ({summary.percentComplete}%)
        </p>
      </div>

      {byCategory.map(([category, catItems]) => (
        <section key={category} className="break-inside-avoid">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#0b1f3a]">
            {category}
          </h2>
          <ul className="mt-3 space-y-3">
            {catItems.map((item) => {
              const state = progress[item.id];
              const done = Boolean(state?.completed);
              return (
                <li
                  key={item.id}
                  className={cn(
                    'rounded-lg border bg-white px-4 py-3 shadow-sm',
                    done ? 'border-emerald-200' : 'border-slate-200',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <label className="mt-0.5 flex shrink-0 items-center gap-2 print:hidden">
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => toggleComplete(item.id)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <span className="sr-only">Mark complete</span>
                    </label>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'text-sm font-semibold text-[#0b1f3a]',
                          done && 'line-through opacity-70',
                        )}
                      >
                        {item.title}
                      </p>
                      {item.description ? (
                        <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-400">
                        <span>{item.phase}</span>
                        {item.professionalReviewRequired ? (
                          <span className="rounded bg-[#0b1f3a]/10 px-1.5 py-0.5 font-semibold text-[#0b1f3a]">
                            Professional review may be required
                          </span>
                        ) : null}
                      </div>
                      {item.professionalReviewRequired ? (
                        <p className="mt-2 text-xs text-slate-500">{professionalReviewNote}</p>
                      ) : null}
                      <label className="mt-3 block print:hidden">
                        <span className="text-xs font-medium text-slate-500">Notes</span>
                        <textarea
                          value={state?.notes ?? ''}
                          onChange={(e) => setNotes(item.id, e.target.value)}
                          rows={2}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          placeholder="Optional notes…"
                        />
                      </label>
                      {state?.notes ? (
                        <p className="mt-2 hidden text-xs text-slate-600 print:block">
                          Notes: {state.notes}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <p className="text-xs leading-relaxed text-slate-500">{qualification}</p>
    </div>
  );
}
