/** Renovation Cost Calculator — types & Zod input. */

import { z } from 'zod';

export const renovationWorkIdSchema = z.enum([
  'painting',
  'flooring',
  'kitchen',
  'bathroom',
  'electrical',
  'plumbing',
  'false_ceiling',
  'doors_windows',
  'waterproofing',
  'structural_repair',
  'carpentry',
  'demolition',
  'debris_removal',
]);

export const renovationQualitySchema = z.enum(['basic', 'standard', 'premium']);

export const renovationPropertyTypeSchema = z.enum([
  'apartment',
  'independent_house',
  'villa',
  'duplex',
  'commercial',
]);

export const renovationAreaUnitSchema = z.enum(['sqft', 'sqm']);

export const renovationWorkItemSchema = z.object({
  id: renovationWorkIdSchema,
  enabled: z.boolean().default(true),
  quality: renovationQualitySchema.default('standard'),
});

export const renovationRoomsBhkSchema = z.enum(['1bhk', '2bhk', '3bhk', '4bhk', '5plus', 'na']);

export const renovationWorkDetailsSchema = z
  .object({
    painting: z
      .object({
        paintArea: z.number().positive().max(100_000).optional(),
        scope: z.enum(['interior', 'exterior', 'both']).default('interior'),
      })
      .optional(),
    flooring: z
      .object({
        floorArea: z.number().positive().max(100_000).optional(),
        flooringType: z.enum(['ceramic', 'vitrified', 'wood', 'marble']).default('vitrified'),
        demolition: z.boolean().default(false),
      })
      .optional(),
    kitchen: z
      .object({
        kitchenSize: z.enum(['compact', 'standard', 'large']).default('standard'),
        cabinetType: z.enum(['basic', 'modular']).default('modular'),
        countertop: z.enum(['laminate', 'granite', 'quartz']).default('granite'),
      })
      .optional(),
    bathroom: z
      .object({
        bathroomCount: z.number().int().min(1).max(12).default(1),
      })
      .optional(),
  })
  .optional();

export const renovationCostInputSchema = z.object({
  location: z.string().min(1).max(80),
  propertyType: renovationPropertyTypeSchema.default('apartment'),
  renovationArea: z.number().positive().max(100_000),
  areaUnit: renovationAreaUnitSchema.default('sqft'),
  roomsBhk: renovationRoomsBhkSchema.optional().default('na'),
  /** Age of property in years (0 = new / under 1 year). */
  propertyAgeYears: z.number().min(0).max(150).default(10),
  finishTier: renovationQualitySchema.optional(),
  workItems: z.array(renovationWorkItemSchema).min(1),
  workDetails: renovationWorkDetailsSchema,
  contingencyPercent: z.number().min(0).max(40).optional().default(12),
  overrides: z
    .object({
      locationMultiplier: z.number().positive().max(3).optional(),
    })
    .optional(),
});

export type RenovationWorkId = z.infer<typeof renovationWorkIdSchema>;
export type RenovationQuality = z.infer<typeof renovationQualitySchema>;
export type RenovationPropertyType = z.infer<typeof renovationPropertyTypeSchema>;
export type RenovationRoomsBhk = z.infer<typeof renovationRoomsBhkSchema>;
export type RenovationWorkDetails = z.infer<typeof renovationWorkDetailsSchema>;
export type RenovationWorkItem = z.infer<typeof renovationWorkItemSchema>;
export type RenovationCostInput = z.input<typeof renovationCostInputSchema>;

export type RenovationBreakdownLine = {
  id: string;
  label: string;
  quality: RenovationQuality | 'n/a';
  amount: number;
  percentOfTotal: number;
  enabled: boolean;
};

export type RenovationCostResult = {
  currency: 'INR';
  areaSqft: number;
  locationKey: string;
  locationLabel: string;
  propertyType: RenovationPropertyType;
  propertyAgeYears: number;
  ageMultiplier: number;
  locationMultiplier: number;
  propertyMultiplier: number;
  costPerSqft: number;
  estimatedTotal: number;
  materialCost: number;
  labourCost: number;
  otherCost: number;
  rangeLow: number;
  rangeHigh: number;
  contingencyAmount: number;
  contingencyPercent: number;
  workBreakdown: RenovationBreakdownLine[];
  topCostDrivers: Array<{ id: string; label: string; amount: number; percentOfTotal: number }>;
  assumptions: string[];
  methodology: { title: string; steps: string[] };
  disclaimer: string;
  version: string;
};
