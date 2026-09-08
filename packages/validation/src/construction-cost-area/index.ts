/** Programmatic house-size construction cost landings — curated areas only. */

import { calculateConstructionCost } from '../construction-cost/calculate';
import { constructionCostCalculatorHref } from '../construction-calculator-slug';
import {
  COST_CALC_VERSION,
  DEFAULT_MARKET_RATES,
  LOCATION_MULTIPLIERS,
  QUALITY_QTY_FACTOR,
  RATE_QTY_PER_SQFT,
} from '../construction-cost/rates';
import type { ConstructionCostQuality, ConstructionCostResult } from '../construction-cost/types';

export const CONSTRUCTION_COST_AREA_VERSION = '2026.09.1';

export const CONSTRUCTION_COST_AREA_QUALIFICATION =
  'Indicative planning figures for education only — not a quotation, tender or structural design. Actual cost depends on drawings, soil, finish level, city rates and contractor terms.';

export const CONSTRUCTION_COST_AREA_METHODOLOGY =
  'Each size page runs Varnarc’s published construction-cost engine for an independent house at the stated built-up area. Quality rows reuse the same rate model. Material quantities use documented per-sq-ft planning factors, scaled by quality. Pages are published only from a curated size allowlist.';

export const COST_AREA_DEFAULT_LOCATION = 'Hyderabad';
export const COST_AREA_DEFAULT_QUALITY: ConstructionCostQuality = 'standard';

export type ConstructionCostAreaSlug =
  | '500-sq-ft'
  | '600-sq-ft'
  | '800-sq-ft'
  | '1000-sq-ft'
  | '1200-sq-ft'
  | '1500-sq-ft'
  | '1800-sq-ft'
  | '2000-sq-ft'
  | '2500-sq-ft'
  | '3000-sq-ft';

export type ConstructionCostAreaProfile = {
  slug: ConstructionCostAreaSlug;
  areaSqft: number;
  label: string;
  defaultFloors: number;
  /** Unique planning note for this size (anti-thin). */
  sizeNote: string;
};

/** Extra whole-house planning quantities (not used in the ₹ engine split). */
export const COST_AREA_QTY_PER_SQFT = {
  cementBags: RATE_QTY_PER_SQFT.cementBags,
  steelKg: RATE_QTY_PER_SQFT.steelKg,
  sandTonnes: 0.025,
  aggregateTonnes: 0.028,
  bricks: 8,
  tilesSqft: 1.1,
  paintLitres: 0.15,
} as const;

export const COST_AREA_INDICATIVE_RATES = {
  cementPerBag: DEFAULT_MARKET_RATES.cementRatePerBag,
  steelPerKg: DEFAULT_MARKET_RATES.steelRatePerKg,
  sandPerTonne: 2200,
  aggregatePerTonne: 1800,
  brickEach: 8,
  tilePerSqft: 55,
  paintPerLitre: 280,
} as const;

export const CONSTRUCTION_COST_AREA_PROFILES: Record<
  ConstructionCostAreaSlug,
  ConstructionCostAreaProfile
> = {
  '500-sq-ft': {
    slug: '500-sq-ft',
    areaSqft: 500,
    label: '500 sq ft',
    defaultFloors: 1,
    sizeNote:
      'A 500 sq ft house is typically a compact single-level home. Wall-to-floor ratio is high, so masonry, plaster and openings take a larger share of budget than on bigger footprints.',
  },
  '600-sq-ft': {
    slug: '600-sq-ft',
    areaSqft: 600,
    label: '600 sq ft',
    defaultFloors: 1,
    sizeNote:
      'Around 600 sq ft usually covers a small 1–2 bedroom independent house. Services (kitchen, toilet, electrical) still occupy a full set of fixtures, so per-sq-ft finishing can look higher than mid-size homes.',
  },
  '800-sq-ft': {
    slug: '800-sq-ft',
    areaSqft: 800,
    label: '800 sq ft',
    defaultFloors: 1,
    sizeNote:
      'An 800 sq ft plan is a common compact 2BHK shell. Structural members stay modest; cost movement is driven more by finish grade and whether a second toilet or sit-out is included.',
  },
  '1000-sq-ft': {
    slug: '1000-sq-ft',
    areaSqft: 1000,
    label: '1,000 sq ft',
    defaultFloors: 2,
    sizeNote:
      '1,000 sq ft is a frequent G+1 family house. Stair, extra slab and first-floor toilets add RCC and plumbing relative to a single-storey 800 sq ft plan of similar rooms.',
  },
  '1200-sq-ft': {
    slug: '1200-sq-ft',
    areaSqft: 1200,
    label: '1,200 sq ft',
    defaultFloors: 2,
    sizeNote:
      '1,200 sq ft G+1 homes typically add a third bedroom or larger living. Steel and cement scale almost linearly; luxury kitchens and imported tiles are the usual step-up from a 1,000 sq ft budget.',
  },
  '1500-sq-ft': {
    slug: '1500-sq-ft',
    areaSqft: 1500,
    label: '1,500 sq ft',
    defaultFloors: 2,
    sizeNote:
      '1,500 sq ft is the most searched independent-house size in India. Two floors with three bedrooms is typical; parking, compound and interiors are still optional adders in this landing’s defaults.',
  },
  '1800-sq-ft': {
    slug: '1800-sq-ft',
    areaSqft: 1800,
    label: '1,800 sq ft',
    defaultFloors: 2,
    sizeNote:
      'At 1,800 sq ft, families often plan a pooja room or extra bath. Floor-to-floor height and larger spans start to show in RCC quantities compared with a tight 1,500 sq ft grid.',
  },
  '2000-sq-ft': {
    slug: '2000-sq-ft',
    areaSqft: 2000,
    label: '2,000 sq ft',
    defaultFloors: 2,
    sizeNote:
      'A 2,000 sq ft house is a full family villa-scale shell. External works, driveway and compound become a larger share of “other” cost than on compact plots — still excluded from this default unless you add them in the calculator.',
  },
  '2500-sq-ft': {
    slug: '2500-sq-ft',
    areaSqft: 2500,
    label: '2,500 sq ft',
    defaultFloors: 2,
    sizeNote:
      '2,500 sq ft plans often include a family lounge or study. Premium quality jumps faster here because finish area (flooring, paint, joinery) is large relative to a 1,500 sq ft home.',
  },
  '3000-sq-ft': {
    slug: '3000-sq-ft',
    areaSqft: 3000,
    label: '3,000 sq ft',
    defaultFloors: 2,
    sizeNote:
      '3,000 sq ft is a large independent house. Lift, basement and landscaping are frequently discussed at this size; they are not in the default total — use the full cost calculator to add them.',
  },
};

const BREAKDOWN_IDS = [
  { id: 'foundation', label: 'Foundation' },
  { id: 'structure', label: 'RCC' },
  { id: 'masonry', label: 'Masonry' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'flooring', label: 'Flooring' },
  { id: 'paint', label: 'Painting' },
] as const;

export const COST_AREA_CITY_OPTIONS = Object.entries(LOCATION_MULTIPLIERS)
  .filter(([key]) => key !== 'default' && key !== 'bangalore' && key !== 'gurgaon')
  .map(([key, meta]) => ({ key, label: meta.label }));

export function isConstructionCostAreaSlug(value: string): value is ConstructionCostAreaSlug {
  return value in CONSTRUCTION_COST_AREA_PROFILES;
}

export function listConstructionCostAreaSlugs(): ConstructionCostAreaSlug[] {
  return Object.keys(CONSTRUCTION_COST_AREA_PROFILES) as ConstructionCostAreaSlug[];
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function formatLakhRange(low: number, high: number): string {
  const a = (low / 100_000).toFixed(1);
  const b = (high / 100_000).toFixed(1);
  return `₹${a} – ₹${b} lakh`;
}

export function constructionCostAreaPath(slug: ConstructionCostAreaSlug): string {
  return `/construction/cost/${slug}`;
}

function costInput(opts: {
  areaSqft: number;
  floors: number;
  quality: ConstructionCostQuality;
  location: string;
}) {
  return {
    mode: 'forward' as const,
    location: opts.location,
    propertyType: 'independent_house' as const,
    builtUpArea: opts.areaSqft,
    areaUnit: 'sqft' as const,
    floors: opts.floors,
    quality: opts.quality,
    basement: false,
    parkingSlots: 0,
    lift: false,
    compoundWall: false,
    modularKitchen: false,
    contingencyPercent: 10,
  };
}

export type ConstructionCostAreaMaterials = {
  cementBags: number;
  steelKg: number;
  sandTonnes: number;
  aggregateTonnes: number;
  bricks: number;
};

export function estimateCostAreaMaterials(
  areaSqft: number,
  quality: ConstructionCostQuality,
): ConstructionCostAreaMaterials {
  const q = QUALITY_QTY_FACTOR[quality] ?? 1;
  return {
    cementBags: Math.round(areaSqft * COST_AREA_QTY_PER_SQFT.cementBags * q),
    steelKg: Math.round(areaSqft * COST_AREA_QTY_PER_SQFT.steelKg * q),
    sandTonnes: Math.round(areaSqft * COST_AREA_QTY_PER_SQFT.sandTonnes * q * 10) / 10,
    aggregateTonnes: Math.round(areaSqft * COST_AREA_QTY_PER_SQFT.aggregateTonnes * q * 10) / 10,
    bricks: Math.round(areaSqft * COST_AREA_QTY_PER_SQFT.bricks * q),
  };
}

export type ConstructionCostAreaMaterialLine = {
  id: string;
  label: string;
  quantityLabel: string;
  quantity: number;
  unit: string;
  rate: number | null;
  cost: number | null;
};

export function estimateCostAreaMaterialLines(
  areaSqft: number,
  quality: ConstructionCostQuality,
): ConstructionCostAreaMaterialLine[] {
  const m = estimateCostAreaMaterials(areaSqft, quality);
  const q = QUALITY_QTY_FACTOR[quality] ?? 1;
  const tiles = Math.round(areaSqft * COST_AREA_QTY_PER_SQFT.tilesSqft * q);
  const paint = Math.round(areaSqft * COST_AREA_QTY_PER_SQFT.paintLitres * q);
  const line = (
    id: string,
    label: string,
    quantity: number,
    unit: string,
    rate: number | null,
  ): ConstructionCostAreaMaterialLine => ({
    id,
    label,
    quantity,
    unit,
    quantityLabel: `${quantity.toLocaleString('en-IN')} ${unit}`,
    rate,
    cost: rate == null ? null : Math.round(quantity * rate),
  });
  return [
    line('cement', 'Cement', m.cementBags, 'bags', COST_AREA_INDICATIVE_RATES.cementPerBag),
    line('steel', 'Steel', m.steelKg, 'kg', COST_AREA_INDICATIVE_RATES.steelPerKg),
    line('sand', 'Sand', m.sandTonnes, 'tonnes', COST_AREA_INDICATIVE_RATES.sandPerTonne),
    line(
      'aggregate',
      'Aggregate',
      m.aggregateTonnes,
      'tonnes',
      COST_AREA_INDICATIVE_RATES.aggregatePerTonne,
    ),
    line('bricks', 'Bricks / blocks', m.bricks, 'pieces', COST_AREA_INDICATIVE_RATES.brickEach),
    line('tiles', 'Tiles', tiles, 'sq ft', COST_AREA_INDICATIVE_RATES.tilePerSqft),
    line('paint', 'Paint', paint, 'litres', COST_AREA_INDICATIVE_RATES.paintPerLitre),
    {
      id: 'electrical',
      label: 'Electrical',
      quantity: 1,
      unit: 'lot',
      quantityLabel: '1 lot',
      rate: null,
      cost: null,
    },
    {
      id: 'plumbing',
      label: 'Plumbing',
      quantity: 1,
      unit: 'lot',
      quantityLabel: '1 lot',
      rate: null,
      cost: null,
    },
  ];
}

export type ConstructionCostAreaQualityRow = {
  quality: ConstructionCostQuality;
  label: string;
  costPerSqft: number;
  estimatedTotal: number;
  rangeLow: number;
  rangeHigh: number;
};

export type ConstructionCostAreaBreakdownRow = {
  id: string;
  label: string;
  amount: number;
  percentOfTotal: number;
};

export type ConstructionCostAreaEstimate = {
  areaSqft: number;
  floors: number;
  quality: ConstructionCostQuality;
  locationLabel: string;
  locationKey: string;
  estimatedTotal: number;
  rangeLow: number;
  rangeHigh: number;
  costPerSqft: number;
  rangeLabel: string;
  materialCost: number;
  labourCost: number;
  miscellaneousCost: number;
  materials: ConstructionCostAreaMaterials;
  materialLines: ConstructionCostAreaMaterialLine[];
  breakdown: ConstructionCostAreaBreakdownRow[];
  qualityRows: ConstructionCostAreaQualityRow[];
  assumptions: string[];
  disclaimer: string;
};

function breakdownFromResult(result: ConstructionCostResult): ConstructionCostAreaBreakdownRow[] {
  const byId = new Map(
    [...result.phaseBreakdown, ...result.categoryBreakdown].map((row) => [row.id, row]),
  );
  return BREAKDOWN_IDS.map(({ id, label }) => {
    const row = byId.get(id);
    return {
      id,
      label,
      amount: row?.amount ?? 0,
      percentOfTotal: row?.percentOfTotal ?? 0,
    };
  });
}

const QUALITY_LABEL: Record<ConstructionCostQuality, string> = {
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium',
  luxury: 'Luxury',
};

export function computeConstructionCostAreaEstimate(input: {
  areaSqft: number;
  floors?: number;
  quality?: ConstructionCostQuality;
  location?: string;
}): ConstructionCostAreaEstimate {
  const quality = input.quality ?? COST_AREA_DEFAULT_QUALITY;
  const location = input.location?.trim() || COST_AREA_DEFAULT_LOCATION;
  const floors = input.floors ?? 2;
  const result = calculateConstructionCost(
    costInput({ areaSqft: input.areaSqft, floors, quality, location }),
  );
  const qualities: ConstructionCostQuality[] = ['basic', 'standard', 'premium', 'luxury'];
  const qualityRows = qualities.map((q) => {
    const r = calculateConstructionCost(
      costInput({ areaSqft: input.areaSqft, floors, quality: q, location }),
    );
    return {
      quality: q,
      label: QUALITY_LABEL[q],
      costPerSqft: r.costPerSqft,
      estimatedTotal: r.estimatedTotal,
      rangeLow: r.rangeLow,
      rangeHigh: r.rangeHigh,
    };
  });

  return {
    areaSqft: result.areaSqft,
    floors: result.floors,
    quality: result.quality,
    locationLabel: result.locationLabel,
    locationKey: result.locationKey,
    estimatedTotal: result.estimatedTotal,
    rangeLow: result.rangeLow,
    rangeHigh: result.rangeHigh,
    costPerSqft: result.costPerSqft,
    rangeLabel: formatLakhRange(result.rangeLow, result.rangeHigh),
    materialCost: result.materialCost,
    labourCost: result.labourCost,
    miscellaneousCost: result.miscellaneousCost,
    materials: estimateCostAreaMaterials(result.areaSqft, quality),
    materialLines: estimateCostAreaMaterialLines(result.areaSqft, quality),
    breakdown: breakdownFromResult(result),
    qualityRows,
    assumptions: result.assumptions,
    disclaimer: result.disclaimer,
  };
}

export type ConstructionCostAreaFaq = { question: string; answer: string };

export type ConstructionCostAreaLanding = {
  slug: ConstructionCostAreaSlug;
  areaSqft: number;
  label: string;
  h1: string;
  title: string;
  description: string;
  canonicalPath: string;
  sizeNote: string;
  editorialIntro: string;
  qualification: string;
  methodology: string;
  version: string;
  costEngineVersion: string;
  estimate: ConstructionCostAreaEstimate;
  faqs: ConstructionCostAreaFaq[];
  relatedTools: Array<{ href: string; label: string }>;
  siblingHrefs: Array<{ href: string; label: string }>;
  indexable: true;
};

export function buildConstructionCostAreaLanding(
  slug: string,
  overrides?: { location?: string; floors?: number; quality?: ConstructionCostQuality },
): ConstructionCostAreaLanding | null {
  if (!isConstructionCostAreaSlug(slug)) return null;
  const profile = CONSTRUCTION_COST_AREA_PROFILES[slug];
  if (profile.sizeNote.trim().length < 80) return null;

  const floors = overrides?.floors ?? profile.defaultFloors;
  const estimate = computeConstructionCostAreaEstimate({
    areaSqft: profile.areaSqft,
    floors,
    quality: overrides?.quality ?? COST_AREA_DEFAULT_QUALITY,
    location: overrides?.location ?? COST_AREA_DEFAULT_LOCATION,
  });

  const area = profile.label;
  const calculatorHref = constructionCostCalculatorHref({
    builtUpArea: profile.areaSqft,
    areaUnit: 'sqft',
    floors,
    quality: 'standard',
    location: estimate.locationLabel,
  });

  return {
    slug,
    areaSqft: profile.areaSqft,
    label: profile.label,
    h1: `${area} House Construction Cost in India`,
    title: `${area} House Construction Cost in India — Estimate | Varnarc`,
    description: `Indicative construction cost for a ${area} independent house: ${estimate.rangeLabel} (${estimate.locationLabel}, ${floors} floor${floors > 1 ? 's' : ''}, standard quality). Materials, phase breakdown and calculator. Not a quote.`,
    canonicalPath: constructionCostAreaPath(slug),
    sizeNote: profile.sizeNote,
    editorialIntro: `People searching “${profile.areaSqft} sq ft house construction cost” need a rupee range and a materials sketch, not an empty calculator. This page runs the same Varnarc cost engine as the interactive tool, with ${area} built-up prefilled and defaults documented below.`,
    qualification: CONSTRUCTION_COST_AREA_QUALIFICATION,
    methodology: CONSTRUCTION_COST_AREA_METHODOLOGY,
    version: CONSTRUCTION_COST_AREA_VERSION,
    costEngineVersion: COST_CALC_VERSION,
    estimate,
    faqs: [
      {
        question: `What is the construction cost of a ${area} house in India?`,
        answer: `On Varnarc’s indicative model (${estimate.locationLabel}, ${floors} floor${floors > 1 ? 's' : ''}, standard quality), the planning range is ${estimate.rangeLabel} (about ${formatInr(estimate.costPerSqft)} per sq ft). Basic to luxury rows on this page show how finish level moves the total.`,
      },
      {
        question: 'Does this include interiors, compound wall and GST?',
        answer:
          'Defaults are shell-to-standard construction with 10% contingency. Basement, lift, compound, modular kitchen and GST/approvals are not fully included — add them in the full cost calculator.',
      },
      {
        question: 'How are cement and steel estimated?',
        answer: `Planning quantities use ${COST_AREA_QTY_PER_SQFT.cementBags} cement bags and ${COST_AREA_QTY_PER_SQFT.steelKg} kg steel per sq ft at standard quality, scaled for other qualities. Drawings and mix design will differ.`,
      },
    ],
    relatedTools: [
      { href: calculatorHref, label: 'Full cost calculator' },
      {
        href: `/construction/cement-calculator?area=${profile.areaSqft}`,
        label: 'Cement calculator',
      },
      {
        href: `/construction/steel-calculator?area=${profile.areaSqft}`,
        label: 'Steel calculator',
      },
      {
        href: `/construction/brick-calculator?area=${profile.areaSqft}`,
        label: 'Brick calculator',
      },
      {
        href: `/construction/boq-generator?builtUpArea=${profile.areaSqft}`,
        label: 'BOQ generator',
      },
    ],
    siblingHrefs: listConstructionCostAreaSlugs()
      .filter((s) => s !== slug)
      .map((s) => ({
        href: constructionCostAreaPath(s),
        label: CONSTRUCTION_COST_AREA_PROFILES[s].label,
      })),
    indexable: true,
  };
}

export function listIndexableConstructionCostAreaLandings(): Array<{
  slug: ConstructionCostAreaSlug;
  areaSqft: number;
  path: string;
  label: string;
}> {
  return listConstructionCostAreaSlugs()
    .map((slug) => {
      const landing = buildConstructionCostAreaLanding(slug);
      if (!landing) return null;
      return {
        slug,
        areaSqft: landing.areaSqft,
        path: landing.canonicalPath,
        label: landing.label,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null);
}
