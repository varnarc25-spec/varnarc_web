/** Cost-change simulator helpers — always call calculateConstructionCost (no duplicate model). */

import { calculateConstructionCost } from './calculate';
import { DEFAULT_MARKET_RATES } from './rates';
import type {
  ConstructionCostInput,
  ConstructionCostInterior,
  ConstructionCostQuality,
  ConstructionCostResult,
} from './types';

export type CostSimulatorState = {
  location: string;
  builtUpArea: number;
  quality: ConstructionCostQuality;
  floors: number;
  steelRatePerKg: number;
  cementRatePerBag: number;
  labourRateIndex: number;
  contingencyPercent: number;
  interiorLevel: ConstructionCostInterior;
};

export const DEFAULT_COST_SIMULATOR_STATE: CostSimulatorState = {
  location: 'Hyderabad',
  builtUpArea: 1500,
  quality: 'standard',
  floors: 2,
  steelRatePerKg: DEFAULT_MARKET_RATES.steelRatePerKg,
  cementRatePerBag: DEFAULT_MARKET_RATES.cementRatePerBag,
  labourRateIndex: DEFAULT_MARKET_RATES.labourRateIndex,
  contingencyPercent: 10,
  interiorLevel: 'standard',
};

export function simulatorStateToInput(state: CostSimulatorState): ConstructionCostInput {
  return {
    location: state.location,
    propertyType: 'independent_house',
    builtUpArea: state.builtUpArea,
    areaUnit: 'sqft',
    floors: state.floors,
    quality: state.quality,
    interiorLevel: state.interiorLevel,
    contingencyPercent: state.contingencyPercent,
    basement: false,
    parkingSlots: 0,
    lift: false,
    compoundWall: false,
    modularKitchen: false,
    overrides: {
      steelRatePerKg: state.steelRatePerKg,
      cementRatePerBag: state.cementRatePerBag,
      labourRateIndex: state.labourRateIndex,
    },
  };
}

export type CostChangeInsight = {
  id: string;
  text: string;
  deltaInr: number;
};

export type CostSimulatorResult = {
  current: ConstructionCostResult;
  baseline: ConstructionCostResult;
  costChangeInr: number;
  costChangePercent: number;
  insights: CostChangeInsight[];
};

function formatSignedInr(n: number): string {
  const abs = Math.abs(Math.round(n));
  const formatted = abs.toLocaleString('en-IN');
  if (n > 0) return `₹${formatted}`;
  if (n < 0) return `−₹${formatted}`;
  return `₹${formatted}`;
}

/**
 * Interactive “What changes my construction cost?” simulation.
 * Every figure comes from calculateConstructionCost — no parallel formula.
 */
export function simulateConstructionCostChange(
  state: CostSimulatorState,
  baselineState: CostSimulatorState = DEFAULT_COST_SIMULATOR_STATE,
): CostSimulatorResult {
  const current = calculateConstructionCost(simulatorStateToInput(state));
  const baseline = calculateConstructionCost(simulatorStateToInput(baselineState));
  const costChangeInr = current.estimatedTotal - baseline.estimatedTotal;
  const costChangePercent =
    baseline.estimatedTotal > 0
      ? Math.round((costChangeInr / baseline.estimatedTotal) * 1000) / 10
      : 0;

  const insights: CostChangeInsight[] = [];

  // Area +100 sq ft insight (engine-run)
  const areaPlus = calculateConstructionCost(
    simulatorStateToInput({ ...state, builtUpArea: state.builtUpArea + 100 }),
  );
  const areaDelta = areaPlus.estimatedTotal - current.estimatedTotal;
  insights.push({
    id: 'area-100',
    text: `Adding 100 sq ft increases this estimate by approximately ${formatSignedInr(areaDelta)}.`,
    deltaInr: areaDelta,
  });

  // Steel +₹5/kg
  const steelPlus = calculateConstructionCost(
    simulatorStateToInput({
      ...state,
      steelRatePerKg: state.steelRatePerKg + 5,
    }),
  );
  const steelDelta = steelPlus.estimatedTotal - current.estimatedTotal;
  insights.push({
    id: 'steel-5',
    text: `Increasing the steel rate by ₹5/kg changes estimated project cost by approximately ${formatSignedInr(steelDelta)}.`,
    deltaInr: steelDelta,
  });

  // Cement +₹20/bag
  const cementPlus = calculateConstructionCost(
    simulatorStateToInput({
      ...state,
      cementRatePerBag: state.cementRatePerBag + 20,
    }),
  );
  const cementDelta = cementPlus.estimatedTotal - current.estimatedTotal;
  insights.push({
    id: 'cement-20',
    text: `Increasing the cement rate by ₹20/bag changes estimated project cost by approximately ${formatSignedInr(cementDelta)}.`,
    deltaInr: cementDelta,
  });

  // One more floor
  const floorPlus = calculateConstructionCost(
    simulatorStateToInput({ ...state, floors: state.floors + 1 }),
  );
  const floorDelta = floorPlus.estimatedTotal - current.estimatedTotal;
  insights.push({
    id: 'floor-plus',
    text: `Adding one more floor changes this estimate by approximately ${formatSignedInr(floorDelta)} (same built-up area assumption).`,
    deltaInr: floorDelta,
  });

  return {
    current,
    baseline,
    costChangeInr,
    costChangePercent,
    insights,
  };
}
