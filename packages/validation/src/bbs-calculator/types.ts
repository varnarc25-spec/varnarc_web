/** Varnarc Bar Bending Schedule — types. */

import { z } from 'zod';

export const bbsLengthUnitSchema = z.enum(['mm', 'cm', 'm', 'ft', 'inch']);

export const bbsBarShapeSchema = z.enum([
  'straight',
  'l_bar',
  'u_bar',
  'stirrup',
  'cranked',
  'bent_up',
  'spiral',
  'other',
]);

export const bbsScheduleRowSchema = z.object({
  id: z.string().min(1).max(64),
  barMark: z.string().min(1).max(40),
  member: z.string().min(1).max(80),
  diameterMm: z.number().positive().max(100),
  shape: bbsBarShapeSchema.default('straight'),
  quantity: z.number().positive().max(1_000_000).default(1),
  /** User-entered cutting length (not derived from architecture). */
  cuttingLength: z.number().positive().max(1_000_000),
  cuttingLengthUnit: bbsLengthUnitSchema.default('m'),
  notes: z.string().max(500).optional().nullable(),
});

export const bbsScheduleInputSchema = z.object({
  projectName: z.string().max(150).optional().nullable(),
  rows: z.array(bbsScheduleRowSchema).min(1).max(500),
  ratePerKgInr: z.number().positive().max(50_000).optional().nullable(),
});

export type BbsLengthUnit = z.infer<typeof bbsLengthUnitSchema>;
export type BbsBarShape = z.infer<typeof bbsBarShapeSchema>;
export type BbsScheduleRowInput = z.input<typeof bbsScheduleRowSchema>;
export type BbsScheduleInput = z.input<typeof bbsScheduleInputSchema>;

export type BbsScheduleRowResult = {
  id: string;
  barMark: string;
  member: string;
  diameterMm: number;
  shape: BbsBarShape;
  shapeLabel: string;
  quantity: number;
  cuttingLengthM: number;
  notes: string | null;
  unitWeightKgPerM: number;
  totalLengthM: number;
  totalWeightKg: number;
};

export type BbsGroupTotal = {
  key: string;
  label: string;
  totalLengthM: number;
  totalWeightKg: number;
  barCount: number;
  rowCount: number;
};

export type BbsScheduleResult = {
  projectName: string | null;
  rows: BbsScheduleRowResult[];
  totalsByDiameter: BbsGroupTotal[];
  totalsByMember: BbsGroupTotal[];
  overall: {
    totalLengthM: number;
    totalWeightKg: number;
    totalWeightTonnes: number;
    totalBars: number;
    rowCount: number;
  };
  estimatedCostInr: number | null;
  ratePerKgInr: number | null;
  formula: string;
  steps: string[];
  assumptions: string[];
  disclaimer: string;
  version: string;
};
