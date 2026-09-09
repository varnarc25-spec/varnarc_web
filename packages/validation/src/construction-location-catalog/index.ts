/** Central ConstructionLocation / ConstructionRate / MaterialPrice catalog.
 * Calculators and city pages must consume this — never invent live dealer prices.
 */

import {
  publicRateLabel,
  type RateLocationLevel,
  type RateSourceType,
  type ResolvableRate,
  type ResolvedRate,
  resolveRate,
} from '../construction-rate-resolution';

export const CONSTRUCTION_RATE_CATALOG_VERSION = '2026.09.1';

/** Editorial stamp for planning baselines — not a live market timestamp. */
export const RATE_CATALOG_EFFECTIVE_FROM = '2026-08-01';
export const RATE_CATALOG_LAST_VERIFIED_AT = '2026-08-01';

export const LOCAL_VERIFICATION_WARNING =
  'Verify locally with suppliers or contractors before budgeting. These are not live market prices.';

export const CITY_RATE_UNAVAILABLE_NOTE =
  'City rate unavailable; using national indicative rate. Verify locally.';

export const NATIONAL_BASE_RATE_PER_SQFT = 1800;

/** Normalized location entity (maps to Prisma ConstructionLocation via slug). */
export type ConstructionLocation = {
  id: string;
  city: string;
  state: string;
  country: string;
  slug: string;
  active: boolean;
  /** Planning factor vs national ₹/sq ft baseline (ConstructionRate). */
  rateMultiplier: number;
  aliases?: readonly string[];
  inPriceHub?: boolean;
};

/** Location-level construction rate (₹/sq ft factor), always indicative in this catalog. */
export type ConstructionRate = {
  id: string;
  locationId: string;
  multiplier: number;
  unit: 'factor';
  sourceType: RateSourceType;
  effectiveFrom: string;
  lastVerifiedAt: string | null;
  isIndicative: boolean;
};

/** Material price observation / planning baseline (maps to Prisma ConstructionMaterialPrice). */
export type MaterialPrice = {
  id: string;
  materialId: string;
  locationId: string | null;
  brand?: string;
  grade?: string;
  unit: string;
  minPrice?: number;
  typicalPrice: number;
  maxPrice?: number;
  sourceUrl?: string;
  sourceType: RateSourceType;
  effectiveFrom?: string;
  lastVerifiedAt: string | null;
  isIndicative: boolean;
};

export type ConstructionRateDisplay = {
  publicLabel: string;
  typicalPrice: number | null;
  unit: string | null;
  sourceType: RateSourceType;
  sourceName: string | null;
  sourceUrl: string | null;
  lastVerifiedAt: string | null;
  locationLevel: RateLocationLevel;
  locationLabel: string;
  usedFallback: boolean;
  fallbackNote: string | null;
  isIndicative: boolean;
  localVerificationWarning: string;
};

export const PRICE_HUB_CITY_DEFS = [
  { slug: 'hyderabad', name: 'Hyderabad' },
  { slug: 'bengaluru', name: 'Bengaluru' },
  { slug: 'chennai', name: 'Chennai' },
  { slug: 'mumbai', name: 'Mumbai' },
  { slug: 'pune', name: 'Pune' },
  { slug: 'delhi', name: 'Delhi NCR' },
  { slug: 'ahmedabad', name: 'Ahmedabad' },
  { slug: 'kolkata', name: 'Kolkata' },
] as const;

type PriceHubCitySlug = (typeof PRICE_HUB_CITY_DEFS)[number]['slug'];

const HUB_STATES: Record<PriceHubCitySlug, string> = {
  hyderabad: 'Telangana',
  bengaluru: 'Karnataka',
  chennai: 'Tamil Nadu',
  mumbai: 'Maharashtra',
  pune: 'Maharashtra',
  delhi: 'Delhi',
  ahmedabad: 'Gujarat',
  kolkata: 'West Bengal',
};

const HUB_MULTIPLIERS: Record<PriceHubCitySlug, number> = {
  hyderabad: 1.0,
  bengaluru: 1.12,
  chennai: 1.05,
  mumbai: 1.28,
  pune: 1.1,
  delhi: 1.18,
  ahmedabad: 0.98,
  kolkata: 0.95,
};

function hubLocation(slug: PriceHubCitySlug): ConstructionLocation {
  const def = PRICE_HUB_CITY_DEFS.find((c) => c.slug === slug)!;
  return {
    id: `loc-${slug}`,
    city: def.name,
    state: HUB_STATES[slug],
    country: 'India',
    slug,
    active: true,
    rateMultiplier: HUB_MULTIPLIERS[slug],
    inPriceHub: true,
    aliases: slug === 'bengaluru' ? ['bangalore'] : slug === 'delhi' ? ['delhincr'] : undefined,
  };
}

export const CONSTRUCTION_LOCATIONS: ConstructionLocation[] = [
  hubLocation('hyderabad'),
  hubLocation('bengaluru'),
  hubLocation('chennai'),
  hubLocation('mumbai'),
  hubLocation('pune'),
  hubLocation('delhi'),
  hubLocation('ahmedabad'),
  hubLocation('kolkata'),
  {
    id: 'loc-noida',
    city: 'Noida',
    state: 'Uttar Pradesh',
    country: 'India',
    slug: 'noida',
    active: true,
    rateMultiplier: 1.15,
  },
  {
    id: 'loc-gurugram',
    city: 'Gurugram',
    state: 'Haryana',
    country: 'India',
    slug: 'gurugram',
    active: true,
    rateMultiplier: 1.2,
    aliases: ['gurgaon'],
  },
  {
    id: 'loc-jaipur',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    slug: 'jaipur',
    active: true,
    rateMultiplier: 0.92,
  },
  {
    id: 'loc-coimbatore',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    country: 'India',
    slug: 'coimbatore',
    active: true,
    rateMultiplier: 0.9,
  },
  {
    id: 'loc-indore',
    city: 'Indore',
    state: 'Madhya Pradesh',
    country: 'India',
    slug: 'indore',
    active: true,
    rateMultiplier: 0.9,
  },
  {
    id: 'loc-lucknow',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    country: 'India',
    slug: 'lucknow',
    active: true,
    rateMultiplier: 0.9,
  },
  {
    id: 'loc-india',
    city: 'India average',
    state: '',
    country: 'India',
    slug: 'india',
    active: true,
    rateMultiplier: 1.0,
    aliases: ['default', 'indiaaverage', 'otherindiaaverage'],
  },
];

export const NATIONAL_LOCATION: ConstructionLocation = CONSTRUCTION_LOCATIONS.find(
  (l) => l.slug === 'india',
)!;

/** Shared default city for calculators and size landings (not per-tool hardcodes). */
export const DEFAULT_CONSTRUCTION_LOCATION: ConstructionLocation = CONSTRUCTION_LOCATIONS.find(
  (l) => l.slug === 'hyderabad',
)!;

export const DEFAULT_CONSTRUCTION_LOCATION_NAME = DEFAULT_CONSTRUCTION_LOCATION.city;

export type CatalogMaterialId =
  | 'cement'
  | 'steel'
  | 'sand'
  | 'aggregate'
  | 'brick'
  | 'aac'
  | 'tiles'
  | 'paint'
  | 'electrical'
  | 'plumbing'
  | 'labour_index';

/** National MaterialPrice rows — ESTIMATED_FALLBACK only. No city-specific invented bag/kg prices. */
export const NATIONAL_MATERIAL_PRICES: MaterialPrice[] = [
  {
    id: 'mp-national-cement',
    materialId: 'cement',
    locationId: NATIONAL_LOCATION.id,
    unit: '50kg bag',
    typicalPrice: 380,
    sourceType: 'ESTIMATED_FALLBACK',
    effectiveFrom: RATE_CATALOG_EFFECTIVE_FROM,
    lastVerifiedAt: RATE_CATALOG_LAST_VERIFIED_AT,
    isIndicative: true,
  },
  {
    id: 'mp-national-steel',
    materialId: 'steel',
    locationId: NATIONAL_LOCATION.id,
    unit: 'kg',
    typicalPrice: 55,
    sourceType: 'ESTIMATED_FALLBACK',
    effectiveFrom: RATE_CATALOG_EFFECTIVE_FROM,
    lastVerifiedAt: RATE_CATALOG_LAST_VERIFIED_AT,
    isIndicative: true,
  },
  {
    id: 'mp-national-sand',
    materialId: 'sand',
    locationId: NATIONAL_LOCATION.id,
    unit: 'tonne',
    typicalPrice: 2200,
    sourceType: 'ESTIMATED_FALLBACK',
    effectiveFrom: RATE_CATALOG_EFFECTIVE_FROM,
    lastVerifiedAt: RATE_CATALOG_LAST_VERIFIED_AT,
    isIndicative: true,
  },
  {
    id: 'mp-national-aggregate',
    materialId: 'aggregate',
    locationId: NATIONAL_LOCATION.id,
    unit: 'tonne',
    typicalPrice: 1800,
    sourceType: 'ESTIMATED_FALLBACK',
    effectiveFrom: RATE_CATALOG_EFFECTIVE_FROM,
    lastVerifiedAt: RATE_CATALOG_LAST_VERIFIED_AT,
    isIndicative: true,
  },
  {
    id: 'mp-national-brick',
    materialId: 'brick',
    locationId: NATIONAL_LOCATION.id,
    unit: 'piece',
    typicalPrice: 8,
    sourceType: 'ESTIMATED_FALLBACK',
    effectiveFrom: RATE_CATALOG_EFFECTIVE_FROM,
    lastVerifiedAt: RATE_CATALOG_LAST_VERIFIED_AT,
    isIndicative: true,
  },
  {
    id: 'mp-national-aac',
    materialId: 'aac',
    locationId: NATIONAL_LOCATION.id,
    unit: 'piece',
    typicalPrice: 42,
    sourceType: 'ESTIMATED_FALLBACK',
    effectiveFrom: RATE_CATALOG_EFFECTIVE_FROM,
    lastVerifiedAt: RATE_CATALOG_LAST_VERIFIED_AT,
    isIndicative: true,
  },
  {
    id: 'mp-national-tiles',
    materialId: 'tiles',
    locationId: NATIONAL_LOCATION.id,
    unit: 'sq ft',
    typicalPrice: 55,
    sourceType: 'ESTIMATED_FALLBACK',
    effectiveFrom: RATE_CATALOG_EFFECTIVE_FROM,
    lastVerifiedAt: RATE_CATALOG_LAST_VERIFIED_AT,
    isIndicative: true,
  },
  {
    id: 'mp-national-paint',
    materialId: 'paint',
    locationId: NATIONAL_LOCATION.id,
    unit: 'litre',
    typicalPrice: 280,
    sourceType: 'ESTIMATED_FALLBACK',
    effectiveFrom: RATE_CATALOG_EFFECTIVE_FROM,
    lastVerifiedAt: RATE_CATALOG_LAST_VERIFIED_AT,
    isIndicative: true,
  },
  {
    id: 'mp-national-electrical',
    materialId: 'electrical',
    locationId: NATIONAL_LOCATION.id,
    unit: 'sq ft',
    typicalPrice: 185,
    sourceType: 'ESTIMATED_FALLBACK',
    effectiveFrom: RATE_CATALOG_EFFECTIVE_FROM,
    lastVerifiedAt: RATE_CATALOG_LAST_VERIFIED_AT,
    isIndicative: true,
  },
  {
    id: 'mp-national-plumbing',
    materialId: 'plumbing',
    locationId: NATIONAL_LOCATION.id,
    unit: 'sq ft',
    typicalPrice: 145,
    sourceType: 'ESTIMATED_FALLBACK',
    effectiveFrom: RATE_CATALOG_EFFECTIVE_FROM,
    lastVerifiedAt: RATE_CATALOG_LAST_VERIFIED_AT,
    isIndicative: true,
  },
  {
    id: 'mp-national-labour-index',
    materialId: 'labour_index',
    locationId: NATIONAL_LOCATION.id,
    unit: 'index',
    typicalPrice: 100,
    sourceType: 'ESTIMATED_FALLBACK',
    effectiveFrom: RATE_CATALOG_EFFECTIVE_FROM,
    lastVerifiedAt: RATE_CATALOG_LAST_VERIFIED_AT,
    isIndicative: true,
  },
];

export function typicalNationalPrice(materialId: CatalogMaterialId): number {
  const row = NATIONAL_MATERIAL_PRICES.find((p) => p.materialId === materialId);
  if (!row) throw new Error(`Unknown catalog material: ${materialId}`);
  return row.typicalPrice;
}

/** Cost-engine commodity defaults — same source as NATIONAL_MATERIAL_PRICES. */
export const DEFAULT_MARKET_RATES = {
  steelRatePerKg: typicalNationalPrice('steel'),
  cementRatePerBag: typicalNationalPrice('cement'),
  labourRateIndex: typicalNationalPrice('labour_index'),
} as const;

export function listActiveConstructionLocations(): ConstructionLocation[] {
  return CONSTRUCTION_LOCATIONS.filter((l) => l.active);
}

export function listPriceHubLocations(): Array<{ slug: string; name: string }> {
  return PRICE_HUB_CITY_DEFS.map((c) => ({ slug: c.slug, name: c.name }));
}

export function listCalculatorLocationLabels(): string[] {
  return [
    ...PRICE_HUB_CITY_DEFS.map((c) => c.name),
    ...CONSTRUCTION_LOCATIONS.filter((l) => l.active && !l.inPriceHub && l.slug !== 'india').map(
      (l) => l.city,
    ),
  ];
}

export function listQuickEstimatorLocations(): string[] {
  return [...PRICE_HUB_CITY_DEFS.map((c) => c.name), 'Other / India average'];
}

export function constructionRateForLocation(location: ConstructionLocation): ConstructionRate {
  return {
    id: `crate-${location.slug}`,
    locationId: location.id,
    multiplier: location.rateMultiplier,
    unit: 'factor',
    sourceType: 'ESTIMATED_FALLBACK',
    effectiveFrom: RATE_CATALOG_EFFECTIVE_FROM,
    lastVerifiedAt: RATE_CATALOG_LAST_VERIFIED_AT,
    isIndicative: true,
  };
}

export const LOCATION_MULTIPLIERS: Record<string, { label: string; multiplier: number }> = (() => {
  const out: Record<string, { label: string; multiplier: number }> = {
    default: { label: NATIONAL_LOCATION.city, multiplier: NATIONAL_LOCATION.rateMultiplier },
  };
  for (const loc of CONSTRUCTION_LOCATIONS) {
    if (!loc.active) continue;
    out[loc.slug] = { label: loc.city, multiplier: loc.rateMultiplier };
    for (const alias of loc.aliases ?? []) {
      out[alias] = { label: loc.city, multiplier: loc.rateMultiplier };
    }
  }
  return out;
})();

export function normalizeLocationKey(location: string): string {
  const key = location
    .trim()
    .toLowerCase()
    .replace(/\s+ncr$/, '')
    .replace(/[^a-z]/g, '');
  if (!key) return 'default';
  if (LOCATION_MULTIPLIERS[key]) return key;
  for (const k of Object.keys(LOCATION_MULTIPLIERS)) {
    if (k !== 'default' && (key.includes(k) || k.includes(key))) return k;
  }
  return 'default';
}

export function resolveConstructionLocation(query: string): {
  location: ConstructionLocation;
  matched: boolean;
} {
  const key = normalizeLocationKey(query);
  if (key === 'default') {
    return { location: NATIONAL_LOCATION, matched: false };
  }
  const location =
    CONSTRUCTION_LOCATIONS.find(
      (l) =>
        l.slug === key ||
        l.aliases?.includes(key) ||
        l.city.toLowerCase() === query.trim().toLowerCase(),
    ) ?? NATIONAL_LOCATION;
  return { location, matched: location.slug !== 'india' };
}

export function resolveConstructionLocationRate(query: string): {
  location: ConstructionLocation;
  rate: ConstructionRate;
  matched: boolean;
  usedFallback: boolean;
} {
  const resolved = resolveConstructionLocation(query);
  return {
    location: resolved.location,
    rate: constructionRateForLocation(resolved.location),
    matched: resolved.matched,
    usedFallback: !resolved.matched,
  };
}

export function matchCatalogMaterialId(slugOrKey: string): CatalogMaterialId | null {
  const s = slugOrKey.trim().toLowerCase();
  const keys: CatalogMaterialId[] = [
    'cement',
    'steel',
    'sand',
    'aggregate',
    'brick',
    'aac',
    'tiles',
    'paint',
    'electrical',
    'plumbing',
    'labour_index',
  ];
  if (s === 'tile' || s.includes('tile')) return 'tiles';
  if (s.includes('aac')) return 'aac';
  if (s.includes('brick')) return 'brick';
  if (s.includes('labour') || s.includes('labor')) return 'labour_index';
  return keys.find((k) => s === k || s.includes(k)) ?? null;
}

export function catalogNationalPriceAsResolvable(materialId: string): ResolvableRate | null {
  const id = matchCatalogMaterialId(materialId);
  if (!id) return null;
  const row = NATIONAL_MATERIAL_PRICES.find((p) => p.materialId === id);
  if (!row) return null;
  return {
    id: row.id,
    locationId: null,
    locationType: 'NATIONAL',
    minRate: row.minPrice ?? row.typicalPrice,
    averageRate: row.typicalPrice,
    maxRate: row.maxPrice ?? row.typicalPrice,
    unit: row.unit,
    sourceType: row.sourceType,
    confidence: 'LOW',
    isDerived: true,
    derivationMethod: 'national-planning-baseline',
    lastVerifiedAt: row.lastVerifiedAt,
    effectiveFrom: row.effectiveFrom ?? RATE_CATALOG_EFFECTIVE_FROM,
    sourceName: 'Varnarc national planning catalog',
  };
}

export function toRateDisplay(input: {
  resolved: Pick<
    ResolvedRate,
    | 'rate'
    | 'unit'
    | 'sourceType'
    | 'sourceName'
    | 'lastVerifiedAt'
    | 'locationLevel'
    | 'isDerived'
    | 'publicLabel'
  >;
  locationLabel: string;
  requestedCity: boolean;
  sourceUrl?: string | null;
}): ConstructionRateDisplay {
  const usedFallback =
    input.requestedCity &&
    (input.resolved.locationLevel === 'NATIONAL' ||
      input.resolved.locationLevel === 'FALLBACK' ||
      input.resolved.locationLevel === 'REGION' ||
      input.resolved.locationLevel === 'STATE');
  const fallbackNote = usedFallback
    ? input.resolved.locationLevel === 'STATE' || input.resolved.locationLevel === 'REGION'
      ? `City rate unavailable; using ${input.resolved.locationLevel.toLowerCase()} indicative rate. Verify locally.`
      : CITY_RATE_UNAVAILABLE_NOTE
    : null;
  return {
    publicLabel: input.resolved.publicLabel,
    typicalPrice: input.resolved.rate,
    unit: input.resolved.unit,
    sourceType: input.resolved.sourceType,
    sourceName: input.resolved.sourceName,
    sourceUrl: input.sourceUrl ?? null,
    lastVerifiedAt: input.resolved.lastVerifiedAt,
    locationLevel: input.resolved.locationLevel,
    locationLabel: input.locationLabel,
    usedFallback,
    fallbackNote,
    isIndicative:
      input.resolved.isDerived ||
      input.resolved.sourceType === 'ESTIMATED_FALLBACK' ||
      input.resolved.sourceType === 'DERIVED',
    localVerificationWarning: LOCAL_VERIFICATION_WARNING,
  };
}

export function resolveMaterialPrice(input: {
  materialId: string;
  locationQuery?: string;
  ingested?: ResolvableRate[];
  ancestry?: Array<{ id: string; type: RateLocationLevel }>;
}): {
  price: MaterialPrice;
  display: ConstructionRateDisplay;
  resolved: ResolvedRate | null;
} {
  const catalog = catalogNationalPriceAsResolvable(input.materialId);
  const locQuery = input.locationQuery?.trim() || NATIONAL_LOCATION.city;
  const loc = resolveConstructionLocation(locQuery);
  const candidates = [...(input.ingested ?? []), ...(catalog ? [catalog] : [])];
  const ancestry =
    input.ancestry ??
    (loc.matched
      ? [
          { id: loc.location.id, type: 'CITY' as const },
          { id: NATIONAL_LOCATION.id, type: 'NATIONAL' as const },
        ]
      : [{ id: NATIONAL_LOCATION.id, type: 'NATIONAL' as const }]);
  const resolved = candidates.length ? resolveRate({ candidates, ancestry }) : null;
  const nationalRow =
    NATIONAL_MATERIAL_PRICES.find(
      (p) => p.materialId === (matchCatalogMaterialId(input.materialId) ?? ''),
    ) ?? NATIONAL_MATERIAL_PRICES[0]!;
  const price: MaterialPrice = resolved
    ? {
        ...nationalRow,
        typicalPrice: resolved.rate,
        minPrice: resolved.minRate,
        maxPrice: resolved.maxRate,
        unit: resolved.unit,
        sourceType: resolved.sourceType,
        lastVerifiedAt: resolved.lastVerifiedAt,
        isIndicative:
          resolved.isDerived ||
          resolved.sourceType === 'ESTIMATED_FALLBACK' ||
          resolved.sourceType === 'DERIVED',
        locationId:
          resolved.locationLevel === 'NATIONAL' || resolved.locationLevel === 'FALLBACK'
            ? NATIONAL_LOCATION.id
            : loc.location.id,
      }
    : nationalRow;
  const display = resolved
    ? toRateDisplay({
        resolved,
        locationLabel: loc.matched ? loc.location.city : NATIONAL_LOCATION.city,
        requestedCity: Boolean(input.locationQuery?.trim()) && !/india/i.test(locQuery),
      })
    : {
        publicLabel: 'Indicative planning rate',
        typicalPrice: nationalRow.typicalPrice,
        unit: nationalRow.unit,
        sourceType: nationalRow.sourceType,
        sourceName: 'Varnarc national planning catalog',
        sourceUrl: null,
        lastVerifiedAt: nationalRow.lastVerifiedAt,
        locationLevel: 'NATIONAL' as const,
        locationLabel: NATIONAL_LOCATION.city,
        usedFallback: true,
        fallbackNote: CITY_RATE_UNAVAILABLE_NOTE,
        isIndicative: true,
        localVerificationWarning: LOCAL_VERIFICATION_WARNING,
      };
  return { price, display, resolved };
}

export function resolveConstructionCostRateDisplay(locationQuery: string): ConstructionRateDisplay {
  const { location, rate, usedFallback } = resolveConstructionLocationRate(locationQuery);
  const requestedUnknownCity =
    Boolean(locationQuery.trim()) && usedFallback && !/india|average|other/i.test(locationQuery);
  return {
    publicLabel: publicRateLabel({ sourceType: rate.sourceType, isDerived: true }),
    typicalPrice: Math.round(NATIONAL_BASE_RATE_PER_SQFT * rate.multiplier),
    unit: 'sq ft',
    sourceType: rate.sourceType,
    sourceName: usedFallback
      ? 'Varnarc national planning catalog'
      : `Varnarc location factor · ${location.city}`,
    sourceUrl: null,
    lastVerifiedAt: rate.lastVerifiedAt,
    locationLevel: usedFallback ? 'NATIONAL' : 'CITY',
    locationLabel: location.city,
    usedFallback: requestedUnknownCity,
    fallbackNote: requestedUnknownCity ? CITY_RATE_UNAVAILABLE_NOTE : null,
    isIndicative: true,
    localVerificationWarning: LOCAL_VERIFICATION_WARNING,
  };
}

export function listHubIndicativePriceCards(): Array<{
  id: string;
  name: string;
  href: string;
  priceLabel: string;
  meta: string;
}> {
  const hrefs: Record<string, string> = {
    cement: '/construction/cement-calculator',
    steel: '/construction/steel-calculator',
    sand: '/construction/sand-calculator',
    aggregate: '/construction/aggregate-calculator',
    brick: '/construction/brick-calculator',
    tiles: '/construction/tile-calculator',
    paint: '/construction/paint-calculator',
  };
  const labels: Record<string, string> = {
    cement: 'Cement',
    steel: 'Steel (TMT)',
    sand: 'Sand',
    aggregate: 'Aggregate',
    brick: 'Bricks / blocks',
    tiles: 'Tiles',
    paint: 'Paint',
  };
  return NATIONAL_MATERIAL_PRICES.filter((p) => hrefs[p.materialId]).map((p) => ({
    id: p.id,
    name: labels[p.materialId] ?? p.materialId,
    href: hrefs[p.materialId]!,
    priceLabel: `₹${p.typicalPrice.toLocaleString('en-IN')} / ${p.unit}`,
    meta: `${publicRateLabel({ sourceType: p.sourceType, isDerived: true })} · national`,
  }));
}

export function assertNotLiveLabel(label: string): boolean {
  return !/\blive\b/i.test(label);
}
