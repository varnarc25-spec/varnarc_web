import { describe, expect, it } from 'vitest';
import {
  DEFAULT_COST_SIMULATOR_STATE,
  DEFAULT_MARKET_RATES,
  calculateConstructionCost,
  simulateConstructionCostChange,
} from '../src/construction-cost';

describe('commodity rate overrides in calculateConstructionCost', () => {
  const base = {
    location: 'Hyderabad',
    propertyType: 'independent_house' as const,
    builtUpArea: 1500,
    areaUnit: 'sqft' as const,
    floors: 2,
    quality: 'standard' as const,
    contingencyPercent: 10,
    basement: false,
    parkingSlots: 0,
    lift: false,
    compoundWall: false,
    modularKitchen: false,
  };

  it('raises total when steel rate rises above market default', () => {
    const market = calculateConstructionCost({
      ...base,
      overrides: { steelRatePerKg: DEFAULT_MARKET_RATES.steelRatePerKg },
    });
    const higher = calculateConstructionCost({
      ...base,
      overrides: { steelRatePerKg: DEFAULT_MARKET_RATES.steelRatePerKg + 10 },
    });
    expect(higher.estimatedTotal).toBeGreaterThan(market.estimatedTotal);
  });

  it('raises labour when labour index is above 100', () => {
    const market = calculateConstructionCost({
      ...base,
      overrides: { labourRateIndex: 100 },
    });
    const higher = calculateConstructionCost({
      ...base,
      overrides: { labourRateIndex: 120 },
    });
    expect(higher.labourCost).toBeGreaterThan(market.labourCost);
  });
});

describe('simulateConstructionCostChange', () => {
  it('returns deltas and engine-backed insights vs baseline', () => {
    const sim = simulateConstructionCostChange({
      ...DEFAULT_COST_SIMULATOR_STATE,
      builtUpArea: 1800,
      quality: 'premium',
    });
    expect(sim.current.estimatedTotal).toBeGreaterThan(sim.baseline.estimatedTotal);
    expect(sim.costChangeInr).toBe(sim.current.estimatedTotal - sim.baseline.estimatedTotal);
    expect(sim.insights.some((i) => i.id === 'area-100')).toBe(true);
    expect(sim.insights.some((i) => i.id === 'steel-5')).toBe(true);
    expect(sim.insights.find((i) => i.id === 'steel-5')!.deltaInr).toBeGreaterThan(0);
    expect(sim.current.disclaimer.toLowerCase()).toMatch(/indicative|education/);
  });

  it('shows near-zero change when state matches defaults', () => {
    const sim = simulateConstructionCostChange(DEFAULT_COST_SIMULATOR_STATE);
    expect(Math.abs(sim.costChangeInr)).toBeLessThan(1);
    expect(sim.costChangePercent).toBe(0);
  });
});
