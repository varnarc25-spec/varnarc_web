'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  isRecalculateSupported,
  readSavedMethodologyLabel,
  readSavedResult,
  readSavedSourcePath,
  type RecalculateConstructionSavedResult,
} from '@varnarc/validation';
import { cn, cx } from '@/components/construction/styles';

export type SavedConstructionCalcRow = {
  id: string;
  name: string | null;
  calculatorSlug: string;
  methodologyKey: string;
  methodologyVersion: number;
  inputs: unknown;
  assumptions: unknown;
  outputs: unknown;
  currency: string;
  createdAt: string;
  updatedAt: string;
  projectId?: string | null;
  project?: { id: string; name: string } | null;
};

type ProjectOption = { id: string; name: string };

export function SavedConstructionCalculationsList({
  initial,
  projects,
}: {
  initial: SavedConstructionCalcRow[];
  projects: ProjectOption[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [recalcById, setRecalcById] = useState<Record<string, RecalculateConstructionSavedResult>>(
    {},
  );

  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [rows],
  );

  async function rename(id: string, current: string | null) {
    const next = window.prompt('Rename saved calculation', current ?? '');
    if (next == null || !next.trim()) return;
    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/construction/calculations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: next.trim() }),
      });
      if (!res.ok) throw new Error('Rename failed');
      const json = (await res.json()) as { data?: SavedConstructionCalcRow };
      if (json.data) {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...json.data! } : r)));
      }
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Rename failed');
    } finally {
      setBusyId(null);
    }
  }

  async function duplicate(id: string) {
    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/construction/calculations/${id}/duplicate`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Duplicate failed');
      const json = (await res.json()) as { data?: SavedConstructionCalcRow };
      if (json.data) setRows((prev) => [json.data!, ...prev]);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Duplicate failed');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this saved calculation?')) return;
    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/construction/calculations/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      setRows((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  }

  async function attachProject(id: string, projectId: string) {
    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/construction/calculations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: projectId || null }),
      });
      if (!res.ok) throw new Error('Could not attach to project');
      const json = (await res.json()) as { data?: SavedConstructionCalcRow };
      if (json.data) {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...json.data! } : r)));
      }
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Attach failed');
    } finally {
      setBusyId(null);
    }
  }

  async function recalculate(id: string) {
    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/construction/calculations/${id}/recalculate`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Recalculate failed');
      const json = (await res.json()) as {
        data?: { comparison: RecalculateConstructionSavedResult };
      };
      if (json.data?.comparison) {
        setRecalcById((prev) => ({ ...prev, [id]: json.data!.comparison }));
        setExpandedId(id);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Recalculate failed');
    } finally {
      setBusyId(null);
    }
  }

  if (!sorted.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
        <p className="font-semibold text-[#0b1f3a]">No saved construction calculations</p>
        <p className="mt-2 text-sm text-slate-600">
          Run a construction calculator and click Save. If you are signed out, you will be asked to
          log in — your inputs are preserved.
        </p>
        <Link href="/construction" className={cn(cx.primaryBtn, 'mt-4 inline-flex')}>
          Browse calculators
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message ? <p className="text-sm text-rose-600">{message}</p> : null}
      <ul className="space-y-4">
        {sorted.map((row) => {
          const label = readSavedMethodologyLabel(row);
          const sourcePath = readSavedSourcePath(row);
          const original = readSavedResult(row);
          const comparison = recalcById[row.id];
          const canRecalc = isRecalculateSupported(row.calculatorSlug);
          const open = expandedId === row.id;

          return (
            <li key={row.id} className={cn(cx.card, 'p-4 sm:p-5')}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {row.calculatorSlug}
                  </p>
                  <h2 className="mt-1 text-base font-extrabold text-[#0b1f3a]">
                    {row.name ?? 'Untitled save'}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Saved {new Date(row.createdAt).toLocaleString('en-IN')}
                    {label ? ` · Methodology ${label}` : ''}
                    {row.project?.name ? ` · Project: ${row.project.name}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={cx.secondaryBtn}
                    disabled={busyId === row.id}
                    onClick={() => setExpandedId(open ? null : row.id)}
                  >
                    {open ? 'Hide' : 'View'}
                  </button>
                  <button
                    type="button"
                    className={cx.secondaryBtn}
                    disabled={busyId === row.id}
                    onClick={() => void rename(row.id, row.name)}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    className={cx.secondaryBtn}
                    disabled={busyId === row.id}
                    onClick={() => void duplicate(row.id)}
                  >
                    Duplicate
                  </button>
                  {canRecalc ? (
                    <button
                      type="button"
                      className={cx.secondaryBtn}
                      disabled={busyId === row.id}
                      onClick={() => void recalculate(row.id)}
                    >
                      Recalculate
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={cx.secondaryBtn}
                    disabled={busyId === row.id}
                    onClick={() => void remove(row.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="text-xs font-semibold text-slate-500">Add to project</label>
                <select
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                  value={row.projectId ?? ''}
                  disabled={busyId === row.id}
                  onChange={(e) => void attachProject(row.id, e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {sourcePath ? (
                  <Link href={sourcePath} className="text-xs font-semibold text-[#f97316]">
                    Open calculator →
                  </Link>
                ) : null}
              </div>

              {open ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Original saved result
                      {label ? ` · ${label}` : ''}
                    </p>
                    <pre className="mt-2 max-h-64 overflow-auto text-xs text-slate-700">
                      {JSON.stringify(original, null, 2)}
                    </pre>
                  </div>
                  <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Recalculated current estimate
                      {comparison?.recalculated
                        ? ` · ${comparison.recalculated.methodologyVersionLabel}`
                        : canRecalc
                          ? ' · click Recalculate'
                          : ' · not supported'}
                    </p>
                    {comparison?.error ? (
                      <p className="mt-2 text-xs text-rose-600">{comparison.error}</p>
                    ) : null}
                    {comparison?.recalculated ? (
                      <>
                        {(comparison.methodologyChanged || comparison.resultChanged) && (
                          <p className="mt-2 text-xs font-semibold text-amber-700">
                            {comparison.methodologyChanged
                              ? 'Methodology/rates changed since save. '
                              : ''}
                            Showing a fresh estimate alongside the original saved result.
                          </p>
                        )}
                        {!comparison.resultChanged && !comparison.methodologyChanged ? (
                          <p className="mt-2 text-xs text-emerald-700">
                            Current estimate matches the original save.
                          </p>
                        ) : null}
                        <pre className="mt-2 max-h-64 overflow-auto text-xs text-slate-700">
                          {JSON.stringify(comparison.recalculated.outputs, null, 2)}
                        </pre>
                      </>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">
                        Run Recalculate to compare against latest rates/methodology.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
