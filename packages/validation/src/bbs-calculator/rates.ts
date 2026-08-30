/** Bar Bending Schedule — quantity organization (not structural design). */

export const BBS_CALC_VERSION = '2026.08.1';

export const BBS_STRUCTURAL_DISCLAIMER =
  'This Bar Bending Schedule workspace organizes quantities from user-entered reinforcement details only. It does not invent bars from architectural dimensions and is not a structural design tool.';

export const BBS_BAR_SHAPE_LABELS: Record<string, string> = {
  straight: 'Straight',
  l_bar: 'L-bar',
  u_bar: 'U-bar',
  stirrup: 'Stirrup',
  cranked: 'Cranked',
  bent_up: 'Bent-up',
  spiral: 'Spiral',
  other: 'Other',
};

export function bbsShapeLabel(shape: string): string {
  return BBS_BAR_SHAPE_LABELS[shape] ?? shape;
}
