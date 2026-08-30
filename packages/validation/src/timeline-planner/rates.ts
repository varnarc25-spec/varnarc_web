/** Construction Timeline Planner — templates & estimate labels. */

export const TIMELINE_CALC_VERSION = '2026.08.1';

export const TIMELINE_QUALIFICATION =
  'Phase durations are coarse planning estimates in whole weeks, not a contractor programme or CPM schedule. Edit dates and durations to match site conditions, labour and approvals.';

export const TIMELINE_PHASE_NAMES = [
  'Planning',
  'Site preparation',
  'Excavation',
  'Foundation',
  'Structure',
  'Masonry',
  'MEP rough-in',
  'Plaster',
  'Flooring',
  'Painting',
  'Fixtures',
  'Finishing',
  'Handover',
] as const;

export type TimelinePhaseName = (typeof TIMELINE_PHASE_NAMES)[number];

export const TIMELINE_UI_STATUSES = ['not_started', 'in_progress', 'delayed', 'completed'] as const;

export type TimelineUiStatus = (typeof TIMELINE_UI_STATUSES)[number];

export const TIMELINE_UI_STATUS_LABELS: Record<TimelineUiStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  delayed: 'Delayed',
  completed: 'Completed',
};

export const TIMELINE_CONSTRUCTION_TYPES = [
  'house-construction',
  'apartment',
  'commercial',
  'interior-fitout',
  'renovation',
  'other',
] as const;

export type TimelineConstructionType = (typeof TIMELINE_CONSTRUCTION_TYPES)[number];

/**
 * Coarse base duration estimates (whole weeks) per phase.
 * Intentionally round — not day-level precision.
 */
export const TIMELINE_BASE_WEEKS: Record<TimelinePhaseName, number> = {
  Planning: 2,
  'Site preparation': 1,
  Excavation: 2,
  Foundation: 3,
  Structure: 6,
  Masonry: 4,
  'MEP rough-in': 3,
  Plaster: 3,
  Flooring: 2,
  Painting: 2,
  Fixtures: 2,
  Finishing: 2,
  Handover: 1,
};

/** Interior / renovation skip or shorten civil phases. */
export const TIMELINE_INTERIOR_WEEKS: Partial<Record<TimelinePhaseName, number | null>> = {
  Planning: 1,
  'Site preparation': 1,
  Excavation: null,
  Foundation: null,
  Structure: null,
  Masonry: 1,
  'MEP rough-in': 2,
  Plaster: 2,
  Flooring: 2,
  Painting: 2,
  Fixtures: 2,
  Finishing: 2,
  Handover: 1,
};
