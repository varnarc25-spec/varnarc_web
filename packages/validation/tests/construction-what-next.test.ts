import { describe, expect, it } from 'vitest';
import {
  getConstructionWhatNext,
  listWhatNextCalculatorSlugs,
} from '../src/construction-what-next';

describe('construction-what-next', () => {
  it('maps concrete results to material and BOQ next steps', () => {
    const actions = getConstructionWhatNext({
      calculatorSlug: 'concrete-calculator',
      outputs: { volumeM3: 2.5 },
      isAuthenticated: false,
      hasProjects: false,
    });
    const ids = actions.map((a) => a.id);
    expect(ids).toContain('calc-cement');
    expect(ids).toContain('calc-sand');
    expect(ids).toContain('calc-aggregate');
    expect(ids).toContain('estimate-concrete-cost');
    expect(ids).toContain('generate-boq');
    expect(actions.find((a) => a.id === 'calc-cement')?.href).toContain('volume=2.5');
  });

  it('maps cost results with project-aware CTAs', () => {
    const guest = getConstructionWhatNext({
      calculatorSlug: 'cost-calculator',
      outputs: { totalCostInr: 5_000_000 },
      isAuthenticated: false,
      hasProjects: false,
    });
    expect(guest.map((a) => a.id)).toContain('create-project');
    expect(guest.map((a) => a.id)).toContain('compare-scenario');
    expect(guest.map((a) => a.id)).toContain('generate-boq');

    const withProject = getConstructionWhatNext({
      calculatorSlug: 'cost-calculator',
      isAuthenticated: true,
      hasProjects: true,
    });
    expect(withProject.map((a) => a.id)).toContain('open-projects');
    expect(withProject.map((a) => a.id)).not.toContain('create-project');
  });

  it('maps tile results to flooring compare and BOQ', () => {
    const actions = getConstructionWhatNext({
      calculatorSlug: 'tile-calculator',
      isAuthenticated: true,
      hasProjects: true,
    });
    const ids = actions.map((a) => a.id);
    expect(ids).toContain('compare-flooring');
    expect(ids).toContain('generate-boq');
  });

  it('registers known calculator slugs', () => {
    expect(listWhatNextCalculatorSlugs().length).toBeGreaterThan(10);
  });
});
