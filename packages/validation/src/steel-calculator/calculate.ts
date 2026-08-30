import { convertUnit } from '../construction-engine/units';
import { roundMoney, roundQuantity } from '../construction-engine/money';
import {
  REBAR_MASS_FORMULA,
  REBAR_WEIGHT_DIVISOR,
  STEEL_CALC_VERSION,
  rebarWeightFromDensityKgPerM,
} from './rates';
import {
  steelCalculatorInputSchema,
  type SteelBarRowResult,
  type SteelCalculatorInput,
  type SteelCalculatorResult,
} from './types';

function requireConvert(value: number, from: string, to: string): number {
  const r = convertUnit(value, from, to);
  if (!r.ok) throw new Error(r.error);
  return r.value;
}

/**
 * Unit weight of rebar in kg per metre using the standard site formula d²/162.
 */
export function calculateRebarWeightPerMetre(diameterMm: number): number {
  if (!Number.isFinite(diameterMm) || diameterMm <= 0) {
    throw new Error('Diameter must be a positive number (mm).');
  }
  return (diameterMm * diameterMm) / REBAR_WEIGHT_DIVISOR;
}

/**
 * Weight for one bar run: unit weight × length (m) × quantity.
 */
export function calculateRebarRowWeightKg(
  diameterMm: number,
  lengthM: number,
  quantity: number,
): number {
  const w = calculateRebarWeightPerMetre(diameterMm);
  return w * lengthM * quantity;
}

function rowLabel(diameterMm: number, customLabel?: string): string {
  if (customLabel?.trim()) return customLabel.trim();
  return `Ø${diameterMm} mm`;
}

/**
 * Multi-row steel / TMT rebar weight calculator.
 */
export function calculateSteelWeight(raw: SteelCalculatorInput): SteelCalculatorResult {
  const input = steelCalculatorInputSchema.parse(raw);
  const steps: string[] = [
    `Formula: ${REBAR_MASS_FORMULA} (d in mm).`,
    `Divisor ${REBAR_WEIGHT_DIVISOR} approximates π/4 × ${7850} kg/m³ steel density.`,
  ];

  const rows: SteelBarRowResult[] = input.rows.map((row, index) => {
    const lengthM = requireConvert(row.length, row.lengthUnit, 'm');
    const unitWeightKgPerM = calculateRebarWeightPerMetre(row.diameterMm);
    const totalLengthM = lengthM * row.quantity;
    const totalWeightKg = unitWeightKgPerM * totalLengthM;
    const label = rowLabel(row.diameterMm, row.label);

    steps.push(
      `Row ${index + 1} (${label}): w = ${row.diameterMm}²/${REBAR_WEIGHT_DIVISOR} = ${roundQuantity(unitWeightKgPerM, 4)} kg/m; length ${row.length} ${row.lengthUnit} = ${roundQuantity(lengthM, 4)} m × qty ${row.quantity} → ${roundQuantity(totalWeightKg, 3)} kg.`,
    );

    return {
      id: row.id,
      label,
      diameterMm: row.diameterMm,
      lengthM: roundQuantity(lengthM, 4),
      quantity: row.quantity,
      unitWeightKgPerM: roundQuantity(unitWeightKgPerM, 4),
      totalLengthM: roundQuantity(totalLengthM, 4),
      totalWeightKg: roundQuantity(totalWeightKg, 3),
    };
  });

  const totalWeightKg = roundQuantity(
    rows.reduce((sum, r) => sum + r.totalWeightKg, 0),
    3,
  );
  const totalLengthM = roundQuantity(
    rows.reduce((sum, r) => sum + r.totalLengthM, 0),
    4,
  );
  const totalWeightTonnes = roundQuantity(totalWeightKg / 1000, 4);

  steps.push(
    `Total weight = ${totalWeightKg} kg = ${totalWeightTonnes} tonnes; total bar length = ${totalLengthM} m.`,
  );

  let estimatedCostInr: number | null = null;
  const rate = input.ratePerKgInr ?? null;
  if (rate != null && rate > 0) {
    estimatedCostInr = roundMoney(totalWeightKg * rate);
    steps.push(`Estimated cost = ${totalWeightKg} kg × ₹${rate}/kg = ₹${estimatedCostInr}.`);
  }

  return {
    rows,
    totalWeightKg,
    totalWeightTonnes,
    totalLengthM,
    estimatedCostInr,
    ratePerKgInr: rate,
    formula: REBAR_MASS_FORMULA,
    formulaExplanation:
      'Unit weight w in kg per metre equals diameter in mm squared, divided by 162. Total weight = w × length(m) × quantity.',
    steps,
    assumptions: [
      `Uses the standard field formula ${REBAR_MASS_FORMULA}.`,
      `Steel density reference ≈ 7850 kg/m³ (exact π/4·ρ·d² method ≈ d²/162.28).`,
      'Does not include wastage, laps, chairs, or binding wire unless entered as separate rows.',
      'Indicative planning figures — confirm with bar bending schedule and supplier certificates.',
    ],
    disclaimer:
      'This steel weight estimate is educational only. It is not a structural design or purchase order. Verify diameters, lengths and rates with drawings and suppliers.',
    version: STEEL_CALC_VERSION,
  };
}

/** Expose density-based check for documentation / tests. */
export { rebarWeightFromDensityKgPerM };
