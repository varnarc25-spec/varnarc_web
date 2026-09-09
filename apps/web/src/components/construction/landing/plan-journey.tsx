'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  resolveConstructionProjectTimeline,
  type ConstructionProjectTimelineState,
} from '@varnarc/validation';
import { ConstructionSection } from '@/components/construction/construction-section';
import { cn, cx } from '@/components/construction/styles';
import type { ConstructionProject } from '@/services/construction';
import { type ProjectWizardDraft } from '@/components/construction/project-wizard/draft';
import {
  isMeaningfulWizardDraft,
  loadLocalCurrentProjectSources,
  pickCurrentConstructionProject,
  readCurrentConstructionProjectId,
  type CostCalculatorStored,
} from '@/lib/construction/current-project';
import {
  listLocalRecentConstructionTools,
  type RecentConstructionToolItem,
} from '@/lib/construction/recent-tools';
import {
  evidenceFromConstructionProject,
  evidenceFromLocalPlanningArtifacts,
  withProjectIdQuery,
} from '@/lib/construction/project-timeline-evidence';

function TimelineIcon({ name }: { name: string }) {
  const common = {
    viewBox: '0 0 24 24',
    className: 'h-6 w-6 text-[#f97316]',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };
  if (name === 'estimate') {
    return (
      <svg {...common}>
        <path d="M4 19V5h10l6 6v8H4z" />
        <path d="M14 5v6h6" />
        <path d="M8 13h6M8 17h4" />
      </svg>
    );
  }
  if (name === 'materials') {
    return (
      <svg {...common}>
        <rect x="3" y="10" width="7" height="10" />
        <rect x="14" y="4" width="7" height="16" />
      </svg>
    );
  }
  if (name === 'boq') {
    return (
      <svg {...common}>
        <path d="M7 4h10v16H7z" />
        <path d="M10 8h4M10 12h4M10 16h3" />
      </svg>
    );
  }
  if (name === 'timeline') {
    return (
      <svg {...common}>
        <path d="M4 6h16M4 12h10M4 18h13" />
        <circle cx="18" cy="12" r="2" />
      </svg>
    );
  }
  if (name === 'budget') {
    return (
      <svg {...common}>
        <path d="M12 3v18" />
        <path d="M16 8c0-1.7-1.8-3-4-3s-4 1.3-4 3 1.8 3 4 3 4 1.3 4 3-1.8 3-4 3-4-1.3-4-3" />
      </svg>
    );
  }
  if (name === 'documents') {
    return (
      <svg {...common}>
        <path d="M7 3h7l5 5v13H7z" />
        <path d="M14 3v5h5" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="8" cy="8" r="3" />
      <circle cx="16" cy="16" r="3" />
      <path d="M10.5 10.5 13.5 13.5" />
    </svg>
  );
}

function stateClass(state: ConstructionProjectTimelineState): string {
  if (state === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (state === 'in_progress') return 'border-orange-200 bg-orange-50 text-orange-800';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

export function ConstructionPlanJourney({
  serverProjects = [],
}: {
  serverProjects?: ConstructionProject[];
}) {
  const [hydrated, setHydrated] = useState(false);
  const [wizard, setWizard] = useState<ProjectWizardDraft | null>(null);
  const [costCalc, setCostCalc] = useState<CostCalculatorStored | null>(null);
  const [recentTools, setRecentTools] = useState<RecentConstructionToolItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const local = loadLocalCurrentProjectSources();
    setWizard(local.wizard);
    setCostCalc(local.costCalc);
    setRecentTools(listLocalRecentConstructionTools());
    setSelectedId(readCurrentConstructionProjectId());
    setHydrated(true);
  }, []);

  const cloudProject = useMemo(() => {
    if (!serverProjects.length) return null;
    const last = hydrated ? selectedId : null;
    const picked = pickCurrentConstructionProject({
      serverProjects,
      lastSelectedId: last,
      wizard: null,
      costCalc: null,
    });
    if (picked.status !== 'ready') return null;
    return serverProjects.find((p) => p.id === picked.project.id) ?? serverProjects[0] ?? null;
  }, [serverProjects, hydrated, selectedId]);

  const steps = useMemo(() => {
    const evidence = cloudProject
      ? evidenceFromConstructionProject(cloudProject)
      : evidenceFromLocalPlanningArtifacts({ costCalc, wizard, recentTools });
    return resolveConstructionProjectTimeline(evidence);
  }, [cloudProject, costCalc, wizard, recentTools]);

  const projectId = cloudProject?.id ?? null;
  const localOnly =
    !cloudProject &&
    (Boolean(costCalc?.lastTotal) ||
      isMeaningfulWizardDraft(wizard) ||
      recentTools.some((t) => t.resultSummary));

  return (
    <ConstructionSection
      id="plan-your-construction"
      title="Construction project timeline"
      description="Work through estimate, materials, BOQ, schedule, budget and documents. Status reflects saved project data — not assumed progress."
    >
      <ol className="flex max-h-[min(28rem,70vh)] flex-col gap-3 overflow-y-auto overscroll-y-contain pb-1 sm:max-h-none sm:flex-row sm:overflow-x-auto sm:overflow-y-visible sm:pb-2">
        {steps.map((step, index) => (
          <li key={step.id} className="relative min-w-0 shrink-0 sm:w-[13.5rem] sm:min-w-[13.5rem]">
            <Link
              href={withProjectIdQuery(step.href, projectId)}
              aria-current={step.state === 'in_progress' ? 'step' : undefined}
              className={cn(
                cx.card,
                cx.focus,
                'flex h-full gap-3 p-4 transition hover:border-[#f97316]/50 sm:flex-col',
              )}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fff7ed]">
                <TimelineIcon name={step.icon} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#f97316]">
                    {String(step.number).padStart(2, '0')}
                  </span>
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                      stateClass(step.state),
                    )}
                  >
                    {step.stateLabel}
                  </span>
                </span>
                <span className="mt-1.5 block text-sm font-bold text-[#0b1f3a]">{step.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-600">
                  {step.description}
                </span>
              </span>
            </Link>
            {index < steps.length - 1 ? (
              <span
                className="pointer-events-none absolute -bottom-2 left-8 hidden text-slate-300 max-sm:block"
                aria-hidden
              >
                ↓
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">
        {cloudProject ? (
          <>
            Progress is based on{' '}
            <span className="font-semibold text-[#0b1f3a]">{cloudProject.name}</span>. Open a step
            to continue in that module.
          </>
        ) : localOnly ? (
          <>Using local calculator results until you save a project.</>
        ) : (
          <>
            No saved project yet — every step starts as not started. Begin with the{' '}
            <Link href="/construction/cost-calculator" className={cx.link}>
              cost calculator
            </Link>
            .
          </>
        )}
      </p>
    </ConstructionSection>
  );
}
