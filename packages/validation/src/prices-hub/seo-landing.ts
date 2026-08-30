/** Programmatic SEO content for material × city price landings (anti-thin). */

export const PRICE_LANDING_SEO_VERSION = '2026.08.1';

export const PRICE_LANDING_METHODOLOGY =
  'Varnarc material×city price pages show LIVE or VERIFIED observations for that material and location only. We do not interpolate missing days. Pages are generated and indexed only when enough reliable local observations exist — we do not publish boilerplate pages that merely swap the city name.';

export const PRICE_LANDING_QUALIFICATION =
  'Indicative market reference only. Prices move with brand, grade, quantity and logistics. Verify with local dealers before budgeting. Varnarc does not sell materials. Observed/reference values can differ from local supplier quotes.';

/** City-specific market notes (required for location flavour — not a city-name find/replace). */
export const PRICE_CITY_LOCAL_NOTES: Record<string, string> = {
  hyderabad:
    'Hyderabad cement and sand supply is generally steady along the ORR corridor; steel often tracks national TMT bands with logistics adders from Vizag/Chennai routes. Outer-ring sites may add transport not visible in a single city mid-rate.',
  bengaluru:
    'Bengaluru material landed costs often include longer last-mile logistics and higher finishing-tier demand in the north/east corridors. Sand and aggregate quotes vary sharply with pit distance and municipal restrictions.',
  chennai:
    'Chennai coastal logistics and monsoon disruptions can move aggregate and sand availability. Cement and TMT typically follow south-India dealer bands with port-adjacent brand mixes.',
  mumbai:
    'Mumbai (and Navi Mumbai/Thane spillover) quotes frequently embed higher handling and storage costs. Confirm whether rates are metro-city delivered or yard pickup.',
  pune: 'Pune pricing often sits between Mumbai metro premiums and inland Maharashtra yard rates. Peripheral MIDC sites can look cheaper until transport is added.',
  delhi:
    'Delhi NCR spans multiple dealer ecosystems (Delhi, Noida, Gurugram, Faridabad). Always confirm which node a reference observation covers before budgeting.',
  ahmedabad:
    'Ahmedabad material markets are typically competitive on cement and steel; finishing SKUs move with Gujarat dealer networks. Confirm GST-inclusive vs exclusive quotes.',
  kolkata:
    'Kolkata and surrounding districts can show river-logistics effects on sand/aggregate. Brand availability for premium TMT and tiles may be thinner than western metros.',
};

export type PriceMaterialSeoKey =
  'cement' | 'steel' | 'sand' | 'aggregate' | 'brick' | 'tiles' | 'paint';

export type PriceMaterialSeoProfile = {
  key: PriceMaterialSeoKey;
  /** Unique material intro — never city-generic alone. */
  editorialIntro: string;
  calculationExampleTemplate: string;
  faqExtras: Array<{ question: string; answer: string }>;
};

/**
 * Material-specific editorial (shared across cities, but never “only city name changed”).
 * Combined with PRICE_CITY_LOCAL_NOTES for location specificity.
 */
export const PRICE_MATERIAL_SEO_PROFILES: Record<PriceMaterialSeoKey, PriceMaterialSeoProfile> = {
  cement: {
    key: 'cement',
    editorialIntro:
      'Cement reference prices cover common OPC/PPC 50 kg bag retail bands. Brand, bag weight tolerance, dealer credit and site delivery distance routinely move the day rate more than city averages suggest.',
    calculationExampleTemplate:
      'Example: {qty} bags × {price} {currency}/{unit} ≈ {total} {currency} cement material cost (before wastage and GST). Indicative only.',
    faqExtras: [
      {
        question: 'Is the cement price per bag or per kg?',
        answer:
          'Varnarc cement hub observations are typically shown per bag (commonly 50 kg). Always confirm bag weight and brand with the dealer before converting to kg.',
      },
    ],
  },
  steel: {
    key: 'steel',
    editorialIntro:
      'Steel (TMT) references are usually ₹/kg for common rebar diameters. Mill brand, diameter mix, coil vs cut length and billet surcharges change landed cost even when the city mid-rate looks stable.',
    calculationExampleTemplate:
      'Example: {qty} kg TMT × {price} {currency}/{unit} ≈ {total} {currency} steel material cost (before fabrication labour). Indicative only.',
    faqExtras: [
      {
        question: 'Does the steel price include cutting and bending?',
        answer:
          'Usually not. Hub observations are material reference rates. Bar bending, binding wire and wastage belong in a separate BOQ line.',
      },
    ],
  },
  sand: {
    key: 'sand',
    editorialIntro:
      'Sand prices are commonly ₹/m³ for river sand or M-sand. Grading, silt content, moisture and pit distance dominate variance — two dealers in the same city can differ sharply.',
    calculationExampleTemplate:
      'Example: {qty} m³ sand × {price} {currency}/{unit} ≈ {total} {currency} (before bulking/moisture adjustments). Indicative only.',
    faqExtras: [
      {
        question: 'River sand or M-sand — which rate is this?',
        answer:
          'Check the observation notes/source. If unspecified, treat the figure as a planning placeholder and confirm the exact product with suppliers.',
      },
    ],
  },
  aggregate: {
    key: 'aggregate',
    editorialIntro:
      'Aggregate (jelly/metal) references are typically ₹/m³ by size grade. Crusher distance, size mix (20 mm / 40 mm) and washing requirements move quotes beyond a single city mid-point.',
    calculationExampleTemplate:
      'Example: {qty} m³ aggregate × {price} {currency}/{unit} ≈ {total} {currency}. Confirm size grade on the delivery challan.',
    faqExtras: [
      {
        question: 'Which aggregate size is reflected?',
        answer:
          'Prefer observations that name the grade. If missing, ask the dealer for 20 mm vs 40 mm pricing before locking a concrete mix budget.',
      },
    ],
  },
  brick: {
    key: 'brick',
    editorialIntro:
      'Brick/block rates may be ₹/piece for clay bricks or AAC blocks. Strength class, size and mortar joint assumptions differ — do not mix clay-brick piece rates with AAC without converting sizes.',
    calculationExampleTemplate:
      'Example: {qty} pieces × {price} {currency}/{unit} ≈ {total} {currency} masonry units (before mortar and wastage). Indicative only.',
    faqExtras: [
      {
        question: 'Clay brick or AAC block?',
        answer:
          'Confirm the product on the observation. AAC and clay brick piece rates are not interchangeable without modular size conversion.',
      },
    ],
  },
  tiles: {
    key: 'tiles',
    editorialIntro:
      'Tile references are often ₹/m² for common porcelain/ceramic SKUs. Thickness, finish, rectification and brand tier dominate; packing wastage and adhesive are separate.',
    calculationExampleTemplate:
      'Example: {qty} m² tiles × {price} {currency}/{unit} ≈ {total} {currency} tile material (before adhesive, grout and wastage). Indicative only.',
    faqExtras: [
      {
        question: 'Does the tile rate include laying?',
        answer:
          'No. Hub figures are material references. Labour, adhesive and grout should be estimated separately.',
      },
    ],
  },
  paint: {
    key: 'paint',
    editorialIntro:
      'Paint references are typically ₹/litre for interior emulsions. Coverage (m²/L), coats, primer and putty change total project cost more than the litre rate alone.',
    calculationExampleTemplate:
      'Example: {qty} litres × {price} {currency}/{unit} ≈ {total} {currency} paint material (before primer/putty). Indicative only.',
    faqExtras: [
      {
        question: 'Interior or exterior paint?',
        answer:
          'Check brand/SKU notes on the observation. Exterior elastomeric products usually price above interior emulsions.',
      },
    ],
  },
};

export type PriceLandingSeoContent = {
  editorialIntro: string;
  localMarketNote: string;
  methodology: string;
  qualification: string;
  calculationExample: string;
  faqs: Array<{ question: string; answer: string }>;
  calculatorHref: string;
  calculatorLabel: string;
  relatedMaterialHrefs: Array<{ href: string; label: string }>;
  relatedCityHrefs: Array<{ href: string; label: string }>;
  priceRange: { low: number; high: number } | null;
  lastUpdatedIso: string | null;
  unit: string | null;
  version: string;
};

function moneyInr(n: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

export function isPriceMaterialSeoKey(value: string): value is PriceMaterialSeoKey {
  return value in PRICE_MATERIAL_SEO_PROFILES;
}

export function getPriceCityLocalNote(citySlug: string): string | null {
  return PRICE_CITY_LOCAL_NOTES[citySlug] ?? null;
}

export function buildPriceLandingCalculationExample(input: {
  materialKey: PriceMaterialSeoKey;
  price: number;
  unit: string;
  currency?: string;
}): string {
  const profile = PRICE_MATERIAL_SEO_PROFILES[input.materialKey];
  const currency = input.currency ?? 'INR';
  const qtyByMaterial: Record<PriceMaterialSeoKey, number> = {
    cement: 100,
    steel: 500,
    sand: 10,
    aggregate: 12,
    brick: 1000,
    tiles: 50,
    paint: 40,
  };
  const qty = qtyByMaterial[input.materialKey];
  const total = Math.round(qty * input.price);
  const currencySymbol = currency === 'INR' ? '₹' : currency;
  return profile.calculationExampleTemplate
    .replace('{qty}', moneyInr(qty))
    .replace('{price}', moneyInr(input.price))
    .replace(/\{currency\}/g, currencySymbol)
    .replace('{unit}', input.unit)
    .replace('{total}', moneyInr(total));
}

export function buildPriceLandingFaqs(input: {
  materialKey: PriceMaterialSeoKey;
  materialLabel: string;
  cityName: string;
}): Array<{ question: string; answer: string }> {
  const profile = PRICE_MATERIAL_SEO_PROFILES[input.materialKey];
  return [
    {
      question: `Is the ${input.materialLabel.toLowerCase()} price in ${input.cityName} a dealer quote?`,
      answer: `No. It is a Varnarc reference observation for planning. Brand, grade, quantity and delivery in ${input.cityName} can differ — verify with local suppliers before budgeting.`,
    },
    {
      question: 'Why might this page not exist for every city?',
      answer:
        'Varnarc only indexes material×city pages when enough reliable local observations exist. We do not publish thin pages that only change the city name.',
    },
    {
      question: 'How often are prices updated?',
      answer:
        'Whenever new LIVE or VERIFIED observations are recorded. The page shows last-updated freshness; older data is labeled and never presented as current.',
    },
    ...profile.faqExtras,
  ];
}

/**
 * Build SEO content layers for a material×city landing.
 * Related links are passed in from the API after sibling pairs are checked as indexable.
 */
export function buildPriceLandingSeoContent(input: {
  materialKey: PriceMaterialSeoKey;
  materialLabel: string;
  citySlug: string;
  cityName: string;
  calculatorHref: string;
  currentPrice: number | null;
  unit: string | null;
  currency?: string | null;
  historyPrices: number[];
  lastUpdatedIso: string | null;
  relatedMaterials: Array<{ key: string; label: string }>;
  relatedCities: Array<{ slug: string; name: string }>;
}): PriceLandingSeoContent | null {
  if (!isPriceMaterialSeoKey(input.materialKey)) return null;
  const localNote = getPriceCityLocalNote(input.citySlug);
  if (!localNote) return null;

  const profile = PRICE_MATERIAL_SEO_PROFILES[input.materialKey];

  const localMarketNote = `${localNote} This page’s ${input.materialLabel.toLowerCase()} figures are filtered to ${input.cityName} observations only.`;

  const editorialIntro = `${profile.editorialIntro} For ${input.cityName}, treat the figures below as location-filtered references — not a national average pasted onto the city name.`;

  const priceRange =
    input.historyPrices.length > 0
      ? {
          low: Math.min(...input.historyPrices),
          high: Math.max(...input.historyPrices),
        }
      : null;

  const calculationExample =
    input.currentPrice != null && input.unit
      ? buildPriceLandingCalculationExample({
          materialKey: input.materialKey,
          price: input.currentPrice,
          unit: input.unit,
          currency: input.currency ?? 'INR',
        })
      : `Add a reliable current ${input.materialLabel.toLowerCase()} observation for ${input.cityName} to unlock a worked calculation example.`;

  return {
    editorialIntro,
    localMarketNote,
    methodology: PRICE_LANDING_METHODOLOGY,
    qualification: PRICE_LANDING_QUALIFICATION,
    calculationExample,
    faqs: buildPriceLandingFaqs({
      materialKey: input.materialKey,
      materialLabel: input.materialLabel,
      cityName: input.cityName,
    }),
    calculatorHref: input.calculatorHref,
    calculatorLabel: `${input.materialLabel} calculator`,
    relatedMaterialHrefs: input.relatedMaterials.map((m) => ({
      href: `/construction/prices/${m.key}/${input.citySlug}`,
      label: `${m.label} in ${input.cityName}`,
    })),
    relatedCityHrefs: input.relatedCities.map((c) => ({
      href: `/construction/prices/${input.materialKey}/${c.slug}`,
      label: `${input.materialLabel} in ${c.name}`,
    })),
    priceRange,
    lastUpdatedIso: input.lastUpdatedIso,
    unit: input.unit,
    version: PRICE_LANDING_SEO_VERSION,
  };
}
