/** Construction Materials hub — educational catalog (not CMS product SKUs). */

import { matchMaterialToHubKey } from '@varnarc/validation';

export const MATERIAL_HUB_VERSION = '2026.08.1';

export const MATERIAL_HUB_QUALIFICATION =
  'Educational reference only. Quantities, specifications and price ranges are indicative planning aids — verify with suppliers, codes and your engineer or contractor before purchase or construction.';

export const MATERIAL_CATEGORIES = [
  {
    id: 'structural',
    label: 'Structural',
    description: 'Binders, concrete, steel and aggregates for load-bearing work.',
  },
  { id: 'masonry', label: 'Masonry', description: 'Bricks, blocks and related mortar materials.' },
  { id: 'finishing', label: 'Finishing', description: 'Plaster, paint, tiles and floor finishes.' },
  { id: 'interior', label: 'Interior', description: 'Indoor finishes and fit-out materials.' },
  {
    id: 'exterior',
    label: 'Exterior',
    description: 'Weather-facing finishes and protection layers.',
  },
  { id: 'electrical', label: 'Electrical', description: 'Wiring, conduits and switchgear basics.' },
  { id: 'plumbing', label: 'Plumbing', description: 'Pipes, fittings and sanitary basics.' },
] as const;

export type MaterialCategoryId = (typeof MATERIAL_CATEGORIES)[number]['id'];

export type MaterialLink = { href: string; label: string };

export type MaterialPriceReliability = 'unavailable' | 'indicative' | 'estimated';

export type MaterialFaq = { question: string; answer: string };

export type MaterialPriceByLocation = {
  location: string;
  rangeLabel: string;
  note?: string;
};

export type MaterialTypeOption = {
  name: string;
  summary: string;
};

export type MaterialGuidePage = {
  slug: string;
  name: string;
  shortDescription: string;
  categories: MaterialCategoryId[];
  /** Primary category for hub grouping */
  primaryCategory: MaterialCategoryId;
  unitHint?: string;
  calculator?: MaterialLink;
  priceLink?: MaterialLink;
  comparisonLinks: MaterialLink[];
  guideLinks: MaterialLink[];
  overview: string;
  commonUses: string[];
  specifications: string[];
  priceRange?: {
    reliability: MaterialPriceReliability;
    label: string;
    detail: string;
  };
  priceByLocation: MaterialPriceByLocation[];
  types: MaterialTypeOption[];
  buyingConsiderations: string[];
  faqs: MaterialFaq[];
  relatedMaterialSlugs: string[];
  methodology: string;
  seoTitle: string;
  seoDescription: string;
};

export type MaterialHubCard = {
  slug: string;
  name: string;
  shortDescription: string;
  categories: MaterialCategoryId[];
  primaryCategory: MaterialCategoryId;
  calculator?: MaterialLink;
  priceLink?: MaterialLink;
  comparisonLinks: MaterialLink[];
  guideLinks: MaterialLink[];
};

function priceSearch(term: string): MaterialLink {
  const hubKey = matchMaterialToHubKey(term);
  if (hubKey) {
    return {
      href: `/construction/prices?material=${hubKey}`,
      label: 'Browse construction prices',
    };
  }
  return {
    href: `/construction/materials?search=${encodeURIComponent(term)}`,
    label: 'Browse published catalog',
  };
}

function guidesHub(label = 'Construction guides'): MaterialLink {
  return {
    href: '/construction/guides',
    label,
  };
}

/** Full educational pages — objective, planning-oriented copy. */
export const MATERIAL_GUIDE_PAGES: MaterialGuidePage[] = [
  {
    slug: 'cement',
    name: 'Cement',
    shortDescription:
      'Hydraulic binder used in concrete, masonry mortar, plaster and screed. Bagged OPC/PPC grades are common on Indian sites.',
    categories: ['structural', 'masonry', 'finishing'],
    primaryCategory: 'structural',
    unitHint: 'kg / 50 kg bag',
    calculator: { href: '/construction/cement-calculator', label: 'Cement calculator' },
    priceLink: priceSearch('cement'),
    comparisonLinks: [
      { href: '/construction/materials/concrete', label: 'Concrete overview' },
      { href: '/construction/materials/plaster', label: 'Plaster overview' },
      { href: '/construction/compare/opc-vs-ppc', label: 'OPC vs PPC comparison' },
    ],
    guideLinks: [guidesHub(), { href: '/construction/faqs', label: 'Construction FAQs' }],
    overview:
      'Cement is a fine powder that reacts with water to form a binder. In building work it is almost always used as part of a mix with sand, aggregate or both — not as a standalone structural material. Grade, type (OPC vs PPC/blended) and freshness affect strength development and workability.',
    commonUses: [
      'Structural concrete (slabs, beams, columns, footings) to engineer-specified mixes',
      'Masonry mortar for brick and block walls',
      'Internal and external plaster',
      'Floor screeds and bedding mortars',
    ],
    specifications: [
      'Confirm cement type and grade on the bag and delivery note (e.g. OPC 43/53, PPC).',
      'Typical bag size in India: 50 kg (also 25/40 kg in some markets) — always check packaging.',
      'Store dry, off the ground, away from moisture; use older stock first (FIFO).',
      'Mix ratios (1:1.5:3, 1:2:4, etc.) are planning aids — follow structural drawings for structural concrete.',
      'Setting and strength development depend on water content, curing and temperature.',
    ],
    priceRange: {
      reliability: 'indicative',
      label: 'Indicative retail range (India, bagged)',
      detail:
        'Published catalog prices on Varnarc (when available) and market surveys often place common PPC/OPC 50 kg bags in a broad retail band that varies by brand, city and fuel costs. Treat any figure as a planning placeholder — verify the day rate with local dealers.',
    },
    priceByLocation: [
      {
        location: 'Metro cities (e.g. Hyderabad, Bengaluru, Mumbai)',
        rangeLabel: 'Verify locally',
        note: 'Dealer and RMC plant rates differ; transport adds cost.',
      },
      {
        location: 'Tier-2 / town markets',
        rangeLabel: 'Verify locally',
        note: 'Often competitive on bagged cement; confirm grade availability.',
      },
      {
        location: 'Project bulk / RMC',
        rangeLabel: 'Contract rate',
        note: 'Site deliveries and ready-mix quotes replace bag retail pricing.',
      },
    ],
    types: [
      {
        name: 'OPC (Ordinary Portland Cement)',
        summary:
          'Faster early strength; common where early stripping or higher early strength is needed — confirm grade with engineer.',
      },
      {
        name: 'PPC / blended cement',
        summary:
          'Fly-ash or other blend components; often preferred for general masonry/plaster and many concretes where specified.',
      },
      {
        name: 'Specialty cements',
        summary:
          'Sulphate-resistant, low-heat, white cement, etc. — use only when specifications require them.',
      },
    ],
    buyingConsiderations: [
      'Buy from sealed bags with clear manufacturing and batch markings.',
      'Avoid damp, hardened or torn bags.',
      'Match type/grade to the structural or finishing specification — do not substitute blindly.',
      'For large pours, compare bagged vs ready-mix economics including labour and wastage.',
      'Keep invoices and batch details for quality disputes.',
    ],
    faqs: [
      {
        question: 'Is OPC always better than PPC?',
        answer:
          'No. Suitability depends on the application and the project specification. PPC/blended cements are widely used for general construction; OPC may be specified where early strength or particular performance is required. Follow the engineer’s note.',
      },
      {
        question: 'How many bags per cubic metre of concrete?',
        answer:
          'It depends on the mix ratio, dry volume factor and wastage. Use the cement calculator with your mix and wastage assumptions rather than a single rule of thumb.',
      },
      {
        question: 'Does Varnarc sell cement?',
        answer:
          'No. Varnarc provides educational tools and may show indicative or published catalog prices from data partners. Purchase from local suppliers.',
      },
    ],
    relatedMaterialSlugs: ['concrete', 'sand', 'aggregate', 'plaster', 'brick'],
    methodology:
      'Content synthesises common IS-practice planning language and site practice. Price notes are not live feeds; when Varnarc shows approximate prices they come from published ConstructionMaterial records or editorial surveys labelled as indicative. Quantity methods live in the Cement Calculator engine.',
    seoTitle: 'Cement for Construction — Types, Uses & Calculator | Varnarc',
    seoDescription:
      'Objective guide to construction cement: common uses, OPC vs PPC, specifications, buying tips, indicative price context and cement quantity calculator.',
  },
  {
    slug: 'concrete',
    name: 'Concrete',
    shortDescription:
      'Composite of cement, sand, aggregate and water (plus admixtures when specified). Strength grades such as M20/M25 are planning labels — design governs.',
    categories: ['structural'],
    primaryCategory: 'structural',
    unitHint: 'm³',
    calculator: { href: '/construction/concrete-calculator', label: 'Concrete calculator' },
    priceLink: priceSearch('concrete'),
    comparisonLinks: [
      { href: '/construction/materials/cement', label: 'Cement' },
      { href: '/construction/materials/steel', label: 'Steel (TMT)' },
      { href: '/construction/rcc-calculator', label: 'RCC volume calculator' },
    ],
    guideLinks: [guidesHub(), { href: '/construction/faqs', label: 'Construction FAQs' }],
    overview:
      'Concrete gains strength as cement hydrates. Site-mixed and ready-mix (RMC) are both common. Workability, compaction and curing are as important as mix proportions for durability.',
    commonUses: [
      'Foundations, footings and grade slabs',
      'Columns, beams and slabs in RCC frames',
      'Retaining walls, lintels and water-retaining members (with specified mixes)',
      'Plain cement concrete (PCC) beds and levelling courses',
    ],
    specifications: [
      'Grade (e.g. M20) refers to characteristic compressive strength — confirm with structural drawings.',
      'Nominal mix ratios are planning tools; designed mixes use batch weights and often admixtures.',
      'Control water–cement ratio; excess water reduces strength.',
      'Cover to reinforcement, aggregate size and placement method are part of the specification.',
      'Curing period and method affect long-term performance.',
    ],
    priceRange: {
      reliability: 'estimated',
      label: 'Indicative ₹/m³ (site-mix vs RMC)',
      detail:
        'Ready-mix quotes are typically per cubic metre including delivery radius. Site-mix cost is materials + labour + equipment. Ranges move with cement, aggregate and fuel — use local quotes for budgeting.',
    },
    priceByLocation: [
      {
        location: 'Urban RMC plants',
        rangeLabel: 'Plant quote',
        note: 'Ask for grade, slump, admixture and unloading terms.',
      },
      {
        location: 'Remote sites',
        rangeLabel: 'Higher logistics',
        note: 'Transit time and small pour premiums matter.',
      },
    ],
    types: [
      { name: 'PCC (plain)', summary: 'No reinforcement; levelling and bedding.' },
      {
        name: 'RCC (reinforced)',
        summary: 'Concrete + steel; member sizes from structural design.',
      },
      {
        name: 'RMC',
        summary: 'Plant-batched delivery; useful for quality control on larger pours.',
      },
    ],
    buyingConsiderations: [
      'For RMC: confirm grade, slump, max aggregate size and placement window.',
      'For site mix: calibrate batching (volume vs weight) and washer/silt in sand/aggregate.',
      'Plan pour joints and vibration equipment before ordering.',
      'Reject concrete that has begun to set in transit unless the engineer allows remediation.',
    ],
    faqs: [
      {
        question: 'Can I use the calculator instead of a structural design?',
        answer:
          'No. Volume and material splits are for planning. Member sizes, grades and reinforcement must come from a qualified design.',
      },
      {
        question: 'What is dry volume vs wet volume?',
        answer:
          'Wet volume is the compacted concrete volume in place. Dry volume factors account for bulking of materials when converting to cement/sand/aggregate quantities.',
      },
    ],
    relatedMaterialSlugs: ['cement', 'sand', 'aggregate', 'steel'],
    methodology:
      'Educational overview aligned with common RCC practice. Quantity math is implemented in the Concrete Calculator; steel for RCC members is not invented from architectural sizes alone.',
    seoTitle: 'Concrete in Construction — Grades, Uses & Volume Calculator | Varnarc',
    seoDescription:
      'Learn how concrete is used in buildings, what grades mean, PCC vs RCC vs RMC, buying checks and an indicative volume calculator.',
  },
  {
    slug: 'steel',
    name: 'Steel (TMT / rebar)',
    shortDescription:
      'Reinforcement bars (typically TMT) used in RCC. Weight follows the d²/162 rule for metre lengths — design dictates diameters and spacing.',
    categories: ['structural'],
    primaryCategory: 'structural',
    unitHint: 'kg / tonne',
    calculator: { href: '/construction/steel-calculator', label: 'Steel calculator' },
    priceLink: priceSearch('steel'),
    comparisonLinks: [
      { href: '/construction/materials/concrete', label: 'Concrete' },
      { href: '/construction/bbs-calculator', label: 'BBS organiser' },
      { href: '/construction/compare', label: 'Compare steel SKUs' },
    ],
    guideLinks: [guidesHub()],
    overview:
      'Reinforcement steel carries tensile forces in RCC. Bar diameter, grade (e.g. Fe500/Fe550), length, bends and laps are specified on structural drawings and schedules. Market prices are usually quoted per kilogram or tonne and move with commodity cycles.',
    commonUses: [
      'Slabs, beams, columns and footings',
      'Stirrups, links and distribution steel',
      'Lintels, chajjas and staircase flights',
      'Mesh / fabric where specified',
    ],
    specifications: [
      'Confirm grade markings on bars and mill test certificates for larger lots.',
      'Nominal diameters (8, 10, 12, 16, 20, 25 mm, etc.) — measure if unmarked.',
      'Store clear of mud and excessive rust; light mill scale is common.',
      'Cutting, bending and lap lengths must follow the bar bending schedule / IS practice as specified.',
      'Do not substitute diameters or reduce steel without engineer approval.',
    ],
    priceRange: {
      reliability: 'indicative',
      label: 'Indicative ₹/kg (TMT)',
      detail:
        'Dealer rates vary by diameter, brand, cut length and city. Published Varnarc catalog prices (when present) are approximate — confirm the day’s rate and GST terms.',
    },
    priceByLocation: [
      {
        location: 'Major metros',
        rangeLabel: 'Verify day rate',
        note: 'Often more brand choice; watch cutting charges.',
      },
      {
        location: 'Project sites',
        rangeLabel: 'Delivered tonne rate',
        note: 'Include unloading and wastage for offcuts.',
      },
    ],
    types: [
      { name: 'TMT bars', summary: 'Thermo-mechanically treated bars; dominant for RCC in India.' },
      {
        name: 'CRS / specialty',
        summary:
          'Corrosion-resistant or other specialty grades when specified for aggressive environments.',
      },
      {
        name: 'Binding wire',
        summary: 'Consumable for tying — estimate separately from structural steel tonnage.',
      },
    ],
    buyingConsiderations: [
      'Prefer identifiable brands with test certificates for structural works.',
      'Weigh sample bundles if buying by theoretical weight disputes arise.',
      'Plan cutting lists to reduce scrap.',
      'Align delivery with pour schedule to limit site storage corrosion.',
    ],
    faqs: [
      {
        question: 'What is the d²/162 formula?',
        answer:
          'For steel bars, approximate weight in kg per metre ≈ d²/162 where d is diameter in mm. Calculators use this for planning tonnage from schedules.',
      },
      {
        question: 'Does rust mean bars are unusable?',
        answer:
          'Light surface rust is often cleaned and accepted per site practice; heavy flaking rust or section loss needs engineer review. Follow project quality rules.',
      },
    ],
    relatedMaterialSlugs: ['concrete', 'cement', 'aggregate'],
    methodology:
      'Weight methods match the Steel Calculator (d²/162). This page does not design reinforcement. Price commentary is indicative only.',
    seoTitle: 'TMT Steel / Rebar — Weight, Uses & Calculator | Varnarc',
    seoDescription:
      'Educational guide to reinforcement steel: uses, grades, buying checks, indicative pricing context and TMT weight calculator.',
  },
  {
    slug: 'aggregate',
    name: 'Aggregate (coarse)',
    shortDescription:
      'Crushed stone / jelly used in concrete and some base layers. Size grading (e.g. 20 mm) affects mix design and pumpability.',
    categories: ['structural'],
    primaryCategory: 'structural',
    unitHint: 'm³ / tonne',
    calculator: { href: '/construction/aggregate-calculator', label: 'Aggregate calculator' },
    priceLink: priceSearch('aggregate'),
    comparisonLinks: [
      { href: '/construction/materials/sand', label: 'Sand' },
      { href: '/construction/materials/concrete', label: 'Concrete' },
    ],
    guideLinks: [guidesHub()],
    overview:
      'Coarse aggregate provides bulk and strength to concrete. Cleanliness (low silt/clay), shape and grading matter. Sources and quarry quality vary by region.',
    commonUses: [
      'Structural and plain concrete',
      'Some drainage and hardcore layers (as specified)',
      'Blinding and selected fill where allowed',
    ],
    specifications: [
      'Match nominal maximum size to cover, member thickness and pump/hose limits.',
      'Wash or reject dirty aggregate that stains water excessively.',
      'Report bulk density if converting tonnes ↔ m³ for ordering.',
      'Keep stockpiles segregated by size where multiple grades are used.',
    ],
    priceRange: {
      reliability: 'estimated',
      label: 'Indicative ₹/m³ or ₹/tonne',
      detail:
        'Quarry distance dominates price. Ask whether quotes are loose volume or weighed tonnes and whether loading is included.',
    },
    priceByLocation: [
      {
        location: 'Near quarries',
        rangeLabel: 'Lower haul cost',
        note: 'Confirm grading consistency.',
      },
      {
        location: 'Dense urban cores',
        rangeLabel: 'Higher delivered cost',
        note: 'Small-load premiums are common.',
      },
    ],
    types: [
      { name: '20 mm crushed', summary: 'Common for many structural mixes.' },
      {
        name: '10–12 mm',
        summary: 'Often used in thinner members or with pumps — follow mix design.',
      },
      { name: 'Graded blends', summary: 'Combined sizes for specific designs.' },
    ],
    buyingConsiderations: [
      'Inspect for soft stone, excessive flaky particles and clay lumps.',
      'Clarify unit (brass, m³, tonne) before comparing quotes.',
      'Plan moisture: wet aggregate changes batch water demand.',
    ],
    faqs: [
      {
        question: 'Is “jelly” the same as aggregate?',
        answer:
          'In many Indian sites “jelly” or “metal” colloquially means coarse aggregate. Confirm size and source when ordering.',
      },
    ],
    relatedMaterialSlugs: ['sand', 'cement', 'concrete'],
    methodology:
      'Volume planning via Aggregate Calculator with editable density. Regional prices must be verified with suppliers.',
    seoTitle: 'Construction Aggregate — Sizes, Uses & Calculator | Varnarc',
    seoDescription:
      'Guide to coarse aggregate for concrete: sizes, cleanliness, ordering units, indicative cost context and quantity calculator.',
  },
  {
    slug: 'sand',
    name: 'Sand',
    shortDescription:
      'Fine aggregate for concrete, mortar and plaster. River sand and manufactured sand (M-sand) are both used — grading and silt content matter.',
    categories: ['structural', 'masonry', 'finishing'],
    primaryCategory: 'structural',
    unitHint: 'm³ / tonne',
    calculator: { href: '/construction/sand-calculator', label: 'Sand calculator' },
    priceLink: priceSearch('sand'),
    comparisonLinks: [
      { href: '/construction/materials/aggregate', label: 'Aggregate' },
      { href: '/construction/materials/plaster', label: 'Plaster' },
      { href: '/construction/materials/cement', label: 'Cement' },
    ],
    guideLinks: [guidesHub()],
    overview:
      'Sand fills voids between coarse aggregate in concrete and is the main bulk of masonry/plaster mortars. Excess silt weakens mixes; bulking of moist sand affects volume batching.',
    commonUses: [
      'Concrete fine aggregate',
      'Brick/block mortar',
      'Plaster and rendering',
      'Bedding and filling (as specified)',
    ],
    specifications: [
      'Check silt/clay with field jar tests or lab reports when quality is uncertain.',
      'M-sand should meet grading limits suitable for the intended use (concrete vs plaster).',
      'Account for bulking when batching by volume with moist sand.',
      'Keep plaster sand freer of coarse grit than concrete sand when specified.',
    ],
    priceRange: {
      reliability: 'estimated',
      label: 'Indicative ₹/m³ or ₹/tonne',
      detail:
        'River sand restrictions and transport distance drive large regional differences. Compare M-sand alternatives on grading and price, not name alone.',
    },
    priceByLocation: [
      {
        location: 'Coastal / river-access markets',
        rangeLabel: 'Verify legality & rate',
        note: 'Source compliance matters.',
      },
      {
        location: 'Inland cities using M-sand',
        rangeLabel: 'Plant rate + freight',
        note: 'Ask for concrete-grade vs plaster-grade.',
      },
    ],
    types: [
      {
        name: 'River sand',
        summary: 'Traditional fine aggregate where legally and sustainably available.',
      },
      {
        name: 'M-sand (manufactured)',
        summary: 'Crushed fine aggregate; widely used as alternative — confirm grading.',
      },
      { name: 'Plaster sand', summary: 'Finer grading for finishes when specified.' },
    ],
    buyingConsiderations: [
      'Reject loads with visible clay balls or organic debris.',
      'Clarify whether price is for dry or moist volume.',
      'Match sand type to mix (concrete vs plaster).',
    ],
    faqs: [
      {
        question: 'Can I replace river sand with M-sand 1:1?',
        answer:
          'Often yes for many mixes when grading is suitable, but water demand and finish can differ. Follow mix trials or engineer guidance for structural concrete.',
      },
    ],
    relatedMaterialSlugs: ['aggregate', 'cement', 'concrete', 'plaster', 'brick'],
    methodology:
      'Sand Calculator estimates volumes with editable density. Educational notes reflect common site practice; local geology and regulations apply.',
    seoTitle: 'Construction Sand — Types, Uses & Calculator | Varnarc',
    seoDescription:
      'River sand vs M-sand, uses in concrete and mortar, quality checks, indicative pricing context and sand quantity calculator.',
  },
  {
    slug: 'brick',
    name: 'Brick (clay / red brick)',
    shortDescription:
      'Fired clay units for masonry walls. Modular and traditional sizes exist; mortar joints and openings drive quantity.',
    categories: ['masonry'],
    primaryCategory: 'masonry',
    unitHint: 'nos',
    calculator: { href: '/construction/brick-calculator', label: 'Brick calculator' },
    priceLink: priceSearch('brick'),
    comparisonLinks: [
      { href: '/construction/materials/aac-blocks', label: 'AAC blocks' },
      { href: '/construction/compare/aac-vs-brick', label: 'AAC vs brick comparison' },
    ],
    guideLinks: [guidesHub()],
    overview:
      'Clay bricks remain common for load-bearing and partition walls where specified. Strength, water absorption and dimensional tolerance vary by kiln and region.',
    commonUses: [
      'External and internal masonry walls',
      'Partition walls',
      'Some landscaping and paving (engineering bricks as specified)',
    ],
    specifications: [
      'Confirm nominal size (including intended mortar joint) before calculating.',
      'First-class vs second-class brick quality affects strength and finish.',
      'Soak bricks before laying when required by practice to reduce suction.',
      'Bond pattern and jamb details affect wastage at openings.',
    ],
    priceRange: {
      reliability: 'indicative',
      label: 'Indicative ₹ per thousand / per brick',
      detail:
        'Quotes are often per 1000 bricks. Quality class and transport distance dominate. Catalog prices on Varnarc are approximate when published.',
    },
    priceByLocation: [
      {
        location: 'Brick kiln clusters',
        rangeLabel: 'Ex-kiln vs delivered',
        note: 'Clarify loading and breakage allowance.',
      },
      {
        location: 'Import to metros',
        rangeLabel: 'Higher freight',
        note: 'Compare with AAC on wall system cost, not unit price alone.',
      },
    ],
    types: [
      { name: 'Burnt clay bricks', summary: 'Traditional red bricks; quality varies.' },
      { name: 'Modular bricks', summary: 'Sized for modular planning with mortar joints.' },
      {
        name: 'Engineering / specialty',
        summary: 'Higher strength or low absorption when specified.',
      },
    ],
    buyingConsiderations: [
      'Sample for soundness (ring), shape and cracks.',
      'Include mortar, labour and plaster when comparing to AAC.',
      'Plan stacking to reduce breakage.',
    ],
    faqs: [
      {
        question: 'How do I estimate bricks for a wall?',
        answer:
          'Use wall area, brick size, mortar joint thickness, openings and wastage in the Brick Calculator. Reverse mode estimates coverage from a brick count.',
      },
    ],
    relatedMaterialSlugs: ['aac-blocks', 'cement', 'sand', 'plaster'],
    methodology:
      'Quantities from Brick Calculator assumptions (joint, wastage, openings). Strength design is outside this guide.',
    seoTitle: 'Clay Bricks — Uses, Sizes & Brick Calculator | Varnarc',
    seoDescription:
      'Educational brick masonry guide: common uses, quality checks, comparison with AAC, indicative prices and quantity calculator.',
  },
  {
    slug: 'aac-blocks',
    name: 'AAC blocks',
    shortDescription:
      'Lightweight autoclaved aerated concrete blocks for walls. Larger unit size and thin-bed mortar change labour and adhesive estimates versus clay brick.',
    categories: ['masonry', 'interior', 'exterior'],
    primaryCategory: 'masonry',
    unitHint: 'nos / m³',
    calculator: { href: '/construction/aac-block-calculator', label: 'AAC block calculator' },
    priceLink: priceSearch('aac'),
    comparisonLinks: [
      { href: '/construction/materials/brick', label: 'Clay brick' },
      { href: '/construction/compare/aac-vs-brick', label: 'Compare AAC vs brick' },
    ],
    guideLinks: [guidesHub()],
    overview:
      'AAC offers lower density and often faster walling with larger blocks. Fixings, chasing for services and plaster systems should follow manufacturer and engineer guidance.',
    commonUses: [
      'Internal partitions',
      'External walls where the structural system allows',
      'Infills in RCC frames',
    ],
    specifications: [
      'Confirm block dimensions (length × height × thickness) and density grade.',
      'Use recommended thin-bed adhesive or mortar system — do not assume brick mortar joints.',
      'Detail movement joints and bearing as specified.',
      'Use compatible fasteners for cabinets and fixtures.',
    ],
    priceRange: {
      reliability: 'indicative',
      label: 'Indicative ₹ per block or ₹/m³',
      detail:
        'Compare landed cost of blocks + adhesive + labour + plaster against brick systems. Piece price alone is misleading.',
    },
    priceByLocation: [
      {
        location: 'Near AAC plants',
        rangeLabel: 'Lower freight',
        note: 'Breakage in transit is a real cost.',
      },
      {
        location: 'Far from plants',
        rangeLabel: 'Freight-sensitive',
        note: 'Get delivered quotes including unloading.',
      },
    ],
    types: [
      { name: 'Standard wall blocks', summary: 'Common partition and infill sizes.' },
      { name: 'Lintels / U-blocks', summary: 'Specialty shapes where the system provides them.' },
    ],
    buyingConsiderations: [
      'Check edge damage and dimensional consistency on delivery.',
      'Store on level ground; protect from saturating rain before laying if required by maker.',
      'Train masons on thin-bed technique if switching from brick.',
    ],
    faqs: [
      {
        question: 'Are AAC walls always cheaper than brick?',
        answer:
          'Not always. Material, adhesive, labour productivity, plaster thickness and structural constraints all affect system cost. Compare full wall assemblies.',
      },
    ],
    relatedMaterialSlugs: ['brick', 'cement', 'plaster', 'paint'],
    methodology:
      'AAC Calculator models openings, joints, wastage and adhesive estimates. Structural suitability must be confirmed for each project.',
    seoTitle: 'AAC Blocks — Uses, Comparison & Calculator | Varnarc',
    seoDescription:
      'Objective AAC block guide: uses, specifications, buying tips, brick comparison links and AAC quantity calculator.',
  },
  {
    slug: 'plaster',
    name: 'Plaster',
    shortDescription:
      'Cement–sand (or gypsum) coating for walls and ceilings. Thickness and mix differ for internal vs external work.',
    categories: ['finishing', 'exterior', 'interior'],
    primaryCategory: 'finishing',
    unitHint: 'm² / mortar m³',
    calculator: { href: '/construction/plaster-calculator', label: 'Plaster calculator' },
    priceLink: priceSearch('plaster'),
    comparisonLinks: [
      { href: '/construction/materials/paint', label: 'Paint' },
      { href: '/construction/materials/cement', label: 'Cement' },
      { href: '/construction/materials/sand', label: 'Sand' },
    ],
    guideLinks: [guidesHub()],
    overview:
      'Plaster levels masonry, protects surfaces and prepares for paint or other finishes. External plaster faces weather; internal plaster prioritises finish and often thinner coats.',
    commonUses: [
      'Internal wall and ceiling plaster',
      'External rendering',
      'Repair and patching of masonry',
    ],
    specifications: [
      'Typical cement plaster thicknesses are project-specific (often in the 6–20 mm band depending on substrate and coat).',
      'Mix ratios (e.g. 1:4, 1:6) are planning defaults — follow finishing specs.',
      'Cure cement plaster; avoid rapid drying in hot wind.',
      'Gypsum plaster systems follow manufacturer thickness and substrate rules.',
    ],
    priceRange: {
      reliability: 'estimated',
      label: 'Indicative ₹/m² (labour + material)',
      detail:
        'Quotes are often per square metre inclusive. Material-only estimates understate cost — include scaffolding and curing.',
    },
    priceByLocation: [
      {
        location: 'Urban labour markets',
        rangeLabel: 'Higher labour component',
        note: 'Finish grade (smooth vs sandy) changes price.',
      },
      {
        location: 'Material-led quotes',
        rangeLabel: 'Cement + sand driven',
        note: 'Use calculator for mortar volume then add labour.',
      },
    ],
    types: [
      {
        name: 'Cement–sand plaster',
        summary: 'Most common on masonry exteriors and many interiors.',
      },
      { name: 'Gypsum plaster', summary: 'Interior finish system with different substrate prep.' },
      { name: 'Rough cast / textured', summary: 'External aesthetics as specified.' },
    ],
    buyingConsiderations: [
      'Agree thickness, number of coats and finish before locking ₹/m².',
      'Inspect substrate (joint raking, wetting) as part of quality.',
      'Coordinate electrical/plumbing chasing before final coats.',
    ],
    faqs: [
      {
        question: 'How much cement for plaster?',
        answer:
          'Depends on area, thickness, mix and wastage. The Plaster Calculator estimates mortar volume, cement bags and sand.',
      },
    ],
    relatedMaterialSlugs: ['cement', 'sand', 'paint', 'brick', 'aac-blocks'],
    methodology:
      'Plaster Calculator uses wet/dry mortar volume with editable thickness and mix. Gypsum proprietary systems need manufacturer data.',
    seoTitle: 'Wall Plaster — Mixes, Uses & Calculator | Varnarc',
    seoDescription:
      'Cement and gypsum plaster overview: uses, thickness notes, buying checks and plaster quantity calculator.',
  },
  {
    slug: 'paint',
    name: 'Paint',
    shortDescription:
      'Decorative and protective coatings for interior and exterior surfaces. Coverage (m²/L) and coats drive litre estimates.',
    categories: ['finishing', 'interior', 'exterior'],
    primaryCategory: 'finishing',
    unitHint: 'litre',
    calculator: { href: '/construction/paint-calculator', label: 'Paint calculator' },
    priceLink: priceSearch('paint'),
    comparisonLinks: [
      { href: '/construction/materials/plaster', label: 'Plaster' },
      { href: '/construction/materials/waterproofing', label: 'Waterproofing' },
      { href: '/construction/compare', label: 'Compare paint SKUs' },
    ],
    guideLinks: [guidesHub()],
    overview:
      'Paint systems usually include primer, putty (as needed) and finish coats. Substrate porosity, colour change and sheen affect consumption. Exterior systems need UV and weather resistance.',
    commonUses: [
      'Interior walls and ceilings',
      'Exterior façades',
      'Metal and wood finishes (product-specific)',
    ],
    specifications: [
      'Use coverage rates from the product data sheet when available; calculators allow overrides.',
      'Number of coats depends on colour change and finish standard.',
      'Deduct doors/windows or use net wall area methods consistently.',
      'Surface preparation quality dominates long-term appearance.',
    ],
    priceRange: {
      reliability: 'indicative',
      label: 'Indicative ₹/L by tier',
      detail:
        'Economy, mid and premium emulsions differ widely. Compare on coverage and warranty claims, not litre price alone. Catalog prices when shown are approximate.',
    },
    priceByLocation: [
      {
        location: 'Dealer networks in metros',
        rangeLabel: 'MRP vs project rate',
        note: 'Project packs may differ from retail cans.',
      },
      {
        location: 'Labour-inclusive painting contracts',
        rangeLabel: '₹/m²',
        note: 'Clarify coats, putty and scaffolding.',
      },
    ],
    types: [
      {
        name: 'Interior emulsion',
        summary: 'Common wall finishes; washability varies by product.',
      },
      { name: 'Exterior emulsion / weather coats', summary: 'Formulated for façades.' },
      {
        name: 'Primers & putty',
        summary: 'System components — estimate separately when relevant.',
      },
      { name: 'Enamels / specialty', summary: 'Wood, metal and high-humidity areas as specified.' },
    ],
    buyingConsiderations: [
      'Match interior vs exterior product lines.',
      'Batch numbers for large contiguous walls reduce shade variation.',
      'Store sealed; note shelf life.',
      'Dispose leftovers responsibly.',
    ],
    faqs: [
      {
        question: 'How many litres for a room?',
        answer:
          'Use the Paint Calculator with room dimensions or wall area, coats and coverage. Results are indicative — site texture and colour change alter consumption.',
      },
    ],
    relatedMaterialSlugs: ['plaster', 'waterproofing', 'tiles'],
    methodology:
      'Litre estimates from Paint Calculator coverage and coat assumptions. Brand performance claims are not endorsed.',
    seoTitle: 'Paint for Buildings — Coverage, Types & Calculator | Varnarc',
    seoDescription:
      'Interior and exterior paint guide: system coats, buying tips, indicative price context and paint quantity calculator.',
  },
  {
    slug: 'tiles',
    name: 'Tiles',
    shortDescription:
      'Ceramic, vitrified and other tile units for floors and walls. Tile size, layout and wastage drive box counts.',
    categories: ['finishing', 'interior'],
    primaryCategory: 'finishing',
    unitHint: 'm² / box',
    calculator: { href: '/construction/tile-calculator', label: 'Tile calculator' },
    priceLink: priceSearch('tile'),
    comparisonLinks: [
      { href: '/construction/materials/flooring', label: 'Flooring options' },
      { href: '/construction/compare/vitrified-vs-ceramic-tiles', label: 'Vitrified vs ceramic' },
    ],
    guideLinks: [guidesHub()],
    overview:
      'Tiles are selected for abrasion, slip resistance, water absorption and aesthetics. Layout (straight, brick, diagonal) and cut waste at edges affect purchase quantity.',
    commonUses: [
      'Floor tiling in wet and dry areas',
      'Wall tiles in kitchens and bathrooms',
      'Feature walls and dados',
    ],
    specifications: [
      'Note actual tile size including intended grout joint for accurate estimates.',
      'PEI/abrasion and slip ratings matter for floors.',
      'Waterproofing under wet-area tiles is a separate system — plan it.',
      'Movement joints may be required in large floors.',
    ],
    priceRange: {
      reliability: 'indicative',
      label: 'Indicative ₹/m² by tier',
      detail:
        'Tile MRP spans economy to premium. Installation, adhesive, grout and waterproofing often rival tile cost — budget the full system.',
    },
    priceByLocation: [
      {
        location: 'Factory outlets / hubs',
        rangeLabel: 'Lower tile MRP',
        note: 'Freight and breakage still apply.',
      },
      {
        location: 'Installed contracts',
        rangeLabel: '₹/m² installed',
        note: 'Define adhesive brand, grout and curing.',
      },
    ],
    types: [
      { name: 'Ceramic', summary: 'Common for walls and lighter floor duty.' },
      { name: 'Vitrified', summary: 'Dense body; popular for floors.' },
      {
        name: 'Porcelain / specialty',
        summary: 'Higher performance categories as labelled by makers.',
      },
    ],
    buyingConsiderations: [
      'Order from one batch for shade consistency; keep 5–10% extra for repairs.',
      'Inspect for warpage and chips on delivery.',
      'Confirm box coverage (m² per box) on the carton.',
    ],
    faqs: [
      {
        question: 'How much wastage should I add?',
        answer:
          'Depends on layout and room shape; calculators include editable wastage. Complex patterns and diagonals need more.',
      },
    ],
    relatedMaterialSlugs: ['flooring', 'waterproofing', 'paint'],
    methodology:
      'Tile Calculator estimates from room and tile size with optional grout and boxes. Product endorsements are avoided.',
    seoTitle: 'Floor & Wall Tiles — Types, Buying & Calculator | Varnarc',
    seoDescription:
      'Tile materials overview: types, specifications, full-system cost notes and tile quantity calculator.',
  },
  {
    slug: 'flooring',
    name: 'Flooring',
    shortDescription:
      'Floor finish systems including tiles, stone, wood/laminate, vinyl and others. Net area and purchase area differ after wastage.',
    categories: ['finishing', 'interior'],
    primaryCategory: 'finishing',
    unitHint: 'm²',
    calculator: { href: '/construction/flooring-calculator', label: 'Flooring calculator' },
    priceLink: priceSearch('flooring'),
    comparisonLinks: [
      { href: '/construction/materials/tiles', label: 'Tiles' },
      { href: '/construction/materials/waterproofing', label: 'Waterproofing' },
    ],
    guideLinks: [guidesHub()],
    overview:
      'Flooring choice balances durability, acoustics, moisture risk, maintenance and cost. Subfloor flatness and moisture testing are often more critical than the finish brand.',
    commonUses: [
      'Living and bedroom floors',
      'Wet areas (with suitable materials)',
      'Commercial and high-traffic spaces (specified products)',
    ],
    specifications: [
      'Measure net floor area carefully; stairs and niches add complexity.',
      'Moisture-sensitive finishes need dry subfloors.',
      'Underlays, adhesives and transition profiles are part of the system.',
      'Stone thicknesses and tile PEI ratings should match traffic.',
    ],
    priceRange: {
      reliability: 'estimated',
      label: 'Indicative ₹/m² installed ranges by category',
      detail:
        'Wide spread from vinyl/laminate to marble. Always separate material MRP from installation labour and substrate prep.',
    },
    priceByLocation: [
      {
        location: 'Stone yards',
        rangeLabel: 'Slab rate + fabrication',
        note: 'Polishing and wastage are significant.',
      },
      {
        location: 'Engineered wood dealers',
        rangeLabel: 'Plank rate + underlay',
        note: 'Acclimatisation rules apply.',
      },
    ],
    types: [
      { name: 'Tile / stone', summary: 'Rigid finishes; grout and waterproofing as needed.' },
      { name: 'Wood / laminate', summary: 'Comfort and aesthetics; moisture caution.' },
      { name: 'Vinyl / resilient', summary: 'Often quicker install; check wear layer.' },
    ],
    buyingConsiderations: [
      'Request installed samples on your subfloor where possible.',
      'Clarify warranty exclusions (water, sunlight, chairs).',
      'Plan skirtings and door undercuts.',
    ],
    faqs: [
      {
        question: 'How is flooring area estimated?',
        answer:
          'Sum room areas (or use multi-room rows in the Flooring Calculator), then apply wastage appropriate to the material and layout.',
      },
    ],
    relatedMaterialSlugs: ['tiles', 'waterproofing', 'paint'],
    methodology:
      'Flooring Calculator focuses on area and purchase quantity by finish category without endorsing brands.',
    seoTitle: 'Flooring Materials — Options, Cost Notes & Calculator | Varnarc',
    seoDescription:
      'Compare flooring categories objectively: uses, specs, buying checks and flooring area calculator.',
  },
  {
    slug: 'waterproofing',
    name: 'Waterproofing',
    shortDescription:
      'Systems that reduce water ingress in bathrooms, terraces, basements and exteriors. Product chemistry varies — follow system data sheets.',
    categories: ['exterior', 'finishing'],
    primaryCategory: 'exterior',
    unitHint: 'm²',
    priceLink: priceSearch('waterproofing'),
    comparisonLinks: [
      { href: '/construction/materials/tiles', label: 'Tiles (wet areas)' },
      { href: '/construction/materials/paint', label: 'Exterior paint' },
    ],
    guideLinks: [guidesHub()],
    overview:
      'Waterproofing is a system (surface prep, coats, detailing at drains and junctions), not a single coat of paint. Failures usually start at details — pipes, corners and outlets.',
    commonUses: [
      'Bathroom and wet-area floors/walls before tiling',
      'Terrace and podium decks',
      'Retaining walls and basements (specified systems)',
      'External wall treatments where required',
    ],
    specifications: [
      'Follow manufacturer coverage (kg/m² or L/m²) and number of coats.',
      'Detail upstands, drains and pipe penetrations explicitly.',
      'Flood tests are common acceptance checks for wet rooms and terraces.',
      'Compatibility with tile adhesives and overlays must be confirmed.',
    ],
    priceRange: {
      reliability: 'estimated',
      label: 'Indicative ₹/m² installed',
      detail:
        'Material-only estimates miss detailing labour. Get system quotes with warranty terms in writing.',
    },
    priceByLocation: [
      {
        location: 'Metro applicators',
        rangeLabel: 'System quote',
        note: 'Ask what is included at junctions.',
      },
      {
        location: 'Material DIY packs',
        rangeLabel: '₹ per pack',
        note: 'Coverage claims need site verification.',
      },
    ],
    types: [
      { name: 'Cementitious coatings', summary: 'Common under tiles in wet areas when specified.' },
      { name: 'Liquid membranes', summary: 'Various polymers; UV and traffic resistance differ.' },
      { name: 'Sheet membranes', summary: 'Torch-on or self-adhesive systems for certain decks.' },
    ],
    buyingConsiderations: [
      'Prefer installed warranties with clear exclusions.',
      'Photograph detailing before covering.',
      'Do not skip primer/prep to save cost.',
    ],
    faqs: [
      {
        question: 'Is exterior emulsion enough waterproofing?',
        answer:
          'Decorative exterior paints are not a substitute for terrace or wet-area waterproofing systems. Use the system specified for the exposure.',
      },
    ],
    relatedMaterialSlugs: ['tiles', 'paint', 'plaster'],
    methodology:
      'Educational overview only — no proprietary product endorsement. Coverage must come from manufacturer data sheets.',
    seoTitle: 'Waterproofing for Buildings — Systems & Buying Checks | Varnarc',
    seoDescription:
      'Objective waterproofing guide: where it is used, system types, detailing risks and buying considerations.',
  },
  {
    slug: 'electrical-wiring',
    name: 'Electrical wiring',
    shortDescription:
      'Conductors and cables distributing power in buildings. Sizing and protection must follow electrical design and local codes — not rule-of-thumb blogs.',
    categories: ['electrical'],
    primaryCategory: 'electrical',
    unitHint: 'metre / coil',
    priceLink: priceSearch('wire'),
    comparisonLinks: [
      { href: '/construction/materials/switches-sockets', label: 'Switches & sockets' },
      { href: '/construction/materials/conduits', label: 'Conduits' },
    ],
    guideLinks: [guidesHub()],
    overview:
      'Wiring materials include copper (or other) conductors with insulation ratings suited to concealed or surface installation. Circuit design, earthing and protective devices are engineering decisions.',
    commonUses: [
      'Lighting and fan circuits',
      'Power sockets and kitchen loads',
      'AC and high-load dedicated circuits',
      'Distribution board feeders (as designed)',
    ],
    specifications: [
      'Conductor size (mm²) must match load and length per design — do not downsize casually.',
      'Use ISI/certified products where regulations require.',
      'Colour coding and earthing continuity are safety-critical.',
      'Concealed wiring needs proper conduits and draw boxes.',
    ],
    priceRange: {
      reliability: 'indicative',
      label: 'Indicative ₹/metre by size',
      detail:
        'Copper price and insulation type dominate. Compare certified brands on conductor diameter, not sheath printing alone.',
    },
    priceByLocation: [
      {
        location: 'Electrical markets',
        rangeLabel: 'Coil rate',
        note: 'Beware underweight counterfeit coils.',
      },
      {
        location: 'Labour-inclusive contracts',
        rangeLabel: '₹ per point',
        note: 'Define what a “point” includes.',
      },
    ],
    types: [
      {
        name: 'FR / FRLS insulated wires',
        summary: 'Common building wires; fire performance classes differ.',
      },
      {
        name: 'Flexible cords',
        summary: 'For appliances — not a substitute for in-wall circuit cable unless allowed.',
      },
      { name: 'Armoured cables', summary: 'For specific feeder/underground uses as designed.' },
    ],
    buyingConsiderations: [
      'Buy from reputable dealers; verify coil length and weight norms.',
      'Keep circuit schedules updated for future maintenance.',
      'Never energise incomplete earthing.',
    ],
    faqs: [
      {
        question: 'Can Varnarc size my house wiring?',
        answer:
          'No. This page is educational. Circuit design and protection settings require a qualified electrician/engineer and applicable codes.',
      },
    ],
    relatedMaterialSlugs: ['switches-sockets', 'conduits'],
    methodology: 'General educational notes only. No load calculations are provided here.',
    seoTitle: 'Electrical Wiring Materials — Basics & Buying Checks | Varnarc',
    seoDescription:
      'Educational overview of building wiring materials, specifications to verify and purchasing cautions. Not electrical design.',
  },
  {
    slug: 'switches-sockets',
    name: 'Switches & sockets',
    shortDescription:
      'User interfaces for lighting and power. Module size, current rating and safety shutters matter for residential and commercial fit-outs.',
    categories: ['electrical', 'interior'],
    primaryCategory: 'electrical',
    unitHint: 'nos / module',
    priceLink: priceSearch('switch'),
    comparisonLinks: [
      { href: '/construction/materials/electrical-wiring', label: 'Electrical wiring' },
      { href: '/construction/compare', label: 'Compare switchgear SKUs' },
    ],
    guideLinks: [guidesHub()],
    overview:
      'Switches and socket-outlets should match the circuit rating and installation boxes. Aesthetic ranges differ, but mechanical and electrical ratings are the safety-critical attributes.',
    commonUses: [
      'Lighting switches',
      '5A/6A and 15A/16A socket outlets',
      'Fan regulators and dimmers (compatible types)',
      'Data/TV plates as part of modular grids',
    ],
    specifications: [
      'Current and voltage ratings must meet circuit design.',
      'Use shuttered sockets where required for child safety.',
      'Modular vs classical plate systems affect back-box choice.',
      'IP ratings matter for outdoors and wet zones.',
    ],
    priceRange: {
      reliability: 'indicative',
      label: 'Indicative ₹ per module / plate',
      detail: 'Wide aesthetic premium. Prioritise certified electrical ratings before finishes.',
    },
    priceByLocation: [
      {
        location: 'Retail electrical stores',
        rangeLabel: 'MRP / slab rate',
        note: 'Series matching avoids mixed plate gaps.',
      },
      {
        location: 'Project supply',
        rangeLabel: 'Bulk quote',
        note: 'Spare modules help future changes.',
      },
    ],
    types: [
      { name: 'Modular switches', summary: 'Common in new interiors; grid flexibility.' },
      { name: 'Classical piano type', summary: 'Still used in many regions.' },
      { name: 'Weatherproof accessories', summary: 'Exterior and utility areas.' },
    ],
    buyingConsiderations: [
      'Buy spares of the same series for future additions.',
      'Confirm back-box depth for dimmers and USB outlets.',
      'Avoid mixing incompatible module brands in one plate.',
    ],
    faqs: [
      {
        question: 'Are expensive switches safer?',
        answer:
          'Price often tracks finish and brand positioning. Safety comes from correct rating, certification and installation — not gloss level.',
      },
    ],
    relatedMaterialSlugs: ['electrical-wiring', 'conduits'],
    methodology: 'Educational fit-out guidance; not a product test lab.',
    seoTitle: 'Switches & Sockets — Types & Buying Guide | Varnarc',
    seoDescription:
      'Objective guide to switches and socket outlets: ratings, modular systems and purchasing checks.',
  },
  {
    slug: 'conduits',
    name: 'Conduits',
    shortDescription:
      'Tubes protecting electrical cables in concealed or surface runs. Material (PVC/MS) and diameter follow wiring design.',
    categories: ['electrical'],
    primaryCategory: 'electrical',
    unitHint: 'metre',
    priceLink: priceSearch('conduit'),
    comparisonLinks: [
      { href: '/construction/materials/electrical-wiring', label: 'Electrical wiring' },
      { href: '/construction/materials/switches-sockets', label: 'Switches & sockets' },
    ],
    guideLinks: [guidesHub()],
    overview:
      'Conduits enable cable drawing, mechanical protection and some fire/smoke separation strategies depending on system design. Bend radii and junction boxes affect pull tension.',
    commonUses: [
      'Concealed wall and slab conduits',
      'Surface conduit installations',
      'Service shafts and trunking transitions (as designed)',
    ],
    specifications: [
      'Diameter must allow cable fill limits per practice/codes used on the project.',
      'Use proper couplers, bends and inspection fittings.',
      'Seal slab penetrations as required for fire and waterproofing details.',
    ],
    priceRange: {
      reliability: 'estimated',
      label: 'Indicative ₹/metre',
      detail:
        'PVC conduit is common for concealed residential work; metal systems appear where specified.',
    },
    priceByLocation: [
      {
        location: 'Local hardware',
        rangeLabel: 'Length rate',
        note: 'Include boxes and bends in budgets.',
      },
    ],
    types: [
      { name: 'PVC conduits', summary: 'Widely used for concealed lighting/power.' },
      { name: 'Metal conduits', summary: 'Where mechanical protection or specs require.' },
    ],
    buyingConsiderations: [
      'Prefer uniform diameter runs to ease drawing.',
      'Avoid overfilling — leave capacity for future circuits when planned.',
    ],
    faqs: [
      {
        question: 'Can I cast bare wires without conduit?',
        answer:
          'Follow the electrical design and local regulations. Concealed unprotected wiring is generally poor practice for maintainability and safety.',
      },
    ],
    relatedMaterialSlugs: ['electrical-wiring', 'switches-sockets'],
    methodology: 'General construction literacy; project specs govern.',
    seoTitle: 'Electrical Conduits — Types & Site Checks | Varnarc',
    seoDescription:
      'Educational conduit overview for building wiring: materials, detailing and buying notes.',
  },
  {
    slug: 'pvc-pipes',
    name: 'PVC pipes',
    shortDescription:
      'Plastic pipes commonly used for soil, waste, vent and some water lines as permitted by design. Pressure rating and diameter are critical.',
    categories: ['plumbing'],
    primaryCategory: 'plumbing',
    unitHint: 'metre',
    priceLink: priceSearch('pvc pipe'),
    comparisonLinks: [
      { href: '/construction/materials/cpvc-pipes', label: 'CPVC pipes' },
      { href: '/construction/materials/plumbing-fittings', label: 'Plumbing fittings' },
    ],
    guideLinks: [guidesHub()],
    overview:
      'PVC systems are lightweight and corrosion-resistant within their temperature/pressure limits. Solvent cement joints require clean, square cuts and correct cure time.',
    commonUses: [
      'Soil and waste drainage (as specified)',
      'Vent pipes',
      'Some cold-water applications where codes and product ratings allow',
    ],
    specifications: [
      'Match SDR/pressure class to the service.',
      'Support spacing and expansion provisions matter on long runs.',
      'Do not use drainage PVC as a substitute for hot-water pressure pipe.',
      'Test systems before concealing.',
    ],
    priceRange: {
      reliability: 'indicative',
      label: 'Indicative ₹/metre by diameter',
      detail:
        'Fittings can approach pipe cost on complex bathrooms. Budget the bill of fittings explicitly.',
    },
    priceByLocation: [
      {
        location: 'Plumbing merchants',
        rangeLabel: 'Length + fitting list',
        note: 'Brand series compatibility matters for solvent systems.',
      },
    ],
    types: [
      { name: 'uPVC drainage', summary: 'Common for soil/waste stacks and branches.' },
      { name: 'Pressure PVC', summary: 'Where rated for pressurised cold water — verify marking.' },
    ],
    buyingConsiderations: [
      'Buy matching fittings from the same system family when required.',
      'Store out of prolonged harsh sun if the maker advises.',
      'Keep solvent cement within shelf life.',
    ],
    faqs: [
      {
        question: 'PVC or CPVC for hot water?',
        answer:
          'Hot water supply usually needs materials rated for temperature (often CPVC or other specified systems). Standard drainage PVC is not a hot-water supply pipe.',
      },
    ],
    relatedMaterialSlugs: ['cpvc-pipes', 'plumbing-fittings'],
    methodology: 'Educational plumbing literacy; hydraulic design is out of scope.',
    seoTitle: 'PVC Pipes — Uses, Ratings & Buying Checks | Varnarc',
    seoDescription:
      'Objective PVC pipe guide for buildings: typical uses, specifications and purchase considerations.',
  },
  {
    slug: 'cpvc-pipes',
    name: 'CPVC pipes',
    shortDescription:
      'Chlorinated PVC systems often used for hot and cold potable water distribution within their rated temperatures and pressures.',
    categories: ['plumbing'],
    primaryCategory: 'plumbing',
    unitHint: 'metre',
    priceLink: priceSearch('cpvc'),
    comparisonLinks: [
      { href: '/construction/materials/pvc-pipes', label: 'PVC pipes' },
      { href: '/construction/materials/plumbing-fittings', label: 'Plumbing fittings' },
    ],
    guideLinks: [guidesHub()],
    overview:
      'CPVC is chosen for many internal water supply networks when specified. Jointing, support and transition to other metals need correct fittings and dielectric practices where required.',
    commonUses: [
      'Hot and cold water supply lines (within ratings)',
      'Residential and commercial distribution branches',
    ],
    specifications: [
      'Confirm temperature/pressure rating printed on pipe.',
      'Use CPVC solvent cement and primers as specified by the system maker.',
      'Account for thermal expansion on long hot-water runs.',
      'Flush and pressure-test before closing walls.',
    ],
    priceRange: {
      reliability: 'indicative',
      label: 'Indicative ₹/metre',
      detail:
        'Higher than basic drainage PVC typically. Fittings and valves dominate complex manifolds.',
    },
    priceByLocation: [
      {
        location: 'Authorised dealers',
        rangeLabel: 'System price list',
        note: 'Prefer complete system warranties.',
      },
    ],
    types: [
      {
        name: 'SDR / schedule classes',
        summary: 'Wall thickness classes for different pressures — read markings.',
      },
      {
        name: 'CTS systems',
        summary: 'Copper-tube-size compatible lines where the brand uses that convention.',
      },
    ],
    buyingConsiderations: [
      'Avoid mixing incompatible solvent systems.',
      'Protect from UV if stored outdoors.',
      'Use correct transition fittings to metal heaters and meters.',
    ],
    faqs: [
      {
        question: 'Can I hide joints without testing?',
        answer:
          'No. Pressure testing before concealment is standard good practice and often required by contracts.',
      },
    ],
    relatedMaterialSlugs: ['pvc-pipes', 'plumbing-fittings'],
    methodology: 'Educational only; follow manufacturer and plumbing design.',
    seoTitle: 'CPVC Pipes — Hot Water Supply Basics | Varnarc',
    seoDescription:
      'CPVC water supply pipe overview: uses, ratings, jointing notes and buying checks.',
  },
  {
    slug: 'plumbing-fittings',
    name: 'Plumbing fittings',
    shortDescription:
      'Elbows, tees, couplings, valves and transitions that turn pipe lengths into a working network. Often under-budgeted.',
    categories: ['plumbing', 'interior'],
    primaryCategory: 'plumbing',
    unitHint: 'nos',
    priceLink: priceSearch('plumbing fitting'),
    comparisonLinks: [
      { href: '/construction/materials/pvc-pipes', label: 'PVC pipes' },
      { href: '/construction/materials/cpvc-pipes', label: 'CPVC pipes' },
    ],
    guideLinks: [guidesHub()],
    overview:
      'Fittings control direction, branching and isolation. Material compatibility (PVC, CPVC, brass, stainless) and seal type (solvent, thread, compression) must match the pipe system.',
    commonUses: [
      'Direction changes and branches',
      'Isolation valves and cleanouts',
      'Transitions between materials',
      'Fixture connectors',
    ],
    specifications: [
      'Match pressure/temperature ratings to the pipe system.',
      'Use thread sealants compatible with plastic threads.',
      'Support valves independently so weight does not stress joints.',
    ],
    priceRange: {
      reliability: 'estimated',
      label: 'Highly item-dependent',
      detail:
        'A bathroom fitting schedule can rival pipe metre cost. Take-off from drawings before shopping.',
    },
    priceByLocation: [
      {
        location: 'Plumbing suppliers',
        rangeLabel: 'Piece rate',
        note: 'Keep a labelled spare kit for concealed valves.',
      },
    ],
    types: [
      { name: 'Solvent-weld fittings', summary: 'For PVC/CPVC systems as rated.' },
      {
        name: 'Threaded / brass valves',
        summary: 'Isolation and control; check plastic adapters.',
      },
      { name: 'Flexible connectors', summary: 'Fixture tails — inspect braid and seal washers.' },
    ],
    buyingConsiderations: [
      'Buy from the same system family when solvent systems require it.',
      'Photograph concealed valve locations before tiling.',
      'Prefer full-bore valves where flow matters.',
    ],
    faqs: [
      {
        question: 'Why do quotes miss fittings?',
        answer:
          'Metre rates are easy to compare; fittings need a drawing take-off. Ask suppliers for a fitting list against your schematic.',
      },
    ],
    relatedMaterialSlugs: ['pvc-pipes', 'cpvc-pipes', 'waterproofing'],
    methodology: 'Planning literacy for BOQ completeness; not a hydraulic design tool.',
    seoTitle: 'Plumbing Fittings — Types & Budget Tips | Varnarc',
    seoDescription:
      'Why plumbing fittings matter in budgets: types, compatibility and purchasing checks.',
  },
];

const bySlug = new Map(MATERIAL_GUIDE_PAGES.map((p) => [p.slug, p]));

export function getMaterialGuide(slug: string): MaterialGuidePage | undefined {
  return bySlug.get(slug);
}

export function listMaterialHubCards(): MaterialHubCard[] {
  return MATERIAL_GUIDE_PAGES.map((p) => ({
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription,
    categories: p.categories,
    primaryCategory: p.primaryCategory,
    calculator: p.calculator,
    priceLink: p.priceLink,
    comparisonLinks: p.comparisonLinks.slice(0, 3),
    guideLinks: p.guideLinks.slice(0, 2),
  }));
}

export function listMaterialSlugs(): string[] {
  return MATERIAL_GUIDE_PAGES.map((p) => p.slug);
}

export function materialsInCategory(categoryId: MaterialCategoryId | 'all'): MaterialHubCard[] {
  const cards = listMaterialHubCards();
  if (categoryId === 'all') return cards;
  return cards.filter((c) => c.categories.includes(categoryId));
}

export function relatedMaterialPages(slugs: string[]): MaterialGuidePage[] {
  return slugs.map((s) => bySlug.get(s)).filter(Boolean) as MaterialGuidePage[];
}

export function isUuidParam(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
