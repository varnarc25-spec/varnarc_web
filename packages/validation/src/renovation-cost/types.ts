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

export const renovationCostInputSchema = z.object({
  location: z.string().min(1).max(80),
  propertyType: renovationPropertyTypeSchema.default('apartment'),
  renovationArea: z.number().positive().max(100_000),
  areaUnit: renovationAreaUnitSchema.default('sqft'),
  /** Age of property in years (0 = new / under 1 year). */
  propertyAgeYears: z.number().min(0).max(150).default(10),
  workItems: z.array(renovationWorkItemSchema).min(1),
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
export type RenovationWorkItem = z.infer<typeof renovationWorkItemSchema>;
export type RenovationCostInput = z.infer<typeof renovationCostInputSchema>;

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
