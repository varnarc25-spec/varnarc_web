/** Varnarc Steel Weight Calculator — types. */

import { z } from 'zod';

export const steelLengthUnitSchema = z.enum(['mm', 'cm', 'm', 'ft', 'inch']);

export const steelBarRowSchema = z.object({
  id: z.string().min(1).max(64),
  /** Diameter in mm (standard or custom). */
  diameterMm: z.number().positive().max(100),
  length: z.number().positive().max(1_000_000),
  lengthUnit: steelLengthUnitSchema.default('m'),
  quantity: z.number().positive().max(1_000_000).default(1),
  label: z.string().max(120).optional(),
});

export const steelCalculatorInputSchema = z.object({
  rows: z.array(steelBarRowSchema).min(1).max(100),
  /** Optional steel rate ₹/kg for estimated cost. */
  ratePerKgInr: z.number().positive().max(50_000).optional().nullable(),
});

export type SteelLengthUnit = z.infer<typeof steelLengthUnitSchema>;
export type SteelBarRowInput = z.infer<typeof steelBarRowSchema>;
export type SteelCalculatorInput = z.infer<typeof steelCalculatorInputSchema>;

export type SteelBarRowResult = {
  id: string;
  label: string | null;
  diameterMm: number;
  lengthM: number;
  quantity: number;
  /** kg per metre for this diameter */
  unitWeightKgPerM: number;
  /** Total length = length × quantity */
  totalLengthM: number;
  /** Total weight for the row */
  totalWeightKg: number;
};

export type SteelCalculatorResult = {
  rows: SteelBarRowResult[];
  totalWeightKg: number;
  totalWeightTonnes: number;
  totalLengthM: number;
  estimatedCostInr: number | null;
  ratePerKgInr: number | null;
  formula: string;
  formulaExplanation: string;
  steps: string[];
  assumptions: string[];
  disclaimer: string;
  version: string;
};
