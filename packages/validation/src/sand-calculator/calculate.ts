import { applyWastage } from '../construction-engine/wastage';
import { convertUnit } from '../construction-engine/units';
import { roundMoney, roundQuantity } from '../construction-engine/money';
import { resolveMixRatio } from '../cement-calculator/rates';
import type { CementMixPreset } from '../cement-calculator/types';
import {
  DEFAULT_SAND_DENSITY_KG_PER_M3,
  M3_TO_FT3,
  SAND_CALC_VERSION,
  SAND_USE_CASE_LABELS,
  dryFactorForSandUseCase,
} from './rates';
import {
  sandCalculatorInputSchema,
  type SandCalculatorInput,
  type SandCalculatorResult,
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
 * Sand quantity calculator for concrete, masonry, plaster, filling and generic volume.
 * Density and rates are caller-supplied and always reflected in result assumptions.
 */
export function calculateSandQuantity(raw: SandCalculatorInput): SandCalculatorResult {
  const input = sandCalculatorInputSchema.parse(raw);
  const steps: string[] = [];
  const density = input.densityKgPerM3 > 0 ? input.densityKgPerM3 : DEFAULT_SAND_DENSITY_KG_PER_M3;
  const dryFactor = dryFactorForSandUseCase(input.useCase);

  let wetVolumeM3: number;
  let dryVolumeM3: number | null = null;
  let mixLabel: string | null = null;
  let sandFraction: number | null = null;
  let sandBeforeWastageM3: number;

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
    sandFraction = mix.sand / partsSum;
    mixLabel = mix.label;
    sandBeforeWastageM3 = dryVolumeM3 * sandFraction;
    steps.push(
      `Mix ${mix.label} → sand fraction = ${mix.sand}/${roundQuantity(partsSum, 4)} = ${roundQuantity(sandFraction, 4)}.`,
    );
    steps.push(
      `Sand volume (before wastage) = dry × fraction = ${roundQuantity(sandBeforeWastageM3, 4)} m³.`,
    );
  } else if (input.useCase === 'masonry' || input.useCase === 'plaster') {
    const areaM2 = requireConvert(input.area!, input.areaUnit, 'm2');
    const thicknessM = toM(input.thickness!, input.thicknessUnit);
    wetVolumeM3 = areaM2 * thicknessM;
    steps.push(
      `Area = ${input.area} ${input.areaUnit} = ${roundQuantity(areaM2, 4)} m²; thickness = ${roundQuantity(thicknessM, 6)} m.`,
    );
    steps.push(`Wet mortar volume = ${roundQuantity(wetVolumeM3, 4)} m³.`);
    dryVolumeM3 = wetVolumeM3 * dryFactor!;
    steps.push(`Dry volume = wet × ${dryFactor} = ${roundQuantity(dryVolumeM3, 4)} m³.`);
    const mix = resolveMixRatio(input.mixPreset as CementMixPreset, {
      cementParts: input.cementParts,
      sandParts: input.sandParts,
      aggregateParts: input.aggregateParts ?? 0,
    });
    const partsSum = mix.cement + mix.sand + mix.aggregate;
    sandFraction = mix.sand / partsSum;
    mixLabel = mix.label;
    sandBeforeWastageM3 = dryVolumeM3 * sandFraction;
    steps.push(`Mix ${mix.label} → sand fraction = ${roundQuantity(sandFraction, 4)}.`);
    steps.push(`Sand volume (before wastage) = ${roundQuantity(sandBeforeWastageM3, 4)} m³.`);
  } else if (input.useCase === 'filling') {
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
    sandBeforeWastageM3 = wetVolumeM3;
    steps.push('Filling uses the geometric volume as sand volume (no mix fraction).');
  } else {
    // generic_volume
    wetVolumeM3 = requireConvert(input.volume!, input.volumeUnit, 'm3');
    sandBeforeWastageM3 = wetVolumeM3;
    steps.push(
      `Generic sand volume = ${input.volume} ${input.volumeUnit} = ${roundQuantity(sandBeforeWastageM3, 4)} m³.`,
    );
  }

  const wastage = applyWastage(sandBeforeWastageM3, input.wastagePercent);
  if (!wastage.ok) throw new Error(wastage.error);
  const sandVolumeM3 = roundQuantity(wastage.value, 4);
  const wastageExtraM3 = roundQuantity(sandVolumeM3 - sandBeforeWastageM3, 4);
  steps.push(
    `Apply wastage ${input.wastagePercent}% → ${sandVolumeM3} m³ (extra ${wastageExtraM3} m³).`,
  );

  const sandVolumeFt3 = roundQuantity(sandVolumeM3 * M3_TO_FT3, 4);
  steps.push(`Unit conversion: ${sandVolumeM3} m³ ≈ ${sandVolumeFt3} ft³.`);

  const estimatedTonnes = roundQuantity((sandVolumeM3 * density) / 1000, 4);
  steps.push(`Mass using density ${density} kg/m³ (user assumption) → ${estimatedTonnes} tonnes.`);

  let estimatedCostInr: number | null = null;
  let rateBasis: 'm3' | 'tonne' | null = null;
  if (input.ratePerM3Inr != null && input.ratePerM3Inr > 0) {
    estimatedCostInr = roundMoney(sandVolumeM3 * input.ratePerM3Inr);
    rateBasis = 'm3';
    steps.push(`Cost = ${sandVolumeM3} m³ × ₹${input.ratePerM3Inr}/m³ = ₹${estimatedCostInr}.`);
  } else if (input.ratePerTonneInr != null && input.ratePerTonneInr > 0) {
    estimatedCostInr = roundMoney(estimatedTonnes * input.ratePerTonneInr);
    rateBasis = 'tonne';
    steps.push(`Cost = ${estimatedTonnes} t × ₹${input.ratePerTonneInr}/t = ₹${estimatedCostInr}.`);
  }

  const formula =
    input.useCase === 'concrete' || input.useCase === 'masonry' || input.useCase === 'plaster'
      ? 'sand_m3 = wet_m3 × dry_factor × (sand_parts / Σparts) × (1 + wastage%)'
      : 'sand_m3 = volume_m3 × (1 + wastage%)';

  return {
    useCase: input.useCase,
    wetVolumeM3: roundQuantity(wetVolumeM3, 4),
    dryVolumeM3: dryVolumeM3 != null ? roundQuantity(dryVolumeM3, 4) : null,
    dryVolumeFactor: dryFactor,
    mixLabel,
    sandFraction: sandFraction != null ? roundQuantity(sandFraction, 4) : null,
    sandVolumeM3,
    sandVolumeFt3,
    sandVolumeBeforeWastageM3: roundQuantity(sandBeforeWastageM3, 4),
    wastagePercent: input.wastagePercent,
    wastageExtraM3,
    densityKgPerM3: density,
    estimatedTonnes,
    estimatedCostInr,
    rateBasis,
    formula,
    steps,
    assumptions: [
      `Use case: ${SAND_USE_CASE_LABELS[input.useCase]}.`,
      dryFactor != null
        ? `Dry volume factor ${dryFactor}${mixLabel ? `; mix ${mixLabel}` : ''}.`
        : 'No dry-factor / mix fraction — geometric sand volume.',
      `Bulk density assumption ${density} kg/m³ (editable) — moisture and bulking can change site mass.`,
      `Wastage ${input.wastagePercent}% applied to sand volume.`,
      'Indicative planning figures only — confirm grading and moisture with supplier.',
    ],
    disclaimer:
      'This sand estimate is educational only. Density and rates are user assumptions, not market quotes. Site bulking and moisture content affect purchased volume.',
    version: SAND_CALC_VERSION,
  };
}
