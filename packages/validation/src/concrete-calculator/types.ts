/** Varnarc Concrete Calculator — types. */

import { z } from 'zod';

export const concreteShapeSchema = z.enum([
  'slab',
  'rectangular_footing',
  'column',
  'wall',
  'circular_column',
  'custom_rectangular',
]);

export const concreteLengthUnitSchema = z.enum(['mm', 'cm', 'm', 'inch', 'ft']);
export const concreteMixPresetSchema = z.enum(['custom', 'M5', 'M7.5', 'M10', 'M15', 'M20', 'M25']);

export const concreteCalculatorInputSchema = z
  .object({
    shape: concreteShapeSchema.default('slab'),
    length: z.number().positive().max(10_000).optional(),
    width: z.number().positive().max(10_000).optional(),
    height: z.number().positive().max(10_000).optional(),
    thickness: z.number().positive().max(10_000).optional(),
    depth: z.number().positive().max(10_000).optional(),
    diameter: z.number().positive().max(10_000).optional(),
    radius: z.number().positive().max(10_000).optional(),
    lengthUnit: concreteLengthUnitSchema.default('m'),
    widthUnit: concreteLengthUnitSchema.default('m'),
    heightUnit: concreteLengthUnitSchema.default('m'),
    thicknessUnit: concreteLengthUnitSchema.default('mm'),
    depthUnit: concreteLengthUnitSchema.default('m'),
    diameterUnit: concreteLengthUnitSchema.default('m'),
    radiusUnit: concreteLengthUnitSchema.default('m'),
    mixPreset: concreteMixPresetSchema.default('M20'),
    cementParts: z.number().positive().max(20).optional(),
    sandParts: z.number().positive().max(40).optional(),
    aggregateParts: z.number().nonnegative().max(40).optional(),
    /** Optional water–cement ratio by mass (litres ≈ kg when density ≈ 1). */
    waterCementRatio: z.number().positive().max(1).default(0.45),
    includeMaterialBreakdown: z.boolean().default(true),
    wastagePercent: z.number().min(0).max(40).default(5),
    /** Custom concrete rate ₹ / m³ (order volume after wastage). */
    ratePerM3Inr: z.number().positive().max(500_000).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    const need = (keys: Array<keyof typeof val>, message: string) => {
      for (const k of keys) {
        if (val[k] == null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message,
            path: [k as string],
          });
          return;
        }
      }
    };

    switch (val.shape) {
      case 'slab':
        need(['length', 'width', 'thickness'], 'Slab needs length, width and thickness');
        break;
      case 'rectangular_footing':
        need(['length', 'width', 'depth'], 'Footing needs length, width and depth');
        break;
      case 'column':
      case 'custom_rectangular':
        need(['length', 'width', 'height'], 'Needs length, width and height');
        break;
      case 'wall':
        need(['length', 'height', 'thickness'], 'Wall needs length, height and thickness');
        break;
      case 'circular_column':
        if (val.diameter == null && val.radius == null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Circular column needs diameter or radius',
            path: ['diameter'],
          });
        }
        need(['height'], 'Circular column needs height');
        break;
      default:
        break;
    }
  });

export type ConcreteShape = z.infer<typeof concreteShapeSchema>;
export type ConcreteMixPreset = z.infer<typeof concreteMixPresetSchema>;
export type ConcreteCalculatorInput = z.infer<typeof concreteCalculatorInputSchema>;

export type ConcreteMaterialBreakdown = {
  cementKg: number;
  cementBags50kg: number;
  sandVolumeM3: number;
  aggregateVolumeM3: number;
  waterLitres: number | null;
  dryVolumeM3: number;
  mixLabel: string;
  cementParts: number;
  sandParts: number;
  aggregateParts: number;
};

export type ConcreteCalculatorResult = {
  shape: ConcreteShape;
  shapeLabel: string;
  formula: string;
  wetVolumeM3: number;
  wetVolumeFt3: number;
  orderVolumeM3: number;
  orderVolumeFt3: number;
  wastagePercent: number;
  wastageExtraM3: number;
  dimensionsM: Record<string, number>;
  steps: string[];
  assumptions: string[];
  materials: ConcreteMaterialBreakdown | null;
  estimatedCostInr: number | null;
  ratePerM3Inr: number | null;
  disclaimer: string;
  version: string;
};
