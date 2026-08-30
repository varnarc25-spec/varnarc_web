/** Material Comparison Engine — editorial pairs only (no auto-generated nonsense). */

export const COMPARE_HUB_VERSION = '2026.08.1';

export const COMPARE_HUB_QUALIFICATION =
  'Educational comparisons only. No material is universally “better” — suitability depends on structural design, climate, labour skill, finish standard and local supply. Costs are indicative planning placeholders; verify with quotes.';

export const COMPARE_CATEGORIES = [
  { id: 'masonry', label: 'Masonry / walling' },
  { id: 'cement', label: 'Cement' },
  { id: 'sand', label: 'Sand / fine aggregate' },
  { id: 'tiles', label: 'Tiles' },
  { id: 'windows', label: 'Windows' },
  { id: 'plaster', label: 'Plaster' },
] as const;

export type CompareHubCategoryId = (typeof COMPARE_CATEGORIES)[number]['id'];

/** Attribute keys commonly used across categories — each pair picks a subset. */
export const COMPARE_ATTRIBUTE_KEYS = [
  'approximate_cost',
  'strength_spec',
  'weight',
  'installation_speed',
  'maintenance',
  'thermal',
  'water_resistance',
  'wastage',
  'life',
  'application_suitability',
  'finish_compatibility',
  'dimensional_accuracy',
  'workability',
  'acoustic',
  'fire_behaviour',
  'uv_weather',
] as const;

export type CompareAttributeKey = (typeof COMPARE_ATTRIBUTE_KEYS)[number];

export const COMPARE_ATTRIBUTE_LABELS: Record<CompareAttributeKey, string> = {
  approximate_cost: 'Approximate cost',
  strength_spec: 'Strength / specification',
  weight: 'Weight / density',
  installation_speed: 'Installation speed',
  maintenance: 'Maintenance',
  thermal: 'Thermal properties',
  water_resistance: 'Water resistance',
  wastage: 'Wastage',
  life: 'Service life (typical context)',
  application_suitability: 'Application suitability',
  finish_compatibility: 'Finish compatibility',
  dimensional_accuracy: 'Dimensional accuracy',
  workability: 'Workability',
  acoustic: 'Acoustic behaviour',
  fire_behaviour: 'Fire behaviour (general)',
  uv_weather: 'UV / weather exposure',
};

/** Default attribute sets per category — pairs may omit irrelevant rows. */
export const ATTRIBUTES_BY_CATEGORY: Record<CompareHubCategoryId, CompareAttributeKey[]> = {
  masonry: [
    'approximate_cost',
    'strength_spec',
    'weight',
    'installation_speed',
    'thermal',
    'water_resistance',
    'wastage',
    'maintenance',
    'life',
    'application_suitability',
    'finish_compatibility',
  ],
  cement: [
    'approximate_cost',
    'strength_spec',
    'workability',
    'water_resistance',
    'application_suitability',
    'life',
  ],
  sand: [
    'approximate_cost',
    'strength_spec',
    'workability',
    'wastage',
    'water_resistance',
    'application_suitability',
  ],
  tiles: [
    'approximate_cost',
    'strength_spec',
    'water_resistance',
    'maintenance',
    'wastage',
    'life',
    'application_suitability',
    'finish_compatibility',
  ],
  windows: [
    'approximate_cost',
    'strength_spec',
    'weight',
    'installation_speed',
    'maintenance',
    'thermal',
    'water_resistance',
    'uv_weather',
    'acoustic',
    'life',
    'application_suitability',
  ],
  plaster: [
    'approximate_cost',
    'strength_spec',
    'installation_speed',
    'water_resistance',
    'wastage',
    'finish_compatibility',
    'maintenance',
    'application_suitability',
  ],
};

export type CompareFaq = { question: string; answer: string };

export type CompareSideProfile = {
  key: string;
  name: string;
  /** Link to materials guide when available */
  materialHref?: string;
  bestSuitedFor: string[];
  advantages: string[];
  limitations: string[];
  costImplications: string;
  thingsToVerify: string[];
};

export type CompareAttributeRow = {
  key: CompareAttributeKey;
  left: string;
  right: string;
  note?: string;
};

export type CompareCostSide = {
  /** Display unit for rate input */
  rateLabel: string;
  defaultRateInr: number;
  /**
   * How many billable units are needed per 1 quantity unit
   * (e.g. bricks per m² wall, bags per m³ mortar cement share is handled differently).
   */
  unitsPerQuantity: number;
  unitNoun: string;
};

export type CompareCostModel = {
  quantityKind:
    'wall_area_m2' | 'floor_area_m2' | 'cement_bags' | 'sand_m3' | 'openings_m2' | 'plaster_m2';
  quantityLabel: string;
  defaultQuantity: number;
  left: CompareCostSide;
  right: CompareCostSide;
  notes: string;
};

export type EditorialComparison = {
  slug: string;
  category: CompareHubCategoryId;
  title: string;
  shortSummary: string;
  leftName: string;
  rightName: string;
  overview: string;
  attributes: CompareAttributeRow[];
  left: CompareSideProfile;
  right: CompareSideProfile;
  sharedThingsToVerify: string[];
  costModel: CompareCostModel;
  relatedLinks: Array<{ href: string; label: string }>;
  faqs: CompareFaq[];
  methodology: string;
  seoTitle: string;
  seoDescription: string;
  /** Tokens that map ?hint= values to this editorial page */
  hintTokens: string[][];
};

export const EDITORIAL_COMPARISONS: EditorialComparison[] = [
  {
    slug: 'aac-vs-brick',
    category: 'masonry',
    title: 'AAC block vs red brick',
    shortSummary:
      'Lightweight AAC walling versus traditional clay brick — trade-offs in weight, speed, finish and full wall-system cost.',
    leftName: 'AAC blocks',
    rightName: 'Red brick',
    overview:
      'Both AAC and clay brick can form partition or infill walls when the structural system allows. AAC units are larger and lighter, often using thin-bed adhesive. Clay brick remains widely available and familiar to masons, but wall weight, mortar volume and plaster thickness differ. Compare full assemblies (units + jointing + plaster + labour), not piece price alone.',
    attributes: [
      {
        key: 'approximate_cost',
        left: 'Often competitive on full wall ₹/m² when labour productivity is high; freight-sensitive near plants',
        right: 'Piece rates can look lower; mortar + labour + plaster may close the gap',
        note: 'Always compare installed wall cost, not block vs brick MRP alone.',
      },
      {
        key: 'strength_spec',
        left: 'Density/grade and compressive strength per manufacturer; follow structural allowance for AAC',
        right:
          'Class and water absorption vary by kiln; first-class bricks preferred for quality walls',
      },
      {
        key: 'weight',
        left: 'Lower density — reduces dead load on frames when designed for AAC',
        right: 'Higher density — more dead load for the same wall area',
      },
      {
        key: 'installation_speed',
        left: 'Larger units + thin bed can be faster with trained crews',
        right: 'Familiar to most masons; more units per m²',
      },
      {
        key: 'thermal',
        left: 'Generally better insulation per thickness (product-dependent)',
        right: 'Higher conductivity; thermal mass differs',
      },
      {
        key: 'water_resistance',
        left: 'Needs correct external detailing/plaster; not a waterproofing substitute',
        right: 'Also needs plaster/pointing; soak bricks as per practice',
      },
      {
        key: 'wastage',
        left: 'Breakage in transit and cutting around openings',
        right: 'Breakage + cutting waste at jambs and arches',
      },
      {
        key: 'maintenance',
        left: 'Chase carefully; use compatible fasteners for fixtures',
        right: 'Conventional fixing; chase dust/labour higher in dense brick',
      },
      {
        key: 'life',
        left: 'Durable when detailed and protected as specified',
        right: 'Long track record in regional practice when quality bricks used',
      },
      {
        key: 'application_suitability',
        left: 'RCC infills, partitions; confirm load-bearing use with engineer',
        right: 'Load-bearing and partitions where codes/design allow',
      },
      {
        key: 'finish_compatibility',
        left: 'Manufacturer plaster/skim systems recommended',
        right: 'Cement plaster widely practiced',
      },
    ],
    left: {
      key: 'aac',
      name: 'AAC blocks',
      materialHref: '/construction/materials/aac-blocks',
      bestSuitedFor: [
        'RCC frame infills and partitions where AAC is approved',
        'Projects prioritising lower wall weight and faster laying with trained crews',
        'Sites near AAC plants with reliable delivered supply',
      ],
      advantages: [
        'Larger unit size can reduce joint length',
        'Lower density vs clay brick for similar wall area',
        'Often better thermal insulation per thickness',
      ],
      limitations: [
        'Needs thin-bed technique and compatible adhesive',
        'Fixings and chasing need AAC-appropriate methods',
        'Freight and breakage can erase savings far from plants',
      ],
      costImplications:
        'Budget blocks + adhesive + specialised labour + recommended plaster. Piece price alone understates system cost.',
      thingsToVerify: [
        'Structural note allowing AAC thickness/density',
        'Block dimensions and density grade on delivery',
        'Adhesive brand/coverage assumptions',
      ],
    },
    right: {
      key: 'brick',
      name: 'Red brick',
      materialHref: '/construction/materials/brick',
      bestSuitedFor: [
        'Regions with consistent kiln supply and skilled brick masons',
        'Walling systems designed for clay masonry',
        'Projects where local brick quality is proven on similar buildings',
      ],
      advantages: [
        'Wide mason familiarity',
        'Local availability in many towns',
        'Straightforward conventional mortar practice',
      ],
      limitations: [
        'Higher wall weight',
        'More units and mortar volume per m²',
        'Quality varies widely by kiln',
      ],
      costImplications:
        'Include bricks per thousand, mortar cement/sand, labour and plaster. Breakage allowances are common in quotes.',
      thingsToVerify: [
        'Brick class, size and water absorption',
        'Mortar mix specified for the wall',
        'Soaking and curing practice on site',
      ],
    },
    sharedThingsToVerify: [
      'Whether walls are load-bearing or infill only',
      'External finish and waterproofing details',
      'Door/window jamb and lintel detailing for the chosen masonry',
    ],
    costModel: {
      quantityKind: 'wall_area_m2',
      quantityLabel: 'Net wall area (m²)',
      defaultQuantity: 100,
      left: {
        rateLabel: '₹ per AAC block',
        defaultRateInr: 55,
        unitsPerQuantity: 8.5,
        unitNoun: 'blocks',
      },
      right: {
        rateLabel: '₹ per brick',
        defaultRateInr: 8,
        unitsPerQuantity: 50,
        unitNoun: 'bricks',
      },
      notes:
        'Default units/m² are planning placeholders (joint thickness and unit size change counts). Add adhesive/mortar and plaster separately — this tool only scales unit purchase cost.',
    },
    relatedLinks: [
      { href: '/construction/aac-block-calculator', label: 'AAC block calculator' },
      { href: '/construction/brick-calculator', label: 'Brick calculator' },
      { href: '/construction/materials/aac-blocks', label: 'AAC guide' },
      { href: '/construction/materials/brick', label: 'Brick guide' },
    ],
    faqs: [
      {
        question: 'Which is cheaper — AAC or brick?',
        answer:
          'It depends on delivered unit rates, adhesive vs mortar, labour productivity and plaster thickness. Run a full wall-system quote; the cost tool below only scales unit purchase cost.',
      },
      {
        question: 'Can I replace brick with AAC on a finished design?',
        answer:
          'Only if the structural and architectural design allows the change (thickness, weight, fixings). Get engineer approval before substituting.',
      },
    ],
    methodology:
      'Attribute notes reflect common Indian site practice and manufacturer-agnostic planning language. Unit counts and rates are editable defaults, not market live prices. No winner badge is assigned because use-case trade-offs dominate.',
    seoTitle: 'AAC Block vs Red Brick — Comparison Guide | Varnarc',
    seoDescription:
      'Objective AAC vs clay brick comparison: cost, weight, speed, thermal behaviour, advantages, limitations and project quantity cost planner. No simplistic winner.',
    hintTokens: [
      ['aac', 'brick'],
      ['aac', 'red brick'],
      ['aac-blocks', 'brick'],
    ],
  },
  {
    slug: 'opc-vs-ppc',
    category: 'cement',
    title: 'OPC vs PPC cement',
    shortSummary:
      'Ordinary Portland Cement versus Portland Pozzolana (blended) cement — early strength, general construction use and specification fit.',
    leftName: 'OPC',
    rightName: 'PPC',
    overview:
      'OPC and PPC are both widely used hydraulic cements. OPC is often chosen where early strength or a specific grade is called for. PPC (and other blended cements) are common for general concrete, masonry and plaster when permitted by the specification. Neither is universally superior — the project mix design and exposure conditions decide.',
    attributes: [
      {
        key: 'approximate_cost',
        left: 'Often similar bag MRP; regional brand gaps matter more than OPC vs PPC label alone',
        right: 'Frequently priced competitively for general works',
      },
      {
        key: 'strength_spec',
        left: 'Faster early strength typical for comparable grades — confirm grade (e.g. 43/53)',
        right: 'Strength gain profile differs; suitable where specification allows blended cement',
      },
      {
        key: 'workability',
        left: 'Familiar site behaviour; watch water demand',
        right: 'Often good workability for masonry/plaster when fresh',
      },
      {
        key: 'water_resistance',
        left: 'Durability depends on mix, cover and curing — not bag type alone',
        right: 'Pozzolanic reactions can aid certain durability aspects in proper mixes',
      },
      {
        key: 'application_suitability',
        left: 'Where drawings/spec call for OPC or early strength is critical',
        right: 'General RCC (when allowed), masonry, plaster — follow engineer',
      },
      {
        key: 'life',
        left: 'Long service life in correctly designed and cured concrete',
        right: 'Long service life when used within specification',
      },
    ],
    left: {
      key: 'opc',
      name: 'OPC',
      materialHref: '/construction/materials/cement',
      bestSuitedFor: [
        'Mixes or notes that explicitly specify OPC',
        'Situations needing higher early strength as designed',
        'Prestress / specialised works when called out',
      ],
      advantages: [
        'Clear grade marking culture',
        'Early strength characteristics (grade-dependent)',
      ],
      limitations: ['May not be the most economical or specified choice for all general work'],
      costImplications:
        'Compare delivered bag rate and required grade — do not substitute grades to chase price.',
      thingsToVerify: ['Grade on bag and invoice', 'Freshness and storage condition'],
    },
    right: {
      key: 'ppc',
      name: 'PPC',
      materialHref: '/construction/materials/cement',
      bestSuitedFor: [
        'General construction where blended cement is permitted',
        'Masonry and plaster works as specified',
        'Many RCC works when the mix design allows PPC',
      ],
      advantages: ['Widely available', 'Often suited to general building works'],
      limitations: [
        'Must match structural/mix specification',
        'Not a free substitute for every OPC call-out',
      ],
      costImplications:
        'Bag rate plus wastage; large pours may favour RMC economics over bag type debates.',
      thingsToVerify: ['Specification allowance for PPC', 'Brand consistency across pours'],
    },
    sharedThingsToVerify: [
      'Exact cement type and grade on structural notes',
      'Curing plan for the element',
      'Whether site mix or RMC governs supply',
    ],
    costModel: {
      quantityKind: 'cement_bags',
      quantityLabel: 'Cement bags required (nos)',
      defaultQuantity: 100,
      left: {
        rateLabel: '₹ per OPC bag',
        defaultRateInr: 380,
        unitsPerQuantity: 1,
        unitNoun: 'bags',
      },
      right: {
        rateLabel: '₹ per PPC bag',
        defaultRateInr: 360,
        unitsPerQuantity: 1,
        unitNoun: 'bags',
      },
      notes:
        'Enter bags from the cement calculator for your mix. Rates are editable indicative defaults — not live dealer feeds.',
    },
    relatedLinks: [
      { href: '/construction/cement-calculator', label: 'Cement calculator' },
      { href: '/construction/materials/cement', label: 'Cement guide' },
      { href: '/construction/concrete-calculator', label: 'Concrete calculator' },
    ],
    faqs: [
      {
        question: 'Is PPC weaker than OPC?',
        answer:
          'Not as a blanket statement. Strength development and suitability depend on grade, mix design and curing. Follow the project specification.',
      },
      {
        question: 'Can I mix OPC and PPC in one member?',
        answer:
          'Avoid casual mixing. Consistency of cement type within a pour/member is standard good practice unless the engineer directs otherwise.',
      },
    ],
    methodology:
      'Comparison is educational against common specification language. Bag rates are placeholders. Structural decisions remain with the design team.',
    seoTitle: 'OPC vs PPC Cement — Differences & Cost Planner | Varnarc',
    seoDescription:
      'Compare OPC and PPC cement objectively: best uses, advantages, limitations, things to verify and indicative bag cost by quantity.',
    hintTokens: [['opc', 'ppc'], ['opc cement', 'ppc cement'], ['cement']],
  },
  {
    slug: 'm-sand-vs-river-sand',
    category: 'sand',
    title: 'M-sand vs river sand',
    shortSummary:
      'Manufactured sand versus river sand for concrete and mortar — grading, silt, bulking and regional legality.',
    leftName: 'M-sand',
    rightName: 'River sand',
    overview:
      'Fine aggregate quality affects concrete strength, mortar yield and plaster finish. River sand faces availability and regulatory constraints in many regions. M-sand (crushed fine aggregate) is a common alternative when grading and silt limits suit the use (concrete vs plaster grades differ).',
    attributes: [
      {
        key: 'approximate_cost',
        left: 'Often stable near crusher plants; freight dominates',
        right: 'Can be scarce/expensive where restricted; legality premium',
      },
      {
        key: 'strength_spec',
        left: 'Suitable for concrete when grading meets mix requirements',
        right: 'Traditional fine aggregate where clean and well graded',
      },
      {
        key: 'workability',
        left: 'Particle shape may need mix adjustment / admixtures',
        right: 'Familiar workability when silt is controlled',
      },
      {
        key: 'wastage',
        left: 'Bulking and moisture still matter for volume batching',
        right: 'Moist river sand bulking can mislead volume batching',
      },
      {
        key: 'water_resistance',
        left: 'Not a durability product — mix design governs',
        right: 'Organic impurities/silt harm mixes if excessive',
      },
      {
        key: 'application_suitability',
        left: 'Concrete-grade vs plaster-grade products — buy the right one',
        right: 'Concrete and mortar where quality and permits allow',
      },
    ],
    left: {
      key: 'm-sand',
      name: 'M-sand',
      materialHref: '/construction/materials/sand',
      bestSuitedFor: [
        'Markets with reliable crusher grading for concrete',
        'Projects replacing restricted river sand',
        'Controlled batching with moisture correction',
      ],
      advantages: [
        'Alternative where river sand is constrained',
        'Often consistent supply near plants',
      ],
      limitations: [
        'Wrong grade (plaster vs concrete) causes finish/strength issues',
        'Angular particles can change water demand',
      ],
      costImplications:
        'Compare ₹/m³ or ₹/tonne delivered, plus any admixture adjustments in trials.',
      thingsToVerify: [
        'Concrete-grade vs plaster-grade labelling',
        'Silt/clay content',
        'Gradation report if available',
      ],
    },
    right: {
      key: 'river-sand',
      name: 'River sand',
      materialHref: '/construction/materials/sand',
      bestSuitedFor: [
        'Regions with legal, clean supply',
        'Mixes already proven on local river sand',
      ],
      advantages: ['Long mason familiarity', 'Rounded particles in many sources'],
      limitations: ['Regulatory and environmental constraints', 'High silt risk from poor sources'],
      costImplications:
        'Scarce markets price high; illegal supply is not an option — verify paperwork.',
      thingsToVerify: [
        'Source legality',
        'Jar test / silt',
        'Moisture bulking for volume batching',
      ],
    },
    sharedThingsToVerify: [
      'Whether the mix design was prepared for M-sand or river sand',
      'Batching method (weight vs volume)',
      'Washing requirements',
    ],
    costModel: {
      quantityKind: 'sand_m3',
      quantityLabel: 'Sand volume (m³)',
      defaultQuantity: 20,
      left: {
        rateLabel: '₹ per m³ M-sand',
        defaultRateInr: 2200,
        unitsPerQuantity: 1,
        unitNoun: 'm³',
      },
      right: {
        rateLabel: '₹ per m³ river sand',
        defaultRateInr: 2800,
        unitsPerQuantity: 1,
        unitNoun: 'm³',
      },
      notes:
        'Use sand calculator outputs for volume. Confirm whether quotes are loose volume or tonne-based.',
    },
    relatedLinks: [
      { href: '/construction/sand-calculator', label: 'Sand calculator' },
      { href: '/construction/materials/sand', label: 'Sand guide' },
      { href: '/construction/concrete-calculator', label: 'Concrete calculator' },
    ],
    faqs: [
      {
        question: 'Can I replace river sand 1:1 with M-sand?',
        answer:
          'Often workable for many mixes when grading is suitable, but water demand and finish can change. Prefer mix trials or engineer guidance for structural concrete.',
      },
    ],
    methodology:
      'Regional geology and regulations dominate sand choice. Rates are editable indicatives. Quality tests beat brand stories.',
    seoTitle: 'M-Sand vs River Sand — Comparison | Varnarc',
    seoDescription:
      'Compare manufactured sand and river sand for concrete and mortar: grading, cost, workability, verification checklist and quantity cost planner.',
    hintTokens: [
      ['m-sand', 'river sand'],
      ['msand', 'river sand'],
      ['m sand', 'river sand'],
      ['sand'],
    ],
  },
  {
    slug: 'vitrified-vs-ceramic-tiles',
    category: 'tiles',
    title: 'Vitrified vs ceramic tiles',
    shortSummary:
      'Dense vitrified body tiles versus ceramic tiles — floors vs walls, water absorption, wear and installed cost.',
    leftName: 'Vitrified',
    rightName: 'Ceramic',
    overview:
      'Tile choice should match traffic, moisture and budget — including adhesive, grout and waterproofing in wet areas. Vitrified tiles are typically denser with lower water absorption and are popular for floors. Ceramic tiles remain common for walls and lighter-duty floors. Labels vary by brand; read water absorption and abrasion ratings on the carton.',
    attributes: [
      {
        key: 'approximate_cost',
        left: 'Wide span from economy to premium; installed ₹/m² often exceeds tile MRP',
        right: 'Often lower MRP for wall tiles; still budget adhesive/grout',
      },
      {
        key: 'strength_spec',
        left: 'Generally denser body; check PEI/abrasion for floors',
        right: 'Suitable ratings vary — wall tiles may not suit heavy floor traffic',
      },
      {
        key: 'water_resistance',
        left: 'Typically lower water absorption (verify marking)',
        right: 'Higher absorption classes exist — verify for wet floors',
      },
      {
        key: 'maintenance',
        left: 'Grout care and cleaning similar; polished vs matt differ',
        right: 'Similar grout maintenance; glaze wear on floors matters',
      },
      {
        key: 'wastage',
        left: 'Layout and cuts drive 5–15%+ extras',
        right: 'Same layout/wastage logic',
      },
      {
        key: 'life',
        left: 'Long life when substrate and traffic match rating',
        right: 'Long life on appropriate applications',
      },
      {
        key: 'application_suitability',
        left: 'Floors and many wet areas when rated',
        right: 'Walls and lighter floors as rated',
      },
      {
        key: 'finish_compatibility',
        left: 'Large formats need flatter substrates',
        right: 'Wide decorative range for dados/walls',
      },
    ],
    left: {
      key: 'vitrified',
      name: 'Vitrified tiles',
      materialHref: '/construction/materials/tiles',
      bestSuitedFor: [
        'Floor areas with suitable abrasion rating',
        'Projects wanting dense body tiles',
      ],
      advantages: ['Popular floor option', 'Often lower absorption classes'],
      limitations: ['Large format needs substrate flatness', 'Premium designs cost more'],
      costImplications:
        'Include tile + adhesive + grout + labour + wastage. Skirting and transitions add cost.',
      thingsToVerify: ['Water absorption class', 'PEI/abrasion', 'Batch/shade codes'],
    },
    right: {
      key: 'ceramic',
      name: 'Ceramic tiles',
      materialHref: '/construction/materials/tiles',
      bestSuitedFor: ['Wall tiling', 'Lighter-duty floors when rated', 'Decorative dados'],
      advantages: ['Broad design range', 'Often economical for walls'],
      limitations: ['Not all ceramics suit high-traffic floors', 'Absorption varies'],
      costImplications: 'Wall vs floor adhesives differ — follow system recommendations.',
      thingsToVerify: ['Floor vs wall rating', 'Wet-area suitability', 'Box coverage m²'],
    },
    sharedThingsToVerify: [
      'Waterproofing under wet-area tiles',
      'Movement joints on large floors',
      'Slip resistance for wet floors',
    ],
    costModel: {
      quantityKind: 'floor_area_m2',
      quantityLabel: 'Floor / wall area (m²)',
      defaultQuantity: 80,
      left: {
        rateLabel: '₹ per m² vitrified (tile only)',
        defaultRateInr: 65,
        unitsPerQuantity: 1,
        unitNoun: 'm²',
      },
      right: {
        rateLabel: '₹ per m² ceramic (tile only)',
        defaultRateInr: 45,
        unitsPerQuantity: 1,
        unitNoun: 'm²',
      },
      notes:
        'Rates are tile material only. Add wastage % mentally or inflate area. Installation is extra.',
    },
    relatedLinks: [
      { href: '/construction/tile-calculator', label: 'Tile calculator' },
      { href: '/construction/materials/tiles', label: 'Tiles guide' },
      { href: '/construction/materials/waterproofing', label: 'Waterproofing guide' },
    ],
    faqs: [
      {
        question: 'Are all vitrified tiles better than ceramic?',
        answer:
          'No. Application rating, slip resistance and installation quality matter more than the marketing category name.',
      },
    ],
    methodology:
      'Category language follows common retail labelling; always read carton technical marks. Cost planner excludes labour unless you fold it into the ₹/m² rate.',
    seoTitle: 'Vitrified vs Ceramic Tiles — Comparison | Varnarc',
    seoDescription:
      'Compare vitrified and ceramic tiles for floors and walls: absorption, wear, cost implications and area-based cost planner.',
    hintTokens: [['vitrified', 'ceramic'], ['vitrified tile', 'ceramic tile'], ['tile']],
  },
  {
    slug: 'upvc-vs-aluminium-windows',
    category: 'windows',
    title: 'uPVC vs aluminium windows',
    shortSummary:
      'uPVC and aluminium window systems — thermal comfort, maintenance, strength perception and whole-window cost.',
    leftName: 'uPVC',
    rightName: 'Aluminium',
    overview:
      'Window performance depends on profile system, glass, hardware, installation and sealing — not the frame material buzzword alone. uPVC systems are often chosen for thermal/acoustic comfort in many homes. Aluminium offers slim sightlines and strength for larger openings when thermally broken systems are used. Coastal corrosion, colour stability and service networks differ by product.',
    attributes: [
      {
        key: 'approximate_cost',
        left: 'Mid to premium installed systems common; hardware/glass drive price',
        right: 'Wide range — basic aluminium cheaper; thermal-break premium systems cost more',
      },
      {
        key: 'strength_spec',
        left: 'Reinforcement inside profiles for larger sashes as designed',
        right: 'High strength-to-weight; good for large spans when engineered',
      },
      {
        key: 'weight',
        left: 'Moderate; reinforcement adds weight',
        right: 'Light frames; glass still dominates weight',
      },
      {
        key: 'installation_speed',
        left: 'Factory-made frames; site fit quality is critical',
        right: 'Fabrication + site install; alignment critical',
      },
      {
        key: 'maintenance',
        left: 'Low painting need; clean seals/hardware',
        right: 'Powder coat care; coastal upkeep varies',
      },
      {
        key: 'thermal',
        left: 'Generally better insulation with multi-chamber profiles + suitable glass',
        right: 'Needs thermal break + insulated glass to compete on heat transfer',
      },
      {
        key: 'water_resistance',
        left: 'Depends on drainage slots, seals and install',
        right: 'Same — detailing and gaskets decide weather performance',
      },
      {
        key: 'uv_weather',
        left: 'UV-stabilised compounds matter for colour hold',
        right: 'Coating quality matters for chalking/corrosion',
      },
      {
        key: 'acoustic',
        left: 'Good potential with proper seals and glass build-up',
        right: 'Achievable with correct system and glass',
      },
      {
        key: 'life',
        left: 'Long service with maintained seals/hardware',
        right: 'Long service with coating and corrosion protection',
      },
      {
        key: 'application_suitability',
        left: 'Residences prioritising comfort and low paint maintenance',
        right: 'Large openings, modern slim frames, commercial façades as designed',
      },
    ],
    left: {
      key: 'upvc',
      name: 'uPVC windows',
      bestSuitedFor: [
        'Homes prioritising thermal/acoustic comfort',
        'Projects wanting low exterior paint maintenance on frames',
      ],
      advantages: [
        'Multi-chamber insulation potential',
        'Colour-through profiles (product-dependent)',
      ],
      limitations: [
        'Dark colours/heat distortion risks if poorly specified',
        'Repair networks vary by brand',
      ],
      costImplications:
        'Quote whole window (profile + glass + mesh + install). Cheapest profile with poor glass is false economy.',
      thingsToVerify: [
        'Profile series and reinforcement',
        'Glass thickness/IGU',
        'Install warranty',
      ],
    },
    right: {
      key: 'aluminium',
      name: 'Aluminium windows',
      bestSuitedFor: [
        'Large glazed openings needing slender frames',
        'Designs specifying aluminium systems',
        'Projects with thermal-break aluminium where comfort matters',
      ],
      advantages: ['High strength, slim aesthetics', 'Wide fabrication flexibility'],
      limitations: ['Without thermal break, heat transfer is higher', 'Coating quality varies'],
      costImplications:
        'Basic sliding aluminium can look cheap until glass and insect mesh are added; premium thermal-break competes with uPVC on price.',
      thingsToVerify: ['Thermal break or not', 'Alloy/coating spec', 'Hardware brand'],
    },
    sharedThingsToVerify: [
      'Wind load and structural anchoring',
      'Sill flashing and waterproofing to masonry',
      'After-sales service in your city',
    ],
    costModel: {
      quantityKind: 'openings_m2',
      quantityLabel: 'Total window opening area (m²)',
      defaultQuantity: 25,
      left: {
        rateLabel: '₹ per m² installed uPVC (indicative)',
        defaultRateInr: 9000,
        unitsPerQuantity: 1,
        unitNoun: 'm²',
      },
      right: {
        rateLabel: '₹ per m² installed aluminium (indicative)',
        defaultRateInr: 7500,
        unitsPerQuantity: 1,
        unitNoun: 'm²',
      },
      notes:
        'Installed ₹/m² varies enormously with glass, mesh, grille and brand. Use this only to scale your own quotes.',
    },
    relatedLinks: [
      { href: '/construction/materials', label: 'Materials hub' },
      { href: '/construction/cost-calculator', label: 'Construction cost calculator' },
      { href: '/construction/guides', label: 'Guides' },
    ],
    faqs: [
      {
        question: 'Is uPVC always better insulated than aluminium?',
        answer:
          'uPVC multi-chamber profiles often perform well thermally, but aluminium with a proper thermal break and insulated glass can also meet comfort goals. Compare full system U-values and install quality.',
      },
    ],
    methodology:
      'Frame-material comparison is educational. Performance claims should come from system datasheets. No product brands are endorsed.',
    seoTitle: 'uPVC vs Aluminium Windows — Comparison | Varnarc',
    seoDescription:
      'Compare uPVC and aluminium windows on cost, thermal comfort, maintenance and suitability — with an opening-area cost planner. No simplistic winner.',
    hintTokens: [['upvc', 'aluminium'], ['upvc', 'aluminum'], ['uPVC', 'aluminium'], ['windows']],
  },
  {
    slug: 'gypsum-vs-cement-plaster',
    category: 'plaster',
    title: 'Gypsum plaster vs cement plaster',
    shortSummary:
      'Interior gypsum finishing systems versus cement–sand plaster — speed, moisture limits and substrate rules.',
    leftName: 'Gypsum plaster',
    rightName: 'Cement plaster',
    overview:
      'Cement–sand plaster remains the default for many exteriors and wet-tolerant interiors. Gypsum plaster systems are popular for interior dry areas seeking faster finish and smoother surfaces — but they are not interchangeable with exterior cement render. Substrate prep, thickness and manufacturer rules decide success.',
    attributes: [
      {
        key: 'approximate_cost',
        left: 'Material ₹/m² plus skilled application; often competitive on interior finish speed',
        right: 'Cement + sand + labour; curing time adds programme cost',
      },
      {
        key: 'strength_spec',
        left: 'Follow manufacturer compressive/bond data; not a structural render',
        right: 'Cement plaster strengths depend on mix and curing',
      },
      {
        key: 'installation_speed',
        left: 'Often faster interior finish when substrate is ready',
        right: 'Multiple coats and curing extend duration',
      },
      {
        key: 'water_resistance',
        left: 'Generally for dry interiors — avoid prolonged dampness',
        right: 'Preferred for exteriors and many wet-adjacent areas as specified',
      },
      {
        key: 'wastage',
        left: 'Bag/set working times affect waste',
        right: 'Rebound and thickness variation on site',
      },
      {
        key: 'finish_compatibility',
        left: 'Smooth base for paints when done well',
        right: 'May need putty for premium paint finishes',
      },
      {
        key: 'maintenance',
        left: 'Protect from leaks; repairs need compatible products',
        right: 'Patchable with cementitious repairs',
      },
      {
        key: 'application_suitability',
        left: 'Dry interior walls/ceilings per system approval',
        right: 'External walls, many interiors, wet zones as designed',
      },
    ],
    left: {
      key: 'gypsum',
      name: 'Gypsum plaster',
      materialHref: '/construction/materials/plaster',
      bestSuitedFor: [
        'Dry interior walls seeking faster smooth finish',
        'Projects following a gypsum system data sheet',
      ],
      advantages: ['Speed and finish quality potential', 'Less water curing than cement plaster'],
      limitations: ['Moisture sensitivity', 'Not a drop-in exterior render'],
      costImplications:
        'Include primer/bonding as required by maker; compare against cement plaster + putty + time.',
      thingsToVerify: ['Approved substrates', 'Max thickness', 'Wet-area exclusions'],
    },
    right: {
      key: 'cement-plaster',
      name: 'Cement plaster',
      materialHref: '/construction/materials/plaster',
      bestSuitedFor: [
        'External rendering',
        'Interiors where cement plaster is specified',
        'Areas expecting higher moisture exposure (as detailed)',
      ],
      advantages: ['Familiar site practice', 'Exterior suitability'],
      limitations: ['Curing and drying time', 'May need putty for smooth paint'],
      costImplications: 'Cement, sand, labour, scaffolding and curing water all count.',
      thingsToVerify: ['Mix ratio and thickness', 'Curing plan', 'External texture type'],
    },
    sharedThingsToVerify: [
      'Interior vs exterior exposure',
      'Whether plumbing/electrical chasing is complete',
      'Paint system compatibility',
    ],
    costModel: {
      quantityKind: 'plaster_m2',
      quantityLabel: 'Plaster area (m²)',
      defaultQuantity: 200,
      left: {
        rateLabel: '₹ per m² gypsum system (indicative installed)',
        defaultRateInr: 45,
        unitsPerQuantity: 1,
        unitNoun: 'm²',
      },
      right: {
        rateLabel: '₹ per m² cement plaster (indicative installed)',
        defaultRateInr: 40,
        unitsPerQuantity: 1,
        unitNoun: 'm²',
      },
      notes:
        'Installed ₹/m² varies by city and finish grade. Use plaster calculator for cement–sand material splits if you need bag counts.',
    },
    relatedLinks: [
      { href: '/construction/plaster-calculator', label: 'Plaster calculator' },
      { href: '/construction/materials/plaster', label: 'Plaster guide' },
      { href: '/construction/materials/paint', label: 'Paint guide' },
    ],
    faqs: [
      {
        question: 'Can gypsum plaster be used on exterior walls?',
        answer:
          'Generally no for standard gypsum interior systems. Use cementitious or other exterior-rated renders as specified.',
      },
    ],
    methodology:
      'Interior gypsum vs cement plaster comparison follows common manufacturer constraints and site practice. Always read the system data sheet.',
    seoTitle: 'Gypsum vs Cement Plaster — Comparison | Varnarc',
    seoDescription:
      'Compare gypsum and cement plaster: best uses, moisture limits, speed, cost implications and area cost planner.',
    hintTokens: [['gypsum', 'cement plaster'], ['gypsum plaster', 'cement plaster'], ['plaster']],
  },
];

const bySlug = new Map(EDITORIAL_COMPARISONS.map((c) => [c.slug, c]));

export function getEditorialComparison(slug: string): EditorialComparison | undefined {
  return bySlug.get(slug);
}

export function listEditorialComparisonSlugs(): string[] {
  return EDITORIAL_COMPARISONS.map((c) => c.slug);
}

export function listEditorialComparisons(category?: CompareHubCategoryId | 'all') {
  if (!category || category === 'all') return EDITORIAL_COMPARISONS;
  return EDITORIAL_COMPARISONS.filter((c) => c.category === category);
}

/** Map ?hint=aac,brick style tokens to an editorial slug when unambiguous. */
export function resolveCompareHint(hint: string | null | undefined): string | null {
  if (!hint?.trim()) return null;
  const parts = hint
    .split(',')
    .map((p) => p.trim().toLowerCase().replace(/\s+/g, ' '))
    .filter(Boolean);
  if (!parts.length) return null;

  const partMatchesToken = (part: string, token: string) => {
    const t = token.toLowerCase().replace(/\s+/g, ' ');
    return part === t || part.replace(/-/g, ' ') === t.replace(/-/g, ' ');
  };

  for (const cmp of EDITORIAL_COMPARISONS) {
    for (const tokens of cmp.hintTokens) {
      const normalizedTokens = tokens.map((t) => t.toLowerCase().replace(/\s+/g, ' '));

      // Single-token shortcuts (e.g. hint=cement → OPC vs PPC)
      if (normalizedTokens.length === 1 && parts.length === 1) {
        if (partMatchesToken(parts[0]!, normalizedTokens[0]!)) return cmp.slug;
        continue;
      }

      // Multi-token: every token must match a distinct hint part (no substring leakage)
      if (normalizedTokens.length >= 2 && parts.length >= 2) {
        const used = new Set<number>();
        let ok = true;
        for (const token of normalizedTokens) {
          const idx = parts.findIndex((p, i) => !used.has(i) && partMatchesToken(p, token));
          if (idx < 0) {
            ok = false;
            break;
          }
          used.add(idx);
        }
        if (ok) return cmp.slug;
      }
    }
  }
  return null;
}

export function calculatePairCost(input: {
  quantity: number;
  leftRate: number;
  rightRate: number;
  leftUnitsPerQuantity: number;
  rightUnitsPerQuantity: number;
}): {
  leftUnits: number;
  rightUnits: number;
  leftTotal: number;
  rightTotal: number;
  delta: number;
  cheaper: 'left' | 'right' | 'tie';
} {
  const q = Number.isFinite(input.quantity) && input.quantity > 0 ? input.quantity : 0;
  const leftUnits = q * input.leftUnitsPerQuantity;
  const rightUnits = q * input.rightUnitsPerQuantity;
  const leftTotal = leftUnits * (Number.isFinite(input.leftRate) ? input.leftRate : 0);
  const rightTotal = rightUnits * (Number.isFinite(input.rightRate) ? input.rightRate : 0);
  const delta = leftTotal - rightTotal;
  const cheaper = Math.abs(delta) < 0.5 ? 'tie' : delta < 0 ? 'left' : 'right';
  return { leftUnits, rightUnits, leftTotal, rightTotal, delta, cheaper };
}
