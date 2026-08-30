/** Plaster calculator constants and transparent surface presets. */

import type { PlasterMixPreset, PlasterPreset } from './types';

export const PLASTER_CALC_VERSION = '2026.08.1';

/**
 * Convenience presets — only apply suggested thickness + mix.
 * Users can always override both. Assumptions are returned in the result.
 */
export type PlasterPresetDefaults = {
  label: string;
  thicknessMm: number;
  mixPreset: Exclude<PlasterMixPreset, 'custom'>;
  assumptions: string[];
};

export const PLASTER_SURFACE_PRESETS: Record<
  Exclude<PlasterPreset, 'custom'>,
  PlasterPresetDefaults
> = {
  interior_wall: {
    label: 'Interior wall',
    thicknessMm: 12,
    mixPreset: 'mortar_1_4',
    assumptions: [
      'Interior wall plaster default thickness 12 mm (common single-coat planning value).',
      'Default mix 1:4 cement:sand — override if your specification differs.',
    ],
  },
  exterior_wall: {
    label: 'Exterior wall',
    thicknessMm: 15,
    mixPreset: 'mortar_1_4',
    assumptions: [
      'Exterior wall plaster default thickness 15 mm (indicative weather-coat planning).',
      'Default mix 1:4 cement:sand — site specs often use 1:3 or waterproofing additives.',
    ],
  },
  ceiling: {
    label: 'Ceiling',
    thicknessMm: 10,
    mixPreset: 'mortar_1_4',
    assumptions: [
      'Ceiling plaster default thickness 10 mm (lighter coat planning value).',
      'Default mix 1:4 cement:sand — confirm with finishing specification.',
    ],
  },
};

export function getPlasterPresetDefaults(preset: PlasterPreset): PlasterPresetDefaults | null {
  if (preset === 'custom') return null;
  return PLASTER_SURFACE_PRESETS[preset];
}
