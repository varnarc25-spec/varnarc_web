const COST_CALCULATOR_BASE = '/construction/cost-calculator';
const SLUG_MAX = 180;

const UNIT_TOKEN: Record<string, 'sft' | 'sqm'> = {
  sft: 'sft',
  sqft: 'sft',
  'sq-ft': 'sft',
  sqm: 'sqm',
};

function trimNumber(value: number): string {
  return String(Math.round(value * 100) / 100);
}

function slugToken(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9.-]/g, '')
    .slice(0, 60);
}

function unslugToken(value: string): string {
  return value.replace(/-/g, ' ').trim();
}

function areaUnitToken(unit?: string | null): 'sft' | 'sqm' {
  const key = (unit ?? 'sqft').toLowerCase();
  return UNIT_TOKEN[key] ?? 'sft';
}

function areaUnitFromToken(token: string): 'sqft' | 'sqm' {
  return UNIT_TOKEN[token.toLowerCase()] === 'sqm' ? 'sqm' : 'sqft';
}

/**
 * Parse a cost-calculator path slug such as `builtUpArea_1500_sft`
 * or `builtUpArea_1500_sft__location_Hyderabad__floors_2`.
 */
export function parseConstructionCostCalculatorSlug(
  raw: string | null | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw) return out;
  let slug = raw;
  try {
    slug = decodeURIComponent(raw);
  } catch {
    /* keep raw */
  }
  slug = slug.replace(/^\/+|\/+$/g, '').slice(0, SLUG_MAX);
  if (!slug) return out;

  const parts = slug.split('__').filter(Boolean);
  for (const part of parts) {
    const area = part.match(/^(?:builtUpArea[_-])?(\d+(?:\.\d+)?)[_-](sft|sqft|sq-ft|sqm)$/i);
    if (area?.[1] && area[2]) {
      out.builtUpArea = area[1];
      out.areaUnit = areaUnitFromToken(area[2]);
      continue;
    }
    const kv = part.match(/^([A-Za-z][A-Za-z0-9]*)_(.+)$/);
    if (kv?.[1] && kv[2]) {
      const key = kv[1];
      const value = key === 'location' ? unslugToken(kv[2]) : kv[2];
      out[key] = value;
    }
  }
  return out;
}

export type CostCalculatorSlugFields = {
  builtUpArea?: number | string | null;
  areaUnit?: string | null;
  location?: string | null;
  floors?: number | string | null;
  quality?: string | null;
  propertyType?: string | null;
  contingencyPercent?: number | string | null;
  mode?: string | null;
  budgetInr?: number | string | null;
  customRate?: string | null;
};

export function buildConstructionCostCalculatorSlug(
  input: CostCalculatorSlugFields,
): string | null {
  const tokens: string[] = [];
  const area = Number(input.builtUpArea);
  if (Number.isFinite(area) && area > 0) {
    tokens.push(`builtUpArea_${trimNumber(area)}_${areaUnitToken(input.areaUnit)}`);
  }
  if (input.mode === 'reverse') {
    const budget = Number(input.budgetInr);
    if (Number.isFinite(budget) && budget > 0) {
      tokens.push(`budgetInr_${Math.round(budget)}`);
      tokens.push('mode_reverse');
    }
  }
  if (input.location?.trim()) tokens.push(`location_${slugToken(input.location)}`);
  const floors = Number(input.floors);
  if (Number.isFinite(floors) && floors > 0) tokens.push(`floors_${floors}`);
  if (input.quality?.trim()) tokens.push(`quality_${slugToken(input.quality)}`);
  if (input.propertyType?.trim()) tokens.push(`propertyType_${slugToken(input.propertyType)}`);
  const contingency = Number(input.contingencyPercent);
  if (Number.isFinite(contingency) && contingency > 0 && contingency !== 10) {
    tokens.push(`contingencyPercent_${trimNumber(contingency)}`);
  }
  if (input.customRate?.toString().trim()) {
    tokens.push(`customRate_${slugToken(String(input.customRate))}`);
  }
  const slug = tokens.join('__');
  if (!slug) return null;
  return slug.slice(0, SLUG_MAX);
}

export function constructionCostCalculatorHref(
  input: CostCalculatorSlugFields,
  hash?: string,
): string {
  const slug = buildConstructionCostCalculatorSlug(input);
  const path = slug ? `${COST_CALCULATOR_BASE}/${slug}` : COST_CALCULATOR_BASE;
  return hash ? `${path}#${hash}` : path;
}

export function isConstructionCostCalculatorSlugPath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, '') || '/';
  return p.startsWith(`${COST_CALCULATOR_BASE}/`) && p.length > COST_CALCULATOR_BASE.length + 1;
}
