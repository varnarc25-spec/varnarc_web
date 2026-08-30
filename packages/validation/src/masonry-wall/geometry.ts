import { convertUnit } from '../construction-engine/units';
import { roundQuantity } from '../construction-engine/money';
import type { MasonryOpeningInput, MasonrySizeMm } from './types';

export function requireConvert(value: number, from: string, to: string): number {
  const r = convertUnit(value, from, to);
  if (!r.ok) throw new Error(r.error);
  return r.value;
}

export function toM(value: number, unit: string): number {
  return requireConvert(value, unit, 'm');
}

export function toMm(value: number, unit: string): number {
  return requireConvert(value, unit, 'mm');
}

export function ceilUnits(n: number): number {
  return Math.ceil(n - 1e-9);
}

/** Modular unit size includes joint on each dimension (indicative site method). */
export function modularUnitSizeMm(
  unit: Pick<MasonrySizeMm, 'length' | 'width' | 'height'>,
  jointMm: number,
): { length: number; width: number; height: number } {
  return {
    length: unit.length + jointMm,
    width: unit.width + jointMm,
    height: unit.height + jointMm,
  };
}

export function unitVolumesM3(
  solidMm: Pick<MasonrySizeMm, 'length' | 'width' | 'height'>,
  modularMm: { length: number; width: number; height: number },
): { solid: number; modular: number } {
  const solid = (solidMm.length / 1000) * (solidMm.width / 1000) * (solidMm.height / 1000);
  const modular = (modularMm.length / 1000) * (modularMm.width / 1000) * (modularMm.height / 1000);
  return { solid, modular };
}

export function resolveOpeningAreaM2(
  openings: MasonryOpeningInput | undefined,
  steps: string[],
): number {
  if (!openings) {
    steps.push('No openings deducted.');
    return 0;
  }
  if (openings.openingArea != null && openings.openingArea > 0) {
    const unit = openings.openingAreaUnit ?? 'm2';
    const area =
      unit === 'ft2' ? requireConvert(openings.openingArea, 'ft2', 'm2') : openings.openingArea;
    steps.push(`Opening area = ${openings.openingArea} ${unit} = ${roundQuantity(area, 4)} m².`);
    return area;
  }
  const count = openings.openingCount ?? 0;
  if (count > 0 && openings.openingWidth != null && openings.openingHeight != null) {
    const w = toM(openings.openingWidth, openings.openingWidthUnit ?? 'm');
    const h = toM(openings.openingHeight, openings.openingHeightUnit ?? 'm');
    const area = count * w * h;
    steps.push(
      `Openings = ${count} × ${roundQuantity(w, 4)} m × ${roundQuantity(h, 4)} m = ${roundQuantity(area, 4)} m².`,
    );
    return area;
  }
  steps.push('No openings deducted.');
  return 0;
}

export function computeNetWall(
  wallLengthM: number,
  wallHeightM: number,
  thicknessM: number,
  openingAreaM2: number,
  steps: string[],
): { grossWallAreaM2: number; netWallAreaM2: number; netWallVolumeM3: number } {
  const grossWallAreaM2 = wallLengthM * wallHeightM;
  steps.push(
    `Gross wall area = L × H = ${roundQuantity(wallLengthM, 4)} × ${roundQuantity(wallHeightM, 4)} = ${roundQuantity(grossWallAreaM2, 4)} m².`,
  );
  if (openingAreaM2 > grossWallAreaM2) {
    throw new Error('Opening area cannot exceed gross wall area.');
  }
  const netWallAreaM2 = grossWallAreaM2 - openingAreaM2;
  steps.push(`Net wall area = gross − openings = ${roundQuantity(netWallAreaM2, 4)} m².`);
  const netWallVolumeM3 = netWallAreaM2 * thicknessM;
  steps.push(
    `Net wall volume = net area × thickness = ${roundQuantity(netWallAreaM2, 4)} × ${roundQuantity(thicknessM, 4)} = ${roundQuantity(netWallVolumeM3, 4)} m³.`,
  );
  return { grossWallAreaM2, netWallAreaM2, netWallVolumeM3 };
}
