import { CEMENT_DENSITY_KG_PER_M3, MORTAR_DRY_FACTOR } from '../cement-calculator/rates';
import { roundQuantity } from '../construction-engine/money';
import type { MasonryJointMaterialEstimate, MasonryJointMaterialInput } from './types';

/**
 * Joint fill volume ≈ net wall volume − (units × solid unit volume).
 * Mortar: dry factor + cement:sand. Adhesive: mass from density (+ optional bags).
 */
export function estimateJointMaterial(
  netWallVolumeM3: number,
  unitsBeforeWastage: number,
  solidUnitVolumeM3: number,
  joint: MasonryJointMaterialInput,
  steps: string[],
): MasonryJointMaterialEstimate {
  const solidTotal = unitsBeforeWastage * solidUnitVolumeM3;
  const jointVolumeM3 = Math.max(0, netWallVolumeM3 - solidTotal);

  steps.push(
    `Joint material (wet) ≈ wall volume − unit solid volume = ${roundQuantity(netWallVolumeM3, 4)} − ${roundQuantity(solidTotal, 4)} = ${roundQuantity(jointVolumeM3, 4)} m³.`,
  );

  if (joint.kind === 'mortar') {
    const dryVolumeM3 = jointVolumeM3 * MORTAR_DRY_FACTOR;
    const partsSum = joint.cementParts + joint.sandParts;
    const cementKg = dryVolumeM3 * (joint.cementParts / partsSum) * CEMENT_DENSITY_KG_PER_M3;
    const sandVolumeM3 = dryVolumeM3 * (joint.sandParts / partsSum);
    const mixLabel = `${joint.cementParts}:${joint.sandParts} cement mortar`;
    steps.push(
      `Dry mortar × ${MORTAR_DRY_FACTOR} → ${roundQuantity(dryVolumeM3, 4)} m³; mix ${mixLabel}.`,
    );
    steps.push(
      `Mortar cement ≈ ${roundQuantity(cementKg, 2)} kg; sand ≈ ${roundQuantity(sandVolumeM3, 4)} m³.`,
    );
    return {
      kind: 'mortar',
      jointVolumeM3: roundQuantity(jointVolumeM3, 4),
      dryVolumeM3: roundQuantity(dryVolumeM3, 4),
      cementKg: roundQuantity(cementKg, 2),
      sandVolumeM3: roundQuantity(sandVolumeM3, 4),
      adhesiveKg: null,
      adhesiveBags: null,
      mixLabel,
    };
  }

  const adhesiveKg = jointVolumeM3 * joint.densityKgPerM3;
  const bagSize = joint.bagSizeKg ?? 40;
  const adhesiveBags = Math.ceil(adhesiveKg / bagSize - 1e-9);
  const mixLabel = `Thin-bed adhesive (~${joint.densityKgPerM3} kg/m³)`;
  steps.push(
    `Adhesive mass ≈ ${roundQuantity(jointVolumeM3, 4)} × ${joint.densityKgPerM3} = ${roundQuantity(adhesiveKg, 2)} kg (~${adhesiveBags} × ${bagSize} kg bags).`,
  );
  return {
    kind: 'adhesive',
    jointVolumeM3: roundQuantity(jointVolumeM3, 4),
    dryVolumeM3: null,
    cementKg: null,
    sandVolumeM3: null,
    adhesiveKg: roundQuantity(adhesiveKg, 2),
    adhesiveBags,
    mixLabel,
  };
}
