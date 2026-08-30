/** Shared reverse-calculation display contract for Construction calculators. */

export const REVERSE_CALC_SYSTEM_VERSION = '2026.08.1';

export type ReverseCalculationDisplay = {
  mode: 'reverse';
  /** Explicit planning assumptions used for the reverse estimate. */
  assumptions: string[];
  /** Selected output (or governing) unit shown to the user. */
  selectedUnit: string;
  /** Wastage or planning buffer percent applied in the reverse formula. */
  wastagePercent: number;
  /** Label for the wastage/buffer field (e.g. “Wastage”, “Contingency buffer”). */
  wastageLabel: string;
  /** Human-readable formula for the reverse path. */
  formula: string;
  /** Limitations — never claims compliance or guaranteed coverage. */
  limitations: string[];
};

export function buildReverseCalculationDisplay(input: {
  assumptions: string[];
  selectedUnit: string;
  wastagePercent: number;
  wastageLabel?: string;
  formula: string;
  limitations: string[];
}): ReverseCalculationDisplay {
  return {
    mode: 'reverse',
    assumptions: input.assumptions,
    selectedUnit: input.selectedUnit,
    wastagePercent: input.wastagePercent,
    wastageLabel: input.wastageLabel ?? 'Wastage',
    formula: input.formula,
    limitations: input.limitations,
  };
}

export const REVERSE_CALC_COMMON_LIMITATIONS = [
  'Reverse results are indicative planning figures only — not a BOQ, quote or guarantee.',
  'Site conditions, product grade, workmanship and wastage will change real coverage or size.',
  'Always confirm with drawings, mix design and local professionals before buying or building.',
];
