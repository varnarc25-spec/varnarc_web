/** Varnarc RCC Calculator — types. */

import { z } from 'zod';

export const rccElementSchema = z.enum(['slab', 'beam', 'column', 'footing']);

export const rccColumnShapeSchema = z.enum(['rectangular', 'circular']);

export const rccFootingShapeSchema = z.enum(['rectangular', 'square']);

export const rccPccMixSchema = z.enum(['M5', 'M7.5', 'M10']);

export const rccLengthUnitSchema = z.enum(['mm', 'cm', 'm', 'inch', 'ft']);

export const rccGradeSchema = z.enum(['M15', 'M20', 'M25', 'M30', 'custom']);

export const rccCalculatorInputSchema = z
  .object({
    element: rccElementSchema.default('slab'),
    /** Rectangular column / default for other elements */
    columnShape: rccColumnShapeSchema.default('rectangular'),
    footingShape: rccFootingShapeSchema.default('rectangular'),
    length: z.number().positive().max(10_000).optional(),
    width: z.number().positive().max(10_000).optional(),
    /** Slab thickness / footing depth / beam depth */
    thickness: z.number().positive().max(10_000).optional(),
    /** Column / beam height (span for beam length uses length) */
    height: z.number().positive().max(10_000).optional(),
    /** Circular column diameter */
    diameter: z.number().positive().max(10_000).optional(),
    lengthUnit: rccLengthUnitSchema.default('m'),
    widthUnit: rccLengthUnitSchema.default('m'),
    thicknessUnit: rccLengthUnitSchema.default('mm'),
    heightUnit: rccLengthUnitSchema.default('m'),
    diameterUnit: rccLengthUnitSchema.default('mm'),
    quantity: z.number().positive().max(10_000).default(1),
    grade: rccGradeSchema.default('M20'),
    cementParts: z.number().positive().max(20).optional(),
    sandParts: z.number().positive().max(40).optional(),
    aggregateParts: z.number().nonnegative().max(40).optional(),
    wastagePercent: z.number().min(0).max(40).default(5),
    includeMaterialBreakdown: z.boolean().default(true),
    /** Optional lean PCC bed under footing (same plan area × PCC thickness) */
    includePccLayer: z.boolean().default(false),
    pccThickness: z.number().positive().max(10_000).optional(),
    pccThicknessUnit: rccLengthUnitSchema.default('mm'),
    pccMix: rccPccMixSchema.default('M7.5'),
    pccRatePerM3Inr: z.number().positive().max(500_000).optional().nullable(),
    /** Off by default — steel is preliminary thumb-rule only */
    includeSteelEstimate: z.boolean().default(false),
    /** Override preliminary steel kg per m³ of concrete (typical) */
    steelKgPerM3: z.number().positive().max(500).optional().nullable(),
    steelKgPerM3Min: z.number().positive().max(500).optional().nullable(),
    steelKgPerM3Max: z.number().positive().max(500).optional().nullable(),
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
    switch (val.element) {
      case 'slab':
        need(['length', 'width', 'thickness'], 'Slab needs length, width and thickness');
        break;
      case 'footing':
        need(['length', 'thickness'], 'Footing needs length and depth');
        if (val.footingShape !== 'square') {
          need(['width'], 'Rectangular footing needs width');
        }
        if (val.includePccLayer) {
          need(['pccThickness'], 'PCC layer needs thickness');
        }
        break;
      case 'beam':
        need(['length', 'width', 'thickness'], 'Beam needs length, width and depth');
        break;
      case 'column':
        if (val.columnShape === 'circular') {
          need(['diameter', 'height'], 'Circular column needs diameter and height');
        } else {
          need(['length', 'width', 'height'], 'Rectangular column needs B, D and height');
        }
        break;
      default:
        break;
    }
  });

export type RccElement = z.infer<typeof rccElementSchema>;
export type RccColumnShape = z.infer<typeof rccColumnShapeSchema>;
export type RccFootingShape = z.infer<typeof rccFootingShapeSchema>;
export type RccPccMix = z.infer<typeof rccPccMixSchema>;
export type RccGrade = z.infer<typeof rccGradeSchema>;
export type RccCalculatorInput = z.input<typeof rccCalculatorInputSchema>;

export type RccMaterialEstimate = {
  cementKg: number;
  cementBags: number;
  bagSizeKg: number;
  sandM3: number;
  aggregateM3: number;
  mixLabel: string;
  dryFactor: number;
};

export type RccSteelEstimate = {
  kgPerM3Min: number;
  kgPerM3Typical: number;
  kgPerM3Max: number;
  steelKgMin: number;
  steelKgTypical: number;
  steelKgMax: number;
  steelTonnesTypical: number;
  ratioSource: string;
  warning: string;
};

export type RccCalculatorResult = {
  element: RccElement;
  elementLabel: string;
  quantity: number;
  /** Plan area of one slab/footing (L×W); null for beam/column */
  planAreaOneM2: number | null;
  /** Total plan area × quantity */
  planAreaM2: number | null;
  dimensionsM: {
    length: number;
    width: number;
    thickness?: number;
    height?: number;
    diameter?: number;
    shape?: RccColumnShape;
  } | null;
  /** Set for column results */
  columnShape: RccColumnShape | null;
  /** Set for footing results */
  footingShape: RccFootingShape | null;
  wetVolumeOneM3: number;
  wetVolumeM3: number;
  orderVolumeM3: number;
  wastagePercent: number;
  grade: RccGrade;
  materials: RccMaterialEstimate | null;
  /** Lean PCC bed volumes / materials when requested on footing */
  pcc: {
    wetVolumeOneM3: number;
    wetVolumeM3: number;
    orderVolumeM3: number;
    thicknessM: number;
    mixLabel: string;
    materials: RccMaterialEstimate | null;
    estimatedCostInr: number | null;
  } | null;
  steel: RccSteelEstimate | null;
  /** RCC concrete cost (order × rate) when rate provided */
  estimatedCostInr: number | null;
  /** RCC + PCC cost when either rate is provided */
  totalEstimatedCostInr: number | null;
  formula: string;
  steps: string[];
  assumptions: string[];
  structuralDisclaimer: string;
  disclaimer: string;
  version: string;
};
