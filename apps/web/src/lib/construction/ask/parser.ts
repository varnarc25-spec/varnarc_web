/**
 * Deterministic Ask Varnarc Construction intent parser.
 * Prefer rule/regex/fuzzy token matching over AI for reliability.
 */

import { bestFuzzyMatch, fuzzyEquals } from '@/lib/construction/ask/fuzzy';
import {
  ASK_CALCULATOR_BY_MATERIAL,
  ASK_CITIES,
  ASK_CITY_CANONICAL,
  ASK_MATERIAL_ALIASES,
  type AskMaterialKey,
} from '@/lib/construction/ask/catalog';

export type AskIntentKind =
  'calculator' | 'comparison' | 'material' | 'price' | 'location' | 'guide' | 'cost' | 'unknown';

export type AskExtractedValues = {
  area?: number;
  length?: number;
  width?: number;
  height?: number;
  location?: string;
  material?: AskMaterialKey;
  materials?: AskMaterialKey[];
  unit?: string;
  floorCount?: number;
  bhk?: number;
  bedrooms?: number;
};

export type AskParseResult = {
  raw: string;
  normalized: string;
  intent: AskIntentKind;
  /** 0–1; below threshold → show results instead of auto-routing */
  confidence: number;
  values: AskExtractedValues;
  category: string;
  correctedTokens: string[];
};

const CONFIDENCE_ROUTE_THRESHOLD = 0.72;

export function askRouteThreshold() {
  return CONFIDENCE_ROUTE_THRESHOLD;
}

function normalizeQuery(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[×xX]/g, 'x')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ');
}

function tokenize(normalized: string): string[] {
  return normalized
    .split(/[^a-z0-9.]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function extractArea(normalized: string): number | undefined {
  const sqft =
    normalized.match(/(\d{3,5})\s*(?:sq\.?\s*ft|sqft|sft|square\s*feet?)/i) ||
    normalized.match(/(?:for|of)\s+(\d{3,5})\s*(?:sq|$)/i);
  if (sqft?.[1]) {
    const n = Number(sqft[1]);
    if (n >= 100 && n <= 50000) return n;
  }
  // bare large number near cost/cement context
  const bare = normalized.match(/\b(\d{3,5})\b/);
  if (bare?.[1] && /(cement|cost|build|house|home|area)/.test(normalized)) {
    const n = Number(bare[1]);
    if (n >= 400 && n <= 20000) return n;
  }
  return undefined;
}

function extractDimensions(
  normalized: string,
): Pick<AskExtractedValues, 'length' | 'width' | 'height'> {
  const dim = normalized.match(
    /(\d{1,3}(?:\.\d+)?)\s*[x×]\s*(\d{1,3}(?:\.\d+)?)(?:\s*[x×]\s*(\d{1,3}(?:\.\d+)?))?/,
  );
  if (!dim) return {};
  const length = Number(dim[1]);
  const width = Number(dim[2]);
  const height = dim[3] ? Number(dim[3]) : undefined;
  const out: AskExtractedValues = {};
  if (Number.isFinite(length) && length > 0 && length < 500) out.length = length;
  if (Number.isFinite(width) && width > 0 && width < 500) out.width = width;
  if (height != null && Number.isFinite(height) && height > 0 && height < 100) out.height = height;
  return out;
}

function extractBhk(normalized: string): number | undefined {
  const m = normalized.match(/(\d)\s*bhk/);
  if (!m?.[1]) return undefined;
  const n = Number(m[1]);
  return n >= 1 && n <= 6 ? n : undefined;
}

function extractBedrooms(normalized: string): number | undefined {
  const m = normalized.match(/(\d)\s*(?:bedrooms?|beds?|rooms?)/);
  if (!m?.[1]) return undefined;
  const n = Number(m[1]);
  return n >= 1 && n <= 12 ? n : undefined;
}

function extractFloors(normalized: string): number | undefined {
  const m =
    normalized.match(/(\d)\s*(?:floors?|storeys?|stories)/) ||
    normalized.match(/(?:g\+(\d)|ground\s*\+\s*(\d))/);
  if (!m) return undefined;
  const n = Number(m[1] || m[2]);
  return n >= 1 && n <= 10 ? n : undefined;
}

function extractUnit(normalized: string): string | undefined {
  if (/\bsq\.?\s*ft|sqft|sft\b/.test(normalized)) return 'sqft';
  if (/\bsq\.?\s*m|sqm|m2\b/.test(normalized)) return 'sqm';
  if (/\bft|feet|foot\b/.test(normalized)) return 'ft';
  if (/\bmeter|metre|m\b/.test(normalized) && !/\bsqm\b/.test(normalized)) return 'm';
  return undefined;
}

function extractLocation(normalized: string, tokens: string[]): string | undefined {
  // "in Hyderabad" / "at Pune"
  const inCity = normalized.match(/\b(?:in|at|near)\s+([a-z]+(?:\s+[a-z]+)?)/);
  if (inCity?.[1]) {
    const phrase = inCity[1].trim();
    const direct = ASK_CITY_CANONICAL[phrase.replace(/\s+/g, '')] || ASK_CITY_CANONICAL[phrase];
    if (direct) return direct;
    const fuzzy = bestFuzzyMatch(phrase, ASK_CITIES as unknown as string[], 2);
    if (fuzzy) return ASK_CITY_CANONICAL[fuzzy.toLowerCase()] ?? fuzzy;
  }

  for (const token of tokens) {
    const canon = ASK_CITY_CANONICAL[token];
    if (canon) return canon;
    const fuzzy = bestFuzzyMatch(token, ASK_CITIES as unknown as string[], 2);
    if (fuzzy && token.length >= 4) return ASK_CITY_CANONICAL[fuzzy.toLowerCase()] ?? fuzzy;
  }
  return undefined;
}

function extractMaterials(
  normalized: string,
  tokens: string[],
): {
  materials: AskMaterialKey[];
  corrected: string[];
} {
  const found = new Set<AskMaterialKey>();
  const corrected: string[] = [];

  for (const [key, aliases] of Object.entries(ASK_MATERIAL_ALIASES) as Array<
    [AskMaterialKey, string[]]
  >) {
    for (const alias of aliases) {
      if (normalized.includes(alias)) {
        found.add(key);
        break;
      }
    }
  }

  // typo tokens: cemment → cement
  if (found.size === 0) {
    const allAliases = Object.entries(ASK_MATERIAL_ALIASES).flatMap(([key, aliases]) =>
      aliases.map((a) => ({ key: key as AskMaterialKey, alias: a })),
    );
    for (const token of tokens) {
      if (token.length < 4) continue;
      for (const row of allAliases) {
        if (fuzzyEquals(token, row.alias.split(' ')[0] ?? row.alias, 2)) {
          found.add(row.key);
          if (token !== row.alias) corrected.push(`${token}→${row.key}`);
          break;
        }
      }
    }
  }

  return { materials: [...found], corrected };
}

function scoreIntent(flags: {
  comparison: boolean;
  cost: boolean;
  calculator: boolean;
  price: boolean;
  guide: boolean;
  material: boolean;
  location: boolean;
  hasMaterial: boolean;
  hasDims: boolean;
  hasArea: boolean;
}): { intent: AskIntentKind; confidence: number; category: string } {
  if (flags.comparison) {
    return {
      intent: 'comparison',
      confidence: flags.hasMaterial ? 0.92 : 0.8,
      category: 'comparison',
    };
  }
  if (flags.cost) {
    return {
      intent: 'cost',
      confidence: flags.hasArea || flags.location ? 0.9 : 0.78,
      category: 'cost_estimate',
    };
  }
  if (flags.calculator || (flags.hasMaterial && (flags.hasArea || flags.hasDims))) {
    return {
      intent: 'calculator',
      confidence: flags.hasMaterial ? (flags.hasArea || flags.hasDims ? 0.93 : 0.82) : 0.7,
      category: 'calculator',
    };
  }
  if (flags.price) {
    return {
      intent: 'price',
      confidence: flags.hasMaterial || flags.location ? 0.85 : 0.72,
      category: 'price',
    };
  }
  if (flags.guide) {
    return { intent: 'guide', confidence: 0.8, category: 'guide' };
  }
  if (flags.location && !flags.hasMaterial) {
    return { intent: 'location', confidence: 0.75, category: 'location' };
  }
  if (flags.material || flags.hasMaterial) {
    return {
      intent: 'material',
      confidence: 0.7,
      category: 'material',
    };
  }
  return { intent: 'unknown', confidence: 0.35, category: 'unknown' };
}

export function parseAskConstructionQuery(input: string): AskParseResult {
  const raw = input.trim().slice(0, 200);
  const normalized = normalizeQuery(raw);
  const tokens = tokenize(normalized);
  const correctedTokens: string[] = [];

  const dims = extractDimensions(normalized);
  const area =
    extractArea(normalized) ??
    (dims.length && dims.width ? Math.round(dims.length * dims.width) : undefined);
  const location = extractLocation(normalized, tokens);
  const { materials, corrected } = extractMaterials(normalized, tokens);
  correctedTokens.push(...corrected);
  const material = materials[0];
  const unit = extractUnit(normalized);
  const floorCount = extractFloors(normalized);
  const bhk = extractBhk(normalized);
  const bedrooms = extractBedrooms(normalized) ?? bhk;

  const comparison =
    /\bcompare\b|\bvs\.?\b|\bversus\b|\bdifference\b|\bbetter\b/.test(normalized) ||
    (materials.includes('aac') && materials.includes('brick'));
  const cost =
    /\bcost\b|\bestimate\b|\bbudget\b|\bprice to build\b|\bcost to build\b|\bbuild(?:ing)?\s+(?:a\s+)?(?:house|home)\b|\b\d\s*bhk\b|\brenovat|\bremodel\b|\bafford|\bfunding\s+gap\b/.test(
      normalized,
    );
  const calculatorCue =
    /\brequired\b|\bneeded\b|\bhow much\b|\bquantity\b|\bcalculator\b|\bcalc\b|\bfor slab\b/.test(
      normalized,
    ) || Boolean(material && (area || dims.length));
  const price = /\bprice\b|\brate\b|\brates\b|\bcost of\b|\brate of\b/.test(normalized) && !cost;
  const guide = /\bguide\b|\bhow to\b|\bchecklist\b|\btips?\b|\bsteps?\b/.test(normalized);

  const scored = scoreIntent({
    comparison,
    cost: cost && !comparison,
    calculator:
      Boolean(material) &&
      Boolean(material && ASK_CALCULATOR_BY_MATERIAL[material]) &&
      (calculatorCue || Boolean(area || dims.length)) &&
      !comparison &&
      !cost,
    price: price && !cost && !comparison,
    guide,
    material: Boolean(material) && !calculatorCue && !cost && !comparison && !price,
    location: Boolean(location),
    hasMaterial: Boolean(material),
    hasDims: Boolean(dims.length && dims.width),
    hasArea: Boolean(area),
  });

  // Boost confidence when location typo was corrected
  if (location && /hyderbad|bangalor|chenai|mumbi/.test(normalizeQuery(raw))) {
    correctedTokens.push(`location→${location}`);
  }

  let confidence = scored.confidence;
  if (scored.intent === 'unknown' && tokens.length <= 2) confidence = Math.min(confidence, 0.4);
  if (!raw) {
    return {
      raw,
      normalized,
      intent: 'unknown',
      confidence: 0,
      values: {},
      category: 'empty',
      correctedTokens: [],
    };
  }

  return {
    raw,
    normalized,
    intent: scored.intent,
    confidence,
    category: scored.category,
    correctedTokens,
    values: {
      area,
      ...dims,
      location,
      material,
      materials: materials.length ? materials : undefined,
      unit,
      floorCount,
      bhk,
      bedrooms,
    },
  };
}

export function shouldAutoRouteAsk(result: AskParseResult): boolean {
  return result.confidence >= CONFIDENCE_ROUTE_THRESHOLD && result.intent !== 'unknown';
}
