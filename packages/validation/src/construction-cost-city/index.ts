/** Location-specific Construction Cost landings — data-gated, anti-thin-SEO. */

import { calculateConstructionCost } from '../construction-cost/calculate';
import {
  COST_CALC_VERSION,
  DEFAULT_COST_SPLIT,
  DEFAULT_MARKET_RATES,
  LOCATION_MULTIPLIERS,
  NATIONAL_BASE_RATE_PER_SQFT,
  normalizeLocationKey,
} from '../construction-cost/rates';
import {
  PRICE_HUB_CITIES,
  PRICE_HUB_MATERIALS,
  computePricePeriodChanges,
  isReliableCurrentPrice,
  resolveDisplayFreshness,
  type PriceFreshness,
  type PriceHubCitySlug,
  type PriceHubMaterialKey,
  type PricePeriodChange,
} from '../prices-hub';

export const CONSTRUCTION_COST_CITY_VERSION = '2026.08.1';

export const CONSTRUCTION_COST_CITY_QUALIFICATION =
  'Indicative planning figures for education only — not a quotation, tender or guarantee. Local labour, material grades, design and market conditions change final prices.';

export const CONSTRUCTION_COST_CITY_METHODOLOGY =
  'City pages start from Varnarc’s national indicative base rate per sq ft, apply the published location multiplier and quality scenarios, and surface local material observation freshness where available. Pages are only indexable when editorial city profile content exists and enough reliable local material price observations are present — we do not publish thin template-only city URLs.';

/** Minimum distinct materials with a reliable current observation. */
export const COST_CITY_MIN_MATERIALS_WITH_CURRENT = 3;
/** Minimum total observations (any age) across hub materials for the city. */
export const COST_CITY_MIN_TOTAL_OBSERVATIONS = 6;
/** Reference built-up used for published indicative scenarios (sq ft). */
export const COST_CITY_REFERENCE_AREA_SQFT = 1500;
export const COST_CITY_REFERENCE_FLOORS = 2;

export type ConstructionCostCitySlug = PriceHubCitySlug;

export type ConstructionCostCityProfile = {
  slug: ConstructionCostCitySlug;
  name: string;
  /** Unique intro — must be city-specific (anti-thin). */
  editorialIntro: string;
  labourAssumptions: string;
  marketNotes: string;
  /** Editorial stamp for local rate commentary (ISO date). */
  editorialRateUpdatedAt: string;
  faqExtras: Array<{ question: string; answer: string }>;
};

/**
 * Genuinely location-specific editorial profiles.
 * A city without a profile cannot be indexed — prevents programmatic thin pages.
 */
export const CONSTRUCTION_COST_CITY_PROFILES: Record<string, ConstructionCostCityProfile> = {
  hyderabad: {
    slug: 'hyderabad',
    name: 'Hyderabad',
    editorialIntro:
      'Hyderabad house construction costs sit close to Varnarc’s national baseline, with competitive RMC and brick supply across the ORR corridor and stronger finishing premiums in western and northern suburbs. Budget planning should separate shell rates from interior fit-outs, which move faster with imported tiles and modular kitchens.',
    labourAssumptions:
      'Labour is modelled near the national labour index (100). Skilled finishing trades in Gachibowli–Madhapur corridors often run above city average; semi-skilled masonry on peripheral plots can sit closer to baseline.',
    marketNotes:
      'Cement and sand availability is generally steady; steel tracks national TMT bands with logistics adders from Vizag/Chennai routes. Outer-ring sites may add transport and water charges not captured in shell ₹/sq ft.',
    editorialRateUpdatedAt: '2026-08-01',
    faqExtras: [
      {
        question: 'Is Hyderabad cheaper than Bengaluru for house construction?',
        answer:
          'On Varnarc’s indicative multipliers, Hyderabad sits near 1.0× national baseline while Bengaluru is higher (~1.12×). Actual quotes still depend on plot access, soil, and finish level — compare local BOQs, not multipliers alone.',
      },
    ],
  },
  bengaluru: {
    slug: 'bengaluru',
    name: 'Bengaluru',
    editorialIntro:
      'Bengaluru construction costs typically run above the national indicative baseline, reflecting higher skilled labour demand, tighter plot logistics in core areas, and elevated finishing expectations in tech corridors. Peripheral taluks can undercut city-centre shell rates but often face longer material lead times in monsoon months.',
    labourAssumptions:
      'Labour index is modelled above the national default. Carpentry, waterproofing and electrical finishing crews are frequently the bottleneck — contingency for schedule slip matters as much as ₹/sq ft.',
    marketNotes:
      'TMT and cement track southern wholesale, with city octroi/logistics friction on inward trucks. M-sand substitution is common; verify grading before locking plaster and concrete assumptions.',
    editorialRateUpdatedAt: '2026-08-01',
    faqExtras: [
      {
        question: 'Why is Bengaluru construction cost per sq ft higher?',
        answer:
          'Varnarc applies a higher location multiplier for Bengaluru to reflect elevated labour and logistics versus the national baseline. Brand specifications and apartment vs independent-house scopes still dominate final quotes.',
      },
    ],
  },
  pune: {
    slug: 'pune',
    name: 'Pune',
    editorialIntro:
      'Pune sits between Hyderabad and Bengaluru on Varnarc’s indicative scale: metro-adjacent labour rates with strong contractor density in Hinjewadi–Baner belts and more competitive shell rates toward peripheral MIDC-linked towns. Monsoon sequencing and black-cotton soil pockets can change foundation spend more than headline ₹/sq ft.',
    labourAssumptions:
      'Labour is modelled modestly above national baseline. Finishing crews for premium bungalows in Koregaon Park / Kalyani Nagar often price above city-wide planning rates.',
    marketNotes:
      'Aggregates and brick supply from surrounding districts is relatively deep; steel follows western India TMT bands. Confirm RMC plant distance for slab pours on outer plots.',
    editorialRateUpdatedAt: '2026-08-01',
    faqExtras: [
      {
        question: 'How do Pune and Mumbai construction costs compare?',
        answer:
          'Mumbai’s indicative multiplier is substantially higher than Pune’s. Pune projects still need separate allowances for topography, retaining walls and society bye-laws that a simple city multiplier cannot capture.',
      },
    ],
  },
  mumbai: {
    slug: 'mumbai',
    name: 'Mumbai',
    editorialIntro:
      'Mumbai remains among the highest indicative construction-cost markets in Varnarc’s model, driven by constrained logistics, high skilled-labour demand, and redevelopment/society compliance overheads. Island-city sites and mainland (Navi Mumbai / Thane) should not share one budget without separate access and pile assumptions.',
    labourAssumptions:
      'Labour index sits well above national default. Night-work restrictions, lift hoist hire and congested unloading often add soft costs beyond pure mason/carpenter day rates.',
    marketNotes:
      'Material inbound costs are sensitive to jetty/warehouse routing. Always verify cement bag and steel delivery slots; storage constraints on small plots inflate wastage.',
    editorialRateUpdatedAt: '2026-08-01',
    faqExtras: [
      {
        question: 'Does Varnarc’s Mumbai rate include society deposits?',
        answer:
          'No. Indicative ₹/sq ft covers construction planning categories only. Redevelopment premiums, corpus deposits and temporary alternate accommodation are outside this model.',
      },
    ],
  },
  chennai: {
    slug: 'chennai',
    name: 'Chennai',
    editorialIntro:
      'Chennai construction costs sit slightly above the national baseline in Varnarc’s model, with coastal durability detailing (corrosion protection, waterproofing) often more important than raw shell rate. Industrial southern corridors can access competitive RMC; flood-prone pockets need drainage allowances beyond average city planning.',
    labourAssumptions:
      'Labour near national-plus. Specialised waterproofing and structural repair crews command premiums after monsoon damage seasons.',
    marketNotes:
      'Sand sourcing and river-sand restrictions affect plaster rates; M-sand quality checks are essential. Steel supply is generally liquid via southern mills.',
    editorialRateUpdatedAt: '2026-08-01',
    faqExtras: [
      {
        question: 'Should coastal Chennai homes budget extra for durability?',
        answer:
          'Yes — cover coatings, cover depth and waterproofing often exceed inland norms. Those line items sit in finishing/MEP contingencies more than the headline shell multiplier.',
      },
    ],
  },
  delhi: {
    slug: 'delhi',
    name: 'Delhi NCR',
    editorialIntro:
      'Delhi NCR indicative costs run above the national baseline, with wide intra-region spreads between South Delhi plots, Noida Expressway apartments and Gurugram low-rise. Pollution-season work stoppages and winter curing conditions can stretch timelines even when ₹/sq ft looks stable.',
    labourAssumptions:
      'Labour above national index. NCR finishing markets are competitive but quality variance is high — BOQ specifications matter more than city average rates.',
    marketNotes:
      'Brick and aggregate supply is deep; steel tracks North India TMT. Confirm GST invoices and brand grades when comparing dealer quotes to Varnarc observations.',
    editorialRateUpdatedAt: '2026-08-01',
    faqExtras: [
      {
        question: 'Is one Delhi NCR rate enough for Noida and Gurugram?',
        answer:
          'Use Delhi NCR as a planning anchor, then adjust with local quotes. Gurugram and Noida have separate labour and logistics dynamics that a single multiplier only approximates.',
      },
    ],
  },
  ahmedabad: {
    slug: 'ahmedabad',
    name: 'Ahmedabad',
    editorialIntro:
      'Ahmedabad typically prices at or slightly below Varnarc’s national baseline for shell construction, with efficient contractor networks and strong local material markets. Premium bungalow finishes in western Ahmedabad can still approach metro-tier budgets despite a milder city multiplier.',
    labourAssumptions:
      'Labour near or slightly below national index for shell trades; specialised stone and CNC joinery for premium homes price higher.',
    marketNotes:
      'Cement and ceramics supply is competitive. Summer casting practices and water curing discipline affect concrete quality more than headline rates.',
    editorialRateUpdatedAt: '2026-08-01',
    faqExtras: [
      {
        question: 'Why might Ahmedabad quotes undercut Hyderabad?',
        answer:
          'Varnarc’s indicative multiplier for Ahmedabad is slightly below Hyderabad/national baseline. Always reconcile with soil investigation and finish specs before treating the gap as savings.',
      },
    ],
  },
  kolkata: {
    slug: 'kolkata',
    name: 'Kolkata',
    editorialIntro:
      'Kolkata indicative shell costs sit modestly below the national baseline in Varnarc’s model, but soft-soil foundation strategies and heritage-adjacent site constraints can erase that gap. South and east suburban growth belts often show different labour availability than central densification projects.',
    labourAssumptions:
      'Labour near or below national index for general masonry; specialised restoration and waterproofing for older structures command premiums.',
    marketNotes:
      'Brick markets are deep; confirm fly-ash vs clay brick assumptions in thermal and plaster calculations. Logistics into narrow lanes add unloading soft costs.',
    editorialRateUpdatedAt: '2026-08-01',
    faqExtras: [
      {
        question: 'Does a lower Kolkata multiplier mean cheaper foundations?',
        answer:
          'Not necessarily. Soft ground and water tables can raise foundation spend even when shell ₹/sq ft looks favourable. Use geotech inputs before locking budgets.',
      },
    ],
  },
};

export type CityMaterialObservationInput = {
  materialKey: string;
  price: number;
  unit: string;
  currency?: string;
  claimed: PriceFreshness;
  verifiedAt?: Date | string | null;
  effectiveFrom?: Date | string | null;
};

export type CityMaterialOverviewLine = {
  materialKey: PriceHubMaterialKey;
  label: string;
  unit: string;
  currency: string;
  currentPrice: number | null;
  freshnessLabel: string | null;
  ageDays: number | null;
  isReliableCurrent: boolean;
  observationCount: number;
  href: string;
};

export type CityQualityScenario = {
  quality: 'basic' | 'standard' | 'premium';
  label: string;
  costPerSqft: number;
  estimatedTotal: number;
  rangeLow: number;
  rangeHigh: number;
};

export type ConstructionCostCityLanding = {
  indexable: boolean;
  indexBlockReason: string | null;
  city: { slug: ConstructionCostCitySlug; name: string };
  canonicalPath: string;
  calculatorHref: string;
  locationMultiplier: number;
  nationalBaseRatePerSqft: number;
  /** Reliable when derived from standard scenario with city multiplier. */
  costPerSqftReliable: boolean;
  costPerSqft: number;
  indicativeRange: { low: number; high: number; mid: number };
  referenceAreaSqft: number;
  localRateUpdatedAt: string;
  localRateUpdateSource: 'material_observations' | 'editorial';
  editorialIntro: string;
  labourAssumptions: string;
  marketNotes: string;
  materialOverview: CityMaterialOverviewLine[];
  qualityScenarios: CityQualityScenario[];
  historicalTrend: {
    available: boolean;
    materialKey: PriceHubMaterialKey | null;
    materialLabel: string | null;
    changes: PricePeriodChange[];
    note: string;
  };
  faqs: Array<{ question: string; answer: string }>;
  relatedMaterialPriceHrefs: Array<{ href: string; label: string }>;
  relatedCityHrefs: Array<{ href: string; label: string }>;
  methodology: string;
  qualification: string;
  version: string;
};

function moneyRound(n: number): number {
  return Math.round(n);
}

export function isConstructionCostCitySlug(value: string): value is ConstructionCostCitySlug {
  return PRICE_HUB_CITIES.some((c) => c.slug === value);
}

export function getConstructionCostCityProfile(slug: string): ConstructionCostCityProfile | null {
  return CONSTRUCTION_COST_CITY_PROFILES[slug] ?? null;
}

export function listConstructionCostCityProfileSlugs(): ConstructionCostCitySlug[] {
  return Object.keys(CONSTRUCTION_COST_CITY_PROFILES).filter(isConstructionCostCitySlug);
}

function baseFaqs(cityName: string): Array<{ question: string; answer: string }> {
  return [
    {
      question: `Is the ${cityName} construction cost on this page a guaranteed quote?`,
      answer:
        'No. Figures are indicative planning ranges for education only. They are not quotations, tenders or guarantees. Always verify with local contractors and suppliers.',
    },
    {
      question: `How does Varnarc estimate construction cost in ${cityName}?`,
      answer:
        'We apply the city location multiplier to a national indicative base rate per sq ft, then run quality scenarios (basic / standard / premium) for a reference independent house. Local material observations inform freshness and related price links when data exists.',
    },
    {
      question: 'When does Varnarc publish a city construction-cost page?',
      answer:
        'Only when a unique editorial city profile exists and enough reliable local material price observations are available. Thin template-only city URLs are not indexed.',
    },
  ];
}

/**
 * SEO gate: unique profile + location model + enough local material observations.
 */
export function canIndexConstructionCostCity(input: {
  citySlug: string;
  observations: CityMaterialObservationInput[];
  now?: Date;
}): { indexable: boolean; reason: string | null } {
  const profile = getConstructionCostCityProfile(input.citySlug);
  if (!profile) {
    return { indexable: false, reason: 'missing_editorial_profile' };
  }
  if (profile.editorialIntro.trim().length < 120) {
    return { indexable: false, reason: 'editorial_too_thin' };
  }

  const locKey = normalizeLocationKey(profile.name);
  if (locKey === 'default' || !LOCATION_MULTIPLIERS[locKey]) {
    return { indexable: false, reason: 'missing_location_multiplier' };
  }

  const byMaterial = new Map<string, CityMaterialObservationInput[]>();
  for (const o of input.observations) {
    const list = byMaterial.get(o.materialKey) ?? [];
    list.push(o);
    byMaterial.set(o.materialKey, list);
  }

  let materialsWithCurrent = 0;
  let totalObs = 0;
  for (const [key, list] of byMaterial) {
    if (!PRICE_HUB_MATERIALS.some((m) => m.key === key)) continue;
    totalObs += list.length;
    const hasCurrent = list.some((o) =>
      isReliableCurrentPrice(
        resolveDisplayFreshness({
          claimed: o.claimed,
          verifiedAt: o.verifiedAt,
          effectiveFrom: o.effectiveFrom,
          now: input.now,
        }),
      ),
    );
    if (hasCurrent) materialsWithCurrent += 1;
  }

  if (materialsWithCurrent < COST_CITY_MIN_MATERIALS_WITH_CURRENT) {
    return { indexable: false, reason: 'insufficient_current_materials' };
  }
  if (totalObs < COST_CITY_MIN_TOTAL_OBSERVATIONS) {
    return { indexable: false, reason: 'insufficient_observation_volume' };
  }

  return { indexable: true, reason: null };
}

function buildMaterialOverview(
  citySlug: string,
  observations: CityMaterialObservationInput[],
  now: Date,
): CityMaterialOverviewLine[] {
  return PRICE_HUB_MATERIALS.map((m) => {
    const list = observations
      .filter((o) => o.materialKey === m.key)
      .map((o) => ({
        ...o,
        display: resolveDisplayFreshness({
          claimed: o.claimed,
          verifiedAt: o.verifiedAt,
          effectiveFrom: o.effectiveFrom,
          now,
        }),
        t: o.effectiveFrom ? new Date(o.effectiveFrom).getTime() : 0,
      }))
      .sort((a, b) => b.t - a.t);

    const current = list.find((o) => isReliableCurrentPrice(o.display)) ?? null;
    return {
      materialKey: m.key,
      label: m.label,
      unit: current?.unit ?? m.unitHint.replace(/^₹\s*\/\s*/i, '') ?? 'unit',
      currency: current?.currency ?? 'INR',
      currentPrice: current?.price ?? null,
      freshnessLabel: current?.display.label ?? null,
      ageDays: current?.display.ageDays ?? null,
      isReliableCurrent: Boolean(current),
      observationCount: list.length,
      href: `/construction/prices/${m.key}/${citySlug}`,
    };
  });
}

function buildQualityScenarios(cityName: string): CityQualityScenario[] {
  const qualities = [
    { quality: 'basic' as const, label: 'Basic' },
    { quality: 'standard' as const, label: 'Standard' },
    { quality: 'premium' as const, label: 'Premium' },
  ];
  return qualities.map((q) => {
    const r = calculateConstructionCost({
      mode: 'forward',
      location: cityName,
      propertyType: 'independent_house',
      builtUpArea: COST_CITY_REFERENCE_AREA_SQFT,
      areaUnit: 'sqft',
      floors: COST_CITY_REFERENCE_FLOORS,
      quality: q.quality,
      contingencyPercent: 10,
    });
    return {
      quality: q.quality,
      label: q.label,
      costPerSqft: r.costPerSqft,
      estimatedTotal: r.estimatedTotal,
      rangeLow: r.rangeLow,
      rangeHigh: r.rangeHigh,
    };
  });
}

function pickTrendMaterial(
  observations: CityMaterialObservationInput[],
): { key: PriceHubMaterialKey; list: CityMaterialObservationInput[] } | null {
  const preferred: PriceHubMaterialKey[] = ['cement', 'steel', 'sand', 'brick'];
  for (const key of preferred) {
    const list = observations.filter((o) => o.materialKey === key);
    if (list.length >= 3) return { key, list };
  }
  return null;
}

/**
 * Build a city construction-cost landing payload.
 * Callers should 404 / noindex when `indexable` is false.
 */
export function buildConstructionCostCityLanding(input: {
  citySlug: string;
  observations: CityMaterialObservationInput[];
  /** Other city slugs that are also indexable (for related links). */
  relatedIndexableCitySlugs?: string[];
  now?: Date;
}): ConstructionCostCityLanding | null {
  const now = input.now ?? new Date();
  const profile = getConstructionCostCityProfile(input.citySlug);
  if (!profile || !isConstructionCostCitySlug(input.citySlug)) return null;

  const gate = canIndexConstructionCostCity({
    citySlug: input.citySlug,
    observations: input.observations,
    now,
  });

  const locKey = normalizeLocationKey(profile.name);
  const locMeta = LOCATION_MULTIPLIERS[locKey] ?? LOCATION_MULTIPLIERS.default!;
  const scenarios = buildQualityScenarios(profile.name);
  const standard = scenarios.find((s) => s.quality === 'standard')!;
  const materialOverview = buildMaterialOverview(input.citySlug, input.observations, now);

  const latestObsDate = input.observations
    .map((o) => (o.effectiveFrom ? new Date(o.effectiveFrom).getTime() : 0))
    .filter((t) => t > 0)
    .sort((a, b) => b - a)[0];
  const editorialTs = new Date(profile.editorialRateUpdatedAt).getTime();
  const useObsDate = latestObsDate != null && latestObsDate >= editorialTs;
  const localRateUpdatedAt = useObsDate
    ? new Date(latestObsDate!).toISOString().slice(0, 10)
    : profile.editorialRateUpdatedAt;
  const localRateUpdateSource = useObsDate
    ? ('material_observations' as const)
    : ('editorial' as const);

  const trendPick = pickTrendMaterial(input.observations);
  let historicalTrend: ConstructionCostCityLanding['historicalTrend'] = {
    available: false,
    materialKey: null,
    materialLabel: null,
    changes: [],
    note: 'Not enough local material history yet to show a trend on this city page.',
  };
  if (trendPick) {
    const asc = [...trendPick.list].sort((a, b) => {
      const ta = a.effectiveFrom ? new Date(a.effectiveFrom).getTime() : 0;
      const tb = b.effectiveFrom ? new Date(b.effectiveFrom).getTime() : 0;
      return ta - tb;
    });
    const latest = asc[asc.length - 1]!;
    const changes = computePricePeriodChanges({
      currentPrice: latest.price,
      observations: asc.map((o) => ({
        price: o.price,
        effectiveFrom: o.effectiveFrom ?? now.toISOString(),
      })),
      now,
    });
    const hub = PRICE_HUB_MATERIALS.find((m) => m.key === trendPick.key)!;
    historicalTrend = {
      available: changes.some((c) => c.available),
      materialKey: trendPick.key,
      materialLabel: hub.label,
      changes,
      note: `Proxy trend from local ${hub.label.toLowerCase()} observations — not a construction-cost forecast.`,
    };
  }

  const relatedMaterialPriceHrefs = materialOverview
    .filter((m) => m.isReliableCurrent || m.observationCount > 0)
    .slice(0, 6)
    .map((m) => ({
      href: m.href,
      label: `${m.label} prices in ${profile.name}`,
    }));

  const relatedCityHrefs = (input.relatedIndexableCitySlugs ?? [])
    .filter((s) => s !== input.citySlug && getConstructionCostCityProfile(s))
    .slice(0, 8)
    .map((s) => {
      const p = getConstructionCostCityProfile(s)!;
      return {
        href: `/construction/construction-cost/${s}`,
        label: `Construction cost in ${p.name}`,
      };
    });

  const labourSplitNote = `Default planning split before contingency: material ${DEFAULT_COST_SPLIT.materialPercent}% / labour ${DEFAULT_COST_SPLIT.labourPercent}% / miscellaneous ${DEFAULT_COST_SPLIT.miscPercent}%. ${profile.labourAssumptions}`;

  return {
    indexable: gate.indexable,
    indexBlockReason: gate.reason,
    city: { slug: input.citySlug, name: profile.name },
    canonicalPath: `/construction/construction-cost/${input.citySlug}`,
    calculatorHref: `/construction/cost-calculator?location=${encodeURIComponent(profile.name)}&builtUpArea=${COST_CITY_REFERENCE_AREA_SQFT}&floors=${COST_CITY_REFERENCE_FLOORS}&quality=standard`,
    locationMultiplier: locMeta.multiplier,
    nationalBaseRatePerSqft: NATIONAL_BASE_RATE_PER_SQFT,
    costPerSqftReliable: gate.indexable,
    costPerSqft: standard.costPerSqft,
    indicativeRange: {
      low: moneyRound(standard.rangeLow),
      high: moneyRound(standard.rangeHigh),
      mid: moneyRound(standard.estimatedTotal),
    },
    referenceAreaSqft: COST_CITY_REFERENCE_AREA_SQFT,
    localRateUpdatedAt,
    localRateUpdateSource,
    editorialIntro: profile.editorialIntro,
    labourAssumptions: labourSplitNote,
    marketNotes: profile.marketNotes,
    materialOverview,
    qualityScenarios: scenarios,
    historicalTrend,
    faqs: [...baseFaqs(profile.name), ...profile.faqExtras],
    relatedMaterialPriceHrefs,
    relatedCityHrefs,
    methodology: CONSTRUCTION_COST_CITY_METHODOLOGY,
    qualification: CONSTRUCTION_COST_CITY_QUALIFICATION,
    version: `${CONSTRUCTION_COST_CITY_VERSION}+${COST_CALC_VERSION}`,
  };
}

export function listPotentialConstructionCostCities() {
  return listConstructionCostCityProfileSlugs().map((slug) => {
    const p = getConstructionCostCityProfile(slug)!;
    return { slug, name: p.name, path: `/construction/construction-cost/${slug}` };
  });
}
