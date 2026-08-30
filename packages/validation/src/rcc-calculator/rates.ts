/** RCC calculator constants — preliminary planning only. */

import type { RccElement, RccGrade } from './types';
import { CONCRETE_DRY_FACTOR } from '../cement-calculator/rates';

export const RCC_CALC_VERSION = '2026.08.1';

export { CONCRETE_DRY_FACTOR };

export const CEMENT_DENSITY_KG_PER_M3 = 1440;
export const DEFAULT_BAG_SIZE_KG = 50;

export const RCC_ELEMENT_LABELS: Record<RccElement, string> = {
  slab: 'Slab',
  beam: 'Beam',
  column: 'Column',
  footing: 'Footing',
};

export const RCC_ELEMENT_FORMULAS: Record<RccElement, string> = {
  slab: 'V = L × W × T × qty',
  beam: 'V = L × B × D × qty',
  column: 'V = B × D × H × qty (rectangular) · V = π × (Ø/2)² × H × qty (circular)',

  footing: 'V = L × W × D × qty (square: L × L × D); optional V_pcc = L × W × t_pcc × qty',
};

/**
 * Preliminary thumb-rule steel ranges (kg per m³ of concrete).
 * NOT a substitute for structural design / BBS.
 */
export type RccSteelRatioBand = {
  min: number;
  typical: number;
  max: number;
  note: string;
};

export const RCC_PRELIMINARY_STEEL_KG_PER_M3: Record<RccElement, RccSteelRatioBand> = {
  slab: {
    min: 80,
    typical: 90,
    max: 100,
    note: 'Common preliminary slab range ~80–100 kg/m³ of concrete.',
  },
  beam: {
    min: 100,
    typical: 120,
    max: 150,
    note: 'Common preliminary beam range ~100–150 kg/m³ of concrete.',
  },
  column: {
    min: 150,
    typical: 200,
    max: 250,
    note: 'Common preliminary column range ~150–250 kg/m³ of concrete.',
  },
  footing: {
    min: 50,
    typical: 65,
    max: 80,
    note: 'Common preliminary footing range ~50–80 kg/m³ of concrete.',
  },
};

export const RCC_STRUCTURAL_DISCLAIMER =
  'Actual reinforcement must follow structural drawings prepared by a qualified engineer. Indicative steel figures are preliminary thumb-rule ranges for planning only and must not replace structural design, detailing or a bar bending schedule (BBS).';

/** Map RCC grade to cement mix preset keys used by resolveMixRatio. */
export function rccGradeToMixPreset(grade: RccGrade): string {
  if (grade === 'custom') return 'custom';
  return grade;
}

export const RCC_GRADE_DEFAULT_PARTS: Partial<
  Record<Exclude<RccGrade, 'custom'>, { c: number; s: number; a: number }>
> = {
  M15: { c: 1, s: 2, a: 4 },
  M20: { c: 1, s: 1.5, a: 3 },
  M25: { c: 1, s: 1, a: 2 },
  M30: { c: 1, s: 1, a: 1.5 },
};
