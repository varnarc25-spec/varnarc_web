/** Varnarc AAC Block Calculator — types. */

import { z } from 'zod';
import type { ReverseCalculationDisplay } from '../reverse-calculator';

export const aacCalcModeSchema = z.enum(['forward', 'reverse']);
export const aacLengthUnitSchema = z.enum(['mm', 'cm', 'm', 'inch', 'ft']);
export const aacAreaUnitSchema = z.enum(['m2', 'ft2']);

export const aacBlockPresetSchema = z.enum([
  'custom',
  'aac_600x200x75',
  'aac_600x200x100',
  'aac_600x200x125',
  'aac_600x200x150',
  'aac_600x200x200',
  'aac_600x200x225',
  'aac_600x200x250',
  'aac_600x200x300',
]);

export const aacCalculatorInputSchema = z
  .object({
    mode: aacCalcModeSchema.default('forward'),
    wallLength: z.number().positive().max(10_000).optional(),
    wallHeight: z.number().positive().max(500).optional(),
    wallThickness: z.number().positive().max(5_000).optional(),
    wallLengthUnit: aacLengthUnitSchema.default('m'),
    wallHeightUnit: aacLengthUnitSchema.default('m'),
    wallThicknessUnit: aacLengthUnitSchema.default('mm'),
    openingArea: z.number().min(0).max(100_000).optional().nullable(),
    openingAreaUnit: aacAreaUnitSchema.default('m2'),
    openingCount: z.number().int().min(0).max(500).optional().nullable(),
    openingWidth: z.number().positive().max(50).optional().nullable(),
    openingHeight: z.number().positive().max(50).optional().nullable(),
    openingWidthUnit: aacLengthUnitSchema.default('m'),
    openingHeightUnit: aacLengthUnitSchema.default('m'),
    blockPreset: aacBlockPresetSchema.default('aac_600x200x200'),
    blockLength: z.number().positive().max(5_000).optional(),
    blockWidth: z.number().positive().max(5_000).optional(),
    blockHeight: z.number().positive().max(5_000).optional(),
    blockSizeUnit: aacLengthUnitSchema.default('mm'),
    /** Thin-bed adhesive joint — typically 2–3 mm */
    jointThickness: z.number().min(0).max(50).default(3),
    jointThicknessUnit: aacLengthUnitSchema.default('mm'),
    wastagePercent: z.number().min(0).max(40).default(5),
    pricePerBlockInr: z.number().positive().max(50_000).optional().nullable(),
    availableBlocks: z.number().positive().max(10_000_000).optional(),
    includeAdhesiveEstimate: z.boolean().default(true),
    adhesiveDensityKgPerM3: z.number().positive().max(3000).default(1500),
    adhesiveBagSizeKg: z.number().positive().max(100).default(40),
  })
  .superRefine((val, ctx) => {
    if (val.mode === 'forward') {
      if (val.wallLength == null || val.wallHeight == null || val.wallThickness == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Wall length, height and thickness are required',
          path: ['wallLength'],
        });
      }
    } else if (val.availableBlocks == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Available blocks are required in reverse mode',
        path: ['availableBlocks'],
      });
    } else if (val.wallThickness == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Wall thickness is required to convert blocks to area',
        path: ['wallThickness'],
      });
    }
    if (val.blockPreset === 'custom') {
      if (val.blockLength == null || val.blockWidth == null || val.blockHeight == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Custom AAC block needs length, width and height',
          path: ['blockLength'],
        });
      }
    }
  });

export type AacCalcMode = z.infer<typeof aacCalcModeSchema>;
export type AacBlockPreset = z.infer<typeof aacBlockPresetSchema>;
export type AacCalculatorInput = z.infer<typeof aacCalculatorInputSchema>;

export type AacAdhesiveEstimate = {
  adhesiveVolumeM3: number;
  adhesiveKg: number;
  adhesiveBags: number;
  mixLabel: string;
};

export type AacCalculatorResult = {
  mode: AacCalcMode;
  blockLabel: string;
  blockSizeMm: { length: number; width: number; height: number };
  modularSizeMm: { length: number; width: number; height: number };
  modularBlockVolumeM3: number;
  solidBlockVolumeM3: number;
  jointThicknessMm: number;
  grossWallAreaM2: number | null;
  openingAreaM2: number | null;
  netWallAreaM2: number | null;
  netWallVolumeM3: number | null;
  wallThicknessM: number;
  blocksBeforeWastage: number;
  wastageBlocks: number;
  blocksRequired: number;
  buildableAreaM2: number | null;
  buildableVolumeM3: number | null;
  adhesive: AacAdhesiveEstimate | null;
  estimatedCostInr: number | null;
  pricePerBlockInr: number | null;
  formula: string;
  steps: string[];
  assumptions: string[];
  limitations: string[];
  reverseDisplay: ReverseCalculationDisplay | null;
  disclaimer: string;
  version: string;
};
