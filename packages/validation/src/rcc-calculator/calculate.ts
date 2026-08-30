import { applyWastage } from '../construction-engine/wastage';
import { convertUnit } from '../construction-engine/units';
import { roundMoney, roundQuantity } from '../construction-engine/money';
import { resolveMixRatio } from '../cement-calculator/rates';
import type { CementMixPreset } from '../cement-calculator/types';
import {
  CEMENT_DENSITY_KG_PER_M3,
  CONCRETE_DRY_FACTOR,
  DEFAULT_BAG_SIZE_KG,
  RCC_CALC_VERSION,
  RCC_ELEMENT_FORMULAS,
  RCC_ELEMENT_LABELS,
  RCC_GRADE_DEFAULT_PARTS,
  RCC_PRELIMINARY_STEEL_KG_PER_M3,
  RCC_STRUCTURAL_DISCLAIMER,
  rccGradeToMixPreset,
} from './rates';
import {
  rccCalculatorInputSchema,
  type RccCalculatorInput,
  type RccCalculatorResult,
  type RccMaterialEstimate,
  type RccSteelEstimate,
} from './types';

function requireConvert(value: number, from: string, to: string): number {
  const r = convertUnit(value, from, to);
  if (!r.ok) throw new Error(r.error);
  return r.value;
}

function toM(value: number, unit: string): number {
  return requireConvert(value, unit, 'm');
}

function bagsFor(kg: number, bagSizeKg: number): number {
  return Math.ceil(kg / bagSizeKg - 1e-9);
}

function estimateMixMaterials(
  orderVolumeM3: number,
  mixLabel: string,
  cementParts: number,
  sandParts: number,
  aggregateParts: number,
): RccMaterialEstimate {
  const partsSum = cementParts + sandParts + aggregateParts;
  const dry = orderVolumeM3 * CONCRETE_DRY_FACTOR;
  const cementKg = dry * (cementParts / partsSum) * CEMENT_DENSITY_KG_PER_M3;
  const sandM3 = dry * (sandParts / partsSum);
  const aggregateM3 = dry * (aggregateParts / partsSum);
  return {
    cementKg: roundQuantity(cementKg, 2),
    cementBags: bagsFor(cementKg, DEFAULT_BAG_SIZE_KG),
    bagSizeKg: DEFAULT_BAG_SIZE_KG,
    sandM3: roundQuantity(sandM3, 4),
    aggregateM3: roundQuantity(aggregateM3, 4),
    mixLabel,
    dryFactor: CONCRETE_DRY_FACTOR,
  };
}

/**
 * RCC preliminary volume (+ optional mix and thumb-rule steel ranges).
 * Steel estimates never replace structural drawings.
 */
export function calculateRccQuantity(raw: RccCalculatorInput): RccCalculatorResult {
  const input = rccCalculatorInputSchema.parse(raw);
  const steps: string[] = [];
  const elementLabel = RCC_ELEMENT_LABELS[input.element];
  const qty = input.quantity;

  let wetOne: number;
  let planAreaOneM2: number | null = null;
  let dimensionsM: RccCalculatorResult['dimensionsM'] = null;
  let footingShape: RccCalculatorResult['footingShape'] = null;

  switch (input.element) {
    case 'slab': {
      const L = toM(input.length!, input.lengthUnit);
      const W = toM(input.width!, input.widthUnit);
      const T = toM(input.thickness!, input.thicknessUnit);
      planAreaOneM2 = L * W;
      wetOne = planAreaOneM2 * T;
      dimensionsM = {
        length: roundQuantity(L, 4),
        width: roundQuantity(W, 4),
        thickness: roundQuantity(T, 4),
      };
      steps.push(
        `Slab plan area = L×W = ${dimensionsM.length} × ${dimensionsM.width} = ${roundQuantity(planAreaOneM2, 4)} m².`,
      );
      steps.push(
        `Slab volume = area×T = ${roundQuantity(planAreaOneM2, 4)} × ${dimensionsM.thickness} = ${roundQuantity(wetOne, 4)} m³ each.`,
      );
      break;
    }
    case 'footing': {
      footingShape = input.footingShape;
      const L = toM(input.length!, input.lengthUnit);
      const W = footingShape === 'square' ? L : toM(input.width!, input.widthUnit);
      const D = toM(input.thickness!, input.thicknessUnit);
      planAreaOneM2 = L * W;
      wetOne = planAreaOneM2 * D;
      dimensionsM = {
        length: roundQuantity(L, 4),
        width: roundQuantity(W, 4),
        thickness: roundQuantity(D, 4),
      };
      const shapeNote = footingShape === 'square' ? 'Square' : 'Rectangular';
      steps.push(
        `${shapeNote} footing: L×W×D = ${dimensionsM.length} × ${dimensionsM.width} × ${dimensionsM.thickness} = ${roundQuantity(wetOne, 4)} m³ RCC each.`,
      );
      break;
    }
    case 'beam': {
      const L = toM(input.length!, input.lengthUnit);
      const B = toM(input.width!, input.widthUnit);
      const D = toM(input.thickness!, input.thicknessUnit);
      wetOne = L * B * D;
      dimensionsM = {
        length: roundQuantity(L, 4),
        width: roundQuantity(B, 4),
        thickness: roundQuantity(D, 4),
      };
      steps.push(
        `Beam: L×B×D = ${dimensionsM.length} × ${dimensionsM.width} × ${dimensionsM.thickness} = ${roundQuantity(wetOne, 4)} m³ each.`,
      );
      break;
    }
    case 'column': {
      const H = toM(input.height!, input.heightUnit);
      if (input.columnShape === 'circular') {
        const dia = toM(input.diameter!, input.diameterUnit);
        const radius = dia / 2;
        wetOne = Math.PI * radius * radius * H;
        dimensionsM = {
          length: roundQuantity(dia, 4),
          width: roundQuantity(dia, 4),
          height: roundQuantity(H, 4),
          diameter: roundQuantity(dia, 4),
          shape: 'circular',
        };
        steps.push(
          `Circular column: π×(Ø/2)²×H = π × (${dimensionsM.diameter}/2)² × ${dimensionsM.height} = ${roundQuantity(wetOne, 4)} m³ each.`,
        );
      } else {
        const B = toM(input.length!, input.lengthUnit);
        const D = toM(input.width!, input.widthUnit);
        wetOne = B * D * H;
        dimensionsM = {
          length: roundQuantity(B, 4),
          width: roundQuantity(D, 4),
          height: roundQuantity(H, 4),
          shape: 'rectangular',
        };
        steps.push(
          `Rectangular column: B×D×H = ${dimensionsM.length} × ${dimensionsM.width} × ${dimensionsM.height} = ${roundQuantity(wetOne, 4)} m³ each.`,
        );
      }
      break;
    }
  }

  const wetVolumeM3 = wetOne * qty;
  const planAreaM2 = planAreaOneM2 != null ? planAreaOneM2 * qty : null;
  if (planAreaM2 != null && qty > 1) {
    steps.push(
      `Total slab/footing plan area = ${roundQuantity(planAreaOneM2!, 4)} × ${qty} = ${roundQuantity(planAreaM2, 4)} m².`,
    );
  }
  if (qty > 1) {
    steps.push(`Quantity ${qty} → wet RCC ${roundQuantity(wetVolumeM3, 4)} m³.`);
  }

  const waste = applyWastage(wetVolumeM3, input.wastagePercent);
  if (!waste.ok) throw new Error(waste.error);
  const orderVolumeM3 = waste.value;
  steps.push(
    `Wastage ${input.wastagePercent}% → RCC order volume ${roundQuantity(orderVolumeM3, 4)} m³.`,
  );

  let materials: RccMaterialEstimate | null = null;
  if (input.includeMaterialBreakdown) {
    const defaults = input.grade !== 'custom' ? RCC_GRADE_DEFAULT_PARTS[input.grade] : undefined;
    const useCustomParts =
      input.grade === 'custom' ||
      input.grade === 'M30' ||
      input.cementParts != null ||
      input.sandParts != null ||
      input.aggregateParts != null;
    const mix = resolveMixRatio(
      useCustomParts ? 'custom' : (rccGradeToMixPreset(input.grade) as CementMixPreset),
      {
        cementParts: input.cementParts ?? defaults?.c,
        sandParts: input.sandParts ?? defaults?.s,
        aggregateParts: input.aggregateParts ?? defaults?.a,
      },
    );
    const mixLabel =
      input.grade !== 'custom' && input.cementParts == null
        ? `${input.grade} (${defaults?.c}:${defaults?.s}:${defaults?.a})`
        : mix.label;
    materials = estimateMixMaterials(orderVolumeM3, mixLabel, mix.cement, mix.sand, mix.aggregate);
    steps.push(
      `RCC mix ${mixLabel}: dry volume = ${roundQuantity(orderVolumeM3, 4)} × ${CONCRETE_DRY_FACTOR} = ${roundQuantity(orderVolumeM3 * CONCRETE_DRY_FACTOR, 4)} m³.`,
    );
    steps.push(
      `RCC cement ≈ ${materials.cementKg} kg (${materials.cementBags} × ${DEFAULT_BAG_SIZE_KG} kg bags); sand ${materials.sandM3} m³; aggregate ${materials.aggregateM3} m³.`,
    );
  }

  let pcc: RccCalculatorResult['pcc'] = null;
  if (input.element === 'footing' && input.includePccLayer && planAreaOneM2 != null) {
    const pccT = toM(input.pccThickness!, input.pccThicknessUnit);
    const pccOne = planAreaOneM2 * pccT;
    const pccWet = pccOne * qty;
    const pccWaste = applyWastage(pccWet, input.wastagePercent);
    if (!pccWaste.ok) throw new Error(pccWaste.error);
    const pccOrder = pccWaste.value;
    const pccMix = resolveMixRatio(input.pccMix as CementMixPreset);
    const pccMaterials = input.includeMaterialBreakdown
      ? estimateMixMaterials(pccOrder, pccMix.label, pccMix.cement, pccMix.sand, pccMix.aggregate)
      : null;
    let pccCost: number | null = null;
    if (input.pccRatePerM3Inr != null && input.pccRatePerM3Inr > 0) {
      pccCost = roundMoney(pccOrder * input.pccRatePerM3Inr);
    }
    pcc = {
      wetVolumeOneM3: roundQuantity(pccOne, 4),
      wetVolumeM3: roundQuantity(pccWet, 4),
      orderVolumeM3: roundQuantity(pccOrder, 4),
      thicknessM: roundQuantity(pccT, 4),
      mixLabel: pccMix.label,
      materials: pccMaterials,
      estimatedCostInr: pccCost,
    };
    steps.push(
      `PCC bed (same plan): L×W×t = ${dimensionsM!.length} × ${dimensionsM!.width} × ${pcc.thicknessM} = ${pcc.wetVolumeOneM3} m³ each; total wet ${pcc.wetVolumeM3} m³; order ${pcc.orderVolumeM3} m³.`,
    );
    if (pccMaterials) {
      steps.push(
        `PCC mix ${pccMix.label}: cement ≈ ${pccMaterials.cementKg} kg (${pccMaterials.cementBags} bags); sand ${pccMaterials.sandM3} m³; aggregate ${pccMaterials.aggregateM3} m³.`,
      );
    }
    if (pccCost != null) {
      steps.push(`PCC cost ≈ ${pcc.orderVolumeM3} × ₹${input.pccRatePerM3Inr} = ₹${pccCost}.`);
    }
  }

  let steel: RccSteelEstimate | null = null;
  if (input.includeSteelEstimate) {
    const band = RCC_PRELIMINARY_STEEL_KG_PER_M3[input.element];
    const minR = input.steelKgPerM3Min ?? band.min;
    const maxR = input.steelKgPerM3Max ?? band.max;
    const typR = input.steelKgPerM3 ?? band.typical;
    const steelKgMin = orderVolumeM3 * minR;
    const steelKgTypical = orderVolumeM3 * typR;
    const steelKgMax = orderVolumeM3 * maxR;
    steel = {
      kgPerM3Min: minR,
      kgPerM3Typical: typR,
      kgPerM3Max: maxR,
      steelKgMin: roundQuantity(steelKgMin, 1),
      steelKgTypical: roundQuantity(steelKgTypical, 1),
      steelKgMax: roundQuantity(steelKgMax, 1),
      steelTonnesTypical: roundQuantity(steelKgTypical / 1000, 3),
      ratioSource: `${band.note} Ratios are configurable; defaults are preliminary thumb rules only.`,
      warning: RCC_STRUCTURAL_DISCLAIMER,
    };
    steps.push(
      `Indicative steel (preliminary): ${minR}–${maxR} kg/m³ (typical ${typR}) × ${roundQuantity(orderVolumeM3, 4)} m³ → ~${steel.steelKgMin}–${steel.steelKgMax} kg (typical ${steel.steelKgTypical} kg).`,
    );
    steps.push(`WARNING: ${RCC_STRUCTURAL_DISCLAIMER}`);
  }

  let estimatedCostInr: number | null = null;
  if (input.ratePerM3Inr != null && input.ratePerM3Inr > 0) {
    estimatedCostInr = roundMoney(orderVolumeM3 * input.ratePerM3Inr);
    steps.push(
      `RCC concrete cost ≈ ${roundQuantity(orderVolumeM3, 4)} × ₹${input.ratePerM3Inr} = ₹${estimatedCostInr}.`,
    );
  }

  let totalEstimatedCostInr: number | null = null;
  if (estimatedCostInr != null || pcc?.estimatedCostInr != null) {
    totalEstimatedCostInr = roundMoney((estimatedCostInr ?? 0) + (pcc?.estimatedCostInr ?? 0));
    if (pcc?.estimatedCostInr != null && estimatedCostInr != null) {
      steps.push(`Combined RCC + PCC cost ≈ ₹${totalEstimatedCostInr}.`);
    }
  }

  const columnShape = input.element === 'column' ? input.columnShape : null;
  const formula =
    columnShape === 'circular'
      ? 'V = π × (Ø/2)² × H × qty'
      : input.element === 'footing' && input.includePccLayer
        ? 'V_rcc = L × W × D × qty; V_pcc = L × W × t_pcc × qty'
        : footingShape === 'square'
          ? 'V = L × L × D × qty'
          : RCC_ELEMENT_FORMULAS[input.element];

  const shapeAssumption =
    columnShape != null
      ? `Element: ${elementLabel} (${columnShape}); grade ${input.grade}; quantity ${qty}.`
      : footingShape != null
        ? `Element: ${elementLabel} (${footingShape}); grade ${input.grade}; quantity ${qty}.`
        : `Element: ${elementLabel}; grade ${input.grade}; quantity ${qty}.`;

  return {
    element: input.element,
    elementLabel,
    quantity: qty,
    planAreaOneM2: planAreaOneM2 != null ? roundQuantity(planAreaOneM2, 4) : null,
    planAreaM2: planAreaM2 != null ? roundQuantity(planAreaM2, 4) : null,
    dimensionsM,
    columnShape,
    footingShape,
    wetVolumeOneM3: roundQuantity(wetOne, 4),
    wetVolumeM3: roundQuantity(wetVolumeM3, 4),
    orderVolumeM3: roundQuantity(orderVolumeM3, 4),
    wastagePercent: input.wastagePercent,
    grade: input.grade,
    materials,
    pcc,
    steel,
    estimatedCostInr,
    totalEstimatedCostInr,
    formula,
    steps,
    assumptions: [
      shapeAssumption,
      materials
        ? `Cement/sand/aggregate use dry factor ${CONCRETE_DRY_FACTOR} and cement density ${CEMENT_DENSITY_KG_PER_M3} kg/m³ (transparent mix assumptions).`
        : 'Material breakdown not requested.',
      pcc
        ? `PCC bed uses lean mix ${pcc.mixLabel} on the same plan area as the footing (not a structural sizing output).`
        : 'PCC layer not requested.',
      steel
        ? 'PRELIMINARY ONLY: Steel shown uses labelled kg/m³ thumb rules and is separate from structural engineering design.'
        : 'Steel estimate not requested.',
      'Volume and material planning only — not structural design, load-capacity, or footing sizing from building loads.',
      RCC_STRUCTURAL_DISCLAIMER,
    ],
    structuralDisclaimer: RCC_STRUCTURAL_DISCLAIMER,
    disclaimer:
      'This RCC estimate is for preliminary planning only. It is not a structural design, footing sizing from building loads, load-capacity check, BBS or construction quote.',
    version: RCC_CALC_VERSION,
  };
}
