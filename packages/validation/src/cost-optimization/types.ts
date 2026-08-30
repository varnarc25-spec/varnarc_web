/** Cost optimization — types. Never auto-downgrade structural safety items. */

import { z } from 'zod';
import {
  constructionCostInteriorSchema,
  constructionCostQualitySchema,
} from '../construction-cost/types';

export const optimizationSafetyClassSchema = z.enum([
  'safe_planning',
  'finish_spec',
  'professional_review',
]);

export const costOptimizationInputSchema = z.object({
  location: z.string().min(1).max(80).default('Hyderabad'),
  builtUpArea: z.number().positive().max(200_000),
  areaUnit: z.enum(['sqft', 'sqm']).default('sqft'),
  floors: z.number().int().min(1).max(50).default(2),
  quality: constructionCostQualitySchema.default('standard'),
  interiorLevel: constructionCostInteriorSchema.default('standard'),
  contingencyPercent: z.number().min(0).max(40).default(10),
  /** Absolute ₹ reduction target (e.g. 500_000 to cut ₹5 lakh). */
  targetReductionInr: z.number().positive().max(100_000_000),
  /** Optional: paste current estimate total to align UI; engine still recalculates. */
  statedCurrentEstimateInr: z.number().positive().max(500_000_000).optional().nullable(),
});

export type OptimizationSafetyClass = z.infer<typeof optimizationSafetyClassSchema>;
export type CostOptimizationInput = z.infer<typeof costOptimizationInputSchema>;

export type OptimizationLever = {
  id: string;
  category: string;
  label: string;
  safetyClass: OptimizationSafetyClass;
  potentialSavingsInr: number;
  tradeOff: string;
  /** Whether the user can toggle this into the revised plan. */
  selectable: boolean;
  /** True only for finish/planning levers that never touch structure. */
  structurallySafe: boolean;
};

export type CostOptimizationResult = {
  currency: 'INR';
  currentEstimateInr: number;
  targetReductionInr: number;
  targetReductionPercent: number;
  levers: OptimizationLever[];
  /** Levers grouped for UI. */
  groups: {
    safePlanning: OptimizationLever[];
    finishSpec: OptimizationLever[];
    professionalReview: OptimizationLever[];
  };
  /** Structural categories explicitly excluded from auto-savings. */
  structuralExclusions: Array<{ id: string; label: string; reason: string }>;
  disclaimer: string;
  version: string;
};

export type AppliedOptimizationResult = {
  originalTotal: number;
  revisedTotal: number;
  savingsInr: number;
  savingsPercent: number;
  appliedLeverIds: string[];
  tradeOffs: string[];
  /** Scenario configs suitable for /construction/scenario-compare share. */
  comparisonScenarios: Array<{
    id: string;
    label: string;
    location: string;
    propertyType: 'independent_house';
    builtUpArea: number;
    areaUnit: 'sqft' | 'sqm';
    floors: number;
    quality: z.infer<typeof constructionCostQualitySchema>;
    contingencyPercent: number;
  }>;
};
