/** Centralized planning factors for the whole-house material quantity calculator. */

import {
  DEFAULT_COST_SPLIT,
  LOCATION_MULTIPLIERS,
  QUALITY_QTY_FACTOR,
} from '../construction-cost/rates';
import type { ConstructionCostQuality } from '../construction-cost/types';

export const MATERIAL_QUANTITY_CALC_VERSION = '2026.09.1';

export const MATERIAL_QUANTITY_DISCLAIMER =
  'Indicative estimate. Verify quantities and local rates with your engineer, contractor or supplier.';

export const MATERIAL_QUANTITY_DEFAULT_WASTAGE_PERCENT = 5;

/**
 * Per sq ft quantities at standard quality, 1 floor, 0% wastage, RCC framed,
 * clay brick walls, RCC slab, isolated footing.
 */
export const constructionMaterialFactors = {
  cementBags: 0.4133333333,
  steelKg: 3.8666666667,
  sandTonnes: 0.028,
  aggregateTonnes: 0.0373333333,
  bricks: 8,
  aacBlocks: 4.4,
  tilesSqft: 1.1,
  paintLitres: 0.1466666667,
  electricalSqft: 1,
  plumbingSqft: 1,
} as const;

export const materialRates = {
  cementPerBag: 390,
  steelPerKg: 64,
  sandPerTonne: 2200,
  aggregatePerTonne: 1800,
  brickEach: 8,
  aacBlockEach: 42,
  tilePerSqft: 55,
  paintPerLitre: 280,
  electricalPerSqft: 185,
  plumbingPerSqft: 145,
} as const;

/** City multipliers applied to indicative rates (not quantities). */
export const cityRateMultipliers = Object.fromEntries(
  Object.entries(LOCATION_MULTIPLIERS).map(([key, value]) => [key, value.multiplier]),
) as Record<string, number>;

export const qualityMultipliers: Record<ConstructionCostQuality, number> = {
  ...QUALITY_QTY_FACTOR,
};

/** Extra structure quantity vs 1 floor at the same built-up area. */
export const floorStructureIncrement = 0.04;

export const structureTypeFactors = {
  rcc_framed: { structural: 1, masonry: 1, finishing: 1 },
  load_bearing: { structural: 0.88, masonry: 1.12, finishing: 1 },
  steel: { structural: 1.18, masonry: 0.9, finishing: 1 },
} as const;

export const wallTypeFactors = {
  clay_brick: { masonry: 1, masonryKind: 'bricks' as const },
  aac: { masonry: 1, masonryKind: 'aac' as const },
  mixed: { masonry: 1, masonryKind: 'bricks' as const },
} as const;

export const slabTypeFactors = {
  rcc: { structural: 1, finishing: 1 },
  filler: { structural: 0.92, finishing: 1 },
  prestressed: { structural: 0.9, finishing: 1 },
} as const;

export const foundationTypeFactors = {
  isolated: { structural: 1 },
  raft: { structural: 1.08 },
  pile: { structural: 1.14 },
  combined: { structural: 1.04 },
} as const;

export const materialCostSplit = {
  materialPercent: DEFAULT_COST_SPLIT.materialPercent,
  labourPercent: DEFAULT_COST_SPLIT.labourPercent,
  otherPercent: DEFAULT_COST_SPLIT.miscPercent,
} as const;

export type MaterialLineId =
  | 'cement'
  | 'steel'
  | 'sand'
  | 'aggregate'
  | 'masonry'
  | 'tiles'
  | 'paint'
  | 'electrical'
  | 'plumbing';

export const MATERIAL_LINE_META: Record<
  MaterialLineId,
  { label: string; unit: string; group: 'structural' | 'masonry' | 'finishing' | 'services' }
> = {
  cement: { label: 'Cement', unit: 'bags', group: 'structural' },
  steel: { label: 'Steel / TMT', unit: 'kg', group: 'structural' },
  sand: { label: 'Sand', unit: 'tonnes', group: 'structural' },
  aggregate: { label: 'Aggregate', unit: 'tonnes', group: 'structural' },
  masonry: { label: 'Bricks / AAC blocks', unit: 'pieces', group: 'masonry' },
  tiles: { label: 'Flooring / Tiles', unit: 'sq ft', group: 'finishing' },
  paint: { label: 'Paint', unit: 'litres', group: 'finishing' },
  electrical: { label: 'Electrical', unit: 'sq ft', group: 'services' },
  plumbing: { label: 'Plumbing', unit: 'sq ft', group: 'services' },
};
