import { describe, expect, it } from 'vitest';
import { resolveConstructionProjectTimeline } from '@varnarc/validation';
import { evidenceFromConstructionProject } from '@/lib/construction/project-timeline-evidence';
import type { ConstructionProject } from '@/services/construction';

describe('evidenceFromConstructionProject', () => {
  it('does not complete steps from an empty saved project', () => {
    const project: ConstructionProject = {
      id: 'p1',
      name: 'Draft house',
    };
    const steps = resolveConstructionProjectTimeline(evidenceFromConstructionProject(project));
    expect(steps.filter((s) => s.state === 'completed')).toEqual([]);
  });

  it('maps estimate, materials and BOQ from real fields', () => {
    const project: ConstructionProject = {
      id: 'p1',
      name: 'House',
      estimatedCost: 2500000,
      items: [{ id: 'i1', quantity: 12 }],
      calculations: [{ id: 'c1', calculatorSlug: 'cost-calculator' }],
      _count: { boqs: 1, phases: 0, budgetItems: 0, expenses: 0, documents: 0 },
    };
    const steps = resolveConstructionProjectTimeline(evidenceFromConstructionProject(project));
    expect(steps.find((s) => s.id === 'estimate')?.state).toBe('completed');
    expect(steps.find((s) => s.id === 'materials')?.state).toBe('completed');
    expect(steps.find((s) => s.id === 'boq')?.state).toBe('completed');
    expect(steps.find((s) => s.id === 'timeline')?.state).toBe('not_started');
  });
});
