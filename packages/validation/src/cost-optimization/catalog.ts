/** Catalog of budget-reduction levers — structural items are never included as auto-savings. */

import type { OptimizationLever, OptimizationSafetyClass } from './types';

export const COST_OPTIMIZATION_VERSION = '2026.08.1';

/** Never offered as automatic savings — professional design only. */
export const STRUCTURAL_EXCLUSIONS = [
  {
    id: 'reinforcement',
    label: 'Reinforcement / TMT steel grade or quantity',
    reason:
      'Reducing steel below design requirements is structurally unsafe and is never suggested by this tool.',
  },
  {
    id: 'concrete_strength',
    label: 'Concrete grade / mix strength',
    reason:
      'Concrete strength is a structural design decision. Downgrading mix to save money is never auto-recommended.',
  },
  {
    id: 'foundation_design',
    label: 'Foundation type or depth',
    reason:
      'Foundation design depends on soil and loads. Changes require a structural engineer — never auto-downgraded.',
  },
  {
    id: 'load_bearing_sections',
    label: 'Beam / column / slab sections',
    reason: 'Member sizes are design-critical and are excluded from automatic budget cuts.',
  },
] as const;

export type LeverTemplate = {
  id: string;
  category: string;
  label: string;
  safetyClass: OptimizationSafetyClass;
  selectable: boolean;
  structurallySafe: boolean;
  tradeOff: string;
  /**
   * How savings are estimated from the current engine result.
   * - engine_area_pct: reduce built-up area by pct
   * - engine_quality_step: step quality down one tier
   * - engine_interior_step: step interior down one tier
   * - category_share: fraction of a category breakdown line
   * - advisory_only: shown under professional review with estimate but soft
   */
  estimate:
    | { kind: 'engine_area_pct'; pct: number }
    | { kind: 'engine_quality_step' }
    | { kind: 'engine_interior_step' }
    | { kind: 'category_share'; categoryId: string; fraction: number }
    | { kind: 'advisory_only'; fractionOfTotal: number };
};

export const OPTIMIZATION_LEVER_TEMPLATES: LeverTemplate[] = [
  {
    id: 'area_trim_5',
    category: 'built-up area',
    label: 'Reduce built-up area by ~5%',
    safetyClass: 'safe_planning',
    selectable: true,
    structurallySafe: true,
    tradeOff: 'Slightly smaller rooms or fewer utility spaces; layout must still meet your needs.',
    estimate: { kind: 'engine_area_pct', pct: 5 },
  },
  {
    id: 'area_trim_10',
    category: 'built-up area',
    label: 'Reduce built-up area by ~10%',
    safetyClass: 'safe_planning',
    selectable: true,
    structurallySafe: true,
    tradeOff: 'Noticeable space reduction — confirm with your architect before freezing plans.',
    estimate: { kind: 'engine_area_pct', pct: 10 },
  },
  {
    id: 'quality_step_down',
    category: 'overall finish quality',
    label: 'Step down overall finish quality by one tier',
    safetyClass: 'finish_spec',
    selectable: true,
    structurallySafe: true,
    tradeOff: 'Lower-spec fittings and finishes; structure assumptions stay unchanged.',
    estimate: { kind: 'engine_quality_step' },
  },
  {
    id: 'interior_step_down',
    category: 'interior level',
    label: 'Simplify interior package (one step down)',
    safetyClass: 'finish_spec',
    selectable: true,
    structurallySafe: true,
    tradeOff: 'Fewer premium interiors; shell/structure unchanged.',
    estimate: { kind: 'engine_interior_step' },
  },
  {
    id: 'flooring_spec',
    category: 'flooring specification',
    label: 'Choose mid-range flooring instead of premium',
    safetyClass: 'finish_spec',
    selectable: true,
    structurallySafe: true,
    tradeOff: 'Different look/feel and possibly shorter aesthetic life — not a structural change.',
    estimate: { kind: 'category_share', categoryId: 'flooring', fraction: 0.22 },
  },
  {
    id: 'paint_spec',
    category: 'paint specification',
    label: 'Use standard emulsion instead of premium coatings',
    safetyClass: 'finish_spec',
    selectable: true,
    structurallySafe: true,
    tradeOff: 'May need more frequent repainting; no structural impact.',
    estimate: { kind: 'category_share', categoryId: 'paint', fraction: 0.28 },
  },
  {
    id: 'doors_windows',
    category: 'doors/windows',
    label: 'Simplify door/window sections and hardware',
    safetyClass: 'finish_spec',
    selectable: true,
    structurallySafe: true,
    tradeOff:
      'Acoustics, security hardware and aesthetics may change — keep fire/egress compliance.',
    estimate: { kind: 'category_share', categoryId: 'doors_windows', fraction: 0.2 },
  },
  {
    id: 'bathroom_fixtures',
    category: 'bathroom fixtures',
    label: 'Select mid-range sanitaryware and fittings',
    safetyClass: 'finish_spec',
    selectable: true,
    structurallySafe: true,
    tradeOff: 'Brand/finish level drops; plumbing layout can stay the same.',
    estimate: { kind: 'category_share', categoryId: 'plumbing', fraction: 0.25 },
  },
  {
    id: 'kitchen_package',
    category: 'kitchen',
    label: 'Right-size modular kitchen package',
    safetyClass: 'finish_spec',
    selectable: true,
    structurallySafe: true,
    tradeOff: 'Fewer soft-close units / simpler counters — not a structural item.',
    estimate: { kind: 'category_share', categoryId: 'other', fraction: 0.12 },
  },
  {
    id: 'false_ceiling',
    category: 'false ceiling',
    label: 'Limit false ceiling to living/dining only',
    safetyClass: 'finish_spec',
    selectable: true,
    structurallySafe: true,
    tradeOff: 'Less cove lighting and AC concealment in secondary rooms.',
    estimate: { kind: 'category_share', categoryId: 'other', fraction: 0.08 },
  },
  {
    id: 'external_finishes',
    category: 'external finishes',
    label: 'Simplify external cladding / texture paints',
    safetyClass: 'finish_spec',
    selectable: true,
    structurallySafe: true,
    tradeOff: 'Elevation look changes; waterproofing must still be specified correctly.',
    estimate: { kind: 'category_share', categoryId: 'other', fraction: 0.1 },
  },
  {
    id: 'non_structural_grades',
    category: 'material grades (non-structural)',
    label: 'Substitute non-structural finish grades (tiles, laminates, hardware)',
    safetyClass: 'finish_spec',
    selectable: true,
    structurallySafe: true,
    tradeOff: 'Only finish grades — never reinforcement, concrete grade, or foundation materials.',
    estimate: { kind: 'category_share', categoryId: 'flooring', fraction: 0.1 },
  },
  {
    id: 'contingency_review',
    category: 'contingency',
    label: 'Review contingency buffer with your project manager',
    safetyClass: 'professional_review',
    selectable: false,
    structurallySafe: true,
    tradeOff:
      'Lower contingency increases risk of mid-project shortfalls — decide with a professional.',
    estimate: { kind: 'advisory_only', fractionOfTotal: 0.03 },
  },
  {
    id: 'phasing_review',
    category: 'project phasing',
    label: 'Phase non-critical interiors to a later stage',
    safetyClass: 'professional_review',
    selectable: false,
    structurallySafe: true,
    tradeOff:
      'Cash outlay drops now but total project cost may not fall — plan sequencing carefully.',
    estimate: { kind: 'advisory_only', fractionOfTotal: 0.04 },
  },
];

export function emptyLever(partial: OptimizationLever): OptimizationLever {
  return partial;
}
