/** High-intent calculation landings — curated pairs only (anti URL-explosion). */

import { calculateConstructionCost } from '../construction-cost/calculate';
import {
  COST_CALC_VERSION,
  DEFAULT_MARKET_RATES,
  NATIONAL_BASE_RATE_PER_SQFT,
  QUALITY_QTY_FACTOR,
  RATE_QTY_PER_SQFT,
} from '../construction-cost/rates';
import type { ConstructionCostQuality } from '../construction-cost/types';

export const INTENT_CALC_LANDING_VERSION = '2026.08.1';

export const INTENT_CALC_QUALIFICATION =
  'Indicative planning figures for education only — not a quotation, BOQ or structural design. Actual cement, steel and cost depend on design, soil, finish level and local rates. Verify with your architect/engineer and local suppliers.';

export const INTENT_CALC_METHODOLOGY =
  'House-level cement and steel figures use Varnarc’s published planning quantities per sq ft (standard quality), scaled by quality factors. Construction-cost figures run the same cost engine as the interactive cost calculator for an independent house with documented defaults. Pages are published only from a curated topic×area allowlist — we do not generate combinatorial keyword URLs.';

/** Hard cap — never auto-expand beyond this without editorial review. */
export const INTENT_CALC_MAX_PUBLISHED_PAGES = 24;

export type IntentCalcTopicKey = 'cement-required' | 'steel-required' | 'construction-cost';

export type IntentCalcAreaSlug =
  '1000-sq-ft' | '1200-sq-ft' | '1500-sq-ft' | '1800-sq-ft' | '2000-sq-ft';

export type IntentCalcTopicProfile = {
  key: IntentCalcTopicKey;
  label: string;
  /** Short SEO noun phrase, e.g. "cement required". */
  intentPhrase: string;
  h1Template: string;
  titleTemplate: string;
  descriptionTemplate: string;
  editorialIntro: string;
  calculatorHref: string;
  calculatorLabel: string;
  unitLabel: string;
  faqExtras: Array<{ question: string; answer: string }>;
};

export type IntentCalcAreaProfile = {
  slug: IntentCalcAreaSlug;
  areaSqft: number;
  label: string;
  /** Unique note for this size — not a find/replace of the number alone. */
  sizeNote: string;
};

export type IntentCalcPublishPair = {
  topic: IntentCalcTopicKey;
  area: IntentCalcAreaSlug;
  /** Extra unique line for this pair (anti-thin). Min length enforced by gate. */
  pairNote: string;
};

export const INTENT_CALC_TOPICS: Record<IntentCalcTopicKey, IntentCalcTopicProfile> = {
  'cement-required': {
    key: 'cement-required',
    label: 'Cement required',
    intentPhrase: 'cement required',
    h1Template: 'Cement required for a {area} house',
    titleTemplate: 'Cement Required for {area} House — Bags Estimate | Varnarc',
    descriptionTemplate:
      'Estimate cement bags for a {area} independent house using Varnarc planning quantities. Assumptions, worked example and calculator. Indicative only.',
    editorialIntro:
      'Homeowners often search how many cement bags a house of a given built-up area needs. Varnarc answers with transparent planning quantities per sq ft — not a site-specific BOQ. Use the figure to size early budgets, then refine with drawings and mix designs.',
    calculatorHref: '/construction/cement-calculator',
    calculatorLabel: 'Open cement calculator',
    unitLabel: 'bags (50 kg)',
    faqExtras: [
      {
        question: 'Is cement estimated per built-up area or per concrete volume?',
        answer:
          'This landing uses built-up area planning factors for whole-house budgeting. For a specific slab, beam or plaster job, use the cement calculator with volume or area × thickness.',
      },
    ],
  },
  'steel-required': {
    key: 'steel-required',
    label: 'Steel required',
    intentPhrase: 'steel required',
    h1Template: 'Steel required for a {area} house',
    titleTemplate: 'Steel Required for {area} House — TMT kg Estimate | Varnarc',
    descriptionTemplate:
      'Estimate TMT steel (kg) for a {area} house from Varnarc planning quantities per sq ft. Assumptions, example and steel calculator. Indicative only.',
    editorialIntro:
      'Steel demand for a house is usually asked in kilograms of TMT for the framed structure. Varnarc’s kg-per-sq-ft factor is a planning thumb-rule for early budgeting — bar bending schedules from structural drawings will differ.',
    calculatorHref: '/construction/steel-calculator',
    calculatorLabel: 'Open steel calculator',
    unitLabel: 'kg (TMT)',
    faqExtras: [
      {
        question: 'Does this include binding wire and wastage?',
        answer:
          'The kg figure is a planning total for reinforcement steel. Binding wire, chairs and cutting wastage should be confirmed with the fabricator or BBS.',
      },
    ],
  },
  'construction-cost': {
    key: 'construction-cost',
    label: 'Construction cost',
    intentPhrase: 'construction cost',
    h1Template: 'Construction cost for a {area} house',
    titleTemplate: 'Construction Cost for {area} House — ₹ Estimate | Varnarc',
    descriptionTemplate:
      'Indicative construction cost for a {area} independent house using Varnarc’s cost engine. Assumptions, range, calculator and FAQs. Not a quote.',
    editorialIntro:
      'Searchers want a rupee figure for a house of a stated built-up area. Varnarc runs the same construction-cost engine as the interactive calculator with documented defaults (independent house, national baseline location, contingency) so the number is reproducible — not invented for SEO.',
    calculatorHref: '/construction/cost-calculator',
    calculatorLabel: 'Open cost calculator',
    unitLabel: '₹ (indicative total)',
    faqExtras: [
      {
        question: 'Does this include interiors and compound wall?',
        answer:
          'Default landings use shell-to-standard finishes without optional basement, lift, compound wall or modular kitchen unless you change those in the interactive calculator. Always read the assumptions list on the page.',
      },
    ],
  },
};

export const INTENT_CALC_AREAS: Record<IntentCalcAreaSlug, IntentCalcAreaProfile> = {
  '1000-sq-ft': {
    slug: '1000-sq-ft',
    areaSqft: 1000,
    label: '1000 sq ft',
    sizeNote:
      'A 1000 sq ft built-up footprint is common for compact 1–2 BHK independent houses. Planning quantities assume efficient layouts; duplex or heavy projection designs can raise cement and steel intensity.',
  },
  '1200-sq-ft': {
    slug: '1200-sq-ft',
    areaSqft: 1200,
    label: '1200 sq ft',
    sizeNote:
      '1200 sq ft sits in a high-intent mid band for 2 BHK homes. Cost and material searches at this size are frequent; treat figures as mid-range planning, not turnkey packages.',
  },
  '1500-sq-ft': {
    slug: '1500-sq-ft',
    areaSqft: 1500,
    label: '1500 sq ft',
    sizeNote:
      '1500 sq ft is Varnarc’s reference house size on several city cost pages. It is a useful benchmark for comparing quality scenarios and location multipliers.',
  },
  '1800-sq-ft': {
    slug: '1800-sq-ft',
    areaSqft: 1800,
    label: '1800 sq ft',
    sizeNote:
      '1800 sq ft often maps to larger 3 BHK plans. Material intensity may rise with longer spans and more toilets — refine after architectural drawings.',
  },
  '2000-sq-ft': {
    slug: '2000-sq-ft',
    areaSqft: 2000,
    label: '2000 sq ft',
    sizeNote:
      '2000 sq ft searches typically reflect spacious independent homes. Premium finishes and additional parking/lift options move cost more than bag/kg thumb-rules alone.',
  },
};

/**
 * Explicit publish matrix — the only combinations that may be indexed.
 * Adding a pair requires a unique pairNote (≥ 80 chars). This is the primary
 * safeguard against combinatorial URL explosion.
 */
export const INTENT_CALC_PUBLISH_PAIRS: readonly IntentCalcPublishPair[] = [
  {
    topic: 'cement-required',
    area: '1000-sq-ft',
    pairNote:
      'For 1000 sq ft, cement bag counts are most useful when comparing basic vs standard finishes before locking a dealer quote for the foundation and ground-floor slab cycle.',
  },
  {
    topic: 'cement-required',
    area: '1500-sq-ft',
    pairNote:
      'At 1500 sq ft, cement planning aligns with Varnarc’s reference house size, making it easier to cross-check city ₹/sq ft pages and material price landings.',
  },
  {
    topic: 'cement-required',
    area: '2000-sq-ft',
    pairNote:
      '2000 sq ft cement estimates help owners stress-test budgets when upgrading from load-bearing to framed structures with more RCC members.',
  },
  {
    topic: 'steel-required',
    area: '1000-sq-ft',
    pairNote:
      'Steel for a 1000 sq ft house is a frequent early question when comparing contractor lumpsum quotes against TMT rate-per-kg markets.',
  },
  {
    topic: 'steel-required',
    area: '1500-sq-ft',
    pairNote:
      '1500 sq ft steel kg estimates pair well with BBS calculator workflows once column and beam schedules are available from the structural engineer.',
  },
  {
    topic: 'construction-cost',
    area: '1000-sq-ft',
    pairNote:
      'Cost for 1000 sq ft is a common entry query for first-time builders; the landing emphasises range and contingency rather than a single turnkey number.',
  },
  {
    topic: 'construction-cost',
    area: '1200-sq-ft',
    pairNote:
      '1200 sq ft cost searches are high intent for 2 BHK plans; we publish this size because it sits between compact and reference footprints with distinct budgeting behaviour.',
  },
  {
    topic: 'construction-cost',
    area: '1500-sq-ft',
    pairNote:
      '1500 sq ft construction cost is the primary benchmark size across Varnarc city cost pages — keep this landing consistent with that reference model.',
  },
  {
    topic: 'construction-cost',
    area: '2000-sq-ft',
    pairNote:
      '2000 sq ft cost pages serve owners comparing premium finishes and optional features; defaults stay conservative so the interactive calculator can explore upsides.',
  },
] as const;

export const INTENT_CALC_DEFAULT_FLOORS = 2;
export const INTENT_CALC_DEFAULT_QUALITY: ConstructionCostQuality = 'standard';
export const INTENT_CALC_DEFAULT_LOCATION = 'default';

export type IntentCalcAssumption = { id: string; label: string; value: string };

export type IntentCalcResultBlock = {
  primaryLabel: string;
  primaryValue: string;
  primaryNumeric: number;
  secondaryLines: Array<{ label: string; value: string }>;
  quality: ConstructionCostQuality;
  floors: number;
};

export type IntentCalcLanding = {
  topic: IntentCalcTopicProfile;
  area: IntentCalcAreaProfile;
  canonicalPath: string;
  h1: string;
  title: string;
  description: string;
  editorialIntro: string;
  sizeNote: string;
  pairNote: string;
  methodology: string;
  qualification: string;
  assumptions: IntentCalcAssumption[];
  result: IntentCalcResultBlock;
  qualityScenarios: IntentCalcResultBlock[];
  workedExample: string;
  faqs: Array<{ question: string; answer: string }>;
  relatedHrefs: Array<{ href: string; label: string }>;
  internalLinks: Array<{ href: string; label: string }>;
  calculatorHref: string;
  calculatorLabel: string;
  interactiveDefaults: {
    areaSqft: number;
    floors: number;
    quality: ConstructionCostQuality;
    topic: IntentCalcTopicKey;
  };
  indexable: true;
  version: string;
  costEngineVersion: string;
};

function fillArea(template: string, areaLabel: string): string {
  return template.replace(/\{area\}/g, areaLabel);
}

function moneyInr(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatBags(n: number): string {
  return `${new Intl.NumberFormat('en-IN').format(Math.round(n))} bags`;
}

function formatKg(n: number): string {
  return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n))} kg`;
}

export function isIntentCalcTopicKey(value: string): value is IntentCalcTopicKey {
  return value in INTENT_CALC_TOPICS;
}

export function isIntentCalcAreaSlug(value: string): value is IntentCalcAreaSlug {
  return value in INTENT_CALC_AREAS;
}

export function getIntentCalcPublishPair(
  topic: string,
  area: string,
): IntentCalcPublishPair | null {
  return INTENT_CALC_PUBLISH_PAIRS.find((p) => p.topic === topic && p.area === area) ?? null;
}

/** Primary explosion safeguard: only curated pairs. */
export function canIndexIntentCalcLanding(input: { topic: string; area: string }): {
  indexable: boolean;
  reason: string | null;
} {
  if (!isIntentCalcTopicKey(input.topic)) {
    return { indexable: false, reason: 'unknown_topic' };
  }
  if (!isIntentCalcAreaSlug(input.area)) {
    return { indexable: false, reason: 'unknown_area' };
  }
  const pair = getIntentCalcPublishPair(input.topic, input.area);
  if (!pair) {
    return { indexable: false, reason: 'pair_not_in_publish_matrix' };
  }
  if (pair.pairNote.trim().length < 80) {
    return { indexable: false, reason: 'pair_note_too_thin' };
  }
  const topic = INTENT_CALC_TOPICS[input.topic];
  if (topic.editorialIntro.trim().length < 120) {
    return { indexable: false, reason: 'topic_editorial_too_thin' };
  }
  const area = INTENT_CALC_AREAS[input.area];
  if (area.sizeNote.trim().length < 80) {
    return { indexable: false, reason: 'area_note_too_thin' };
  }
  if (INTENT_CALC_PUBLISH_PAIRS.length > INTENT_CALC_MAX_PUBLISHED_PAGES) {
    return { indexable: false, reason: 'publish_cap_exceeded' };
  }
  return { indexable: true, reason: null };
}

export function listIndexableIntentCalcLandings(): Array<{
  topic: IntentCalcTopicKey;
  area: IntentCalcAreaSlug;
  path: string;
}> {
  return INTENT_CALC_PUBLISH_PAIRS.filter(
    (p) => canIndexIntentCalcLanding({ topic: p.topic, area: p.area }).indexable,
  ).map((p) => ({
    topic: p.topic,
    area: p.area,
    path: `/construction/calc/${p.topic}/${p.area}`,
  }));
}

export function estimateHouseCementBags(
  areaSqft: number,
  quality: ConstructionCostQuality = INTENT_CALC_DEFAULT_QUALITY,
): number {
  return Math.round(areaSqft * RATE_QTY_PER_SQFT.cementBags * QUALITY_QTY_FACTOR[quality]);
}

export function estimateHouseSteelKg(
  areaSqft: number,
  quality: ConstructionCostQuality = INTENT_CALC_DEFAULT_QUALITY,
): number {
  return Math.round(areaSqft * RATE_QTY_PER_SQFT.steelKg * QUALITY_QTY_FACTOR[quality]);
}

function costInput(areaSqft: number, quality: ConstructionCostQuality, floors: number) {
  return {
    mode: 'forward' as const,
    location: INTENT_CALC_DEFAULT_LOCATION,
    propertyType: 'independent_house' as const,
    builtUpArea: areaSqft,
    areaUnit: 'sqft' as const,
    floors,
    quality,
    basement: false,
    parkingSlots: 0,
    lift: false,
    compoundWall: false,
    modularKitchen: false,
    contingencyPercent: 10,
  };
}

export function computeIntentCalcResult(input: {
  topic: IntentCalcTopicKey;
  areaSqft: number;
  quality?: ConstructionCostQuality;
  floors?: number;
}): IntentCalcResultBlock {
  const quality = input.quality ?? INTENT_CALC_DEFAULT_QUALITY;
  const floors = input.floors ?? INTENT_CALC_DEFAULT_FLOORS;
  const areaSqft = input.areaSqft;

  if (input.topic === 'cement-required') {
    const bags = estimateHouseCementBags(areaSqft, quality);
    const indicativeCost = bags * DEFAULT_MARKET_RATES.cementRatePerBag;
    return {
      primaryLabel: 'Indicative cement',
      primaryValue: formatBags(bags),
      primaryNumeric: bags,
      secondaryLines: [
        {
          label: 'Planning factor',
          value: `${RATE_QTY_PER_SQFT.cementBags} bags/sq ft × quality ${QUALITY_QTY_FACTOR[quality]}`,
        },
        {
          label: 'Indicative bag cost',
          value: `${moneyInr(indicativeCost)} @ ${moneyInr(DEFAULT_MARKET_RATES.cementRatePerBag)}/bag`,
        },
      ],
      quality,
      floors,
    };
  }

  if (input.topic === 'steel-required') {
    const kg = estimateHouseSteelKg(areaSqft, quality);
    const indicativeCost = kg * DEFAULT_MARKET_RATES.steelRatePerKg;
    return {
      primaryLabel: 'Indicative steel',
      primaryValue: formatKg(kg),
      primaryNumeric: kg,
      secondaryLines: [
        {
          label: 'Planning factor',
          value: `${RATE_QTY_PER_SQFT.steelKg} kg/sq ft × quality ${QUALITY_QTY_FACTOR[quality]}`,
        },
        {
          label: 'Indicative steel cost',
          value: `${moneyInr(indicativeCost)} @ ${moneyInr(DEFAULT_MARKET_RATES.steelRatePerKg)}/kg`,
        },
      ],
      quality,
      floors,
    };
  }

  const cost = calculateConstructionCost(costInput(areaSqft, quality, floors));
  return {
    primaryLabel: 'Indicative construction cost',
    primaryValue: moneyInr(cost.estimatedTotal),
    primaryNumeric: cost.estimatedTotal,
    secondaryLines: [
      {
        label: 'Cost per sq ft',
        value: `${moneyInr(cost.costPerSqft)} / sq ft`,
      },
      {
        label: 'Likely range',
        value: `${moneyInr(cost.rangeLow)} – ${moneyInr(cost.rangeHigh)}`,
      },
      {
        label: 'National base',
        value: `${moneyInr(NATIONAL_BASE_RATE_PER_SQFT)} / sq ft before multipliers`,
      },
    ],
    quality,
    floors,
  };
}

function buildAssumptions(
  topic: IntentCalcTopicKey,
  area: IntentCalcAreaProfile,
  floors: number,
  quality: ConstructionCostQuality,
): IntentCalcAssumption[] {
  const shared: IntentCalcAssumption[] = [
    { id: 'area', label: 'Built-up area', value: `${area.areaSqft.toLocaleString('en-IN')} sq ft` },
    { id: 'property', label: 'Property type', value: 'Independent house' },
    { id: 'floors', label: 'Floors (default)', value: String(floors) },
    { id: 'quality', label: 'Quality (default)', value: quality },
    { id: 'location', label: 'Location model', value: 'National baseline (default multiplier)' },
  ];
  if (topic === 'cement-required') {
    return [
      ...shared,
      {
        id: 'factor',
        label: 'Cement factor',
        value: `${RATE_QTY_PER_SQFT.cementBags} bags per sq ft (standard), scaled by quality`,
      },
      { id: 'bag', label: 'Bag size', value: '50 kg (planning)' },
    ];
  }
  if (topic === 'steel-required') {
    return [
      ...shared,
      {
        id: 'factor',
        label: 'Steel factor',
        value: `${RATE_QTY_PER_SQFT.steelKg} kg per sq ft (standard), scaled by quality`,
      },
    ];
  }
  return [
    ...shared,
    { id: 'contingency', label: 'Contingency', value: '10%' },
    {
      id: 'options',
      label: 'Optional features',
      value: 'No basement, lift, compound wall or modular kitchen in the default run',
    },
    {
      id: 'engine',
      label: 'Cost engine',
      value: `Varnarc construction-cost ${COST_CALC_VERSION}`,
    },
  ];
}

function buildWorkedExample(
  topic: IntentCalcTopicKey,
  area: IntentCalcAreaProfile,
  result: IntentCalcResultBlock,
): string {
  if (topic === 'cement-required') {
    return `Worked example: ${area.areaSqft} sq ft × ${RATE_QTY_PER_SQFT.cementBags} bags/sq ft × quality factor ${QUALITY_QTY_FACTOR[result.quality]} ≈ ${result.primaryValue}. This is a whole-house planning total, not a single slab pour.`;
  }
  if (topic === 'steel-required') {
    return `Worked example: ${area.areaSqft} sq ft × ${RATE_QTY_PER_SQFT.steelKg} kg/sq ft × quality factor ${QUALITY_QTY_FACTOR[result.quality]} ≈ ${result.primaryValue}. Replace with BBS totals once structural drawings exist.`;
  }
  return `Worked example: run the cost engine for an independent house of ${area.areaSqft} sq ft, ${result.floors} floors, ${result.quality} quality, national baseline location and 10% contingency → mid estimate ${result.primaryValue} (see range in results).`;
}

function buildFaqs(
  topic: IntentCalcTopicProfile,
  area: IntentCalcAreaProfile,
): Array<{ question: string; answer: string }> {
  return [
    {
      question: `Is the ${topic.intentPhrase} for a ${area.label} house a guaranteed figure?`,
      answer:
        'No. It is an indicative planning estimate for education. Design, soil, finish and local rates change the final number — verify with professionals and dealers.',
    },
    {
      question: 'Why does Varnarc only publish some area sizes?',
      answer:
        'We only index curated topic×area pairs with unique editorial notes and validated calculation logic. We do not generate thousands of combinatorial keyword pages.',
    },
    {
      question: 'Can I change floors or quality?',
      answer:
        'Yes — use the interactive controls on this page or open the full calculator. Defaults are documented in the assumptions list.',
    },
    ...topic.faqExtras,
  ];
}

/**
 * Build a publishable intent-calc landing. Returns null when gated out.
 */
export function buildIntentCalcLanding(input: {
  topic: string;
  area: string;
  floors?: number;
  quality?: ConstructionCostQuality;
}): IntentCalcLanding | null {
  const gate = canIndexIntentCalcLanding(input);
  if (!gate.indexable) return null;
  if (!isIntentCalcTopicKey(input.topic) || !isIntentCalcAreaSlug(input.area)) {
    return null;
  }

  const topic = INTENT_CALC_TOPICS[input.topic];
  const area = INTENT_CALC_AREAS[input.area];
  const pair = getIntentCalcPublishPair(input.topic, input.area)!;
  const floors = input.floors ?? INTENT_CALC_DEFAULT_FLOORS;
  const quality = input.quality ?? INTENT_CALC_DEFAULT_QUALITY;
  const topicKey = topic.key;
  const areaSlug = area.slug;

  const result = computeIntentCalcResult({
    topic: topicKey,
    areaSqft: area.areaSqft,
    floors,
    quality,
  });

  const qualities: ConstructionCostQuality[] = ['basic', 'standard', 'premium'];
  const qualityScenarios = qualities.map((q) =>
    computeIntentCalcResult({
      topic: topicKey,
      areaSqft: area.areaSqft,
      floors,
      quality: q,
    }),
  );

  const relatedHrefs = listIndexableIntentCalcLandings()
    .filter((p) => !(p.topic === topicKey && p.area === areaSlug))
    .filter((p) => p.topic === topicKey || p.area === areaSlug)
    .slice(0, 8)
    .map((p) => ({
      href: p.path,
      label:
        p.topic === topicKey
          ? `${topic.label} · ${INTENT_CALC_AREAS[p.area].label}`
          : `${INTENT_CALC_TOPICS[p.topic].label} · ${area.label}`,
    }));

  const calculatorDeepLink =
    topicKey === 'construction-cost'
      ? `${topic.calculatorHref}?builtUpArea=${area.areaSqft}&floors=${floors}&quality=${quality}`
      : topic.calculatorHref;

  return {
    topic,
    area,
    canonicalPath: `/construction/calc/${topicKey}/${areaSlug}`,
    h1: fillArea(topic.h1Template, area.label),
    title: fillArea(topic.titleTemplate, area.label),
    description: fillArea(topic.descriptionTemplate, area.label),
    editorialIntro: topic.editorialIntro,
    sizeNote: area.sizeNote,
    pairNote: pair.pairNote,
    methodology: INTENT_CALC_METHODOLOGY,
    qualification: INTENT_CALC_QUALIFICATION,
    assumptions: buildAssumptions(topicKey, area, floors, quality),
    result,
    qualityScenarios,
    workedExample: buildWorkedExample(topicKey, area, result),
    faqs: buildFaqs(topic, area),
    relatedHrefs,
    internalLinks: [
      { href: calculatorDeepLink, label: topic.calculatorLabel },
      { href: '/construction/prices', label: 'Material prices hub' },
      { href: '/construction/construction-cost', label: 'City construction cost' },
      { href: '/construction/calc', label: 'All calculation landings' },
      { href: '/construction/cost-index', label: 'Varnarc cost index (VCCI)' },
    ],
    calculatorHref: calculatorDeepLink,
    calculatorLabel: topic.calculatorLabel,
    interactiveDefaults: {
      areaSqft: area.areaSqft,
      floors,
      quality,
      topic: topicKey,
    },
    indexable: true,
    version: INTENT_CALC_LANDING_VERSION,
    costEngineVersion: COST_CALC_VERSION,
  };
}
