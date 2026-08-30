/** Varnarc Cement Calculator — types. */

import { z } from 'zod';
import type { ReverseCalculationDisplay } from '../reverse-calculator';

export const cementCalcModeSchema = z.enum(['forward', 'reverse']);
export type CementCalcMode = z.infer<typeof cementCalcModeSchema>;

export const cementUseCaseSchema = z.enum(['concrete', 'masonry', 'plastering', 'floor_screed']);

export const cementVolumeUnitSchema = z.enum(['m3', 'ft3', 'liter']);
export const cementAreaUnitSchema = z.enum(['m2', 'ft2', 'yard2']);
export const cementThicknessUnitSchema = z.enum(['mm', 'cm', 'm', 'inch', 'ft']);

export const cementMixPresetSchema = z.enum([
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

export const cementCalculatorInputSchema = z
  .object({
    mode: cementCalcModeSchema.default('forward'),
    useCase: cementUseCaseSchema,
    /** Concrete wet volume (forward) */
    volume: z.number().positive().max(50_000).optional(),
    volumeUnit: cementVolumeUnitSchema.default('m3'),
    /** Plaster / masonry / screed area (forward) */
    area: z.number().positive().max(500_000).optional(),
    areaUnit: cementAreaUnitSchema.default('m2'),
    thickness: z.number().positive().max(5_000).optional(),
    thicknessUnit: cementThicknessUnitSchema.default('mm'),
    mixPreset: cementMixPresetSchema.default('M20'),
    cementParts: z.number().positive().max(20).optional(),
    sandParts: z.number().positive().max(40).optional(),
    aggregateParts: z.number().nonnegative().max(40).optional(),
    wastagePercent: z.number().min(0).max(40).default(5),
    bagSizeKg: z.number().positive().max(100).default(50),
    bagPriceInr: z.number().positive().max(50_000).optional().nullable(),
    /** Reverse: bags on hand */
    availableBags: z.number().positive().max(1_000_000).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.mode === 'reverse') {
      if (val.availableBags == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'availableBags is required in reverse mode',
          path: ['availableBags'],
        });
      }
      if (val.useCase !== 'concrete' && val.thickness == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Thickness is required to reverse area coverage',
          path: ['thickness'],
        });
      }
      return;
    }
    if (val.useCase === 'concrete') {
      if (val.volume == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Volume is required for concrete',
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

export type CementUseCase = z.infer<typeof cementUseCaseSchema>;
export type CementMixPreset = z.infer<typeof cementMixPresetSchema>;
export type CementCalculatorInput = z.infer<typeof cementCalculatorInputSchema>;

export type CementCalculatorResult = {
  mode: CementCalcMode;
  useCase: CementUseCase;
  wetVolumeM3: number;
  dryVolumeM3: number;
  dryVolumeFactor: number;
  mixLabel: string;
  cementParts: number;
  sandParts: number;
  aggregateParts: number;
  cementKg: number;
  cementKgBeforeWastage: number;
  bags: number;
  bagSizeKg: number;
  bagSizes: Array<{ sizeKg: number; bags: number }>;
  sandVolumeM3: number | null;
  aggregateVolumeM3: number | null;
  estimatedCostInr: number | null;
  wastagePercent: number;
  wastageExtraKg: number;
  /** Reverse: coverable wet volume (concrete) or implied wet volume */
  coverableWetVolumeM3: number | null;
  /** Reverse: coverable area for masonry/plaster/screed */
  coverableAreaM2: number | null;
  coverableAreaFt2: number | null;
  selectedUnit: string;
  steps: string[];
  formula: string;
  assumptions: string[];
  limitations: string[];
  reverseDisplay: ReverseCalculationDisplay | null;
  disclaimer: string;
  version: string;
};
