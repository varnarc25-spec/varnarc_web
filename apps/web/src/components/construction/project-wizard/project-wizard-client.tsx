'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cx, cn } from '@/components/construction/styles';
import { trackProjectCreated } from '@/lib/construction/analytics';
import {
  PROJECT_TYPE_OPTIONS,
  PROJECT_WIZARD_STEPS,
  clearProjectWizardDraft,
  defaultProjectWizardDraft,
  loadProjectWizardDraft,
  preliminaryCostInr,
  saveProjectWizardDraft,
  type ProjectQuality,
  type ProjectWizardDraft,
} from './draft';

function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function ProjectWizardClient({ isAuthenticated }: { isAuthenticated: boolean }) {
  const router = useRouter();
  const [draft, setDraft] = useState<ProjectWizardDraft>(defaultProjectWizardDraft);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const saved = loadProjectWizardDraft();
    if (saved) setDraft(saved);
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    saveProjectWizardDraft(draft);
  }, [draft]);

  const step = Math.min(Math.max(draft.step, 0), PROJECT_WIZARD_STEPS.length - 1);
  const progressPct = ((step + 1) / PROJECT_WIZARD_STEPS.length) * 100;

  const previewCost = useMemo(() => {
    const area = Number(draft.builtUpAreaSqft);
    if (!Number.isFinite(area) || area <= 0) return null;
    return preliminaryCostInr(area, draft.quality);
  }, [draft.builtUpAreaSqft, draft.quality]);

  function patch(partial: Partial<ProjectWizardDraft>) {
    setDraft((prev) => ({ ...prev, ...partial }));
    setError(null);
  }

  function validateStep(index: number): string | null {
    if (index === 0) {
      if (!draft.name.trim()) return 'Enter a project name.';
      if (!draft.location.trim()) return 'Enter a location (city or region).';
    }
    if (index === 1) {
      if (!draft.projectType) return 'Choose a project type.';
      if (!draft.buildMode) return 'Choose new construction or renovation.';
    }
    if (index === 2) {
      const built = Number(draft.builtUpAreaSqft);
      if (!Number.isFinite(built) || built <= 0) return 'Enter a valid built-up area (sq ft).';
      const floors = Number(draft.floors);
      if (!Number.isFinite(floors) || floors < 1) return 'Enter at least 1 floor.';
      if (draft.plotAreaSqft.trim()) {
        const plot = Number(draft.plotAreaSqft);
        if (!Number.isFinite(plot) || plot <= 0) return 'Plot area must be a positive number.';
      }
      if (draft.bedrooms.trim()) {
        const beds = Number(draft.bedrooms);
        if (!Number.isFinite(beds) || beds < 0) return 'Bedrooms must be zero or more.';
      }
    }
    if (index === 3) {
      if (!draft.quality) return 'Choose a construction quality.';
    }
    if (index === 4 && draft.budgetInr.trim()) {
      const budget = Number(draft.budgetInr);
      if (!Number.isFinite(budget) || budget <= 0) return 'Budget must be a positive amount.';
    }
    return null;
  }

  function goNext() {
    const msg = validateStep(step);
    if (msg) {
      setError(msg);
      return;
    }
    patch({ step: Math.min(step + 1, PROJECT_WIZARD_STEPS.length - 1) });
  }

  function goBack() {
    setError(null);
    patch({ step: Math.max(step - 1, 0) });
  }

  async function createProject() {
    for (let i = 0; i <= step; i += 1) {
      const msg = validateStep(i);
      if (msg) {
        setError(msg);
        patch({ step: i });
        return;
      }
    }

    if (!isAuthenticated) {
      saveProjectWizardDraft(draft);
      window.location.href = `/auth/login?returnTo=${encodeURIComponent('/construction/project/new')}`;
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const builtUp = Number(draft.builtUpAreaSqft);
      const plot = draft.plotAreaSqft.trim() ? Number(draft.plotAreaSqft) : null;
      const floors = Number(draft.floors);
      const bedrooms = draft.bedrooms.trim() ? Number(draft.bedrooms) : null;
      const budget = draft.budgetInr.trim() ? Number(draft.budgetInr) : null;
      const estimatedCost = preliminaryCostInr(builtUp, draft.quality);

      const body = {
        name: draft.name.trim(),
        projectType: `${draft.projectType}:${draft.buildMode}`,
        status: 'DRAFT',
        areaSqft: builtUp,
        region: draft.location.trim(),
        quality: draft.quality,
        currency: 'INR',
        estimatedCost,
        startedAt: draft.expectedStartDate.trim()
          ? new Date(draft.expectedStartDate).toISOString()
          : null,
        notes: [
          draft.buildMode === 'renovation' ? 'Renovation project' : 'New construction',
          floors ? `${floors} floor(s)` : null,
          bedrooms != null ? `${bedrooms} bedroom(s)` : null,
        ]
          .filter(Boolean)
          .join(' · '),
        breakdown: {
          source: 'project-wizard',
          wizardVersion: '2026.08.1',
          buildMode: draft.buildMode,
          plotAreaSqft: plot,
          builtUpAreaSqft: builtUp,
          floors,
          bedrooms,
          budgetInr: budget,
          projectTypeKey: draft.projectType,
        },
        items: [],
      };

      const res = await fetch('/api/construction/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as {
        data?: { id?: string };
        error?: { message?: string };
      };

      if (res.status === 401) {
        saveProjectWizardDraft(draft);
        window.location.href = `/auth/login?returnTo=${encodeURIComponent('/construction/project/new')}`;
        return;
      }
      if (!res.ok || !json.data?.id) {
        throw new Error(json.error?.message || 'Could not create project.');
      }

      clearProjectWizardDraft();
      trackProjectCreated({ logged_in: true });
      router.push(`/construction/project/${json.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create project.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-[#0b1f3a]">
            Step {step + 1} of {PROJECT_WIZARD_STEPS.length}: {PROJECT_WIZARD_STEPS[step]?.title}
          </span>
          <span className="text-slate-500">{Math.round(progressPct)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#f97316] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <ol className="mt-3 flex flex-wrap gap-2">
          {PROJECT_WIZARD_STEPS.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition',
                  i === step
                    ? 'bg-[#0b1f3a] text-white'
                    : i < step
                      ? 'bg-orange-100 text-[#0b1f3a]'
                      : 'bg-slate-100 text-slate-500',
                )}
                onClick={() => {
                  if (i <= step) patch({ step: i });
                  else {
                    for (let j = step; j < i; j += 1) {
                      const msg = validateStep(j);
                      if (msg) {
                        setError(msg);
                        return;
                      }
                    }
                    patch({ step: i });
                  }
                }}
              >
                {s.title}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className={cn(cx.card, 'space-y-4 p-5 sm:p-6')}>
        <div>
          <h2 className="text-lg font-bold text-[#0b1f3a]">{PROJECT_WIZARD_STEPS[step]?.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{PROJECT_WIZARD_STEPS[step]?.description}</p>
        </div>

        {step === 0 ? (
          <div className="space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Project name</span>
              <input
                className={cx.input}
                value={draft.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="e.g. Koramangala home"
                autoFocus
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Location</span>
              <input
                className={cx.input}
                value={draft.location}
                onChange={(e) => patch({ location: e.target.value })}
                placeholder="City or region"
              />
            </label>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">Project type</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {PROJECT_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={cn(
                      'rounded-xl border px-3 py-3 text-left text-sm font-medium',
                      draft.projectType === opt.value
                        ? 'border-[#f97316] bg-orange-50 text-[#0b1f3a]'
                        : 'border-slate-200 bg-white text-slate-700',
                    )}
                    onClick={() => patch({ projectType: opt.value })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">
                New construction or renovation?
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    { value: 'new', label: 'New construction' },
                    { value: 'renovation', label: 'Renovation' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={cn(
                      'rounded-xl border px-3 py-3 text-left text-sm font-medium',
                      draft.buildMode === opt.value
                        ? 'border-[#f97316] bg-orange-50 text-[#0b1f3a]'
                        : 'border-slate-200 bg-white text-slate-700',
                    )}
                    onClick={() => patch({ buildMode: opt.value })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Plot area (sq ft)</span>
              <input
                className={cx.input}
                type="number"
                min={1}
                step="any"
                value={draft.plotAreaSqft}
                onChange={(e) => patch({ plotAreaSqft: e.target.value })}
                placeholder="Optional"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Built-up area (sq ft)</span>
              <input
                className={cx.input}
                type="number"
                min={1}
                step="any"
                value={draft.builtUpAreaSqft}
                onChange={(e) => patch({ builtUpAreaSqft: e.target.value })}
                required
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Floors</span>
              <input
                className={cx.input}
                type="number"
                min={1}
                step={1}
                value={draft.floors}
                onChange={(e) => patch({ floors: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Bedrooms (optional)</span>
              <input
                className={cx.input}
                type="number"
                min={0}
                step={1}
                value={draft.bedrooms}
                onChange={(e) => patch({ bedrooms: e.target.value })}
                placeholder="Skip if N/A"
              />
            </label>
          </div>
        ) : null}

        {step === 3 ? (
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">
              Construction quality
            </legend>
            <div className="grid gap-2">
              {(
                [
                  { value: 'basic', label: 'Basic', hint: 'Functional finishes' },
                  { value: 'standard', label: 'Standard', hint: 'Common mid-range finish' },
                  { value: 'premium', label: 'Premium', hint: 'Higher-spec materials' },
                ] as Array<{ value: ProjectQuality; label: string; hint: string }>
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={cn(
                    'rounded-xl border px-4 py-3 text-left',
                    draft.quality === opt.value
                      ? 'border-[#f97316] bg-orange-50'
                      : 'border-slate-200 bg-white',
                  )}
                  onClick={() => patch({ quality: opt.value })}
                >
                  <span className="block text-sm font-semibold text-[#0b1f3a]">{opt.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{opt.hint}</span>
                </button>
              ))}
            </div>
            {previewCost != null ? (
              <p className="mt-3 text-sm text-slate-600">
                Indicative estimate from area × quality:{' '}
                <span className="font-semibold text-[#0b1f3a]">{formatInr(previewCost)}</span>
              </p>
            ) : null}
          </fieldset>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Expected start date (optional)
              </span>
              <input
                className={cx.input}
                type="date"
                value={draft.expectedStartDate}
                onChange={(e) => patch({ expectedStartDate: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Budget ₹ (optional)</span>
              <input
                className={cx.input}
                type="number"
                min={1}
                step="any"
                value={draft.budgetInr}
                onChange={(e) => patch({ budgetInr: e.target.value })}
                placeholder="Your planning budget"
              />
            </label>
            <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-[#0b1f3a]">Ready to create</p>
              <ul className="mt-2 space-y-1">
                <li>
                  <strong>{draft.name.trim() || '—'}</strong> · {draft.location.trim() || '—'}
                </li>
                <li>
                  {PROJECT_TYPE_OPTIONS.find((o) => o.value === draft.projectType)?.label} ·{' '}
                  {draft.buildMode === 'renovation' ? 'Renovation' : 'New construction'}
                </li>
                <li>
                  Built-up {draft.builtUpAreaSqft || '—'} sq ft · {draft.floors || '—'} floors ·{' '}
                  {draft.quality}
                </li>
                {previewCost != null ? <li>Indicative cost {formatInr(previewCost)}</li> : null}
              </ul>
              {!isAuthenticated ? (
                <p className="mt-3 text-xs text-amber-800">
                  You can fill the wizard now. Sign-in is required to save the project — your
                  answers are kept in this browser until then.
                </p>
              ) : null}
            </aside>
          </div>
        ) : null}

        {error ? (
          <p className="text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            className={cx.secondaryBtn}
            disabled={step === 0 || submitting}
            onClick={goBack}
          >
            Back
          </button>
          {step < PROJECT_WIZARD_STEPS.length - 1 ? (
            <button type="button" className={cx.primaryBtn} onClick={goNext}>
              Continue
            </button>
          ) : (
            <button
              type="button"
              className={cx.primaryBtn}
              disabled={submitting}
              onClick={() => void createProject()}
            >
              {submitting ? 'Creating…' : isAuthenticated ? 'Create project' : 'Sign in & create'}
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-slate-500">
        Already have projects?{' '}
        <Link href="/construction/projects" className="font-medium text-[#0b1f3a] underline">
          View my projects
        </Link>
      </p>
    </div>
  );
}
