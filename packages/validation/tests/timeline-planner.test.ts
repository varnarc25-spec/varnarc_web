import { describe, expect, it } from 'vitest';
import {
  TIMELINE_QUALIFICATION,
  calculateTimeline,
  generateTimelineFromAssumptions,
  applyDurationToEnd,
} from '../src/timeline-planner';

describe('generateTimelineFromAssumptions', () => {
  it('creates editable estimated phases with whole-week durations', () => {
    const r = generateTimelineFromAssumptions({
      projectStartDate: '2026-09-01',
      builtUpAreaSqft: 1500,
      floors: 2,
      constructionType: 'house-construction',
    });

    expect(r.phases.length).toBeGreaterThan(8);
    expect(r.phases.every((p) => p.durationIsEstimate)).toBe(true);
    expect(r.phases.every((p) => Number.isInteger(p.durationWeeks))).toBe(true);
    expect(r.phases[0]!.plannedStart).toBe('2026-09-01');
    expect(r.estimatedCompletionDate).toBeTruthy();
    expect(r.qualification).toBe(TIMELINE_QUALIFICATION);
    expect(r.assumptions.some((a) => /whole-week|estimate/i.test(a))).toBe(true);
    expect(r.phases.some((p) => p.dependsOnId)).toBe(true);
  });

  it('skips civil phases for interior-fitout', () => {
    const r = generateTimelineFromAssumptions({
      projectStartDate: '2026-09-01',
      builtUpAreaSqft: 800,
      floors: 1,
      constructionType: 'interior-fitout',
    });
    expect(r.phases.some((p) => p.name === 'Excavation')).toBe(false);
    expect(r.phases.some((p) => p.name === 'Foundation')).toBe(false);
    expect(r.phases.some((p) => p.name === 'Painting')).toBe(true);
  });
});

describe('calculateTimeline', () => {
  it('flags delayed phases and computes overall progress', () => {
    const r = calculateTimeline({
      projectStartDate: '2025-01-01',
      builtUpAreaSqft: 1000,
      floors: 1,
      constructionType: 'house-construction',
      phases: [
        {
          id: 'a',
          name: 'Foundation',
          durationWeeks: 3,
          durationIsEstimate: true,
          plannedStart: '2025-01-01',
          plannedEnd: '2025-01-22',
          status: 'delayed',
          progress: 40,
        },
        {
          id: 'b',
          name: 'Structure',
          durationWeeks: 4,
          durationIsEstimate: true,
          plannedStart: '2025-01-22',
          plannedEnd: '2025-02-19',
          status: 'completed',
          progress: 100,
          dependsOnId: 'a',
        },
      ],
    });

    expect(r.delayedPhases.some((d) => d.id === 'a')).toBe(true);
    expect(r.overallProgress).toBe(70);
    expect(r.estimatedCompletionDate).toBe('2025-02-19');
    expect(applyDurationToEnd('2026-01-01', 2)).toBe('2026-01-15');
  });
});
