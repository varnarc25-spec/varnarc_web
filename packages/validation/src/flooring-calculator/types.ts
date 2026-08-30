/** Varnarc Flooring Calculator — types. */

import { z } from 'zod';

export const flooringTypeSchema = z.enum([
  'tiles',
  'marble',
  'granite',
  'wood_laminate',
  'vinyl',
  'other',
]);

export const flooringLengthUnitSchema = z.enum(['mm', 'cm', 'm', 'inch', 'ft']);
export const flooringMaterialUnitSchema = z.enum(['m2', 'ft2', 'yard2', 'box']);

export const flooringRoomInputSchema = z.object({
  id: z.string().min(1).max(64).optional(),
  name: z.string().min(1).max(80).optional(),
  length: z.number().positive().max(500),
  width: z.number().positive().max(500),
  lengthUnit: flooringLengthUnitSchema.default('m'),
  widthUnit: flooringLengthUnitSchema.default('m'),
});

export type FlooringRoomInput = z.infer<typeof flooringRoomInputSchema>;

export const flooringCalculatorInputSchema = z
  .object({
    flooringType: flooringTypeSchema.default('tiles'),
    customTypeLabel: z.string().min(1).max(80).optional().nullable(),
    /** Multi-room list (preferred) */
    rooms: z.array(flooringRoomInputSchema).max(80).optional(),
    /** Single room fallback */
    length: z.number().positive().max(500).optional(),
    width: z.number().positive().max(500).optional(),
    lengthUnit: flooringLengthUnitSchema.default('m'),
    widthUnit: flooringLengthUnitSchema.default('m'),
    numberOfRooms: z.number().int().positive().max(200).default(1),
    wastagePercent: z.number().min(0).max(40).optional(),
    materialUnit: flooringMaterialUnitSchema.default('m2'),
    /** Required when materialUnit is box — area covered by one box */
    coveragePerBox: z.number().positive().max(500).optional().nullable(),
    coveragePerBoxUnit: z.enum(['m2', 'ft2', 'yard2']).default('m2'),
    rateInr: z.number().positive().max(1_000_000).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    const hasRooms = val.rooms != null && val.rooms.length > 0;
    const hasSingle = val.length != null && val.width != null;
    if (!hasRooms && !hasSingle) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide room dimensions or add room rows',
        path: ['rooms'],
      });
    }
    if (val.materialUnit === 'box') {
      if (val.coveragePerBox == null || val.coveragePerBox <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'coveragePerBox is required when material unit is box',
          path: ['coveragePerBox'],
        });
      }
    }
  });

export type FlooringType = z.infer<typeof flooringTypeSchema>;
export type FlooringMaterialUnit = z.infer<typeof flooringMaterialUnitSchema>;
export type FlooringCalculatorInput = z.input<typeof flooringCalculatorInputSchema>;

export type FlooringRoomBreakdown = {
  id: string;
  name: string;
  areaM2: number;
  areaFt2: number;
};

export type FlooringCalculatorResult = {
  flooringType: FlooringType;
  flooringTypeLabel: string;
  netFloorAreaM2: number;
  netFloorAreaFt2: number;
  purchaseAreaM2: number;
  purchaseAreaFt2: number;
  wastagePercent: number;
  wastageAreaM2: number;
  materialUnit: FlooringMaterialUnit;
  materialQuantity: number;
  materialUnitLabel: string;
  rooms: FlooringRoomBreakdown[];
  rateInr: number | null;
  estimatedCostInr: number | null;
  formula: string;
  steps: string[];
  assumptions: string[];
  disclaimer: string;
  version: string;
};
