import { applyWastage } from '../construction-engine/wastage';
import { convertUnit } from '../construction-engine/units';
import { roundMoney, roundQuantity } from '../construction-engine/money';
import { resolveMixRatio } from '../cement-calculator/rates';
import type { CementMixPreset } from '../cement-calculator/types';
import {
  AGGREGATE_CALC_VERSION,
  AGGREGATE_USE_CASE_LABELS,
  DEFAULT_AGGREGATE_DENSITY_KG_PER_M3,
  M3_TO_FT3,
  dryFactorForAggregateUseCase,
} from './rates';
import {
  aggregateCalculatorInputSchema,
  type AggregateCalculatorInput,
  type AggregateCalculatorResult,
} from './types';

function requireConvert(value: number, from: string, to: string): number {
  if (to === 'm3' && (from === 'liter' || from === 'litre' || from === 'l')) {
    return value * 0.001;
  }
  const r = convertUnit(value, from, to);
  if (!r.ok) throw new Error(r.error);
  return r.value;
}

function toM(value: number, unit: string): number {
  return requireConvert(value, unit, 'm');
}

/**
 * Aggregate (jelly / crushed stone) quantity calculator.
 * Density and rates are caller-supplied and always reflected in result assumptions.
 */
export function calculateAggregateQuantity(
  raw: AggregateCalculatorInput,
): AggregateCalculatorResult {
  const input = aggregateCalculatorInputSchema.parse(raw);
  const steps: string[] = [];
  const density =
    input.densityKgPerM3 > 0 ? input.densityKgPerM3 : DEFAULT_AGGREGATE_DENSITY_KG_PER_M3;
  const dryFactor = dryFactorForAggregateUseCase(input.useCase);

  let wetVolumeM3: number;
  let dryVolumeM3: number | null = null;
  let mixLabel: string | null = null;
  let aggregateFraction: number | null = null;
  let aggBeforeWastageM3: number;

  if (input.useCase === 'concrete') {
    wetVolumeM3 = requireConvert(input.volume!, input.volumeUnit, 'm3');
    steps.push(
      `Wet concrete volume = ${input.volume} ${input.volumeUnit} = ${roundQuantity(wetVolumeM3, 4)} m³.`,
    );
    dryVolumeM3 = wetVolumeM3 * dryFactor!;
    steps.push(`Dry volume = wet × ${dryFactor} = ${roundQuantity(dryVolumeM3, 4)} m³.`);
    const mix = resolveMixRatio(input.mixPreset as CementMixPreset, {
      cementParts: input.cementParts,
      sandParts: input.sandParts,
      aggregateParts: input.aggregateParts,
    });
    const partsSum = mix.cement + mix.sand + mix.aggregate;
    if (mix.aggregate <= 0) {
      throw new Error(
        'Selected mix has no aggregate share — choose a concrete mix with aggregate.',
      );
    }
    aggregateFraction = mix.aggregate / partsSum;
    mixLabel = mix.label;
    aggBeforeWastageM3 = dryVolumeM3 * aggregateFraction;
    steps.push(
      `Mix ${mix.label} → aggregate fraction = ${mix.aggregate}/${roundQuantity(partsSum, 4)} = ${roundQuantity(aggregateFraction, 4)}.`,
    );
    steps.push(
      `Aggregate volume (before wastage) = dry × fraction = ${roundQuantity(aggBeforeWastageM3, 4)} m³.`,
    );
  } else if (input.useCase === 'generic_fill') {
    if (input.volume != null) {
      wetVolumeM3 = requireConvert(input.volume, input.volumeUnit, 'm3');
      steps.push(
        `Fill volume = ${input.volume} ${input.volumeUnit} = ${roundQuantity(wetVolumeM3, 4)} m³.`,
      );
    } else {
      const L = toM(input.length!, input.lengthUnit);
      const W = toM(input.width!, input.widthUnit);
      const D = toM(input.depth!, input.depthUnit);
      wetVolumeM3 = L * W * D;
      steps.push(
        `Fill volume = L × W × D = ${roundQuantity(L, 4)} × ${roundQuantity(W, 4)} × ${roundQuantity(D, 4)} = ${roundQuantity(wetVolumeM3, 4)} m³.`,
      );
    }
    aggBeforeWastageM3 = wetVolumeM3;
    steps.push('Generic fill uses geometric volume as aggregate volume (no mix fraction).');
  } else {
    // area_depth
    const areaM2 = requireConvert(input.area!, input.areaUnit, 'm2');
    const depthM = toM(input.thickness!, input.thicknessUnit);
    wetVolumeM3 = areaM2 * depthM;
    steps.push(
      `Area = ${input.area} ${input.areaUnit} = ${roundQuantity(areaM2, 4)} m²; depth = ${roundQuantity(depthM, 6)} m.`,
    );
    steps.push(`Volume = area × depth = ${roundQuantity(wetVolumeM3, 4)} m³.`);
    aggBeforeWastageM3 = wetVolumeM3;
  }

  const wastage = applyWastage(aggBeforeWastageM3, input.wastagePercent);
  if (!wastage.ok) throw new Error(wastage.error);
  const aggregateVolumeM3 = roundQuantity(wastage.value, 4);
  const wastageExtraM3 = roundQuantity(aggregateVolumeM3 - aggBeforeWastageM3, 4);
  steps.push(
    `Apply wastage ${input.wastagePercent}% → ${aggregateVolumeM3} m³ (extra ${wastageExtraM3} m³).`,
  );

  const aggregateVolumeFt3 = roundQuantity(aggregateVolumeM3 * M3_TO_FT3, 4);
  steps.push(`Unit conversion: ${aggregateVolumeM3} m³ ≈ ${aggregateVolumeFt3} ft³.`);

  const estimatedKg = roundQuantity(aggregateVolumeM3 * density, 2);
  const estimatedTonnes = roundQuantity(estimatedKg / 1000, 4);
  steps.push(
    `Mass using density ${density} kg/m³ (user assumption) → ${estimatedKg} kg = ${estimatedTonnes} tonnes.`,
  );

  let estimatedCostInr: number | null = null;
  let rateBasis: 'm3' | 'tonne' | null = null;
  if (input.ratePerM3Inr != null && input.ratePerM3Inr > 0) {
    estimatedCostInr = roundMoney(aggregateVolumeM3 * input.ratePerM3Inr);
    rateBasis = 'm3';
    steps.push(
      `Cost = ${aggregateVolumeM3} m³ × ₹${input.ratePerM3Inr}/m³ = ₹${estimatedCostInr}.`,
    );
  } else if (input.ratePerTonneInr != null && input.ratePerTonneInr > 0) {
    estimatedCostInr = roundMoney(estimatedTonnes * input.ratePerTonneInr);
    rateBasis = 'tonne';
    steps.push(`Cost = ${estimatedTonnes} t × ₹${input.ratePerTonneInr}/t = ₹${estimatedCostInr}.`);
  }

  const formula =
    input.useCase === 'concrete'
      ? 'agg_m3 = wet_m3 × 1.54 × (agg_parts / Σparts) × (1 + wastage%)'
      : input.useCase === 'area_depth'
        ? 'agg_m3 = area × depth × (1 + wastage%)'
        : 'agg_m3 = volume_m3 × (1 + wastage%)';

  return {
    useCase: input.useCase,
    wetVolumeM3: roundQuantity(wetVolumeM3, 4),
    dryVolumeM3: dryVolumeM3 != null ? roundQuantity(dryVolumeM3, 4) : null,
    dryVolumeFactor: dryFactor,
    mixLabel,
    aggregateFraction: aggregateFraction != null ? roundQuantity(aggregateFraction, 4) : null,
    aggregateVolumeM3,
    aggregateVolumeFt3,
    aggregateVolumeBeforeWastageM3: roundQuantity(aggBeforeWastageM3, 4),
    wastagePercent: input.wastagePercent,
    wastageExtraM3,
    densityKgPerM3: density,
    estimatedKg,
    estimatedTonnes,
    estimatedCostInr,
    rateBasis,
    formula,
    steps,
    assumptions: [
      `Use case: ${AGGREGATE_USE_CASE_LABELS[input.useCase]}.`,
      dryFactor != null
        ? `Dry volume factor ${dryFactor}${mixLabel ? `; mix ${mixLabel}` : ''}.`
        : 'No dry-factor / mix fraction — geometric aggregate volume.',
      `Bulk density assumption ${density} kg/m³ (editable) — grading and moisture can change site mass.`,
      `Wastage ${input.wastagePercent}% applied to aggregate volume.`,
      'Indicative planning figures only — confirm size (20 mm / 40 mm) with drawings and supplier.',
    ],
    disclaimer:
      'This aggregate estimate is educational only. Density and rates are user assumptions, not market quotes. Compaction and voids affect purchased volume.',
    version: AGGREGATE_CALC_VERSION,
  };
}
