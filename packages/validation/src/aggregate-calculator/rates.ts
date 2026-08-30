/** Aggregate calculator constants. */

import type { AggregateUseCase } from './types';
import { CONCRETE_DRY_FACTOR } from '../cement-calculator/rates';
import { M3_TO_FT3 } from '../concrete-calculator/rates';

export const AGGREGATE_CALC_VERSION = '2026.08.1';

/** Default bulk density for crushed stone / jelly (indicative). User-editable. */
export const DEFAULT_AGGREGATE_DENSITY_KG_PER_M3 = 1500;

export { CONCRETE_DRY_FACTOR, M3_TO_FT3 };

export function dryFactorForAggregateUseCase(useCase: AggregateUseCase): number | null {
  return useCase === 'concrete' ? CONCRETE_DRY_FACTOR : null;
}

export const AGGREGATE_USE_CASE_LABELS: Record<AggregateUseCase, string> = {
  concrete: 'Concrete mix aggregate',
  generic_fill: 'Generic fill / bedding',
  area_depth: 'Area × depth fill',
};
