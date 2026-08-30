import { applyWastage } from '../construction-engine/wastage';
import { convertUnit } from '../construction-engine/units';
import { roundMoney, roundQuantity } from '../construction-engine/money';
import {
  buildReverseCalculationDisplay,
  REVERSE_CALC_COMMON_LIMITATIONS,
} from '../reverse-calculator';
import {
  CEMENT_CALC_VERSION,
  CEMENT_DENSITY_KG_PER_M3,
  COMMON_BAG_SIZES_KG,
  dryFactorForUseCase,
  resolveMixRatio,
} from './rates';
import {
  cementCalculatorInputSchema,
  type CementCalculatorInput,
  type CementCalculatorResult,
} from './types';

const M2_TO_FT2 = 10.76391041671;

function requireConvert(value: number, from: string, to: string): number {
  if (to === 'm3' && (from === 'liter' || from === 'litre' || from === 'l')) {
    return value * 0.001;
  }
  const r = convertUnit(value, from, to);
  if (!r.ok) throw new Error(r.error);
  return r.value;
}

function bagsFor(kg: number, bagSizeKg: number): number {
  return Math.ceil(kg / bagSizeKg - 1e-9);
}

/**
 * Cement quantity calculator for concrete, masonry, plastering and floor screed.
 * Forward: work size → bags. Reverse: bags on hand → coverable work.
 */
export function calculateCementQuantity(raw: CementCalculatorInput): CementCalculatorResult {
  const input = cementCalculatorInputSchema.parse(raw);
  const mix = resolveMixRatio(input.mixPreset, {
    cementParts: input.cementParts,
    sandParts: input.sandParts,
    aggregateParts: input.aggregateParts,
  });
  const dryFactor = dryFactorForUseCase(input.useCase);
  const steps: string[] = [];
  const partsSum = mix.cement + mix.sand + mix.aggregate;
  if (partsSum <= 0) throw new Error('Mix parts must sum to a positive number.');

  const cementFraction = mix.cement / partsSum;
  const sandFraction = mix.sand / partsSum;
  const aggFraction = mix.aggregate / partsSum;
  const bagSizeKg = input.bagSizeKg;

  if (input.mode === 'reverse') {
    const bags = Math.ceil(input.availableBags! - 1e-9);
    const cementKg = roundQuantity(bags * bagSizeKg, 2);
    const cementKgBeforeWastage = roundQuantity(cementKg / (1 + input.wastagePercent / 100), 2);
    const wastageExtraKg = roundQuantity(cementKg - cementKgBeforeWastage, 2);
    const cementVolumeM3 = cementKgBeforeWastage / CEMENT_DENSITY_KG_PER_M3;
    const dryVolumeM3 = cementVolumeM3 / cementFraction;
    const wetVolumeM3 = dryVolumeM3 / dryFactor;

    steps.push(`Reverse: ${bags} bags × ${bagSizeKg} kg = ${cementKg} kg cement on hand.`);
    steps.push(
      `Remove ${input.wastagePercent}% wastage allowance → ${cementKgBeforeWastage} kg effective (extra reserved ${wastageExtraKg} kg).`,
    );
    steps.push(
      `Cement volume = ${cementKgBeforeWastage} / ${CEMENT_DENSITY_KG_PER_M3} = ${roundQuantity(cementVolumeM3, 4)} m³.`,
    );
    steps.push(
      `Dry mix volume = cement volume ÷ cement fraction (${roundQuantity(cementFraction, 4)}) = ${roundQuantity(dryVolumeM3, 4)} m³.`,
    );
    steps.push(
      `Wet work volume = dry volume ÷ ${dryFactor} = ${roundQuantity(wetVolumeM3, 4)} m³.`,
    );

    let coverableAreaM2: number | null = null;
    let coverableAreaFt2: number | null = null;
    let selectedUnit = 'm³ wet work';
    let formula =
      'wet_m3 = ((bags × bag_kg) / (1 + wastage%)) / 1440 / cement_fraction / dry_factor';

    if (input.useCase !== 'concrete') {
      const thicknessM = requireConvert(input.thickness!, input.thicknessUnit, 'm');
      coverableAreaM2 = wetVolumeM3 / thicknessM;
      coverableAreaFt2 = coverableAreaM2 * M2_TO_FT2;
      selectedUnit = 'm² area';
      formula =
        'area_m2 = wet_m3 / thickness_m; wet_m3 = ((bags × bag_kg) / (1 + wastage%)) / 1440 / cement_fraction / dry_factor';
      steps.push(
        `Thickness = ${input.thickness} ${input.thicknessUnit} = ${roundQuantity(thicknessM, 6)} m.`,
      );
      steps.push(
        `Coverable area ≈ ${roundQuantity(wetVolumeM3, 4)} / ${roundQuantity(thicknessM, 6)} = ${roundQuantity(coverableAreaM2, 2)} m² (${roundQuantity(coverableAreaFt2, 1)} ft²).`,
      );
    }

    const sandVolumeM3 = mix.sand > 0 ? roundQuantity(dryVolumeM3 * sandFraction, 4) : null;
    const aggregateVolumeM3 =
      mix.aggregate > 0 ? roundQuantity(dryVolumeM3 * aggFraction, 4) : null;

    const assumptions = [
      `Mix ${mix.label} (cement fraction ${roundQuantity(cementFraction, 4)}).`,
      `Dry volume factor ${dryFactor} for ${input.useCase.replace('_', ' ')}.`,
      `Cement bulk density ${CEMENT_DENSITY_KG_PER_M3} kg/m³.`,
      `Bag size ${bagSizeKg} kg; wastage ${input.wastagePercent}% reserved from bags on hand.`,
      'Reverse answers “how much work can these bags cover?” — not a purchase schedule.',
    ];
    const limitations = [
      ...REVERSE_CALC_COMMON_LIMITATIONS,
      'Does not account for brand bag weight variance, moisture or site mix adjustments.',
      'Coverage is theoretical wet volume/area — formwork, joints and wastage on site differ.',
    ];

    return {
      mode: 'reverse',
      useCase: input.useCase,
      wetVolumeM3: roundQuantity(wetVolumeM3, 4),
      dryVolumeM3: roundQuantity(dryVolumeM3, 4),
      dryVolumeFactor: dryFactor,
      mixLabel: mix.label,
      cementParts: mix.cement,
      sandParts: mix.sand,
      aggregateParts: mix.aggregate,
      cementKg,
      cementKgBeforeWastage,
      bags,
      bagSizeKg,
      bagSizes: COMMON_BAG_SIZES_KG.map((sizeKg) => ({
        sizeKg,
        bags: bagsFor(cementKg, sizeKg),
      })),
      sandVolumeM3,
      aggregateVolumeM3,
      estimatedCostInr: null,
      wastagePercent: input.wastagePercent,
      wastageExtraKg,
      coverableWetVolumeM3: roundQuantity(wetVolumeM3, 4),
      coverableAreaM2: coverableAreaM2 != null ? roundQuantity(coverableAreaM2, 2) : null,
      coverableAreaFt2: coverableAreaFt2 != null ? roundQuantity(coverableAreaFt2, 1) : null,
      selectedUnit,
      steps,
      formula,
      assumptions,
      limitations,
      reverseDisplay: buildReverseCalculationDisplay({
        assumptions,
        selectedUnit,
        wastagePercent: input.wastagePercent,
        formula,
        limitations,
      }),
      disclaimer:
        'This reverse cement estimate is educational only. It does not guarantee how much concrete, plaster or masonry you can place with a given stock of bags.',
      version: CEMENT_CALC_VERSION,
    };
  }

  // Forward
  let wetVolumeM3: number;
  if (input.useCase === 'concrete') {
    wetVolumeM3 = requireConvert(input.volume!, input.volumeUnit, 'm3');
    steps.push(
      `Wet concrete volume = ${input.volume} ${input.volumeUnit} = ${roundQuantity(wetVolumeM3, 4)} m³.`,
    );
  } else {
    const areaM2 = requireConvert(input.area!, input.areaUnit, 'm2');
    const thicknessM = requireConvert(input.thickness!, input.thicknessUnit, 'm');
    wetVolumeM3 = areaM2 * thicknessM;
    steps.push(`Area = ${input.area} ${input.areaUnit} = ${roundQuantity(areaM2, 4)} m².`);
    steps.push(
      `Thickness = ${input.thickness} ${input.thicknessUnit} = ${roundQuantity(thicknessM, 6)} m.`,
    );
    steps.push(
      `Wet mortar/screed volume = area × thickness = ${roundQuantity(wetVolumeM3, 4)} m³.`,
    );
  }

  const dryVolumeM3 = wetVolumeM3 * dryFactor;
  steps.push(
    `Dry volume = wet volume × ${dryFactor} = ${roundQuantity(dryVolumeM3, 4)} m³ (accounts for voids/bulking).`,
  );
  steps.push(
    `Mix ${mix.label} → cement fraction = ${mix.cement}/${roundQuantity(partsSum, 4)} = ${roundQuantity(cementFraction, 4)}.`,
  );

  const cementVolumeM3 = dryVolumeM3 * cementFraction;
  const cementKgBeforeWastage = cementVolumeM3 * CEMENT_DENSITY_KG_PER_M3;
  steps.push(`Cement volume = dry volume × fraction = ${roundQuantity(cementVolumeM3, 4)} m³.`);
  steps.push(
    `Cement mass = ${roundQuantity(cementVolumeM3, 4)} × ${CEMENT_DENSITY_KG_PER_M3} kg/m³ = ${roundQuantity(cementKgBeforeWastage, 2)} kg (before wastage).`,
  );

  const wastage = applyWastage(cementKgBeforeWastage, input.wastagePercent);
  if (!wastage.ok) throw new Error(wastage.error);
  const cementKg = roundQuantity(wastage.value, 2);
  const wastageExtraKg = roundQuantity(cementKg - cementKgBeforeWastage, 2);
  steps.push(
    `Apply wastage ${input.wastagePercent}% → ${cementKg} kg (extra ${wastageExtraKg} kg).`,
  );

  const bags = bagsFor(cementKg, bagSizeKg);
  steps.push(`Bags (${bagSizeKg} kg) = ceil(${cementKg} / ${bagSizeKg}) = ${bags} bags.`);

  const bagSizes = COMMON_BAG_SIZES_KG.map((sizeKg) => ({
    sizeKg,
    bags: bagsFor(cementKg, sizeKg),
  }));

  const sandVolumeM3 = mix.sand > 0 ? roundQuantity(dryVolumeM3 * sandFraction, 4) : null;
  const aggregateVolumeM3 = mix.aggregate > 0 ? roundQuantity(dryVolumeM3 * aggFraction, 4) : null;

  if (sandVolumeM3 != null) {
    steps.push(
      `Related sand (dry volume share) ≈ ${sandVolumeM3} m³ — verify grading and moisture on site.`,
    );
  }

  let estimatedCostInr: number | null = null;
  if (input.bagPriceInr != null && input.bagPriceInr > 0) {
    estimatedCostInr = roundMoney(bags * input.bagPriceInr);
    steps.push(
      `Estimated cost = ${bags} bags × ₹${input.bagPriceInr} = ₹${estimatedCostInr} (indicative).`,
    );
  }

  const formula =
    input.useCase === 'concrete'
      ? 'cement_kg = wet_m3 × dry_factor × (c/(c+s+a)) × 1440 × (1 + wastage%)'
      : 'cement_kg = (area × thickness)_m3 × dry_factor × (c/(c+s[+a])) × 1440 × (1 + wastage%)';

  return {
    mode: 'forward',
    useCase: input.useCase,
    wetVolumeM3: roundQuantity(wetVolumeM3, 4),
    dryVolumeM3: roundQuantity(dryVolumeM3, 4),
    dryVolumeFactor: dryFactor,
    mixLabel: mix.label,
    cementParts: mix.cement,
    sandParts: mix.sand,
    aggregateParts: mix.aggregate,
    cementKg,
    cementKgBeforeWastage: roundQuantity(cementKgBeforeWastage, 2),
    bags,
    bagSizeKg,
    bagSizes,
    sandVolumeM3,
    aggregateVolumeM3,
    estimatedCostInr,
    wastagePercent: input.wastagePercent,
    wastageExtraKg,
    coverableWetVolumeM3: null,
    coverableAreaM2: null,
    coverableAreaFt2: null,
    selectedUnit: 'bags',
    steps,
    formula,
    assumptions: [
      `Dry volume factor ${dryFactor} for ${input.useCase.replace('_', ' ')}.`,
      `Cement bulk density ${CEMENT_DENSITY_KG_PER_M3} kg/m³.`,
      `Mix ${mix.label}.`,
      `Wastage ${input.wastagePercent}% applied to cement mass.`,
      'Quantities are indicative planning figures — confirm with site mix design and supplier bag weights.',
    ],
    limitations: [
      'Forward mode estimates bags to buy for a given work size — not a site mix design.',
      ...REVERSE_CALC_COMMON_LIMITATIONS.slice(0, 2),
    ],
    reverseDisplay: null,
    disclaimer:
      'This cement estimate is educational only. It is not a material schedule guarantee. Site conditions, moisture, brand bag weight and design mix may change actual consumption.',
    version: CEMENT_CALC_VERSION,
  };
}
