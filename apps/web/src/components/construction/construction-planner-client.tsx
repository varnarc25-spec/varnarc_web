'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ConstructionTimelinePhase } from '@/services/construction';
import { getEstimateReportUrl } from '@/services/construction';

export function ConstructionPlannerClient({
  templates,
  projects,
  timeline,
  unauthorized,
}: {
  templates: Array<{ slug: string; name: string }>;
  projects: Array<{ id: string; name: string; estimatedCost?: number | string | null; areaSqft?: number | string | null }>;
  timeline: ConstructionTimelinePhase[];
  unauthorized?: boolean;
}) {
  const [templateSlug, setTemplateSlug] = useState(templates[0]?.slug ?? 'house-construction');
  const [areaSqft, setAreaSqft] = useState('1200');
  const [quality, setQuality] = useState<'basic' | 'standard' | 'premium'>('standard');
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? '');

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? projects[0];
  const totalWeeks = useMemo(
    () => timeline.reduce((sum, phase) => sum + (phase.durationWeeks ?? 0), 0),
    [timeline],
  );

  const reportPdfUrl = getEstimateReportUrl({
    areaSqft: selectedProject?.areaSqft ?? areaSqft,
    quality,
    templateSlug,
    format: 'pdf',
  });
  const reportJsonUrl = getEstimateReportUrl({
    areaSqft: selectedProject?.areaSqft ?? areaSqft,
    quality,
    templateSlug,
    format: 'json',
  });

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-[#0b1f3a]">Budget planner</h2>
        <p className="mt-1 text-sm text-slate-600">
          Configure estimate inputs and download a report, or pick a saved project budget.
        </p>

        {unauthorized ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <Link href="/auth/login?returnTo=/construction/planner" className="font-medium underline">
              Sign in
            </Link>{' '}
            to attach saved project budgets.
          </p>
        ) : projects.length ? (
          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Saved project
            </label>
            <select
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                  {project.estimatedCost != null ? ` — ₹${project.estimatedCost}` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Template</label>
            <select
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={templateSlug}
              onChange={(e) => setTemplateSlug(e.target.value)}
            >
              {(templates.length ? templates : [{ slug: 'house-construction', name: 'House construction' }]).map((t) => (
                <option key={t.slug} value={t.slug}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Area (sq ft)</label>
            <input
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              type="number"
              value={selectedProject?.areaSqft ?? areaSqft}
              onChange={(e) => setAreaSqft(e.target.value)}
              disabled={Boolean(selectedProject?.areaSqft)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Quality</label>
            <select
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={quality}
              onChange={(e) => setQuality(e.target.value as 'basic' | 'standard' | 'premium')}
            >
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Saved budget</div>
              <div className="mt-1 font-extrabold text-[#0b1f3a]">
                {selectedProject?.estimatedCost != null ? `₹${selectedProject.estimatedCost}` : 'Run an estimate'}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={reportPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b1f3a]/90"
          >
            Download PDF report
          </a>
          <a
            href={reportJsonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0b1f3a] hover:border-[#f97316]"
          >
            Download JSON report
          </a>
          <Link
            href="/construction/estimate"
            className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0b1f3a] hover:border-[#f97316]"
          >
            Run estimator
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-[#0b1f3a]">Construction timeline</h2>
            <p className="mt-1 text-sm text-slate-600">Typical residential build phases and durations.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            ~{totalWeeks} weeks
          </span>
        </div>
        <ol className="mt-5 space-y-3">
          {timeline.map((phase, index) => (
            <li key={phase.label} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f97316] text-xs font-bold text-white">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-[#0b1f3a]">{phase.label}</p>
                {phase.description ? <p className="mt-1 text-xs text-slate-600">{phase.description}</p> : null}
                {phase.durationWeeks ? (
                  <p className="mt-1 text-xs font-medium text-slate-500">{phase.durationWeeks} weeks</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
