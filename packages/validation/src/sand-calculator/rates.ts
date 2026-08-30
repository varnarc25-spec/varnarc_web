/** Sand calculator constants. */

import type { SandUseCase } from './types';
import { CONCRETE_DRY_FACTOR, MORTAR_DRY_FACTOR } from '../cement-calculator/rates';
import { M3_TO_FT3 } from '../concrete-calculator/rates';

export const SAND_CALC_VERSION = '2026.08.1';

/** Default bulk density for dry sand (indicative river / pit sand). User-editable. */
export const DEFAULT_SAND_DENSITY_KG_PER_M3 = 1600;

export { CONCRETE_DRY_FACTOR, MORTAR_DRY_FACTOR, M3_TO_FT3 };

export function dryFactorForSandUseCase(useCase: SandUseCase): number | null {
  switch (useCase) {
    case 'concrete':
      return CONCRETE_DRY_FACTOR;
    case 'masonry':
    case 'plaster':
      return MORTAR_DRY_FACTOR;
    case 'filling':
    case 'generic_volume':
      return null;
    default:
      return null;
  }
}

export const SAND_USE_CASE_LABELS: Record<SandUseCase, string> = {
  concrete: 'Concrete mix sand',
  masonry: 'Masonry mortar sand',
  plaster: 'Plaster mortar sand',
  filling: 'Filling / bedding sand',
  generic_volume: 'Generic sand volume',
};
