/** Construction scenario comparison — types. */

import { z } from 'zod';
import {
  constructionCostAreaUnitSchema,
  constructionCostPropertyTypeSchema,
  constructionCostQualitySchema,
} from '../construction-cost/types';

export const scenarioConfigSchema = z.object({
  id: z.string().min(1).max(40),
  label: z.string().min(1).max(80),
  location: z.string().min(1).max(80),
  propertyType: constructionCostPropertyTypeSchema.default('independent_house'),
  builtUpArea: z.number().positive().max(200_000),
  areaUnit: constructionCostAreaUnitSchema.default('sqft'),
  floors: z.number().int().min(1).max(50).default(1),
  quality: constructionCostQualitySchema.default('standard'),
  contingencyPercent: z.number().min(0).max(40).default(10),
});

export const scenarioCompareInputSchema = z.object({
  scenarios: z.array(scenarioConfigSchema).min(1).max(3),
});

export type ScenarioConfig = z.infer<typeof scenarioConfigSchema>;
export type ScenarioCompareInput = z.infer<typeof scenarioCompareInputSchema>;

export type ScenarioMaterialQuantities = {
  cementBags: number;
  steelKg: number;
  sandCft: number;
  aggregateCft: number;
  bricks: number;
};

export type ScenarioComputed = {
  config: ScenarioConfig;
  estimatedTotal: number;
  costPerSqft: number;
  materialCost: number;
  labourCost: number;
  contingencyAmount: number;
  contingencyPercent: number;
  durationMonths: number;
  materials: ScenarioMaterialQuantities;
  topDriver: { id: string; label: string; amount: number } | null;
  rangeLow: number;
  rangeHigh: number;
  areaSqft: number;
};

export type ScenarioCompareResult = {
  scenarios: ScenarioComputed[];
  highlights: {
    lowestCostScenarioId: string;
    highestCostScenarioId: string;
    /** Scenario with the largest absolute difference vs the lowest-cost scenario. */
    highestDifferenceScenarioId: string;
    maxAbsoluteDifference: number;
    largestCostDrivers: Array<{
      scenarioId: string;
      scenarioLabel: string;
      driverId: string;
      driverLabel: string;
      amount: number;
    }>;
  };
  disclaimer: string;
  version: string;
};
