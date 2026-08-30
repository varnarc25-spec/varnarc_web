/** Varnarc Tile Calculator — types. */

import { z } from 'zod';
import type { ReverseCalculationDisplay } from '../reverse-calculator';

export const tileCalcModeSchema = z.enum(['forward', 'reverse']);
export const tileSurfaceSchema = z.enum(['floor', 'wall']);
export const tileLengthUnitSchema = z.enum(['mm', 'cm', 'm', 'inch', 'ft']);

export const tileCalculatorInputSchema = z
  .object({
    mode: tileCalcModeSchema.default('forward'),
    surface: tileSurfaceSchema.default('floor'),
    /** Floor: room length × width. Wall: wall length × height. */
    roomLength: z.number().positive().max(500).optional(),
    roomWidth: z.number().positive().max(500).optional(),
    roomLengthUnit: tileLengthUnitSchema.default('m'),
    roomWidthUnit: tileLengthUnitSchema.default('m'),
    tileLength: z.number().positive().max(10_000).optional(),
    tileWidth: z.number().positive().max(10_000).optional(),
    tileLengthUnit: tileLengthUnitSchema.default('mm'),
    tileWidthUnit: tileLengthUnitSchema.default('mm'),
    /** Optional joint / grout gap between tiles */
    groutWidth: z.number().min(0).max(50).optional().nullable(),
    groutWidthUnit: tileLengthUnitSchema.default('mm'),
    wastagePercent: z.number().min(0).max(40).default(10),
    numberOfRooms: z.number().int().positive().max(200).default(1),
    tilesPerBox: z.number().positive().max(10_000).optional().nullable(),
    pricePerTileInr: z.number().positive().max(100_000).optional().nullable(),
    pricePerBoxInr: z.number().positive().max(500_000).optional().nullable(),
    /** Reverse: tiles on hand */
    availableTiles: z.number().positive().max(10_000_000).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.mode === 'reverse') {
      if (val.availableTiles == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'availableTiles is required in reverse mode',
          path: ['availableTiles'],
        });
      }
      if (val.tileLength == null || val.tileWidth == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tile length and width are required',
          path: ['tileLength'],
        });
      }
      return;
    }
    if (val.roomLength == null || val.roomWidth == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          val.surface === 'wall'
            ? 'Provide wall length and wall height'
            : 'Provide room length and room width',
        path: ['roomLength'],
      });
    }
    if (val.tileLength == null || val.tileWidth == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tile length and width are required',
        path: ['tileLength'],
      });
    }
  });

export type TileCalcMode = z.infer<typeof tileCalcModeSchema>;
export type TileSurface = z.infer<typeof tileSurfaceSchema>;
export type TileCalculatorInput = z.input<typeof tileCalculatorInputSchema>;

export type TileGridLayout = {
  tilesAlongLength: number;
  tilesAlongWidth: number;
  /** Capped counts for SVG preview (max 24 per side) */
  previewCols: number;
  previewRows: number;
  pitchLengthM: number;
  pitchWidthM: number;
};

export type TileCalculatorResult = {
  mode: TileCalcMode;
  surface: TileSurface;
  surfaceAreaM2: number;
  surfaceAreaFt2: number;
  tileAreaM2: number;
  tileAreaCm2: number;
  roomLengthM: number | null;
  roomWidthM: number | null;
  tileLengthM: number;
  tileWidthM: number;
  groutWidthM: number;
  numberOfRooms: number;
  baseTiles: number;
  wastageTiles: number;
  totalTiles: number;
  tilesPerBox: number | null;
  boxesNeeded: number | null;
  grid: TileGridLayout | null;
  /** Reverse: coverable area after wastage allowance */
  coverableAreaM2: number | null;
  coverableAreaFt2: number | null;
  wastagePercent: number;
  estimatedCostInr: number | null;
  formula: string;
  steps: string[];
  assumptions: string[];
  limitations: string[];
  reverseDisplay: ReverseCalculationDisplay | null;
  disclaimer: string;
  version: string;
};
