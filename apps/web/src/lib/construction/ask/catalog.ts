import { levenshtein } from '@/lib/construction/ask/fuzzy';

/**
 * Static Ask Varnarc Construction catalog — tools, materials, guides, cities.
 * Autocomplete and routing use this only (no arbitrary DB query surface).
 */

export type AskCatalogItem = {
  id: string;
  label: string;
  href: string;
  kind: 'tool' | 'material' | 'guide' | 'city' | 'compare' | 'hub';
  aliases?: string[];
  keywords?: string[];
};

export const ASK_CITIES = [
  'Hyderabad',
  'Bengaluru',
  'Bangalore',
  'Chennai',
  'Mumbai',
  'Pune',
  'Delhi',
  'Noida',
  'Gurgaon',
  'Gurugram',
  'Ahmedabad',
  'Kolkata',
  'Jaipur',
  'Chandigarh',
  'Kochi',
  'Coimbatore',
  'Lucknow',
  'Indore',
] as const;

/** Canonical city label for routing (Bangalore → Bengaluru). */
export const ASK_CITY_CANONICAL: Record<string, string> = {
  bangalore: 'Bengaluru',
  bengaluru: 'Bengaluru',
  hyderabad: 'Hyderabad',
  chennai: 'Chennai',
  mumbai: 'Mumbai',
  pune: 'Pune',
  delhi: 'Delhi',
  ncr: 'Delhi',
  noida: 'Noida',
  gurgaon: 'Gurugram',
  gurugram: 'Gurugram',
  ahmedabad: 'Ahmedabad',
  kolkata: 'Kolkata',
  jaipur: 'Jaipur',
  chandigarh: 'Chandigarh',
  kochi: 'Kochi',
  coimbatore: 'Coimbatore',
  lucknow: 'Lucknow',
  indore: 'Indore',
};

export type AskMaterialKey =
  | 'cement'
  | 'concrete'
  | 'steel'
  | 'brick'
  | 'aac'
  | 'tile'
  | 'paint'
  | 'sand'
  | 'aggregate'
  | 'plaster'
  | 'flooring';

export const ASK_MATERIAL_ALIASES: Record<AskMaterialKey, string[]> = {
  cement: ['cement', 'opc', 'ppc', 'cement bags'],
  concrete: ['concrete', 'pcc', 'ready mix', 'rmc'],
  steel: ['steel', 'tmt', 'rebar', 'reinforcement', 'iron rod'],
  brick: ['brick', 'bricks', 'red brick', 'red bricks', 'clay brick'],
  aac: ['aac', 'aac block', 'aac blocks', 'autoclaved', 'lightweight block'],
  tile: ['tile', 'tiles', 'vitrified', 'ceramic tile'],
  paint: ['paint', 'painting', 'emulsion', 'primer'],
  sand: ['sand', 'm sand', 'river sand'],
  aggregate: ['aggregate', 'jelly', 'metal', 'gravel'],
  plaster: ['plaster', 'plastering', 'stucco'],
  flooring: ['flooring', 'floor', 'marble', 'granite', 'laminate', 'vinyl flooring', 'wood floor'],
};

export const ASK_CALCULATOR_BY_MATERIAL: Partial<Record<AskMaterialKey, string>> = {
  cement: '/construction/cement-calculator',
  concrete: '/construction/concrete-calculator',
  // RCC / structural elements share the dedicated RCC hub
  // (also exposed via slab/beam/column/footing tools in the catalog)
  steel: '/construction/steel-calculator',
  brick: '/construction/brick-calculator',
  aac: '/construction/aac-block-calculator',
  tile: '/construction/tile-calculator',
  paint: '/construction/paint-calculator',
  sand: '/construction/sand-calculator',
  aggregate: '/construction/aggregate-calculator',
  plaster: '/construction/plaster-calculator',
  flooring: '/construction/flooring-calculator',
};

export const ASK_STATIC_CATALOG: AskCatalogItem[] = [
  {
    id: 'tool-estimate',
    label: 'Construction cost calculator',
    href: '/construction/cost-calculator',
    kind: 'tool',
    aliases: ['cost', 'estimate', 'build cost', 'construction cost', 'cost calculator'],
    keywords: ['cost', 'estimate', 'budget', 'bhk', 'calculator'],
  },
  {
    id: 'tool-renovation',
    label: 'Renovation cost calculator',
    href: '/construction/renovation-cost-calculator',
    kind: 'tool',
    aliases: [
      'renovation',
      'renovation cost',
      'remodel',
      'kitchen renovation',
      'bathroom renovation',
      'home renovation',
    ],
    keywords: ['renovation', 'remodel', 'kitchen', 'bathroom', 'painting'],
  },
  {
    id: 'tool-affordability',
    label: 'Construction affordability calculator',
    href: '/construction/affordability-calculator',
    kind: 'tool',
    aliases: [
      'affordability',
      'can i afford',
      'funding gap',
      'construction budget',
      'savings and loan',
    ],
    keywords: ['afford', 'budget', 'savings', 'loan', 'gap', 'surplus'],
  },
  {
    id: 'tool-scenario-compare',
    label: 'Construction scenario comparison',
    href: '/construction/scenario-compare',
    kind: 'tool',
    aliases: [
      'scenario compare',
      'compare scenarios',
      'standard vs premium',
      'compare construction cost',
      'g+1 vs g+2',
    ],
    keywords: ['scenario', 'compare', 'vs', 'quality', 'floors'],
  },
  {
    id: 'tool-cost-simulator',
    label: 'What changes my construction cost?',
    href: '/construction/cost-change-simulator',
    kind: 'tool',
    aliases: [
      'cost simulator',
      'what changes cost',
      'cost sensitivity',
      'steel rate impact',
      'area impact on cost',
    ],
    keywords: ['simulator', 'slider', 'sensitivity', 'steel', 'cement', 'labour'],
  },
  {
    id: 'tool-cost-optimization',
    label: 'Reduce my construction budget',
    href: '/construction/cost-optimization',
    kind: 'tool',
    aliases: [
      'reduce budget',
      'cut construction cost',
      'cost optimization',
      'save on construction',
      'cheaper finishes',
    ],
    keywords: ['optimize', 'reduce', 'savings', 'budget', 'trade-off'],
  },
  {
    id: 'tool-estimate-quick',
    label: 'Quick cost estimator',
    href: '/construction/estimate',
    kind: 'tool',
    aliases: ['quick estimate', 'room estimate'],
    keywords: ['estimate', 'rooms'],
  },
  {
    id: 'tool-cement',
    label: 'Cement calculator',
    href: '/construction/cement-calculator',
    kind: 'tool',
    aliases: [
      'cement',
      'cement calc',
      'cement bags',
      'plaster cement',
      'masonry cement',
      'screed cement',
    ],
    keywords: ['cement', 'bags', 'concrete', 'plaster', 'masonry', 'screed'],
  },
  {
    id: 'tool-concrete',
    label: 'Concrete calculator',
    href: '/construction/concrete-calculator',
    kind: 'tool',
    aliases: ['concrete', 'pcc', 'ready mix', 'rmc', 'slab volume'],
    keywords: ['concrete', 'volume', 'slab', 'column', 'footing', 'wall'],
  },
  {
    id: 'tool-rcc',
    label: 'RCC calculator',
    href: '/construction/rcc-calculator',
    kind: 'tool',
    aliases: ['rcc', 'reinforced concrete', 'rcc volume', 'how much rcc'],
    keywords: ['rcc', 'slab', 'beam', 'column', 'footing', 'steel'],
  },
  {
    id: 'tool-slab',
    label: 'Slab calculator',
    href: '/construction/slab-calculator',
    kind: 'tool',
    aliases: ['slab', 'rcc slab', 'slab concrete'],
    keywords: ['slab', 'rcc', 'concrete'],
  },
  {
    id: 'tool-beam',
    label: 'Beam calculator',
    href: '/construction/beam-calculator',
    kind: 'tool',
    aliases: ['beam', 'rcc beam', 'beam concrete'],
    keywords: ['beam', 'rcc', 'concrete'],
  },
  {
    id: 'tool-column',
    label: 'Column calculator',
    href: '/construction/column-calculator',
    kind: 'tool',
    aliases: ['column', 'rcc column', 'pillar'],
    keywords: ['column', 'rcc', 'concrete'],
  },
  {
    id: 'tool-footing',
    label: 'Footing calculator',
    href: '/construction/footing-calculator',
    kind: 'tool',
    aliases: ['footing', 'foundation footing', 'isolated footing'],
    keywords: ['footing', 'rcc', 'foundation'],
  },
  {
    id: 'tool-steel',
    label: 'Steel weight calculator',
    href: '/construction/steel-calculator',
    kind: 'tool',
    aliases: ['steel', 'tmt', 'rebar', 'steel weight', 'bar weight', 'd2/162'],
    keywords: ['steel', 'tmt', 'rebar', 'weight', 'kg', 'diameter'],
  },
  {
    id: 'tool-bbs',
    label: 'Bar bending schedule',
    href: '/construction/bar-bending-schedule',
    kind: 'tool',
    aliases: [
      'bbs',
      'bar bending',
      'bar bending schedule',
      'bending schedule',
      'rebar schedule',
      'steel schedule',
    ],
    keywords: ['bbs', 'bar', 'bending', 'schedule', 'cutting length', 'rebar'],
  },
  {
    id: 'tool-boq',
    label: 'BOQ Generator',
    href: '/construction/boq-generator',
    kind: 'tool',
    aliases: ['boq', 'bill of quantities', 'quantity schedule', 'boq generator', 'tender boq'],
    keywords: ['boq', 'quantities', 'schedule', 'estimate', 'planning'],
  },
  {
    id: 'tool-timeline',
    label: 'Timeline planner',
    href: '/construction/timeline-planner',
    kind: 'tool',
    aliases: [
      'timeline',
      'construction timeline',
      'project schedule',
      'phase planner',
      'construction schedule',
    ],
    keywords: ['timeline', 'phases', 'schedule', 'duration', 'progress'],
  },
  {
    id: 'tool-budget',
    label: 'Budget tracker',
    href: '/construction/budget-tracker',
    kind: 'tool',
    aliases: [
      'budget',
      'budget tracker',
      'project budget',
      'expenses',
      'spent vs budget',
      'committed cost',
    ],
    keywords: ['budget', 'expense', 'spent', 'committed', 'variance'],
  },
  {
    id: 'tool-documents',
    label: 'Document vault',
    href: '/construction/document-vault',
    kind: 'tool',
    aliases: [
      'documents',
      'document vault',
      'project files',
      'drawings',
      'floor plans',
      'invoices',
    ],
    keywords: ['documents', 'files', 'drawings', 'pdf', 'vault'],
  },
  {
    id: 'tool-brick',
    label: 'Brick calculator',
    href: '/construction/brick-calculator',
    kind: 'tool',
    aliases: ['brick', 'bricks', 'masonry bricks', 'how many bricks'],
    keywords: ['brick', 'wall', 'masonry', 'openings', 'mortar'],
  },
  {
    id: 'tool-aac',
    label: 'AAC block calculator',
    href: '/construction/aac-block-calculator',
    kind: 'tool',
    aliases: ['aac', 'aac block', 'aac blocks', 'autoclaved aerated', 'lightweight block'],
    keywords: ['aac', 'block', 'wall', 'adhesive', 'thin bed'],
  },
  {
    id: 'tool-sand',
    label: 'Sand calculator',
    href: '/construction/sand-calculator',
    kind: 'tool',
    aliases: ['sand', 'm sand', 'river sand', 'sand volume', 'how much sand'],
    keywords: ['sand', 'mortar', 'concrete', 'filling', 'plaster'],
  },
  {
    id: 'tool-aggregate',
    label: 'Aggregate calculator',
    href: '/construction/aggregate-calculator',
    kind: 'tool',
    aliases: ['aggregate', 'jelly', 'metal', 'gravel', 'crushed stone', 'how much aggregate'],
    keywords: ['aggregate', 'jelly', 'concrete', 'fill', 'stone'],
  },
  {
    id: 'tool-plaster',
    label: 'Plaster calculator',
    href: '/construction/plaster-calculator',
    kind: 'tool',
    aliases: [
      'plaster',
      'plastering',
      'stucco',
      'wall plaster',
      'ceiling plaster',
      'how much plaster',
    ],
    keywords: ['plaster', 'mortar', 'cement', 'sand', 'wall', 'ceiling'],
  },
  {
    id: 'tool-tile',
    label: 'Tile calculator',
    href: '/construction/tile-calculator',
    kind: 'tool',
    aliases: ['tile', 'tiles', 'vitrified', 'ceramic tile', 'how many tiles'],
    keywords: ['tile', 'floor', 'wall', 'grout', 'boxes'],
  },
  {
    id: 'tool-flooring',
    label: 'Flooring calculator',
    href: '/construction/flooring-calculator',
    kind: 'tool',
    aliases: [
      'flooring',
      'floor area',
      'marble flooring',
      'granite flooring',
      'laminate',
      'vinyl',
      'how much flooring',
    ],
    keywords: ['flooring', 'marble', 'granite', 'laminate', 'vinyl', 'area'],
  },
  {
    id: 'tool-paint',
    label: 'Paint calculator',
    href: '/construction/paint-calculator',
    kind: 'tool',
    aliases: ['paint', 'painting', 'emulsion', 'primer', 'how much paint', 'paint litres'],
    keywords: ['paint', 'primer', 'putty', 'coats', 'coverage', 'room'],
  },
  {
    id: 'tool-compare',
    label: 'Compare materials',
    href: '/construction/compare',
    kind: 'compare',
    aliases: ['compare', 'vs', 'versus'],
  },
  {
    id: 'compare-aac-brick',
    label: 'AAC vs red brick',
    href: '/construction/compare/aac-vs-brick',
    kind: 'compare',
    aliases: ['aac vs brick', 'aac vs red brick', 'block vs brick'],
  },
  {
    id: 'compare-opc-ppc',
    label: 'OPC vs PPC cement',
    href: '/construction/compare/opc-vs-ppc',
    kind: 'compare',
    aliases: ['opc vs ppc', 'opc or ppc'],
  },
  {
    id: 'compare-sand',
    label: 'M-sand vs river sand',
    href: '/construction/compare/m-sand-vs-river-sand',
    kind: 'compare',
    aliases: ['m-sand vs river sand', 'msand vs river sand'],
  },
  {
    id: 'compare-tiles',
    label: 'Vitrified vs ceramic tiles',
    href: '/construction/compare/vitrified-vs-ceramic-tiles',
    kind: 'compare',
    aliases: ['vitrified vs ceramic', 'ceramic vs vitrified'],
  },
  {
    id: 'compare-windows',
    label: 'uPVC vs aluminium windows',
    href: '/construction/compare/upvc-vs-aluminium-windows',
    kind: 'compare',
    aliases: ['upvc vs aluminium', 'upvc vs aluminum', 'aluminium vs upvc'],
  },
  {
    id: 'compare-plaster',
    label: 'Gypsum vs cement plaster',
    href: '/construction/compare/gypsum-vs-cement-plaster',
    kind: 'compare',
    aliases: ['gypsum vs cement plaster', 'gypsum plaster vs cement'],
  },
  {
    id: 'tool-material-selector',
    label: 'Material selector',
    href: '/construction/material-selector',
    kind: 'tool',
    aliases: [
      'material selector',
      'which material',
      'choose material',
      'select material',
      'material guide wizard',
    ],
    keywords: ['selector', 'choose', 'recommend', 'category'],
  },
  {
    id: 'hub-materials',
    label: 'Browse materials',
    href: '/construction/materials',
    kind: 'material',
    aliases: ['materials', 'material guide'],
  },
  {
    id: 'hub-prices',
    label: 'Construction prices',
    href: '/construction/prices',
    kind: 'hub',
    aliases: ['prices', 'rates', 'material prices', 'cement price', 'steel price'],
  },
  {
    id: 'hub-guides',
    label: 'Construction guides',
    href: '/construction/guides',
    kind: 'guide',
    aliases: ['guide', 'guides', 'how to'],
  },
  {
    id: 'hub-checklists',
    label: 'Construction checklists',
    href: '/construction/checklists',
    kind: 'guide',
    aliases: ['checklist', 'timeline'],
  },
  {
    id: 'hub-suppliers',
    label: 'Suppliers & dealers',
    href: '/construction/suppliers',
    kind: 'hub',
    aliases: ['supplier', 'dealer'],
  },
  {
    id: 'mat-cement',
    label: 'Cement',
    href: '/construction/materials/cement',
    kind: 'material',
    aliases: ['cement', 'opc', 'ppc'],
    keywords: ['cement', 'bags'],
  },
  {
    id: 'mat-concrete',
    label: 'Concrete',
    href: '/construction/materials/concrete',
    kind: 'material',
    aliases: ['concrete', 'rmc', 'ready mix'],
  },
  {
    id: 'mat-steel',
    label: 'Steel (TMT)',
    href: '/construction/materials/steel',
    kind: 'material',
    aliases: ['steel', 'tmt', 'rebar'],
  },
  {
    id: 'mat-sand',
    label: 'Sand',
    href: '/construction/materials/sand',
    kind: 'material',
    aliases: ['sand', 'm sand', 'river sand'],
  },
  {
    id: 'mat-aggregate',
    label: 'Aggregate',
    href: '/construction/materials/aggregate',
    kind: 'material',
    aliases: ['aggregate', 'jelly', 'metal'],
  },
  {
    id: 'mat-aac',
    label: 'AAC blocks',
    href: '/construction/materials/aac-blocks',
    kind: 'material',
    aliases: ['aac', 'aac block', 'aac blocks'],
  },
  {
    id: 'mat-brick',
    label: 'Red bricks',
    href: '/construction/materials/brick',
    kind: 'material',
    aliases: ['red brick', 'bricks', 'clay brick'],
  },
  {
    id: 'mat-plaster',
    label: 'Plaster',
    href: '/construction/materials/plaster',
    kind: 'material',
    aliases: ['plaster', 'plastering'],
  },
  {
    id: 'mat-paint',
    label: 'Paint',
    href: '/construction/materials/paint',
    kind: 'material',
    aliases: ['paint', 'emulsion'],
  },
  {
    id: 'mat-tiles',
    label: 'Tiles',
    href: '/construction/materials/tiles',
    kind: 'material',
    aliases: ['tile', 'tiles', 'vitrified'],
  },
  {
    id: 'mat-flooring',
    label: 'Flooring',
    href: '/construction/materials/flooring',
    kind: 'material',
    aliases: ['flooring', 'marble', 'laminate'],
  },
  {
    id: 'mat-waterproofing',
    label: 'Waterproofing',
    href: '/construction/materials/waterproofing',
    kind: 'material',
    aliases: ['waterproofing', 'terrace waterproofing'],
  },
  {
    id: 'mat-wiring',
    label: 'Electrical wiring',
    href: '/construction/materials/electrical-wiring',
    kind: 'material',
    aliases: ['wiring', 'electrical wire', 'cable'],
  },
  {
    id: 'mat-pvc',
    label: 'PVC pipes',
    href: '/construction/materials/pvc-pipes',
    kind: 'material',
    aliases: ['pvc', 'pvc pipe', 'drain pipe'],
  },
  {
    id: 'mat-cpvc',
    label: 'CPVC pipes',
    href: '/construction/materials/cpvc-pipes',
    kind: 'material',
    aliases: ['cpvc', 'hot water pipe'],
  },
];

export function autocompleteAskCatalog(query: string, limit = 8): AskCatalogItem[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return ASK_STATIC_CATALOG.slice(0, limit);

  const scored = ASK_STATIC_CATALOG.map((item) => {
    const hay = [item.label, ...(item.aliases ?? []), ...(item.keywords ?? [])]
      .join(' ')
      .toLowerCase();
    let score = 0;
    if (hay.includes(q)) score += 10;
    if (item.label.toLowerCase().startsWith(q)) score += 8;
    for (const alias of item.aliases ?? []) {
      if (alias.toLowerCase().startsWith(q)) score += 6;
      if (alias.toLowerCase().includes(q)) score += 3;
    }
    // typo: compare query tokens to aliases
    for (const part of q.split(/\s+/)) {
      for (const alias of item.aliases ?? []) {
        const dist = Math.abs(part.length - alias.length) <= 2 ? levenshtein(part, alias) : 99;
        if (dist <= 2) score += 4 - dist;
      }
    }
    return { item, score };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((r) => r.item);
}
