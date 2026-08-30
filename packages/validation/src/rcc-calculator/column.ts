/** Column-focused wrapper around shared RCC / concrete volume utilities. */

import { calculateRccQuantity } from './calculate';
import type { RccCalculatorInput, RccCalculatorResult } from './types';

export type ColumnVolumeInput = Omit<RccCalculatorInput, 'element'>;

/**
 * Concrete column volume (rectangular B×D×H or circular π(Ø/2)²H) via shared RCC calculation.
 * Does not provide structural design or load-capacity calculations.
 */
export function calculateColumnVolume(raw: ColumnVolumeInput): RccCalculatorResult {
  return calculateRccQuantity({ ...raw, element: 'column' });
}
