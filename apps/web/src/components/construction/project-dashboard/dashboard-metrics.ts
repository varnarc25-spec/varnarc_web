/** Pure helpers for construction project dashboard metrics & recommendations. */

import type { ConstructionProject } from '@/services/construction';

export const PROJECT_DASHBOARD_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'estimate', label: 'Estimate' },
  { id: 'materials', label: 'Materials' },
  { id: 'boq', label: 'BOQ' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'budget', label: 'Budget' },
  { id: 'quotes', label: 'Quotes' },
  { id: 'documents', label: 'Documents' },
  { id: 'suppliers', label: 'Suppliers' },
] as const;

export type ProjectDashboardTabId = (typeof PROJECT_DASHBOARD_TABS)[number]['id'];

export function isProjectDashboardTab(
  value: string | null | undefined,
): value is ProjectDashboardTabId {
  return PROJECT_DASHBOARD_TABS.some((t) => t.id === value);
}

export function toNum(v: number | string | null | undefined): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function formatInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function wizardMeta(project: ConstructionProject) {
  const b = project.breakdown;
  if (!b || Array.isArray(b) || typeof b !== 'object') return null;
  const rec = b as Record<string, unknown>;
  if (rec.source !== 'project-wizard' && rec.budgetInr == null && rec.builtUpAreaSqft == null) {
    return null;
  }
  return rec as {
    source?: string;
    buildMode?: string;
    plotAreaSqft?: number | null;
    builtUpAreaSqft?: number | null;
    floors?: number | null;
    bedrooms?: number | null;
    budgetInr?: number | null;
    projectTypeKey?: string;
  };
}

export function estimateBreakdownRows(
  project: ConstructionProject,
): Array<{ label: string; amount: number }> {
  const b = project.breakdown;
  if (!Array.isArray(b)) return [];
  return b
    .map((row) => {
      const amount = toNum(row.amount);
      if (amount == null || !row.label) return null;
      return { label: String(row.label), amount };
    })
    .filter((x): x is { label: string; amount: number } => x != null);
}

export function materialCostFromProject(project: ConstructionProject): number | null {
  const rows = estimateBreakdownRows(project);
  const fromLabel = rows.find((r) => /material/i.test(r.label));
  if (fromLabel) return fromLabel.amount;

  if (
    project.breakdown &&
    !Array.isArray(project.breakdown) &&
    typeof project.breakdown === 'object'
  ) {
    const rec = project.breakdown as Record<string, unknown>;
    const direct = toNum(rec.materialCost as number | string | null | undefined);
    if (direct != null) return direct;
  }

  const itemSum = (project.items ?? []).reduce((sum, item) => {
    const cost = toNum(item.estimatedCost);
    return cost != null ? sum + cost : sum;
  }, 0);
  return itemSum > 0 ? itemSum : null;
}

export function actualSpentFromProject(project: ConstructionProject): number | null {
  const expenses = project.expenses ?? [];
  if (!expenses.length) return null;
  let sum = 0;
  let any = false;
  for (const e of expenses) {
    const amount = toNum(e.amount);
    if (amount != null) {
      sum += amount;
      any = true;
    }
  }
  return any ? sum : null;
}

export function budgetTotalFromProject(project: ConstructionProject): number | null {
  const lines = project.budgetItems ?? [];
  if (lines.length) {
    let sum = 0;
    let any = false;
    for (const line of lines) {
      const amount = toNum(line.plannedAmount);
      if (amount != null) {
        sum += amount;
        any = true;
      }
    }
    if (any) return sum;
  }
  const meta = wizardMeta(project);
  if (meta?.budgetInr != null) {
    const n = Number(meta.budgetInr);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}

export function projectProgressPct(project: ConstructionProject): number | null {
  const phases = project.phases ?? [];
  if (!phases.length) return null;
  const counted = phases.filter((p) => p.status !== 'SKIPPED');
  if (!counted.length) return null;
  const completed = counted.filter((p) => p.status === 'COMPLETED').length;
  return Math.round((completed / counted.length) * 100);
}

export function currentPhaseName(project: ConstructionProject): string | null {
  const phases = project.phases ?? [];
  if (!phases.length) return null;
  const inProgress = phases.find((p) => p.status === 'IN_PROGRESS');
  if (inProgress?.name) return inProgress.name;
  const planned = phases.find((p) => p.status === 'PLANNED');
  if (planned?.name) return planned.name;
  const lastCompleted = [...phases].reverse().find((p) => p.status === 'COMPLETED');
  return lastCompleted?.name ?? phases[0]?.name ?? null;
}

export function expectedCompletionDate(project: ConstructionProject): string | null {
  if (project.targetEndAt) return formatDate(project.targetEndAt);
  const ends = (project.phases ?? [])
    .map((p) => p.plannedEnd)
    .filter((d): d is string => Boolean(d))
    .map((d) => new Date(d).getTime())
    .filter((t) => Number.isFinite(t));
  if (!ends.length) return null;
  return formatDate(new Date(Math.max(...ends)).toISOString());
}

export type NextRecommendedAction = {
  id: string;
  title: string;
  body: string;
  href: string;
  tab?: ProjectDashboardTabId;
};

export function nextRecommendedAction(project: ConstructionProject): NextRecommendedAction {
  const estimated = toNum(project.estimatedCost);
  const hasEstimateBreakdown = estimateBreakdownRows(project).length > 0;
  const boqCount = project._count?.boqs ?? project.boqs?.length ?? 0;
  const phaseCount = project._count?.phases ?? project.phases?.length ?? 0;
  const quoteCount = (project.documents ?? []).filter((d) => d.kind === 'QUOTE').length;
  const expenseCount = project._count?.expenses ?? project.expenses?.length ?? 0;
  const budgetTotal = budgetTotalFromProject(project);
  const calcCount = project._count?.calculations ?? project.calculations?.length ?? 0;

  if (estimated == null && !hasEstimateBreakdown) {
    return {
      id: 'estimate',
      title: 'Estimate your project cost',
      body: 'No cost estimate is saved yet. Run the cost calculator to set a baseline.',
      href: '/construction/cost-calculator',
      tab: 'estimate',
    };
  }
  if (boqCount === 0) {
    return {
      id: 'boq',
      title: 'Generate BOQ',
      body: 'Create an indicative planning BOQ from project assumptions. Not a tender document.',
      href: `/construction/boq-generator?projectId=${project.id}`,
      tab: 'boq',
    };
  }
  if (quoteCount === 0) {
    return {
      id: 'quote',
      title: 'Add contractor quote',
      body: 'No contractor quotes are attached yet. Upload quote PDFs in the private document vault.',
      href: `/construction/document-vault?projectId=${project.id}`,
      tab: 'quotes',
    };
  }
  if (phaseCount === 0) {
    return {
      id: 'timeline',
      title: 'Set project timeline',
      body: 'Create estimated construction phases with the timeline planner. Durations are editable estimates.',
      href: `/construction/timeline-planner?projectId=${project.id}`,
      tab: 'timeline',
    };
  }
  if (expenseCount === 0) {
    return {
      id: 'expense',
      title: 'Add first expense',
      body: 'Track actual spend and committed costs with the budget tracker.',
      href: `/construction/budget-tracker?projectId=${project.id}`,
      tab: 'budget',
    };
  }
  if (budgetTotal == null) {
    return {
      id: 'budget',
      title: 'Set project budget',
      body: 'Expenses exist, but no budget total is set. Add budget lines to see variance.',
      href: `/construction/budget-tracker?projectId=${project.id}`,
      tab: 'budget',
    };
  }
  if (calcCount === 0) {
    return {
      id: 'materials',
      title: 'Estimate materials',
      body: 'Refine cement, steel and other quantities with material calculators.',
      href: '/construction/cement-calculator',
      tab: 'materials',
    };
  }
  return {
    id: 'review',
    title: 'Review project dashboard',
    body: 'Core planning pieces are in place. Keep updating BOQ, expenses and documents as work progresses.',
    href: `/construction/project/${project.id}?tab=overview`,
    tab: 'overview',
  };
}

export type ActivityItem = {
  id: string;
  label: string;
  at: string | null;
};

export function recentActivity(project: ConstructionProject): ActivityItem[] {
  const items: ActivityItem[] = [];
  if (project.createdAt) {
    items.push({ id: 'created', label: 'Project created', at: project.createdAt });
  }
  for (const calc of project.calculations ?? []) {
    items.push({
      id: `calc-${calc.id}`,
      label: calc.calculatorSlug
        ? `Saved calculation · ${calc.calculatorSlug}`
        : 'Saved calculation',
      at: calc.createdAt ?? null,
    });
  }
  for (const boq of project.boqs ?? []) {
    items.push({
      id: `boq-${boq.id}`,
      label: `BOQ ${boq.name ?? ''} v${boq.version ?? 1}`.trim(),
      at: boq.updatedAt ?? boq.createdAt ?? null,
    });
  }
  for (const expense of project.expenses ?? []) {
    items.push({
      id: `exp-${expense.id}`,
      label: expense.name ? `Expense · ${expense.name}` : 'Expense recorded',
      at: expense.spentOn ?? null,
    });
  }
  for (const doc of project.documents ?? []) {
    items.push({
      id: `doc-${doc.id}`,
      label: doc.kind === 'QUOTE' ? `Quote · ${doc.title}` : `Document · ${doc.title}`,
      at: doc.createdAt ?? null,
    });
  }
  if (project.updatedAt && project.updatedAt !== project.createdAt) {
    items.push({ id: 'updated', label: 'Project updated', at: project.updatedAt });
  }

  return items
    .filter((i) => i.at)
    .sort((a, b) => new Date(b.at!).getTime() - new Date(a.at!).getTime())
    .slice(0, 12);
}
