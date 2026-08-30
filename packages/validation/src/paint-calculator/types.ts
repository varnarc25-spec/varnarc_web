/** Varnarc Paint Calculator — types. */

import { z } from 'zod';
import type { ReverseCalculationDisplay } from '../reverse-calculator';

export const paintCalcModeSchema = z.enum(['forward', 'reverse']);
export const paintScopeSchema = z.enum(['room', 'rooms', 'house', 'direct_area']);
export const paintLengthUnitSchema = z.enum(['mm', 'cm', 'm', 'inch', 'ft']);
export const paintAreaUnitSchema = z.enum(['m2', 'ft2', 'yard2']);
export const paintCoverageUnitSchema = z.enum(['m2_per_l', 'ft2_per_l']);

export const paintRoomInputSchema = z.object({
  id: z.string().min(1).max(64).optional(),
  name: z.string().min(1).max(80).optional(),
  length: z.number().positive().max(500),
  width: z.number().positive().max(500),
  height: z.number().positive().max(50),
  lengthUnit: paintLengthUnitSchema.default('m'),
  widthUnit: paintLengthUnitSchema.default('m'),
  heightUnit: paintLengthUnitSchema.default('m'),
  doors: z.number().int().min(0).max(50).default(1),
  windows: z.number().int().min(0).max(50).default(2),
  includeCeiling: z.boolean().default(false),
});

export type PaintRoomInput = z.infer<typeof paintRoomInputSchema>;

export const paintCalculatorInputSchema = z
  .object({
    mode: paintCalcModeSchema.default('forward'),
    scope: paintScopeSchema.default('room'),
    /** Single room (scope room / house with one volume) */
    length: z.number().positive().max(500).optional(),
    width: z.number().positive().max(500).optional(),
    height: z.number().positive().max(50).optional(),
    lengthUnit: paintLengthUnitSchema.default('m'),
    widthUnit: paintLengthUnitSchema.default('m'),
    heightUnit: paintLengthUnitSchema.default('m'),
    doors: z.number().int().min(0).max(200).default(1),
    windows: z.number().int().min(0).max(500).default(2),
    includeCeiling: z.boolean().default(false),
    /** Multi-room / whole-house room list */
    rooms: z.array(paintRoomInputSchema).max(80).optional(),
    /** Direct wall (+ optional ceiling) area */
    wallArea: z.number().positive().max(500_000).optional(),
    wallAreaUnit: paintAreaUnitSchema.default('m2'),
    ceilingArea: z.number().min(0).max(500_000).optional().nullable(),
    ceilingAreaUnit: paintAreaUnitSchema.default('m2'),
    /** Override default door/window sizes (m) */
    doorWidth: z.number().positive().max(5).optional(),
    doorHeight: z.number().positive().max(5).optional(),
    windowWidth: z.number().positive().max(5).optional(),
    windowHeight: z.number().positive().max(5).optional(),
    doorWidthUnit: paintLengthUnitSchema.default('m'),
    doorHeightUnit: paintLengthUnitSchema.default('m'),
    windowWidthUnit: paintLengthUnitSchema.default('m'),
    windowHeightUnit: paintLengthUnitSchema.default('m'),
    coats: z.number().positive().max(10).default(2),
    /** Manufacturer coverage — fully overridable */
    coveragePerLitre: z.number().positive().max(200).default(10),
    coverageUnit: paintCoverageUnitSchema.default('m2_per_l'),
    includePrimer: z.boolean().default(false),
    primerCoats: z.number().positive().max(5).default(1),
    primerCoveragePerLitre: z.number().positive().max(200).default(12),
    primerCoverageUnit: paintCoverageUnitSchema.default('m2_per_l'),
    includePutty: z.boolean().default(false),
    /** kg putty per m² of painted surface (wall+ceiling net) */
    puttyKgPerM2: z.number().positive().max(10).default(1.1),
    wastagePercent: z.number().min(0).max(40).default(10),
    /** Reverse mode: litres available */
    availableLitres: z.number().positive().max(100_000).optional(),
    packageSizesLitres: z.array(z.number().positive().max(200)).min(1).max(12).optional(),
    primerPackageSizesLitres: z.array(z.number().positive().max(200)).min(1).max(12).optional(),
    paintPricePerLitreInr: z.number().positive().max(50_000).optional().nullable(),
    primerPricePerLitreInr: z.number().positive().max(50_000).optional().nullable(),
    puttyPricePerKgInr: z.number().positive().max(5_000).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.mode === 'reverse') {
      if (val.availableLitres == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'availableLitres is required in reverse mode',
          path: ['availableLitres'],
        });
      }
      return;
    }

    if (val.scope === 'direct_area') {
      if (val.wallArea == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'wallArea is required for direct_area scope',
          path: ['wallArea'],
        });
      }
      return;
    }

    if (
      val.scope === 'rooms' ||
      (val.scope === 'house' && val.rooms != null && val.rooms.length > 0)
    ) {
      if (!val.rooms?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Add at least one room',
          path: ['rooms'],
        });
      }
      return;
    }

    // room or house single-volume
    if (val.length == null || val.width == null || val.height == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide length, width and height (or use rooms / direct area)',
        path: ['length'],
      });
    }
  });

export type PaintCalcMode = z.infer<typeof paintCalcModeSchema>;
export type PaintScope = z.infer<typeof paintScopeSchema>;
/** Raw calculator input (before Zod defaults). */
export type PaintCalculatorInput = z.input<typeof paintCalculatorInputSchema>;
export type PaintCalculatorParsed = z.infer<typeof paintCalculatorInputSchema>;

export type PaintPackagePlan = {
  sizeLitres: number;
  count: number;
  totalLitres: number;
};

export type PaintRoomBreakdown = {
  id: string;
  name: string;
  wallGrossM2: number;
  openingM2: number;
  wallNetM2: number;
  ceilingM2: number;
  netPaintableM2: number;
};

export type PaintCalculatorResult = {
  mode: PaintCalcMode;
  scope: PaintScope;
  /** Forward: net area to paint. Reverse: coverable area from litres. */
  netPaintableAreaM2: number;
  netPaintableAreaFt2: number;
  wallNetM2: number;
  ceilingM2: number;
  openingM2: number;
  coats: number;
  coverageM2PerLitre: number;
  coverageWasOverridden: boolean;
  paintLitresExact: number;
  paintLitres: number;
  primerLitresExact: number | null;
  primerLitres: number | null;
  puttyKgExact: number | null;
  puttyKg: number | null;
  paintPackages: PaintPackagePlan[];
  paintPurchaseLitres: number;
  primerPackages: PaintPackagePlan[] | null;
  primerPurchaseLitres: number | null;
  /** Reverse-only: coats-adjusted area one coat-equivalent */
  reverseAreaOneCoatM2: number | null;
  rooms: PaintRoomBreakdown[];
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
