/** Flagship Construction Cost Calculator — types & Zod input. */

import { z } from 'zod';
import type { ReverseCalculationDisplay } from '../reverse-calculator';

export const constructionCostModeSchema = z.enum(['forward', 'reverse']);
export type ConstructionCostMode = z.infer<typeof constructionCostModeSchema>;

export const constructionCostQualitySchema = z.enum(['basic', 'standard', 'premium', 'luxury']);

export const constructionCostPropertyTypeSchema = z.enum([
  'independent_house',
  'villa',
  'apartment',
  'duplex',
  'commercial',
  'renovation',
]);

export const constructionCostAreaUnitSchema = z.enum(['sqft', 'sqm']);

export const constructionCostFoundationSchema = z.enum(['isolated', 'raft', 'pile', 'combined']);

export const constructionCostStructureSchema = z.enum(['rcc_framed', 'load_bearing', 'steel']);

export const constructionCostInteriorSchema = z.enum(['shell', 'basic', 'standard', 'premium']);

export const constructionCostInputSchema = z
  .object({
    mode: constructionCostModeSchema.default('forward'),
    location: z.string().min(1).max(80),
    propertyType: constructionCostPropertyTypeSchema.default('independent_house'),
    builtUpArea: z.number().positive().max(200_000).optional(),
    areaUnit: constructionCostAreaUnitSchema.default('sqft'),
    floors: z.number().int().min(1).max(50).default(1),
    quality: constructionCostQualitySchema.default('standard'),
    foundationType: constructionCostFoundationSchema.optional(),
    structureType: constructionCostStructureSchema.optional(),
    basement: z.boolean().optional().default(false),
    parkingSlots: z.number().int().min(0).max(50).optional().default(0),
    lift: z.boolean().optional().default(false),
    compoundWall: z.boolean().optional().default(false),
    modularKitchen: z.boolean().optional().default(false),
    interiorLevel: constructionCostInteriorSchema.optional(),
    customCostPerSqft: z.number().positive().max(50_000).optional().nullable(),
    contingencyPercent: z.number().min(0).max(40).optional().default(10),
    /** Reverse: total budget available (INR). */
    budgetInr: z.number().positive().max(50_000_000_000).optional(),
    overrides: z
      .object({
        baseRatePerSqft: z.number().positive().max(50_000).optional(),
        labourPercent: z.number().min(5).max(60).optional(),
        materialPercent: z.number().min(20).max(80).optional(),
        miscPercent: z.number().min(0).max(40).optional(),
        steelRatePerKg: z.number().positive().max(500).optional(),
        cementRatePerBag: z.number().positive().max(2_000).optional(),
        labourRateIndex: z.number().min(40).max(250).optional(),
      })
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (val.mode === 'reverse') {
      if (val.budgetInr == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'budgetInr is required in reverse mode',
          path: ['budgetInr'],
        });
      }
      return;
    }
    if (val.builtUpArea == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'builtUpArea is required in forward mode',
        path: ['builtUpArea'],
      });
    }
  });

export type ConstructionCostInput = z.infer<typeof constructionCostInputSchema>;
export type ConstructionCostQuality = z.infer<typeof constructionCostQualitySchema>;
export type ConstructionCostPropertyType = z.infer<typeof constructionCostPropertyTypeSchema>;
export type ConstructionCostInterior = z.infer<typeof constructionCostInteriorSchema>;

export type CostBreakdownLine = {
  id: string;
  label: string;
  amount: number;
  percentOfTotal: number;
};

export type ConstructionCostResult = {
  mode: ConstructionCostMode;
  currency: 'INR';
  areaSqft: number;
  areaSqm: number;
  floors: number;
  locationKey: string;
  locationLabel: string;
  quality: ConstructionCostQuality;
  propertyType: ConstructionCostPropertyType;
  costPerSqft: number;
  baseRatePerSqft: number;
  qualityMultiplier: number;
  floorMultiplier: number;
  foundationMultiplier: number;
  structureMultiplier: number;
  interiorMultiplier: number;
  locationMultiplier: number;
  featureCosts: Array<{ id: string; label: string; amount: number }>;
  estimatedTotal: number;
  rangeLow: number;
  rangeHigh: number;
  materialCost: number;
  labourCost: number;
  miscellaneousCost: number;
  contingencyAmount: number;
  contingencyPercent: number;
  budgetInr: number | null;
  selectedUnit: string;
  formula: string;
  limitations: string[];
  reverseDisplay: ReverseCalculationDisplay | null;
  confidence: 'low' | 'medium' | 'high';
  confidenceScore: number;
  categoryBreakdown: CostBreakdownLine[];
  phaseBreakdown: CostBreakdownLine[];
  floorBreakdown: CostBreakdownLine[];
  monthlyCashRequirement: number;
  assumptions: string[];
  methodology: {
    title: string;
    steps: string[];
  };
  disclaimer: string;
  version: string;
};
