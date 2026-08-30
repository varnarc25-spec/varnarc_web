/**
 * Construction Guide topic clusters — taxonomy + link resolution.
 *
 * Connects pillars → supporting guides, calculators, comparisons, glossary, prices.
 * Does NOT auto-generate article body copy. Unpublished supporting guides stay in
 * taxonomy for editorial planning but are omitted from auto link blocks until
 * `published: true` or an editorial override supplies a real href.
 */

export const GUIDE_CLUSTER_VERSION = '2026.08.1';

export const GUIDE_CLUSTER_QUALIFICATION =
  'Topic hubs organise Varnarc construction tools and explainers. Full article bodies are editorial CMS guides — never auto-generated from this taxonomy.';

export type GuideClusterLinkKind =
  | 'pillar'
  | 'supporting_guide'
  | 'calculator'
  | 'comparison'
  | 'glossary'
  | 'price'
  | 'material'
  | 'calc_landing'
  | 'hub';

export type GuideClusterLinkRef = {
  /** Stable id within the cluster (for overrides). */
  id: string;
  kind: GuideClusterLinkKind;
  href: string;
  label: string;
  /**
   * When false, auto link blocks skip this item (prevents linking to empty stubs).
   * Editorial overrides may still surface a link if they set published/href.
   */
  published: boolean;
  /** Optional one-line context for cards — not article body. */
  blurb?: string;
};

export type GuideClusterSectionKey =
  | 'calculators'
  | 'comparisons'
  | 'glossary'
  | 'prices'
  | 'materials'
  | 'supportingGuides'
  | 'calcLandings'
  | 'hubs';

/**
 * Editorial override: replace an entire auto-resolved section, or hide it.
 * Pass `null` to hide; omit to keep auto links; pass array to replace.
 */
export type GuideClusterSectionOverride = GuideClusterLinkRef[] | null | undefined;

export type GuideClusterEditorialOverrides = Partial<
  Record<GuideClusterSectionKey, GuideClusterSectionOverride>
> & {
  /** Optional replacement intro — still editorial, never machine-filled. */
  introHtmlOrText?: string;
  /** Hide the whole automated block set. */
  hideAutoLinks?: boolean;
};

export type ConstructionGuideClusterDef = {
  slug: string;
  title: string;
  /** Unique SEO title */
  seoTitle: string;
  seoDescription: string;
  /** Hand-written pillar intro (not a full article; min length gated). */
  pillarIntro: string;
  taxonomy: {
    primaryMaterialSlugs?: string[];
    glossarySlugs?: string[];
    compareSlugs?: string[];
    priceMaterialKeys?: string[];
    intentCalcTopics?: Array<'cement-required' | 'steel-required' | 'construction-cost'>;
  };
  resources: GuideClusterLinkRef[];
  /** Optional per-cluster editorial overrides baked into catalog (CMS can extend later). */
  overrides?: GuideClusterEditorialOverrides;
};

export type GuideClusterResolvedSection = {
  key: GuideClusterSectionKey;
  title: string;
  source: 'auto' | 'override' | 'hidden';
  items: GuideClusterLinkRef[];
};

export type ConstructionGuideClusterLanding = {
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  pillarIntro: string;
  canonicalPath: string;
  sections: GuideClusterResolvedSection[];
  /** Flat published links for JSON-LD ItemList */
  allLinks: GuideClusterLinkRef[];
  relatedClusters: Array<{ slug: string; title: string; href: string }>;
  qualification: string;
  version: string;
  indexable: true;
};

const SECTION_META: Record<
  GuideClusterSectionKey,
  { title: string; kinds: GuideClusterLinkKind[] }
> = {
  calculators: {
    title: 'Calculators & tools',
    kinds: ['calculator'],
  },
  materials: {
    title: 'Material guides',
    kinds: ['material'],
  },
  comparisons: {
    title: 'Comparisons',
    kinds: ['comparison'],
  },
  glossary: {
    title: 'Glossary',
    kinds: ['glossary'],
  },
  prices: {
    title: 'Local prices',
    kinds: ['price'],
  },
  supportingGuides: {
    title: 'Supporting guides',
    kinds: ['supporting_guide', 'pillar'],
  },
  calcLandings: {
    title: 'Size & quantity landings',
    kinds: ['calc_landing'],
  },
  hubs: {
    title: 'Related hubs',
    kinds: ['hub'],
  },
};

function link(
  partial: Omit<GuideClusterLinkRef, 'published'> & { published?: boolean },
): GuideClusterLinkRef {
  return { published: partial.published ?? true, ...partial };
}

/**
 * Curated topic clusters. Resource blurbs are short labels only —
 * never full article text.
 */
export const CONSTRUCTION_GUIDE_CLUSTERS: ConstructionGuideClusterDef[] = [
  {
    slug: 'construction-cost',
    title: 'Construction cost',
    seoTitle: 'Construction Cost Guides & Tools | Varnarc',
    seoDescription:
      'Construction cost pillar: calculators, city cost pages, quantity landings, glossary and planning links — organised for homeowners.',
    pillarIntro:
      'Construction cost planning ties together ₹/sq ft estimates, material quantities and local price checks. Use this hub to move from a rough budget to the right calculator or city page — without treating any single number as a quotation.',
    taxonomy: {
      glossarySlugs: ['boq', 'built-up-area', 'carpet-area', 'fsi'],
      intentCalcTopics: ['construction-cost'],
      priceMaterialKeys: ['cement', 'steel'],
    },
    resources: [
      link({
        id: 'cost-calc',
        kind: 'calculator',
        href: '/construction/cost-calculator',
        label: 'Construction cost calculator',
        blurb: 'Area → indicative total with quality scenarios',
      }),
      link({
        id: 'city-cost-hub',
        kind: 'hub',
        href: '/construction/construction-cost',
        label: 'City construction cost pages',
      }),
      link({
        id: 'affordability',
        kind: 'calculator',
        href: '/construction/affordability-calculator',
        label: 'Affordability calculator',
      }),
      link({
        id: 'scenario-compare',
        kind: 'calculator',
        href: '/construction/scenario-compare',
        label: 'Scenario compare',
      }),
      link({
        id: 'cost-opt',
        kind: 'calculator',
        href: '/construction/cost-optimization',
        label: 'Cost optimization',
      }),
      link({
        id: 'vcci',
        kind: 'hub',
        href: '/construction/cost-index',
        label: 'Varnarc cost index (VCCI)',
      }),
      link({
        id: 'landing-1500',
        kind: 'calc_landing',
        href: '/construction/calc/construction-cost/1500-sq-ft',
        label: 'Cost for 1500 sq ft house',
      }),
      link({
        id: 'landing-1200',
        kind: 'calc_landing',
        href: '/construction/calc/construction-cost/1200-sq-ft',
        label: 'Cost for 1200 sq ft house',
      }),
      link({
        id: 'gl-boq',
        kind: 'glossary',
        href: '/construction/glossary/boq',
        label: 'BOQ',
      }),
      link({
        id: 'gl-bua',
        kind: 'glossary',
        href: '/construction/glossary/built-up-area',
        label: 'Built-up area',
      }),
      link({
        id: 'gl-carpet',
        kind: 'glossary',
        href: '/construction/glossary/carpet-area',
        label: 'Carpet area',
      }),
      link({
        id: 'prices-hub',
        kind: 'price',
        href: '/construction/prices',
        label: 'Material prices hub',
      }),
      link({
        id: 'guide-budget-planned',
        kind: 'supporting_guide',
        href: '/construction/guides/house-construction-budget',
        label: 'House construction budget guide',
        published: false,
        blurb: 'Editorial backlog — not linked until published',
      }),
    ],
  },
  {
    slug: 'cement',
    title: 'Cement',
    seoTitle: 'Cement Guides — Calculator, Prices, OPC vs PPC | Varnarc',
    seoDescription:
      'Cement topic hub: calculator, prices, material guide, OPC vs PPC comparison, quantity landings and glossary — curated links, not auto articles.',
    pillarIntro:
      'Cement sits at the centre of concrete, masonry and plaster decisions. Start with the calculator for bags, check local reference prices, compare OPC vs PPC, then dig into glossary terms when a quote uses unfamiliar language.',
    taxonomy: {
      primaryMaterialSlugs: ['cement'],
      glossarySlugs: ['rcc', 'pcc', 'mortar'],
      compareSlugs: ['opc-vs-ppc'],
      priceMaterialKeys: ['cement'],
      intentCalcTopics: ['cement-required'],
    },
    resources: [
      link({
        id: 'cement-calc',
        kind: 'calculator',
        href: '/construction/cement-calculator',
        label: 'Cement calculator',
        blurb: 'Bags for concrete, masonry, plaster and screed',
      }),
      link({
        id: 'concrete-calc',
        kind: 'calculator',
        href: '/construction/concrete-calculator',
        label: 'Concrete calculator',
      }),
      link({
        id: 'plaster-calc',
        kind: 'calculator',
        href: '/construction/plaster-calculator',
        label: 'Plaster calculator',
        blurb: 'Cement for plaster take-offs',
      }),
      link({
        id: 'mat-cement',
        kind: 'material',
        href: '/construction/materials/cement',
        label: 'Cement types & overview',
      }),
      link({
        id: 'cmp-opc-ppc',
        kind: 'comparison',
        href: '/construction/compare/opc-vs-ppc',
        label: 'OPC vs PPC',
      }),
      link({
        id: 'price-cement',
        kind: 'price',
        href: '/construction/prices?material=cement',
        label: 'Cement prices',
      }),
      link({
        id: 'price-cement-hyd',
        kind: 'price',
        href: '/construction/prices/cement/hyderabad',
        label: 'Cement prices in Hyderabad',
        blurb: 'Indexed only when local observations qualify',
      }),
      link({
        id: 'landing-1000',
        kind: 'calc_landing',
        href: '/construction/calc/cement-required/1000-sq-ft',
        label: 'Cement for 1000 sq ft house',
      }),
      link({
        id: 'landing-1500',
        kind: 'calc_landing',
        href: '/construction/calc/cement-required/1500-sq-ft',
        label: 'Cement for 1500 sq ft house',
      }),
      link({
        id: 'gl-rcc',
        kind: 'glossary',
        href: '/construction/glossary/rcc',
        label: 'RCC',
      }),
      link({
        id: 'gl-mortar',
        kind: 'glossary',
        href: '/construction/glossary/mortar',
        label: 'Mortar',
      }),
      link({
        id: 'gl-pcc',
        kind: 'glossary',
        href: '/construction/glossary/pcc',
        label: 'PCC',
      }),
      link({
        id: 'cms-buying',
        kind: 'supporting_guide',
        href: '/construction/guides/cement-buying-guide',
        label: 'Cement buying guide',
        blurb: 'CMS guide when published in admin',
      }),
      link({
        id: 'guide-concrete-use',
        kind: 'supporting_guide',
        href: '/construction/guides/cement-for-concrete',
        label: 'Cement for concrete',
        published: false,
      }),
      link({
        id: 'guide-plaster-use',
        kind: 'supporting_guide',
        href: '/construction/guides/cement-for-plaster',
        label: 'Cement for plaster',
        published: false,
      }),
      link({
        id: 'hub-faqs',
        kind: 'hub',
        href: '/construction/faqs',
        label: 'Construction FAQs',
      }),
    ],
  },
  {
    slug: 'steel',
    title: 'Steel',
    seoTitle: 'Steel (TMT) Guides — Calculator, BBS & Prices | Varnarc',
    seoDescription:
      'Steel topic hub: TMT calculator, BBS, material page, glossary and price filters for reinforcement planning.',
    pillarIntro:
      'Structural steel for houses is usually TMT reinforcement. Estimate weight early, organise bars with a BBS mindset, and verify ₹/kg references locally before locking a contractor steel line.',
    taxonomy: {
      primaryMaterialSlugs: ['steel'],
      glossarySlugs: ['tmt', 'bbs', 'reinforcement', 'rcc'],
      priceMaterialKeys: ['steel'],
      intentCalcTopics: ['steel-required'],
    },
    resources: [
      link({
        id: 'steel-calc',
        kind: 'calculator',
        href: '/construction/steel-calculator',
        label: 'Steel calculator',
      }),
      link({
        id: 'bbs',
        kind: 'calculator',
        href: '/construction/bar-bending-schedule',
        label: 'BBS organiser',
      }),
      link({
        id: 'mat-steel',
        kind: 'material',
        href: '/construction/materials/steel',
        label: 'Steel (TMT) overview',
      }),
      link({
        id: 'price-steel',
        kind: 'price',
        href: '/construction/prices?material=steel',
        label: 'Steel prices',
      }),
      link({
        id: 'landing-1000',
        kind: 'calc_landing',
        href: '/construction/calc/steel-required/1000-sq-ft',
        label: 'Steel for 1000 sq ft house',
      }),
      link({
        id: 'gl-tmt',
        kind: 'glossary',
        href: '/construction/glossary/tmt',
        label: 'TMT',
      }),
      link({
        id: 'gl-bbs',
        kind: 'glossary',
        href: '/construction/glossary/bbs',
        label: 'BBS',
      }),
      link({
        id: 'gl-reinf',
        kind: 'glossary',
        href: '/construction/glossary/reinforcement',
        label: 'Reinforcement',
      }),
      link({
        id: 'guide-grades',
        kind: 'supporting_guide',
        href: '/construction/guides/tmt-grades-explained',
        label: 'TMT grades explained',
        published: false,
      }),
    ],
  },
  {
    slug: 'concrete',
    title: 'Concrete',
    seoTitle: 'Concrete Guides — Mix, RCC & Calculators | Varnarc',
    seoDescription:
      'Concrete hub: volume calculators, RCC tools, cement/aggregate links, glossary for PCC/RCC and formwork.',
    pillarIntro:
      'Concrete work spans footings to slabs. Use volume and RCC calculators for quantities, then cement and aggregate tools for mix materials — and read PCC vs RCC when drawings use both.',
    taxonomy: {
      primaryMaterialSlugs: ['concrete', 'cement', 'aggregate'],
      glossarySlugs: ['rcc', 'pcc', 'formwork', 'aggregate'],
      compareSlugs: ['opc-vs-ppc'],
    },
    resources: [
      link({
        id: 'conc-calc',
        kind: 'calculator',
        href: '/construction/concrete-calculator',
        label: 'Concrete calculator',
      }),
      link({
        id: 'rcc-calc',
        kind: 'calculator',
        href: '/construction/rcc-calculator',
        label: 'RCC calculator',
      }),
      link({
        id: 'slab',
        kind: 'calculator',
        href: '/construction/slab-calculator',
        label: 'Slab calculator',
      }),
      link({
        id: 'mat-concrete',
        kind: 'material',
        href: '/construction/materials/concrete',
        label: 'Concrete overview',
      }),
      link({
        id: 'mat-agg',
        kind: 'material',
        href: '/construction/materials/aggregate',
        label: 'Aggregate',
      }),
      link({
        id: 'cmp-opc',
        kind: 'comparison',
        href: '/construction/compare/opc-vs-ppc',
        label: 'OPC vs PPC',
      }),
      link({
        id: 'gl-rcc',
        kind: 'glossary',
        href: '/construction/glossary/rcc',
        label: 'RCC',
      }),
      link({
        id: 'gl-pcc',
        kind: 'glossary',
        href: '/construction/glossary/pcc',
        label: 'PCC',
      }),
      link({
        id: 'gl-form',
        kind: 'glossary',
        href: '/construction/glossary/formwork',
        label: 'Formwork',
      }),
      link({
        id: 'price-cement',
        kind: 'price',
        href: '/construction/prices?material=cement',
        label: 'Cement prices',
      }),
      link({
        id: 'guide-grades',
        kind: 'supporting_guide',
        href: '/construction/guides/concrete-grades-m20-m25',
        label: 'Concrete grades (M20 / M25)',
        published: false,
      }),
    ],
  },
  {
    slug: 'bricks',
    title: 'Bricks',
    seoTitle: 'Bricks & AAC Guides — Calculators & Comparison | Varnarc',
    seoDescription:
      'Masonry hub for clay brick and AAC: calculators, AAC vs brick comparison, material pages and mortar glossary.',
    pillarIntro:
      'Walling choices are usually clay brick or AAC in framed houses. Compare systems, run piece calculators, and check mortar assumptions before locking a masonry BOQ line.',
    taxonomy: {
      primaryMaterialSlugs: ['brick', 'aac-blocks'],
      glossarySlugs: ['aac-block', 'mortar'],
      compareSlugs: ['aac-vs-brick'],
      priceMaterialKeys: ['brick'],
    },
    resources: [
      link({
        id: 'brick-calc',
        kind: 'calculator',
        href: '/construction/brick-calculator',
        label: 'Brick calculator',
      }),
      link({
        id: 'aac-calc',
        kind: 'calculator',
        href: '/construction/aac-block-calculator',
        label: 'AAC block calculator',
      }),
      link({
        id: 'cmp-aac',
        kind: 'comparison',
        href: '/construction/compare/aac-vs-brick',
        label: 'AAC vs brick',
      }),
      link({
        id: 'mat-brick',
        kind: 'material',
        href: '/construction/materials/brick',
        label: 'Clay brick',
      }),
      link({
        id: 'mat-aac',
        kind: 'material',
        href: '/construction/materials/aac-blocks',
        label: 'AAC blocks',
      }),
      link({
        id: 'gl-aac',
        kind: 'glossary',
        href: '/construction/glossary/aac-block',
        label: 'AAC block',
      }),
      link({
        id: 'gl-mortar',
        kind: 'glossary',
        href: '/construction/glossary/mortar',
        label: 'Mortar',
      }),
      link({
        id: 'price-brick',
        kind: 'price',
        href: '/construction/prices?material=brick',
        label: 'Brick / block prices',
      }),
      link({
        id: 'guide-wall',
        kind: 'supporting_guide',
        href: '/construction/guides/external-wall-options',
        label: 'External wall options',
        published: false,
      }),
    ],
  },
  {
    slug: 'sand',
    title: 'Sand',
    seoTitle: 'Sand Guides — M-Sand vs River Sand & Calculator | Varnarc',
    seoDescription:
      'Sand hub: calculator, M-sand vs river sand comparison, material page, prices and plaster links.',
    pillarIntro:
      'Sand quality and type move concrete and plaster outcomes as much as cement brand. Compare M-sand vs river sand, estimate volumes, and confirm local ₹/m³ references.',
    taxonomy: {
      primaryMaterialSlugs: ['sand'],
      glossarySlugs: ['mortar', 'aggregate'],
      compareSlugs: ['m-sand-vs-river-sand'],
      priceMaterialKeys: ['sand'],
    },
    resources: [
      link({
        id: 'sand-calc',
        kind: 'calculator',
        href: '/construction/sand-calculator',
        label: 'Sand calculator',
      }),
      link({
        id: 'cmp-sand',
        kind: 'comparison',
        href: '/construction/compare/m-sand-vs-river-sand',
        label: 'M-sand vs river sand',
      }),
      link({
        id: 'mat-sand',
        kind: 'material',
        href: '/construction/materials/sand',
        label: 'Sand overview',
      }),
      link({
        id: 'price-sand',
        kind: 'price',
        href: '/construction/prices?material=sand',
        label: 'Sand prices',
      }),
      link({
        id: 'plaster',
        kind: 'calculator',
        href: '/construction/plaster-calculator',
        label: 'Plaster calculator',
      }),
      link({
        id: 'gl-mortar',
        kind: 'glossary',
        href: '/construction/glossary/mortar',
        label: 'Mortar',
      }),
      link({
        id: 'guide-bulking',
        kind: 'supporting_guide',
        href: '/construction/guides/sand-bulking-moisture',
        label: 'Sand bulking & moisture',
        published: false,
      }),
    ],
  },
  {
    slug: 'flooring',
    title: 'Flooring',
    seoTitle: 'Flooring Guides — Tiles, Calculators & Comparisons | Varnarc',
    seoDescription:
      'Flooring hub: tile and flooring calculators, tile comparisons, material pages and price filters.',
    pillarIntro:
      'Flooring budgets are driven by tile SKU, wastage and labour — not only ₹/sq ft stickers. Use calculators for area and wastage, then compare tile types before locking finishes.',
    taxonomy: {
      primaryMaterialSlugs: ['tiles', 'flooring'],
      compareSlugs: ['vitrified-vs-ceramic-tiles'],
      priceMaterialKeys: ['tiles'],
    },
    resources: [
      link({
        id: 'tile-calc',
        kind: 'calculator',
        href: '/construction/tile-calculator',
        label: 'Tile calculator',
      }),
      link({
        id: 'floor-calc',
        kind: 'calculator',
        href: '/construction/flooring-calculator',
        label: 'Flooring calculator',
      }),
      link({
        id: 'cmp-tiles',
        kind: 'comparison',
        href: '/construction/compare/vitrified-vs-ceramic-tiles',
        label: 'Vitrified vs ceramic tiles',
      }),
      link({
        id: 'mat-tiles',
        kind: 'material',
        href: '/construction/materials/tiles',
        label: 'Tiles',
      }),
      link({
        id: 'mat-floor',
        kind: 'material',
        href: '/construction/materials/flooring',
        label: 'Flooring options',
      }),
      link({
        id: 'price-tiles',
        kind: 'price',
        href: '/construction/prices?material=tiles',
        label: 'Tile prices',
      }),
      link({
        id: 'guide-finish',
        kind: 'supporting_guide',
        href: '/construction/guides/flooring-finish-checklist',
        label: 'Flooring finish checklist',
        published: false,
      }),
    ],
  },
  {
    slug: 'painting',
    title: 'Painting',
    seoTitle: 'Painting Guides — Paint Calculator & Materials | Varnarc',
    seoDescription:
      'Painting hub: paint calculator, material overview, prices and plaster prep links.',
    pillarIntro:
      'Paint litres follow wall area, coats and coverage — not built-up area alone. Estimate with the paint calculator after plaster, and confirm interior vs exterior products on the material page.',
    taxonomy: {
      primaryMaterialSlugs: ['paint', 'plaster'],
      priceMaterialKeys: ['paint'],
      glossarySlugs: ['mortar'],
    },
    resources: [
      link({
        id: 'paint-calc',
        kind: 'calculator',
        href: '/construction/paint-calculator',
        label: 'Paint calculator',
      }),
      link({
        id: 'plaster-calc',
        kind: 'calculator',
        href: '/construction/plaster-calculator',
        label: 'Plaster calculator',
      }),
      link({
        id: 'mat-paint',
        kind: 'material',
        href: '/construction/materials/paint',
        label: 'Paint overview',
      }),
      link({
        id: 'price-paint',
        kind: 'price',
        href: '/construction/prices?material=paint',
        label: 'Paint prices',
      }),
      link({
        id: 'cmp-plaster',
        kind: 'comparison',
        href: '/construction/compare/gypsum-vs-cement-plaster',
        label: 'Gypsum vs cement plaster',
      }),
      link({
        id: 'guide-coats',
        kind: 'supporting_guide',
        href: '/construction/guides/interior-painting-stages',
        label: 'Interior painting stages',
        published: false,
      }),
    ],
  },
  {
    slug: 'boq',
    title: 'BOQ',
    seoTitle: 'BOQ Guides — Generator, Glossary & Cost Tools | Varnarc',
    seoDescription:
      'BOQ hub: generator tool, glossary definition, cost calculator and quote analyzer links for structured estimates.',
    pillarIntro:
      'A BOQ turns a house into measurable line items. Use the generator for planning structure, the glossary for definitions, and quote tools when comparing contractor numbers against your lines.',
    taxonomy: {
      glossarySlugs: ['boq', 'bbs', 'built-up-area'],
    },
    resources: [
      link({
        id: 'boq-gen',
        kind: 'calculator',
        href: '/construction/boq-generator',
        label: 'BOQ generator',
      }),
      link({
        id: 'cost-calc',
        kind: 'calculator',
        href: '/construction/cost-calculator',
        label: 'Cost calculator',
      }),
      link({
        id: 'quote',
        kind: 'calculator',
        href: '/construction/contractor-quote-analyzer',
        label: 'Contractor quote analyzer',
      }),
      link({
        id: 'gl-boq',
        kind: 'glossary',
        href: '/construction/glossary/boq',
        label: 'BOQ meaning',
      }),
      link({
        id: 'gl-bbs',
        kind: 'glossary',
        href: '/construction/glossary/bbs',
        label: 'BBS',
      }),
      link({
        id: 'budget',
        kind: 'calculator',
        href: '/construction/budget-tracker',
        label: 'Budget tracker',
      }),
      link({
        id: 'guide-howto',
        kind: 'supporting_guide',
        href: '/construction/guides/how-to-read-a-boq',
        label: 'How to read a BOQ',
        published: false,
      }),
    ],
  },
  {
    slug: 'construction-planning',
    title: 'Construction planning',
    seoTitle: 'Construction Planning — Checklists, Timeline & Readiness | Varnarc',
    seoDescription:
      'Planning hub: project readiness, checklists, timeline planner, FSI/FAR glossary and cost tools.',
    pillarIntro:
      'Good planning sequences permissions, design, budget and site readiness before pouring concrete. Use readiness and checklist tools first, then cost and timeline — with FSI/FAR glossary when plot rules come up.',
    taxonomy: {
      glossarySlugs: ['fsi', 'far', 'plinth-area', 'built-up-area'],
    },
    resources: [
      link({
        id: 'readiness',
        kind: 'calculator',
        href: '/construction/project-readiness',
        label: 'Project readiness',
      }),
      link({
        id: 'checklists',
        kind: 'hub',
        href: '/construction/checklists',
        label: 'Construction checklists',
      }),
      link({
        id: 'timeline',
        kind: 'calculator',
        href: '/construction/timeline-planner',
        label: 'Timeline planner',
      }),
      link({
        id: 'planner',
        kind: 'calculator',
        href: '/construction/planner',
        label: 'Project planner',
      }),
      link({
        id: 'gl-fsi',
        kind: 'glossary',
        href: '/construction/glossary/fsi',
        label: 'FSI',
      }),
      link({
        id: 'gl-far',
        kind: 'glossary',
        href: '/construction/glossary/far',
        label: 'FAR',
      }),
      link({
        id: 'pros',
        kind: 'hub',
        href: '/construction/professionals',
        label: 'Find professionals',
      }),
      link({
        id: 'guide-seq',
        kind: 'supporting_guide',
        href: '/construction/guides/construction-sequence-overview',
        label: 'Construction sequence overview',
        published: false,
      }),
    ],
  },
  {
    slug: 'renovation',
    title: 'Renovation',
    seoTitle: 'Renovation Guides — Cost Calculator & Planning | Varnarc',
    seoDescription:
      'Renovation hub: renovation cost calculator, painting/flooring tools, affordability and planning checklists.',
    pillarIntro:
      'Renovation budgets behave differently from new builds — finishes and labour dominate. Start with the renovation cost calculator, then jump to painting, flooring or affordability tools as the scope firms up.',
    taxonomy: {
      primaryMaterialSlugs: ['paint', 'tiles', 'flooring'],
      glossarySlugs: ['carpet-area', 'built-up-area'],
    },
    resources: [
      link({
        id: 'reno-calc',
        kind: 'calculator',
        href: '/construction/renovation-cost-calculator',
        label: 'Renovation cost calculator',
      }),
      link({
        id: 'paint-calc',
        kind: 'calculator',
        href: '/construction/paint-calculator',
        label: 'Paint calculator',
      }),
      link({
        id: 'tile-calc',
        kind: 'calculator',
        href: '/construction/tile-calculator',
        label: 'Tile calculator',
      }),
      link({
        id: 'afford',
        kind: 'calculator',
        href: '/construction/affordability-calculator',
        label: 'Affordability calculator',
      }),
      link({
        id: 'checklists',
        kind: 'hub',
        href: '/construction/checklists',
        label: 'Checklists',
      }),
      link({
        id: 'guide-scope',
        kind: 'supporting_guide',
        href: '/construction/guides/renovation-scope-checklist',
        label: 'Renovation scope checklist',
        published: false,
      }),
    ],
  },
];

export const GUIDE_CLUSTER_MIN_INTRO_CHARS = 120;

export function isGuideClusterSlug(value: string): boolean {
  return CONSTRUCTION_GUIDE_CLUSTERS.some((c) => c.slug === value);
}

export function getGuideCluster(slug: string): ConstructionGuideClusterDef | null {
  return CONSTRUCTION_GUIDE_CLUSTERS.find((c) => c.slug === slug) ?? null;
}

export function listGuideClusters(): ConstructionGuideClusterDef[] {
  return [...CONSTRUCTION_GUIDE_CLUSTERS];
}

export function canIndexGuideCluster(slug: string): {
  indexable: boolean;
  reason: string | null;
} {
  const cluster = getGuideCluster(slug);
  if (!cluster) return { indexable: false, reason: 'unknown_slug' };
  if (cluster.pillarIntro.trim().length < GUIDE_CLUSTER_MIN_INTRO_CHARS) {
    return { indexable: false, reason: 'intro_too_thin' };
  }
  if (cluster.seoDescription.trim().length < 80) {
    return { indexable: false, reason: 'seo_description_too_thin' };
  }
  const publishedCount = cluster.resources.filter((r) => r.published).length;
  if (publishedCount < 4) {
    return { indexable: false, reason: 'insufficient_published_resources' };
  }
  return { indexable: true, reason: null };
}

function autoSectionItems(
  cluster: ConstructionGuideClusterDef,
  key: GuideClusterSectionKey,
): GuideClusterLinkRef[] {
  const kinds = SECTION_META[key].kinds;
  return cluster.resources.filter((r) => r.published && kinds.includes(r.kind));
}

/**
 * Resolve section link lists with editorial overrides.
 * - `undefined` override → auto (published resources only)
 * - `null` override → hide section
 * - array → replace (caller responsible for quality; items may set published)
 */
export function resolveGuideClusterSections(
  cluster: ConstructionGuideClusterDef,
  overrides?: GuideClusterEditorialOverrides,
): GuideClusterResolvedSection[] {
  const merged: GuideClusterEditorialOverrides = {
    ...cluster.overrides,
    ...overrides,
  };

  if (merged.hideAutoLinks) {
    return [];
  }

  const keys = Object.keys(SECTION_META) as GuideClusterSectionKey[];
  const sections: GuideClusterResolvedSection[] = [];

  for (const key of keys) {
    const override = merged[key];
    if (override === null) {
      sections.push({
        key,
        title: SECTION_META[key].title,
        source: 'hidden',
        items: [],
      });
      continue;
    }
    if (Array.isArray(override)) {
      sections.push({
        key,
        title: SECTION_META[key].title,
        source: 'override',
        items: override.filter((i) => i.published !== false),
      });
      continue;
    }
    const items = autoSectionItems(cluster, key);
    if (!items.length) continue;
    sections.push({
      key,
      title: SECTION_META[key].title,
      source: 'auto',
      items,
    });
  }

  return sections.filter((s) => s.source !== 'hidden' && s.items.length > 0);
}

export function buildGuideClusterLanding(
  slug: string,
  overrides?: GuideClusterEditorialOverrides,
): ConstructionGuideClusterLanding | null {
  const gate = canIndexGuideCluster(slug);
  if (!gate.indexable) return null;
  const cluster = getGuideCluster(slug)!;
  const sections = resolveGuideClusterSections(cluster, overrides);
  const intro =
    overrides?.introHtmlOrText?.trim() ||
    cluster.overrides?.introHtmlOrText?.trim() ||
    cluster.pillarIntro;

  const allLinks = sections.flatMap((s) => s.items);
  const relatedClusters = CONSTRUCTION_GUIDE_CLUSTERS.filter((c) => c.slug !== slug)
    .filter((c) => canIndexGuideCluster(c.slug).indexable)
    .slice(0, 8)
    .map((c) => ({
      slug: c.slug,
      title: c.title,
      href: `/construction/topics/${c.slug}`,
    }));

  return {
    slug: cluster.slug,
    title: cluster.title,
    seoTitle: cluster.seoTitle,
    seoDescription: cluster.seoDescription,
    pillarIntro: intro,
    canonicalPath: `/construction/topics/${cluster.slug}`,
    sections,
    allLinks,
    relatedClusters,
    qualification: GUIDE_CLUSTER_QUALIFICATION,
    version: GUIDE_CLUSTER_VERSION,
    indexable: true,
  };
}

/** Map a CMS guide slug → cluster slug for embedding auto link blocks. */
export const CMS_GUIDE_CLUSTER_MAP: Record<string, string> = {
  'cement-buying-guide': 'cement',
};

export function resolveClusterSlugForCmsGuide(guideSlug: string): string | null {
  return CMS_GUIDE_CLUSTER_MAP[guideSlug] ?? null;
}

/**
 * Build props for ConstructionRelatedLinks from a cluster (auto + overrides).
 */
export function buildClusterRelatedLinkProps(
  slug: string,
  overrides?: GuideClusterEditorialOverrides,
): {
  calculators: Array<{ href: string; label: string }>;
  materials: Array<{ href: string; label: string }>;
  comparisons: Array<{ href: string; label: string; category?: string }>;
  cityPages: Array<{ href: string; label: string }>;
  guides: Array<{ href: string; label: string }>;
  glossary: Array<{ href: string; label: string }>;
  calcLandings: Array<{ href: string; label: string }>;
} | null {
  const landing = buildGuideClusterLanding(slug, overrides);
  if (!landing) return null;

  const byKey = (key: GuideClusterSectionKey) =>
    landing.sections
      .find((s) => s.key === key)
      ?.items.map((i) => ({
        href: i.href,
        label: i.label,
      })) ?? [];

  return {
    calculators: byKey('calculators'),
    materials: byKey('materials'),
    comparisons: byKey('comparisons'),
    cityPages: byKey('prices'),
    guides: byKey('supportingGuides'),
    glossary: byKey('glossary'),
    calcLandings: byKey('calcLandings'),
  };
}
