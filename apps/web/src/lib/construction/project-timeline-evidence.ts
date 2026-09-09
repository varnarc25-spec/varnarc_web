import type { ConstructionProjectTimelineEvidence } from '@varnarc/validation';
import {
  estimateBreakdownRows,
  toNum,
} from '@/components/construction/project-dashboard/dashboard-metrics';
import type { ConstructionProject } from '@/services/construction';
import {
  isMeaningfulWizardDraft,
  type CostCalculatorStored,
} from '@/lib/construction/current-project';
import { type ProjectWizardDraft } from '@/components/construction/project-wizard/draft';
import type { RecentConstructionToolItem } from '@/lib/construction/recent-tools';

export function evidenceFromConstructionProject(
  project: ConstructionProject,
): ConstructionProjectTimelineEvidence {
  const items = project.items ?? [];
  const itemsWithQuantity = items.some((item) => {
    const q = toNum(item.quantity);
    return q != null && q > 0;
  });
  const calculatorSlugs = (project.calculations ?? [])
    .map((c) => c.calculatorSlug)
    .filter((s): s is string => Boolean(s));

  return {
    estimatedCost: project.estimatedCost,
    hasEstimateBreakdown: estimateBreakdownRows(project).length > 0,
    itemsWithQuantity,
    calculatorSlugs,
    boqCount: project._count?.boqs ?? project.boqs?.length ?? 0,
    phaseCount: project._count?.phases ?? project.phases?.length ?? 0,
    phasesInProgress: (project.phases ?? []).some((p) => p.status === 'IN_PROGRESS'),
    budgetItemCount: project._count?.budgetItems ?? project.budgetItems?.length ?? 0,
    expenseCount: project._count?.expenses ?? project.expenses?.length ?? 0,
    documentCount: project._count?.documents ?? project.documents?.length ?? 0,
  };
}

export function evidenceFromLocalPlanningArtifacts(input: {
  costCalc: CostCalculatorStored | null;
  wizard: ProjectWizardDraft | null;
  recentTools: RecentConstructionToolItem[];
}): ConstructionProjectTimelineEvidence {
  const hasLocalCostEstimate =
    typeof input.costCalc?.lastTotal === 'number' &&
    Number.isFinite(input.costCalc.lastTotal) &&
    input.costCalc.lastTotal > 0;
  const recentResultSlugs = input.recentTools
    .filter((t) => typeof t.resultSummary === 'string' && t.resultSummary.trim().length > 0)
    .map((t) => t.calculatorSlug);
  const hasLocalMaterialQuantity = recentResultSlugs.includes('material-calculator');
  const hasLocalBoq =
    recentResultSlugs.includes('boq') || recentResultSlugs.includes('boq-generator');
  const wizardMeaningful = isMeaningfulWizardDraft(input.wizard);

  return {
    hasLocalCostEstimate,
    hasLocalMaterialQuantity,
    hasLocalBoq,
    recentResultSlugs,
    hasWizardDraftWithoutEstimate: wizardMeaningful && !hasLocalCostEstimate,
  };
}

export function withProjectIdQuery(href: string, projectId: string | null | undefined): string {
  if (!projectId || projectId.startsWith('local')) return href;
  const join = href.includes('?') ? '&' : '?';
  return `${href}${join}projectId=${encodeURIComponent(projectId)}`;
}
