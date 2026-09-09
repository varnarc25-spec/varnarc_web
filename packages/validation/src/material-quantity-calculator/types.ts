import { z } from 'zod';
import { constructionCostQualitySchema } from '../construction-cost/types';
import type { ConstructionRateDisplay } from '../construction-location-catalog';

export const materialQuantityAreaUnitSchema = z.enum(['sqft', 'sqm']);
export const materialQuantityStructureSchema = z.enum(['rcc_framed', 'load_bearing', 'steel']);
export const materialQuantityWallSchema = z.enum(['clay_brick', 'aac', 'mixed']);
export const materialQuantitySlabSchema = z.enum(['rcc', 'filler', 'prestressed']);
export const materialQuantityFoundationSchema = z.enum(['isolated', 'raft', 'pile', 'combined']);

export const materialQuantityCustomRatesSchema = z.object({
  cementPerBag: z.number().positive().max(5_000).optional(),
  steelPerKg: z.number().positive().max(500).optional(),
  sandPerTonne: z.number().positive().max(20_000).optional(),
  aggregatePerTonne: z.number().positive().max(20_000).optional(),
  brickEach: z.number().positive().max(200).optional(),
  aacBlockEach: z.number().positive().max(500).optional(),
  tilePerSqft: z.number().positive().max(5_000).optional(),
  paintPerLitre: z.number().positive().max(5_000).optional(),
  electricalPerSqft: z.number().positive().max(5_000).optional(),
  plumbingPerSqft: z.number().positive().max(5_000).optional(),
});

export const materialQuantityCustomFactorsSchema = z.object({
  cement: z.number().positive().max(5).optional(),
  steel: z.number().positive().max(5).optional(),
  sand: z.number().positive().max(5).optional(),
  aggregate: z.number().positive().max(5).optional(),
  masonry: z.number().positive().max(5).optional(),
  tiles: z.number().positive().max(5).optional(),
  paint: z.number().positive().max(5).optional(),
  electrical: z.number().positive().max(5).optional(),
  plumbing: z.number().positive().max(5).optional(),
});

export const materialQuantityInputSchema = z.object({
  builtUpArea: z.number().positive().max(200_000),
  areaUnit: materialQuantityAreaUnitSchema.default('sqft'),
  floors: z.number().int().min(1).max(50).default(1),
  quality: constructionCostQualitySchema.default('standard'),
  location: z.string().min(1).max(80).default('India'),
  structureType: materialQuantityStructureSchema.default('rcc_framed'),
  wallType: materialQuantityWallSchema.default('clay_brick'),
  slabType: materialQuantitySlabSchema.default('rcc'),
  foundationType: materialQuantityFoundationSchema.default('isolated'),
  wastagePercent: z.number().min(0).max(40).default(5),
  customRates: materialQuantityCustomRatesSchema.optional(),
  customFactors: materialQuantityCustomFactorsSchema.optional(),
});

export type MaterialQuantityInput = z.input<typeof materialQuantityInputSchema>;
export type MaterialQuantityParsedInput = z.infer<typeof materialQuantityInputSchema>;
export type MaterialQuantityCustomRates = z.infer<typeof materialQuantityCustomRatesSchema>;
export type MaterialQuantityCustomFactors = z.infer<typeof materialQuantityCustomFactorsSchema>;

export type MaterialQuantityLine = {
  id: string;
  label: string;
  quantity: number;
  unit: string;
  rate: number;
  estimatedCost: number;
};

export type MaterialQuantityResult = {
  version: string;
  areaSqft: number;
  floors: number;
  quality: string;
  locationKey: string;
  locationMultiplier: number;
  wastagePercent: number;
  lines: MaterialQuantityLine[];
  materialCost: number;
  labourSharePercent: number;
  materialSharePercent: number;
  otherSharePercent: number;
  impliedProjectTotal: number;
  labourCost: number;
  otherCost: number;
  formula: string;
  assumptions: string[];
  disclaimer: string;
  rateDisplay: ConstructionRateDisplay;
};
