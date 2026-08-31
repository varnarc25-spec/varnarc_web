/** Static SEO defaults for Construction public pages. */

export const CONSTRUCTION_PAGE_KEYS = [
  'hub',
  'materials',
  'brands',
  'estimate',
  'cost-calculator',
  'construction-cost',
  'renovation-cost-calculator',
  'affordability-calculator',
  'scenario-compare',
  'cost-change-simulator',
  'cost-optimization',
  'cement-calculator',
  'concrete-calculator',
  'brick-calculator',
  'aac-block-calculator',
  'steel-calculator',
  'bar-bending-schedule',
  'boq-generator',
  'timeline-planner',
  'budget-tracker',
  'document-vault',
  'material-selector',
  'sand-calculator',
  'aggregate-calculator',
  'plaster-calculator',
  'paint-calculator',
  'tile-calculator',
  'flooring-calculator',
  'rcc-calculator',
  'slab-calculator',
  'beam-calculator',
  'column-calculator',
  'footing-calculator',
  'planner',
  'compare',
  'guides',
  'checklists',
  'faqs',
  'suppliers',
  'professionals',
  'projects',
  'prices',
  'calc',
  'price-alerts',
  'fair-price-checker',
  'price-position',
  'news-impact',
  'community-prices',
  'contractor-quote-analyzer',
  'project-readiness',
  'cost-index',
  'cost-index-methodology',
  'glossary',
  'topics',
] as const;

export type ConstructionPageKey = (typeof CONSTRUCTION_PAGE_KEYS)[number];

export type ConstructionPageSeoDefaults = {
  path: string;
  label: string;
  title: string;
  description: string;
  h1: string;
  /** Whether the route is generally indexable when unfiltered. */
  indexable: boolean;
};

export const CONSTRUCTION_PAGE_DEFAULTS: Record<ConstructionPageKey, ConstructionPageSeoDefaults> =
  {
    hub: {
      path: '/construction',
      label: 'Construction',
      title: 'Plan Construction with Cost Estimators & Material Calculators | Varnarc',
      description:
        'Estimate construction costs, calculate materials, compare options and plan your project with transparent Varnarc construction tools.',
      h1: 'Plan your construction with confidence',
      indexable: true,
    },
    materials: {
      path: '/construction/materials',
      label: 'Materials',
      title: 'Construction Materials Hub — Guides by Category | Varnarc',
      description:
        'Educational guides for structural, masonry, finishing, interior, exterior, electrical and plumbing materials — with calculators, comparison links and indicative price context.',
      h1: 'Construction materials',
      indexable: true,
    },
    brands: {
      path: '/construction/brands',
      label: 'Brands',
      title: 'Construction Material Brands | Varnarc',
      description: 'Explore cement, steel, paint and other construction material brands.',
      h1: 'Construction brands',
      indexable: true,
    },
    estimate: {
      path: '/construction/estimate',
      label: 'Cost estimator',
      title: 'Construction Cost Estimator | Varnarc',
      description:
        'Estimate project costs from area and quality. Results are indicative — confirm rates with local contractors.',
      h1: 'Construction cost estimator',
      indexable: true,
    },
    'cost-calculator': {
      path: '/construction/cost-calculator',
      label: 'Cost calculator',
      title: 'Construction Cost Calculator — Estimate Build Cost | Varnarc',
      description:
        'Estimate house construction cost by location, area, floors and quality — or reverse from budget to approximate buildable size. Material, labour, phase breakdown. Indicative only — not a quote.',
      h1: 'Construction cost calculator',
      indexable: true,
    },
    'construction-cost': {
      path: '/construction/construction-cost',
      label: 'Construction cost by city',
      title: 'Construction Cost by City — Hyderabad, Bengaluru, Pune & More | Varnarc',
      description:
        'Location-specific construction cost pages with indicative ₹/sq ft, quality scenarios, local rate updates and material overviews. Published only when local data and editorial profiles exist — not thin SEO templates.',
      h1: 'Construction cost by city',
      indexable: true,
    },
    'renovation-cost-calculator': {
      path: '/construction/renovation-cost-calculator',
      label: 'Renovation cost calculator',
      title: 'Renovation Cost Calculator — Kitchen, Bathroom & Home Reno | Varnarc',
      description:
        'Estimate renovation expenses by selecting painting, flooring, kitchen, bathroom and more. See category breakdown and contingency — indicative only, not a quote.',
      h1: 'Renovation cost calculator',
      indexable: true,
    },
    'affordability-calculator': {
      path: '/construction/affordability-calculator',
      label: 'Affordability calculator',
      title: 'Construction Affordability Calculator — Budget vs Funds | Varnarc',
      description:
        'Check if your construction budget fits savings and expected loan. See funding gap or surplus, contingency and cash-flow hints. Educational only — not financial advice.',
      h1: 'Construction affordability calculator',
      indexable: true,
    },
    'scenario-compare': {
      path: '/construction/scenario-compare',
      label: 'Scenario comparison',
      title: 'Construction Scenario Comparison — Compare Build Options | Varnarc',
      description:
        'Compare up to three construction scenarios side by side: quality, city, floors and area. Shared custom configs are noindex. Indicative only.',
      h1: 'Construction scenario comparison',
      indexable: true,
    },
    'cost-change-simulator': {
      path: '/construction/cost-change-simulator',
      label: 'Cost change simulator',
      title: 'What Changes My Construction Cost? Interactive Simulator | Varnarc',
      description:
        'Slide area, quality, floors, steel, cement, labour and contingency to see how indicative project cost moves. Uses the Varnarc calculation engine — not commodity price advice.',
      h1: 'What changes my construction cost?',
      indexable: true,
    },
    'cost-optimization': {
      path: '/construction/cost-optimization',
      label: 'Reduce my budget',
      title: 'Reduce My Construction Budget — Safe Cost Optimization | Varnarc',
      description:
        'Find planning and finish adjustments to cut construction cost without auto-downgrading reinforcement, concrete strength or foundations. Indicative only.',
      h1: 'Reduce my construction budget',
      indexable: true,
    },
    'cement-calculator': {
      path: '/construction/cement-calculator',
      label: 'Cement calculator',
      title: 'Cement Calculator — Concrete, Plaster, Masonry & Screed | Varnarc',
      description:
        'Calculate cement in kg and bags for concrete, masonry, plastering and screed — or reverse: how much work can N bags cover? Mix ratios, wastage and formula. Indicative only.',
      h1: 'Cement calculator',
      indexable: true,
    },
    'concrete-calculator': {
      path: '/construction/concrete-calculator',
      label: 'Concrete calculator',
      title: 'Concrete Calculator — Slab, Footing, Column & Wall Volume | Varnarc',
      description:
        'Calculate wet and wastage-adjusted concrete volume for slabs, footings, columns, walls and circular columns. Optional cement, sand, aggregate and custom ₹/m³ cost. Indicative only.',
      h1: 'Concrete calculator',
      indexable: true,
    },
    'brick-calculator': {
      path: '/construction/brick-calculator',
      label: 'Brick calculator',
      title: 'Brick Calculator — Wall Bricks, Openings & Mortar | Varnarc',
      description:
        'Estimate bricks or blocks for masonry walls with openings, mortar joints, wastage and optional mortar mix. Reverse mode: how much wall can X bricks build? Indicative only.',
      h1: 'Brick calculator',
      indexable: true,
    },
    'aac-block-calculator': {
      path: '/construction/aac-block-calculator',
      label: 'AAC block calculator',
      title: 'AAC Block Calculator — Autoclaved Aerated Concrete Walls | Varnarc',
      description:
        'Estimate AAC blocks for walls with openings, thin-bed joints, wastage and adhesive. Reverse mode estimates coverage from block count. Compare with red bricks. Indicative only.',
      h1: 'AAC block calculator',
      indexable: true,
    },
    'steel-calculator': {
      path: '/construction/steel-calculator',
      label: 'Steel calculator',
      title: 'Steel Weight Calculator — Rebar TMT d²/162 | Varnarc',
      description:
        'Calculate TMT / rebar steel weight with w = d²/162. Multi-row schedule for diameters, lengths and quantities — kg, tonnes and optional cost. Indicative only.',
      h1: 'Steel weight calculator',
      indexable: true,
    },
    'bar-bending-schedule': {
      path: '/construction/bar-bending-schedule',
      label: 'Bar bending schedule',
      title: 'Bar Bending Schedule — Quantity Workspace | Varnarc',
      description:
        'Organize a BBS from user-entered bar marks, members, diameters, shapes, quantities and cutting lengths. Totals by diameter, member and project. Not structural design — does not invent reinforcement from architectural dimensions.',
      h1: 'Bar bending schedule',
      indexable: true,
    },
    'boq-generator': {
      path: '/construction/boq-generator',
      label: 'BOQ Generator',
      title: 'BOQ Generator — Indicative Planning Bill of Quantities | Varnarc',
      description:
        'Create or generate an indicative planning BOQ with editable quantities, units and rates. Review assumptions on every auto line. Save to a construction project. Not a professional tender BOQ.',
      h1: 'BOQ Generator',
      indexable: true,
    },
    'timeline-planner': {
      path: '/construction/timeline-planner',
      label: 'Timeline planner',
      title: 'Construction Timeline Planner — Estimated Phases | Varnarc',
      description:
        'Plan construction phases with editable start/end dates, estimated whole-week durations, status and progress. Generate defaults from project size and floors. Not a contractor programme.',
      h1: 'Construction Timeline Planner',
      indexable: true,
    },
    'budget-tracker': {
      path: '/construction/budget-tracker',
      label: 'Budget tracker',
      title: 'Construction Project Budget Tracker — Budget vs Actual | Varnarc',
      description:
        'Track estimated budget categories, actual expenses, committed costs and remaining budget. Charts for budget vs actual and cumulative spending. Precise decimal money math. Planning tracker only.',
      h1: 'Construction Project Budget Tracker',
      indexable: true,
    },
    'document-vault': {
      path: '/construction/document-vault',
      label: 'Document vault',
      title: 'Construction Project Document Vault — Private Files | Varnarc',
      description:
        'Store floor plans, drawings, BOQ files, quotations, invoices and site photos in a private project vault. Secure authorization and authenticated download — no public file URLs.',
      h1: 'Construction Project Document Vault',
      indexable: true,
    },
    'material-selector': {
      path: '/construction/material-selector',
      label: 'Material selector',
      title: 'Material Selector — Educational Guidance by Task | Varnarc',
      description:
        'Choose foundation, RCC, masonry, plaster, flooring, painting, windows or roofing. Answer context questions and get material categories, specs to verify, comparisons and calculators — not engineering approval or brands.',
      h1: 'Material selector',
      indexable: true,
    },
    'sand-calculator': {
      path: '/construction/sand-calculator',
      label: 'Sand calculator',
      title: 'Sand Calculator — Concrete, Mortar, Plaster & Filling | Varnarc',
      description:
        'Estimate sand volume in m³ and ft³ for concrete, masonry, plaster and filling. Editable density for tonnes, wastage and optional cost. Indicative only.',
      h1: 'Sand calculator',
      indexable: true,
    },
    'aggregate-calculator': {
      path: '/construction/aggregate-calculator',
      label: 'Aggregate calculator',
      title: 'Aggregate Calculator — Concrete Jelly, Fill & Area × Depth | Varnarc',
      description:
        'Estimate crushed stone / jelly for concrete mixes, generic fill and area × depth. See m³, ft³, kg, tonnes with editable density and optional cost. Indicative only.',
      h1: 'Aggregate calculator',
      indexable: true,
    },
    'plaster-calculator': {
      path: '/construction/plaster-calculator',
      label: 'Plaster calculator',
      title: 'Plaster Calculator — Wall & Ceiling Mortar, Cement Bags & Sand | Varnarc',
      description:
        'Estimate plaster wet/dry mortar volume, cement bags and sand for walls and ceilings. Editable thickness and mix; transparent interior/exterior presets. Indicative only.',
      h1: 'Plaster calculator',
      indexable: true,
    },
    'paint-calculator': {
      path: '/construction/paint-calculator',
      label: 'Paint calculator',
      title: 'Paint Calculator — Rooms, Coats, Primer & Tin Sizes | Varnarc',
      description:
        'Estimate paint litres from room dimensions or wall area. Doors, windows, ceiling, coats, overridable coverage, primer, putty, package sizes and reverse area-from-litres. Indicative only.',
      h1: 'Paint calculator',
      indexable: true,
    },
    'tile-calculator': {
      path: '/construction/tile-calculator',
      label: 'Tile calculator',
      title: 'Tile Calculator — Floor & Wall Tiles, Grout, Boxes & Grid | Varnarc',
      description:
        'Estimate floor or wall tiles from room and tile size. Optional grout, wastage, boxes, cost, visual grid layout and reverse area-from-tiles. Indicative only.',
      h1: 'Tile calculator',
      indexable: true,
    },
    'flooring-calculator': {
      path: '/construction/flooring-calculator',
      label: 'Flooring calculator',
      title: 'Flooring Calculator — Area, Wastage & Cost by Type | Varnarc',
      description:
        'Estimate net and purchase floor area for tiles, marble, granite, wood/laminate, vinyl or custom. Multi-room rows, units and rates — no product endorsements. Indicative only.',
      h1: 'Flooring calculator',
      indexable: true,
    },
    'rcc-calculator': {
      path: '/construction/rcc-calculator',
      label: 'RCC calculator',
      title: 'RCC Calculator — Slab, Beam, Column & Footing Volume | Varnarc',
      description:
        'Preliminary RCC concrete volume with optional cement/sand/aggregate. Indicative steel uses labelled thumb-rule ratios only — not a substitute for structural design. Indicative only.',
      h1: 'RCC calculator',
      indexable: true,
    },
    'slab-calculator': {
      path: '/construction/slab-calculator',
      label: 'Slab calculator',
      title: 'Slab Calculator — RCC Slab Concrete Volume | Varnarc',
      description:
        'Calculate slab area and RCC concrete volume from length, width, thickness and number of slabs. Optional mix materials and cost. Preliminary steel (if shown) is not structural design. Indicative only.',
      h1: 'Slab calculator',
      indexable: true,
    },
    'beam-calculator': {
      path: '/construction/beam-calculator',
      label: 'Beam calculator',
      title: 'Beam Volume Calculator — Width, Depth, Length & Quantity | Varnarc',
      description:
        'Calculate RCC beam concrete volume from width, depth, length and quantity. Optional mix materials and cost via shared utilities. Does not generate structural reinforcement design. Indicative only.',
      h1: 'Beam volume calculator',
      indexable: true,
    },
    'column-calculator': {
      path: '/construction/column-calculator',
      label: 'Column calculator',
      title: 'Column Concrete Calculator — Rectangular & Circular | Varnarc',
      description:
        'Calculate RCC column concrete volume for rectangular and circular columns from dimensions, height, quantity and wastage. Optional mix materials and cost. Not structural design or load-capacity. Indicative only.',
      h1: 'Column concrete calculator',
      indexable: true,
    },
    'footing-calculator': {
      path: '/construction/footing-calculator',
      label: 'Footing calculator',
      title: 'Footing Concrete Calculator — Rectangular, Square & PCC | Varnarc',
      description:
        'Calculate RCC footing concrete for rectangular and square footings. Optional lean PCC bed, materials and cost. Does not size footings from building loads. Indicative only.',
      h1: 'Footing concrete calculator',
      indexable: true,
    },
    planner: {
      path: '/construction/planner',
      label: 'Project planner',
      title: 'Construction Project Planner | Varnarc',
      description: 'Plan budget phases and timelines for home construction or renovation projects.',
      h1: 'Construction project planner',
      indexable: true,
    },
    compare: {
      path: '/construction/compare',
      label: 'Compare',
      title: 'Compare Construction Materials | Varnarc',
      description:
        'Editorial comparisons for meaningful pairs — AAC vs brick, OPC vs PPC, M-sand vs river sand, tiles, windows and plaster — with trade-offs and project cost planners. No simplistic winners.',
      h1: 'Compare materials',
      indexable: true,
    },
    guides: {
      path: '/construction/guides',
      label: 'Guides',
      title: 'Construction Guides | Varnarc',
      description: 'Practical construction and renovation guides for homeowners and professionals.',
      h1: 'Construction guides',
      indexable: true,
    },
    checklists: {
      path: '/construction/checklists',
      label: 'Checklists',
      title: 'Construction Checklists | Varnarc',
      description:
        'Phase-wise construction checklists from before construction through house handover. Mark complete, add notes, print and save to a project. Planning aids — not technical compliance certificates.',
      h1: 'Construction checklists',
      indexable: true,
    },
    faqs: {
      path: '/construction/faqs',
      label: 'FAQs',
      title: 'Construction FAQs | Varnarc',
      description: 'Answers to common construction cost, materials and planning questions.',
      h1: 'Construction FAQs',
      indexable: true,
    },
    suppliers: {
      path: '/construction/suppliers',
      label: 'Suppliers',
      title: 'Construction Suppliers & Dealers | Varnarc',
      description:
        'Browse construction suppliers by city, category and brands. Sorted by name or last updated — not ranked as best. Sponsored placements are labelled. Verified badges only from Varnarc’s verification program.',
      h1: 'Construction suppliers',
      indexable: true,
    },
    professionals: {
      path: '/construction/professionals',
      label: 'Professionals',
      title: 'Construction Professionals Directory | Varnarc',
      description:
        'Find contractors, architects, civil engineers and interior designers. Filters for location, type, speciality and project type. Directory listings, verified information and sponsored placements are labelled separately. Not a professional certification.',
      h1: 'Construction professionals',
      indexable: true,
    },
    projects: {
      path: '/construction/projects',
      label: 'My projects',
      title: 'My Construction Projects | Varnarc',
      description: 'Saved construction projects and estimates.',
      h1: 'My projects',
      indexable: false,
    },
    prices: {
      path: '/construction/prices',
      label: 'Prices',
      title: 'Construction Material Prices | Varnarc',
      description:
        'City and material reference prices with freshness labels. Stale observations are never shown as current — verify locally before budgeting.',
      h1: 'Construction prices',
      indexable: true,
    },
    calc: {
      path: '/construction/calc',
      label: 'Calculations',
      title: 'House Construction Calculations — Cement, Steel & Cost | Varnarc',
      description:
        'Curated high-intent calculation pages for cement/steel required and construction cost by house size. Validated logic only — no combinatorial keyword spam.',
      h1: 'House construction calculations',
      indexable: true,
    },
    'price-alerts': {
      path: '/construction/price-alerts',
      label: 'Price alerts',
      title: 'Material Price Alerts | Varnarc',
      description:
        'Authenticated material price alerts for below/above and percentage moves. Triggers only on fresh observations via Varnarc notifications.',
      h1: 'Material price alerts',
      indexable: false,
    },
    'fair-price-checker': {
      path: '/construction/fair-price-checker',
      label: 'Fair Price Checker',
      title: 'Construction Fair Price Checker | Varnarc',
      description:
        'Compare a material quote with Varnarc’s recent observed range. See difference and % difference — never labelled unfair or fraudulent. Insufficient data is stated plainly.',
      h1: 'Fair Price Checker',
      indexable: true,
    },
    'price-position': {
      path: '/construction/price-position',
      label: 'Price position',
      title: 'Material Price Position — Relative to Recent History | Varnarc',
      description:
        'See current price, recent range, percentile and trend vs the last 90 days. Low / Moderate / High relative language only — no buy advice or future price predictions. Window and freshness always shown.',
      h1: 'Material Price Position',
      indexable: true,
    },
    'news-impact': {
      path: '/construction/news-impact',
      label: 'News impact',
      title: 'Construction News Impact — Scenario Project Sensitivity | Varnarc',
      description:
        'Tagged construction news with affected materials. Separate reported news, scenario ₹/unit assumptions, and arithmetic project impact. No guaranteed price moves; no impact without quantities.',
      h1: 'Construction News Impact',
      indexable: true,
    },
    'community-prices': {
      path: '/construction/community-prices',
      label: 'Community prices',
      title: 'Community Material Price Reporting | Varnarc',
      description:
        'Moderated community material price reports with trust scoring, duplicate and outlier checks. Unverified submissions never enter primary market prices. Invoices stay private.',
      h1: 'Community material price reporting',
      indexable: true,
    },
    'contractor-quote-analyzer': {
      path: '/construction/contractor-quote-analyzer',
      label: 'Quote analyzer',
      title: 'Contractor Quote Analyzer | Varnarc',
      description:
        'Compare up to 3 contractor quotes by category. Manual entry or CSV upload. Flags missing items explicitly. Never labels contractors good or bad — no invented market benchmarks.',
      h1: 'Contractor Quote Analyzer',
      indexable: true,
    },
    'project-readiness': {
      path: '/construction/project-readiness',
      label: 'Project readiness',
      title: 'Construction Project Readiness Checker | Varnarc',
      description:
        'Score planning readiness for budget, drawings, BOQ, quotes, timeline and more. Categories: Ready, Needs attention, High-priority gaps. Explains scoring. Does not assess engineering adequacy or structural safety.',
      h1: 'Construction Project Readiness Checker',
      indexable: true,
    },
    'cost-index': {
      path: '/construction/cost-index',
      label: 'Cost index',
      title: 'VCCI — Varnarc Construction Cost Index | Varnarc',
      description:
        'Varnarc Construction Cost Index framework. Methodology first — numeric values publish only when data quality is sufficient.',
      h1: 'Varnarc Construction Cost Index',
      indexable: true,
    },
    'cost-index-methodology': {
      path: '/construction/cost-index/methodology',
      label: 'VCCI methodology',
      title: 'VCCI Methodology — Baseline, Weights & Limitations | Varnarc',
      description:
        'Technical methodology for the Varnarc Construction Cost Index: baseline, component weights, data sources, update frequency and limitations.',
      h1: 'VCCI methodology',
      indexable: true,
    },
    glossary: {
      path: '/construction/glossary',
      label: 'Glossary',
      title: 'Construction Glossary — BOQ, RCC, Carpet Area & More | Varnarc',
      description:
        'Construction terms explained with definitions, technical notes, examples, units and calculator links — not thin dictionary stubs.',
      h1: 'Construction glossary',
      indexable: true,
    },
    topics: {
      path: '/construction/topics',
      label: 'Topics',
      title: 'Construction Topic Hubs | Varnarc',
      description:
        'Structured topic clusters connecting calculators, comparisons, glossary and prices. Pillars organise links — they do not auto-write articles.',
      h1: 'Construction topic hubs',
      indexable: true,
    },
  };
