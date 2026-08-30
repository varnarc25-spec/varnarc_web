import { applyWastage } from '../construction-engine/wastage';
import { convertUnit } from '../construction-engine/units';
import { roundMoney, roundQuantity } from '../construction-engine/money';
import {
  CEMENT_DENSITY_KG_PER_M3,
  CONCRETE_CALC_VERSION,
  CONCRETE_DRY_FACTOR,
  M3_TO_FT3,
  SHAPE_FORMULAS,
  SHAPE_LABELS,
  resolveConcreteMix,
} from './rates';
import {
  concreteCalculatorInputSchema,
  type ConcreteCalculatorInput,
  type ConcreteCalculatorResult,
  type ConcreteMaterialBreakdown,
} from './types';

function requireConvert(value: number, from: string, to: string): number {
  const r = convertUnit(value, from, to);
  if (!r.ok) throw new Error(r.error);
  return r.value;
}

function toM(value: number, unit: string): number {
  return requireConvert(value, unit, 'm');
}

/**
 * Wet concrete volume from geometric shape inputs (all dimensions converted to metres).
 */
export function computeWetVolumeM3(input: ReturnType<typeof concreteCalculatorInputSchema.parse>): {
  wetVolumeM3: number;
  dimensionsM: Record<string, number>;
  steps: string[];
} {
  const steps: string[] = [];
  const dimensionsM: Record<string, number> = {};

  switch (input.shape) {
    case 'slab': {
      const L = toM(input.length!, input.lengthUnit);
      const W = toM(input.width!, input.widthUnit);
      const T = toM(input.thickness!, input.thicknessUnit);
      dimensionsM.length = roundQuantity(L, 6);
      dimensionsM.width = roundQuantity(W, 6);
      dimensionsM.thickness = roundQuantity(T, 6);
      const wet = L * W * T;
      steps.push(
        `Convert: L=${input.length} ${input.lengthUnit} → ${dimensionsM.length} m; W=${input.width} ${input.widthUnit} → ${dimensionsM.width} m; T=${input.thickness} ${input.thicknessUnit} → ${dimensionsM.thickness} m.`,
      );
      steps.push(
        `Wet volume V = L × W × T = ${dimensionsM.length} × ${dimensionsM.width} × ${dimensionsM.thickness} = ${roundQuantity(wet, 4)} m³.`,
      );
      return { wetVolumeM3: wet, dimensionsM, steps };
    }
    case 'rectangular_footing': {
      const L = toM(input.length!, input.lengthUnit);
      const W = toM(input.width!, input.widthUnit);
      const D = toM(input.depth!, input.depthUnit);
      dimensionsM.length = roundQuantity(L, 6);
      dimensionsM.width = roundQuantity(W, 6);
      dimensionsM.depth = roundQuantity(D, 6);
      const wet = L * W * D;
      steps.push(
        `Convert: L=${input.length} ${input.lengthUnit} → ${dimensionsM.length} m; W=${input.width} ${input.widthUnit} → ${dimensionsM.width} m; D=${input.depth} ${input.depthUnit} → ${dimensionsM.depth} m.`,
      );
      steps.push(
        `Wet volume V = L × W × D = ${dimensionsM.length} × ${dimensionsM.width} × ${dimensionsM.depth} = ${roundQuantity(wet, 4)} m³.`,
      );
      return { wetVolumeM3: wet, dimensionsM, steps };
    }
    case 'column':
    case 'custom_rectangular': {
      const L = toM(input.length!, input.lengthUnit);
      const W = toM(input.width!, input.widthUnit);
      const H = toM(input.height!, input.heightUnit);
      dimensionsM.length = roundQuantity(L, 6);
      dimensionsM.width = roundQuantity(W, 6);
      dimensionsM.height = roundQuantity(H, 6);
      const wet = L * W * H;
      steps.push(
        `Convert: L=${input.length} ${input.lengthUnit} → ${dimensionsM.length} m; W=${input.width} ${input.widthUnit} → ${dimensionsM.width} m; H=${input.height} ${input.heightUnit} → ${dimensionsM.height} m.`,
      );
      steps.push(
        `Wet volume V = L × W × H = ${dimensionsM.length} × ${dimensionsM.width} × ${dimensionsM.height} = ${roundQuantity(wet, 4)} m³.`,
      );
      return { wetVolumeM3: wet, dimensionsM, steps };
    }
    case 'wall': {
      const L = toM(input.length!, input.lengthUnit);
      const H = toM(input.height!, input.heightUnit);
      const T = toM(input.thickness!, input.thicknessUnit);
      dimensionsM.length = roundQuantity(L, 6);
      dimensionsM.height = roundQuantity(H, 6);
      dimensionsM.thickness = roundQuantity(T, 6);
      const wet = L * H * T;
      steps.push(
        `Convert: L=${input.length} ${input.lengthUnit} → ${dimensionsM.length} m; H=${input.height} ${input.heightUnit} → ${dimensionsM.height} m; T=${input.thickness} ${input.thicknessUnit} → ${dimensionsM.thickness} m.`,
      );
      steps.push(
        `Wet volume V = L × H × T = ${dimensionsM.length} × ${dimensionsM.height} × ${dimensionsM.thickness} = ${roundQuantity(wet, 4)} m³.`,
      );
      return { wetVolumeM3: wet, dimensionsM, steps };
    }
    case 'circular_column': {
      const H = toM(input.height!, input.heightUnit);
      let r: number;
      if (input.radius != null) {
        r = toM(input.radius, input.radiusUnit);
        steps.push(
          `Convert: r=${input.radius} ${input.radiusUnit} → ${roundQuantity(r, 6)} m; H=${input.height} ${input.heightUnit} → ${roundQuantity(H, 6)} m.`,
        );
      } else {
        const d = toM(input.diameter!, input.diameterUnit);
        r = d / 2;
        steps.push(
          `Convert: Ø=${input.diameter} ${input.diameterUnit} → ${roundQuantity(d, 6)} m → r = Ø/2 = ${roundQuantity(r, 6)} m; H=${input.height} ${input.heightUnit} → ${roundQuantity(H, 6)} m.`,
        );
        dimensionsM.diameter = roundQuantity(d, 6);
      }
      dimensionsM.radius = roundQuantity(r, 6);
      dimensionsM.height = roundQuantity(H, 6);
      const wet = Math.PI * r * r * H;
      steps.push(
        `Wet volume V = π × r² × H = π × ${dimensionsM.radius}² × ${dimensionsM.height} = ${roundQuantity(wet, 4)} m³.`,
      );
      return { wetVolumeM3: wet, dimensionsM, steps };
    }
    default:
      throw new Error(`Unsupported shape: ${input.shape as string}`);
  }
}

function buildMaterials(
  orderVolumeM3: number,
  mix: ReturnType<typeof resolveConcreteMix>,
  waterCementRatio: number,
  steps: string[],
): ConcreteMaterialBreakdown {
  const dryVolumeM3 = orderVolumeM3 * CONCRETE_DRY_FACTOR;
  const partsSum = mix.cement + mix.sand + mix.aggregate;
  if (partsSum <= 0) throw new Error('Mix parts must sum to a positive number.');

  const cementVol = dryVolumeM3 * (mix.cement / partsSum);
  const sandVol = dryVolumeM3 * (mix.sand / partsSum);
  const aggVol = dryVolumeM3 * (mix.aggregate / partsSum);
  const cementKg = cementVol * CEMENT_DENSITY_KG_PER_M3;
  const waterLitres = roundQuantity(cementKg * waterCementRatio, 2);

  steps.push(
    `Dry volume for materials = order volume × ${CONCRETE_DRY_FACTOR} = ${roundQuantity(dryVolumeM3, 4)} m³.`,
  );
  steps.push(`Mix ${mix.label} → cement fraction ${mix.cement}/${roundQuantity(partsSum, 4)}.`);
  steps.push(
    `Cement ≈ ${roundQuantity(cementVol, 4)} m³ × ${CEMENT_DENSITY_KG_PER_M3} = ${roundQuantity(cementKg, 2)} kg.`,
  );
  steps.push(
    `Sand (dry share) ≈ ${roundQuantity(sandVol, 4)} m³; aggregate ≈ ${roundQuantity(aggVol, 4)} m³.`,
  );
  steps.push(`Water ≈ cement_kg × W/C ${waterCementRatio} = ${waterLitres} L (indicative).`);

  return {
    cementKg: roundQuantity(cementKg, 2),
    cementBags50kg: Math.ceil(cementKg / 50 - 1e-9),
    sandVolumeM3: roundQuantity(sandVol, 4),
    aggregateVolumeM3: roundQuantity(aggVol, 4),
    waterLitres,
    dryVolumeM3: roundQuantity(dryVolumeM3, 4),
    mixLabel: mix.label,
    cementParts: mix.cement,
    sandParts: mix.sand,
    aggregateParts: mix.aggregate,
  };
}

/**
 * Concrete volume calculator for common structural shapes with optional mix breakdown and cost.
 */
export function calculateConcreteQuantity(raw: ConcreteCalculatorInput): ConcreteCalculatorResult {
  const input = concreteCalculatorInputSchema.parse(raw);
  const { wetVolumeM3, dimensionsM, steps } = computeWetVolumeM3(input);

  const wastage = applyWastage(wetVolumeM3, input.wastagePercent);
  if (!wastage.ok) throw new Error(wastage.error);
  const orderVolumeM3 = wastage.value;
  const wastageExtraM3 = roundQuantity(orderVolumeM3 - wetVolumeM3, 4);
  steps.push(
    `Apply wastage ${input.wastagePercent}% → order volume = ${roundQuantity(orderVolumeM3, 4)} m³ (extra ${wastageExtraM3} m³).`,
  );

  const wetVolumeFt3 = roundQuantity(wetVolumeM3 * M3_TO_FT3, 4);
  const orderVolumeFt3 = roundQuantity(orderVolumeM3 * M3_TO_FT3, 4);
  steps.push(
    `Unit conversion: ${roundQuantity(wetVolumeM3, 4)} m³ ≈ ${wetVolumeFt3} ft³ (wet); order ≈ ${orderVolumeFt3} ft³.`,
  );

  let materials: ConcreteMaterialBreakdown | null = null;
  if (input.includeMaterialBreakdown) {
    const mix = resolveConcreteMix(input.mixPreset, {
      cementParts: input.cementParts,
      sandParts: input.sandParts,
      aggregateParts: input.aggregateParts,
    });
    materials = buildMaterials(orderVolumeM3, mix, input.waterCementRatio, steps);
  }

  let estimatedCostInr: number | null = null;
  const rate = input.ratePerM3Inr ?? null;
  if (rate != null && rate > 0) {
    estimatedCostInr = roundMoney(orderVolumeM3 * rate);
    steps.push(
      `Estimated cost = ${roundQuantity(orderVolumeM3, 4)} m³ × ₹${rate}/m³ = ₹${estimatedCostInr} (indicative).`,
    );
  }

  return {
    shape: input.shape,
    shapeLabel: SHAPE_LABELS[input.shape],
    formula: SHAPE_FORMULAS[input.shape],
    wetVolumeM3: roundQuantity(wetVolumeM3, 4),
    wetVolumeFt3,
    orderVolumeM3: roundQuantity(orderVolumeM3, 4),
    orderVolumeFt3,
    wastagePercent: input.wastagePercent,
    wastageExtraM3,
    dimensionsM,
    steps,
    assumptions: [
      `Shape: ${SHAPE_LABELS[input.shape]} using ${SHAPE_FORMULAS[input.shape]}.`,
      `Wastage ${input.wastagePercent}% applied to wet volume for ordering.`,
      input.includeMaterialBreakdown
        ? `Material breakdown uses dry factor ${CONCRETE_DRY_FACTOR} and cement density ${CEMENT_DENSITY_KG_PER_M3} kg/m³.`
        : 'Material breakdown omitted.',
      input.includeMaterialBreakdown
        ? `Water from W/C ratio ${input.waterCementRatio} by cement mass (indicative, not a mix design).`
        : 'Water not estimated.',
      'Quantities are indicative planning figures — confirm with structural drawings and site mix design.',
    ],
    materials,
    estimatedCostInr,
    ratePerM3Inr: rate,
    disclaimer:
      'This concrete estimate is educational only. It is not a structural design or supplier quote. Site conditions, formwork, reinforcement displacement and ready-mix specs may change actual volumes.',
    version: CONCRETE_CALC_VERSION,
  };
}
