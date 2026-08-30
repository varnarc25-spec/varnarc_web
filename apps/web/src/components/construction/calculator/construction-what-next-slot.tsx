'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getConstructionWhatNext } from '@varnarc/validation';
import { useConstructionSavePayload } from '@/lib/construction/save-calculation/store';
import { trackWhatNextClicked } from '@/lib/construction/analytics';
import { cn, cx } from '@/components/construction/styles';

type ProjectState = {
  isAuthenticated: boolean;
  hasProjects: boolean;
};

/**
 * Smart "What next?" panel.
 * Reads calculatorSlug + outputs from the universal save payload store
 * (published by every calculator that calls publishConstructionCalculationSave).
 */
export function ConstructionWhatNextSlot() {
  const payload = useConstructionSavePayload();
  const [projectState, setProjectState] = useState<ProjectState>({
    isAuthenticated: false,
    hasProjects: false,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/construction/projects', { cache: 'no-store' });
        if (cancelled) return;
        if (res.status === 401) {
          setProjectState({ isAuthenticated: false, hasProjects: false });
          return;
        }
        if (!res.ok) {
          setProjectState({ isAuthenticated: false, hasProjects: false });
          return;
        }
        const json = (await res.json()) as { data?: unknown[] };
        const list = Array.isArray(json.data) ? json.data : [];
        setProjectState({ isAuthenticated: true, hasProjects: list.length > 0 });
      } catch {
        if (!cancelled) {
          setProjectState({ isAuthenticated: false, hasProjects: false });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const actions = useMemo(() => {
    if (!payload?.calculatorSlug) return [];
    const inputsEnvelope = payload.inputs as
      | { raw?: Record<string, unknown>; normalized?: Record<string, unknown> }
      | Record<string, unknown>
      | null;
    const rawInputs =
      inputsEnvelope &&
      typeof inputsEnvelope === 'object' &&
      'raw' in inputsEnvelope &&
      inputsEnvelope.raw
        ? inputsEnvelope.raw
        : (payload.inputs as Record<string, unknown>);
    const normalized =
      payload.normalizedInputs ??
      (inputsEnvelope && typeof inputsEnvelope === 'object' && 'normalized' in inputsEnvelope
        ? inputsEnvelope.normalized
        : rawInputs);

    return getConstructionWhatNext({
      calculatorSlug: payload.calculatorSlug,
      outputs: payload.outputs,
      unitSummary: payload.unitSummary,
      inputs: (rawInputs && typeof rawInputs === 'object' ? rawInputs : null) as Record<
        string,
        unknown
      > | null,
      normalizedInputs:
        normalized && typeof normalized === 'object' && !Array.isArray(normalized)
          ? (normalized as Record<string, unknown>)
          : null,
      isAuthenticated: projectState.isAuthenticated,
      hasProjects: projectState.hasProjects,
      limit: 5,
    });
  }, [payload, projectState]);

  if (!payload || !actions.length) return null;

  return (
    <div className={cn(cx.card, 'space-y-3 p-4 sm:p-5 print:hidden')}>
      <div>
        <h3 className="text-sm font-bold text-[#0b1f3a]">What next?</h3>
        <p className="mt-1 text-xs text-slate-500">
          Suggested next steps based on this calculator and your project state.
        </p>
      </div>
      <ul className="space-y-2">
        {actions.map((action) => (
          <li key={action.id}>
            <Link
              href={action.href}
              className={cn(
                'flex flex-col rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:border-[#f97316]/50 hover:bg-white',
                cx.focus,
              )}
              onClick={() => {
                trackWhatNextClicked({
                  calculator_type: payload.calculatorSlug,
                  action_id: action.id,
                  logged_in: projectState.isAuthenticated,
                  has_projects: projectState.hasProjects,
                });
              }}
            >
              <span className="text-sm font-semibold text-[#0b1f3a]">{action.label}</span>
              <span className="mt-0.5 text-xs text-slate-500">{action.reason}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
