import {
  PLANNER_HANDOFF_STORAGE_KEY,
  mergePlannerHandoff,
  type ConstructionPlannerHandoff,
} from '@varnarc/validation';

export function readPlannerHandoff(): ConstructionPlannerHandoff {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PLANNER_HANDOFF_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ConstructionPlannerHandoff;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function persistPlannerHandoff(handoff: ConstructionPlannerHandoff): void {
  if (typeof window === 'undefined') return;
  try {
    const next = mergePlannerHandoff(readPlannerHandoff(), handoff);
    localStorage.setItem(PLANNER_HANDOFF_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
}
