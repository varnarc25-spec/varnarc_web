/** Construction Glossary — curated terms with action-oriented SEO pages (anti-thin). */

export const CONSTRUCTION_GLOSSARY_VERSION = '2026.08.1';

export const CONSTRUCTION_GLOSSARY_QUALIFICATION =
  'Plain-language explanations for planning and learning. Local codes, consultant advice and contract documents take precedence over glossary summaries.';

export const CONSTRUCTION_GLOSSARY_METHODOLOGY =
  'Each Varnarc glossary term includes a simple definition, a technical explanation, a worked example, units where relevant, and links to calculators or materials so you can take the next action. Thin one-line dictionary stubs are not published.';

/** Minimum editorial lengths — primary anti-thin gate. */
export const GLOSSARY_MIN_SIMPLE_CHARS = 60;
export const GLOSSARY_MIN_TECHNICAL_CHARS = 220;
export const GLOSSARY_MIN_EXAMPLE_CHARS = 80;
export const GLOSSARY_MIN_DESCRIPTION_CHARS = 110;

export type GlossaryLink = { href: string; label: string };

export type GlossaryTermCategory =
  'documents' | 'structure' | 'materials' | 'measurement' | 'planning';

export type ConstructionGlossaryTermDef = {
  slug: string;
  term: string;
  alsoKnownAs?: string[];
  category: GlossaryTermCategory;
  /** Unique SEO title (must include the term). */
  title: string;
  /** Unique meta description. */
  description: string;
  simpleDefinition: string;
  technicalExplanation: string;
  example: string;
  units: Array<{ unit: string; note: string }>;
  relatedCalculator: GlossaryLink | null;
  relatedMaterials: GlossaryLink[];
  relatedTermSlugs: string[];
  faqs: Array<{ question: string; answer: string }>;
  nextActions: GlossaryLink[];
};

export const GLOSSARY_CATEGORY_LABELS: Record<GlossaryTermCategory, string> = {
  documents: 'Documents & estimates',
  structure: 'Structure & concrete',
  materials: 'Materials',
  measurement: 'Area & measurement',
  planning: 'Planning & regulations',
};

/**
 * Curated initial glossary. Adding a term requires full editorial fields —
 * the gate rejects thin stubs.
 */
export const CONSTRUCTION_GLOSSARY_TERMS: ConstructionGlossaryTermDef[] = [
  {
    slug: 'boq',
    term: 'BOQ',
    alsoKnownAs: ['Bill of Quantities', 'Bill of Quantity'],
    category: 'documents',
    title: 'BOQ (Bill of Quantities) Meaning in Construction | Varnarc',
    description:
      'What a BOQ is, how line items and rates work, a simple example, and how to generate a planning BOQ with Varnarc tools. Not a tender document.',
    simpleDefinition:
      'A BOQ (Bill of Quantities) is a structured list of work items with measured quantities and rates, used to estimate and compare construction costs.',
    technicalExplanation:
      'In practice a BOQ breaks the project into measurable items — excavation, concrete, masonry, plaster, finishes — each with a unit (m³, m², kg, number), quantity, rate and amount. Contractors may quote against the same BOQ so bids are comparable. Owners use a planning BOQ to see where money goes before drawings are final. A Varnarc planning BOQ is educational and indicative; a contractual BOQ must follow the consultant’s measurement rules and tender conditions.',
    example:
      'Example: “M20 RCC slab — 45 m³ × ₹X/m³” and “Internal plaster — 320 m² × ₹Y/m²” appear as separate BOQ lines so you can adjust rates without rewriting the whole estimate.',
    units: [
      {
        unit: 'm³ / m² / kg / nos',
        note: 'Depends on the work item (volume, area, weight, count)',
      },
      { unit: '₹', note: 'Rate × quantity = line amount (before contingency/taxes as applicable)' },
    ],
    relatedCalculator: {
      href: '/construction/boq-generator',
      label: 'BOQ generator',
    },
    relatedMaterials: [
      { href: '/construction/materials/concrete', label: 'Concrete' },
      { href: '/construction/materials/steel', label: 'Steel (TMT)' },
      { href: '/construction/materials/cement', label: 'Cement' },
    ],
    relatedTermSlugs: ['rcc', 'bbs', 'built-up-area'],
    faqs: [
      {
        question: 'Is a BOQ the same as a quotation?',
        answer:
          'No. A BOQ lists quantities and rates in a structured format. A quotation is a price offer from a contractor; it may be based on a BOQ but can also be lumpsum.',
      },
      {
        question: 'Can I use a Varnarc BOQ for tendering?',
        answer:
          'Use it for planning and education. Formal tenders need consultant-approved measurement and conditions.',
      },
    ],
    nextActions: [
      { href: '/construction/boq-generator', label: 'Generate a planning BOQ' },
      { href: '/construction/cost-calculator', label: 'Estimate construction cost' },
      { href: '/construction/contractor-quote-analyzer', label: 'Compare contractor quotes' },
    ],
  },
  {
    slug: 'rcc',
    term: 'RCC',
    alsoKnownAs: ['Reinforced Cement Concrete', 'Reinforced Concrete'],
    category: 'structure',
    title: 'RCC Meaning in Construction — Reinforced Cement Concrete | Varnarc',
    description:
      'RCC explained: concrete + steel working together, typical members, units, and calculators for volume and steel. Indicative planning only.',
    simpleDefinition:
      'RCC (Reinforced Cement Concrete) is concrete strengthened with steel bars so it can resist both compression and tension in beams, slabs, columns and footings.',
    technicalExplanation:
      'Plain concrete is strong in compression but weak in tension. Steel reinforcement (usually TMT bars) is placed where tensile and shear stresses occur. Together they form RCC members sized by a structural engineer. Grades such as M20 or M25 describe characteristic compressive strength. Site practice covers formwork, cover to reinforcement, compaction and curing. Varnarc RCC tools estimate volumes and materials for planning — they do not design member sizes or replace structural drawings.',
    example:
      'Example: A residential floor slab might be specified as M20 RCC, 125–150 mm thick, with TMT mesh/bars as per the structural drawing — quantity is derived from area × thickness, not from carpet area alone.',
    units: [
      { unit: 'm³', note: 'Concrete volume' },
      { unit: 'kg / tonne', note: 'Reinforcement steel' },
      { unit: 'MPa (grade)', note: 'e.g. M20 ≈ 20 MPa characteristic strength' },
    ],
    relatedCalculator: {
      href: '/construction/rcc-calculator',
      label: 'RCC calculator',
    },
    relatedMaterials: [
      { href: '/construction/materials/concrete', label: 'Concrete' },
      { href: '/construction/materials/steel', label: 'Steel (TMT)' },
      { href: '/construction/materials/cement', label: 'Cement' },
    ],
    relatedTermSlugs: ['pcc', 'reinforcement', 'tmt', 'formwork', 'bbs'],
    faqs: [
      {
        question: 'Is RCC the same as PCC?',
        answer:
          'No. PCC is plain cement concrete without steel reinforcement. RCC includes designed reinforcement.',
      },
    ],
    nextActions: [
      { href: '/construction/rcc-calculator', label: 'Calculate RCC volume' },
      { href: '/construction/steel-calculator', label: 'Estimate steel weight' },
      { href: '/construction/slab-calculator', label: 'Slab concrete calculator' },
    ],
  },
  {
    slug: 'pcc',
    term: 'PCC',
    alsoKnownAs: ['Plain Cement Concrete', 'Lean concrete'],
    category: 'structure',
    title: 'PCC Meaning in Construction — Plain Cement Concrete | Varnarc',
    description:
      'What PCC is used for (bedding, leveling), how it differs from RCC, units and related calculators. Planning aid only.',
    simpleDefinition:
      'PCC (Plain Cement Concrete) is concrete without steel reinforcement, often used as a leveling or bedding layer under foundations and floors.',
    technicalExplanation:
      'PCC (sometimes called lean concrete) provides a clean, level working surface and distributes loads lightly. Typical uses include footing beds, flooring base and fill where tensile strength is not required. Mixes are often leaner than structural RCC. Thickness is set by the drawing (commonly 75–100 mm under footings, varying by project). Because there is no reinforcement, PCC is not a substitute for RCC members that must carry bending or tension.',
    example:
      'Example: Before casting an RCC footing, a 100 mm PCC bed may be laid so the footing sits on a firm, level surface and cover to bottom bars is easier to maintain.',
    units: [
      { unit: 'm³', note: 'Volume = area × thickness' },
      { unit: 'mm', note: 'Typical bed thickness on drawings' },
    ],
    relatedCalculator: {
      href: '/construction/footing-calculator',
      label: 'Footing calculator (incl. PCC bed)',
    },
    relatedMaterials: [
      { href: '/construction/materials/concrete', label: 'Concrete' },
      { href: '/construction/materials/cement', label: 'Cement' },
      { href: '/construction/materials/aggregate', label: 'Aggregate' },
    ],
    relatedTermSlugs: ['rcc', 'formwork', 'aggregate'],
    faqs: [
      {
        question: 'Does PCC need TMT steel?',
        answer:
          'No. By definition PCC has no structural reinforcement. Mesh for shrinkage is a separate specification if used.',
      },
    ],
    nextActions: [
      { href: '/construction/footing-calculator', label: 'Footing + PCC estimate' },
      { href: '/construction/concrete-calculator', label: 'Concrete calculator' },
    ],
  },
  {
    slug: 'bbs',
    term: 'BBS',
    alsoKnownAs: ['Bar Bending Schedule'],
    category: 'documents',
    title: 'BBS (Bar Bending Schedule) Meaning | Varnarc',
    description:
      'Bar bending schedule explained: how cut lengths and bar marks organise reinforcement, with links to steel and BBS tools.',
    simpleDefinition:
      'A BBS (Bar Bending Schedule) is a table that lists each reinforcement bar’s mark, diameter, shape, cut length and quantity so steel can be cut and bent accurately.',
    technicalExplanation:
      'Structural drawings show bar layouts; the BBS translates them into fabrication instructions — bar mark, diameter, number of bars, cutting length, bending dimensions and total weight. It reduces wastage and disputes on site. Lengths must follow the engineer’s hooks, bends and lap rules. Varnarc’s BBS organiser helps structure planning data; it does not replace a structural engineer’s approved schedule.',
    example:
      'Example: Bar mark B1 — 12 mm dia, 16 bars, cutting length 4.2 m each — appears as one BBS row with total length and weight derived from the steel formula (d²/162).',
    units: [
      { unit: 'mm', note: 'Bar diameter' },
      { unit: 'm', note: 'Cutting length per bar' },
      { unit: 'kg', note: 'Weight from length × unit weight' },
    ],
    relatedCalculator: {
      href: '/construction/bar-bending-schedule',
      label: 'BBS organiser',
    },
    relatedMaterials: [
      { href: '/construction/materials/steel', label: 'Steel (TMT)' },
      { href: '/construction/materials/concrete', label: 'Concrete' },
    ],
    relatedTermSlugs: ['reinforcement', 'tmt', 'rcc'],
    faqs: [
      {
        question: 'Who prepares the BBS?',
        answer:
          'Typically the structural design team or a detailing consultant. Site teams may prepare cutting lists from the approved BBS, not invent bar sizes.',
      },
    ],
    nextActions: [
      { href: '/construction/bar-bending-schedule', label: 'Open BBS tool' },
      { href: '/construction/steel-calculator', label: 'Steel weight calculator' },
      { href: '/construction/calc/steel-required/1000-sq-ft', label: 'Steel for 1000 sq ft house' },
    ],
  },
  {
    slug: 'tmt',
    term: 'TMT',
    alsoKnownAs: ['Thermo-Mechanically Treated bar', 'TMT rebar'],
    category: 'materials',
    title: 'TMT Steel Meaning in Construction | Varnarc',
    description:
      'What TMT bars are, why they are used as RCC reinforcement, common grades and diameters, ₹/kg units, plus steel calculator and price links.',
    simpleDefinition:
      'TMT bars are thermo-mechanically treated reinforcement steel rods with a tough outer layer and ductile core, widely used in RCC buildings.',
    technicalExplanation:
      'TMT manufacturing quenches the bar surface after rolling, then allows self-tempering so the core remains ductile. Grades (e.g. Fe 500, Fe 550) indicate yield strength. Diameters (8–32 mm common in houses) are chosen by the structural engineer. Market prices are usually quoted ₹/kg and vary by brand, diameter and delivery. Never substitute diameters or lap lengths without engineer approval.',
    example:
      'Example: A column schedule might call for 16 mm Fe 500 TMT main bars with 8 mm stirrups — weight is calculated from total length × unit weight for each diameter.',
    units: [
      { unit: 'mm', note: 'Nominal diameter' },
      { unit: 'kg / tonne', note: 'Purchase and stock unit' },
      { unit: '₹/kg', note: 'Common market quote unit' },
    ],
    relatedCalculator: {
      href: '/construction/steel-calculator',
      label: 'Steel calculator',
    },
    relatedMaterials: [
      { href: '/construction/materials/steel', label: 'Steel material page' },
      { href: '/construction/prices/steel/hyderabad', label: 'Steel prices (example city)' },
    ],
    relatedTermSlugs: ['reinforcement', 'rcc', 'bbs'],
    faqs: [
      {
        question: 'Is TMT the same as TOR steel?',
        answer:
          'TOR (twisted) bars are an older product. Modern RCC practice in India predominantly uses TMT. Follow the grade specified on drawings.',
      },
    ],
    nextActions: [
      { href: '/construction/steel-calculator', label: 'Calculate TMT weight' },
      { href: '/construction/prices?material=steel', label: 'Browse steel prices' },
      { href: '/construction/fair-price-checker', label: 'Fair price checker' },
    ],
  },
  {
    slug: 'aac-block',
    term: 'AAC block',
    alsoKnownAs: ['Autoclaved Aerated Concrete block', 'AAC'],
    category: 'materials',
    title: 'AAC Block Meaning — Lightweight Concrete Blocks | Varnarc',
    description:
      'AAC blocks explained vs clay brick, typical sizes, mortar notes, and the AAC block calculator for quantity planning.',
    simpleDefinition:
      'AAC blocks are lightweight autoclaved aerated concrete masonry units used for walls, valued for speed of build and thermal insulation versus clay brick.',
    technicalExplanation:
      'AAC is a cementitious block with a cellular structure formed by aluminium aeration and autoclave curing. Blocks are larger than clay bricks, so walls go up faster with fewer joints, but need compatible thin-bed or specified mortar, proper curing and sometimes mesh at junctions. Structural frames (RCC) still carry primary loads in framed buildings; AAC is typically an infill. Compare cost per m² of wall, not only piece price.',
    example:
      'Example: For a 3 m × 3 m partition (9 m²) with 200 mm AAC, piece count comes from block face area plus wastage — use the AAC calculator rather than a clay-brick piece rate.',
    units: [
      { unit: 'mm', note: 'Block modular size (e.g. 600 × 200 × 100/150/200)' },
      { unit: 'nos / m²', note: 'Quantity for wall area' },
      { unit: '₹/piece', note: 'Common dealer quote unit' },
    ],
    relatedCalculator: {
      href: '/construction/aac-block-calculator',
      label: 'AAC block calculator',
    },
    relatedMaterials: [
      { href: '/construction/materials/aac-blocks', label: 'AAC blocks' },
      { href: '/construction/materials/brick', label: 'Clay brick' },
      { href: '/construction/compare/aac-vs-brick', label: 'AAC vs brick comparison' },
    ],
    relatedTermSlugs: ['mortar', 'built-up-area', 'rcc'],
    faqs: [
      {
        question: 'Can AAC replace RCC columns?',
        answer:
          'No. AAC is masonry infill. Columns, beams and slabs remain RCC (or other structural systems) as designed.',
      },
    ],
    nextActions: [
      { href: '/construction/aac-block-calculator', label: 'Estimate AAC quantity' },
      { href: '/construction/compare/aac-vs-brick', label: 'Compare AAC vs brick' },
      { href: '/construction/brick-calculator', label: 'Brick calculator' },
    ],
  },
  {
    slug: 'carpet-area',
    term: 'Carpet area',
    alsoKnownAs: ['Net usable area'],
    category: 'measurement',
    title: 'Carpet Area Meaning in Construction & Real Estate | Varnarc',
    description:
      'Carpet area vs built-up and super built-up, what it includes, and how it affects cost planning. Clear definitions for buyers and builders.',
    simpleDefinition:
      'Carpet area is the net usable floor area inside the walls of a home — roughly the area you can put a carpet on — excluding external walls and common building areas.',
    technicalExplanation:
      'Definitions vary slightly by jurisdiction and RERA practice, but carpet area generally covers the usable area within the apartment/house walls, including thickness of internal partitions in many Indian regulatory definitions. It excludes external walls, balconies (rules vary), shaft/common areas and open-to-sky spaces unless specified. Builders historically marketed super built-up area; comparing ₹/sq ft is misleading unless you know which area definition is used. Construction cost tools often use built-up area, which is larger than carpet.',
    example:
      'Example: An apartment advertised at 1,200 sq ft super built-up might have ~850–950 sq ft carpet depending on loading; always ask for carpet area before comparing price per sq ft.',
    units: [
      { unit: 'sq ft / sq m', note: 'Area measurement — confirm which definition the quote uses' },
    ],
    relatedCalculator: {
      href: '/construction/cost-calculator',
      label: 'Cost calculator',
    },
    relatedMaterials: [],
    relatedTermSlugs: ['built-up-area', 'super-built-up-area', 'plinth-area', 'fsi'],
    faqs: [
      {
        question: 'Is carpet area the same as built-up area?',
        answer:
          'No. Built-up includes wall thicknesses and often utility areas; carpet is the net usable floor. Super built-up adds a share of common areas.',
      },
    ],
    nextActions: [
      { href: '/construction/glossary/built-up-area', label: 'Read: built-up area' },
      { href: '/construction/glossary/super-built-up-area', label: 'Read: super built-up area' },
      { href: '/construction/affordability-calculator', label: 'Affordability calculator' },
    ],
  },
  {
    slug: 'built-up-area',
    term: 'Built-up area',
    alsoKnownAs: ['Built up area', 'BUA'],
    category: 'measurement',
    title: 'Built-up Area Meaning — vs Carpet & Super Built-up | Varnarc',
    description:
      'Built-up area explained for houses and apartments, how it relates to carpet area, and why cost calculators use it.',
    simpleDefinition:
      'Built-up area is carpet area plus the area occupied by walls (and often other enclosed utility spaces), used widely for construction cost planning.',
    technicalExplanation:
      'For an independent house, built-up area typically means the covered constructed footprint on each floor including wall thicknesses. For apartments, developer definitions can add dry areas or balconies differently — always read the agreement. Varnarc construction-cost and “required for X sq ft” landings use built-up area as the planning input because material thumb-rules and ₹/sq ft rates attach more naturally to constructed area than to carpet alone.',
    example:
      'Example: 1,500 sq ft built-up on two floors is the reference size on several Varnarc cost pages — cement/steel thumb-rules are applied to that built-up figure, not to carpet area.',
    units: [{ unit: 'sq ft / sq m', note: 'Primary input for many cost and quantity landings' }],
    relatedCalculator: {
      href: '/construction/cost-calculator',
      label: 'Construction cost calculator',
    },
    relatedMaterials: [],
    relatedTermSlugs: ['carpet-area', 'super-built-up-area', 'plinth-area', 'fsi'],
    faqs: [
      {
        question: 'Should I multiply carpet area by a factor to get built-up?',
        answer:
          'Rules of thumb exist but vary. Prefer measured drawings or the definition in your sale agreement rather than a generic factor.',
      },
    ],
    nextActions: [
      {
        href: '/construction/calc/construction-cost/1500-sq-ft',
        label: 'Cost for 1500 sq ft house',
      },
      { href: '/construction/construction-cost', label: 'City construction cost' },
      { href: '/construction/glossary/carpet-area', label: 'Carpet area' },
    ],
  },
  {
    slug: 'super-built-up-area',
    term: 'Super built-up area',
    alsoKnownAs: ['Saleable area', 'Super built up'],
    category: 'measurement',
    title: 'Super Built-up Area Meaning | Varnarc Glossary',
    description:
      'Super built-up (saleable) area vs carpet and built-up — what loading means and how to compare apartment prices fairly.',
    simpleDefinition:
      'Super built-up area is built-up area plus a proportionate share of common spaces (lobbies, stairs, clubhouse, etc.), often used as the “saleable” area in apartment marketing.',
    technicalExplanation:
      'The uplift from carpet/built-up to super built-up is sometimes called loading. A higher loading means you pay for more common area relative to private usable space. RERA and local rules increasingly emphasise carpet area disclosure, but older brochures still lead with super built-up. For construction cost of a house you build yourself, super built-up is usually irrelevant — use built-up or covered area from drawings.',
    example:
      'Example: 30% loading on 1,000 sq ft carpet → about 1,300 sq ft super built-up. ₹6,000/sq ft on super built-up is not comparable to ₹6,000/sq ft on carpet.',
    units: [
      {
        unit: 'sq ft / sq m',
        note: 'Confirm whether price is on carpet, built-up or super built-up',
      },
      { unit: '% loading', note: 'Common way developers describe the uplift' },
    ],
    relatedCalculator: {
      href: '/construction/affordability-calculator',
      label: 'Affordability calculator',
    },
    relatedMaterials: [],
    relatedTermSlugs: ['carpet-area', 'built-up-area', 'fsi', 'far'],
    faqs: [
      {
        question: 'Is super built-up used for house construction cost?',
        answer:
          'Usually not for self-built houses. Use built-up or covered area from architectural drawings.',
      },
    ],
    nextActions: [
      { href: '/construction/glossary/carpet-area', label: 'Carpet area' },
      { href: '/construction/glossary/built-up-area', label: 'Built-up area' },
      { href: '/construction/affordability-calculator', label: 'Check affordability' },
    ],
  },
  {
    slug: 'plinth-area',
    term: 'Plinth area',
    alsoKnownAs: ['Plinth'],
    category: 'measurement',
    title: 'Plinth Area Meaning in Building Measurement | Varnarc',
    description:
      'Plinth area defined for buildings, how it relates to built-up area and FAR/FSI calculations, with next-step planning links.',
    simpleDefinition:
      'Plinth area is the built-up covered area measured at the floor level of the plinth (the platform above ground on which the building stands), including walls.',
    technicalExplanation:
      'In many Indian measurement practices, plinth area is close to built-up area of a floor measured to the outer faces of walls, used historically in government and PWD contexts. Exact inclusions (munty, shafts, balconies) follow the applicable measurement code. For homeowners, “plinth” also colloquially means the raised base of the house. Do not confuse plinth area with carpet area when reading old estimates.',
    example:
      'Example: A single-storey plan 12 m × 10 m to outer walls has a plinth area of 120 m² (about 1,292 sq ft), before checking balcony or porch rules in the measurement standard you follow.',
    units: [{ unit: 'sq ft / sq m', note: 'Floor covered area at plinth level' }],
    relatedCalculator: {
      href: '/construction/cost-calculator',
      label: 'Cost calculator',
    },
    relatedMaterials: [],
    relatedTermSlugs: ['built-up-area', 'carpet-area', 'fsi', 'far'],
    faqs: [],
    nextActions: [
      { href: '/construction/glossary/built-up-area', label: 'Built-up area' },
      { href: '/construction/glossary/fsi', label: 'FSI' },
      { href: '/construction/checklists', label: 'Construction checklists' },
    ],
  },
  {
    slug: 'fsi',
    term: 'FSI',
    alsoKnownAs: ['Floor Space Index', 'Floor Space Index (FSI)'],
    category: 'planning',
    title: 'FSI Meaning — Floor Space Index in Building Rules | Varnarc',
    description:
      'FSI/FAR explained for plot development: how much floor area you can build, related terms, and planning links. Not legal advice.',
    simpleDefinition:
      'FSI (Floor Space Index) is the ratio of total built-up floor area allowed on a plot to the plot area — it caps how much you can construct.',
    technicalExplanation:
      'If FSI is 1.5 on a 2,000 sq ft plot, total permissible built-up floor area is roughly 3,000 sq ft across floors (subject to setbacks, height, parking and local exemptions). Some cities use FAR (Floor Area Ratio) for the same idea; definitions of what counts toward FSI (balconies, staircases, stilts) are set by the local development authority. Always verify the current bye-laws for your survey number — Varnarc does not provide statutory compliance certificates.',
    example:
      'Example: Plot 240 sq m, FSI 1.25 → about 300 sq m total floor area potential before applying setbacks and parking rules that may reduce what you can actually build.',
    units: [
      { unit: 'ratio (dimensionless)', note: 'Built-up floor area ÷ plot area' },
      { unit: 'sq ft / sq m', note: 'Both plot and floor areas must use the same unit' },
    ],
    relatedCalculator: {
      href: '/construction/project-readiness',
      label: 'Project readiness',
    },
    relatedMaterials: [],
    relatedTermSlugs: ['far', 'built-up-area', 'plinth-area', 'carpet-area'],
    faqs: [
      {
        question: 'Are FSI and FAR the same?',
        answer:
          'They express the same concept in most contexts. Local documents may prefer one term; always read the definition of includable areas in that authority’s rules.',
      },
    ],
    nextActions: [
      { href: '/construction/glossary/far', label: 'FAR' },
      { href: '/construction/project-readiness', label: 'Project readiness checklist' },
      { href: '/construction/guides', label: 'Construction guides' },
    ],
  },
  {
    slug: 'far',
    term: 'FAR',
    alsoKnownAs: ['Floor Area Ratio'],
    category: 'planning',
    title: 'FAR Meaning — Floor Area Ratio | Varnarc Glossary',
    description:
      'Floor Area Ratio (FAR) vs FSI, how it limits building bulk on a plot, and related measurement terms. Verify local bye-laws.',
    simpleDefinition:
      'FAR (Floor Area Ratio) is the ratio of a building’s total floor area to the size of the plot — functionally the same idea as FSI in most Indian planning contexts.',
    technicalExplanation:
      'FAR = total covered floor area ÷ plot area. Authorities publish base FAR and may allow premium FAR, TDR or incentives. What counts as “floor area” (whether balconies, basements, parking floors are included) is defined locally. Homeowners should treat online FAR calculators as approximate; sanctioned plans from a licensed professional are the source of truth.',
    example:
      'Example: FAR 2.0 on a 150 sq m plot suggests up to 300 sq m total floor area across storeys — still subject to height, setback and parking constraints.',
    units: [{ unit: 'ratio', note: 'Same dimensional logic as FSI' }],
    relatedCalculator: {
      href: '/construction/project-readiness',
      label: 'Project readiness',
    },
    relatedMaterials: [],
    relatedTermSlugs: ['fsi', 'built-up-area', 'plinth-area'],
    faqs: [
      {
        question: 'Which term should I use — FAR or FSI?',
        answer:
          'Use the term in your city’s development control regulations. Conceptually they align; inclusions may differ slightly by code.',
      },
    ],
    nextActions: [
      { href: '/construction/glossary/fsi', label: 'FSI explained' },
      { href: '/construction/professionals', label: 'Find professionals' },
    ],
  },
  {
    slug: 'mortar',
    term: 'Mortar',
    alsoKnownAs: ['Cement mortar', 'Masonry mortar'],
    category: 'materials',
    title: 'Mortar Meaning in Masonry & Plaster | Varnarc',
    description:
      'What mortar is (cement + sand binder), common ratios, units, and calculators for plaster and masonry planning.',
    simpleDefinition:
      'Mortar is a workable paste — typically cement and sand with water — that bonds bricks/blocks and is used for plastering and bedding.',
    technicalExplanation:
      'Unlike concrete, mortar usually has no coarse aggregate. Mix ratios (e.g. 1:4, 1:6 cement:sand) are chosen for masonry or plaster strength and workability. Joint thickness affects brick/block counts and mortar volume. AAC often needs manufacturer-specified adhesive mortar rather than conventional thick joints. Quantities come from wall area × joint/plaster thickness with wastage.',
    example:
      'Example: Internal plaster 12 mm thick on 100 m² at 1:4 mix — cement and sand volumes are derived via the plaster calculator, not from house built-up area alone.',
    units: [
      { unit: 'm³', note: 'Wet mortar volume' },
      { unit: 'bags / m³ sand', note: 'Material take-off from mix ratio' },
      { unit: 'mm', note: 'Joint or plaster thickness' },
    ],
    relatedCalculator: {
      href: '/construction/plaster-calculator',
      label: 'Plaster calculator',
    },
    relatedMaterials: [
      { href: '/construction/materials/cement', label: 'Cement' },
      { href: '/construction/materials/sand', label: 'Sand' },
      { href: '/construction/materials/brick', label: 'Brick' },
    ],
    relatedTermSlugs: ['aggregate', 'aac-block', 'pcc'],
    faqs: [
      {
        question: 'Is mortar the same as concrete?',
        answer:
          'No. Concrete includes coarse aggregate and is used for structural members; mortar is finer and used for bonding and plaster.',
      },
    ],
    nextActions: [
      { href: '/construction/plaster-calculator', label: 'Plaster / mortar estimate' },
      { href: '/construction/brick-calculator', label: 'Brick calculator' },
      { href: '/construction/cement-calculator', label: 'Cement calculator' },
    ],
  },
  {
    slug: 'aggregate',
    term: 'Aggregate',
    alsoKnownAs: ['Jelly', 'Metal', 'Coarse aggregate', 'Fine aggregate'],
    category: 'materials',
    title: 'Aggregate Meaning in Concrete — Jelly / Metal | Varnarc',
    description:
      'Fine vs coarse aggregate in concrete, typical sizes, units (m³), and the aggregate calculator for mix planning.',
    simpleDefinition:
      'Aggregate is the sand and stone (jelly/metal) that make up most of concrete’s volume — fine aggregate is sand; coarse aggregate is crushed stone.',
    technicalExplanation:
      'Coarse aggregate (often 10–20 mm or 20–40 mm) and fine aggregate (sand / M-sand) are proportioned with cement and water for a specified mix. Size, grading, silt content and moisture affect strength and workability. Quotes are commonly ₹/m³ and vary with crusher distance. Do not swap sizes casually in structural concrete without mix guidance.',
    example:
      'Example: For 10 m³ of M20 concrete, coarse aggregate volume is a large share of the mix — use the concrete or aggregate calculator with your mix preset rather than a single national thumb-rule.',
    units: [
      { unit: 'm³', note: 'Bulk purchase and mix volume' },
      { unit: 'mm', note: 'Nominal maximum size (e.g. 20 mm)' },
    ],
    relatedCalculator: {
      href: '/construction/aggregate-calculator',
      label: 'Aggregate calculator',
    },
    relatedMaterials: [
      { href: '/construction/materials/aggregate', label: 'Aggregate material page' },
      { href: '/construction/materials/sand', label: 'Sand' },
      { href: '/construction/materials/concrete', label: 'Concrete' },
    ],
    relatedTermSlugs: ['mortar', 'rcc', 'pcc'],
    faqs: [],
    nextActions: [
      { href: '/construction/aggregate-calculator', label: 'Estimate aggregate' },
      { href: '/construction/concrete-calculator', label: 'Concrete calculator' },
      { href: '/construction/prices?material=aggregate', label: 'Aggregate prices' },
    ],
  },
  {
    slug: 'formwork',
    term: 'Formwork',
    alsoKnownAs: ['Shuttering', 'Moulds'],
    category: 'structure',
    title: 'Formwork (Shuttering) Meaning in RCC | Varnarc',
    description:
      'Formwork explained: temporary moulds for concrete, materials, measurement units, and links to RCC planning tools.',
    simpleDefinition:
      'Formwork (shuttering) is the temporary mould that holds wet concrete to the required shape until it gains enough strength to support itself.',
    technicalExplanation:
      'Formwork may be timber, plywood, steel or aluminium systems. It must be strong, correctly aligned and sealed against grout loss. Area of formwork (m²) is often measured for billing separately from concrete volume (m³). Removal (striking) times depend on member type and curing conditions per engineer/IS guidance. Poor formwork shows up as honeycombing, bulging or dimensional errors.',
    example:
      'Example: A rectangular column 0.3 × 0.45 × 3.0 m needs formwork on four faces — area is calculated from perimeter × height, plus ties and supports, not from concrete volume alone.',
    units: [
      { unit: 'm²', note: 'Contact area of shuttering' },
      { unit: 'm³', note: 'Concrete volume cast inside the form' },
    ],
    relatedCalculator: {
      href: '/construction/rcc-calculator',
      label: 'RCC calculator',
    },
    relatedMaterials: [
      { href: '/construction/materials/concrete', label: 'Concrete' },
      { href: '/construction/materials/steel', label: 'Steel (TMT)' },
    ],
    relatedTermSlugs: ['rcc', 'pcc', 'reinforcement'],
    faqs: [
      {
        question: 'Is formwork reusable?',
        answer:
          'Many systems are designed for multiple uses if handled carefully. Timber plywood has limited repetitions compared with metal systems.',
      },
    ],
    nextActions: [
      { href: '/construction/column-calculator', label: 'Column concrete calculator' },
      { href: '/construction/beam-calculator', label: 'Beam calculator' },
      { href: '/construction/rcc-calculator', label: 'RCC volume' },
    ],
  },
  {
    slug: 'reinforcement',
    term: 'Reinforcement',
    alsoKnownAs: ['Rebar', 'Steel reinforcement', 'Rods'],
    category: 'structure',
    title: 'Reinforcement Meaning in RCC — Rebar Basics | Varnarc',
    description:
      'What reinforcement steel does in concrete, cover and detailing basics, units, and links to TMT, BBS and steel tools.',
    simpleDefinition:
      'Reinforcement is the steel (usually TMT bars) embedded in concrete to carry tensile and shear forces that plain concrete cannot resist alone.',
    technicalExplanation:
      'Bars are detailed as main reinforcement, distribution steel and stirrups/links. Concrete cover protects steel from corrosion and fire. Laps, hooks and anchorage follow the structural design. On site, chairs and spacers maintain position during concreting. Quantity planning uses BBS lengths or kg-per-sq-ft thumb-rules for early budgets — final steel must match approved drawings.',
    example:
      'Example: A simply supported beam may have bottom tensile bars, top bars near supports, and vertical stirrups at designed spacing — each appears as separate BBS entries.',
    units: [
      { unit: 'mm', note: 'Bar diameter and spacing' },
      { unit: 'kg', note: 'Total steel weight' },
      { unit: 'mm cover', note: 'Clear cover to reinforcement' },
    ],
    relatedCalculator: {
      href: '/construction/steel-calculator',
      label: 'Steel calculator',
    },
    relatedMaterials: [
      { href: '/construction/materials/steel', label: 'Steel (TMT)' },
      { href: '/construction/materials/concrete', label: 'Concrete' },
    ],
    relatedTermSlugs: ['tmt', 'bbs', 'rcc', 'formwork'],
    faqs: [
      {
        question: 'Can I reduce steel to save cost?',
        answer:
          'Not without the structural engineer. Under-reinforcement risks structural failure; any change must be redesigned and approved.',
      },
    ],
    nextActions: [
      { href: '/construction/steel-calculator', label: 'Estimate steel weight' },
      { href: '/construction/bar-bending-schedule', label: 'BBS organiser' },
      { href: '/construction/calc/steel-required/1500-sq-ft', label: 'Steel for 1500 sq ft house' },
    ],
  },
];

export type ConstructionGlossaryTermLanding = ConstructionGlossaryTermDef & {
  canonicalPath: string;
  relatedTerms: Array<{ slug: string; term: string; href: string; simpleDefinition: string }>;
  categoryLabel: string;
  indexable: true;
  version: string;
  methodology: string;
  qualification: string;
};

export function isConstructionGlossarySlug(value: string): boolean {
  return CONSTRUCTION_GLOSSARY_TERMS.some((t) => t.slug === value);
}

export function getConstructionGlossaryTerm(slug: string): ConstructionGlossaryTermDef | null {
  return CONSTRUCTION_GLOSSARY_TERMS.find((t) => t.slug === slug) ?? null;
}

export function canIndexConstructionGlossaryTerm(slug: string): {
  indexable: boolean;
  reason: string | null;
} {
  const term = getConstructionGlossaryTerm(slug);
  if (!term) return { indexable: false, reason: 'unknown_slug' };
  if (term.simpleDefinition.trim().length < GLOSSARY_MIN_SIMPLE_CHARS) {
    return { indexable: false, reason: 'simple_definition_too_thin' };
  }
  if (term.technicalExplanation.trim().length < GLOSSARY_MIN_TECHNICAL_CHARS) {
    return { indexable: false, reason: 'technical_too_thin' };
  }
  if (term.example.trim().length < GLOSSARY_MIN_EXAMPLE_CHARS) {
    return { indexable: false, reason: 'example_too_thin' };
  }
  if (term.description.trim().length < GLOSSARY_MIN_DESCRIPTION_CHARS) {
    return { indexable: false, reason: 'description_too_thin' };
  }
  if (!term.title.toLowerCase().includes(term.term.toLowerCase().split(' ')[0]!)) {
    return { indexable: false, reason: 'title_missing_term' };
  }
  if (term.nextActions.length < 1) {
    return { indexable: false, reason: 'missing_next_actions' };
  }
  for (const rel of term.relatedTermSlugs) {
    if (!isConstructionGlossarySlug(rel)) {
      return { indexable: false, reason: `broken_related_term:${rel}` };
    }
  }
  return { indexable: true, reason: null };
}

export function listIndexableConstructionGlossaryTerms(): ConstructionGlossaryTermDef[] {
  return CONSTRUCTION_GLOSSARY_TERMS.filter(
    (t) => canIndexConstructionGlossaryTerm(t.slug).indexable,
  ).sort((a, b) => a.term.localeCompare(b.term));
}

export function buildConstructionGlossaryTermLanding(
  slug: string,
): ConstructionGlossaryTermLanding | null {
  const gate = canIndexConstructionGlossaryTerm(slug);
  if (!gate.indexable) return null;
  const term = getConstructionGlossaryTerm(slug)!;

  const relatedTerms = term.relatedTermSlugs
    .map((s) => getConstructionGlossaryTerm(s))
    .filter((t): t is ConstructionGlossaryTermDef => t != null)
    .filter((t) => canIndexConstructionGlossaryTerm(t.slug).indexable)
    .map((t) => ({
      slug: t.slug,
      term: t.term,
      href: `/construction/glossary/${t.slug}`,
      simpleDefinition: t.simpleDefinition,
    }));

  return {
    ...term,
    canonicalPath: `/construction/glossary/${term.slug}`,
    relatedTerms,
    categoryLabel: GLOSSARY_CATEGORY_LABELS[term.category],
    indexable: true,
    version: CONSTRUCTION_GLOSSARY_VERSION,
    methodology: CONSTRUCTION_GLOSSARY_METHODOLOGY,
    qualification: CONSTRUCTION_GLOSSARY_QUALIFICATION,
  };
}

export function listConstructionGlossaryByCategory(): Array<{
  category: GlossaryTermCategory;
  label: string;
  terms: ConstructionGlossaryTermDef[];
}> {
  const order: GlossaryTermCategory[] = [
    'measurement',
    'structure',
    'materials',
    'documents',
    'planning',
  ];
  return order
    .map((category) => ({
      category,
      label: GLOSSARY_CATEGORY_LABELS[category],
      terms: listIndexableConstructionGlossaryTerms().filter((t) => t.category === category),
    }))
    .filter((g) => g.terms.length > 0);
}
