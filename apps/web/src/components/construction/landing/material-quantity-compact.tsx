'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { calculateMaterialQuantities } from '@varnarc/validation';
import { ConstructionSection } from '@/components/construction/construction-section';
import { cn, cx } from '@/components/construction/styles';
import {
  formatAreaLabel,
  loadLocalCurrentProjectSources,
  pickCurrentConstructionProject,
  readCurrentConstructionProjectId,
} from '@/lib/construction/current-project';
import type { ConstructionProject } from '@/services/construction';

const EXAMPLE = { builtUpArea: 1500, floors: 2, quality: 'standard' as const };

export function ConstructionMaterialQuantityCompact({
  serverProjects = [],
}: {
  serverProjects?: ConstructionProject[];
}) {
  const [fromProject, setFromProject] = useState(false);
  const [area, setArea] = useState(EXAMPLE.builtUpArea);
  const [floors, setFloors] = useState(EXAMPLE.floors);
  const [quality, setQuality] = useState<'basic' | 'standard' | 'premium'>(EXAMPLE.quality);
  const [adjust, setAdjust] = useState(false);

  useEffect(() => {
    const local = loadLocalCurrentProjectSources();
    const picked = pickCurrentConstructionProject({
      serverProjects,
      lastSelectedId: readCurrentConstructionProjectId(),
      wizard: local.wizard,
      costCalc: local.costCalc,
    });
    if (picked.status !== 'ready' || !picked.project.builtUpArea) return;
    const q = picked.project.constructionQuality;
    setFromProject(true);
    setArea(picked.project.builtUpArea ?? EXAMPLE.builtUpArea);
    setFloors(picked.project.floors && picked.project.floors > 0 ? picked.project.floors : 2);
    setQuality(q === 'basic' || q === 'premium' ? q : 'standard');
  }, [serverProjects]);

  const preview = useMemo(() => {
    try {
      const result = calculateMaterialQuantities({
        builtUpArea: area,
        areaUnit: 'sqft',
        floors,
        quality,
        location: 'India',
        wastagePercent: 5,
      });
      return { lines: result.lines.slice(0, 5), error: null as string | null };
    } catch (err) {
      return {
        lines: null,
        error: err instanceof Error ? err.message : 'Enter a valid area.',
      };
    }
  }, [area, floors, quality]);

  const caption = fromProject
    ? `From your current project · ${formatAreaLabel(area, 'sqft')}, ${floors} floors`
    : 'Example · 1,500 sq ft, 2 floors, standard finish';

  return (
    <ConstructionSection
      id="material-quantities"
      title="Material quantity calculator"
      description="Indicative cement, steel, sand and more. Open the full calculator to change structure and wastage."
      action={{ href: '/construction/material-calculator', label: 'Full calculator →' }}
    >
      <div className={cn(cx.card, 'p-4 sm:p-5')}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{caption}</p>
        {preview.error ? <p className={cn(cx.error, 'mt-2')}>{preview.error}</p> : null}
        {preview.lines ? (
          <ul className="mt-3">
            {preview.lines.map((line) => (
              <li
                key={line.id}
                className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-2 text-sm last:border-b-0"
              >
                <span className="text-slate-600">{line.label}</span>
                <span className="font-semibold tabular-nums text-[#0b1f3a]">
                  {line.quantity.toLocaleString('en-IN', {
                    maximumFractionDigits: line.unit === 'tonnes' ? 1 : 0,
                  })}{' '}
                  {line.unit}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <button
          type="button"
          className="mt-3 text-xs font-semibold text-slate-600 underline-offset-2 hover:text-[#0b1f3a] hover:underline"
          onClick={() => setAdjust((v) => !v)}
          aria-expanded={adjust}
        >
          {adjust ? 'Hide example settings' : 'Adjust this example'}
        </button>
        {adjust ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="block text-sm">
              <span className={cx.label}>Built-up area (sq ft)</span>
              <input
                className={cx.input}
                inputMode="decimal"
                value={String(area)}
                onChange={(e) => setArea(Number(e.target.value) || 0)}
              />
            </label>
            <label className="block text-sm">
              <span className={cx.label}>Floors</span>
              <input
                className={cx.input}
                inputMode="numeric"
                value={String(floors)}
                onChange={(e) => setFloors(Number(e.target.value) || 1)}
              />
            </label>
            <label className="block text-sm">
              <span className={cx.label}>Quality</span>
              <select
                className={cx.input}
                value={quality}
                onChange={(e) => setQuality(e.target.value as typeof quality)}
              >
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </label>
          </div>
        ) : null}

        <p className="mt-3 text-xs text-slate-500">
          Indicative estimate. Verify quantities with your engineer or contractor.
        </p>
        <Link href="/construction/material-calculator" className={cn(cx.secondaryBtn, 'mt-4')}>
          Open material calculator
        </Link>
      </div>
    </ConstructionSection>
  );
}
