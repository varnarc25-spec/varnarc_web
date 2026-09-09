/** Static content for the Construction intent-first landing page. */

import { listPriceHubLocations, listQuickEstimatorLocations } from '@varnarc/validation';
import { askResultsPath, resolveAskConstructionQuery } from '@/lib/construction/ask';

export const LANDING_SEARCH_EXAMPLES = [
  {
    label: 'Cost to build 1500 sqft house',
    href: '/construction/cost/1500-sq-ft',
  },
  {
    label: 'Cement required for 1200 sqft',
    href: '/construction/cement-calculator',
  },
  {
    label: 'Compare AAC blocks vs bricks',
    href: '/construction/compare',
  },
  {
    label: 'Paint required for 3 bedrooms',
    href: '/construction/paint-calculator',
  },
] as const;

export type ConstructionIntentKey =
  | 'build_home'
  | 'renovate'
  | 'know_cost'
  | 'calculate_materials'
  | 'create_boq'
  | 'compare_materials'
  | 'local_prices'
  | 'plan_timeline';

export type ConstructionIntentNextAction = {
  key: string;
  label: string;
  description?: string;
  href: string;
};

export type ConstructionIntentDefinition = {
  key: ConstructionIntentKey;
  title: string;
  description: string;
  /** Short label for compact mobile chips */
  shortTitle: string;
  nextActions: ConstructionIntentNextAction[];
};

/**
 * Intent navigator — selection reveals relevant next actions (not a generic directory dump).
 * URL mirror: `?intent=<key>` (noindex via CONSTRUCTION_FILTER_QUERY_KEYS).
 */
export const CONSTRUCTION_INTENT_NAVIGATOR: ConstructionIntentDefinition[] = [
  {
    key: 'build_home',
    title: 'Build a new home',
    shortTitle: 'New home',
    description: 'Plan a new house from cost to BOQ.',
    nextActions: [
      {
        key: 'estimate_cost',
        label: 'Estimate cost',
        description: 'Get an indicative build cost range.',
        href: '/construction/cost-calculator',
      },
      {
        key: 'start_project',
        label: 'Start a construction project',
        description: 'Save plans in your project workspace.',
        href: '/construction/projects',
      },
      {
        key: 'calculate_materials',
        label: 'Calculate materials',
        description: 'Size cement, steel, brick and more.',
        href: '/construction/cement-calculator',
      },
      {
        key: 'generate_boq',
        label: 'Generate BOQ',
        description: 'Organise quantities for quotes.',
        href: '/construction/boq',
      },
    ],
  },
  {
    key: 'renovate',
    title: 'Renovate',
    shortTitle: 'Renovate',
    description: 'Budget rooms, finishes and rework.',
    nextActions: [
      {
        key: 'estimate_reno',
        label: 'Estimate renovation cost',
        description: 'Quick range by area and quality.',
        href: '/construction/renovation-cost-calculator',
      },
      {
        key: 'paint_calc',
        label: 'Paint calculator',
        description: 'Coverage for rooms and walls.',
        href: '/construction/paint-calculator',
      },
      {
        key: 'tile_calc',
        label: 'Tile calculator',
        description: 'Floor and wall tile quantities.',
        href: '/construction/tile-calculator',
      },
      {
        key: 'reno_checklist',
        label: 'Renovation checklist',
        description: 'Phase-wise tasks before you start.',
        href: '/construction/checklists',
      },
    ],
  },
  {
    key: 'know_cost',
    title: 'Know construction cost',
    shortTitle: 'Know cost',
    description: 'See an indicative project cost range.',
    nextActions: [
      {
        key: 'quick_estimate',
        label: 'Quick estimate',
        description: 'Area, floors and quality → range.',
        href: '/construction#quick-estimator',
      },
      {
        key: 'cost_by_area',
        label: 'Cost by house size',
        description: '1500 sq ft and other common built-up areas.',
        href: '/construction/cost',
      },
      {
        key: 'full_estimator',
        label: 'Full cost calculator',
        description: 'Location, quality, features and breakdown.',
        href: '/construction/cost-calculator',
      },
      {
        key: 'cost_by_city',
        label: 'Cost by city',
        description: 'Start with a city context.',
        href: '/construction#cost-by-city',
      },
      {
        key: 'affordability',
        label: 'Check affordability',
        description: 'Match budget to savings and loan.',
        href: '/construction/affordability-calculator',
      },
    ],
  },
  {
    key: 'calculate_materials',
    title: 'Calculate materials',
    shortTitle: 'Materials',
    description: 'Quantity tools for core building materials.',
    nextActions: [
      {
        key: 'material-qty',
        label: 'Material quantities',
        href: '/construction/material-calculator',
      },
      { key: 'cement', label: 'Cement', href: '/construction/cement-calculator' },
      { key: 'concrete', label: 'Concrete', href: '/construction/concrete-calculator' },
      { key: 'rcc', label: 'RCC', href: '/construction/rcc-calculator' },
      { key: 'steel', label: 'Steel', href: '/construction/steel-calculator' },
      {
        key: 'bbs',
        label: 'Bar bending schedule',
        href: '/construction/bar-bending-schedule',
      },
      { key: 'bricks', label: 'Bricks', href: '/construction/brick-calculator' },
      { key: 'aac', label: 'AAC blocks', href: '/construction/aac-block-calculator' },
      { key: 'sand', label: 'Sand', href: '/construction/sand-calculator' },
      { key: 'aggregate', label: 'Aggregate', href: '/construction/aggregate-calculator' },
      { key: 'plaster', label: 'Plaster', href: '/construction/plaster-calculator' },
      { key: 'tiles', label: 'Tiles', href: '/construction/tile-calculator' },
      { key: 'flooring', label: 'Flooring', href: '/construction/flooring-calculator' },
      { key: 'paint', label: 'Paint', href: '/construction/paint-calculator' },
    ],
  },
  {
    key: 'create_boq',
    title: 'Create a BOQ',
    shortTitle: 'BOQ',
    description: 'Structure quantities for quoting and tracking.',
    nextActions: [
      {
        key: 'create_project',
        label: 'Create a project',
        description: 'Guided setup for name, size, quality and budget.',
        href: '/construction/project/new',
      },
      {
        key: 'open_boq',
        label: 'Open BOQ Generator',
        description: 'Build or generate an indicative planning BOQ.',
        href: '/construction/boq',
      },
      {
        key: 'bbs',
        label: 'Bar bending schedule',
        description: 'Organise rebar quantities from drawings.',
        href: '/construction/bar-bending-schedule',
      },
      {
        key: 'estimate_first',
        label: 'Estimate first',
        description: 'Seed costs before detailing the BOQ.',
        href: '/construction/cost-calculator',
      },
      {
        key: 'material_calcs',
        label: 'Material calculators',
        description: 'Fill quantities from calculators.',
        href: '/construction/cement-calculator',
      },
      {
        key: 'save_project',
        label: 'Save to a project',
        description: 'Keep the BOQ with your workspace.',
        href: '/construction/projects',
      },
    ],
  },
  {
    key: 'compare_materials',
    title: 'Compare materials',
    shortTitle: 'Compare',
    description: 'Side-by-side specs and price cues.',
    nextActions: [
      {
        key: 'open_compare',
        label: 'Open compare tool',
        description: 'Select materials to compare.',
        href: '/construction/compare',
      },
      {
        key: 'scenario_compare',
        label: 'Compare build scenarios',
        description: 'Quality, city, floors and area side by side.',
        href: '/construction/scenario-compare',
      },
      {
        key: 'browse_materials',
        label: 'Browse materials',
        description: 'Pick candidates from the catalogue.',
        href: '/construction/materials',
      },
      {
        key: 'compare_guide',
        label: 'Comparison guides',
        description: 'Learn what to weigh up.',
        href: '/construction/guides',
      },
    ],
  },
  {
    key: 'local_prices',
    title: 'Check local material prices',
    shortTitle: 'Local prices',
    description: 'Indicative rates and supplier discovery.',
    nextActions: [
      {
        key: 'material_prices',
        label: 'Browse construction prices',
        description: 'City × material reference rates with freshness.',
        href: '/construction/prices',
      },
      {
        key: 'suppliers',
        label: 'Find suppliers',
        description: 'Material dealers and related trades.',
        href: '/construction/suppliers',
      },
      {
        key: 'professionals',
        label: 'Find professionals',
        description: 'Contractors, architects, engineers and designers.',
        href: '/construction/professionals',
      },
      {
        key: 'prices_section',
        label: 'Prices near you',
        description: 'Jump to the landing price strip.',
        href: '/construction#prices-near-you',
      },
      {
        key: 'city_estimate',
        label: 'Estimate with city',
        description: 'Cost range with a city context.',
        href: '/construction#cost-by-city',
      },
    ],
  },
  {
    key: 'plan_timeline',
    title: 'Plan project timeline',
    shortTitle: 'Timeline',
    description: 'Phases, checklists and project schedule.',
    nextActions: [
      {
        key: 'timeline_planner',
        label: 'Timeline planner',
        description: 'Estimated phases from start date and size.',
        href: '/construction/timeline-planner',
      },
      {
        key: 'project_readiness',
        label: 'Project readiness checker',
        description: 'Score planning gaps before you build.',
        href: '/construction/project-readiness',
      },
      {
        key: 'checklists',
        label: 'Phase checklists',
        description: 'Foundation to handover tasks.',
        href: '/construction/checklists',
      },
      {
        key: 'projects',
        label: 'My projects',
        description: 'Continue a saved plan.',
        href: '/construction/projects',
      },
      {
        key: 'guides',
        label: 'Planning guides',
        description: 'Read phase-wise advice.',
        href: '/construction/guides',
      },
    ],
  },
];

export const CONSTRUCTION_INTENT_KEYS: ConstructionIntentKey[] = CONSTRUCTION_INTENT_NAVIGATOR.map(
  (i) => i.key,
);

/** @deprecated Prefer CONSTRUCTION_INTENT_NAVIGATOR */
export const LANDING_INTENTS = CONSTRUCTION_INTENT_NAVIGATOR.map((intent) => ({
  key: intent.key,
  title: intent.title,
  description: intent.description,
  href: intent.nextActions[0]?.href ?? '/construction',
}));

export function getConstructionIntent(key: string | null | undefined) {
  if (!key) return null;
  return CONSTRUCTION_INTENT_NAVIGATOR.find((i) => i.key === key) ?? null;
}

export function isConstructionIntentKey(
  value: string | null | undefined,
): value is ConstructionIntentKey {
  return Boolean(value && CONSTRUCTION_INTENT_KEYS.includes(value as ConstructionIntentKey));
}

export const LANDING_JOURNEY = [
  {
    key: 'estimate',
    title: 'Estimate',
    description: 'Calculate cost & materials',
    href: '/construction/cost-calculator',
  },
  {
    key: 'materials',
    title: 'Materials',
    description: 'Finalize quantities',
    href: '/construction/material-calculator',
  },
  {
    key: 'boq',
    title: 'BOQ',
    description: 'Generate detailed BOQ',
    href: '/construction/boq',
  },
  {
    key: 'timeline',
    title: 'Timeline',
    description: 'Plan construction schedule',
    href: '/construction/timeline-planner',
  },
  {
    key: 'budget',
    title: 'Budget',
    description: 'Track expenses',
    href: '/construction/budget-tracker',
  },
  {
    key: 'documents',
    title: 'Documents',
    description: 'Save and manage files',
    href: '/construction/document-vault',
  },
  {
    key: 'selector',
    title: 'Selector',
    description: 'Task-based material categories to consider.',
    href: '/construction/material-selector',
  },
] as const;

export const LANDING_CITIES = listPriceHubLocations();

export const LANDING_WHY = [
  {
    title: 'Transparent estimates',
    description: 'See assumptions and ranges — not opaque single numbers.',
  },
  {
    title: 'Connected tools',
    description: 'Move from cost → materials → compare → plan in one place.',
  },
  {
    title: 'Practical guides',
    description: 'Phase-wise checklists and plain-language construction help.',
  },
  {
    title: 'Local context',
    description: 'Indicative prices and supplier discovery for your region.',
  },
] as const;

export const LANDING_FALLBACK_FAQS = [
  {
    id: 'faq-cost',
    question: 'How accurate are Varnarc construction cost estimates?',
    answer:
      'Estimates are indicative planning ranges based on area, quality and location factors. Confirm rates with local contractors and suppliers before you budget.',
  },
  {
    id: 'faq-materials',
    question: 'Can I calculate cement, steel, brick, tile and paint quantities?',
    answer:
      'Yes. Start from the material calculator for a whole-house sketch, then refine with cement, steel, concrete, brick, tile and paint calculators. Each result shows the assumptions to review.',
  },
  {
    id: 'faq-boq',
    question: 'What is a BOQ and how does Varnarc help?',
    answer:
      'A Bill of Quantities lists materials and work items for quoting and tracking. The BOQ Generator produces an indicative planning BOQ. It is not a professional tender document.',
  },
  {
    id: 'faq-city',
    question: 'Can I see construction cost by city?',
    answer:
      'City pages are published when local editorial notes and material observations exist. Open Construction cost by city, then verify rates with suppliers. Figures are not live dealer prices.',
  },
] as const;

export const LANDING_SEO_INTRO =
  'Use Varnarc to plan a house in a sensible order: estimate construction cost, size materials, refine cement and steel, generate a planning BOQ, check cost by city, then talk to professionals. Every figure is indicative until you verify it locally.';

/** Crawlable Phase 2 tools for the hub — real hrefs, not a keyword dump. */
export const PHASE2_HUB_TOOLS = [
  {
    href: '/construction/cost-calculator',
    label: 'Construction Cost Calculator',
    note: 'Indicative build cost from area, quality and location.',
  },
  {
    href: '/construction/cement-calculator',
    label: 'Cement Calculator',
    note: 'Bags and mix for concrete, mortar and plaster.',
  },
  {
    href: '/construction/steel-calculator',
    label: 'Steel Calculator',
    note: 'TMT / rebar weight from diameter and length.',
  },
  {
    href: '/construction/concrete-calculator',
    label: 'Concrete Calculator',
    note: 'Volume and mix for slabs, beams and footings.',
  },
  {
    href: '/construction/brick-calculator',
    label: 'Brick Calculator',
    note: 'Wall quantities with wastage you can review.',
  },
  {
    href: '/construction/tile-calculator',
    label: 'Tile Calculator',
    note: 'Floor and wall tile area and boxes.',
  },
  {
    href: '/construction/paint-calculator',
    label: 'Paint Calculator',
    note: 'Coverage for interiors and exteriors.',
  },
  {
    href: '/construction/material-calculator',
    label: 'Material Calculator',
    note: 'Whole-house cement, steel, sand, brick and finishes.',
  },
  {
    href: '/construction/boq',
    label: 'BOQ Generator',
    note: 'Planning bill of quantities — not a tender BOQ.',
  },
  {
    href: '/construction/renovation-cost-calculator',
    label: 'Renovation Calculator',
    note: 'Kitchen, bathroom, paint and flooring packages.',
  },
  {
    href: '/construction/prices',
    label: 'Construction Prices',
    note: 'Indicative material rates when observations exist.',
  },
  {
    href: '/construction/construction-cost',
    label: 'Construction by City',
    note: 'City cost pages with local notes and freshness.',
  },
  {
    href: '/construction/guides',
    label: 'Construction Guides',
    note: 'Practical reading for estimates, materials and site phases.',
  },
] as const;

export const QUICK_ESTIMATOR_LOCATIONS = listQuickEstimatorLocations();

/** Map free-text landing search to a useful Construction destination. */
export function resolveConstructionLandingSearch(query: string): string {
  const decision = resolveAskConstructionQuery(query);
  if (decision.autoRoute && decision.href) return decision.href;
  if (decision.results[0]?.href && decision.parse.confidence >= 0.55) {
    return decision.results[0].href;
  }
  return askResultsPath(query);
}
