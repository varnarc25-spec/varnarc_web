import { calculateConstructionCost } from '../construction-cost/calculate';
import { toSqft } from '../construction-cost/rates';
import {
  MATERIAL_PER_SQFT,
  QUALITY_QTY_FACTOR,
  SCENARIO_COMPARE_VERSION,
  estimateDurationMonths,
} from './rates';
import {
  scenarioCompareInputSchema,
  type ScenarioCompareInput,
  type ScenarioCompareResult,
  type ScenarioComputed,
  type ScenarioConfig,
  type ScenarioMaterialQuantities,
} from './types';

function roundQty(n: number): number {
  return Math.round(n);
}

export function estimateScenarioMaterials(
  areaSqft: number,
  quality: ScenarioConfig['quality'],
): ScenarioMaterialQuantities {
  const q = QUALITY_QTY_FACTOR[quality] ?? 1;
  return {
    cementBags: roundQty(areaSqft * MATERIAL_PER_SQFT.cementBags * q),
    steelKg: roundQty(areaSqft * MATERIAL_PER_SQFT.steelKg * q),
    sandCft: roundQty(areaSqft * MATERIAL_PER_SQFT.sandCft * q),
    aggregateCft: roundQty(areaSqft * MATERIAL_PER_SQFT.aggregateCft * q),
    bricks: roundQty(areaSqft * MATERIAL_PER_SQFT.bricks * q),
  };
}

function computeOne(config: ScenarioConfig): ScenarioComputed {
  const cost = calculateConstructionCost({
    mode: 'forward',
    location: config.location,
    propertyType: config.propertyType,
    builtUpArea: config.builtUpArea,
    areaUnit: config.areaUnit,
    floors: config.floors,
    quality: config.quality,
    contingencyPercent: config.contingencyPercent,
    basement: false,
    parkingSlots: 0,
    lift: false,
    compoundWall: false,
    modularKitchen: false,
  });
  const top =
    [...cost.categoryBreakdown]
      .filter((l) => l.id !== 'contingency')
      .sort((a, b) => b.amount - a.amount)[0] ?? null;

  return {
    config,
    estimatedTotal: cost.estimatedTotal,
    costPerSqft: cost.costPerSqft,
    materialCost: cost.materialCost,
    labourCost: cost.labourCost,
    contingencyAmount: cost.contingencyAmount,
    contingencyPercent: cost.contingencyPercent,
    durationMonths: estimateDurationMonths(config.floors),
    materials: estimateScenarioMaterials(cost.areaSqft, config.quality),
    topDriver: top ? { id: top.id, label: top.label, amount: top.amount } : null,
    rangeLow: cost.rangeLow,
    rangeHigh: cost.rangeHigh,
    areaSqft: cost.areaSqft,
  };
}

/**
 * Compare up to 3 construction configurations side by side.
 * Estimates are indicative — not quotations.
 */
export function compareConstructionScenarios(raw: ScenarioCompareInput): ScenarioCompareResult {
  const input = scenarioCompareInputSchema.parse(raw);
  const scenarios = input.scenarios.map(computeOne);

  const sortedByCost = [...scenarios].sort((a, b) => a.estimatedTotal - b.estimatedTotal);
  const lowest = sortedByCost[0]!;
  const highest = sortedByCost[sortedByCost.length - 1]!;
  const maxAbsoluteDifference = highest.estimatedTotal - lowest.estimatedTotal;

  const largestCostDrivers = scenarios
    .filter((s) => s.topDriver)
    .map((s) => ({
      scenarioId: s.config.id,
      scenarioLabel: s.config.label,
      driverId: s.topDriver!.id,
      driverLabel: s.topDriver!.label,
      amount: s.topDriver!.amount,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  return {
    scenarios,
    highlights: {
      lowestCostScenarioId: lowest.config.id,
      highestCostScenarioId: highest.config.id,
      highestDifferenceScenarioId: highest.config.id,
      maxAbsoluteDifference,
      largestCostDrivers,
    },
    disclaimer:
      'Scenario comparison uses indicative Varnarc cost and quantity models. Figures are educational planning aids — not quotations, tenders, or guarantees. Verify with local contractors and suppliers.',
    version: SCENARIO_COMPARE_VERSION,
  };
}

/** Compact share payload (stable, URL-safe when base64url-encoded). */
export type ScenarioSharePayload = {
  v: 1;
  scenarios: Array<{
    id: string;
    label: string;
    location: string;
    propertyType: ScenarioConfig['propertyType'];
    builtUpArea: number;
    areaUnit: ScenarioConfig['areaUnit'];
    floors: number;
    quality: ScenarioConfig['quality'];
    contingencyPercent: number;
  }>;
};

export function encodeScenarioSharePayload(scenarios: ScenarioConfig[]): string {
  const payload: ScenarioSharePayload = {
    v: 1,
    scenarios: scenarios.slice(0, 3).map((s) => ({
      id: s.id,
      label: s.label.slice(0, 80),
      location: s.location.slice(0, 80),
      propertyType: s.propertyType,
      builtUpArea: s.builtUpArea,
      areaUnit: s.areaUnit,
      floors: s.floors,
      quality: s.quality,
      contingencyPercent: s.contingencyPercent,
    })),
  };
  const json = JSON.stringify(payload);
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(json, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  // browser
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeScenarioSharePayload(encoded: string): ScenarioConfig[] | null {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
    let json: string;
    if (typeof Buffer !== 'undefined') {
      json = Buffer.from(padded + pad, 'base64').toString('utf8');
    } else {
      json = decodeURIComponent(escape(atob(padded + pad)));
    }
    const data = JSON.parse(json) as ScenarioSharePayload;
    if (data.v !== 1 || !Array.isArray(data.scenarios) || data.scenarios.length < 1) {
      return null;
    }
    return data.scenarios.slice(0, 3).map((s, i) =>
      scenarioCompareInputSchema.shape.scenarios.element.parse({
        ...s,
        id: s.id || `s${i + 1}`,
        label: s.label || `Scenario ${i + 1}`,
      }),
    );
  } catch {
    return null;
  }
}

export function defaultScenarioConfigs(): ScenarioConfig[] {
  return [
    {
      id: 's1',
      label: 'Standard · Hyderabad · G+1 · 1500 sqft',
      location: 'Hyderabad',
      propertyType: 'independent_house',
      builtUpArea: 1500,
      areaUnit: 'sqft',
      floors: 2,
      quality: 'standard',
      contingencyPercent: 10,
    },
    {
      id: 's2',
      label: 'Premium · Hyderabad · G+1 · 1500 sqft',
      location: 'Hyderabad',
      propertyType: 'independent_house',
      builtUpArea: 1500,
      areaUnit: 'sqft',
      floors: 2,
      quality: 'premium',
      contingencyPercent: 10,
    },
  ];
}

export function duplicateScenario(
  source: ScenarioConfig,
  patch: Partial<Omit<ScenarioConfig, 'id'>> & { id: string; label?: string },
): ScenarioConfig {
  return {
    ...source,
    ...patch,
    label: patch.label ?? `${source.label} (copy)`,
  };
}

export { toSqft };
