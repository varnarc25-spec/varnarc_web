/** AAC block size presets (mm). */

import type { AacBlockPreset } from './types';
import type { MasonrySizeMm } from '../masonry-wall/types';

export const AAC_CALC_VERSION = '2026.08.1';

/** Typical thin-bed AAC adhesive bulk density for volume → kg. */
export const DEFAULT_AAC_ADHESIVE_DENSITY_KG_PER_M3 = 1500;

export const AAC_BLOCK_PRESETS: Record<Exclude<AacBlockPreset, 'custom'>, MasonrySizeMm> = {
  aac_600x200x75: {
    length: 600,
    width: 75,
    height: 200,
    label: 'AAC 600×200×75 mm',
  },
  aac_600x200x100: {
    length: 600,
    width: 100,
    height: 200,
    label: 'AAC 600×200×100 mm',
  },
  aac_600x200x125: {
    length: 600,
    width: 125,
    height: 200,
    label: 'AAC 600×200×125 mm',
  },
  aac_600x200x150: {
    length: 600,
    width: 150,
    height: 200,
    label: 'AAC 600×200×150 mm',
  },
  aac_600x200x200: {
    length: 600,
    width: 200,
    height: 200,
    label: 'AAC 600×200×200 mm',
  },
  aac_600x200x225: {
    length: 600,
    width: 225,
    height: 200,
    label: 'AAC 600×200×225 mm',
  },
  aac_600x200x250: {
    length: 600,
    width: 250,
    height: 200,
    label: 'AAC 600×200×250 mm',
  },
  aac_600x200x300: {
    length: 600,
    width: 300,
    height: 200,
    label: 'AAC 600×200×300 mm',
  },
};

export function resolveAacBlockSizeMm(
  preset: AacBlockPreset,
  custom?: { length?: number; width?: number; height?: number },
): MasonrySizeMm {
  if (preset === 'custom') {
    const length = custom?.length ?? 600;
    const width = custom?.width ?? 200;
    const height = custom?.height ?? 200;
    return {
      length,
      width,
      height,
      label: `Custom AAC (${length}×${width}×${height} mm)`,
    };
  }
  return AAC_BLOCK_PRESETS[preset];
}

export function listAacBlockPresets(): Array<{ value: AacBlockPreset; label: string }> {
  const items: Array<{ value: AacBlockPreset; label: string }> = (
    Object.keys(AAC_BLOCK_PRESETS) as Array<Exclude<AacBlockPreset, 'custom'>>
  ).map((value) => ({
    value,
    label: AAC_BLOCK_PRESETS[value].label,
  }));
  items.push({ value: 'custom', label: 'Custom AAC block size' });
  return items;
}
