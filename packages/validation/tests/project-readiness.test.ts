import { describe, expect, it } from 'vitest';
import {
  categorizeItem,
  evaluateProjectReadiness,
  overallBand,
  PROJECT_READINESS_ITEMS,
} from '../src/project-readiness';

describe('project readiness checker', () => {
  it('scores 100 when everything is done', () => {
    const answers = Object.fromEntries(PROJECT_READINESS_ITEMS.map((i) => [i.key, 'done']));
    const result = evaluateProjectReadiness({ answers });
    expect(result.score).toBe(100);
    expect(result.overallCategory).toBe('ready');
    expect(result.categories.high_priority_gaps).toHaveLength(0);
    expect(result.recommendedNextSteps).toHaveLength(0);
  });

  it('flags critical gaps and recommends BOQ / cost / timeline steps', () => {
    const answers = Object.fromEntries(PROJECT_READINESS_ITEMS.map((i) => [i.key, 'done']));
    answers.boq = 'not_started';
    answers.budget_defined = 'not_started';
    answers.construction_timeline = 'not_started';
    answers.soil_investigation = 'not_started';

    const result = evaluateProjectReadiness({ answers });
    expect(result.hasCriticalGap).toBe(true);
    expect(result.overallCategory).toBe('high_priority_gaps');
    expect(result.categories.high_priority_gaps.map((i) => i.key)).toEqual(
      expect.arrayContaining(['boq', 'budget_defined', 'soil_investigation']),
    );
    expect(result.categories.needs_attention.map((i) => i.key)).toContain('construction_timeline');

    const labels = result.recommendedNextSteps.map((s) => s.label);
    expect(labels).toContain('Create BOQ');
    expect(labels).toContain('Estimate construction cost');
    expect(labels).toContain('Create timeline');
  });

  it('excludes not_applicable from denominator', () => {
    const answers = Object.fromEntries(PROJECT_READINESS_ITEMS.map((i) => [i.key, 'done']));
    answers.site_supervision = 'not_applicable';
    const result = evaluateProjectReadiness({ answers });
    expect(result.score).toBe(100);
    expect(result.applicableCount).toBe(PROJECT_READINESS_ITEMS.length - 1);
  });

  it('categorizes statuses correctly', () => {
    expect(categorizeItem({ status: 'done', priority: 'critical' })).toBe('ready');
    expect(categorizeItem({ status: 'partial', priority: 'critical' })).toBe('needs_attention');
    expect(categorizeItem({ status: 'not_started', priority: 'critical' })).toBe(
      'high_priority_gaps',
    );
    expect(categorizeItem({ status: 'not_started', priority: 'medium' })).toBe('needs_attention');
    expect(categorizeItem({ status: 'not_applicable', priority: 'high' })).toBeNull();
  });

  it('overall band prefers critical gaps over high score', () => {
    expect(overallBand({ score: 95, hasCriticalGap: true })).toBe('high_priority_gaps');
    expect(overallBand({ score: 85, hasCriticalGap: false })).toBe('ready');
    expect(overallBand({ score: 60, hasCriticalGap: false })).toBe('needs_attention');
  });

  it('never implies structural safety in qualification text', () => {
    const result = evaluateProjectReadiness({
      answers: { budget_defined: 'done' },
    });
    expect(result.qualification.toLowerCase()).toContain('structurally safe');
    expect(result.qualification.toLowerCase()).toContain('does not assess technical engineering');
  });
});
