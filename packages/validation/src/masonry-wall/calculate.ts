import { applyWastage } from '../construction-engine/wastage';
import { roundMoney, roundQuantity } from '../construction-engine/money';
import { MORTAR_DRY_FACTOR } from '../cement-calculator/rates';
import {
  ceilUnits,
  computeNetWall,
  modularUnitSizeMm,
  resolveOpeningAreaM2,
  toM,
  unitVolumesM3,
} from './geometry';
import { estimateJointMaterial } from './joint-material';
import type { MasonryUnitQuantityInput, MasonryUnitQuantityResult } from './types';

/**
 * Shared masonry unit quantity engine for bricks, AAC blocks, and similar wall units.
 * Forward: wall → unit count. Reverse: available units → buildable net wall area.
 */
export function calculateMasonryUnitQuantity(
  input: MasonryUnitQuantityInput,
): MasonryUnitQuantityResult {
  const steps: string[] = [];
  const noun = input.unitNoun;
  const unit = input.unit;
  const jointMm = input.jointMm;
  const modular = modularUnitSizeMm(unit, jointMm);
  const volumes = unitVolumesM3(unit, modular);
  const thicknessM = toM(input.wallThickness, input.wallThicknessUnit ?? 'm');

  steps.push(`${noun}: ${unit.label}; joint ${roundQuantity(jointMm, 2)} mm.`);
  steps.push(
    `Modular size (with joint) = ${roundQuantity(modular.length, 1)} × ${roundQuantity(modular.width, 1)} × ${roundQuantity(modular.height, 1)} mm.`,
  );
  steps.push(
    `Modular volume = ${roundQuantity(volumes.modular, 6)} m³; solid = ${roundQuantity(volumes.solid, 6)} m³.`,
  );

  if (input.mode === 'reverse') {
    if (input.availableUnits == null) {
      throw new Error(`Available ${noun}s are required in reverse mode`);
    }
    const available = input.availableUnits;
    const wastageFactor = 1 + input.wastagePercent / 100;
    const usable = available / wastageFactor;
    const buildableVolumeM3 = usable * volumes.modular;
    const buildableAreaM2 = buildableVolumeM3 / thicknessM;
    steps.push(
      `Reverse: ${available} ${noun}s with ${input.wastagePercent}% wastage → usable ≈ ${roundQuantity(usable, 2)}.`,
    );
    steps.push(
      `Buildable volume ≈ usable × modular volume = ${roundQuantity(buildableVolumeM3, 4)} m³.`,
    );
    steps.push(
      `Buildable net wall area ≈ volume / thickness (${roundQuantity(thicknessM, 4)} m) = ${roundQuantity(buildableAreaM2, 4)} m².`,
    );

    let estimatedCostInr: number | null = null;
    if (input.pricePerUnitInr != null && input.pricePerUnitInr > 0) {
      estimatedCostInr = roundMoney(available * input.pricePerUnitInr);
    }

    return {
      mode: 'reverse',
      unitLabel: unit.label,
      unitSizeMm: {
        length: roundQuantity(unit.length, 2),
        width: roundQuantity(unit.width, 2),
        height: roundQuantity(unit.height, 2),
      },
      modularSizeMm: {
        length: roundQuantity(modular.length, 2),
        width: roundQuantity(modular.width, 2),
        height: roundQuantity(modular.height, 2),
      },
      modularUnitVolumeM3: roundQuantity(volumes.modular, 6),
      solidUnitVolumeM3: roundQuantity(volumes.solid, 6),
      jointMm: roundQuantity(jointMm, 2),
      grossWallAreaM2: null,
      openingAreaM2: null,
      netWallAreaM2: null,
      netWallVolumeM3: null,
      wallThicknessM: roundQuantity(thicknessM, 4),
      unitsBeforeWastage: roundQuantity(usable, 2),
      wastageUnits: roundQuantity(available - usable, 2),
      unitsRequired: available,
      buildableAreaM2: roundQuantity(buildableAreaM2, 4),
      buildableVolumeM3: roundQuantity(buildableVolumeM3, 4),
      jointMaterial: null,
      estimatedCostInr,
      pricePerUnitInr: input.pricePerUnitInr ?? null,
      formula: 'A = (N / (1 + wastage%)) × V_modular / T   ·   V_modular = (L+j)(W+j)(H+j)',
      steps,
      assumptions: [
        `Reverse mode converts ${noun} count to net wall area using modular volume and wall thickness.`,
        `Wastage ${input.wastagePercent}% reserved from the available stack.`,
        'Openings and bond patterns are not modelled in reverse mode.',
        'Indicative planning only — confirm on site.',
      ],
      disclaimer: input.disclaimer,
      version: input.version,
    };
  }

  if (input.wallLength == null || input.wallHeight == null) {
    throw new Error('Wall length and height are required');
  }

  const L = toM(input.wallLength, input.wallLengthUnit ?? 'm');
  const H = toM(input.wallHeight, input.wallHeightUnit ?? 'm');
  const openingAreaM2 = resolveOpeningAreaM2(input.openings, steps);
  const { grossWallAreaM2, netWallAreaM2, netWallVolumeM3 } = computeNetWall(
    L,
    H,
    thicknessM,
    openingAreaM2,
    steps,
  );

  if (volumes.modular <= 0) throw new Error('Modular unit volume must be positive.');
  const unitsExact = netWallVolumeM3 / volumes.modular;
  const unitsBeforeWastage = ceilUnits(unitsExact);
  steps.push(
    `${noun}s (before wastage) = ceil(net volume / modular volume) = ceil(${roundQuantity(netWallVolumeM3, 4)} / ${roundQuantity(volumes.modular, 6)}) = ${unitsBeforeWastage}.`,
  );

  const withWaste = applyWastage(unitsBeforeWastage, input.wastagePercent);
  if (!withWaste.ok) throw new Error(withWaste.error);
  const unitsRequired = ceilUnits(withWaste.value);
  const wastageUnits = unitsRequired - unitsBeforeWastage;
  steps.push(
    `Apply wastage ${input.wastagePercent}% → ${unitsRequired} ${noun}s (extra ${wastageUnits}).`,
  );

  let jointMaterial = null;
  if (input.includeJointMaterial && input.jointMaterial) {
    jointMaterial = estimateJointMaterial(
      netWallVolumeM3,
      unitsBeforeWastage,
      volumes.solid,
      input.jointMaterial,
      steps,
    );
  }

  let estimatedCostInr: number | null = null;
  if (input.pricePerUnitInr != null && input.pricePerUnitInr > 0) {
    estimatedCostInr = roundMoney(unitsRequired * input.pricePerUnitInr);
    steps.push(
      `Estimated cost = ${unitsRequired} × ₹${input.pricePerUnitInr} = ₹${estimatedCostInr}.`,
    );
  }

  const jointKind = input.jointMaterial?.kind ?? 'mortar';
  return {
    mode: 'forward',
    unitLabel: unit.label,
    unitSizeMm: {
      length: roundQuantity(unit.length, 2),
      width: roundQuantity(unit.width, 2),
      height: roundQuantity(unit.height, 2),
    },
    modularSizeMm: {
      length: roundQuantity(modular.length, 2),
      width: roundQuantity(modular.width, 2),
      height: roundQuantity(modular.height, 2),
    },
    modularUnitVolumeM3: roundQuantity(volumes.modular, 6),
    solidUnitVolumeM3: roundQuantity(volumes.solid, 6),
    jointMm: roundQuantity(jointMm, 2),
    grossWallAreaM2: roundQuantity(grossWallAreaM2, 4),
    openingAreaM2: roundQuantity(openingAreaM2, 4),
    netWallAreaM2: roundQuantity(netWallAreaM2, 4),
    netWallVolumeM3: roundQuantity(netWallVolumeM3, 4),
    wallThicknessM: roundQuantity(thicknessM, 4),
    unitsBeforeWastage,
    wastageUnits,
    unitsRequired,
    buildableAreaM2: null,
    buildableVolumeM3: null,
    jointMaterial,
    estimatedCostInr,
    pricePerUnitInr: input.pricePerUnitInr ?? null,
    formula:
      'N = ceil((A_gross − A_open) × T / V_modular × (1 + wastage%))   ·   V_modular = (L+j)(W+j)(H+j)',
    steps,
    assumptions: [
      `${unit.label} with ${roundQuantity(jointMm, 1)} mm joint on all faces (modular volume method).`,
      `Wall thickness ${roundQuantity(thicknessM, 4)} m.`,
      `Wastage ${input.wastagePercent}% applied to ${noun} count.`,
      input.includeJointMaterial && input.jointMaterial
        ? jointKind === 'mortar'
          ? `Mortar ≈ net wall volume − (units × solid volume); dry factor ${MORTAR_DRY_FACTOR}.`
          : 'Adhesive ≈ joint volume × adhesive bulk density (thin-bed method).'
        : 'Joint material estimate omitted.',
      'Bond pattern and cutting waste may differ on site — indicative only.',
    ],
    disclaimer: input.disclaimer,
    version: input.version,
  };
}
