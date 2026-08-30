/** Cement calculator constants and mix presets. */

import type { CementMixPreset, CementUseCase } from './types';

export const CEMENT_CALC_VERSION = '2026.08.1';

/** Bulk density of cement for volume→mass (indicative). */
export const CEMENT_DENSITY_KG_PER_M3 = 1440;

/** Concrete dry volume factor (voids / bulking). */
export const CONCRETE_DRY_FACTOR = 1.54;

/** Mortar / plaster / screed dry volume factor. */
export const MORTAR_DRY_FACTOR = 1.33;

export const COMMON_BAG_SIZES_KG = [25, 40, 50] as const;

export type MixRatio = {
  cement: number;
  sand: number;
  aggregate: number;
  label: string;
};

export const CONCRETE_MIX_PRESETS: Partial<Record<CementMixPreset, MixRatio>> = {
  M5: { cement: 1, sand: 5, aggregate: 10, label: 'M5 (1:5:10)' },
  'M7.5': { cement: 1, sand: 4, aggregate: 8, label: 'M7.5 (1:4:8)' },
  M10: { cement: 1, sand: 3, aggregate: 6, label: 'M10 (1:3:6)' },
  M15: { cement: 1, sand: 2, aggregate: 4, label: 'M15 (1:2:4)' },
  M20: { cement: 1, sand: 1.5, aggregate: 3, label: 'M20 (1:1.5:3)' },
  M25: { cement: 1, sand: 1, aggregate: 2, label: 'M25 (1:1:2)' },
};

export const MORTAR_MIX_PRESETS: Partial<Record<CementMixPreset, MixRatio>> = {
  mortar_1_3: { cement: 1, sand: 3, aggregate: 0, label: '1:3 cement mortar' },
  mortar_1_4: { cement: 1, sand: 4, aggregate: 0, label: '1:4 cement mortar' },
  mortar_1_5: { cement: 1, sand: 5, aggregate: 0, label: '1:5 cement mortar' },
  mortar_1_6: { cement: 1, sand: 6, aggregate: 0, label: '1:6 cement mortar' },
};

export function defaultMixForUseCase(useCase: CementUseCase): CementMixPreset {
  switch (useCase) {
    case 'concrete':
      return 'M20';
    case 'plastering':
      return 'mortar_1_4';
    case 'masonry':
      return 'mortar_1_5';
    case 'floor_screed':
      return 'mortar_1_3';
    default:
      return 'M20';
  }
}

export function resolveMixRatio(
  preset: CementMixPreset,
  custom?: { cementParts?: number; sandParts?: number; aggregateParts?: number },
): MixRatio {
  if (preset === 'custom') {
    return {
      cement: custom?.cementParts ?? 1,
      sand: custom?.sandParts ?? 1.5,
      aggregate: custom?.aggregateParts ?? 3,
      label: `Custom (${custom?.cementParts ?? 1}:${custom?.sandParts ?? 1.5}${
        (custom?.aggregateParts ?? 0) > 0 ? `:${custom?.aggregateParts}` : ''
      })`,
    };
  }
  const fromConcrete = CONCRETE_MIX_PRESETS[preset];
  if (fromConcrete) return fromConcrete;
  const fromMortar = MORTAR_MIX_PRESETS[preset];
  if (fromMortar) return fromMortar;
  return CONCRETE_MIX_PRESETS.M20!;
}

export function dryFactorForUseCase(useCase: CementUseCase): number {
  return useCase === 'concrete' ? CONCRETE_DRY_FACTOR : MORTAR_DRY_FACTOR;
}
