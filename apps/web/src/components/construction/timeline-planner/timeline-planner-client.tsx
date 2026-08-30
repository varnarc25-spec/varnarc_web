'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  TIMELINE_CONSTRUCTION_TYPES,
  TIMELINE_QUALIFICATION,
  TIMELINE_UI_STATUSES,
  TIMELINE_UI_STATUS_LABELS,
  applyDurationToEnd,
  calculateTimeline,
  decodePhaseNotes,
  encodePhaseNotes,
  generateTimelineFromAssumptions,
  prismaStatusToTimeline,
  timelineStatusToPrisma,
  type TimelineConstructionType,
  type TimelinePlannerResult,
  type TimelineUiStatus,
} from '@varnarc/validation';
import {
  CalculationResult,
  CalculatorShell,
  MethodologyPanel,
} from '@/components/construction/calculator';
import { ConstructionRelatedLinks } from '@/components/construction/construction-related-links';
import { cn, cx } from '@/components/construction/styles';
import { wizardMeta } from '@/components/construction/project-dashboard/dashboard-metrics';
import {
  trackCalculationAddedToProject,
  trackCalculatorCompleted,
  trackCalculatorError,
} from '@/lib/construction/analytics';
import { printConstructionPage } from '@/lib/construction/export';
import type { ConstructionProject } from '@/services/construction';
import {
  TIMELINE_PLANNER_FAQS,
  TIMELINE_PLANNER_RELATED,
  TIMELINE_PLANNER_SEO,
  TIMELINE_PLANNER_WORKED_EXAMPLE,
} from './content';

const CALC_TYPE = 'timeline_planner';

type ViewMode = 'timeline' | 'list' | 'cards';

type EditablePhase = {
  id: string;
  name: string;
  durationWeeks: string;
  durationIsEstimate: boolean;
  plannedStart: string;
  plannedEnd: string;
  status: TimelineUiStatus;
  progress: string;
  notes: string;
  dependsOnId: string;
};

function todayIso(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function newPhase(partial?: Partial<EditablePhase>): EditablePhase {
  return {
    id: `phase-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: 'Custom phase',
    durationWeeks: '2',
    durationIsEstimate: true,
    plannedStart: todayIso(),
    plannedEnd: applyDurationToEnd(todayIso(), 2),
    status: 'not_started',
    progress: '0',
    notes: '',
    dependsOnId: '',
    ...partial,
  };
}

function phasesFromResult(r: TimelinePlannerResult): EditablePhase[] {
  return r.phases.map((p) => ({
    id: p.id,
    name: p.name,
    durationWeeks: String(p.durationWeeks),
    durationIsEstimate: p.durationIsEstimate,
    plannedStart: p.plannedStart,
    plannedEnd: p.plannedEnd,
    status: p.status,
    progress: String(p.progress),
    notes: p.notes ?? '',
    dependsOnId: p.dependsOnId ?? '',
  }));
}

function formatDateLabel(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const TYPE_LABELS: Record<TimelineConstructionType, string> = {
  'house-construction': 'House construction',
  apartment: 'Apartment',
  commercial: 'Commercial',
  'interior-fitout': 'Interior fit-out',
  renovation: 'Renovation',
  other: 'Other',
};

export function TimelinePlannerClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get('projectId');

  const [view, setView] = useState<ViewMode>('timeline');
  const [startDate, setStartDate] = useState(todayIso());
  const [builtUp, setBuiltUp] = useState('1500');
  const [floors, setFloors] = useState('2');
  const [constructionType, setConstructionType] =
    useState<TimelineConstructionType>('house-construction');
  const [phases, setPhases] = useState<EditablePhase[]>([]);
  const [result, setResult] = useState<TimelinePlannerResult | null>(null);
  const [projectId, setProjectId] = useState<string | null>(projectIdParam);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/construction/projects', { cache: 'no-store' });
        if (res.status === 401 || !res.ok) return;
        const json = await res.json();
        const list = (json?.data ?? json ?? []) as ConstructionProject[];
        if (cancelled || !Array.isArray(list)) return;
        setProjects(list.map((p) => ({ id: p.id, name: p.name || 'Untitled project' })));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!projectIdParam) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/construction/projects/${projectIdParam}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const json = await res.json();
        const project = (json?.data ?? json) as ConstructionProject;
        if (cancelled || !project?.id) return;
        setProjectId(project.id);
        const meta = wizardMeta(project);
        const area =
          meta?.builtUpAreaSqft ?? (project.areaSqft != null ? Number(project.areaSqft) : null);
        if (area && area > 0) setBuiltUp(String(area));
        if (meta?.floors) setFloors(String(meta.floors));
        if (meta?.buildMode === 'renovation') setConstructionType('renovation');
        else if (
          meta?.projectTypeKey &&
          TIMELINE_CONSTRUCTION_TYPES.includes(meta.projectTypeKey as TimelineConstructionType)
        ) {
          setConstructionType(meta.projectTypeKey as TimelineConstructionType);
        }
        if (project.startedAt) {
          setStartDate(String(project.startedAt).slice(0, 10));
        }

        const existing = project.phases ?? [];
        if (existing.length) {
          const loaded: EditablePhase[] = existing.map((ph, i) => {
            const { userNotes, meta: noteMeta } = decodePhaseNotes(ph.notes);
            const start = ph.plannedStart ? String(ph.plannedStart).slice(0, 10) : todayIso();
            const end = ph.plannedEnd ? String(ph.plannedEnd).slice(0, 10) : start;
            const status = prismaStatusToTimeline(ph.status ?? 'PLANNED', noteMeta);
            return {
              id: ph.id,
              name: ph.name,
              durationWeeks: String(
                noteMeta?.durationWeeks ??
                  Math.max(
                    1,
                    Math.round(
                      (new Date(`${end}T12:00:00`).getTime() -
                        new Date(`${start}T12:00:00`).getTime()) /
                        (7 * 24 * 60 * 60 * 1000),
                    ),
                  ),
              ),
              durationIsEstimate: noteMeta?.durationIsEstimate !== false,
              plannedStart: start,
              plannedEnd: end,
              status,
              progress: String(noteMeta?.progress ?? (status === 'completed' ? 100 : 0)),
              notes: userNotes,
              dependsOnId: noteMeta?.dependsOnId ?? (i > 0 ? existing[i - 1]!.id : ''),
            };
          });
          setPhases(loaded);
          setLoadMsg(`Loaded ${loaded.length} phase(s) from project “${project.name}”.`);
        } else {
          setLoadMsg(
            `Loaded project “${project.name}” assumptions. Generate a timeline to seed phases.`,
          );
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectIdParam]);

  function updatePhase(id: string, patch: Partial<EditablePhase>) {
    setPhases((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next = { ...p, ...patch };
        if (patch.durationWeeks != null && patch.plannedEnd == null) {
          const weeks = Number(patch.durationWeeks);
          if (Number.isFinite(weeks) && weeks >= 0) {
            next.plannedEnd = applyDurationToEnd(next.plannedStart, weeks);
          }
        }
        if (patch.plannedStart != null && patch.plannedEnd == null) {
          const weeks = Number(next.durationWeeks) || 0;
          next.plannedEnd = applyDurationToEnd(next.plannedStart, weeks);
        }
        return next;
      }),
    );
  }

  function compute(): TimelinePlannerResult | null {
    try {
      return calculateTimeline({
        projectStartDate: startDate,
        builtUpAreaSqft: Number(builtUp) || 1,
        floors: Number(floors) || 1,
        constructionType,
        phases: phases.map((p, i) => ({
          id: p.id,
          name: p.name.trim() || 'Phase',
          durationWeeks: Number(p.durationWeeks) || 0,
          durationIsEstimate: p.durationIsEstimate,
          plannedStart: p.plannedStart,
          plannedEnd: p.plannedEnd,
          status: p.status,
          progress: Number(p.progress) || 0,
          notes: p.notes.trim() || null,
          dependsOnId: p.dependsOnId || null,
          sortOrder: i,
        })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not calculate timeline');
      return null;
    }
  }

  function runRecalc(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setActionMsg(null);
    const next = compute();
    if (!next) {
      trackCalculatorError({
        calculator_type: CALC_TYPE,
        error_code: 'calc_failed',
        logged_in: Boolean(projectId),
      });
      setResult(null);
      return;
    }
    setResult(next);
    trackCalculatorCompleted({
      calculator_type: CALC_TYPE,
      unit: 'weeks',
      result_range_category:
        next.totalEstimatedWeeks <= 20 ? 'low' : next.totalEstimatedWeeks <= 52 ? 'mid' : 'high',
      logged_in: Boolean(projectId),
    });
  }

  function generate() {
    setError(null);
    setActionMsg(null);
    try {
      const generated = generateTimelineFromAssumptions({
        projectStartDate: startDate,
        builtUpAreaSqft: Number(builtUp),
        floors: Number(floors) || 1,
        constructionType,
      });
      setPhases(phasesFromResult(generated));
      setResult(generated);
      setActionMsg(
        'Generated estimated phases (whole weeks). Review and edit durations before relying on dates.',
      );
      trackCalculatorCompleted({
        calculator_type: CALC_TYPE,
        unit: 'weeks',
        result_range_category: 'mid',
        logged_in: Boolean(projectId),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      trackCalculatorError({
        calculator_type: CALC_TYPE,
        error_code: 'generate_failed',
        logged_in: false,
      });
    }
  }

  async function saveToProject() {
    if (!projectId) {
      setActionMsg('Choose a saved project (or open with ?projectId=) to save this timeline.');
      return;
    }
    const next = result ?? compute();
    if (!next || next.phases.length === 0) {
      setActionMsg('Generate or add phases before saving.');
      return;
    }
    setSaveLoading(true);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/construction/projects/${projectId}/phases`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phases: next.phases.map((p, index) => ({
            name: p.name,
            slug: p.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .slice(0, 120),
            sortOrder: index,
            status: timelineStatusToPrisma(p.status),
            plannedStart: p.plannedStart,
            plannedEnd: p.plannedEnd,
            notes: encodePhaseNotes({
              userNotes: p.notes,
              progress: p.progress,
              dependsOnId: p.dependsOnId,
              durationWeeks: p.durationWeeks,
              durationIsEstimate: p.durationIsEstimate,
              uiStatus: p.status,
            }),
          })),
        }),
      });
      if (res.status === 401) {
        setActionMsg('Sign in to save this timeline to a project.');
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message || 'Save failed');
      }
      setResult(next);
      setActionMsg('Timeline saved to project.');
      trackCalculationAddedToProject({ calculator_type: CALC_TYPE, logged_in: true });
      router.push(`/construction/project/${projectId}?tab=timeline`);
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaveLoading(false);
    }
  }

  const range = useMemo(() => {
    if (!result?.phases.length) return null;
    const starts = result.phases.map((p) => p.plannedStart);
    const ends = result.phases.map((p) => p.plannedEnd);
    const min = starts.reduce((a, b) => (a < b ? a : b));
    const max = ends.reduce((a, b) => (a > b ? a : b));
    const minT = new Date(`${min}T12:00:00`).getTime();
    const maxT = new Date(`${max}T12:00:00`).getTime();
    const span = Math.max(1, maxT - minT);
    return { min, max, minT, span };
  }, [result]);

  const formNode = (
    <form className={cn(cx.card, 'space-y-4 p-4 sm:p-5')} onSubmit={runRecalc}>
      <aside className="rounded-xl border border-amber-200 bg-amber-50 p-3 sm:p-4">
        <p className="text-sm font-semibold text-[#0b1f3a]">Estimated durations only</p>
        <p className="mt-1 text-sm text-slate-700">{TIMELINE_QUALIFICATION}</p>
      </aside>

      {loadMsg ? <p className="text-sm text-slate-600">{loadMsg}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Project start date</span>
          <input
            className={cx.input}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Built-up size (sq ft)</span>
          <input
            className={cx.input}
            type="number"
            min={1}
            value={builtUp}
            onChange={(e) => setBuiltUp(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Number of floors</span>
          <input
            className={cx.input}
            type="number"
            min={1}
            value={floors}
            onChange={(e) => setFloors(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Construction type</span>
          <select
            className={cx.input}
            value={constructionType}
            onChange={(e) => setConstructionType(e.target.value as TimelineConstructionType)}
          >
            {TIMELINE_CONSTRUCTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Save to project</span>
          <select
            className={cx.input}
            value={projectId ?? ''}
            onChange={(e) => setProjectId(e.target.value || null)}
          >
            <option value="">Select project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-end gap-2">
          <button type="button" className={cx.primaryBtn} onClick={generate}>
            Generate estimated timeline
          </button>
          <Link
            href="/construction/project/new"
            className="text-sm font-medium text-[#f97316] hover:underline"
          >
            Create project
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        {(
          [
            ['timeline', 'Timeline'],
            ['list', 'List'],
            ['cards', 'Cards'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-semibold',
              view === id
                ? 'bg-[#0b1f3a] text-white'
                : 'border border-slate-200 bg-white text-[#0b1f3a]',
            )}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {view !== 'cards' ? (
        <div className={cn('overflow-x-auto', 'hidden md:block')}>
          <table className="min-w-[920px] w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-2">Phase</th>
                <th className="py-2 pr-2">Start</th>
                <th className="py-2 pr-2">End</th>
                <th className="py-2 pr-2">Duration (est. weeks)</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2 pr-2">Progress %</th>
                <th className="py-2 pr-2">Depends on</th>
                <th className="py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {phases.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 align-top">
                  <td className="py-2 pr-2">
                    <input
                      className={cx.input}
                      value={row.name}
                      onChange={(e) => updatePhase(row.id, { name: e.target.value })}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      className={cx.input}
                      type="date"
                      value={row.plannedStart}
                      onChange={(e) => updatePhase(row.id, { plannedStart: e.target.value })}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      className={cx.input}
                      type="date"
                      value={row.plannedEnd}
                      onChange={(e) =>
                        updatePhase(row.id, {
                          plannedEnd: e.target.value,
                          durationIsEstimate: false,
                        })
                      }
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      className={cx.input}
                      type="number"
                      min={0}
                      step={1}
                      value={row.durationWeeks}
                      onChange={(e) =>
                        updatePhase(row.id, {
                          durationWeeks: e.target.value,
                          durationIsEstimate: true,
                        })
                      }
                    />
                    {row.durationIsEstimate ? (
                      <p className="mt-1 text-xs text-amber-700">Estimate</p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">Edited</p>
                    )}
                  </td>
                  <td className="py-2 pr-2">
                    <select
                      className={cx.input}
                      value={row.status}
                      onChange={(e) =>
                        updatePhase(row.id, {
                          status: e.target.value as TimelineUiStatus,
                          progress: e.target.value === 'completed' ? '100' : row.progress,
                        })
                      }
                    >
                      {TIMELINE_UI_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {TIMELINE_UI_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      className={cx.input}
                      type="number"
                      min={0}
                      max={100}
                      value={row.progress}
                      onChange={(e) => updatePhase(row.id, { progress: e.target.value })}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <select
                      className={cx.input}
                      value={row.dependsOnId}
                      onChange={(e) => updatePhase(row.id, { dependsOnId: e.target.value })}
                    >
                      <option value="">None</option>
                      {phases
                        .filter((p) => p.id !== row.id)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="py-2">
                    <input
                      className={cx.input}
                      value={row.notes}
                      onChange={(e) => updatePhase(row.id, { notes: e.target.value })}
                    />
                    <button
                      type="button"
                      className="mt-1 text-xs text-slate-500 hover:underline"
                      onClick={() =>
                        setPhases((prev) =>
                          prev.length <= 1 ? prev : prev.filter((p) => p.id !== row.id),
                        )
                      }
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className={cn('space-y-3', view === 'cards' ? 'block' : 'md:hidden')}>
        {view !== 'cards' ? (
          <p className="text-xs text-slate-500 md:hidden">Mobile card view</p>
        ) : null}
        {phases.map((row) => (
          <article key={`card-${row.id}`} className={cn(cx.card, 'space-y-3 p-4')}>
            <input
              className={cx.input}
              value={row.name}
              onChange={(e) => updatePhase(row.id, { name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs">
                <span className="mb-1 block text-slate-600">Start</span>
                <input
                  className={cx.input}
                  type="date"
                  value={row.plannedStart}
                  onChange={(e) => updatePhase(row.id, { plannedStart: e.target.value })}
                />
              </label>
              <label className="text-xs">
                <span className="mb-1 block text-slate-600">End</span>
                <input
                  className={cx.input}
                  type="date"
                  value={row.plannedEnd}
                  onChange={(e) =>
                    updatePhase(row.id, {
                      plannedEnd: e.target.value,
                      durationIsEstimate: false,
                    })
                  }
                />
              </label>
              <label className="text-xs">
                <span className="mb-1 block text-slate-600">Est. weeks</span>
                <input
                  className={cx.input}
                  type="number"
                  min={0}
                  value={row.durationWeeks}
                  onChange={(e) =>
                    updatePhase(row.id, {
                      durationWeeks: e.target.value,
                      durationIsEstimate: true,
                    })
                  }
                />
              </label>
              <label className="text-xs">
                <span className="mb-1 block text-slate-600">Progress %</span>
                <input
                  className={cx.input}
                  type="number"
                  min={0}
                  max={100}
                  value={row.progress}
                  onChange={(e) => updatePhase(row.id, { progress: e.target.value })}
                />
              </label>
            </div>
            <label className="block text-xs">
              <span className="mb-1 block text-slate-600">Status</span>
              <select
                className={cx.input}
                value={row.status}
                onChange={(e) =>
                  updatePhase(row.id, { status: e.target.value as TimelineUiStatus })
                }
              >
                {TIMELINE_UI_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {TIMELINE_UI_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs">
              <span className="mb-1 block text-slate-600">Depends on (optional)</span>
              <select
                className={cx.input}
                value={row.dependsOnId}
                onChange={(e) => updatePhase(row.id, { dependsOnId: e.target.value })}
              >
                <option value="">None</option>
                {phases
                  .filter((p) => p.id !== row.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </label>
            <input
              className={cx.input}
              placeholder="Notes"
              value={row.notes}
              onChange={(e) => updatePhase(row.id, { notes: e.target.value })}
            />
          </article>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={cx.secondaryBtn}
          onClick={() =>
            setPhases((prev) => [
              ...prev,
              newPhase({
                dependsOnId: prev[prev.length - 1]?.id ?? '',
                plannedStart: prev[prev.length - 1]?.plannedEnd ?? startDate,
              }),
            ])
          }
        >
          Add phase
        </button>
        <button type="submit" className={cx.primaryBtn}>
          Recalculate summary
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {actionMsg ? <p className="text-sm text-slate-600">{actionMsg}</p> : null}
    </form>
  );

  const resultNode = result ? (
    <div className="space-y-4">
      <CalculationResult
        label="Estimated completion"
        value={formatDateLabel(result.estimatedCompletionDate)}
        hint={result.qualification}
        metrics={[
          { label: 'Overall progress', value: `${result.overallProgress}%` },
          {
            label: 'Total estimated weeks',
            value: String(result.totalEstimatedWeeks),
            hint: 'Sum of phase estimates — not calendar-critical-path precise',
          },
          { label: 'Delayed phases', value: String(result.delayedPhases.length) },
        ]}
      />

      {result.delayedPhases.length ? (
        <div className={cn(cx.card, 'border border-amber-200 bg-amber-50 p-4')}>
          <h3 className="text-sm font-semibold text-[#0b1f3a]">Delayed phases</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {result.delayedPhases.map((d) => (
              <li key={d.id}>
                {d.name} — {d.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {view === 'timeline' && range ? (
        <div className={cn(cx.card, 'hidden space-y-3 p-4 sm:p-5 md:block')}>
          <h3 className="text-sm font-semibold text-[#0b1f3a]">Timeline view</h3>
          <p className="text-xs text-slate-500">
            {formatDateLabel(range.min)} → {formatDateLabel(range.max)} (relative bars)
          </p>
          <ul className="space-y-2">
            {result.phases.map((p) => {
              const startT = new Date(`${p.plannedStart}T12:00:00`).getTime();
              const endT = new Date(`${p.plannedEnd}T12:00:00`).getTime();
              const left = ((startT - range.minT) / range.span) * 100;
              const width = Math.max(2, ((endT - startT) / range.span) * 100);
              const color =
                p.status === 'completed'
                  ? 'bg-emerald-500'
                  : p.isDelayed || p.status === 'delayed'
                    ? 'bg-amber-500'
                    : p.status === 'in_progress'
                      ? 'bg-[#f97316]'
                      : 'bg-slate-400';
              return (
                <li
                  key={p.id}
                  className="grid grid-cols-[7rem_1fr] items-center gap-2 text-xs sm:grid-cols-[9rem_1fr]"
                >
                  <span className="truncate font-medium text-[#0b1f3a]">{p.name}</span>
                  <div className="relative h-7 rounded bg-slate-100">
                    <div
                      className={cn('absolute top-1 h-5 rounded', color)}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      title={`${p.plannedStart} → ${p.plannedEnd} · ~${p.durationWeeks} wk est.`}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <MethodologyPanel title="Assumptions" steps={result.assumptions} />

      <div className="flex flex-wrap gap-2 print:hidden">
        <button
          type="button"
          className={cx.primaryBtn}
          disabled={saveLoading}
          onClick={() => void saveToProject()}
        >
          {saveLoading ? 'Saving…' : 'Save to project'}
        </button>
        <button type="button" className={cx.secondaryBtn} onClick={() => printConstructionPage()}>
          Print
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <CalculatorShell
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/construction' },
          { label: 'Timeline planner' },
        ]}
        title="Construction Timeline Planner"
        description={TIMELINE_PLANNER_SEO}
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        formula={
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs sm:text-sm">
              planned end ≈ planned start + estimated weeks × 7 calendar days · overall progress =
              average of phase progress
            </p>
            <p>
              Generated durations use size buckets and floor factors — rounded to whole weeks and
              always labelled as estimates.
            </p>
          </div>
        }
        seoContent={
          <div className="space-y-4">
            <p>{TIMELINE_PLANNER_SEO}</p>
            <h3 className="text-base font-bold text-[#0b1f3a]">Worked example</h3>
            <p>{TIMELINE_PLANNER_WORKED_EXAMPLE}</p>
          </div>
        }
        faqs={TIMELINE_PLANNER_FAQS}
        stickyCta={{
          primary: { label: 'Generate timeline', onClick: () => generate() },
          secondary: { label: 'Recalculate', onClick: () => runRecalc() },
        }}
      />
      <div className="site-container pb-12 print:hidden">
        <ConstructionRelatedLinks calculators={TIMELINE_PLANNER_RELATED} />
      </div>
    </>
  );
}
