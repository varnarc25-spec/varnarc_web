import {
  TIMELINE_BASE_WEEKS,
  TIMELINE_CALC_VERSION,
  TIMELINE_INTERIOR_WEEKS,
  TIMELINE_PHASE_NAMES,
  TIMELINE_QUALIFICATION,
  type TimelinePhaseName,
} from './rates';
import {
  timelineGenerateSchema,
  timelinePlannerInputSchema,
  type TimelineGenerateInput,
  type TimelinePhaseResult,
  type TimelinePlannerInput,
  type TimelinePlannerResult,
} from './types';

function parseDate(iso: string): Date {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${iso}`);
  return d;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Add whole weeks (7 calendar days) — coarse, not working-day precise. */
export function addWeeks(isoStart: string, weeks: number): string {
  const d = parseDate(isoStart);
  d.setDate(d.getDate() + Math.round(weeks) * 7);
  return toIsoDate(d);
}

export function weeksBetween(startIso: string, endIso: string): number {
  const a = parseDate(startIso).getTime();
  const b = parseDate(endIso).getTime();
  const days = Math.max(0, Math.round((b - a) / (24 * 60 * 60 * 1000)));
  return Math.max(0, Math.round(days / 7));
}

/** Size bucket — avoids false precision from continuous sqft scaling. */
function sizeBucket(sqft: number): 'small' | 'medium' | 'large' {
  if (sqft < 1000) return 'small';
  if (sqft < 2500) return 'medium';
  return 'large';
}

function sizeFactor(bucket: 'small' | 'medium' | 'large'): number {
  if (bucket === 'small') return 0.85;
  if (bucket === 'large') return 1.25;
  return 1;
}

function floorFactor(floors: number, phase: TimelinePhaseName): number {
  if (floors <= 1) return 1;
  const structural = new Set<TimelinePhaseName>([
    'Structure',
    'Masonry',
    'MEP rough-in',
    'Plaster',
    'Flooring',
    'Painting',
  ]);
  if (!structural.has(phase)) return 1;
  // Coarse: ~15% extra per floor above G, capped
  return Math.min(2.2, 1 + (floors - 1) * 0.15);
}

function typeWeeks(phase: TimelinePhaseName, constructionType: string): number | null {
  if (constructionType === 'interior-fitout' || constructionType === 'renovation') {
    const v = TIMELINE_INTERIOR_WEEKS[phase];
    if (v === null) return null;
    if (v != null) return v;
  }
  return TIMELINE_BASE_WEEKS[phase];
}

/**
 * Round to whole weeks — never invent day-level duration.
 */
function estimateWeeks(
  phase: TimelinePhaseName,
  builtUpAreaSqft: number,
  floors: number,
  constructionType: string,
): number | null {
  const base = typeWeeks(phase, constructionType);
  if (base == null) return null;
  const scaled = base * sizeFactor(sizeBucket(builtUpAreaSqft)) * floorFactor(floors, phase);
  return Math.max(1, Math.round(scaled));
}

function markDelayed(
  phase: {
    status: TimelinePhaseResult['status'];
    plannedEnd: string;
    progress: number;
  },
  todayIso: string,
): { isDelayed: boolean; reason: string | null } {
  if (phase.status === 'delayed') {
    return { isDelayed: true, reason: 'Marked delayed' };
  }
  if (phase.status === 'completed' || phase.progress >= 100) {
    return { isDelayed: false, reason: null };
  }
  if (phase.plannedEnd < todayIso) {
    return { isDelayed: true, reason: 'Past planned end date' };
  }
  return { isDelayed: false, reason: null };
}

function summarize(
  input: {
    projectStartDate: string;
    builtUpAreaSqft: number;
    floors: number;
    constructionType: TimelinePlannerResult['constructionType'];
  },
  phases: TimelinePhaseResult[],
  extraAssumptions: string[],
): TimelinePlannerResult {
  const todayIso = toIsoDate(new Date());
  const withFlags = phases.map((p) => {
    const { isDelayed, reason } = markDelayed(p, todayIso);
    return { ...p, isDelayed, _reason: reason };
  });

  const delayedPhases = withFlags
    .filter((p) => p.isDelayed)
    .map((p) => ({
      id: p.id,
      name: p.name,
      reason: p._reason ?? 'Delayed',
    }));

  const phasesOut: TimelinePhaseResult[] = withFlags.map(({ _reason: _, ...rest }) => rest);

  const ends = phasesOut.map((p) => p.plannedEnd).filter(Boolean);
  const estimatedCompletionDate = ends.length > 0 ? ends.reduce((a, b) => (a > b ? a : b)) : null;

  const overallProgress =
    phasesOut.length === 0
      ? 0
      : Math.round(
          phasesOut.reduce((s, p) => s + (p.status === 'completed' ? 100 : p.progress), 0) /
            phasesOut.length,
        );

  const totalEstimatedWeeks = phasesOut.reduce((s, p) => s + p.durationWeeks, 0);

  return {
    projectStartDate: input.projectStartDate,
    builtUpAreaSqft: input.builtUpAreaSqft,
    floors: input.floors,
    constructionType: input.constructionType,
    phases: phasesOut,
    estimatedCompletionDate,
    overallProgress,
    delayedPhases,
    totalEstimatedWeeks,
    assumptions: [
      ...extraAssumptions,
      'Durations are whole-week estimates (calendar weeks), not working-day schedules.',
      `Size bucket: ${sizeBucket(input.builtUpAreaSqft)} (~${Math.round(input.builtUpAreaSqft)} sq ft).`,
      TIMELINE_QUALIFICATION,
    ],
    qualification: TIMELINE_QUALIFICATION,
    version: TIMELINE_CALC_VERSION,
  };
}

/**
 * Generate default editable phases with estimated whole-week durations.
 */
export function generateTimelineFromAssumptions(raw: TimelineGenerateInput): TimelinePlannerResult {
  const input = timelineGenerateSchema.parse(raw);
  const start = input.projectStartDate.slice(0, 10);
  parseDate(start); // validate

  const phases: TimelinePhaseResult[] = [];
  let cursor = start;
  let prevId: string | null = null;

  for (let i = 0; i < TIMELINE_PHASE_NAMES.length; i++) {
    const name = TIMELINE_PHASE_NAMES[i]!;
    const weeks = estimateWeeks(name, input.builtUpAreaSqft, input.floors, input.constructionType);
    if (weeks == null) continue;

    const plannedStart = cursor;
    const plannedEnd = addWeeks(plannedStart, weeks);
    const id = `phase-${i + 1}-${name.toLowerCase().replace(/\s+/g, '-')}`;

    phases.push({
      id,
      name,
      durationWeeks: weeks,
      durationIsEstimate: true,
      plannedStart,
      plannedEnd,
      status: 'not_started',
      progress: 0,
      notes: `Estimated ~${weeks} week(s) — edit to match your site.`,
      dependsOnId: prevId,
      sortOrder: phases.length,
      isDelayed: false,
    });

    prevId = id;
    cursor = plannedEnd;
  }

  return summarize(
    {
      projectStartDate: start,
      builtUpAreaSqft: input.builtUpAreaSqft,
      floors: input.floors,
      constructionType: input.constructionType,
    },
    phases,
    [
      `Generated from start ${start}, ${input.floors} floor(s), type ${input.constructionType}.`,
      'Phases are chained sequentially with optional dependencies — adjust overlaps manually if needed.',
    ],
  );
}

/**
 * Recalculate summary from editable phases (does not rewrite dates unless duration changed externally).
 */
export function calculateTimeline(raw: TimelinePlannerInput): TimelinePlannerResult {
  const input = timelinePlannerInputSchema.parse(raw);
  const phases: TimelinePhaseResult[] = input.phases.map((p, index) => {
    const durationWeeks =
      p.durationWeeks >= 0
        ? Math.round(p.durationWeeks)
        : weeksBetween(p.plannedStart, p.plannedEnd);
    return {
      id: p.id,
      name: p.name.trim(),
      durationWeeks,
      durationIsEstimate: p.durationIsEstimate !== false,
      plannedStart: p.plannedStart.slice(0, 10),
      plannedEnd: p.plannedEnd.slice(0, 10),
      status: p.status ?? 'not_started',
      progress: Math.min(100, Math.max(0, Math.round(p.progress ?? 0))),
      notes: p.notes?.trim() || null,
      dependsOnId: p.dependsOnId ?? null,
      sortOrder: p.sortOrder ?? index,
      isDelayed: false,
    };
  });

  return summarize(
    {
      projectStartDate: input.projectStartDate.slice(0, 10),
      builtUpAreaSqft: input.builtUpAreaSqft,
      floors: input.floors,
      constructionType: input.constructionType,
    },
    phases,
    ['Totals recalculated from editable phase dates, durations, status and progress.'],
  );
}

/**
 * After editing duration weeks, recompute plannedEnd from plannedStart.
 */
export function applyDurationToEnd(plannedStart: string, durationWeeks: number): string {
  return addWeeks(plannedStart.slice(0, 10), Math.max(0, Math.round(durationWeeks)));
}

/** Map UI status → Prisma ConstructionPhaseStatus */
export function timelineStatusToPrisma(
  status: TimelinePhaseResult['status'],
): 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' {
  if (status === 'completed') return 'COMPLETED';
  if (status === 'in_progress' || status === 'delayed') return 'IN_PROGRESS';
  return 'PLANNED';
}

export function prismaStatusToTimeline(
  status: string,
  meta?: { uiStatus?: string } | null,
): TimelinePhaseResult['status'] {
  if (meta?.uiStatus === 'delayed') return 'delayed';
  if (
    meta?.uiStatus === 'not_started' ||
    meta?.uiStatus === 'in_progress' ||
    meta?.uiStatus === 'completed'
  ) {
    return meta.uiStatus;
  }
  if (status === 'COMPLETED') return 'completed';
  if (status === 'IN_PROGRESS') return 'in_progress';
  return 'not_started';
}

export function encodePhaseNotes(input: {
  userNotes?: string | null;
  progress: number;
  dependsOnId?: string | null;
  durationWeeks: number;
  durationIsEstimate: boolean;
  uiStatus: TimelinePhaseResult['status'];
}): string {
  const meta = {
    v: 1,
    progress: input.progress,
    dependsOnId: input.dependsOnId ?? null,
    durationWeeks: input.durationWeeks,
    durationIsEstimate: input.durationIsEstimate,
    uiStatus: input.uiStatus,
  };
  const user = (input.userNotes ?? '').trim();
  const block = `<!--varnarc-timeline:${JSON.stringify(meta)}-->`;
  return user ? `${user}\n${block}`.slice(0, 2000) : block.slice(0, 2000);
}

export function decodePhaseNotes(notes: string | null | undefined): {
  userNotes: string;
  meta: {
    progress?: number;
    dependsOnId?: string | null;
    durationWeeks?: number;
    durationIsEstimate?: boolean;
    uiStatus?: TimelinePhaseResult['status'];
  } | null;
} {
  if (!notes) return { userNotes: '', meta: null };
  const match = notes.match(/<!--varnarc-timeline:(\{.*?\})-->/);
  if (!match) return { userNotes: notes, meta: null };
  try {
    const meta = JSON.parse(match[1]!) as {
      progress?: number;
      dependsOnId?: string | null;
      durationWeeks?: number;
      durationIsEstimate?: boolean;
      uiStatus?: TimelinePhaseResult['status'];
    };
    const userNotes = notes.replace(match[0], '').trim();
    return { userNotes, meta };
  } catch {
    return { userNotes: notes, meta: null };
  }
}
