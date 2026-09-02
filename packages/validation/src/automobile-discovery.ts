/**
 * Curated automobile discovery pages. Only these paths are indexable SEO landings.
 * Arbitrary filter query combinations stay noindex via the vehicles listing.
 */

export const AUTOMOBILE_BUDGET_LAKHS = [5, 10, 15, 20, 25, 30] as const;

export const AUTOMOBILE_ONROAD_CITIES = [
  { slug: 'bangalore', name: 'Bangalore' },
  { slug: 'hyderabad', name: 'Hyderabad' },
  { slug: 'chennai', name: 'Chennai' },
  { slug: 'mumbai', name: 'Mumbai' },
  { slug: 'delhi', name: 'Delhi' },
  { slug: 'pune', name: 'Pune' },
  { slug: 'ahmedabad', name: 'Ahmedabad' },
  { slug: 'kolkata', name: 'Kolkata' },
] as const;

export type AutomobileDiscoveryFilter = {
  maxPrice?: number;
  minPrice?: number;
  bodyType?: string;
  bodyTypeAliases?: string[];
  fuelType?: string;
  fuelTypeAliases?: string[];
  transmission?: string;
  minSeats?: number;
  minMileageKmpl?: number;
  minSafety?: number;
  sort?: 'featured' | 'price_asc' | 'price_desc' | 'mileage' | 'newest';
};

export type AutomobileDiscoveryPage = {
  path: string;
  slug: string;
  h1: string;
  title: string;
  description: string;
  intro: string;
  filter: AutomobileDiscoveryFilter;
  faqs: Array<{ question: string; answer: string }>;
  indexable: true;
};

function page(partial: Omit<AutomobileDiscoveryPage, 'indexable'>): AutomobileDiscoveryPage {
  return { ...partial, indexable: true };
}

export const AUTOMOBILE_DISCOVERY_PAGES: AutomobileDiscoveryPage[] = [
  ...AUTOMOBILE_BUDGET_LAKHS.map((lakhs) =>
    page({
      path: `/automobile/cars/under-${lakhs}-lakh`,
      slug: `under-${lakhs}-lakh`,
      h1: `Cars under ₹${lakhs} lakh`,
      title: `Cars under ₹${lakhs} Lakh in India — Prices & Specs | Varnarc`,
      description: `Browse cars with published ex-showroom prices under ₹${lakhs} lakh. Compare mileage, fuel and seating — indicative, not a dealer quote.`,
      intro: `This list includes published models whose lowest listed ex-showroom price is under ₹${lakhs} lakh. Many catalogue rows have no price yet and are omitted here on purpose.`,
      filter: { maxPrice: lakhs * 100000, sort: 'price_asc' },
      faqs: [
        {
          question: `Are these on-road prices under ₹${lakhs} lakh?`,
          answer:
            'No. Filters use published ex-showroom figures. Registration, insurance and dealer charges add city-wise on-road cost.',
        },
        {
          question: 'Why are some popular cars missing?',
          answer:
            'A model appears only when at least one published variant has an ex-showroom price in this band. Missing prices stay hidden rather than guessed.',
        },
      ],
    }),
  ),
  page({
    path: '/automobile/suv',
    slug: 'suv',
    h1: 'SUVs in India',
    title: 'SUVs in India — Prices, Specs & Comparisons | Varnarc',
    description:
      'Browse SUVs with indicative prices, fuel type and ownership tools. Compare seating and running cost before you buy.',
    intro:
      'SUVs here are rows tagged SUV, crossover or MUV in the catalogue. Ground clearance and seating vary widely — check the variant table on each model page.',
    filter: { bodyType: 'SUV', bodyTypeAliases: ['suv', 'crossover'] },
    faqs: [
      {
        question: 'Is every crossover listed as an SUV?',
        answer:
          'We match body-type labels from source data. Crossover and MUV aliases are included so similar shapes are not split across hubs.',
      },
      {
        question: 'How should I compare SUVs?',
        answer:
          'Compare seating, fuel, claimed efficiency, boot space and ownership cost — not list price alone.',
      },
    ],
  }),
  page({
    path: '/automobile/hatchback',
    slug: 'hatchback',
    h1: 'Hatchbacks in India',
    title: 'Hatchbacks in India — Prices, Mileage & Specs | Varnarc',
    description: 'Explore hatchbacks with price ranges, mileage and ownership tools.',
    intro:
      'Hatchbacks typically suit city parking and running cost. Confirm current dealer offers and RTO for your city.',
    filter: { bodyType: 'Hatchback', bodyTypeAliases: ['hatchback', 'hatch'] },
    faqs: [
      {
        question: 'Are hatchback prices on-road?',
        answer: 'Listed figures are ex-showroom or estimated on-road only when published.',
      },
      {
        question: 'Can I estimate EMI?',
        answer:
          'Use the car loan calculator with an indicative on-road amount. Results are educational, not a loan offer.',
      },
    ],
  }),
  page({
    path: '/automobile/sedan',
    slug: 'sedan',
    h1: 'Sedans in India',
    title: 'Sedans in India — Prices, Specs & Ownership Cost | Varnarc',
    description: 'Browse sedans with indicative prices, specs and ownership calculators.',
    intro:
      'Sedans here use the sedan/saloon body label. Boot space and rear comfort differ by generation.',
    filter: { bodyType: 'Sedan', bodyTypeAliases: ['sedan', 'saloon'] },
    faqs: [
      {
        question: 'How do sedan prices differ by city?',
        answer: 'Road tax and insurance vary by state. Use ex-showroom as a base.',
      },
      {
        question: 'What else to check?',
        answer:
          'Boot space, safety tests (with agency named), service network and 5-year running cost.',
      },
    ],
  }),
  page({
    path: '/automobile/muv',
    slug: 'muv',
    h1: 'MUVs in India',
    title: 'MUVs in India — Family Cars, Seating & Prices | Varnarc',
    description: 'Find MUVs and people-movers with seating and ownership context.',
    intro: 'MUV/MPV labels from the catalogue. Third-row usability should be checked in person.',
    filter: { bodyType: 'MUV', bodyTypeAliases: ['muv', 'mpv', 'minivan'] },
    faqs: [
      {
        question: 'MUV vs SUV?',
        answer:
          'MUVs usually prioritise cabin space; SUVs may sit higher. Labels follow source data.',
      },
      {
        question: 'How many seats?',
        answer:
          'Use the 7-seater hub or the seats filter. Do not assume every MUV has a usable third row.',
      },
    ],
  }),
  page({
    path: '/automobile/automatic-cars',
    slug: 'automatic-cars',
    h1: 'Automatic cars in India',
    title: 'Automatic Cars in India — AMT, CVT, Torque Converter | Varnarc',
    description: 'Cars with an automatic, AMT, CVT or DCT gearbox in the published catalogue.',
    intro:
      'A row matches if transmission text includes automatic, AMT, CVT, DCT or torque converter. Manual-only variants are excluded.',
    filter: { transmission: 'automatic' },
    faqs: [
      {
        question: 'Does automatic include AMT?',
        answer: 'Yes. AMT, CVT, DCT and torque-converter automatics are grouped here.',
      },
      {
        question: 'Is mileage lower?',
        answer:
          'Often slightly vs a comparable manual. Compare claimed combined figures on the model page.',
      },
    ],
  }),
  page({
    path: '/automobile/cng-cars',
    slug: 'cng-cars',
    h1: 'CNG cars in India',
    title: 'CNG Cars in India — Factory-fitted CNG Models | Varnarc',
    description:
      'Published vehicles tagged CNG. Confirm factory vs aftermarket fitment with the dealer.',
    intro: 'Fuel type must include CNG. Boot space is often reduced — check variant specs.',
    filter: { fuelType: 'CNG', fuelTypeAliases: ['cng'] },
    faqs: [
      {
        question: 'Factory CNG only?',
        answer:
          'We only know the fuel label on the record. Confirm factory-fit with the manufacturer.',
      },
      {
        question: 'Running cost?',
        answer: 'Use the fuel calculator with CNG price and your monthly km. Estimates only.',
      },
    ],
  }),
  page({
    path: '/automobile/diesel-cars',
    slug: 'diesel-cars',
    h1: 'Diesel cars in India',
    title: 'Diesel Cars in India — Mileage & Ownership | Varnarc',
    description: 'Published diesel models with specs and ownership tools.',
    intro:
      'Matches diesel in the fuel field. Emission and city restrictions are your responsibility to check.',
    filter: { fuelType: 'Diesel', fuelTypeAliases: ['diesel'] },
    faqs: [
      {
        question: 'Are new diesels still sold?',
        answer:
          'Availability changes by brand and city policy. This hub only lists published catalogue rows.',
      },
      {
        question: 'Highway vs city?',
        answer: 'Claimed combined figures mix both. Use the fuel calculator with your mix of km.',
      },
    ],
  }),
  page({
    path: '/automobile/petrol-cars',
    slug: 'petrol-cars',
    h1: 'Petrol cars in India',
    title: 'Petrol Cars in India — Prices & Mileage | Varnarc',
    description: 'Published petrol models. Compare mileage and EMI with ownership tools.',
    intro: 'Fuel type includes petrol or gasoline. Hybrids are listed separately.',
    filter: { fuelType: 'Petrol', fuelTypeAliases: ['petrol', 'gasoline'] },
    faqs: [
      {
        question: 'Are mild hybrids here?',
        answer:
          'If the source fuel string is only petrol, they may appear here. Dedicated hybrid hub uses a hybrid label.',
      },
      {
        question: 'Price filter?',
        answer: 'Use budget hubs such as cars under ₹10 lakh when prices are published.',
      },
    ],
  }),
  page({
    path: '/automobile/electric-cars',
    slug: 'electric-cars',
    h1: 'Electric cars in India',
    title: 'Electric Cars in India — EV Prices, Range & Ownership | Varnarc',
    description:
      'Published battery-electric cars. Range figures are claimed unless labelled otherwise.',
    intro: 'Fuel type includes electric or EV. Claimed range is not real-world range.',
    filter: { fuelType: 'Electric', fuelTypeAliases: ['electric', 'ev', 'battery'] },
    faqs: [
      {
        question: 'Do prices include subsidies?',
        answer: 'Not necessarily. Confirm FAME or state incentives locally.',
      },
      {
        question: 'How do I plan charging cost?',
        answer: 'Use the EV charging-cost calculator with your tariff and km. Not a station quote.',
      },
    ],
  }),
  page({
    path: '/automobile/hybrid-cars',
    slug: 'hybrid-cars',
    h1: 'Hybrid cars in India',
    title: 'Hybrid Cars in India — Strong & Mild Hybrid | Varnarc',
    description:
      'Published hybrids. Labels follow source fuel strings (hybrid, PHEV, mild hybrid).',
    intro:
      'A row matches hybrid, PHEV or plug-in in the fuel field. Electric-only cars are on the EV hub.',
    filter: { fuelType: 'Hybrid', fuelTypeAliases: ['hybrid', 'phev', 'plug-in'] },
    faqs: [
      {
        question: 'Mild vs strong hybrid?',
        answer: 'Source data rarely distinguishes. Read the variant spec sheet.',
      },
      {
        question: 'Mileage claims?',
        answer:
          'Shown only when a positive figure exists. Units follow the stored value (L/100km or km/l).',
      },
    ],
  }),
  page({
    path: '/automobile/7-seater-cars',
    slug: '7-seater-cars',
    h1: '7-seater cars in India',
    title: '7 Seater Cars in India — MUVs & SUVs | Varnarc',
    description: 'Vehicles with published seating capacity of 7 or more.',
    intro: 'Seating capacity ≥ 7 on the record. Third-row comfort is not verified here.',
    filter: { minSeats: 7 },
    faqs: [
      {
        question: 'Are all 7 seats usable?',
        answer: 'Catalogue seating is not a comfort rating. Sit in the third row before buying.',
      },
      {
        question: 'Boot with 7 up?',
        answer: 'Boot litres are often measured with seats folded. Check variant specs.',
      },
    ],
  }),
  page({
    path: '/automobile/best-mileage-cars',
    slug: 'best-mileage-cars',
    h1: 'Best mileage cars',
    title: 'Best Mileage Cars in India — Claimed Efficiency | Varnarc',
    description: 'Published cars sorted by claimed efficiency. Figures are not real-world tests.',
    intro:
      'Sorted by stored mileage where the value is greater than zero. Mixed units (L/100km vs km/l) are labelled on cards.',
    filter: { minMileageKmpl: 0.01, sort: 'mileage' },
    faqs: [
      {
        question: 'Is this ARAI mileage?',
        answer: 'We store whatever the catalogue provided. It is not an independent lab test.',
      },
      {
        question: 'Why is an EV missing?',
        answer: 'EVs may store range, not L/100km. They appear on the electric cars hub.',
      },
    ],
  }),
  page({
    path: '/automobile/safest-cars',
    slug: 'safest-cars',
    h1: 'Cars with published safety ratings',
    title: 'Safest Cars in India — Published Ratings | Varnarc',
    description:
      'Vehicles with a stored safety rating. Agency names are shown when present — scores are not mixed across NCAP programmes.',
    intro:
      'Only rows with a safety rating greater than zero. Bharat NCAP, Global NCAP and Euro NCAP are not treated as equivalent.',
    filter: { minSafety: 0.5, sort: 'featured' },
    faqs: [
      {
        question: 'Which NCAP is this?',
        answer: 'See the agency field on the model page. If missing, we do not invent one.',
      },
      {
        question: 'Why is a crash-tested car missing?',
        answer: 'The rating must exist on our record. We do not scrape NCAP sites.',
      },
    ],
  }),
  page({
    path: '/automobile/suv/under-15-lakh',
    slug: 'suv-under-15-lakh',
    h1: 'SUVs under ₹15 lakh',
    title: 'SUVs under ₹15 Lakh in India | Varnarc',
    description: 'SUVs with published ex-showroom price under ₹15 lakh.',
    intro:
      'SUV/crossover body type and max published price under ₹15 lakh. Empty if prices are not in the catalogue.',
    filter: {
      bodyType: 'SUV',
      bodyTypeAliases: ['suv', 'crossover'],
      maxPrice: 1500000,
      sort: 'price_asc',
    },
    faqs: [
      {
        question: 'On-road under 15 lakh?',
        answer: 'Unlikely in many cities. This filter is ex-showroom.',
      },
      {
        question: 'Compact SUV vs mid-size?',
        answer: 'Both may appear; compare wheelbase and seating on the model page.',
      },
    ],
  }),
  page({
    path: '/automobile/automatic-cars/under-10-lakh',
    slug: 'automatic-under-10-lakh',
    h1: 'Automatic cars under ₹10 lakh',
    title: 'Automatic Cars under ₹10 Lakh in India | Varnarc',
    description: 'Automatic/AMT cars with published price under ₹10 lakh.',
    intro: 'Transmission matches automatic family and price under ₹10 lakh when published.',
    filter: { transmission: 'automatic', maxPrice: 1000000, sort: 'price_asc' },
    faqs: [
      {
        question: 'Mostly AMT?',
        answer: 'At this price, AMT is common. Check the gearbox type on the variant.',
      },
      {
        question: 'CNG automatic?',
        answer: 'Possible; use filters on Find Cars if both labels exist on the row.',
      },
    ],
  }),
  page({
    path: '/automobile/cng-cars/under-10-lakh',
    slug: 'cng-under-10-lakh',
    h1: 'CNG cars under ₹10 lakh',
    title: 'CNG Cars under ₹10 Lakh in India | Varnarc',
    description: 'CNG-labelled cars under ₹10 lakh ex-showroom when priced in the catalogue.',
    intro: 'CNG fuel and max price ₹10 lakh. Confirm factory fitment independently.',
    filter: { fuelType: 'CNG', fuelTypeAliases: ['cng'], maxPrice: 1000000, sort: 'price_asc' },
    faqs: [
      {
        question: 'City restrictions?',
        answer: 'CNG availability and parking rules vary. Check locally.',
      },
      { question: 'Boot space?', answer: 'Tanks often reduce luggage volume. Read variant specs.' },
    ],
  }),
  page({
    path: '/automobile/electric-cars/under-15-lakh',
    slug: 'ev-under-15-lakh',
    h1: 'Electric cars under ₹15 lakh',
    title: 'Electric Cars under ₹15 Lakh in India | Varnarc',
    description:
      'EVs with published ex-showroom under ₹15 lakh. Range is claimed, not tested here.',
    intro: 'Electric fuel label and price under ₹15 lakh when present.',
    filter: {
      fuelType: 'Electric',
      fuelTypeAliases: ['electric', 'ev'],
      maxPrice: 1500000,
      sort: 'price_asc',
    },
    faqs: [
      {
        question: 'Subsidy included?',
        answer: 'Do not assume so. Confirm net price with a dealer.',
      },
      {
        question: 'Real-world range?',
        answer: 'We do not invent it. Calculators estimate from consumption you enter.',
      },
    ],
  }),
  page({
    path: '/automobile/electric-cars/under-20-lakh',
    slug: 'ev-under-20-lakh',
    h1: 'Electric cars under ₹20 lakh',
    title: 'Electric Cars under ₹20 Lakh in India | Varnarc',
    description: 'EVs with published ex-showroom under ₹20 lakh.',
    intro: 'Electric fuel label and price under ₹20 lakh when present.',
    filter: {
      fuelType: 'Electric',
      fuelTypeAliases: ['electric', 'ev'],
      maxPrice: 2000000,
      sort: 'price_asc',
    },
    faqs: [
      {
        question: 'Charging at home?',
        answer: 'Use the charging-cost calculator. Hardware and DISCOM rules are out of scope.',
      },
      {
        question: 'Compare vs petrol?',
        answer: 'Open EV vs petrol running cost with your monthly km.',
      },
    ],
  }),
  page({
    path: '/automobile/7-seater-cars/under-20-lakh',
    slug: '7-seater-under-20-lakh',
    h1: '7-seater cars under ₹20 lakh',
    title: '7 Seater Cars under ₹20 Lakh in India | Varnarc',
    description: 'Seven-or-more seaters with published price under ₹20 lakh.',
    intro: 'Seating ≥ 7 and max ex-showroom ₹20 lakh when priced.',
    filter: { minSeats: 7, maxPrice: 2000000, sort: 'price_asc' },
    faqs: [
      {
        question: 'Family of six?',
        answer: 'Check third-row access and ISOFIX, not only the seat count field.',
      },
      {
        question: 'Automatic 7-seaters?',
        answer: 'Use Find Cars with transmission + seats when those fields exist.',
      },
    ],
  }),
];

export const AUTOMOBILE_USE_CASE_PAGES: AutomobileDiscoveryPage[] = [
  page({
    path: '/automobile/best-cars-for-families',
    slug: 'best-cars-for-families',
    h1: 'Best cars for families',
    title: 'Best Family Cars in India — Seating & Safety Context | Varnarc',
    description:
      'Family-oriented cars: 5+ seats, hatchback/SUV/MUV. Selection is rule-based, not a paid ranking.',
    intro:
      'Included when seating is 5 or more and body type is hatchback, sedan, SUV or MUV. Safety scores appear only if stored.',
    filter: { minSeats: 5, bodyTypeAliases: ['hatch', 'sedan', 'suv', 'muv', 'mpv'] },
    faqs: [
      {
        question: 'Is this a ranking?',
        answer:
          'No. It is an explainable filter: seats and body type. We do not sell “#1 family car” slots.',
      },
      {
        question: 'Child seats?',
        answer: 'Look for ISOFIX on the spec sheet. We do not infer it.',
      },
    ],
  }),
  page({
    path: '/automobile/best-cars-for-city-driving',
    slug: 'best-cars-for-city-driving',
    h1: 'Best cars for city driving',
    title: 'Best Cars for City Driving in India | Varnarc',
    description: 'Hatchbacks and compact bodies for city use. Not a handling test.',
    intro:
      'Hatchback or compact labels, seating up to 5. Parking and turning circle are not in the database.',
    filter: { bodyType: 'Hatchback', bodyTypeAliases: ['hatchback', 'hatch', 'compact'] },
    faqs: [
      {
        question: 'Automatic for traffic?',
        answer: 'Use the automatic cars hub combined with hatchbacks when both labels exist.',
      },
      { question: 'CNG in city?', answer: 'See CNG cars. Pump access varies by city.' },
    ],
  }),
  page({
    path: '/automobile/best-cars-for-highway-driving',
    slug: 'best-cars-for-highway-driving',
    h1: 'Best cars for highway driving',
    title: 'Best Cars for Highway Driving in India | Varnarc',
    description: 'Sedans and SUVs typically used for highway trips. Not a high-speed test.',
    intro:
      'Sedan or SUV body types. We do not store cruise-control as a filter unless present in specs JSON.',
    filter: { bodyTypeAliases: ['sedan', 'suv'] },
    faqs: [
      {
        question: 'Diesel for highway?',
        answer: 'Open diesel cars and compare claimed combined consumption.',
      },
      {
        question: 'Safety on highways?',
        answer: 'Use the safety hub; ratings are agency-specific.',
      },
    ],
  }),
  page({
    path: '/automobile/best-cars-for-beginners',
    slug: 'best-cars-for-beginners',
    h1: 'Best cars for beginners',
    title: 'Best First Cars in India | Varnarc',
    description: 'Smaller hatchbacks under typical first-car budgets when prices exist.',
    intro:
      'Hatchbacks. Price cap ₹10 lakh applied when ex-showroom is present; unpriced hatchbacks still appear with a note.',
    filter: { bodyType: 'Hatchback', bodyTypeAliases: ['hatchback', 'hatch'], maxPrice: 1000000 },
    faqs: [
      {
        question: 'Manual vs automatic?',
        answer:
          'Beginners often prefer automatic in traffic; insurance and repair cost still matter.',
      },
      { question: 'Insurance?', answer: 'Use the car insurance estimator. Not a policy quote.' },
    ],
  }),
  page({
    path: '/automobile/best-cars-for-long-drives',
    slug: 'best-cars-for-long-drives',
    h1: 'Best cars for long drives',
    title: 'Best Cars for Long Drives in India | Varnarc',
    description: 'Sedans and SUVs for touring. Comfort is not lab-tested here.',
    intro:
      'Same body filter as highway driving. Rear space and boot should be checked on the variant.',
    filter: { bodyTypeAliases: ['sedan', 'suv', 'muv'] },
    faqs: [
      {
        question: 'Diesel vs petrol?',
        answer: 'Highway km often favours diesel where still sold. Confirm local rules.',
      },
      {
        question: 'EV long drives?',
        answer:
          'Use EV range calculator with a conservative factor. Charging network is not mapped here.',
      },
    ],
  }),
  page({
    path: '/automobile/best-cars-for-bad-roads',
    slug: 'best-cars-for-bad-roads',
    h1: 'Best cars for bad roads',
    title: 'Best Cars for Bad Roads in India | Varnarc',
    description: 'SUVs and cars with published ground clearance. Not an off-road rating.',
    intro: 'SUV/crossover body types. Ground clearance is shown only when stored.',
    filter: { bodyType: 'SUV', bodyTypeAliases: ['suv', 'crossover'] },
    faqs: [
      {
        question: 'Minimum clearance?',
        answer: 'We do not invent a threshold. Compare mm on the spec sheet when present.',
      },
      {
        question: '2WD vs 4WD?',
        answer: 'Drivetrain is in specifications when the source provided it.',
      },
    ],
  }),
  page({
    path: '/automobile/best-cars-for-large-families',
    slug: 'best-cars-for-large-families',
    h1: 'Best cars for large families',
    title: 'Best Cars for Large Families in India | Varnarc',
    description: 'Six- and seven-seat vehicles from the catalogue.',
    intro: 'Seating capacity ≥ 6. Same caveat as 7-seaters: count ≠ comfort.',
    filter: { minSeats: 6 },
    faqs: [
      { question: 'Six vs seven seats?', answer: 'Some rows store 6. Both appear here.' },
      {
        question: 'School run?',
        answer: 'Check ISOFIX, door opening and service network — not encoded as a score.',
      },
    ],
  }),
];

export const AUTOMOBILE_LAUNCH_PAGES = [
  {
    path: '/automobile/new-car-launches',
    slug: 'new-car-launches',
    h1: 'New car launches',
    title: 'New Car Launches in India | Varnarc',
    description:
      'Recently launched cars based on model year relative to the current year. Status is labelled when stored.',
  },
  {
    path: '/automobile/upcoming-cars',
    slug: 'upcoming-cars',
    h1: 'Upcoming cars',
    title: 'Upcoming Cars in India | Varnarc',
    description:
      'Models with a future model year or EXPECTED/RUMOURED launch status. Rumours are never shown as confirmed.',
  },
  {
    path: '/automobile/upcoming-electric-cars',
    slug: 'upcoming-electric-cars',
    h1: 'Upcoming electric cars',
    title: 'Upcoming Electric Cars in India | Varnarc',
    description: 'Electric models with a future year or expected launch status.',
  },
] as const;

export const AUTOMOBILE_DISCOVERY_CHIPS: Array<{ label: string; href: string }> = [
  { label: 'Under ₹5L', href: '/automobile/cars/under-5-lakh' },
  { label: 'Under ₹10L', href: '/automobile/cars/under-10-lakh' },
  { label: 'Under ₹15L', href: '/automobile/cars/under-15-lakh' },
  { label: 'SUV', href: '/automobile/suv' },
  { label: 'Hatchback', href: '/automobile/hatchback' },
  { label: 'Sedan', href: '/automobile/sedan' },
  { label: 'Automatic', href: '/automobile/automatic-cars' },
  { label: 'CNG', href: '/automobile/cng-cars' },
  { label: 'Electric', href: '/automobile/electric-cars' },
  { label: 'Hybrid', href: '/automobile/hybrid-cars' },
  { label: '7 Seater', href: '/automobile/7-seater-cars' },
  { label: 'Best Mileage', href: '/automobile/best-mileage-cars' },
  { label: 'Safety', href: '/automobile/safest-cars' },
  { label: 'Family Cars', href: '/automobile/best-cars-for-families' },
];

const ALL_PAGES = [...AUTOMOBILE_DISCOVERY_PAGES, ...AUTOMOBILE_USE_CASE_PAGES];

export function getAutomobileDiscoveryByPath(path: string): AutomobileDiscoveryPage | null {
  const normalized = path.replace(/\/$/, '') || '/';
  return ALL_PAGES.find((p) => p.path === normalized) ?? null;
}

export function listAutomobileDiscoveryPaths(): string[] {
  return [
    ...ALL_PAGES.map((p) => p.path),
    ...AUTOMOBILE_LAUNCH_PAGES.map((p) => p.path),
    '/automobile/car-finder',
    '/automobile/vehicles',
  ];
}

export function formatAutomobilePriceRange(
  min: number | string | null | undefined,
  max: number | string | null | undefined,
): string | null {
  const a = min == null || min === '' ? null : Number(min);
  const b = max == null || max === '' ? null : Number(max);
  const valid = (n: number | null) => n != null && Number.isFinite(n) && n > 0;
  if (!valid(a) && !valid(b)) return null;
  const fmt = (n: number) => {
    if (n >= 100000) {
      const lakhs = n / 100000;
      const digits = lakhs >= 10 ? 0 : 1;
      return `₹${lakhs.toFixed(digits)} lakh`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n);
  };
  if (valid(a) && valid(b) && a !== b) return `${fmt(a!)} – ${fmt(b!)}`;
  return fmt((valid(a) ? a : b)!);
}

/** Display mileage only when positive. Mixed catalogue units are labelled, never invented. */
export function formatAutomobileMileage(value: number | string | null | undefined): string | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n <= 20) return `${n} L/100km claimed`;
  return `${n} km/l claimed`;
}

export type AutomobileRecommenderInput = {
  budgetMax?: number;
  usage?: 'city' | 'highway' | 'family' | 'mixed';
  monthlyKm?: number;
  familySize?: number;
  fuel?: string;
  transmission?: string;
  priorities?: Array<'mileage' | 'safety' | 'performance' | 'comfort' | 'low_maintenance'>;
};

export type AutomobileRecommenderVehicle = {
  id: string;
  name: string;
  slug: string;
  exShowroomPrice?: number | string | null;
  seatingCapacity?: number | null;
  fuelType?: string | null;
  transmission?: string | null;
  mileage?: number | string | null;
  groundClearance?: number | string | null;
  safetyRating?: number | string | null;
  bodyType?: string | null;
  horsepower?: number | string | null;
};

export function scoreAutomobileRecommendation(
  vehicle: AutomobileRecommenderVehicle,
  input: AutomobileRecommenderInput,
): { score: number; reasons: string[] } {
  let score = 40;
  const reasons: string[] = [];
  const price = vehicle.exShowroomPrice != null ? Number(vehicle.exShowroomPrice) : null;
  if (input.budgetMax && price && price > 0 && price <= input.budgetMax) {
    score += 20;
    reasons.push('Within your budget');
  } else if (input.budgetMax && (price == null || !(price > 0))) {
    reasons.push('Price not published — not treated as a match on budget');
  }
  if (input.familySize && vehicle.seatingCapacity && vehicle.seatingCapacity >= input.familySize) {
    score += 12;
    reasons.push(`Seats ${vehicle.seatingCapacity} for a group of ${input.familySize}`);
  }
  if (input.fuel && vehicle.fuelType?.toLowerCase().includes(input.fuel.toLowerCase())) {
    score += 10;
    reasons.push(`${vehicle.fuelType} matches fuel preference`);
  }
  if (input.transmission === 'automatic' && /auto|amt|cvt|dct/i.test(vehicle.transmission ?? '')) {
    score += 8;
    reasons.push('Automatic available on this record');
  }
  if (input.priorities?.includes('mileage') && Number(vehicle.mileage) > 0) {
    score += 6;
    reasons.push('Claimed efficiency is on file');
  }
  if (input.priorities?.includes('safety') && Number(vehicle.safetyRating) > 0) {
    score += 6;
    reasons.push('A safety rating is stored (check agency)');
  }
  if (input.priorities?.includes('performance') && Number(vehicle.horsepower) > 100) {
    score += 4;
    reasons.push('Power figure above 100 hp on file');
  }
  if (input.usage === 'family' && /suv|muv|mpv|hatch/i.test(vehicle.bodyType ?? '')) {
    score += 4;
    reasons.push('Body type commonly used by families');
  }
  if (Number(vehicle.groundClearance) >= 180) {
    reasons.push('Ground clearance 180 mm or more on file');
    if (input.usage === 'mixed' || input.priorities?.includes('comfort')) score += 3;
  }
  return { score: Math.min(99, score), reasons };
}

export const AUTOMOBILE_ONROAD_METHOD = {
  rtoRate: 0.1,
  insuranceRate: 0.03,
  otherRate: 0.015,
  note: 'Indicative planning split: ~10% registration/RTO, ~3% insurance, ~1.5% other charges on ex-showroom. Not a dealer quotation. Actual state slabs differ.',
};
