import { applyWastage } from '../construction-engine/wastage';
import { convertUnit } from '../construction-engine/units';
import { roundMoney, roundQuantity } from '../construction-engine/money';
import {
  CEMENT_DENSITY_KG_PER_M3,
  MORTAR_DRY_FACTOR,
  resolveMixRatio,
} from '../cement-calculator/rates';
import type { CementMixPreset } from '../cement-calculator/types';
import { PLASTER_CALC_VERSION, getPlasterPresetDefaults } from './rates';
import {
  plasterCalculatorInputSchema,
  type PlasterCalculatorInput,
  type PlasterCalculatorResult,
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

function resolveOpeningAreaM2(
  input: ReturnType<typeof plasterCalculatorInputSchema.parse>,
  steps: string[],
): number {
  if (input.openingArea != null && input.openingArea > 0) {
    const area =
      input.openingAreaUnit === 'ft2'
        ? requireConvert(input.openingArea, 'ft2', 'm2')
        : input.openingAreaUnit === 'yard2'
          ? requireConvert(input.openingArea, 'yard2', 'm2')
          : input.openingArea;
    steps.push(
      `Opening area = ${input.openingArea} ${input.openingAreaUnit} = ${roundQuantity(area, 4)} m².`,
    );
    return area;
  }
  const count = input.openingCount ?? 0;
  if (count > 0 && input.openingWidth != null && input.openingHeight != null) {
    const w = toM(input.openingWidth, input.openingWidthUnit);
    const h = toM(input.openingHeight, input.openingHeightUnit);
    const area = count * w * h;
    steps.push(
      `Openings = ${count} × ${roundQuantity(w, 4)} × ${roundQuantity(h, 4)} = ${roundQuantity(area, 4)} m².`,
    );
    return area;
  }
  steps.push('No openings deducted.');
  return 0;
}

/**
 * Plaster / mortar quantity for walls and ceilings.
 * Interior/exterior presets only suggest thickness + mix; both remain editable.
 */
export function calculatePlasterQuantity(raw: PlasterCalculatorInput): PlasterCalculatorResult {
  const input = plasterCalculatorInputSchema.parse(raw);
  const steps: string[] = [];
  const presetDefaults = getPlasterPresetDefaults(input.surfacePreset);
  const presetAssumptions = presetDefaults?.assumptions ?? [
    'Custom surface — thickness and mix are as entered (no interior/exterior default applied).',
  ];

  if (presetDefaults) {
    steps.push(
      `Surface preset “${presetDefaults.label}” suggests ${presetDefaults.thicknessMm} mm and ${presetDefaults.mixPreset.replace('mortar_', '').replace('_', ':')} mix — using the values you entered (editable).`,
    );
  }

  let grossAreaM2: number;
  if (input.area != null) {
    grossAreaM2 = requireConvert(input.area, input.areaUnit, 'm2');
    steps.push(
      `Gross plaster area = ${input.area} ${input.areaUnit} = ${roundQuantity(grossAreaM2, 4)} m².`,
    );
  } else {
    const L = toM(input.length!, input.lengthUnit);
    const H = toM(input.height!, input.heightUnit);
    grossAreaM2 = L * H;
    steps.push(
      `Gross area = L × H = ${roundQuantity(L, 4)} × ${roundQuantity(H, 4)} = ${roundQuantity(grossAreaM2, 4)} m² (${input.surface}).`,
    );
  }

  const openingAreaM2 = resolveOpeningAreaM2(input, steps);
  if (openingAreaM2 > grossAreaM2) {
    throw new Error('Opening area cannot exceed gross plaster area.');
  }
  const netAreaM2 = grossAreaM2 - openingAreaM2;
  steps.push(`Net area = gross − openings = ${roundQuantity(netAreaM2, 4)} m².`);

  const thicknessM = toM(input.thickness, input.thicknessUnit);
  const thicknessMm = thicknessM * 1000;
  steps.push(
    `Plaster thickness = ${input.thickness} ${input.thicknessUnit} = ${roundQuantity(thicknessMm, 2)} mm.`,
  );

  const wetVolumeM3 = netAreaM2 * thicknessM;
  steps.push(`Wet mortar volume = net area × thickness = ${roundQuantity(wetVolumeM3, 4)} m³.`);

  const dryVolumeM3 = wetVolumeM3 * MORTAR_DRY_FACTOR;
  steps.push(`Dry volume (factor ${MORTAR_DRY_FACTOR}) = ${roundQuantity(dryVolumeM3, 4)} m³.`);

  const mix = resolveMixRatio(input.mixPreset as CementMixPreset, {
    cementParts: input.cementParts,
    sandParts: input.sandParts,
    aggregateParts: 0,
  });
  const partsSum = mix.cement + mix.sand;
  const cementFraction = mix.cement / partsSum;
  const sandFraction = mix.sand / partsSum;
  steps.push(
    `Mix ${mix.label} → cement fraction ${roundQuantity(cementFraction, 4)}, sand fraction ${roundQuantity(sandFraction, 4)}.`,
  );

  const cementVolM3 = dryVolumeM3 * cementFraction;
  const sandVolumeBefore = dryVolumeM3 * sandFraction;
  const cementKgBefore = cementVolM3 * CEMENT_DENSITY_KG_PER_M3;
  const sandBefore = sandVolumeBefore;

  const cementWaste = applyWastage(cementKgBefore, input.wastagePercent);
  const sandWaste = applyWastage(sandBefore, input.wastagePercent);
  if (!cementWaste.ok) throw new Error(cementWaste.error);
  if (!sandWaste.ok) throw new Error(sandWaste.error);

  const cementKg = roundQuantity(cementWaste.value, 2);
  const sandVolumeM3 = roundQuantity(sandWaste.value, 4);
  const cementBags = bagsFor(cementKg, input.bagSizeKg);

  steps.push(
    `Cement = ${roundQuantity(cementVolM3, 4)} m³ × ${CEMENT_DENSITY_KG_PER_M3} = ${roundQuantity(cementKgBefore, 2)} kg before wastage.`,
  );
  steps.push(
    `Apply wastage ${input.wastagePercent}% → cement ${cementKg} kg (${cementBags} × ${input.bagSizeKg} kg bags); sand ${sandVolumeM3} m³.`,
  );

  let estimatedCostInr: number | null = null;
  let costParts = 0;
  if (input.bagPriceInr != null && input.bagPriceInr > 0) {
    costParts += cementBags * input.bagPriceInr;
  }
  if (input.sandRatePerM3Inr != null && input.sandRatePerM3Inr > 0) {
    costParts += sandVolumeM3 * input.sandRatePerM3Inr;
  }
  if (costParts > 0) {
    estimatedCostInr = roundMoney(costParts);
    steps.push(`Estimated material cost ≈ ₹${estimatedCostInr} (indicative).`);
  }

  return {
    surface: input.surface,
    surfacePreset: input.surfacePreset,
    presetAssumptions,
    grossAreaM2: roundQuantity(grossAreaM2, 4),
    openingAreaM2: roundQuantity(openingAreaM2, 4),
    netAreaM2: roundQuantity(netAreaM2, 4),
    thicknessM: roundQuantity(thicknessM, 6),
    thicknessMm: roundQuantity(thicknessMm, 2),
    wetVolumeM3: roundQuantity(wetVolumeM3, 4),
    dryVolumeM3: roundQuantity(dryVolumeM3, 4),
    dryVolumeFactor: MORTAR_DRY_FACTOR,
    mixLabel: mix.label,
    cementParts: mix.cement,
    sandParts: mix.sand,
    cementKg,
    cementBags,
    bagSizeKg: input.bagSizeKg,
    sandVolumeM3,
    wastagePercent: input.wastagePercent,
    estimatedCostInr,
    formula: 'V_wet = A_net × T · V_dry = V_wet × 1.33 · cement_kg = V_dry × (c/Σ) × 1440 × (1+w%)',
    steps,
    assumptions: [
      ...presetAssumptions,
      `Surface: ${input.surface}; thickness ${roundQuantity(thicknessMm, 1)} mm; mix ${mix.label}.`,
      `Dry mortar factor ${MORTAR_DRY_FACTOR}; cement density ${CEMENT_DENSITY_KG_PER_M3} kg/m³.`,
      `Wastage ${input.wastagePercent}% applied to cement mass and sand volume.`,
      'Indicative planning only — confirm coats, mesh and waterproofing with the finishing specification.',
    ],
    disclaimer:
      'This plaster estimate is educational only. It is not a finishing schedule guarantee. Presets suggest common thicknesses/mixes you can edit freely.',
    version: PLASTER_CALC_VERSION,
  };
}
