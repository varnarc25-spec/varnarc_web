/** Concrete calculator constants — reuses cement mix / dry-factor conventions. */

import {
  CEMENT_DENSITY_KG_PER_M3,
  CONCRETE_DRY_FACTOR,
  CONCRETE_MIX_PRESETS,
  resolveMixRatio,
  type MixRatio,
} from '../cement-calculator/rates';
import type { ConcreteMixPreset, ConcreteShape } from './types';

export const CONCRETE_CALC_VERSION = '2026.08.1';

export { CEMENT_DENSITY_KG_PER_M3, CONCRETE_DRY_FACTOR };

/** Default water–cement ratio by mass (indicative site planning). */
export const DEFAULT_WATER_CEMENT_RATIO = 0.45;

export const M3_TO_FT3 = 35.314666721;

export const SHAPE_LABELS: Record<ConcreteShape, string> = {
  slab: 'Slab',
  rectangular_footing: 'Rectangular footing',
  column: 'Rectangular column',
  wall: 'Wall',
  circular_column: 'Circular column',
  custom_rectangular: 'Custom rectangular volume',
};

export const SHAPE_FORMULAS: Record<ConcreteShape, string> = {
  slab: 'V = L × W × T',
  rectangular_footing: 'V = L × W × D',
  column: 'V = L × W × H',
  wall: 'V = L × H × T',
  circular_column: 'V = π × r² × H',
  custom_rectangular: 'V = L × W × H',
};

export function resolveConcreteMix(
  preset: ConcreteMixPreset,
  custom?: { cementParts?: number; sandParts?: number; aggregateParts?: number },
): MixRatio {
  return resolveMixRatio(preset, custom);
}

export function listConcreteMixPresets(): Array<{ value: ConcreteMixPreset; label: string }> {
  const presets: Array<{ value: ConcreteMixPreset; label: string }> = (
    Object.keys(CONCRETE_MIX_PRESETS) as ConcreteMixPreset[]
  )
    .filter((k) => k in CONCRETE_MIX_PRESETS)
    .map((value) => ({
      value,
      label: CONCRETE_MIX_PRESETS[value]!.label,
    }));
  presets.push({ value: 'custom', label: 'Custom mix ratio' });
  return presets;
}
