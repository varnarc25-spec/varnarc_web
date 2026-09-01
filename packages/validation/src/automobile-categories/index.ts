/**
 * Automobile category SEO landings — body-type / fuel / segment hubs.
 * Pages must filter published vehicles; thin empty hubs stay noindex at the page layer.
 */

export const AUTOMOBILE_CATEGORY_SLUGS = [
  'suv',
  'hatchback',
  'sedan',
  'mpv',
  'ev',
  'bikes',
  'new-cars',
  'hybrid',
  'cng',
  'upcoming-cars',
  'discontinued-cars',
  'scooters',
  'electric-bikes',
  'electric-scooters',
  'trucks',
  'mini-trucks',
  'vans',
  'buses',
  'three-wheelers',
] as const;

export type AutomobileCategorySlug = (typeof AUTOMOBILE_CATEGORY_SLUGS)[number];

export type AutomobileCategoryFilter = {
  bodyType?: string;
  fuelType?: string;
  category?: string;
  yearMode?: 'current' | 'upcoming' | 'discontinued';
};

export type AutomobileCategoryDef = {
  slug: AutomobileCategorySlug;
  name: string;
  path: string;
  title: string;
  description: string;
  h1: string;
  filter: AutomobileCategoryFilter;
  bodyTypeAliases?: string[];
  fuelTypeAliases?: string[];
  faqs: Array<{ question: string; answer: string }>;
};

function faqs(
  q1: string,
  a1: string,
  q2: string,
  a2: string,
): Array<{ question: string; answer: string }> {
  return [
    { question: q1, answer: a1 },
    { question: q2, answer: a2 },
  ];
}

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
    faqs: faqs(
      'Are the SUV prices on Varnarc on-road prices?',
      'Listed figures are typically ex-showroom or estimated on-road where published. Final on-road cost varies by city (RTO, insurance, dealer charges). Use our ownership calculators for planning.',
      'How should I compare SUVs?',
      'Compare seating, fuel type, mileage claims, safety rating and ownership cost (EMI + fuel + maintenance), not list price alone.',
    ),
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
    faqs: faqs(
      'Why are hatchbacks popular in India?',
      'Hatchbacks often balance city manoeuvrability, running cost and parking ease. Always verify current dealer offers and RTO charges for your city.',
      'Can I estimate hatchback EMI on Varnarc?',
      'Yes — use the Car Loan EMI calculator with an indicative on-road amount, down payment and tenure. Results are educational, not a loan offer.',
    ),
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
    faqs: faqs(
      'How do sedan prices differ by city?',
      'Road tax, registration and insurance vary by state and city. Use ex-showroom as a base and estimate on-road separately for your location.',
      'What should I check besides price?',
      'Boot space, rear seat comfort, safety features, service network and 5-year ownership cost matter as much as the sticker price.',
    ),
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
    faqs: faqs(
      'What is an MPV?',
      'Multi-purpose vehicles prioritise passenger space and flexible seating. Confirm third-row usability and luggage space with a physical visit when possible.',
      'How do I estimate running cost for an MPV?',
      'Use the fuel cost and mileage calculators with your monthly km and fuel price. Add insurance and maintenance for a fuller ownership picture.',
    ),
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
    fuelTypeAliases: ['electric', 'ev', 'battery'],
    faqs: faqs(
      'Are EV prices on Varnarc inclusive of subsidies?',
      'Published prices may or may not reflect state incentives. Always confirm current subsidy eligibility and dealer net price locally.',
      'How should I plan EV ownership cost?',
      'Compare electricity cost vs petrol/diesel using realistic km/month, plus insurance and battery warranty terms.',
    ),
  },
  bikes: {
    slug: 'bikes',
    name: 'Bikes',
    path: '/automobile/bikes',
    title: 'Bikes in India — Prices & Specs | Varnarc',
    description:
      'Explore motorcycles with indicative prices and ownership tools. Compare mileage and plan EMI — not a dealer quotation.',
    h1: 'Bikes in India',
    filter: { bodyType: 'Motorcycle' },
    bodyTypeAliases: ['motorcycle', 'bike', 'naked', 'sportbike'],
    faqs: faqs(
      'Do bike pages include scooters?',
      'Scooters have a separate hub. This page focuses on motorcycles when those body types are published in the catalogue.',
      'Can I calculate two-wheeler EMI here?',
      'Use the car/bike loan EMI tools with your on-road estimate. Tenure and rates differ by lender — verify before applying.',
    ),
  },
  'new-cars': {
    slug: 'new-cars',
    name: 'New cars',
    path: '/automobile/new-cars',
    title: 'New Cars in India — Current Model Year | Varnarc',
    description:
      'Browse currently listed new cars with indicative prices and specs. Educational catalogue — not dealer stock.',
    h1: 'New cars',
    filter: { yearMode: 'current' },
    faqs: faqs(
      'Is this a live dealer inventory?',
      'No. These are published catalogue models. Confirm availability and on-road price with a dealer.',
      'How is “new” defined here?',
      'Vehicles with a current or recent model year, or listings without a future launch year. Upcoming models are listed separately.',
    ),
  },
  hybrid: {
    slug: 'hybrid',
    name: 'Hybrid cars',
    path: '/automobile/hybrid',
    title: 'Hybrid Cars in India — Mileage & Ownership | Varnarc',
    description:
      'Browse hybrid and plug-in hybrid cars with indicative specs and ownership calculators. Educational only.',
    h1: 'Hybrid cars',
    filter: { fuelType: 'Hybrid' },
    fuelTypeAliases: ['hybrid', 'phev', 'mhev', 'petrol/electric', 'petrol-electric'],
    faqs: faqs(
      'What counts as a hybrid here?',
      'Listings whose fuel type includes hybrid, PHEV or mild-hybrid labels. Always confirm the powertrain on the model page.',
      'Are hybrids cheaper to run than petrol?',
      'Often in city use, but insurance and purchase price can offset savings. Use fuel and TCO tools with your km/month.',
    ),
  },
  cng: {
    slug: 'cng',
    name: 'CNG cars',
    path: '/automobile/cng',
    title: 'CNG Cars in India — Running Cost & Specs | Varnarc',
    description:
      'Browse factory CNG cars with indicative specs. Plan fuel cost with ownership calculators — not a dealer quote.',
    h1: 'CNG cars',
    filter: { fuelType: 'CNG' },
    fuelTypeAliases: ['cng', 'petrol/cng', 'petrol-cng'],
    faqs: faqs(
      'Are these factory-fitted CNG cars?',
      'Catalogue fuel labels may include petrol/CNG. Confirm factory vs aftermarket fitment with the manufacturer or dealer.',
      'How do I estimate CNG running cost?',
      'Use the fuel cost calculator with CNG price and claimed km/kg. Real-world figures vary with traffic and load.',
    ),
  },
  'upcoming-cars': {
    slug: 'upcoming-cars',
    name: 'Upcoming cars',
    path: '/automobile/upcoming-cars',
    title: 'Upcoming Cars — Future Model Years | Varnarc',
    description:
      'Models whose published model year is after the current calendar year. Specs and prices may change before launch.',
    h1: 'Upcoming cars',
    filter: { yearMode: 'upcoming' },
    faqs: faqs(
      'Are launch dates confirmed?',
      'We only use published model year where available. Launch timing, price and specs can change — treat this as a watchlist.',
      'Can I book these cars here?',
      'No. Varnarc is not a dealer. Follow up with authorised sellers when bookings open.',
    ),
  },
  'discontinued-cars': {
    slug: 'discontinued-cars',
    name: 'Discontinued cars',
    path: '/automobile/discontinued-cars',
    title: 'Discontinued Cars — Older Model Years | Varnarc',
    description:
      'Catalogue models with a model year before the current year. Useful for used-market research — not a classifieds listing.',
    h1: 'Discontinued cars',
    filter: { yearMode: 'discontinued' },
    faqs: faqs(
      'Is this a used-car marketplace?',
      'No. These are older catalogue years. For buying used vehicles, check used-car dealers in the directory.',
      'Why would I look at discontinued models?',
      'To compare specs, depreciation and service context before buying a used example or researching a previous generation.',
    ),
  },
  scooters: {
    slug: 'scooters',
    name: 'Scooters',
    path: '/automobile/scooters',
    title: 'Scooters in India — Prices & Mileage | Varnarc',
    description:
      'Browse scooters with indicative prices and ownership tools. Educational catalogue only.',
    h1: 'Scooters',
    filter: { bodyType: 'Scooter' },
    bodyTypeAliases: ['scooter', 'maxiscooter'],
    faqs: faqs(
      'Are electric scooters included?',
      'Electric scooters also appear on the dedicated electric scooters hub. This page includes scooter body types of any fuel.',
      'Can I plan scooter EMI here?',
      'Yes — use the EMI calculator with an estimated on-road price. Results are not a loan offer.',
    ),
  },
  'electric-bikes': {
    slug: 'electric-bikes',
    name: 'Electric bikes',
    path: '/automobile/electric-bikes',
    title: 'Electric Bikes in India — Range & Prices | Varnarc',
    description:
      'Electric motorcycles with indicative specs. Pair with charging cost and range tools — educational only.',
    h1: 'Electric bikes',
    filter: { fuelType: 'Electric', bodyType: 'Motorcycle' },
    fuelTypeAliases: ['electric', 'ev'],
    bodyTypeAliases: ['motorcycle', 'bike'],
    faqs: faqs(
      'How is this different from electric scooters?',
      'This hub matches electric fuel type with motorcycle/bike body types. Scooters are listed separately.',
      'How should I plan charging cost?',
      'Use the charging cost and range calculators with your tariff and daily kilometres.',
    ),
  },
  'electric-scooters': {
    slug: 'electric-scooters',
    name: 'Electric scooters',
    path: '/automobile/electric-scooters',
    title: 'Electric Scooters in India — Range & Prices | Varnarc',
    description:
      'Electric scooters with indicative specs and ownership tools. Educational only.',
    h1: 'Electric scooters',
    filter: { fuelType: 'Electric', bodyType: 'Scooter' },
    fuelTypeAliases: ['electric', 'ev'],
    bodyTypeAliases: ['scooter'],
    faqs: faqs(
      'Do listings include claimed range?',
      'Range appears when published on the vehicle record. Real-world range varies with speed, load and temperature.',
      'Where do I find charging locations?',
      'Use the charging stations directory listings — inventory depends on published businesses.',
    ),
  },
  trucks: {
    slug: 'trucks',
    name: 'Trucks',
    path: '/automobile/trucks',
    title: 'Trucks in India — Specs & Payload Context | Varnarc',
    description:
      'Commercial trucks from the published catalogue. Specs are indicative — confirm GVW and payload with the OEM.',
    h1: 'Trucks',
    filter: { bodyType: 'Truck' },
    bodyTypeAliases: ['truck', 'lorry', 'heavy commercial'],
    faqs: faqs(
      'Are these for commercial buyers only?',
      'Listings are educational. Licensing, permits and financing differ for commercial vehicles — verify locally.',
      'Can I compare trucks here?',
      'Use the vehicle compare tool when multiple models are published. Payload and body type matter more than car-style mileage.',
    ),
  },
  'mini-trucks': {
    slug: 'mini-trucks',
    name: 'Mini trucks',
    path: '/automobile/mini-trucks',
    title: 'Mini Trucks & LCVs in India | Varnarc',
    description:
      'Light commercial and mini-truck body types from the catalogue. Educational specs only.',
    h1: 'Mini trucks',
    filter: { bodyType: 'Mini Truck' },
    bodyTypeAliases: ['mini truck', 'minitruck', 'lcv', 'pickup', 'pick-up'],
    faqs: faqs(
      'What is a mini truck on Varnarc?',
      'Body types labelled mini truck, LCV or pickup when published. Confirm payload legally before purchase.',
      'Is financing available?',
      'Use the EMI calculator for planning. Commercial loan products differ — speak to a lender.',
    ),
  },
  vans: {
    slug: 'vans',
    name: 'Vans',
    path: '/automobile/vans',
    title: 'Vans in India — Passenger & Cargo | Varnarc',
    description: 'Van body types from the published catalogue with indicative specs.',
    h1: 'Vans',
    filter: { bodyType: 'Van' },
    bodyTypeAliases: ['van', 'panel van'],
    faqs: faqs(
      'Passenger or cargo vans?',
      'The catalogue uses body type labels. Check seating and cargo notes on each model page.',
      'How do I estimate running cost?',
      'Use fuel and maintenance calculators with your duty cycle (km/day).',
    ),
  },
  buses: {
    slug: 'buses',
    name: 'Buses',
    path: '/automobile/buses',
    title: 'Buses in India — Specs | Varnarc',
    description: 'Bus body types from the published catalogue. Educational information only.',
    h1: 'Buses',
    filter: { bodyType: 'Bus' },
    bodyTypeAliases: ['bus', 'coach', 'minibus'],
    faqs: faqs(
      'Are school and staff buses listed separately?',
      'Only when body type or category is published that way. Confirm homologation and permits with the OEM.',
      'Can I calculate EMI for a bus?',
      'The EMI tool can take any on-road amount. Commercial terms differ from passenger car loans.',
    ),
  },
  'three-wheelers': {
    slug: 'three-wheelers',
    name: 'Three wheelers',
    path: '/automobile/three-wheelers',
    title: 'Three Wheelers in India | Varnarc',
    description: 'Three-wheeler body types from the catalogue — passenger or cargo as labelled.',
    h1: 'Three wheelers',
    filter: { bodyType: 'Three Wheeler' },
    bodyTypeAliases: ['three wheeler', 'three-wheeler', 'auto', 'rickshaw', '3-wheeler'],
    faqs: faqs(
      'Passenger or cargo three-wheelers?',
      'Depends on the published body/category label. Verify payload and passenger capacity on the spec sheet.',
      'Are EV three-wheelers included?',
      'If fuel type is electric they may also appear on EV hubs. Filter by fuel on the model page.',
    ),
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

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => n && (haystack === n || haystack.includes(n)));
}

/** Match a vehicle row to a category using bodyType / fuelType / category / year. */
export function vehicleMatchesAutomobileCategory(
  vehicle: {
    bodyType?: string | null;
    fuelType?: string | null;
    category?: string | null;
    modelYear?: number | null;
  },
  category: AutomobileCategoryDef,
): boolean {
  const body = (vehicle.bodyType ?? '').trim().toLowerCase();
  const fuel = (vehicle.fuelType ?? '').trim().toLowerCase();
  const cat = (vehicle.category ?? '').trim().toLowerCase();
  const year = vehicle.modelYear ?? null;
  const now = new Date().getFullYear();

  if (category.filter.yearMode === 'upcoming') {
    if (year == null || year <= now) return false;
  }
  if (category.filter.yearMode === 'discontinued') {
    if (year == null || year >= now) return false;
  }
  if (category.filter.yearMode === 'current') {
    if (year != null && year > now) return false;
  }

  const fuelNeedles = [
    (category.filter.fuelType ?? '').toLowerCase(),
    ...(category.fuelTypeAliases ?? []).map((a) => a.toLowerCase()),
  ].filter(Boolean);

  const bodyNeedles = [
    (category.filter.bodyType ?? '').toLowerCase(),
    ...(category.bodyTypeAliases ?? []).map((a) => a.toLowerCase()),
  ].filter(Boolean);

  if (fuelNeedles.length) {
    const fuelOk =
      includesAny(fuel, fuelNeedles) ||
      includesAny(cat, fuelNeedles) ||
      (fuelNeedles.includes('electric') && (cat.includes('ev') || fuel.includes('ev')));
    if (!fuelOk) return false;
  }

  if (bodyNeedles.length) {
    const bodyOk = includesAny(body, bodyNeedles) || includesAny(cat, bodyNeedles);
    if (!bodyOk) return false;
  }

  return true;
}
