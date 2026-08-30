import { describe, expect, it } from 'vitest';
import {
  STRUCTURAL_EXCLUSIONS,
  analyseConstructionCostOptimization,
  applyCostOptimizationLevers,
  suggestLeversForTarget,
} from '../src/cost-optimization';

const base = {
  location: 'Hyderabad',
  builtUpArea: 1500,
  areaUnit: 'sqft' as const,
  floors: 2,
  quality: 'premium' as const,
  interiorLevel: 'premium' as const,
  contingencyPercent: 10,
  targetReductionInr: 500_000,
};

describe('analyseConstructionCostOptimization', () => {
  it('returns savings levers and excludes structural auto-downgrades', () => {
    const result = analyseConstructionCostOptimization(base);
    expect(result.currentEstimateInr).toBeGreaterThan(0);
    expect(result.groups.safePlanning.length + result.groups.finishSpec.length).toBeGreaterThan(0);
    expect(result.structuralExclusions).toHaveLength(STRUCTURAL_EXCLUSIONS.length);
    const ids = result.levers.map((l) => l.id);
    expect(ids).not.toContain('reinforcement');
    expect(ids).not.toContain('concrete_strength');
    expect(ids).not.toContain('foundation_design');
    expect(result.disclaimer.toLowerCase()).toMatch(/structural|reinforcement/);
  });

  it('marks professional-review levers as non-selectable', () => {
    const result = analyseConstructionCostOptimization(base);
    for (const lever of result.groups.professionalReview) {
      expect(lever.selectable).toBe(false);
    }
  });
});

describe('applyCostOptimizationLevers', () => {
  it('reduces total when finish/planning levers are applied', () => {
    const applied = applyCostOptimizationLevers(base, [
      'quality_step_down',
      'flooring_spec',
      'paint_spec',
    ]);
    expect(applied.revisedTotal).toBeLessThan(applied.originalTotal);
    expect(applied.savingsInr).toBeGreaterThan(0);
    expect(applied.comparisonScenarios).toHaveLength(2);
    expect(applied.appliedLeverIds).toContain('quality_step_down');
  });

  it('ignores professional-review levers even if selected', () => {
    const applied = applyCostOptimizationLevers(base, ['contingency_review']);
    expect(applied.appliedLeverIds).toHaveLength(0);
    expect(applied.savingsInr).toBe(0);
  });

  it('never changes floors as an auto structural cut', () => {
    const applied = applyCostOptimizationLevers(base, ['area_trim_5']);
    expect(applied.comparisonScenarios[1]!.floors).toBe(base.floors);
  });
});

describe('suggestLeversForTarget', () => {
  it('picks selectable levers toward the target savings', () => {
    const ids = suggestLeversForTarget(base);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids).not.toContain('contingency_review');
    const applied = applyCostOptimizationLevers(base, ids);
    expect(applied.savingsInr).toBeGreaterThan(0);
  });
});
