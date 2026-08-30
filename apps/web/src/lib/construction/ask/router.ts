import {
  ASK_CALCULATOR_BY_MATERIAL,
  ASK_STATIC_CATALOG,
  type AskCatalogItem,
} from '@/lib/construction/ask/catalog';
import { resolveCompareHint } from '@/lib/construction/compare-hub/catalog';
import {
  parseAskConstructionQuery,
  shouldAutoRouteAsk,
  type AskParseResult,
} from '@/lib/construction/ask/parser';

export type AskRouteDecision = {
  parse: AskParseResult;
  /** High-confidence destination with prefilled fields */
  href: string | null;
  autoRoute: boolean;
  /** Ranked suggestions when not auto-routing (or as secondary options) */
  results: AskCatalogItem[];
};

function isRenovationQuery(parse: AskParseResult): boolean {
  return /\brenovat|\bremodel|\bkitchen\s+redo|\bbathroom\s+redo|\bhome\s+makeover\b/.test(
    parse.normalized,
  );
}

function isAffordabilityQuery(parse: AskParseResult): boolean {
  return /\bafford|\bfunding\s+gap|\bcan i afford|\bsavings\s+and\s+loan|\bbudget\s+fit\b/.test(
    parse.normalized,
  );
}

function buildEstimateHref(parse: AskParseResult): string {
  if (isAffordabilityQuery(parse)) {
    const sp = new URLSearchParams();
    if (parse.values.area) {
      /* area alone isn't cost — leave project cost blank */
    }
    if (parse.values.location) sp.set('source', parse.values.location);
    const qs = sp.toString();
    return qs
      ? `/construction/affordability-calculator?${qs}`
      : '/construction/affordability-calculator';
  }
  if (isRenovationQuery(parse)) {
    const sp = new URLSearchParams();
    if (parse.values.area) sp.set('renovationArea', String(parse.values.area));
    if (parse.values.location) sp.set('location', parse.values.location);
    const qs = sp.toString();
    return qs
      ? `/construction/renovation-cost-calculator?${qs}`
      : '/construction/renovation-cost-calculator';
  }
  const sp = new URLSearchParams();
  if (parse.values.area) sp.set('builtUpArea', String(parse.values.area));
  if (parse.values.location) sp.set('location', parse.values.location);
  if (parse.values.floorCount) sp.set('floors', String(parse.values.floorCount));
  const qs = sp.toString();
  return qs ? `/construction/cost-calculator?${qs}` : '/construction/cost-calculator';
}

function buildCalculatorHref(parse: AskParseResult): string | null {
  const material = parse.values.material;
  if (!material) return null;
  const base = ASK_CALCULATOR_BY_MATERIAL[material];
  if (!base) return null;
  const sp = new URLSearchParams();
  if (parse.values.area) sp.set('area', String(parse.values.area));
  if (parse.values.length) sp.set('length', String(parse.values.length));
  if (parse.values.width) sp.set('width', String(parse.values.width));
  if (parse.values.height) sp.set('height', String(parse.values.height));
  if (parse.values.unit) sp.set('unit', parse.values.unit);
  if (parse.values.bedrooms) sp.set('rooms', String(parse.values.bedrooms));
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

function buildCompareHref(parse: AskParseResult): string {
  const scenarioCue =
    /\bscenario|\bquality|\bfloor|\bg\+\d|\bsqft|\bsq\s*ft|\bhyderabad|\bbengaluru|\bpremium|\bstandard\b/.test(
      parse.normalized,
    ) || Boolean(parse.values.area || parse.values.floorCount);
  if (scenarioCue && !/\baac|\bbrick|\bcement|\bsteel|\btile|\bpaint\b/.test(parse.normalized)) {
    return '/construction/scenario-compare';
  }

  const labels = (parse.values.materials ?? [])
    .map((m) => (m === 'aac' ? 'aac' : m === 'brick' ? 'brick' : m))
    .slice(0, 2);
  if (labels.length >= 2) {
    const slug = resolveCompareHint(labels.join(','));
    if (slug) return `/construction/compare/${slug}`;
  }

  // Free-text vs pairs in the raw query
  const vsMatch = parse.normalized.match(
    /\b(aac|brick|opc|ppc|m-?sand|river\s*sand|vitrified|ceramic|upvc|aluminium|aluminum|gypsum)\b.*\bvs\b.*\b(aac|brick|opc|ppc|m-?sand|river\s*sand|vitrified|ceramic|upvc|aluminium|aluminum|gypsum|cement\s*plaster)\b/,
  );
  if (vsMatch) {
    const slug = resolveCompareHint(`${vsMatch[1]},${vsMatch[2]}`);
    if (slug) return `/construction/compare/${slug}`;
  }

  return '/construction/compare';
}

function materialGuidePath(material: string | undefined): string | null {
  if (!material) return null;
  const slugByKey: Record<string, string> = {
    cement: 'cement',
    concrete: 'concrete',
    steel: 'steel',
    brick: 'brick',
    aac: 'aac-blocks',
    tile: 'tiles',
    paint: 'paint',
    sand: 'sand',
    aggregate: 'aggregate',
    plaster: 'plaster',
    flooring: 'flooring',
  };
  const slug = slugByKey[material];
  return slug ? `/construction/materials/${slug}` : null;
}

function buildMaterialsHref(parse: AskParseResult): string {
  const guide = materialGuidePath(parse.values.material);
  if (guide) return guide;
  const sp = new URLSearchParams();
  if (parse.values.material) sp.set('search', parse.values.material);
  else if (parse.raw) sp.set('search', parse.raw.slice(0, 40));
  const qs = sp.toString();
  return qs ? `/construction/materials?${qs}` : '/construction/materials';
}

function buildPricesHref(parse: AskParseResult): string {
  const sp = new URLSearchParams();
  const material = parse.values.material;
  if (material) {
    const hubKey =
      material === 'aac' || material === 'brick'
        ? 'brick'
        : material === 'tile'
          ? 'tiles'
          : material;
    if (['cement', 'steel', 'sand', 'aggregate', 'brick', 'tiles', 'paint'].includes(hubKey)) {
      sp.set('material', hubKey);
    }
  }
  if (parse.values.location) {
    const loc = parse.values.location.toLowerCase().replace(/\s+/g, '-');
    const cityAlias: Record<string, string> = {
      hyderabad: 'hyderabad',
      bengaluru: 'bengaluru',
      bangalore: 'bengaluru',
      chennai: 'chennai',
      mumbai: 'mumbai',
      pune: 'pune',
      delhi: 'delhi',
      'delhi-ncr': 'delhi',
      ahmedabad: 'ahmedabad',
      kolkata: 'kolkata',
    };
    const city = cityAlias[loc] ?? cityAlias[loc.replace(/-ncr$/, '')];
    if (city) sp.set('location', city);
  }
  const qs = sp.toString();
  return qs ? `/construction/prices?${qs}` : '/construction/prices';
}

function buildPrimaryHref(parse: AskParseResult): string | null {
  switch (parse.intent) {
    case 'cost':
      return buildEstimateHref(parse);
    case 'calculator':
      return buildCalculatorHref(parse) ?? buildMaterialsHref(parse);
    case 'comparison':
      return buildCompareHref(parse);
    case 'price':
      return buildPricesHref(parse);
    case 'material':
      return buildMaterialsHref(parse);
    case 'location':
      return parse.values.location
        ? `/construction/cost-calculator?location=${encodeURIComponent(parse.values.location)}`
        : '/construction/cost-calculator';
    case 'guide':
      return '/construction/guides';
    default:
      return null;
  }
}

function rankResults(parse: AskParseResult): AskCatalogItem[] {
  const results: AskCatalogItem[] = [];
  const primary = buildPrimaryHref(parse);
  if (primary) {
    results.push({
      id: 'primary',
      label:
        parse.intent === 'cost'
          ? isAffordabilityQuery(parse)
            ? 'Construction affordability calculator'
            : isRenovationQuery(parse)
              ? 'Renovation cost calculator'
              : 'Construction cost calculator'
          : parse.intent === 'calculator' && parse.values.material
            ? `${parse.values.material.charAt(0).toUpperCase()}${parse.values.material.slice(1)} calculator`
            : parse.intent === 'comparison'
              ? primary.includes('scenario-compare')
                ? 'Construction scenario comparison'
                : 'Compare materials'
              : parse.intent === 'price'
                ? 'Construction prices'
                : parse.intent === 'guide'
                  ? 'Construction guides'
                  : 'Best match',
      href: primary,
      kind:
        parse.intent === 'guide'
          ? 'guide'
          : parse.intent === 'comparison'
            ? 'compare'
            : parse.intent === 'price'
              ? 'hub'
              : 'tool',
    });
  }

  // Related catalog hits
  for (const item of ASK_STATIC_CATALOG) {
    if (results.some((r) => r.href === item.href)) continue;
    const hay = [item.label, ...(item.aliases ?? [])].join(' ').toLowerCase();
    const materialHit =
      parse.values.material && hay.includes(parse.values.material.replace('aac', 'aac'));
    const intentHit =
      (parse.intent === 'cost' &&
        (item.id === 'tool-estimate' ||
          item.id === 'tool-renovation' ||
          item.id === 'tool-affordability')) ||
      (parse.intent === 'comparison' && item.kind === 'compare') ||
      (parse.intent === 'guide' && item.kind === 'guide') ||
      (parse.intent === 'price' && (item.id === 'hub-prices' || item.kind === 'material')) ||
      materialHit;
    if (intentHit || (parse.normalized && hay.includes(parse.normalized.split(' ')[0] ?? ''))) {
      results.push(item);
    }
  }

  // Always offer a few safe fallbacks
  const fallbacks = ASK_STATIC_CATALOG.filter((i) =>
    ['tool-estimate', 'hub-materials', 'hub-prices', 'hub-guides', 'tool-compare'].includes(i.id),
  );
  for (const f of fallbacks) {
    if (!results.some((r) => r.href === f.href)) results.push(f);
  }

  return results.slice(0, 8);
}

/**
 * Resolve an Ask query into a route decision.
 * High confidence → autoRoute + href; low confidence → results list only.
 */
export function resolveAskConstructionQuery(input: string): AskRouteDecision {
  const parse = parseAskConstructionQuery(input);
  const href = buildPrimaryHref(parse);
  const autoRoute = shouldAutoRouteAsk(parse) && Boolean(href);
  const results = rankResults(parse);

  // Zero-ish: unknown with no useful tokens
  if (parse.intent === 'unknown' && results.length === 0) {
    return {
      parse,
      href: null,
      autoRoute: false,
      results: ASK_STATIC_CATALOG.filter((i) => i.kind === 'tool' || i.kind === 'hub').slice(0, 6),
    };
  }

  return {
    parse,
    href: autoRoute ? href : null,
    autoRoute,
    results: results.length
      ? results
      : ASK_STATIC_CATALOG.filter((i) => i.kind === 'tool').slice(0, 6),
  };
}

/** Results page path for low-confidence queries (noindex via `q` filter key). */
export function askResultsPath(query: string): string {
  return `/construction/ask?q=${encodeURIComponent(query.trim().slice(0, 120))}`;
}
