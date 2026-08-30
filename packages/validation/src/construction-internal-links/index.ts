/**
 * Controlled Construction internal-link recommendations.
 *
 * - Central entity graph (typed edges)
 * - Per-section caps (avoid keyword stuffing)
 * - Editorial overrides / exclusions
 * - Recursion guards via visited + maxDepth
 */

import { z } from 'zod';

export const CONSTRUCTION_INTERNAL_LINK_VERSION = '2026.08.1';

export const CONSTRUCTION_ENTITY_KINDS = [
  'calculator',
  'material',
  'price',
  'comparison',
  'guide',
  'glossary',
  'location',
  'project_tool',
  'hub',
] as const;

export type ConstructionEntityKind = (typeof CONSTRUCTION_ENTITY_KINDS)[number];

export const CONSTRUCTION_RELATION_KINDS = [
  'related_materials',
  'related_calculators',
  'related_prices',
  'related_comparisons',
  'related_guides',
  'related_locations',
  'related_cost',
  'related_glossary',
] as const;

export type ConstructionRelationKind = (typeof CONSTRUCTION_RELATION_KINDS)[number];

/** Reasonable defaults — keep SEO internal links useful, not stuffed. */
export const CONSTRUCTION_INTERNAL_LINK_CAPS: Record<ConstructionRelationKind, number> = {
  related_materials: 4,
  related_calculators: 6,
  related_prices: 4,
  related_comparisons: 3,
  related_guides: 4,
  related_locations: 4,
  related_cost: 2,
  related_glossary: 3,
};

export const MAX_INTERNAL_LINK_DEPTH = 1;
export const MAX_TOTAL_INTERNAL_LINKS = 16;

export type ConstructionInternalLinkTarget = {
  id: string;
  kind: ConstructionEntityKind;
  href: string;
  label: string;
  description?: string;
  /** Lower = higher priority within a section. */
  priority?: number;
};

export type ConstructionInternalLinkEdge = {
  to: string;
  relation: ConstructionRelationKind;
  priority?: number;
};

export type ConstructionInternalLinkEntity = {
  id: string;
  kind: ConstructionEntityKind;
  href: string;
  label: string;
  description?: string;
  edges: ConstructionInternalLinkEdge[];
};

/**
 * Editorial override for one source entity.
 * - `excludeIds`: never recommend these targets
 * - `hideRelations`: hide entire relation sections
 * - `forceInclude`: replace/augment a relation with an explicit ordered list (by target id)
 * - `hideAll`: suppress all auto recommendations
 */
export type ConstructionInternalLinkOverrides = {
  excludeIds?: string[];
  hideRelations?: ConstructionRelationKind[];
  forceInclude?: Partial<Record<ConstructionRelationKind, string[]>>;
  hideAll?: boolean;
};

export const constructionInternalLinkResolveSchema = z.object({
  entityId: z.string().min(1).max(80),
  maxDepth: z.number().int().min(0).max(2).optional(),
  visited: z.array(z.string()).optional(),
  excludeIds: z.array(z.string()).optional(),
  relations: z.array(z.enum(CONSTRUCTION_RELATION_KINDS)).optional(),
  caps: z.record(z.enum(CONSTRUCTION_RELATION_KINDS), z.number().int().min(0).max(12)).optional(),
});

export type ConstructionInternalLinkSection = {
  relation: ConstructionRelationKind;
  title: string;
  source: 'auto' | 'override' | 'hidden';
  items: ConstructionInternalLinkTarget[];
};

export type ConstructionInternalLinkResult = {
  sourceId: string;
  sourceKind: ConstructionEntityKind | null;
  sections: ConstructionInternalLinkSection[];
  /** Flat list for analytics / JSON-LD (deduped by href). */
  flat: ConstructionInternalLinkTarget[];
  version: string;
};

const RELATION_TITLES: Record<ConstructionRelationKind, string> = {
  related_materials: 'Related materials',
  related_calculators: 'Related calculators',
  related_prices: 'Material prices',
  related_comparisons: 'Useful comparisons',
  related_guides: 'Guides & explainers',
  related_locations: 'City pages',
  related_cost: 'Cost planning',
  related_glossary: 'Glossary',
};

/** Map relation → ConstructionRelatedLinks prop bucket. */
export function relationToRelatedLinksBucket(
  relation: ConstructionRelationKind,
): 'calculators' | 'materials' | 'comparisons' | 'cityPages' | 'guides' | null {
  switch (relation) {
    case 'related_calculators':
    case 'related_cost':
      return 'calculators';
    case 'related_materials':
      return 'materials';
    case 'related_comparisons':
      return 'comparisons';
    case 'related_prices':
    case 'related_locations':
      return 'cityPages';
    case 'related_guides':
    case 'related_glossary':
      return 'guides';
    default:
      return null;
  }
}

function entity(
  id: string,
  kind: ConstructionEntityKind,
  href: string,
  label: string,
  edges: ConstructionInternalLinkEdge[],
  description?: string,
): ConstructionInternalLinkEntity {
  return { id, kind, href, label, description, edges };
}

function e(
  to: string,
  relation: ConstructionRelationKind,
  priority = 50,
): ConstructionInternalLinkEdge {
  return { to, relation, priority };
}

/**
 * Core Construction internal-link graph.
 * Keep edges contextual and sparse — prefer quality over quantity.
 */
export const CONSTRUCTION_INTERNAL_LINK_GRAPH: Record<string, ConstructionInternalLinkEntity> = {
  // —— Calculators ——
  'calc:cement': entity(
    'calc:cement',
    'calculator',
    '/construction/cement-calculator',
    'Cement calculator',
    [
      e('mat:cement', 'related_materials', 10),
      e('calc:concrete', 'related_calculators', 20),
      e('calc:sand', 'related_calculators', 30),
      e('calc:aggregate', 'related_calculators', 40),
      e('calc:cost', 'related_cost', 50),
      e('price:cement', 'related_prices', 25),
      e('guide:cement', 'related_guides', 35),
      e('compare:opc-ppc', 'related_comparisons', 45),
      e('glossary:cement', 'related_glossary', 55),
    ],
    'Bags and mix for concrete, plaster, and masonry',
  ),
  'calc:concrete': entity(
    'calc:concrete',
    'calculator',
    '/construction/concrete-calculator',
    'Concrete calculator',
    [
      e('calc:cement', 'related_calculators', 10),
      e('calc:sand', 'related_calculators', 20),
      e('calc:aggregate', 'related_calculators', 30),
      e('calc:rcc', 'related_calculators', 40),
      e('mat:cement', 'related_materials', 15),
      e('calc:cost', 'related_cost', 50),
      e('guide:concrete', 'related_guides', 35),
    ],
  ),
  'calc:sand': entity(
    'calc:sand',
    'calculator',
    '/construction/sand-calculator',
    'Sand calculator',
    [
      e('calc:cement', 'related_calculators', 10),
      e('calc:concrete', 'related_calculators', 20),
      e('calc:aggregate', 'related_calculators', 30),
      e('mat:sand', 'related_materials', 15),
      e('price:sand', 'related_prices', 25),
    ],
  ),
  'calc:aggregate': entity(
    'calc:aggregate',
    'calculator',
    '/construction/aggregate-calculator',
    'Aggregate calculator',
    [
      e('calc:concrete', 'related_calculators', 10),
      e('calc:cement', 'related_calculators', 20),
      e('mat:aggregate', 'related_materials', 15),
      e('price:aggregate', 'related_prices', 25),
    ],
  ),
  'calc:steel': entity(
    'calc:steel',
    'calculator',
    '/construction/steel-calculator',
    'Steel calculator',
    [
      e('calc:bbs', 'related_calculators', 10),
      e('calc:rcc', 'related_calculators', 20),
      e('calc:slab', 'related_calculators', 30),
      e('mat:steel', 'related_materials', 15),
      e('price:steel', 'related_prices', 25),
      e('guide:steel', 'related_guides', 35),
    ],
  ),
  'calc:bbs': entity(
    'calc:bbs',
    'calculator',
    '/construction/bar-bending-schedule',
    'Bar bending schedule',
    [
      e('calc:steel', 'related_calculators', 10),
      e('calc:beam', 'related_calculators', 20),
      e('calc:column', 'related_calculators', 30),
      e('mat:steel', 'related_materials', 15),
    ],
  ),
  'calc:brick': entity(
    'calc:brick',
    'calculator',
    '/construction/brick-calculator',
    'Brick calculator',
    [
      e('calc:aac', 'related_calculators', 10),
      e('calc:plaster', 'related_calculators', 20),
      e('mat:brick', 'related_materials', 15),
      e('compare:brick-aac', 'related_comparisons', 25),
    ],
  ),
  'calc:aac': entity(
    'calc:aac',
    'calculator',
    '/construction/aac-block-calculator',
    'AAC block calculator',
    [
      e('calc:brick', 'related_calculators', 10),
      e('mat:aac', 'related_materials', 15),
      e('compare:brick-aac', 'related_comparisons', 25),
    ],
  ),
  'calc:paint': entity(
    'calc:paint',
    'calculator',
    '/construction/paint-calculator',
    'Paint calculator',
    [
      e('calc:plaster', 'related_calculators', 20),
      e('mat:paint', 'related_materials', 15),
      e('price:paint', 'related_prices', 25),
    ],
  ),
  'calc:tile': entity(
    'calc:tile',
    'calculator',
    '/construction/tile-calculator',
    'Tile calculator',
    [e('calc:flooring', 'related_calculators', 10), e('mat:tile', 'related_materials', 15)],
  ),
  'calc:flooring': entity(
    'calc:flooring',
    'calculator',
    '/construction/flooring-calculator',
    'Flooring calculator',
    [e('calc:tile', 'related_calculators', 10), e('mat:tile', 'related_materials', 15)],
  ),
  'calc:plaster': entity(
    'calc:plaster',
    'calculator',
    '/construction/plaster-calculator',
    'Plaster calculator',
    [
      e('calc:cement', 'related_calculators', 10),
      e('calc:paint', 'related_calculators', 20),
      e('mat:cement', 'related_materials', 15),
    ],
  ),
  'calc:rcc': entity('calc:rcc', 'calculator', '/construction/rcc-calculator', 'RCC calculator', [
    e('calc:concrete', 'related_calculators', 10),
    e('calc:steel', 'related_calculators', 20),
    e('calc:slab', 'related_calculators', 30),
    e('calc:beam', 'related_calculators', 40),
    e('calc:column', 'related_calculators', 50),
  ]),
  'calc:slab': entity(
    'calc:slab',
    'calculator',
    '/construction/slab-calculator',
    'Slab calculator',
    [
      e('calc:rcc', 'related_calculators', 10),
      e('calc:steel', 'related_calculators', 20),
      e('calc:beam', 'related_calculators', 30),
    ],
  ),
  'calc:beam': entity(
    'calc:beam',
    'calculator',
    '/construction/beam-calculator',
    'Beam calculator',
    [
      e('calc:rcc', 'related_calculators', 10),
      e('calc:bbs', 'related_calculators', 20),
      e('calc:column', 'related_calculators', 30),
    ],
  ),
  'calc:column': entity(
    'calc:column',
    'calculator',
    '/construction/column-calculator',
    'Column calculator',
    [
      e('calc:rcc', 'related_calculators', 10),
      e('calc:bbs', 'related_calculators', 20),
      e('calc:footing', 'related_calculators', 30),
    ],
  ),
  'calc:footing': entity(
    'calc:footing',
    'calculator',
    '/construction/footing-calculator',
    'Footing calculator',
    [e('calc:column', 'related_calculators', 10), e('calc:rcc', 'related_calculators', 20)],
  ),
  'calc:cost': entity(
    'calc:cost',
    'calculator',
    '/construction/cost-calculator',
    'Construction cost calculator',
    [
      e('calc:cement', 'related_calculators', 20),
      e('calc:steel', 'related_calculators', 30),
      e('calc:boq', 'related_calculators', 10),
      e('tool:scenario', 'related_calculators', 40),
      e('loc:hyderabad-cost', 'related_locations', 15),
      e('guide:cost', 'related_guides', 25),
    ],
  ),
  'calc:boq': entity('calc:boq', 'calculator', '/construction/boq-generator', 'BOQ generator', [
    e('calc:cost', 'related_cost', 10),
    e('calc:cement', 'related_calculators', 20),
    e('tool:budget', 'related_calculators', 30),
  ]),
  'calc:renovation': entity(
    'calc:renovation',
    'calculator',
    '/construction/renovation-cost-calculator',
    'Renovation cost calculator',
    [
      e('calc:cost', 'related_cost', 10),
      e('calc:paint', 'related_calculators', 20),
      e('calc:tile', 'related_calculators', 30),
    ],
  ),

  // —— Project tools ——
  'tool:scenario': entity(
    'tool:scenario',
    'project_tool',
    '/construction/scenario-compare',
    'Scenario compare',
    [e('calc:cost', 'related_calculators', 10), e('calc:boq', 'related_calculators', 20)],
  ),
  'tool:budget': entity(
    'tool:budget',
    'project_tool',
    '/construction/budget-tracker',
    'Budget tracker',
    [e('calc:cost', 'related_calculators', 10), e('calc:boq', 'related_calculators', 20)],
  ),
  'tool:timeline': entity(
    'tool:timeline',
    'project_tool',
    '/construction/timeline-planner',
    'Timeline planner',
    [e('calc:cost', 'related_calculators', 10), e('tool:budget', 'related_calculators', 20)],
  ),
  'tool:vault': entity(
    'tool:vault',
    'project_tool',
    '/construction/document-vault',
    'Document vault',
    [e('calc:boq', 'related_calculators', 10), e('tool:budget', 'related_calculators', 20)],
  ),

  // —— Materials ——
  'mat:cement': entity('mat:cement', 'material', '/construction/materials/cement', 'Cement', [
    e('calc:cement', 'related_calculators', 10),
    e('calc:concrete', 'related_calculators', 20),
    e('price:cement', 'related_prices', 15),
    e('compare:opc-ppc', 'related_comparisons', 25),
    e('guide:cement', 'related_guides', 30),
  ]),
  'mat:steel': entity('mat:steel', 'material', '/construction/materials/steel', 'Steel / TMT', [
    e('calc:steel', 'related_calculators', 10),
    e('calc:bbs', 'related_calculators', 20),
    e('price:steel', 'related_prices', 15),
    e('guide:steel', 'related_guides', 30),
  ]),
  'mat:sand': entity('mat:sand', 'material', '/construction/materials/sand', 'Sand', [
    e('calc:sand', 'related_calculators', 10),
    e('price:sand', 'related_prices', 15),
    e('calc:concrete', 'related_calculators', 20),
  ]),
  'mat:aggregate': entity(
    'mat:aggregate',
    'material',
    '/construction/materials/aggregate',
    'Aggregate',
    [
      e('calc:aggregate', 'related_calculators', 10),
      e('price:aggregate', 'related_prices', 15),
      e('calc:concrete', 'related_calculators', 20),
    ],
  ),
  'mat:brick': entity('mat:brick', 'material', '/construction/materials/brick', 'Bricks', [
    e('calc:brick', 'related_calculators', 10),
    e('compare:brick-aac', 'related_comparisons', 20),
    e('calc:plaster', 'related_calculators', 30),
  ]),
  'mat:aac': entity('mat:aac', 'material', '/construction/materials/aac-blocks', 'AAC blocks', [
    e('calc:aac', 'related_calculators', 10),
    e('compare:brick-aac', 'related_comparisons', 20),
  ]),
  'mat:paint': entity('mat:paint', 'material', '/construction/materials/paint', 'Paint', [
    e('calc:paint', 'related_calculators', 10),
    e('price:paint', 'related_prices', 15),
  ]),
  'mat:tile': entity('mat:tile', 'material', '/construction/materials/tiles', 'Tiles', [
    e('calc:tile', 'related_calculators', 10),
    e('calc:flooring', 'related_calculators', 20),
  ]),

  // —— Prices ——
  'price:cement': entity('price:cement', 'price', '/construction/prices/cement', 'Cement prices', [
    e('mat:cement', 'related_materials', 10),
    e('calc:cement', 'related_calculators', 20),
  ]),
  'price:steel': entity('price:steel', 'price', '/construction/prices/steel', 'Steel prices', [
    e('mat:steel', 'related_materials', 10),
    e('calc:steel', 'related_calculators', 20),
  ]),
  'price:sand': entity('price:sand', 'price', '/construction/prices/sand', 'Sand prices', [
    e('mat:sand', 'related_materials', 10),
    e('calc:sand', 'related_calculators', 20),
  ]),
  'price:aggregate': entity(
    'price:aggregate',
    'price',
    '/construction/prices/aggregate',
    'Aggregate prices',
    [e('mat:aggregate', 'related_materials', 10), e('calc:aggregate', 'related_calculators', 20)],
  ),
  'price:paint': entity('price:paint', 'price', '/construction/prices/paint', 'Paint prices', [
    e('mat:paint', 'related_materials', 10),
    e('calc:paint', 'related_calculators', 20),
  ]),

  // —— Locations ——
  'loc:hyderabad-cost': entity(
    'loc:hyderabad-cost',
    'location',
    '/construction/construction-cost/hyderabad',
    'Hyderabad construction cost',
    [
      e('calc:cost', 'related_cost', 10),
      e('price:cement', 'related_prices', 20),
      e('price:steel', 'related_prices', 30),
      e('mat:cement', 'related_materials', 40),
    ],
  ),
  'loc:bengaluru-cost': entity(
    'loc:bengaluru-cost',
    'location',
    '/construction/construction-cost/bengaluru',
    'Bengaluru construction cost',
    [
      e('calc:cost', 'related_cost', 10),
      e('price:cement', 'related_prices', 20),
      e('price:steel', 'related_prices', 30),
    ],
  ),
  'loc:hyderabad-cement-price': entity(
    'loc:hyderabad-cement-price',
    'location',
    '/construction/prices/cement/hyderabad',
    'Cement price in Hyderabad',
    [
      e('price:cement', 'related_prices', 10),
      e('mat:cement', 'related_materials', 20),
      e('calc:cement', 'related_calculators', 30),
      e('calc:cost', 'related_cost', 40),
    ],
  ),

  // —— Comparisons ——
  'compare:opc-ppc': entity(
    'compare:opc-ppc',
    'comparison',
    '/construction/compare/opc-vs-ppc',
    'OPC vs PPC',
    [e('mat:cement', 'related_materials', 10), e('calc:cement', 'related_calculators', 20)],
  ),
  'compare:brick-aac': entity(
    'compare:brick-aac',
    'comparison',
    '/construction/compare/brick-vs-aac',
    'Brick vs AAC',
    [
      e('mat:brick', 'related_materials', 10),
      e('mat:aac', 'related_materials', 20),
      e('calc:brick', 'related_calculators', 30),
      e('calc:aac', 'related_calculators', 40),
    ],
  ),

  // —— Guides (topic hubs / known slugs) ——
  'guide:cement': entity('guide:cement', 'guide', '/construction/topics/cement', 'Cement guides', [
    e('calc:cement', 'related_calculators', 10),
    e('calc:concrete', 'related_calculators', 20),
    e('mat:cement', 'related_materials', 15),
    e('glossary:cement', 'related_glossary', 30),
  ]),
  'guide:steel': entity('guide:steel', 'guide', '/construction/topics/steel', 'Steel guides', [
    e('calc:steel', 'related_calculators', 10),
    e('calc:bbs', 'related_calculators', 20),
    e('mat:steel', 'related_materials', 15),
  ]),
  'guide:concrete': entity(
    'guide:concrete',
    'guide',
    '/construction/topics/concrete',
    'Concrete guides',
    [
      e('calc:concrete', 'related_calculators', 10),
      e('calc:cement', 'related_calculators', 20),
      e('calc:rcc', 'related_calculators', 30),
    ],
  ),
  'guide:cost': entity(
    'guide:cost',
    'guide',
    '/construction/topics/construction-cost',
    'Cost guides',
    [e('calc:cost', 'related_calculators', 10), e('calc:boq', 'related_calculators', 20)],
  ),

  // —— Glossary ——
  'glossary:cement': entity(
    'glossary:cement',
    'glossary',
    '/construction/glossary/cement',
    'Cement (glossary)',
    [
      e('calc:cement', 'related_calculators', 10),
      e('mat:cement', 'related_materials', 20),
      e('guide:cement', 'related_guides', 30),
    ],
  ),
  'glossary:concrete': entity(
    'glossary:concrete',
    'glossary',
    '/construction/glossary/concrete',
    'Concrete (glossary)',
    [e('calc:concrete', 'related_calculators', 10), e('guide:concrete', 'related_guides', 20)],
  ),
  'glossary:tmt': entity(
    'glossary:tmt',
    'glossary',
    '/construction/glossary/tmt-steel',
    'TMT steel (glossary)',
    [e('calc:steel', 'related_calculators', 10), e('mat:steel', 'related_materials', 20)],
  ),
};

/** Optional editorial overrides keyed by source entity id. */
export const CONSTRUCTION_INTERNAL_LINK_OVERRIDES: Record<
  string,
  ConstructionInternalLinkOverrides
> = {
  // Example: hide prices on a calculator if editorial prefers cost tools only.
  // 'calc:cost': { hideRelations: ['related_prices'] },
};

export function getConstructionInternalLinkEntity(
  id: string,
): ConstructionInternalLinkEntity | null {
  return CONSTRUCTION_INTERNAL_LINK_GRAPH[id] ?? null;
}

export function listConstructionInternalLinkEntityIds(): string[] {
  return Object.keys(CONSTRUCTION_INTERNAL_LINK_GRAPH);
}

export type ResolveConstructionInternalLinksInput = {
  entityId: string;
  /** Default 0 = only direct edges (recommended). Nested sections should pass depth. */
  depth?: number;
  maxDepth?: number;
  visited?: Iterable<string>;
  excludeIds?: string[];
  relations?: ConstructionRelationKind[];
  caps?: Partial<Record<ConstructionRelationKind, number>>;
  overrides?: ConstructionInternalLinkOverrides;
};

/**
 * Resolve contextual internal links for a Construction entity.
 * Does not recurse into targets' RelatedSections (depth guard).
 */
export function resolveConstructionInternalLinks(
  input: ResolveConstructionInternalLinksInput,
): ConstructionInternalLinkResult {
  const depth = input.depth ?? 0;
  const maxDepth = Math.min(input.maxDepth ?? MAX_INTERNAL_LINK_DEPTH, MAX_INTERNAL_LINK_DEPTH);
  const source = CONSTRUCTION_INTERNAL_LINK_GRAPH[input.entityId] ?? null;
  const visited = new Set(input.visited ?? []);
  visited.add(input.entityId);

  const overrides: ConstructionInternalLinkOverrides = {
    ...CONSTRUCTION_INTERNAL_LINK_OVERRIDES[input.entityId],
    ...input.overrides,
    excludeIds: [
      ...(CONSTRUCTION_INTERNAL_LINK_OVERRIDES[input.entityId]?.excludeIds ?? []),
      ...(input.overrides?.excludeIds ?? []),
      ...(input.excludeIds ?? []),
    ],
  };

  if (!source || overrides.hideAll || depth > maxDepth) {
    return {
      sourceId: input.entityId,
      sourceKind: source?.kind ?? null,
      sections: [],
      flat: [],
      version: CONSTRUCTION_INTERNAL_LINK_VERSION,
    };
  }

  const exclude = new Set(overrides.excludeIds ?? []);
  exclude.add(input.entityId);

  const allowedRelations =
    input.relations ?? (CONSTRUCTION_RELATION_KINDS as unknown as ConstructionRelationKind[]);

  const sections: ConstructionInternalLinkSection[] = [];
  let total = 0;

  for (const relation of allowedRelations) {
    if (overrides.hideRelations?.includes(relation)) {
      sections.push({
        relation,
        title: RELATION_TITLES[relation],
        source: 'hidden',
        items: [],
      });
      continue;
    }

    const cap = Math.min(
      input.caps?.[relation] ?? CONSTRUCTION_INTERNAL_LINK_CAPS[relation],
      CONSTRUCTION_INTERNAL_LINK_CAPS[relation],
    );
    if (cap <= 0) continue;

    const forced = overrides.forceInclude?.[relation];
    let items: ConstructionInternalLinkTarget[] = [];
    let sectionSource: 'auto' | 'override' = 'auto';

    if (forced) {
      sectionSource = 'override';
      for (const id of forced) {
        if (exclude.has(id) || visited.has(id)) continue;
        const target = CONSTRUCTION_INTERNAL_LINK_GRAPH[id];
        if (!target) continue;
        items.push({
          id: target.id,
          kind: target.kind,
          href: target.href,
          label: target.label,
          description: target.description,
        });
      }
    } else {
      const edges = source.edges
        .filter((edge) => edge.relation === relation)
        .sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50));

      for (const edge of edges) {
        if (exclude.has(edge.to) || visited.has(edge.to)) continue;
        const target = CONSTRUCTION_INTERNAL_LINK_GRAPH[edge.to];
        if (!target) continue;
        // Skip self-href loops
        if (target.href === source.href) continue;
        items.push({
          id: target.id,
          kind: target.kind,
          href: target.href,
          label: target.label,
          description: target.description,
          priority: edge.priority,
        });
      }
    }

    // Dedupe by href, keep order
    const seenHref = new Set<string>();
    items = items.filter((item) => {
      if (seenHref.has(item.href)) return false;
      seenHref.add(item.href);
      return true;
    });

    const remaining = Math.max(0, MAX_TOTAL_INTERNAL_LINKS - total);
    items = items.slice(0, Math.min(cap, remaining));
    total += items.length;

    if (items.length) {
      sections.push({
        relation,
        title: RELATION_TITLES[relation],
        source: sectionSource,
        items,
      });
    }
  }

  const flat: ConstructionInternalLinkTarget[] = [];
  const flatHref = new Set<string>();
  for (const section of sections) {
    for (const item of section.items) {
      if (flatHref.has(item.href)) continue;
      flatHref.add(item.href);
      flat.push(item);
    }
  }

  return {
    sourceId: input.entityId,
    sourceKind: source.kind,
    sections,
    flat,
    version: CONSTRUCTION_INTERNAL_LINK_VERSION,
  };
}

/** Convert resolver output into ConstructionRelatedLinks-friendly buckets. */
export function toConstructionRelatedLinkBuckets(result: ConstructionInternalLinkResult): {
  calculators: Array<{ href: string; label: string; description?: string }>;
  materials: Array<{ href: string; label: string; description?: string }>;
  comparisons: Array<{ href: string; label: string; leftLabel?: string; rightLabel?: string }>;
  cityPages: Array<{ href: string; label: string; description?: string }>;
  guides: Array<{ href: string; label: string; description?: string }>;
} {
  const buckets = {
    calculators: [] as Array<{ href: string; label: string; description?: string }>,
    materials: [] as Array<{ href: string; label: string; description?: string }>,
    comparisons: [] as Array<{
      href: string;
      label: string;
      leftLabel?: string;
      rightLabel?: string;
    }>,
    cityPages: [] as Array<{ href: string; label: string; description?: string }>,
    guides: [] as Array<{ href: string; label: string; description?: string }>,
  };

  for (const section of result.sections) {
    const bucket = relationToRelatedLinksBucket(section.relation);
    if (!bucket) continue;
    for (const item of section.items) {
      if (bucket === 'comparisons') {
        buckets.comparisons.push({
          href: item.href,
          label: item.label,
          leftLabel: item.label.split(' vs ')[0]?.trim(),
          rightLabel: item.label.split(' vs ')[1]?.trim(),
        });
      } else {
        buckets[bucket].push({
          href: item.href,
          label: item.label,
          description: item.description,
        });
      }
    }
  }

  return buckets;
}

/** Path → entity id helpers for page wiring. */
export function constructionEntityIdFromCalculatorSlug(slug: string): string | null {
  const map: Record<string, string> = {
    'cement-calculator': 'calc:cement',
    'concrete-calculator': 'calc:concrete',
    'sand-calculator': 'calc:sand',
    'aggregate-calculator': 'calc:aggregate',
    'steel-calculator': 'calc:steel',
    'bar-bending-schedule': 'calc:bbs',
    'brick-calculator': 'calc:brick',
    'aac-block-calculator': 'calc:aac',
    'paint-calculator': 'calc:paint',
    'tile-calculator': 'calc:tile',
    'flooring-calculator': 'calc:flooring',
    'plaster-calculator': 'calc:plaster',
    'rcc-calculator': 'calc:rcc',
    'slab-calculator': 'calc:slab',
    'beam-calculator': 'calc:beam',
    'column-calculator': 'calc:column',
    'footing-calculator': 'calc:footing',
    'cost-calculator': 'calc:cost',
    'construction-cost': 'calc:cost',
    'boq-generator': 'calc:boq',
    'renovation-cost-calculator': 'calc:renovation',
    'scenario-compare': 'tool:scenario',
    'budget-tracker': 'tool:budget',
    'timeline-planner': 'tool:timeline',
    'document-vault': 'tool:vault',
  };
  return map[slug] ?? null;
}

export function constructionEntityIdFromMaterialSlug(slug: string): string | null {
  const map: Record<string, string> = {
    cement: 'mat:cement',
    steel: 'mat:steel',
    sand: 'mat:sand',
    aggregate: 'mat:aggregate',
    brick: 'mat:brick',
    'aac-blocks': 'mat:aac',
    aac: 'mat:aac',
    paint: 'mat:paint',
    tiles: 'mat:tile',
    tile: 'mat:tile',
  };
  return map[slug] ?? null;
}

export function constructionEntityIdFromGlossarySlug(slug: string): string | null {
  const map: Record<string, string> = {
    cement: 'glossary:cement',
    concrete: 'glossary:concrete',
    'tmt-steel': 'glossary:tmt',
    tmt: 'glossary:tmt',
  };
  return map[slug] ?? null;
}

export function constructionEntityIdFromLocationCity(citySlug: string): string | null {
  const map: Record<string, string> = {
    hyderabad: 'loc:hyderabad-cost',
    bengaluru: 'loc:bengaluru-cost',
  };
  return map[citySlug] ?? null;
}
