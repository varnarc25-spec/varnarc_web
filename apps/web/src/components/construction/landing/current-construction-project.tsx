'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn, cx } from '@/components/construction/styles';
import { formatInr } from '@/components/construction/project-dashboard/dashboard-metrics';
import type { ConstructionProject } from '@/services/construction';
import {
  formatAreaLabel,
  formatQualityLabel,
  loadLocalCurrentProjectSources,
  pickCurrentConstructionProject,
  readCurrentConstructionProjectId,
  rememberCurrentConstructionProjectId,
  type ConstructionProjectSnapshot,
} from '@/lib/construction/current-project';

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 border-b border-slate-100 py-2.5 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="min-w-0 text-sm font-semibold text-[#0b1f3a] sm:text-right">{value}</dd>
    </div>
  );
}

function money(n: number | null): string {
  return n == null ? '—' : formatInr(n);
}

function savePayload(project: ConstructionProjectSnapshot): Record<string, unknown> {
  const quality =
    project.constructionQuality === 'basic' ||
    project.constructionQuality === 'premium' ||
    project.constructionQuality === 'standard'
      ? project.constructionQuality
      : project.constructionQuality === 'luxury'
        ? 'premium'
        : 'standard';
  return {
    name: project.name.slice(0, 150),
    projectType: (project.propertyType || 'house-construction').slice(0, 80),
    status: 'DRAFT',
    areaSqft: project.builtUpArea,
    region: project.location || null,
    quality,
    estimatedCost: project.estimatedCost,
    breakdown: {
      source: 'current-project-summary',
      builtUpAreaSqft: project.builtUpArea,
      floors: project.floors,
      materialCost: project.materialCost,
      labourCost: project.labourCost,
      contingency: project.contingency,
    },
    items: [],
  };
}

export function CurrentConstructionProjectSummary({
  serverProjects,
  isAuthenticated,
}: {
  serverProjects: ConstructionProject[];
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const resolution = useMemo(() => {
    if (!hydrated) {
      if (serverProjects.length) {
        return pickCurrentConstructionProject({
          serverProjects,
          lastSelectedId: null,
          wizard: null,
          costCalc: null,
        });
      }
      return { status: 'empty' as const };
    }
    const local = loadLocalCurrentProjectSources();
    return pickCurrentConstructionProject({
      serverProjects,
      lastSelectedId: readCurrentConstructionProjectId(),
      wizard: local.wizard,
      costCalc: local.costCalc,
    });
  }, [hydrated, serverProjects]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const project = resolution.status === 'ready' ? resolution.project : null;

  const saveToCloud = useCallback(async () => {
    if (!project || project.persistence === 'cloud') return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/construction/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savePayload(project)),
      });
      const json = (await res.json().catch(() => ({}))) as {
        data?: { id?: string };
        error?: { message?: string };
      };
      if (res.status === 401) {
        window.location.href = `/auth/login?returnTo=${encodeURIComponent('/construction')}`;
        return;
      }
      if (!res.ok || !json.data?.id) {
        throw new Error(json.error?.message || 'Could not save project.');
      }
      rememberCurrentConstructionProjectId(json.data.id);
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save project.');
    } finally {
      setSaving(false);
    }
  }, [project, router]);

  const locationLabel = project
    ? [project.city, project.state].filter(Boolean).join(', ') || project.location || '—'
    : '—';

  return (
    <section
      className="site-container py-5 sm:py-6"
      aria-labelledby="current-construction-project-heading"
    >
      <div className="rounded-[12px] border border-slate-200 bg-white p-4 sm:p-5">
        {!project ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Current project
              </p>
              <h2
                id="current-construction-project-heading"
                className="mt-1 text-lg font-bold text-[#0b1f3a]"
              >
                Start a construction project
              </h2>
              <p className="mt-1 max-w-xl text-sm text-slate-600">
                Create a project to keep cost, materials, BOQ and professionals connected — you can
                still calculate without signing in.
              </p>
            </div>
            <Link href="/construction/project/new" className={cn(cx.accentBtn, 'w-full sm:w-auto')}>
              Create project
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Current project
                </p>
                <h2
                  id="current-construction-project-heading"
                  className="mt-1 text-lg font-bold text-[#0b1f3a] sm:text-xl"
                >
                  {project.name}
                </h2>
                {project.persistence !== 'cloud' ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Saved on this device until you save it.
                  </p>
                ) : null}
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:mt-0 sm:flex-row">
                <Link href={project.editHref} className={cn(cx.secondaryBtn, 'w-full sm:w-auto')}>
                  Edit project
                </Link>
                {project.persistence !== 'cloud' ? (
                  <>
                    <button
                      type="button"
                      onClick={saveToCloud}
                      disabled={saving}
                      className={cn(cx.accentBtn, 'w-full sm:w-auto')}
                    >
                      {saving ? 'Saving…' : 'Save project'}
                    </button>
                    {!isAuthenticated ? (
                      <p className="text-xs text-slate-500 sm:hidden">
                        Saving requires an account. You can still calculate without signing in.
                      </p>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>

            {saveError ? <p className={cn(cx.error, 'mt-2')}>{saveError}</p> : null}

            <dl className="mt-4 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
              <FieldRow label="Location" value={locationLabel} />
              <FieldRow
                label="Built-up area"
                value={formatAreaLabel(project.builtUpArea, project.areaUnit)}
              />
              <FieldRow
                label="Floors"
                value={project.floors != null ? String(project.floors) : '—'}
              />
              <FieldRow
                label="Construction quality"
                value={formatQualityLabel(project.constructionQuality) ?? '—'}
              />
              <FieldRow label="Estimated total cost" value={money(project.estimatedCost)} />
              <FieldRow label="Materials" value={money(project.materialCost)} />
              <FieldRow label="Labour" value={money(project.labourCost)} />
            </dl>
          </>
        )}
      </div>
    </section>
  );
}
