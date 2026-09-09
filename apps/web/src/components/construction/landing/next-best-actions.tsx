'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  resolveConstructionHubNextActions,
  resolveConstructionProjectTimeline,
} from '@varnarc/validation';
import { ConstructionSection } from '@/components/construction/construction-section';
import { cn, cx } from '@/components/construction/styles';
import type { ConstructionProject } from '@/services/construction';
import { type ProjectWizardDraft } from '@/components/construction/project-wizard/draft';
import {
  loadLocalCurrentProjectSources,
  pickCurrentConstructionProject,
  readCurrentConstructionProjectId,
  type CostCalculatorStored,
} from '@/lib/construction/current-project';
import { listLocalRecentConstructionTools } from '@/lib/construction/recent-tools';
import {
  evidenceFromConstructionProject,
  evidenceFromLocalPlanningArtifacts,
} from '@/lib/construction/project-timeline-evidence';

function ActionIcon({ name }: { name: string }) {
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
  if (name === 'compare') {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="7" height="14" rx="1" />
        <rect x="14" y="5" width="7" height="14" rx="1" />
      </svg>
    );
  }
  if (name === 'prices') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v8M9.5 10.5c.6-1 1.5-1.5 2.5-1.5s2 .6 2 1.8c0 2.2-4 1.8-4 4.2 0 .8.7 1.5 2 1.5s1.8-.4 2.4-1.2" />
      </svg>
    );
  }
  if (name === 'professionals') {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" />
        <path d="M4 19c.5-3 2.5-5 5-5s4.5 2 5 5" />
        <circle cx="17" cy="9" r="2.2" />
        <path d="M16 19c.3-2 1.5-3.5 3.2-4.2" />
      </svg>
    );
  }
  if (name === 'suppliers') {
    return (
      <svg {...common}>
        <path d="M3 17h18" />
        <path d="M5 17V9l4-3h6l4 3v8" />
        <path d="M9 17v-4h6v4" />
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
  return (
    <svg {...common}>
      <path d="M4 19V5h10l6 6v8H4z" />
      <path d="M14 5v6h6" />
    </svg>
  );
}

export function ConstructionNextBestActions({
  serverProjects = [],
  isAuthenticated = false,
}: {
  serverProjects?: ConstructionProject[];
  isAuthenticated?: boolean;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [wizard, setWizard] = useState<ProjectWizardDraft | null>(null);
  const [costCalc, setCostCalc] = useState<CostCalculatorStored | null>(null);
  const [recentTools, setRecentTools] = useState<
    ReturnType<typeof listLocalRecentConstructionTools>
  >([]);
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
    const picked = pickCurrentConstructionProject({
      serverProjects,
      lastSelectedId: hydrated ? selectedId : null,
      wizard: null,
      costCalc: null,
    });
    if (picked.status !== 'ready') return null;
    return serverProjects.find((p) => p.id === picked.project.id) ?? serverProjects[0] ?? null;
  }, [serverProjects, hydrated, selectedId]);

  const cards = useMemo(() => {
    const evidence = cloudProject
      ? evidenceFromConstructionProject(cloudProject)
      : evidenceFromLocalPlanningArtifacts({ costCalc, wizard, recentTools });
    const steps = resolveConstructionProjectTimeline(evidence);
    const stateOf = (id: string) => steps.find((s) => s.id === id)?.state;
    return resolveConstructionHubNextActions({
      hasEstimate: stateOf('estimate') === 'completed',
      hasMaterials: stateOf('materials') === 'completed',
      hasBoq: stateOf('boq') === 'completed',
      hasSavedProject: Boolean(cloudProject?.id),
      isAuthenticated,
      projectId: cloudProject?.id ?? null,
    });
  }, [cloudProject, costCalc, wizard, recentTools, isAuthenticated]);

  return (
    <ConstructionSection
      id="next-best-actions"
      title="Next best actions"
      description="Go further than a single calculation — compare, check local prices, find people, and keep your plan."
    >
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <li key={card.id}>
            <Link
              href={card.href}
              className={cn(
                cx.card,
                cx.focus,
                'flex h-full flex-col gap-3 p-4 transition hover:border-[#f97316]/50',
              )}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff7ed]">
                <ActionIcon name={card.icon} />
              </span>
              <span>
                <span className="block text-sm font-bold text-[#0b1f3a]">{card.title}</span>
                <span className="mt-1.5 block text-xs leading-relaxed text-slate-600">
                  {card.description}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </ConstructionSection>
  );
}
