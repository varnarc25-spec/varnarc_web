import { calculateConstructionCost } from '../construction-cost/calculate';
import type {
  ConstructionCostInput,
  ConstructionCostInterior,
  ConstructionCostQuality,
} from '../construction-cost/types';
import {
  COST_OPTIMIZATION_VERSION,
  OPTIMIZATION_LEVER_TEMPLATES,
  STRUCTURAL_EXCLUSIONS,
  type LeverTemplate,
} from './catalog';
import {
  costOptimizationInputSchema,
  type AppliedOptimizationResult,
  type CostOptimizationInput,
  type CostOptimizationResult,
  type OptimizationLever,
} from './types';

const QUALITY_ORDER: ConstructionCostQuality[] = ['basic', 'standard', 'premium', 'luxury'];

const INTERIOR_ORDER: ConstructionCostInterior[] = ['shell', 'basic', 'standard', 'premium'];

function roundMoney(n: number): number {
  return Math.round(n);
}

function toEngineInput(input: CostOptimizationInput): ConstructionCostInput {
  return {
    location: input.location,
    propertyType: 'independent_house',
    builtUpArea: input.builtUpArea,
    areaUnit: input.areaUnit,
    floors: input.floors,
    quality: input.quality,
    interiorLevel: input.interiorLevel,
    contingencyPercent: input.contingencyPercent,
    basement: false,
    parkingSlots: 0,
    lift: false,
    compoundWall: false,
    modularKitchen: false,
  };
}

function stepQualityDown(q: ConstructionCostQuality): ConstructionCostQuality | null {
  const i = QUALITY_ORDER.indexOf(q);
  if (i <= 0) return null;
  return QUALITY_ORDER[i - 1]!;
}

function stepInteriorDown(level: ConstructionCostInterior): ConstructionCostInterior | null {
  const i = INTERIOR_ORDER.indexOf(level);
  if (i <= 0) return null;
  return INTERIOR_ORDER[i - 1]!;
}

function categoryAmount(
  result: ReturnType<typeof calculateConstructionCost>,
  categoryId: string,
): number {
  return result.categoryBreakdown.find((l) => l.id === categoryId)?.amount ?? 0;
}

function estimateLeverSavings(
  template: LeverTemplate,
  input: CostOptimizationInput,
  current: ReturnType<typeof calculateConstructionCost>,
): number {
  const base = toEngineInput(input);

  switch (template.estimate.kind) {
    case 'engine_area_pct': {
      const nextArea = Math.max(
        400,
        Math.round(input.builtUpArea * (1 - template.estimate.pct / 100)),
      );
      if (nextArea >= input.builtUpArea) return 0;
      const next = calculateConstructionCost({ ...base, builtUpArea: nextArea });
      return Math.max(0, current.estimatedTotal - next.estimatedTotal);
    }
    case 'engine_quality_step': {
      const q = stepQualityDown(input.quality);
      if (!q) return 0;
      const next = calculateConstructionCost({ ...base, quality: q });
      return Math.max(0, current.estimatedTotal - next.estimatedTotal);
    }
    case 'engine_interior_step': {
      const interior = stepInteriorDown(input.interiorLevel);
      if (!interior) return 0;
      const next = calculateConstructionCost({ ...base, interiorLevel: interior });
      return Math.max(0, current.estimatedTotal - next.estimatedTotal);
    }
    case 'category_share': {
      const line = categoryAmount(current, template.estimate.categoryId);
      return roundMoney(line * template.estimate.fraction);
    }
    case 'advisory_only': {
      return roundMoney(current.estimatedTotal * template.estimate.fractionOfTotal);
    }
    default:
      return 0;
  }
}

/**
 * Analyse safe budget-reduction options for a construction estimate.
 * Structural reinforcement, concrete strength and foundation design are never auto-downgraded.
 */
export function analyseConstructionCostOptimization(
  raw: CostOptimizationInput,
): CostOptimizationResult {
  const input = costOptimizationInputSchema.parse(raw);
  const current = calculateConstructionCost(toEngineInput(input));
  const currentEstimateInr = current.estimatedTotal;
  const targetReductionInr = roundMoney(input.targetReductionInr);
  const targetReductionPercent =
    currentEstimateInr > 0 ? Math.round((targetReductionInr / currentEstimateInr) * 1000) / 10 : 0;

  const levers: OptimizationLever[] = OPTIMIZATION_LEVER_TEMPLATES.map((t) => {
    const potentialSavingsInr = estimateLeverSavings(t, input, current);
    return {
      id: t.id,
      category: t.category,
      label: t.label,
      safetyClass: t.safetyClass,
      potentialSavingsInr,
      tradeOff: t.tradeOff,
      selectable: t.selectable && potentialSavingsInr > 0,
      structurallySafe: t.structurallySafe,
    };
  }).filter((l) => l.potentialSavingsInr > 0 || l.safetyClass === 'professional_review');

  // Sort each group by savings descending
  const sortBySavings = (a: OptimizationLever, b: OptimizationLever) =>
    b.potentialSavingsInr - a.potentialSavingsInr;

  const groups = {
    safePlanning: levers.filter((l) => l.safetyClass === 'safe_planning').sort(sortBySavings),
    finishSpec: levers.filter((l) => l.safetyClass === 'finish_spec').sort(sortBySavings),
    professionalReview: levers
      .filter((l) => l.safetyClass === 'professional_review')
      .sort(sortBySavings),
  };

  return {
    currency: 'INR',
    currentEstimateInr,
    targetReductionInr,
    targetReductionPercent,
    levers,
    groups,
    structuralExclusions: STRUCTURAL_EXCLUSIONS.map((e) => ({ ...e })),
    disclaimer:
      'These suggestions are educational planning aids only. They are not structural advice, quotations or guarantees. Never reduce reinforcement, concrete strength or foundation design to save money without a licensed structural engineer. Always verify finishes and budgets with your architect and contractor.',
    version: COST_OPTIMIZATION_VERSION,
  };
}

/**
 * Apply selected selectable levers and recompute via the central cost engine
 * plus finish-allocation savings. Professional-review levers are ignored unless
 * explicitly allowed (default: ignored for auto revise).
 */
export function applyCostOptimizationLevers(
  raw: CostOptimizationInput,
  selectedIds: string[],
): AppliedOptimizationResult {
  const input = costOptimizationInputSchema.parse(raw);
  const analysis = analyseConstructionCostOptimization(input);
  const selected = new Set(selectedIds);

  const original = calculateConstructionCost(toEngineInput(input));
  let patch = toEngineInput(input);
  let finishSavings = 0;
  const tradeOffs: string[] = [];
  const appliedLeverIds: string[] = [];

  for (const template of OPTIMIZATION_LEVER_TEMPLATES) {
    if (!selected.has(template.id)) continue;
    if (template.safetyClass === 'professional_review') continue; // never auto-apply
    if (!template.structurallySafe) continue; // belt-and-suspenders

    const lever = analysis.levers.find((l) => l.id === template.id);
    if (!lever?.selectable) continue;

    appliedLeverIds.push(template.id);
    tradeOffs.push(`${lever.label}: ${lever.tradeOff}`);

    switch (template.estimate.kind) {
      case 'engine_area_pct': {
        patch = {
          ...patch,
          builtUpArea: Math.max(
            400,
            Math.round(patch.builtUpArea * (1 - template.estimate.pct / 100)),
          ),
        };
        break;
      }
      case 'engine_quality_step': {
        const q = stepQualityDown(patch.quality);
        if (q) patch = { ...patch, quality: q };
        break;
      }
      case 'engine_interior_step': {
        const interior = stepInteriorDown(patch.interiorLevel ?? 'standard');
        if (interior) patch = { ...patch, interiorLevel: interior };
        break;
      }
      case 'category_share': {
        finishSavings += lever.potentialSavingsInr;
        break;
      }
      default:
        break;
    }
  }

  // If both 5% and 10% area trims selected, keep the larger trim only (already compounded if both applied — fix)
  if (selected.has('area_trim_5') && selected.has('area_trim_10')) {
    patch = {
      ...patch,
      builtUpArea: Math.max(400, Math.round(input.builtUpArea * 0.9)),
    };
  }

  const engineRevised = calculateConstructionCost(patch);
  const revisedTotal = Math.max(0, roundMoney(engineRevised.estimatedTotal - finishSavings));
  const savingsInr = Math.max(0, original.estimatedTotal - revisedTotal);
  const savingsPercent =
    original.estimatedTotal > 0
      ? Math.round((savingsInr / original.estimatedTotal) * 1000) / 10
      : 0;

  return {
    originalTotal: original.estimatedTotal,
    revisedTotal,
    savingsInr,
    savingsPercent,
    appliedLeverIds,
    tradeOffs,
    comparisonScenarios: [
      {
        id: 's1',
        label: 'Current plan',
        location: input.location,
        propertyType: 'independent_house',
        builtUpArea: input.builtUpArea,
        areaUnit: input.areaUnit,
        floors: input.floors,
        quality: input.quality,
        contingencyPercent: input.contingencyPercent,
      },
      {
        id: 's2',
        label: 'Optimized plan',
        location: input.location,
        propertyType: 'independent_house',
        builtUpArea: patch.builtUpArea,
        areaUnit: input.areaUnit,
        floors: input.floors,
        quality: patch.quality,
        contingencyPercent: input.contingencyPercent,
      },
    ],
  };
}

/**
 * Greedy selection of selectable levers to approach the savings target
 * without including professional-review or structural items.
 */
export function suggestLeversForTarget(raw: CostOptimizationInput): string[] {
  const analysis = analyseConstructionCostOptimization(raw);
  const target = analysis.targetReductionInr;
  const candidates = [...analysis.groups.safePlanning, ...analysis.groups.finishSpec]
    .filter((l) => l.selectable)
    .sort((a, b) => b.potentialSavingsInr - a.potentialSavingsInr);

  // Prefer not stacking both area trims
  const picked: string[] = [];
  let sum = 0;
  for (const lever of candidates) {
    if (lever.id === 'area_trim_5' && picked.includes('area_trim_10')) continue;
    if (lever.id === 'area_trim_10' && picked.includes('area_trim_5')) continue;
    picked.push(lever.id);
    sum += lever.potentialSavingsInr;
    if (sum >= target) break;
  }
  return picked;
}
