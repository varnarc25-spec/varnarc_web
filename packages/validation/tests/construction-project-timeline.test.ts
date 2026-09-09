import { describe, expect, it } from 'vitest';
import { resolveConstructionProjectTimeline } from '../src/construction-project-timeline';

describe('resolveConstructionProjectTimeline', () => {
  it('marks every step not started when there is no evidence', () => {
    const steps = resolveConstructionProjectTimeline({});
    expect(steps.every((s) => s.state === 'not_started')).toBe(true);
    expect(steps.map((s) => s.id)).toEqual([
      'estimate',
      'materials',
      'boq',
      'timeline',
      'budget',
      'documents',
      'selector',
    ]);
  });

  it('marks Estimate completed when a cost estimate exists', () => {
    const steps = resolveConstructionProjectTimeline({ estimatedCost: 3_088_800 });
    expect(steps.find((s) => s.id === 'estimate')?.state).toBe('completed');
    expect(steps.find((s) => s.id === 'materials')?.state).toBe('not_started');
    expect(steps.find((s) => s.id === 'boq')?.state).toBe('not_started');
  });

  it('does not complete later steps just because an earlier step is done', () => {
    const steps = resolveConstructionProjectTimeline({
      estimatedCost: 1,
      hasLocalCostEstimate: true,
    });
    expect(steps.filter((s) => s.state === 'completed').map((s) => s.id)).toEqual(['estimate']);
  });

  it('marks Materials completed when a material calculation exists', () => {
    const steps = resolveConstructionProjectTimeline({
      calculatorSlugs: ['material-calculator'],
    });
    expect(steps.find((s) => s.id === 'materials')?.state).toBe('completed');
  });

  it('treats a cement-only run as materials in progress, not completed', () => {
    const steps = resolveConstructionProjectTimeline({
      recentResultSlugs: ['cement-calculator'],
    });
    expect(steps.find((s) => s.id === 'materials')?.state).toBe('in_progress');
  });

  it('marks BOQ completed when a BOQ exists', () => {
    const steps = resolveConstructionProjectTimeline({ boqCount: 1 });
    expect(steps.find((s) => s.id === 'boq')?.state).toBe('completed');
  });

  it('marks Timeline, Budget and Documents from matching project counts', () => {
    const steps = resolveConstructionProjectTimeline({
      phaseCount: 4,
      budgetItemCount: 2,
      expenseCount: 1,
      documentCount: 3,
    });
    expect(steps.find((s) => s.id === 'timeline')?.state).toBe('completed');
    expect(steps.find((s) => s.id === 'budget')?.state).toBe('completed');
    expect(steps.find((s) => s.id === 'documents')?.state).toBe('completed');
  });

  it('does not treat a page visit without a result as completion', () => {
    const steps = resolveConstructionProjectTimeline({
      calculatorSlugs: [],
      recentResultSlugs: [],
    });
    expect(steps.find((s) => s.id === 'estimate')?.state).toBe('not_started');
  });

  it('marks Estimate in progress for a wizard draft without a cost', () => {
    const steps = resolveConstructionProjectTimeline({
      hasWizardDraftWithoutEstimate: true,
    });
    expect(steps.find((s) => s.id === 'estimate')?.state).toBe('in_progress');
  });
});
