import { toMm } from '../masonry-wall/geometry';
import { calculateMasonryUnitQuantity } from '../masonry-wall/calculate';
import type { MasonryUnitQuantityResult } from '../masonry-wall/types';
import {
  buildReverseCalculationDisplay,
  REVERSE_CALC_COMMON_LIMITATIONS,
} from '../reverse-calculator';
import {
  AAC_CALC_VERSION,
  DEFAULT_AAC_ADHESIVE_DENSITY_KG_PER_M3,
  resolveAacBlockSizeMm,
} from './rates';
import {
  aacCalculatorInputSchema,
  type AacAdhesiveEstimate,
  type AacCalculatorInput,
  type AacCalculatorResult,
} from './types';

function mapAdhesive(
  joint: MasonryUnitQuantityResult['jointMaterial'],
): AacAdhesiveEstimate | null {
  if (!joint || joint.kind !== 'adhesive' || joint.adhesiveKg == null) return null;
  return {
    adhesiveVolumeM3: joint.jointVolumeM3,
    adhesiveKg: joint.adhesiveKg,
    adhesiveBags: joint.adhesiveBags ?? 0,
    mixLabel: joint.mixLabel,
  };
}

function mapResult(r: MasonryUnitQuantityResult, wastagePercent: number): AacCalculatorResult {
  const limitations =
    r.mode === 'reverse'
      ? [
          ...REVERSE_CALC_COMMON_LIMITATIONS,
          'Reverse wall area assumes continuous AAC masonry at the selected thickness and joint — openings are not deducted.',
        ]
      : [
          'Forward AAC counts are indicative — confirm block size, wall thickness and openings with drawings.',
        ];
  const reverseDisplay =
    r.mode === 'reverse'
      ? buildReverseCalculationDisplay({
          assumptions: r.assumptions,
          selectedUnit: 'm² wall area',
          wastagePercent,
          formula: r.formula,
          limitations,
        })
      : null;

  return {
    mode: r.mode,
    blockLabel: r.unitLabel,
    blockSizeMm: r.unitSizeMm,
    modularSizeMm: r.modularSizeMm,
    modularBlockVolumeM3: r.modularUnitVolumeM3,
    solidBlockVolumeM3: r.solidUnitVolumeM3,
    jointThicknessMm: r.jointMm,
    grossWallAreaM2: r.grossWallAreaM2,
    openingAreaM2: r.openingAreaM2,
    netWallAreaM2: r.netWallAreaM2,
    netWallVolumeM3: r.netWallVolumeM3,
    wallThicknessM: r.wallThicknessM,
    blocksBeforeWastage: r.unitsBeforeWastage,
    wastageBlocks: r.wastageUnits,
    blocksRequired: r.unitsRequired,
    buildableAreaM2: r.buildableAreaM2,
    buildableVolumeM3: r.buildableVolumeM3,
    adhesive: mapAdhesive(r.jointMaterial),
    estimatedCostInr: r.estimatedCostInr,
    pricePerBlockInr: r.pricePerUnitInr,
    formula: r.formula,
    steps: r.steps,
    assumptions: r.assumptions,
    limitations,
    reverseDisplay,
    disclaimer: r.disclaimer,
    version: r.version,
  };
}

/**
 * AAC block quantity calculator — uses shared masonry-wall engine (not a brick clone).
 */
export function calculateAacBlockQuantity(raw: AacCalculatorInput): AacCalculatorResult {
  const input = aacCalculatorInputSchema.parse(raw);
  const block =
    input.blockPreset === 'custom'
      ? resolveAacBlockSizeMm('custom', {
          length: toMm(input.blockLength!, input.blockSizeUnit),
          width: toMm(input.blockWidth!, input.blockSizeUnit),
          height: toMm(input.blockHeight!, input.blockSizeUnit),
        })
      : resolveAacBlockSizeMm(input.blockPreset);

  const jointMm = toMm(input.jointThickness, input.jointThicknessUnit);

  const core = calculateMasonryUnitQuantity({
    mode: input.mode,
    wallLength: input.wallLength,
    wallHeight: input.wallHeight,
    wallThickness: input.wallThickness!,
    wallLengthUnit: input.wallLengthUnit,
    wallHeightUnit: input.wallHeightUnit,
    wallThicknessUnit: input.wallThicknessUnit,
    openings: {
      openingArea: input.openingArea,
      openingAreaUnit: input.openingAreaUnit,
      openingCount: input.openingCount,
      openingWidth: input.openingWidth,
      openingHeight: input.openingHeight,
      openingWidthUnit: input.openingWidthUnit,
      openingHeightUnit: input.openingHeightUnit,
    },
    unit: block,
    jointMm,
    wastagePercent: input.wastagePercent,
    availableUnits: input.availableBlocks,
    pricePerUnitInr: input.pricePerBlockInr,
    includeJointMaterial: input.includeAdhesiveEstimate,
    jointMaterial: {
      kind: 'adhesive',
      densityKgPerM3: input.adhesiveDensityKgPerM3 || DEFAULT_AAC_ADHESIVE_DENSITY_KG_PER_M3,
      bagSizeKg: input.adhesiveBagSizeKg,
    },
    unitNoun: 'AAC block',
    version: AAC_CALC_VERSION,
    disclaimer:
      'This AAC estimate is educational only. Confirm block grade, thin-bed adhesive coverage and wall thickness with manufacturer data and drawings.',
  });

  return mapResult(core, input.wastagePercent);
}
