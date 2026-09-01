/**
 * Automobile category SEO landings — body-type / fuel hubs for high Google demand.
 * Pages must filter published vehicles; thin empty hubs stay noindex at the page layer.
 */

export const AUTOMOBILE_CATEGORY_SLUGS = [
  'suv',
  'hatchback',
  'sedan',
  'mpv',
  'ev',
  'bikes',
] as const;

export type AutomobileCategorySlug = (typeof AUTOMOBILE_CATEGORY_SLUGS)[number];

export type AutomobileCategoryDef = {
  slug: AutomobileCategorySlug;
  name: string;
  path: string;
  title: string;
  description: string;
  h1: string;
  /** Prisma list filter: bodyType or fuelType */
  filter: { bodyType?: string; fuelType?: string; category?: string };
  /** Extra bodyType values accepted when matching DB rows client-side */
  bodyTypeAliases?: string[];
  faqs: Array<{ question: string; answer: string }>;
};

export const AUTOMOBILE_CATEGORIES: Record<AutomobileCategorySlug, AutomobileCategoryDef> = {
  suv: {
    slug: 'suv',
    name: 'SUVs',
    path: '/automobile/suv',
    title: 'Best SUVs in India — Prices, Specs & Comparisons | Varnarc',
    description:
      'Browse SUVs with indicative ex-showroom prices, fuel type, mileage and ownership calculators. Compare models before you buy — educational only, not a dealer quote.',
    h1: 'SUVs in India',
    filter: { bodyType: 'SUV' },
    bodyTypeAliases: ['suv', 'crossover', 'muv'],
    faqs: [
      {
        question: 'Are the SUV prices on Varnarc on-road prices?',
        answer:
          'Listed figures are typically ex-showroom or estimated on-road where published. Final on-road cost varies by city (RTO, insurance, dealer charges). Use our ownership calculators for planning.',
      },
      {
        question: 'How should I compare SUVs?',
        answer:
          'Compare seating, fuel type, mileage claims, safety rating and ownership cost (EMI + fuel + maintenance), not list price alone. Curated comparison pages and the compare tool help side-by-side checks.',
      },
    ],
  },
  hatchback: {
    slug: 'hatchback',
    name: 'Hatchbacks',
    path: '/automobile/hatchback',
    title: 'Hatchbacks in India — Prices, Mileage & Specs | Varnarc',
    description:
      'Explore hatchbacks with price ranges, mileage and ownership tools. Plan EMI and fuel cost before buying — indicative information only.',
    h1: 'Hatchbacks in India',
    filter: { bodyType: 'Hatchback' },
    bodyTypeAliases: ['hatchback', 'hatch'],
    faqs: [
      {
        question: 'Why are hatchbacks popular in India?',
        answer:
          'Hatchbacks often balance city manoeuvrability, running cost and parking ease. Always verify current dealer offers and RTO charges for your city.',
      },
      {
        question: 'Can I estimate hatchback EMI on Varnarc?',
        answer:
          'Yes — use the Car Loan EMI calculator with an indicative on-road amount, down payment and tenure. Results are educational, not a loan offer.',
      },
    ],
  },
  sedan: {
    slug: 'sedan',
    name: 'Sedans',
    path: '/automobile/sedan',
    title: 'Sedans in India — Prices, Specs & Ownership Cost | Varnarc',
    description:
      'Browse sedans with indicative prices, specs and ownership calculators. Compare comfort, mileage and EMI — not a substitute for a dealer quotation.',
    h1: 'Sedans in India',
    filter: { bodyType: 'Sedan' },
    bodyTypeAliases: ['sedan', 'saloon'],
    faqs: [
      {
        question: 'How do sedan prices differ by city?',
        answer:
          'Road tax, registration and insurance vary by state and city. Use ex-showroom as a base and estimate on-road separately for your location.',
      },
      {
        question: 'What should I check besides price?',
        answer:
          'Boot space, rear seat comfort, safety features, service network and 5-year ownership cost (fuel, insurance, maintenance) matter as much as the sticker price.',
      },
    ],
  },
  mpv: {
    slug: 'mpv',
    name: 'MPVs',
    path: '/automobile/mpv',
    title: 'MPVs & Family Cars in India — Prices & Specs | Varnarc',
    description:
      'Find MPVs and people-movers with seating, price context and ownership tools. Plan family transport costs with EMI and fuel calculators.',
    h1: 'MPVs in India',
    filter: { bodyType: 'MPV' },
    bodyTypeAliases: ['mpv', 'muv', 'minivan'],
    faqs: [
      {
        question: 'What is an MPV?',
        answer:
          'Multi-purpose vehicles prioritise passenger space and flexible seating. Confirm third-row usability and luggage space with a physical visit when possible.',
      },
      {
        question: 'How do I estimate running cost for an MPV?',
        answer:
          'Use the fuel cost and mileage calculators with your monthly km and fuel price. Add insurance and maintenance for a fuller ownership picture.',
      },
    ],
  },
  ev: {
    slug: 'ev',
    name: 'Electric vehicles',
    path: '/automobile/ev',
    title: 'Electric Cars in India — EV Prices, Range & Ownership | Varnarc',
    description:
      'Browse electric vehicles with indicative prices and ownership planning tools. Charging, range and EMI context — educational only.',
    h1: 'Electric vehicles in India',
    filter: { fuelType: 'Electric' },
    faqs: [
      {
        question: 'Are EV prices on Varnarc inclusive of subsidies?',
        answer:
          'Published prices may or may not reflect state incentives. Always confirm current subsidy eligibility and dealer net price locally.',
      },
      {
        question: 'How should I plan EV ownership cost?',
        answer:
          'Compare electricity cost vs petrol/diesel using realistic km/month, plus insurance and battery warranty terms. EMI calculators help with financed purchases.',
      },
    ],
  },
  bikes: {
    slug: 'bikes',
    name: 'Bikes & scooters',
    path: '/automobile/bikes',
    title: 'Bikes & Scooters in India — Prices & Specs | Varnarc',
    description:
      'Explore two-wheelers with indicative prices and ownership tools. Compare mileage and plan EMI — not a dealer quotation.',
    h1: 'Bikes and scooters in India',
    filter: { bodyType: 'Motorcycle' },
    bodyTypeAliases: ['motorcycle', 'bike', 'scooter', 'two-wheeler', 'two wheeler'],
    faqs: [
      {
        question: 'Do bike pages include scooters?',
        answer:
          'This hub covers two-wheelers including motorcycles and scooters when published in the catalogue. Filter by model for exact specs.',
      },
      {
        question: 'Can I calculate two-wheeler EMI here?',
        answer:
          'Use the car/bike loan EMI tools with your on-road estimate. Tenure and rates differ by lender — verify before applying.',
      },
    ],
  },
};

export function isAutomobileCategorySlug(value: string): value is AutomobileCategorySlug {
  return (AUTOMOBILE_CATEGORY_SLUGS as readonly string[]).includes(value);
}

export function getAutomobileCategory(slug: string): AutomobileCategoryDef | null {
  if (!isAutomobileCategorySlug(slug)) return null;
  return AUTOMOBILE_CATEGORIES[slug];
}

export function listAutomobileCategories(): AutomobileCategoryDef[] {
  return AUTOMOBILE_CATEGORY_SLUGS.map((s) => AUTOMOBILE_CATEGORIES[s]);
}

/** Match a vehicle row to a category using bodyType / fuelType / category fields. */
export function vehicleMatchesAutomobileCategory(
  vehicle: { bodyType?: string | null; fuelType?: string | null; category?: string | null },
  category: AutomobileCategoryDef,
): boolean {
  const body = (vehicle.bodyType ?? '').trim().toLowerCase();
  const fuel = (vehicle.fuelType ?? '').trim().toLowerCase();
  const cat = (vehicle.category ?? '').trim().toLowerCase();

  if (category.filter.fuelType) {
    const target = category.filter.fuelType.toLowerCase();
    return fuel.includes(target) || cat.includes('electric') || cat.includes('ev');
  }

  const aliases = [
    (category.filter.bodyType ?? '').toLowerCase(),
    ...(category.bodyTypeAliases ?? []).map((a) => a.toLowerCase()),
  ].filter(Boolean);

  return aliases.some((a) => body === a || body.includes(a) || cat.includes(a));
}
