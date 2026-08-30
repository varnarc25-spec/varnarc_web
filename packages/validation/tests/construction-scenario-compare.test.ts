import { describe, expect, it } from 'vitest';
import {
  compareConstructionScenarios,
  decodeScenarioSharePayload,
  defaultScenarioConfigs,
  duplicateScenario,
  encodeScenarioSharePayload,
  estimateScenarioMaterials,
} from '../src/construction-scenario-compare';

describe('compareConstructionScenarios', () => {
  it('compares standard vs premium and highlights lowest cost', () => {
    const scenarios = defaultScenarioConfigs();
    const result = compareConstructionScenarios({ scenarios });
    expect(result.scenarios).toHaveLength(2);
    expect(result.highlights.lowestCostScenarioId).toBe('s1');
    expect(result.highlights.highestCostScenarioId).toBe('s2');
    expect(result.highlights.maxAbsoluteDifference).toBeGreaterThan(0);
    expect(result.scenarios[0]!.materialCost).toBeGreaterThan(0);
    expect(result.scenarios[0]!.labourCost).toBeGreaterThan(0);
    expect(result.scenarios[0]!.durationMonths).toBeGreaterThan(0);
    expect(result.scenarios[0]!.materials.cementBags).toBeGreaterThan(0);
    expect(result.disclaimer.toLowerCase()).toMatch(/indicative|not quotations/);
  });

  it('supports up to 3 scenarios including city and area diffs', () => {
    const result = compareConstructionScenarios({
      scenarios: [
        {
          id: 'a',
          label: 'Hyd 1500',
          location: 'Hyderabad',
          propertyType: 'independent_house',
          builtUpArea: 1500,
          areaUnit: 'sqft',
          floors: 2,
          quality: 'standard',
          contingencyPercent: 10,
        },
        {
          id: 'b',
          label: 'Blr 1500',
          location: 'Bengaluru',
          propertyType: 'independent_house',
          builtUpArea: 1500,
          areaUnit: 'sqft',
          floors: 2,
          quality: 'standard',
          contingencyPercent: 10,
        },
        {
          id: 'c',
          label: 'Hyd 1800',
          location: 'Hyderabad',
          propertyType: 'independent_house',
          builtUpArea: 1800,
          areaUnit: 'sqft',
          floors: 2,
          quality: 'standard',
          contingencyPercent: 10,
        },
      ],
    });
    expect(result.scenarios).toHaveLength(3);
    const hyd = result.scenarios.find((s) => s.config.id === 'a')!;
    const blr = result.scenarios.find((s) => s.config.id === 'b')!;
    expect(blr.estimatedTotal).toBeGreaterThan(hyd.estimatedTotal);
    expect(result.highlights.largestCostDrivers.length).toBeGreaterThan(0);
  });

  it('rejects more than 3 scenarios', () => {
    const base = defaultScenarioConfigs()[0]!;
    expect(() =>
      compareConstructionScenarios({
        scenarios: [1, 2, 3, 4].map((n) => ({ ...base, id: `s${n}`, label: `S${n}` })),
      }),
    ).toThrow();
  });
});

describe('share encode/decode', () => {
  it('round-trips a stable payload', () => {
    const scenarios = defaultScenarioConfigs();
    const encoded = encodeScenarioSharePayload(scenarios);
    expect(encoded).not.toMatch(/[+/=]/);
    const decoded = decodeScenarioSharePayload(encoded);
    expect(decoded).toHaveLength(2);
    expect(decoded![0]!.location).toBe('Hyderabad');
    expect(decoded![1]!.quality).toBe('premium');
  });
});

describe('duplicateScenario', () => {
  it('copies and patches selected attributes', () => {
    const src = defaultScenarioConfigs()[0]!;
    const copy = duplicateScenario(src, {
      id: 's3',
      floors: 3,
      label: 'G+2 copy',
    });
    expect(copy.builtUpArea).toBe(src.builtUpArea);
    expect(copy.floors).toBe(3);
    expect(copy.id).toBe('s3');
  });
});

describe('estimateScenarioMaterials', () => {
  it('scales with area and quality', () => {
    const std = estimateScenarioMaterials(1500, 'standard');
    const lux = estimateScenarioMaterials(1500, 'luxury');
    expect(lux.steelKg).toBeGreaterThan(std.steelKg);
  });
});
