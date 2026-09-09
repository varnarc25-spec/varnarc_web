/** Phase 2 construction project timeline — progress from real artifacts only. */

export const CONSTRUCTION_PROJECT_TIMELINE_STATES = [
  'not_started',
  'in_progress',
  'completed',
] as const;

export type ConstructionProjectTimelineState =
  (typeof CONSTRUCTION_PROJECT_TIMELINE_STATES)[number];

export const CONSTRUCTION_PROJECT_TIMELINE_STEPS = [
  {
    id: 'estimate',
    number: 1,
    title: 'Estimate',
    description: 'Calculate cost & materials',
    href: '/construction/cost-calculator',
    icon: 'estimate',
  },
  {
    id: 'materials',
    number: 2,
    title: 'Materials',
    description: 'Finalize quantities',
    href: '/construction/material-calculator',
    icon: 'materials',
  },
  {
    id: 'boq',
    number: 3,
    title: 'BOQ',
    description: 'Generate detailed BOQ',
    href: '/construction/boq',
    icon: 'boq',
  },
  {
    id: 'timeline',
    number: 4,
    title: 'Timeline',
    description: 'Plan construction schedule',
    href: '/construction/timeline-planner',
    icon: 'timeline',
  },
  {
    id: 'budget',
    number: 5,
    title: 'Budget',
    description: 'Track expenses',
    href: '/construction/budget-tracker',
    icon: 'budget',
  },
  {
    id: 'documents',
    number: 6,
    title: 'Documents',
    description: 'Save and manage files',
    href: '/construction/document-vault',
    icon: 'documents',
  },
  {
    id: 'selector',
    number: 7,
    title: 'Selector',
    description: 'Task-based material categories to consider',
    href: '/construction/material-selector',
    icon: 'selector',
  },
] as const;

export type ConstructionProjectTimelineStepId =
  (typeof CONSTRUCTION_PROJECT_TIMELINE_STEPS)[number]['id'];

const COST_SLUGS = new Set(['cost-calculator', 'renovation-cost-calculator']);
const MATERIAL_QUANTITY_SLUG = 'material-calculator';
const PARTIAL_MATERIAL_SLUGS = new Set([
  'cement-calculator',
  'steel-calculator',
  'concrete-calculator',
  'brick-calculator',
  'sand-calculator',
  'aggregate-calculator',
  'plaster-calculator',
  'paint-calculator',
  'tile-calculator',
  'aac-block-calculator',
  'flooring-calculator',
  'rcc-calculator',
  'bbs-calculator',
]);
const BOQ_SLUGS = new Set(['boq', 'boq-generator']);
const TIMELINE_SLUGS = new Set(['timeline-planner']);
const BUDGET_SLUGS = new Set(['budget-tracker']);

export type ConstructionProjectTimelineEvidence = {
  estimatedCost?: number | string | null;
  hasEstimateBreakdown?: boolean;
  itemCount?: number;
  itemsWithQuantity?: boolean;
  calculatorSlugs?: string[];
  /** Recent tool slugs that have a stored result summary (not a page visit). */
  recentResultSlugs?: string[];
  boqCount?: number;
  phaseCount?: number;
  phasesInProgress?: boolean;
  budgetItemCount?: number;
  expenseCount?: number;
  documentCount?: number;
  hasLocalCostEstimate?: boolean;
  hasLocalMaterialQuantity?: boolean;
  hasLocalBoq?: boolean;
  hasWizardDraftWithoutEstimate?: boolean;
};

export type ConstructionProjectTimelineStep = {
  id: ConstructionProjectTimelineStepId;
  number: number;
  title: string;
  description: string;
  href: string;
  icon: string;
  state: ConstructionProjectTimelineState;
  stateLabel: string;
};

function positiveNumber(value: unknown): boolean {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0;
  }
  return false;
}

function count(n: number | undefined): number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : 0;
}

function slugsOf(evidence: ConstructionProjectTimelineEvidence): string[] {
  return [...(evidence.calculatorSlugs ?? []), ...(evidence.recentResultSlugs ?? [])].filter(
    (s) => typeof s === 'string' && s.length > 0,
  );
}

function hasSlug(evidence: ConstructionProjectTimelineEvidence, set: Set<string>): boolean {
  return slugsOf(evidence).some((s) => set.has(s));
}

function hasMaterialQuantity(evidence: ConstructionProjectTimelineEvidence): boolean {
  if (evidence.hasLocalMaterialQuantity) return true;
  if (evidence.itemsWithQuantity) return true;
  return slugsOf(evidence).includes(MATERIAL_QUANTITY_SLUG);
}

function hasPartialMaterials(evidence: ConstructionProjectTimelineEvidence): boolean {
  return slugsOf(evidence).some((s) => PARTIAL_MATERIAL_SLUGS.has(s));
}

function hasEstimate(evidence: ConstructionProjectTimelineEvidence): boolean {
  if (evidence.hasLocalCostEstimate) return true;
  if (positiveNumber(evidence.estimatedCost)) return true;
  if (evidence.hasEstimateBreakdown) return true;
  return hasSlug(evidence, COST_SLUGS);
}

function hasBoq(evidence: ConstructionProjectTimelineEvidence): boolean {
  if (evidence.hasLocalBoq) return true;
  if (count(evidence.boqCount) > 0) return true;
  return hasSlug(evidence, BOQ_SLUGS);
}

function hasTimeline(evidence: ConstructionProjectTimelineEvidence): boolean {
  if (count(evidence.phaseCount) > 0) return true;
  return hasSlug(evidence, TIMELINE_SLUGS);
}

function hasBudget(evidence: ConstructionProjectTimelineEvidence): boolean {
  if (count(evidence.budgetItemCount) > 0) return true;
  if (count(evidence.expenseCount) > 0) return true;
  return hasSlug(evidence, BUDGET_SLUGS);
}

function hasDocuments(evidence: ConstructionProjectTimelineEvidence): boolean {
  return count(evidence.documentCount) > 0;
}

const STATE_LABEL: Record<ConstructionProjectTimelineState, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
};

/**
 * Resolve timeline states from project/local artifacts.
 * Completed only when evidence exists. Later steps stay not started unless they have their own data.
 */
export function resolveConstructionProjectTimeline(
  evidence: ConstructionProjectTimelineEvidence = {},
): ConstructionProjectTimelineStep[] {
  const completed: Record<ConstructionProjectTimelineStepId, boolean> = {
    estimate: hasEstimate(evidence),
    materials: hasMaterialQuantity(evidence),
    boq: hasBoq(evidence),
    timeline: hasTimeline(evidence),
    budget: hasBudget(evidence),
    documents: hasDocuments(evidence),
    selector: false,
  };

  const inProgress: Record<ConstructionProjectTimelineStepId, boolean> = {
    estimate: !completed.estimate && Boolean(evidence.hasWizardDraftWithoutEstimate),
    materials: !completed.materials && hasPartialMaterials(evidence),
    boq: false,
    timeline: !completed.timeline && Boolean(evidence.phasesInProgress),
    budget: false,
    documents: false,
    selector: false,
  };

  return CONSTRUCTION_PROJECT_TIMELINE_STEPS.map((def) => {
    let state: ConstructionProjectTimelineState = 'not_started';
    if (completed[def.id]) state = 'completed';
    else if (inProgress[def.id]) state = 'in_progress';
    return {
      id: def.id,
      number: def.number,
      title: def.title,
      description: def.description,
      href: def.href,
      icon: def.icon,
      state,
      stateLabel: STATE_LABEL[state],
    };
  });
}

export function constructionProjectTimelineStateLabel(
  state: ConstructionProjectTimelineState,
): string {
  return STATE_LABEL[state];
}
