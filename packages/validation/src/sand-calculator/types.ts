/** Varnarc Sand Calculator — types. */

import { z } from 'zod';

export const sandUseCaseSchema = z.enum([
  'concrete',
  'masonry',
  'plaster',
  'filling',
  'generic_volume',
]);

export const sandVolumeUnitSchema = z.enum(['m3', 'ft3', 'liter']);
export const sandAreaUnitSchema = z.enum(['m2', 'ft2', 'yard2']);
export const sandLengthUnitSchema = z.enum(['mm', 'cm', 'm', 'inch', 'ft']);

export const sandMixPresetSchema = z.enum([
  'custom',
  'M5',
  'M7.5',
  'M10',
  'M15',
  'M20',
  'M25',
  'mortar_1_3',
  'mortar_1_4',
  'mortar_1_5',
  'mortar_1_6',
]);

export const sandCalculatorInputSchema = z
  .object({
    useCase: sandUseCaseSchema,
    /** Concrete / filling / generic wet or fill volume */
    volume: z.number().positive().max(50_000).optional(),
    volumeUnit: sandVolumeUnitSchema.default('m3'),
    /** Filling: optional L×W×D instead of volume */
    length: z.number().positive().max(10_000).optional(),
    width: z.number().positive().max(10_000).optional(),
    depth: z.number().positive().max(5_000).optional(),
    lengthUnit: sandLengthUnitSchema.default('m'),
    widthUnit: sandLengthUnitSchema.default('m'),
    depthUnit: sandLengthUnitSchema.default('m'),
    /** Masonry / plaster area × thickness */
    area: z.number().positive().max(500_000).optional(),
    areaUnit: sandAreaUnitSchema.default('m2'),
    thickness: z.number().positive().max(5_000).optional(),
    thicknessUnit: sandLengthUnitSchema.default('mm'),
    mixPreset: sandMixPresetSchema.default('M20'),
    cementParts: z.number().positive().max(20).optional(),
    sandParts: z.number().positive().max(40).optional(),
    aggregateParts: z.number().nonnegative().max(40).optional(),
    wastagePercent: z.number().min(0).max(40).default(5),
    /** Bulk density kg/m³ — user-editable, must be exposed in UI */
    densityKgPerM3: z.number().positive().max(3000).default(1600),
    /** Optional rates — user chooses basis */
    ratePerM3Inr: z.number().positive().max(100_000).optional().nullable(),
    ratePerTonneInr: z.number().positive().max(100_000).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.useCase === 'concrete' || val.useCase === 'generic_volume') {
      if (val.volume == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Volume is required',
          path: ['volume'],
        });
      }
    } else if (val.useCase === 'filling') {
      const hasVolume = val.volume != null;
      const hasDims = val.length != null && val.width != null && val.depth != null;
      if (!hasVolume && !hasDims) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Provide volume or length × width × depth for filling',
          path: ['volume'],
        });
      }
    } else if (val.area == null || val.thickness == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Area and thickness are required for this use case',
        path: ['area'],
      });
    }
  });

export type SandUseCase = z.infer<typeof sandUseCaseSchema>;
export type SandMixPreset = z.infer<typeof sandMixPresetSchema>;
export type SandCalculatorInput = z.infer<typeof sandCalculatorInputSchema>;

export type SandCalculatorResult = {
  useCase: SandUseCase;
  wetVolumeM3: number;
  dryVolumeM3: number | null;
  dryVolumeFactor: number | null;
  mixLabel: string | null;
  sandFraction: number | null;
  sandVolumeM3: number;
  sandVolumeFt3: number;
  sandVolumeBeforeWastageM3: number;
  wastagePercent: number;
  wastageExtraM3: number;
  densityKgPerM3: number;
  estimatedTonnes: number;
  estimatedCostInr: number | null;
  rateBasis: 'm3' | 'tonne' | null;
  formula: string;
  steps: string[];
  assumptions: string[];
  disclaimer: string;
  version: string;
};
