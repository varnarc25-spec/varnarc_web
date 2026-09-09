import { z } from 'zod';
import { rangeFromExpected } from '../construction-rate-resolution';
import {
  resolveConstructionCostRateDisplay,
  type ConstructionRateDisplay,
} from '../construction-location-catalog';

export const INTERIOR_CALC_VERSION = '2026.09.1';
export const INTERIOR_QUALIFICATION =
  'Indicative planning rates for interior fit-out. Not a live market price, dealer quotation, or design contract.';

export const interiorQualitySchema = z.enum(['economy', 'standard', 'premium', 'luxury']);
export const interiorHomeTypeSchema = z.enum(['apartment', 'independent_house', 'villa', 'duplex']);

const componentSchema = z.object({
  id: z.enum([
    'kitchen',
    'wardrobes',
    'living',
    'bedrooms',
    'bathrooms',
    'ceiling',
    'lighting',
    'painting',
    'furniture',
    'design_fee',
  ]),
  enabled: z.boolean(),
  quantity: z.number().min(0).max(10_000).optional(),
});

export const interiorCostInputSchema = z.object({
  location: z.string().min(1).max(80),
  homeType: interiorHomeTypeSchema.default('apartment'),
  builtUpArea: z.number().positive().max(50_000),
  quality: interiorQualitySchema.default('standard'),
  rooms: z.number().int().min(1).max(30).default(3),
  kitchenRunningFt: z.number().min(0).max(200).default(12),
  wardrobeSqft: z.number().min(0).max(2_000).default(40),
  includeFalseCeiling: z.boolean().default(true),
  contingencyPercent: z.number().min(0).max(40).default(10),
  components: z.array(componentSchema).optional(),
});

export type InteriorCostInput = z.infer<typeof interiorCostInputSchema>;
export type InteriorQuality = z.infer<typeof interiorQualitySchema>;

/** Planning ₹/unit — ESTIMATED_FALLBACK, not official SOR. */
const QUALITY_FACTOR: Record<InteriorQuality, number> = {
  economy: 0.78,
  standard: 1,
  premium: 1.35,
  luxury: 1.85,
};

const HOME_FACTOR: Record<z.infer<typeof interiorHomeTypeSchema>, number> = {
  apartment: 1,
  independent_house: 1.06,
  villa: 1.12,
  duplex: 1.08,
};

export type InteriorLine = {
  id: string;
  label: string;
  amount: number;
  sourceType: 'ESTIMATED_FALLBACK';
  confidence: 'LOW';
  publicLabel: 'Indicative planning rate';
};

type ComponentId = z.infer<typeof componentSchema>['id'];

export type InteriorCostResult = {
  currency: 'INR';
  location: string;
  quality: InteriorQuality;
  areaSqft: number;
  lines: InteriorLine[];
  subtotal: number;
  designFee: number;
  labour: number;
  contingency: number;
  total: { low: number; expected: number; high: number };
  qualification: string;
  version: string;
  assumptions: string[];
  rateDisplay: ConstructionRateDisplay;
};

function line(id: string, label: string, amount: number): InteriorLine {
  return {
    id,
    label,
    amount: Math.round(amount),
    sourceType: 'ESTIMATED_FALLBACK',
    confidence: 'LOW',
    publicLabel: 'Indicative planning rate',
  };
}

export function calculateInteriorCost(raw: InteriorCostInput): InteriorCostResult {
  const input = interiorCostInputSchema.parse(raw);
  const q = QUALITY_FACTOR[input.quality];
  const h = HOME_FACTOR[input.homeType];
  const enabled = new Set((input.components ?? []).filter((c) => c.enabled).map((c) => c.id));
  const on = (id: ComponentId) => enabled.size === 0 || enabled.has(id);

  const kitchen = on('kitchen') ? input.kitchenRunningFt * 12_000 * q * h : 0;
  const wardrobes = on('wardrobes') ? input.wardrobeSqft * 1_800 * q * h : 0;
  const living = on('living') ? input.builtUpArea * 90 * q * h : 0;
  const bedrooms = on('bedrooms') ? input.rooms * 45_000 * q * h : 0;
  const bathrooms = on('bathrooms') ? Math.max(1, Math.round(input.rooms * 0.7)) * 85_000 * q : 0;
  const ceiling = on('ceiling') && input.includeFalseCeiling ? input.builtUpArea * 110 * q : 0;
  const lighting = on('lighting') ? input.builtUpArea * 55 * q : 0;
  const painting = on('painting') ? input.builtUpArea * 45 * q : 0;
  const furniture = on('furniture') ? input.builtUpArea * 120 * q * h : 0;
  const carpentry = kitchen + wardrobes;
  const labour = Math.round((carpentry + ceiling + painting) * 0.18);
  const designFee = on('design_fee') ? Math.round(input.builtUpArea * 25 * q) : 0;

  const lines = [
    line('kitchen', 'Modular kitchen', kitchen),
    line('wardrobes', 'Wardrobes', wardrobes),
    line('living', 'Living room', living),
    line('bedrooms', 'Bedrooms', bedrooms),
    line('bathrooms', 'Bathroom fit-out', bathrooms),
    line('ceiling', 'False ceiling', ceiling),
    line('lighting', 'Lighting', lighting),
    line('painting', 'Painting / wall finish', painting),
    line('furniture', 'Loose furniture', furniture),
    line('labour', 'Installation labour', labour),
    line('design_fee', 'Design / professional fee', designFee),
  ].filter((row) => row.amount > 0);

  const subtotal = lines.reduce((s, row) => s + row.amount, 0);
  const contingency = Math.round(subtotal * (input.contingencyPercent / 100));
  const expected = subtotal + contingency;
  const total = rangeFromExpected(expected);

  return {
    currency: 'INR',
    location: input.location,
    quality: input.quality,
    areaSqft: input.builtUpArea,
    lines,
    subtotal,
    designFee,
    labour,
    contingency,
    total,
    qualification: INTERIOR_QUALIFICATION,
    version: INTERIOR_CALC_VERSION,
    assumptions: [
      'Component rates are national planning fallbacks (ESTIMATED_FALLBACK), not city dealer lists.',
      'Quality maps to specification intensity, then a documented factor — not a hidden city multiplier.',
      INTERIOR_QUALIFICATION,
    ],
    rateDisplay: resolveConstructionCostRateDisplay(input.location),
  };
}
