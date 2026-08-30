/** Varnarc Brick Calculator — types. */

import { z } from 'zod';
import type { ReverseCalculationDisplay } from '../reverse-calculator';

export const brickCalcModeSchema = z.enum(['forward', 'reverse']);

export const brickLengthUnitSchema = z.enum(['mm', 'cm', 'm', 'inch', 'ft']);
export const brickAreaUnitSchema = z.enum(['m2', 'ft2']);

export const brickSizePresetSchema = z.enum([
  'custom',
  'indian_modular',
  'indian_traditional',
  'english_standard',
  'aac_600x200x100',
  'aac_600x200x150',
  'aac_600x200x200',
]);

export const brickCalculatorInputSchema = z
  .object({
    mode: brickCalcModeSchema.default('forward'),
    /** Forward: wall length */
    wallLength: z.number().positive().max(10_000).optional(),
    wallHeight: z.number().positive().max(500).optional(),
    wallThickness: z.number().positive().max(5_000).optional(),
    wallLengthUnit: brickLengthUnitSchema.default('m'),
    wallHeightUnit: brickLengthUnitSchema.default('m'),
    wallThicknessUnit: brickLengthUnitSchema.default('mm'),
    /** Opening area (preferred) or count × size */
    openingArea: z.number().min(0).max(100_000).optional().nullable(),
    openingAreaUnit: brickAreaUnitSchema.default('m2'),
    openingCount: z.number().int().min(0).max(500).optional().nullable(),
    openingWidth: z.number().positive().max(50).optional().nullable(),
    openingHeight: z.number().positive().max(50).optional().nullable(),
    openingWidthUnit: brickLengthUnitSchema.default('m'),
    openingHeightUnit: brickLengthUnitSchema.default('m'),
    brickPreset: brickSizePresetSchema.default('indian_modular'),
    brickLength: z.number().positive().max(5_000).optional(),
    brickWidth: z.number().positive().max(5_000).optional(),
    brickHeight: z.number().positive().max(5_000).optional(),
    brickSizeUnit: brickLengthUnitSchema.default('mm'),
    mortarJoint: z.number().min(0).max(50).default(10),
    mortarJointUnit: brickLengthUnitSchema.default('mm'),
    wastagePercent: z.number().min(0).max(40).default(5),
    pricePerBrickInr: z.number().positive().max(50_000).optional().nullable(),
    /** Reverse mode: available bricks */
    availableBricks: z.number().positive().max(10_000_000).optional(),
    /** Mortar mix for cement/sand share (cement : sand), default 1:6 */
    mortarCementParts: z.number().positive().max(10).default(1),
    mortarSandParts: z.number().positive().max(20).default(6),
    includeMortarEstimate: z.boolean().default(true),
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
    } else if (val.availableBricks == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Available bricks are required in reverse mode',
        path: ['availableBricks'],
      });
    } else if (val.wallThickness == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Wall thickness is required to convert bricks to area',
        path: ['wallThickness'],
      });
    }
    if (val.brickPreset === 'custom') {
      if (val.brickLength == null || val.brickWidth == null || val.brickHeight == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Custom brick needs length, width and height',
          path: ['brickLength'],
        });
      }
    }
  });

export type BrickCalcMode = z.infer<typeof brickCalcModeSchema>;
export type BrickSizePreset = z.infer<typeof brickSizePresetSchema>;
export type BrickCalculatorInput = z.infer<typeof brickCalculatorInputSchema>;

export type BrickMortarEstimate = {
  mortarVolumeM3: number;
  dryMortarVolumeM3: number;
  cementKg: number;
  sandVolumeM3: number;
  mixLabel: string;
};

export type BrickCalculatorResult = {
  mode: BrickCalcMode;
  brickLabel: string;
  brickSizeMm: { length: number; width: number; height: number };
  modularSizeMm: { length: number; width: number; height: number };
  modularBrickVolumeM3: number;
  solidBrickVolumeM3: number;
  mortarJointMm: number;
  /** Forward fields (null in reverse when not applicable) */
  grossWallAreaM2: number | null;
  openingAreaM2: number | null;
  netWallAreaM2: number | null;
  netWallVolumeM3: number | null;
  wallThicknessM: number;
  bricksBeforeWastage: number;
  wastageBricks: number;
  bricksRequired: number;
  /** Reverse: buildable net wall area from available bricks */
  buildableAreaM2: number | null;
  buildableVolumeM3: number | null;
  mortar: BrickMortarEstimate | null;
  estimatedCostInr: number | null;
  pricePerBrickInr: number | null;
  formula: string;
  steps: string[];
  assumptions: string[];
  limitations: string[];
  reverseDisplay: ReverseCalculationDisplay | null;
  disclaimer: string;
  version: string;
};
