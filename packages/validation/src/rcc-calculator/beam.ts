/** Beam-focused wrapper around shared RCC / concrete volume utilities. */

import { calculateRccQuantity } from './calculate';
import type { RccCalculatorInput, RccCalculatorResult } from './types';

export type BeamVolumeInput = Omit<RccCalculatorInput, 'element'>;

/**
 * Concrete beam volume (B × D × L × qty) via shared RCC calculation.
 * Does not generate structural reinforcement design.
 */
export function calculateBeamVolume(raw: BeamVolumeInput): RccCalculatorResult {
  return calculateRccQuantity({ ...raw, element: 'beam' });
}
