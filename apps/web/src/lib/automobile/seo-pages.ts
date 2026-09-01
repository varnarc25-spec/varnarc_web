import { getAutomobileCategory } from '@varnarc/validation';

export const AUTOMOBILE_PAGE_KEYS = [
  'hub',
  'vehicles',
  'manufacturers',
  'compare',
  'comparisons',
  'guides',
  'faqs',
  'maintenance',
  'dealers',
  'reviews',
  'calculators',
  'suv',
  'hatchback',
  'sedan',
  'mpv',
  'ev',
  'bikes',
  'used-cars',
  'specifications',
  'prices',
  'safety',
  'calc-car-loan',
  'calc-fuel',
  'calc-mileage',
  'calc-car-insurance',
  'calc-depreciation',
  'calc-maintenance-cost',
  'calc-resale-value',
  'calc-tco',
  'calc-road-tax',
  'calc-on-road-price',
  'calc-charging-cost',
  'calc-range',
  'calc-ev-vs-petrol',
] as const;

export type AutomobilePageKey = (typeof AUTOMOBILE_PAGE_KEYS)[number];

export type AutomobilePageSeoDefaults = {
  path: string;
  label: string;
  title: string;
  description: string;
  h1: string;
  /** Whether the route is generally indexable when unfiltered. */
  indexable: boolean;
};

export const AUTOMOBILE_PAGE_DEFAULTS: Record<AutomobilePageKey, AutomobilePageSeoDefaults> = {
  hub: {
    path: '/automobile',
    label: 'Automobile',
    title: 'Cars, SUVs & Bikes — Prices, EMI & Ownership Tools | Varnarc',
    description:
      'Browse vehicles by body type, compare specs, and plan ownership with EMI, fuel, insurance and maintenance calculators. Indicative India market information — not a dealer quote.',
    h1: 'Automobile tools, comparisons & ownership guides',
    indexable: true,
  },
  vehicles: {
    path: '/automobile/vehicles',
    label: 'Vehicles',
    title: 'Vehicles in India — Specs, Prices & Ownership | Varnarc',
    description:
      'Browse cars, SUVs, sedans, EVs and two-wheelers with indicative prices and specs. Compare models and plan EMI — educational only.',
    h1: 'Vehicles',
    indexable: true,
  },
  manufacturers: {
    path: '/automobile/manufacturers',
    label: 'Manufacturers',
    title: 'Car & Bike Manufacturers in India | Varnarc',
    description:
      'Explore manufacturer lineups, model ranges and brand pages. Pair with comparisons and ownership calculators before you buy.',
    h1: 'Manufacturers',
    indexable: true,
  },
  compare: {
    path: '/automobile/compare',
    label: 'Compare',
    title: 'Compare Cars Side by Side — Specs & Prices | Varnarc',
    description:
      'Compare vehicles on price, fuel, mileage and seating. Select models to evaluate ownership trade-offs — not a sales offer.',
    h1: 'Compare vehicles',
    indexable: true,
  },
  comparisons: {
    path: '/automobile/comparisons',
    label: 'Comparisons',
    title: 'Car Comparisons — Curated Match-ups | Varnarc',
    description:
      'Editorial vehicle comparisons with specs and pricing context. Use alongside EMI and fuel calculators for ownership planning.',
    h1: 'Curated comparisons',
    indexable: true,
  },
  guides: {
    path: '/automobile/guides',
    label: 'Guides',
    title: 'Car Buying & Ownership Guides | Varnarc',
    description:
      'Practical guides on buying, financing and owning a vehicle in India. Educational content — verify with dealers and lenders.',
    h1: 'Automobile guides',
    indexable: true,
  },
  faqs: {
    path: '/automobile/faqs',
    label: 'FAQs',
    title: 'Automobile FAQs — Buying, EMI & Ownership | Varnarc',
    description:
      'Answers on vehicle prices, EMI, insurance and ownership costs. Indicative guidance for India buyers.',
    h1: 'Automobile FAQs',
    indexable: true,
  },
  maintenance: {
    path: '/automobile/maintenance',
    label: 'Maintenance',
    title: 'Vehicle Maintenance Schedules & Cost Estimates | Varnarc',
    description:
      'Service interval context and indicative maintenance costs. Pair with the maintenance cost calculator — not a workshop quote.',
    h1: 'Maintenance',
    indexable: true,
  },
  dealers: {
    path: '/automobile/dealers',
    label: 'Dealers',
    title: 'Car Dealers & Showrooms Directory | Varnarc',
    description:
      'Find dealer and showroom listings linked from the directory. Confirm inventory and offers directly with the seller.',
    h1: 'Dealers',
    indexable: true,
  },
  reviews: {
    path: '/automobile/reviews',
    label: 'Reviews',
    title: 'Car & Bike Reviews | Varnarc',
    description:
      'Expert and editorial vehicle reviews with ownership context. Combine with specs and calculators before deciding.',
    h1: 'Reviews',
    indexable: true,
  },
  calculators: {
    path: '/automobile/calculators',
    label: 'Calculators',
    title: 'Car Ownership Calculators — EMI, Fuel & Insurance | Varnarc',
    description:
      'Plan vehicle ownership with EMI, fuel, mileage, insurance, depreciation and maintenance calculators. Free indicative tools.',
    h1: 'Automobile calculators',
    indexable: true,
  },
  suv: {
    path: '/automobile/suv',
    label: 'SUVs',
    title: 'Best SUVs in India — Prices, Specs & Comparisons | Varnarc',
    description:
      'Browse SUVs with indicative ex-showroom prices, fuel type, mileage and ownership calculators. Compare models before you buy.',
    h1: 'SUVs in India',
    indexable: true,
  },
  hatchback: {
    path: '/automobile/hatchback',
    label: 'Hatchbacks',
    title: 'Hatchbacks in India — Prices, Mileage & Specs | Varnarc',
    description:
      'Explore hatchbacks with price ranges, mileage and ownership tools. Plan EMI and fuel cost before buying.',
    h1: 'Hatchbacks in India',
    indexable: true,
  },
  sedan: {
    path: '/automobile/sedan',
    label: 'Sedans',
    title: 'Sedans in India — Prices, Specs & Ownership Cost | Varnarc',
    description:
      'Browse sedans with indicative prices, specs and ownership calculators. Compare comfort, mileage and EMI.',
    h1: 'Sedans in India',
    indexable: true,
  },
  mpv: {
    path: '/automobile/mpv',
    label: 'MPVs',
    title: 'MPVs & Family Cars in India — Prices & Specs | Varnarc',
    description:
      'Find MPVs and people-movers with seating, price context and ownership tools. Plan family transport costs.',
    h1: 'MPVs in India',
    indexable: true,
  },
  ev: {
    path: '/automobile/ev',
    label: 'EVs',
    title: 'Electric Cars in India — EV Prices, Range & Ownership | Varnarc',
    description:
      'Browse electric vehicles with indicative prices and ownership planning tools. Charging, range and EMI context.',
    h1: 'Electric vehicles in India',
    indexable: true,
  },
  bikes: {
    path: '/automobile/bikes',
    label: 'Bikes',
    title: 'Bikes in India — Prices & Specs | Varnarc',
    description:
      'Explore motorcycles with indicative prices and ownership tools. Compare mileage and plan EMI.',
    h1: 'Bikes in India',
    indexable: true,
  },
  'used-cars': {
    path: '/automobile/used-cars',
    label: 'Used cars',
    title: 'Used Cars — Dealers & Ownership Tools | Varnarc',
    description:
      'Varnarc is not a classifieds marketplace. Find used-car dealers in the directory and plan resale with ownership tools.',
    h1: 'Used cars',
    indexable: true,
  },
  specifications: {
    path: '/automobile/specifications',
    label: 'Specifications',
    title: 'Car Specifications — Compare Model Specs | Varnarc',
    description:
      'Browse published vehicle specifications and open model pages for detailed specs. Educational catalogue only.',
    h1: 'Vehicle specifications',
    indexable: true,
  },
  prices: {
    path: '/automobile/prices',
    label: 'Prices',
    title: 'Car Prices in India — Indicative Ex-Showroom | Varnarc',
    description:
      'Indicative ex-showroom and estimated on-road figures where published. Confirm city on-road price with a dealer.',
    h1: 'Vehicle prices',
    indexable: true,
  },
  safety: {
    path: '/automobile/safety',
    label: 'Safety',
    title: 'Car Safety Ratings & Context | Varnarc',
    description:
      'Safety ratings when published on vehicle records. We do not invent NCAP scores — missing ratings stay blank.',
    h1: 'Vehicle safety',
    indexable: true,
  },
  'calc-car-loan': {
    path: '/automobile/calculators/car-loan',
    label: 'Car loan EMI',
    title: 'Car Loan EMI Calculator — Monthly Payment Planner | Varnarc',
    description:
      'Estimate car loan EMI from on-road price, down payment, rate and tenure. Free India ownership planner — not a loan offer.',
    h1: 'Car loan EMI calculator',
    indexable: true,
  },
  'calc-fuel': {
    path: '/automobile/calculators/fuel',
    label: 'Fuel cost',
    title: 'Fuel Cost Calculator — Monthly Running Cost | Varnarc',
    description:
      'Estimate monthly fuel spend from mileage, distance and fuel price. Plan ownership costs before you buy.',
    h1: 'Fuel cost calculator',
    indexable: true,
  },
  'calc-mileage': {
    path: '/automobile/calculators/mileage',
    label: 'Mileage',
    title: 'Mileage Calculator — km/l & Running Efficiency | Varnarc',
    description:
      'Calculate fuel efficiency from distance and fuel used. Compare claimed vs real-world mileage for ownership planning.',
    h1: 'Mileage calculator',
    indexable: true,
  },
  'calc-car-insurance': {
    path: '/automobile/calculators/car-insurance',
    label: 'Car insurance',
    title: 'Car Insurance Estimator — Premium Planning | Varnarc',
    description:
      'Estimate indicative car insurance premiums for ownership budgeting. Verify final quotes with insurers.',
    h1: 'Car insurance estimator',
    indexable: true,
  },
  'calc-depreciation': {
    path: '/automobile/calculators/depreciation',
    label: 'Depreciation',
    title: 'Car Depreciation Calculator — Resale Value Planner | Varnarc',
    description:
      'Estimate vehicle value decline over years for total cost of ownership. Indicative only — markets vary.',
    h1: 'Depreciation calculator',
    indexable: true,
  },
  'calc-maintenance-cost': {
    path: '/automobile/calculators/maintenance-cost',
    label: 'Maintenance cost',
    title: 'Car Maintenance Cost Estimator | Varnarc',
    description:
      'Plan annual service and maintenance spend alongside EMI and fuel. Educational estimates — not a workshop bill.',
    h1: 'Maintenance cost estimator',
    indexable: true,
  },
  'calc-resale-value': {
    path: '/automobile/calculators/resale-value',
    label: 'Resale value',
    title: 'Car Resale Value Planner | Varnarc',
    description:
      'Estimate remaining value after depreciation for ownership planning. Markets vary — not an appraisal.',
    h1: 'Resale value planner',
    indexable: true,
  },
  'calc-tco': {
    path: '/automobile/calculators/tco',
    label: 'Total cost of ownership',
    title: 'Car Total Cost of Ownership Calculator | Varnarc',
    description:
      'Combine EMI, fuel, insurance, service and resale for an indicative ownership cost. Educational only.',
    h1: 'Total cost of ownership',
    indexable: true,
  },
  'calc-road-tax': {
    path: '/automobile/calculators/road-tax',
    label: 'Road tax',
    title: 'Car Road Tax Estimator | Varnarc',
    description:
      'Indicative road tax from ex-showroom price and a state rate you enter. Actual RTO slabs differ by state.',
    h1: 'Road tax estimator',
    indexable: true,
  },
  'calc-on-road-price': {
    path: '/automobile/calculators/on-road-price',
    label: 'On-road price',
    title: 'On-road Price Calculator | Varnarc',
    description:
      'Add RTO, insurance and handling to ex-showroom for a planning on-road figure. Not a dealer quotation.',
    h1: 'On-road price calculator',
    indexable: true,
  },
  'calc-charging-cost': {
    path: '/automobile/calculators/charging-cost',
    label: 'Charging cost',
    title: 'EV Charging Cost Calculator | Varnarc',
    description:
      'Estimate electricity spend from km, efficiency and tariff. Not a charging-station tariff quote.',
    h1: 'EV charging cost calculator',
    indexable: true,
  },
  'calc-range': {
    path: '/automobile/calculators/range',
    label: 'Range calculator',
    title: 'EV Range Calculator | Varnarc',
    description:
      'Estimate driving range from usable battery and consumption. Real-world range varies with speed and climate.',
    h1: 'EV range calculator',
    indexable: true,
  },
  'calc-ev-vs-petrol': {
    path: '/automobile/calculators/ev-vs-petrol',
    label: 'EV vs petrol',
    title: 'EV vs Petrol Running Cost | Varnarc',
    description:
      'Compare indicative monthly energy cost for EV vs petrol using your kilometres and local prices.',
    h1: 'EV vs petrol running cost',
    indexable: true,
  },
};

export const AUTOMOBILE_CALC_PATH_SLUG: Record<
  Extract<AutomobilePageKey, `calc-${string}`>,
  string
> = {
  'calc-car-loan': 'car-loan',
  'calc-fuel': 'fuel',
  'calc-mileage': 'mileage',
  'calc-car-insurance': 'car-insurance',
  'calc-depreciation': 'depreciation',
  'calc-maintenance-cost': 'maintenance-cost',
  'calc-resale-value': 'resale-value',
  'calc-tco': 'tco',
  'calc-road-tax': 'road-tax',
  'calc-on-road-price': 'on-road-price',
  'calc-charging-cost': 'charging-cost',
  'calc-range': 'range',
  'calc-ev-vs-petrol': 'ev-vs-petrol',
};

/** API calculator slug when a seeded engine exists; landings may also use a built-in tool. */
export const AUTOMOBILE_CALC_TOOL_SLUG: Record<
  Extract<AutomobilePageKey, `calc-${string}`>,
  string
> = {
  'calc-car-loan': 'car-loan',
  'calc-fuel': 'fuel',
  'calc-mileage': 'mileage',
  'calc-car-insurance': 'car-insurance',
  'calc-depreciation': 'depreciation',
  'calc-maintenance-cost': 'maintenance-cost',
  'calc-resale-value': 'depreciation',
  'calc-tco': 'tco',
  'calc-road-tax': 'road-tax',
  'calc-on-road-price': 'on-road-price',
  'calc-charging-cost': 'charging-cost',
  'calc-range': 'range',
  'calc-ev-vs-petrol': 'ev-vs-petrol',
};

export function getAutomobileLandingDefaults(slug: string): AutomobilePageSeoDefaults | null {
  if ((AUTOMOBILE_PAGE_KEYS as readonly string[]).includes(slug)) {
    return AUTOMOBILE_PAGE_DEFAULTS[slug as AutomobilePageKey];
  }
  const category = getAutomobileCategory(slug);
  if (!category) return null;
  return {
    path: category.path,
    label: category.name,
    title: category.title,
    description: category.description,
    h1: category.h1,
    indexable: true,
  };
}

export function automobileCalcPageKeyFromSlug(
  slug: string,
): Extract<AutomobilePageKey, `calc-${string}`> | null {
  const entry = Object.entries(AUTOMOBILE_CALC_PATH_SLUG).find(([, s]) => s === slug);
  return (entry?.[0] as Extract<AutomobilePageKey, `calc-${string}`>) ?? null;
}
