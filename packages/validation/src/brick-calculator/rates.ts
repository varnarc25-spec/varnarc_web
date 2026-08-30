/** Brick calculator constants and standard sizes (mm). */

import type { BrickSizePreset } from './types';

export const BRICK_CALC_VERSION = '2026.08.1';

export type BrickSizeMm = {
  length: number;
  width: number;
  height: number;
  label: string;
};

/** Common brick / block sizes in millimetres (L × W × H). */
export const BRICK_SIZE_PRESETS: Record<Exclude<BrickSizePreset, 'custom'>, BrickSizeMm> = {
  indian_modular: {
    length: 190,
    width: 90,
    height: 90,
    label: 'Indian modular (190×90×90 mm)',
  },
  indian_traditional: {
    length: 230,
    width: 110,
    height: 75,
    label: 'Indian traditional (230×110×75 mm)',
  },
  english_standard: {
    length: 215,
    width: 102.5,
    height: 65,
    label: 'English standard (215×102.5×65 mm)',
  },
  aac_600x200x100: {
    length: 600,
    width: 100,
    height: 200,
    label: 'AAC block 600×200×100 mm',
  },
  aac_600x200x150: {
    length: 600,
    width: 150,
    height: 200,
    label: 'AAC block 600×200×150 mm',
  },
  aac_600x200x200: {
    length: 600,
    width: 200,
    height: 200,
    label: 'AAC block 600×200×200 mm',
  },
};

export function resolveBrickSizeMm(
  preset: BrickSizePreset,
  custom?: { length?: number; width?: number; height?: number },
): BrickSizeMm {
  if (preset === 'custom') {
    const length = custom?.length ?? 190;
    const width = custom?.width ?? 90;
    const height = custom?.height ?? 90;
    return {
      length,
      width,
      height,
      label: `Custom (${length}×${width}×${height} mm)`,
    };
  }
  return BRICK_SIZE_PRESETS[preset];
}

export function listBrickSizePresets(): Array<{ value: BrickSizePreset; label: string }> {
  const items: Array<{ value: BrickSizePreset; label: string }> = (
    Object.keys(BRICK_SIZE_PRESETS) as Array<Exclude<BrickSizePreset, 'custom'>>
  ).map((value) => ({
    value,
    label: BRICK_SIZE_PRESETS[value].label,
  }));
  items.push({ value: 'custom', label: 'Custom brick / block size' });
  return items;
}
