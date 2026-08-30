/** Construction Project Readiness Checker — planning checklist score (not engineering review). */

import { z } from 'zod';

export const PROJECT_READINESS_VERSION = '2026.08.1';

export const PROJECT_READINESS_QUALIFICATION =
  'This tool scores planning readiness from the checklist you complete. It does not assess technical engineering adequacy, design quality, code compliance, or structural safety. A high score means more planning items are marked complete — not that a project is structurally safe or ready to build.';

export const PROJECT_READINESS_METHODOLOGY = [
  'Each planning item has a priority (critical, high, or medium) and a weight (critical = 3, high = 2, medium = 1).',
  'For every applicable item: Done awards full weight; In progress awards half weight; Not started awards zero.',
  'Items marked Not applicable are excluded from the denominator.',
  'Readiness score = round(100 × earned weight ÷ total applicable weight).',
  'Items are grouped as: Ready (Done); Needs attention (In progress, or medium-priority Not started); High-priority gaps (critical or high priority Not started).',
  'The overall band is High-priority gaps if any critical item is Not started, otherwise Ready (≥80), Needs attention (50–79), or High-priority gaps (<50).',
].join(' ');

export const PROJECT_READINESS_STATUSES = [
  { key: 'done', label: 'Done', shortLabel: 'Done' },
  { key: 'partial', label: 'In progress', shortLabel: 'Partial' },
  { key: 'not_started', label: 'Not started', shortLabel: 'Missing' },
  { key: 'not_applicable', label: 'Not applicable', shortLabel: 'N/A' },
] as const;

export type ProjectReadinessStatus = (typeof PROJECT_READINESS_STATUSES)[number]['key'];

export const PROJECT_READINESS_PRIORITIES = [
  { key: 'critical', label: 'Critical', weight: 3 },
  { key: 'high', label: 'High', weight: 2 },
  { key: 'medium', label: 'Medium', weight: 1 },
] as const;

export type ProjectReadinessPriority = (typeof PROJECT_READINESS_PRIORITIES)[number]['key'];

export const PROJECT_READINESS_CATEGORIES = [
  {
    key: 'ready',
    label: 'Ready',
    description: 'Planning items you marked as done.',
  },
  {
    key: 'needs_attention',
    label: 'Needs attention',
    description: 'In-progress items, or medium-priority items not started yet.',
  },
  {
    key: 'high_priority_gaps',
    label: 'High-priority gaps',
    description: 'Critical or high-priority planning items still not started.',
  },
] as const;

export type ProjectReadinessCategoryKey = (typeof PROJECT_READINESS_CATEGORIES)[number]['key'];

export type ProjectReadinessNextStep = {
  label: string;
  href: string;
  reason: string;
};

export const PROJECT_READINESS_ITEMS = [
  {
    key: 'budget_defined',
    label: 'Budget defined',
    description: 'You have a clear overall project budget or cost estimate.',
    priority: 'high' as const,
    group: 'Money & commercial',
    nextSteps: [
      {
        label: 'Estimate construction cost',
        href: '/construction/cost-calculator',
        reason: 'No cost estimate / budget yet',
      },
      {
        label: 'Quick project estimate',
        href: '/construction/estimate',
        reason: 'Need a fast planning range',
      },
    ] satisfies ProjectReadinessNextStep[],
  },
  {
    key: 'contingency_reserved',
    label: 'Contingency reserved',
    description: 'A contingency buffer is set aside beyond the base budget.',
    priority: 'high' as const,
    group: 'Money & commercial',
    nextSteps: [
      {
        label: 'Check affordability & contingency',
        href: '/construction/affordability-calculator',
        reason: 'No contingency reserved',
      },
      {
        label: 'Estimate construction cost',
        href: '/construction/cost-calculator',
        reason: 'Refine budget before setting contingency',
      },
    ] satisfies ProjectReadinessNextStep[],
  },
  {
    key: 'land_site_confirmed',
    label: 'Land / site confirmed',
    description: 'Site ownership, access and basic suitability are confirmed.',
    priority: 'critical' as const,
    group: 'Site & investigations',
    nextSteps: [
      {
        label: 'Browse planning checklists',
        href: '/construction/checklists',
        reason: 'Land/site not confirmed',
      },
      {
        label: 'Read construction guides',
        href: '/construction/guides',
        reason: 'Review site planning basics',
      },
    ] satisfies ProjectReadinessNextStep[],
  },
  {
    key: 'soil_investigation',
    label: 'Soil investigation',
    description: 'Geotechnical / soil investigation has been commissioned or completed.',
    priority: 'critical' as const,
    group: 'Site & investigations',
    nextSteps: [
      {
        label: 'Find civil engineers',
        href: '/construction/professionals?type=civil_engineer',
        reason: 'No soil investigation',
      },
      {
        label: 'Browse planning checklists',
        href: '/construction/checklists',
        reason: 'Track site investigation steps',
      },
    ] satisfies ProjectReadinessNextStep[],
  },
  {
    key: 'architectural_drawings',
    label: 'Architectural drawings',
    description: 'Architectural plans exist at a usable level for pricing and approvals.',
    priority: 'critical' as const,
    group: 'Design & drawings',
    nextSteps: [
      {
        label: 'Find architects',
        href: '/construction/professionals?type=architect',
        reason: 'No architectural drawings',
      },
    ] satisfies ProjectReadinessNextStep[],
  },
  {
    key: 'structural_drawings',
    label: 'Structural drawings',
    description: 'Structural drawings exist for the intended scope (planning completeness only).',
    priority: 'critical' as const,
    group: 'Design & drawings',
    nextSteps: [
      {
        label: 'Find civil / structural engineers',
        href: '/construction/professionals?type=civil_engineer',
        reason: 'No structural drawings',
      },
    ] satisfies ProjectReadinessNextStep[],
  },
  {
    key: 'approvals',
    label: 'Approvals',
    description:
      'Required municipal / authority approvals are obtained or in progress as appropriate.',
    priority: 'critical' as const,
    group: 'Design & drawings',
    nextSteps: [
      {
        label: 'Browse planning checklists',
        href: '/construction/checklists',
        reason: 'Approvals not in place',
      },
      {
        label: 'Read construction guides',
        href: '/construction/guides',
        reason: 'Understand approval workflows',
      },
    ] satisfies ProjectReadinessNextStep[],
  },
  {
    key: 'boq',
    label: 'BOQ',
    description: 'A bill of quantities (or equivalent itemised scope) exists.',
    priority: 'high' as const,
    group: 'Commercial documents',
    nextSteps: [
      {
        label: 'Create BOQ',
        href: '/construction/boq-generator',
        reason: 'No BOQ',
      },
    ] satisfies ProjectReadinessNextStep[],
  },
  {
    key: 'contractor_quotation',
    label: 'Contractor quotation',
    description: 'At least one contractor quotation has been received for the scope.',
    priority: 'high' as const,
    group: 'Commercial documents',
    nextSteps: [
      {
        label: 'Analyse contractor quotes',
        href: '/construction/contractor-quote-analyzer',
        reason: 'No contractor quotation / need comparison',
      },
      {
        label: 'Find contractors',
        href: '/construction/professionals?type=contractor',
        reason: 'Need contractor quotes',
      },
    ] satisfies ProjectReadinessNextStep[],
  },
  {
    key: 'contract',
    label: 'Contract',
    description: 'A written construction contract (or engagement terms) is agreed or drafted.',
    priority: 'high' as const,
    group: 'Commercial documents',
    nextSteps: [
      {
        label: 'Browse planning checklists',
        href: '/construction/checklists',
        reason: 'No contract yet',
      },
      {
        label: 'Find contractors',
        href: '/construction/professionals?type=contractor',
        reason: 'Engage a contractor to formalise terms',
      },
    ] satisfies ProjectReadinessNextStep[],
  },
  {
    key: 'construction_timeline',
    label: 'Construction timeline',
    description: 'A phase-level construction timeline or programme exists.',
    priority: 'medium' as const,
    group: 'Delivery planning',
    nextSteps: [
      {
        label: 'Create timeline',
        href: '/construction/timeline-planner',
        reason: 'No timeline',
      },
    ] satisfies ProjectReadinessNextStep[],
  },
  {
    key: 'material_specification',
    label: 'Material specification',
    description: 'Key materials and finish specifications are written down.',
    priority: 'medium' as const,
    group: 'Delivery planning',
    nextSteps: [
      {
        label: 'Use material selector',
        href: '/construction/material-selector',
        reason: 'No material specification',
      },
      {
        label: 'Browse materials',
        href: '/construction/materials',
        reason: 'Research material options',
      },
    ] satisfies ProjectReadinessNextStep[],
  },
  {
    key: 'payment_milestones',
    label: 'Payment milestones',
    description: 'Payment stages linked to work progress are defined.',
    priority: 'medium' as const,
    group: 'Delivery planning',
    nextSteps: [
      {
        label: 'Track budget & payments',
        href: '/construction/budget-tracker',
        reason: 'No payment milestones',
      },
    ] satisfies ProjectReadinessNextStep[],
  },
  {
    key: 'site_supervision',
    label: 'Site supervision',
    description: 'Someone is designated for site supervision / quality oversight.',
    priority: 'medium' as const,
    group: 'Delivery planning',
    nextSteps: [
      {
        label: 'Find contractors',
        href: '/construction/professionals?type=contractor',
        reason: 'No site supervision plan',
      },
      {
        label: 'Find civil engineers',
        href: '/construction/professionals?type=civil_engineer',
        reason: 'Consider professional site supervision',
      },
    ] satisfies ProjectReadinessNextStep[],
  },
] as const;

export type ProjectReadinessItemKey = (typeof PROJECT_READINESS_ITEMS)[number]['key'];

export const PROJECT_READINESS_ITEM_KEYS = PROJECT_READINESS_ITEMS.map((i) => i.key) as [
  ProjectReadinessItemKey,
  ...ProjectReadinessItemKey[],
];

const statusEnum = z.enum(['done', 'partial', 'not_started', 'not_applicable']);

export const projectReadinessInputSchema = z.object({
  answers: z
    .record(z.string(), statusEnum)
    .refine((obj) => Object.keys(obj).length > 0, 'Provide at least one checklist answer.'),
});

export type ProjectReadinessInput = z.infer<typeof projectReadinessInputSchema>;

export function getProjectReadinessItem(key: string) {
  return PROJECT_READINESS_ITEMS.find((i) => i.key === key) ?? null;
}

export function weightForPriority(priority: ProjectReadinessPriority): number {
  return PROJECT_READINESS_PRIORITIES.find((p) => p.key === priority)?.weight ?? 1;
}

export function categorizeItem(input: {
  status: ProjectReadinessStatus;
  priority: ProjectReadinessPriority;
}): ProjectReadinessCategoryKey | null {
  if (input.status === 'not_applicable') return null;
  if (input.status === 'done') return 'ready';
  if (input.status === 'partial') return 'needs_attention';
  // not_started
  if (input.priority === 'critical' || input.priority === 'high') return 'high_priority_gaps';
  return 'needs_attention';
}

export function overallBand(input: {
  score: number;
  hasCriticalGap: boolean;
}): ProjectReadinessCategoryKey {
  if (input.hasCriticalGap) return 'high_priority_gaps';
  if (input.score >= 80) return 'ready';
  if (input.score >= 50) return 'needs_attention';
  return 'high_priority_gaps';
}

export type ProjectReadinessItemResult = {
  key: ProjectReadinessItemKey;
  label: string;
  description: string;
  group: string;
  priority: ProjectReadinessPriority;
  priorityLabel: string;
  weight: number;
  status: ProjectReadinessStatus;
  statusLabel: string;
  earnedWeight: number;
  category: ProjectReadinessCategoryKey | null;
  categoryLabel: string | null;
  nextSteps: ProjectReadinessNextStep[];
};

export type ProjectReadinessResult = {
  ok: true;
  version: string;
  score: number;
  scoreLabel: string;
  overallCategory: ProjectReadinessCategoryKey;
  overallCategoryLabel: string;
  earnedWeight: number;
  totalWeight: number;
  applicableCount: number;
  doneCount: number;
  hasCriticalGap: boolean;
  items: ProjectReadinessItemResult[];
  categories: {
    ready: ProjectReadinessItemResult[];
    needs_attention: ProjectReadinessItemResult[];
    high_priority_gaps: ProjectReadinessItemResult[];
  };
  recommendedNextSteps: Array<ProjectReadinessNextStep & { itemKey: ProjectReadinessItemKey }>;
  scoreExplanation: string;
  methodology: string;
  qualification: string;
  disclaimer: string;
};

function statusLabel(status: ProjectReadinessStatus): string {
  return PROJECT_READINESS_STATUSES.find((s) => s.key === status)?.label ?? status;
}

function categoryLabel(key: ProjectReadinessCategoryKey | null): string | null {
  if (!key) return null;
  return PROJECT_READINESS_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

function earnedForStatus(status: ProjectReadinessStatus, weight: number): number {
  if (status === 'done') return weight;
  if (status === 'partial') return weight * 0.5;
  return 0;
}

/**
 * Evaluate planning readiness. Missing answer keys default to `not_started`.
 * Unknown keys in answers are ignored.
 */
export function evaluateProjectReadiness(
  raw: ProjectReadinessInput | { answers: Record<string, string> },
): ProjectReadinessResult {
  const parsed = projectReadinessInputSchema.parse(raw);
  const items: ProjectReadinessItemResult[] = [];

  let earnedWeight = 0;
  let totalWeight = 0;
  let doneCount = 0;
  let applicableCount = 0;
  let hasCriticalGap = false;

  for (const def of PROJECT_READINESS_ITEMS) {
    const status = (parsed.answers[def.key] as ProjectReadinessStatus | undefined) ?? 'not_started';
    const weight = weightForPriority(def.priority);
    const priorityLabel =
      PROJECT_READINESS_PRIORITIES.find((p) => p.key === def.priority)?.label ?? def.priority;

    if (status !== 'not_applicable') {
      applicableCount += 1;
      totalWeight += weight;
      const earned = earnedForStatus(status, weight);
      earnedWeight += earned;
      if (status === 'done') doneCount += 1;
      if (status === 'not_started' && def.priority === 'critical') hasCriticalGap = true;
    }

    const category = categorizeItem({ status, priority: def.priority });
    items.push({
      key: def.key,
      label: def.label,
      description: def.description,
      group: def.group,
      priority: def.priority,
      priorityLabel,
      weight,
      status,
      statusLabel: statusLabel(status),
      earnedWeight: status === 'not_applicable' ? 0 : earnedForStatus(status, weight),
      category,
      categoryLabel: categoryLabel(category),
      nextSteps: status === 'done' || status === 'not_applicable' ? [] : [...def.nextSteps],
    });
  }

  const score = totalWeight > 0 ? Math.round((100 * earnedWeight) / totalWeight) : 0;
  const overallCategory = overallBand({ score, hasCriticalGap });

  const categories = {
    ready: items.filter((i) => i.category === 'ready'),
    needs_attention: items.filter((i) => i.category === 'needs_attention'),
    high_priority_gaps: items.filter((i) => i.category === 'high_priority_gaps'),
  };

  const recommendedNextSteps: Array<
    ProjectReadinessNextStep & { itemKey: ProjectReadinessItemKey }
  > = [];
  const seen = new Set<string>();
  const gapOrder = [...categories.high_priority_gaps, ...categories.needs_attention];
  for (const item of gapOrder) {
    for (const step of item.nextSteps) {
      const id = `${step.href}::${step.label}`;
      if (seen.has(id)) continue;
      seen.add(id);
      recommendedNextSteps.push({ ...step, itemKey: item.key });
    }
  }

  const scoreExplanation = [
    `Score ${score}/100 = ${earnedWeight} earned weight ÷ ${totalWeight} applicable weight × 100 (rounded).`,
    `Weights: critical items count as 3, high as 2, medium as 1. Done = full weight; In progress = half; Not started = 0; Not applicable excluded.`,
    hasCriticalGap
      ? 'Overall band is High-priority gaps because at least one critical planning item is still Not started.'
      : `Overall band is ${categoryLabel(overallCategory)} based on the score thresholds (Ready ≥80, Needs attention 50–79, otherwise High-priority gaps).`,
  ].join(' ');

  return {
    ok: true,
    version: PROJECT_READINESS_VERSION,
    score,
    scoreLabel: `${score} / 100`,
    overallCategory,
    overallCategoryLabel: categoryLabel(overallCategory)!,
    earnedWeight,
    totalWeight,
    applicableCount,
    doneCount,
    hasCriticalGap,
    items,
    categories,
    recommendedNextSteps,
    scoreExplanation,
    methodology: PROJECT_READINESS_METHODOLOGY,
    qualification: PROJECT_READINESS_QUALIFICATION,
    disclaimer: PROJECT_READINESS_QUALIFICATION,
  };
}

export function getProjectReadinessMeta() {
  return {
    version: PROJECT_READINESS_VERSION,
    qualification: PROJECT_READINESS_QUALIFICATION,
    methodology: PROJECT_READINESS_METHODOLOGY,
    statuses: PROJECT_READINESS_STATUSES,
    priorities: PROJECT_READINESS_PRIORITIES,
    categories: PROJECT_READINESS_CATEGORIES,
    items: PROJECT_READINESS_ITEMS.map((i) => ({
      key: i.key,
      label: i.label,
      description: i.description,
      priority: i.priority,
      group: i.group,
      nextSteps: i.nextSteps,
    })),
    scoreBands: [
      { key: 'ready', label: 'Ready', minScore: 80, note: 'Unless a critical item is Not started' },
      { key: 'needs_attention', label: 'Needs attention', minScore: 50, maxScore: 79 },
      { key: 'high_priority_gaps', label: 'High-priority gaps', maxScore: 49 },
    ],
    neverClaimsStructuralSafety: true,
    neverScoresEngineeringAdequacy: true,
  };
}

/** Default answers: all not started (useful for empty form). */
export function defaultProjectReadinessAnswers(): Record<
  ProjectReadinessItemKey,
  ProjectReadinessStatus
> {
  return Object.fromEntries(
    PROJECT_READINESS_ITEMS.map((i) => [i.key, 'not_started' as const]),
  ) as Record<ProjectReadinessItemKey, ProjectReadinessStatus>;
}
