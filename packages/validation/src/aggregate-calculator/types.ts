/** Varnarc Aggregate Calculator — types. */

import { z } from 'zod';

export const aggregateUseCaseSchema = z.enum(['concrete', 'generic_fill', 'area_depth']);

export const aggregateVolumeUnitSchema = z.enum(['m3', 'ft3', 'liter']);
export const aggregateAreaUnitSchema = z.enum(['m2', 'ft2', 'yard2']);
export const aggregateLengthUnitSchema = z.enum(['mm', 'cm', 'm', 'inch', 'ft']);

export const aggregateMixPresetSchema = z.enum([
  'custom',
  'M5',
  'M7.5',
  'M10',
  'M15',
  'M20',
  'M25',
]);

export const aggregateCalculatorInputSchema = z
  .object({
    useCase: aggregateUseCaseSchema,
    volume: z.number().positive().max(50_000).optional(),
    volumeUnit: aggregateVolumeUnitSchema.default('m3'),
    length: z.number().positive().max(10_000).optional(),
    width: z.number().positive().max(10_000).optional(),
    depth: z.number().positive().max(5_000).optional(),
    lengthUnit: aggregateLengthUnitSchema.default('m'),
    widthUnit: aggregateLengthUnitSchema.default('m'),
    depthUnit: aggregateLengthUnitSchema.default('m'),
    area: z.number().positive().max(500_000).optional(),
    areaUnit: aggregateAreaUnitSchema.default('m2'),
    /** Area-depth mode thickness/depth */
    thickness: z.number().positive().max(5_000).optional(),
    thicknessUnit: aggregateLengthUnitSchema.default('mm'),
    mixPreset: aggregateMixPresetSchema.default('M20'),
    cementParts: z.number().positive().max(20).optional(),
    sandParts: z.number().positive().max(40).optional(),
    aggregateParts: z.number().positive().max(40).optional(),
    wastagePercent: z.number().min(0).max(40).default(5),
    /** Bulk density kg/m³ — user-editable, exposed in UI */
    densityKgPerM3: z.number().positive().max(3000).default(1500),
    ratePerM3Inr: z.number().positive().max(100_000).optional().nullable(),
    ratePerTonneInr: z.number().positive().max(100_000).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.useCase === 'concrete') {
      if (val.volume == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Concrete volume is required',
          path: ['volume'],
        });
      }
    } else if (val.useCase === 'generic_fill') {
      const hasVolume = val.volume != null;
      const hasDims = val.length != null && val.width != null && val.depth != null;
      if (!hasVolume && !hasDims) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Provide volume or length × width × depth',
          path: ['volume'],
        });
      }
    } else if (val.area == null || val.thickness == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Area and depth are required',
        path: ['area'],
      });
    }
  });

export type AggregateUseCase = z.infer<typeof aggregateUseCaseSchema>;
export type AggregateMixPreset = z.infer<typeof aggregateMixPresetSchema>;
export type AggregateCalculatorInput = z.infer<typeof aggregateCalculatorInputSchema>;

export type AggregateCalculatorResult = {
  useCase: AggregateUseCase;
  wetVolumeM3: number;
  dryVolumeM3: number | null;
  dryVolumeFactor: number | null;
  mixLabel: string | null;
  aggregateFraction: number | null;
  aggregateVolumeM3: number;
  aggregateVolumeFt3: number;
  aggregateVolumeBeforeWastageM3: number;
  wastagePercent: number;
  wastageExtraM3: number;
  densityKgPerM3: number;
  estimatedKg: number;
  estimatedTonnes: number;
  estimatedCostInr: number | null;
  rateBasis: 'm3' | 'tonne' | null;
  formula: string;
  steps: string[];
  assumptions: string[];
  disclaimer: string;
  version: string;
};
