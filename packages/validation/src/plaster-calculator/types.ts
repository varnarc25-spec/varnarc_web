/** Varnarc Plaster Calculator — types. */

import { z } from 'zod';

export const plasterSurfaceSchema = z.enum(['wall', 'ceiling']);

export const plasterPresetSchema = z.enum(['custom', 'interior_wall', 'exterior_wall', 'ceiling']);

export const plasterAreaUnitSchema = z.enum(['m2', 'ft2', 'yard2']);
export const plasterLengthUnitSchema = z.enum(['mm', 'cm', 'm', 'inch', 'ft']);

export const plasterMixPresetSchema = z.enum([
  'custom',
  'mortar_1_3',
  'mortar_1_4',
  'mortar_1_5',
  'mortar_1_6',
]);

export const plasterCalculatorInputSchema = z
  .object({
    surface: plasterSurfaceSchema.default('wall'),
    /** Optional convenience preset — thickness/mix still fully editable */
    surfacePreset: plasterPresetSchema.default('custom'),
    /** Gross plasterable area (preferred) */
    area: z.number().positive().max(500_000).optional(),
    areaUnit: plasterAreaUnitSchema.default('m2'),
    /** Or length × height for a single face */
    length: z.number().positive().max(10_000).optional(),
    height: z.number().positive().max(500).optional(),
    lengthUnit: plasterLengthUnitSchema.default('m'),
    heightUnit: plasterLengthUnitSchema.default('m'),
    thickness: z.number().positive().max(200).default(12),
    thicknessUnit: plasterLengthUnitSchema.default('mm'),
    openingArea: z.number().min(0).max(100_000).optional().nullable(),
    openingAreaUnit: plasterAreaUnitSchema.default('m2'),
    openingCount: z.number().int().min(0).max(500).optional().nullable(),
    openingWidth: z.number().positive().max(50).optional().nullable(),
    openingHeight: z.number().positive().max(50).optional().nullable(),
    openingWidthUnit: plasterLengthUnitSchema.default('m'),
    openingHeightUnit: plasterLengthUnitSchema.default('m'),
    mixPreset: plasterMixPresetSchema.default('mortar_1_4'),
    cementParts: z.number().positive().max(20).optional(),
    sandParts: z.number().positive().max(40).optional(),
    wastagePercent: z.number().min(0).max(40).default(10),
    bagSizeKg: z.number().positive().max(100).default(50),
    bagPriceInr: z.number().positive().max(50_000).optional().nullable(),
    sandRatePerM3Inr: z.number().positive().max(100_000).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    const hasArea = val.area != null;
    const hasDims = val.length != null && val.height != null;
    if (!hasArea && !hasDims) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide plaster area or length × height',
        path: ['area'],
      });
    }
  });

export type PlasterSurface = z.infer<typeof plasterSurfaceSchema>;
export type PlasterPreset = z.infer<typeof plasterPresetSchema>;
export type PlasterMixPreset = z.infer<typeof plasterMixPresetSchema>;
export type PlasterCalculatorInput = z.infer<typeof plasterCalculatorInputSchema>;

export type PlasterCalculatorResult = {
  surface: PlasterSurface;
  surfacePreset: PlasterPreset;
  presetAssumptions: string[];
  grossAreaM2: number;
  openingAreaM2: number;
  netAreaM2: number;
  thicknessM: number;
  thicknessMm: number;
  wetVolumeM3: number;
  dryVolumeM3: number;
  dryVolumeFactor: number;
  mixLabel: string;
  cementParts: number;
  sandParts: number;
  cementKg: number;
  cementBags: number;
  bagSizeKg: number;
  sandVolumeM3: number;
  wastagePercent: number;
  estimatedCostInr: number | null;
  formula: string;
  steps: string[];
  assumptions: string[];
  disclaimer: string;
  version: string;
};
