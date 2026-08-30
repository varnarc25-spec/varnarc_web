import { convertUnit } from '../construction-engine/units';
import { roundMoney, roundQuantity } from '../construction-engine/money';
import { calculateRebarWeightPerMetre } from '../steel-calculator/calculate';
import { REBAR_MASS_FORMULA, REBAR_WEIGHT_DIVISOR } from '../steel-calculator/rates';
import { BBS_CALC_VERSION, BBS_STRUCTURAL_DISCLAIMER, bbsShapeLabel } from './rates';
import {
  bbsScheduleInputSchema,
  type BbsGroupTotal,
  type BbsScheduleInput,
  type BbsScheduleResult,
  type BbsScheduleRowResult,
} from './types';

function requireConvert(value: number, from: string, to: string): number {
  const r = convertUnit(value, from, to);
  if (!r.ok) throw new Error(r.error);
  return r.value;
}

function accumulateGroup(
  map: Map<string, BbsGroupTotal>,
  key: string,
  label: string,
  row: BbsScheduleRowResult,
): void {
  const existing = map.get(key);
  if (existing) {
    existing.totalLengthM = roundQuantity(existing.totalLengthM + row.totalLengthM, 4);
    existing.totalWeightKg = roundQuantity(existing.totalWeightKg + row.totalWeightKg, 3);
    existing.barCount += row.quantity;
    existing.rowCount += 1;
  } else {
    map.set(key, {
      key,
      label,
      totalLengthM: row.totalLengthM,
      totalWeightKg: row.totalWeightKg,
      barCount: row.quantity,
      rowCount: 1,
    });
  }
}

/**
 * Build a bar bending schedule from user-entered reinforcement details.
 * Does not invent bars from architectural dimensions or perform structural design.
 */
export function calculateBbsSchedule(raw: BbsScheduleInput): BbsScheduleResult {
  const input = bbsScheduleInputSchema.parse(raw);
  const steps: string[] = [
    `Unit weight formula: ${REBAR_MASS_FORMULA} (d in mm).`,
    'Cutting lengths are taken from user entries — not generated from architectural dimensions.',
  ];

  const rows: BbsScheduleRowResult[] = input.rows.map((row, index) => {
    const cuttingLengthM = requireConvert(row.cuttingLength, row.cuttingLengthUnit, 'm');
    const unitWeightKgPerM = calculateRebarWeightPerMetre(row.diameterMm);
    const totalLengthM = cuttingLengthM * row.quantity;
    const totalWeightKg = unitWeightKgPerM * totalLengthM;
    const shapeLabel = bbsShapeLabel(row.shape);
    const notes = row.notes?.trim() ? row.notes.trim() : null;

    steps.push(
      `Row ${index + 1} [${row.barMark}] ${row.member}: Ø${row.diameterMm} ${shapeLabel}; CL ${roundQuantity(cuttingLengthM, 4)} m × ${row.quantity} → length ${roundQuantity(totalLengthM, 4)} m; w=${roundQuantity(unitWeightKgPerM, 4)} kg/m → ${roundQuantity(totalWeightKg, 3)} kg.`,
    );

    return {
      id: row.id,
      barMark: row.barMark.trim(),
      member: row.member.trim(),
      diameterMm: row.diameterMm,
      shape: row.shape,
      shapeLabel,
      quantity: row.quantity,
      cuttingLengthM: roundQuantity(cuttingLengthM, 4),
      notes,
      unitWeightKgPerM: roundQuantity(unitWeightKgPerM, 4),
      totalLengthM: roundQuantity(totalLengthM, 4),
      totalWeightKg: roundQuantity(totalWeightKg, 3),
    };
  });

  const byDiameter = new Map<string, BbsGroupTotal>();
  const byMember = new Map<string, BbsGroupTotal>();
  for (const row of rows) {
    accumulateGroup(byDiameter, `d${row.diameterMm}`, `Ø${row.diameterMm} mm`, row);
    accumulateGroup(byMember, row.member.toLowerCase(), row.member, row);
  }

  const totalsByDiameter = [...byDiameter.values()].sort(
    (a, b) => Number(a.label.replace(/[^\d.]/g, '')) - Number(b.label.replace(/[^\d.]/g, '')),
  );
  const totalsByMember = [...byMember.values()].sort((a, b) => a.label.localeCompare(b.label));

  const totalLengthM = roundQuantity(
    rows.reduce((sum, r) => sum + r.totalLengthM, 0),
    4,
  );
  const totalWeightKg = roundQuantity(
    rows.reduce((sum, r) => sum + r.totalWeightKg, 0),
    3,
  );
  const totalWeightTonnes = roundQuantity(totalWeightKg / 1000, 4);
  const totalBars = rows.reduce((sum, r) => sum + r.quantity, 0);

  steps.push(
    `Overall: ${rows.length} rows, ${totalBars} bars, ${totalLengthM} m, ${totalWeightKg} kg (${totalWeightTonnes} t).`,
  );

  let estimatedCostInr: number | null = null;
  const rate = input.ratePerKgInr ?? null;
  if (rate != null && rate > 0) {
    estimatedCostInr = roundMoney(totalWeightKg * rate);
    steps.push(`Estimated cost = ${totalWeightKg} kg × ₹${rate}/kg = ₹${estimatedCostInr}.`);
  }

  return {
    projectName: input.projectName?.trim() || null,
    rows,
    totalsByDiameter,
    totalsByMember,
    overall: {
      totalLengthM,
      totalWeightKg,
      totalWeightTonnes,
      totalBars,
      rowCount: rows.length,
    },
    estimatedCostInr,
    ratePerKgInr: rate,
    formula: `${REBAR_MASS_FORMULA}; total length = cutting length × qty; weight = (d²/${REBAR_WEIGHT_DIVISOR}) × total length`,
    steps,
    assumptions: [
      'Quantities are calculated only from user-entered bar mark, member, diameter, shape, quantity and cutting length.',
      'Shape/type is organizational — cutting length is not auto-derived from hooks, bends or member geometry.',
      `Unit weight uses shared steel utility ${REBAR_MASS_FORMULA}.`,
      'Does not include wastage, lap length, chairs or binding wire unless entered as separate rows.',
      BBS_STRUCTURAL_DISCLAIMER,
    ],
    disclaimer: BBS_STRUCTURAL_DISCLAIMER,
    version: BBS_CALC_VERSION,
  };
}
