/** Footing-focused wrapper around shared RCC / concrete volume utilities. */

import { calculateRccQuantity } from './calculate';
import type { RccCalculatorInput, RccCalculatorResult } from './types';

export type FootingVolumeInput = Omit<RccCalculatorInput, 'element'>;

/**
 * Footing RCC volume (rectangular or square) with optional lean PCC bed.
 * Does not size footings from building loads or provide structural design.
 */
export function calculateFootingVolume(raw: FootingVolumeInput): RccCalculatorResult {
  return calculateRccQuantity({ ...raw, element: 'footing' });
}
