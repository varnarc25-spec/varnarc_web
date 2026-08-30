import { toMm } from '../masonry-wall/geometry';
import { calculateMasonryUnitQuantity } from '../masonry-wall/calculate';
import type { MasonryUnitQuantityResult } from '../masonry-wall/types';
import {
  buildReverseCalculationDisplay,
  REVERSE_CALC_COMMON_LIMITATIONS,
} from '../reverse-calculator';
import { BRICK_CALC_VERSION, resolveBrickSizeMm } from './rates';
import {
  brickCalculatorInputSchema,
  type BrickCalculatorInput,
  type BrickCalculatorResult,
  type BrickMortarEstimate,
} from './types';

/** @deprecated Prefer modularUnitSizeMm from masonry-wall — kept for brick API stability. */
export {
  modularUnitSizeMm as modularBrickSizeMm,
  unitVolumesM3 as brickVolumesM3,
} from '../masonry-wall/geometry';

function mapMortar(joint: MasonryUnitQuantityResult['jointMaterial']): BrickMortarEstimate | null {
  if (!joint || joint.kind !== 'mortar') return null;
  return {
    mortarVolumeM3: joint.jointVolumeM3,
    dryMortarVolumeM3: joint.dryVolumeM3 ?? 0,
    cementKg: joint.cementKg ?? 0,
    sandVolumeM3: joint.sandVolumeM3 ?? 0,
    mixLabel: joint.mixLabel,
  };
}

function mapResult(r: MasonryUnitQuantityResult, wastagePercent: number): BrickCalculatorResult {
  const limitations =
    r.mode === 'reverse'
      ? [
          ...REVERSE_CALC_COMMON_LIMITATIONS,
          'Reverse wall area assumes continuous masonry at the selected thickness and joint — openings are not deducted.',
        ]
      : [
          'Forward brick counts are indicative — confirm brick size, wall thickness and openings with drawings.',
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
    brickLabel: r.unitLabel,
    brickSizeMm: r.unitSizeMm,
    modularSizeMm: r.modularSizeMm,
    modularBrickVolumeM3: r.modularUnitVolumeM3,
    solidBrickVolumeM3: r.solidUnitVolumeM3,
    mortarJointMm: r.jointMm,
    grossWallAreaM2: r.grossWallAreaM2,
    openingAreaM2: r.openingAreaM2,
    netWallAreaM2: r.netWallAreaM2,
    netWallVolumeM3: r.netWallVolumeM3,
    wallThicknessM: r.wallThicknessM,
    bricksBeforeWastage: r.unitsBeforeWastage,
    wastageBricks: r.wastageUnits,
    bricksRequired: r.unitsRequired,
    buildableAreaM2: r.buildableAreaM2,
    buildableVolumeM3: r.buildableVolumeM3,
    mortar: mapMortar(r.jointMaterial),
    estimatedCostInr: r.estimatedCostInr,
    pricePerBrickInr: r.pricePerUnitInr,
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
 * Brick / block quantity calculator — thin wrapper over shared masonry-wall engine.
 */
export function calculateBrickQuantity(raw: BrickCalculatorInput): BrickCalculatorResult {
  const input = brickCalculatorInputSchema.parse(raw);
  const brick =
    input.brickPreset === 'custom'
      ? resolveBrickSizeMm('custom', {
          length: toMm(input.brickLength!, input.brickSizeUnit),
          width: toMm(input.brickWidth!, input.brickSizeUnit),
          height: toMm(input.brickHeight!, input.brickSizeUnit),
        })
      : resolveBrickSizeMm(input.brickPreset);

  const jointMm = toMm(input.mortarJoint, input.mortarJointUnit);

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
    unit: brick,
    jointMm,
    wastagePercent: input.wastagePercent,
    availableUnits: input.availableBricks,
    pricePerUnitInr: input.pricePerBrickInr,
    includeJointMaterial: input.includeMortarEstimate,
    jointMaterial: {
      kind: 'mortar',
      cementParts: input.mortarCementParts,
      sandParts: input.mortarSandParts,
    },
    unitNoun: 'brick',
    version: BRICK_CALC_VERSION,
    disclaimer:
      'This brick estimate is educational only. It is not a masonry schedule guarantee. Confirm brick size, wall thickness and openings with drawings.',
  });

  return mapResult(core, input.wastagePercent);
}
