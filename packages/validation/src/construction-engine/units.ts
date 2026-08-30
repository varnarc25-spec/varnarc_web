import type { ConstructionDimension } from './types';

/** Canonical SI-ish bases per dimension. */
export const BASE_UNITS: Record<ConstructionDimension, string> = {
  length: 'm',
  area: 'm2',
  volume: 'm3',
  mass: 'kg',
  liquid: 'liter',
  count: 'piece',
};

/**
 * Supported construction units → factor to base unit of their dimension.
 * Aliases normalize to the same canonical key.
 */
const UNIT_DEFS: Record<
  string,
  { dimension: ConstructionDimension; toBase: number; canonical: string }
> = {
  // length
  mm: { dimension: 'length', toBase: 0.001, canonical: 'mm' },
  cm: { dimension: 'length', toBase: 0.01, canonical: 'cm' },
  m: { dimension: 'length', toBase: 1, canonical: 'm' },
  inch: { dimension: 'length', toBase: 0.0254, canonical: 'inch' },
  in: { dimension: 'length', toBase: 0.0254, canonical: 'inch' },
  ft: { dimension: 'length', toBase: 0.3048, canonical: 'ft' },
  feet: { dimension: 'length', toBase: 0.3048, canonical: 'ft' },
  foot: { dimension: 'length', toBase: 0.3048, canonical: 'ft' },

  // area
  mm2: { dimension: 'area', toBase: 1e-6, canonical: 'mm2' },
  cm2: { dimension: 'area', toBase: 1e-4, canonical: 'cm2' },
  m2: { dimension: 'area', toBase: 1, canonical: 'm2' },
  sqm: { dimension: 'area', toBase: 1, canonical: 'm2' },
  'sq m': { dimension: 'area', toBase: 1, canonical: 'm2' },
  sq_m: { dimension: 'area', toBase: 1, canonical: 'm2' },
  ft2: { dimension: 'area', toBase: 0.09290304, canonical: 'ft2' },
  sqft: { dimension: 'area', toBase: 0.09290304, canonical: 'ft2' },
  'sq ft': { dimension: 'area', toBase: 0.09290304, canonical: 'ft2' },
  sq_ft: { dimension: 'area', toBase: 0.09290304, canonical: 'ft2' },
  yard2: { dimension: 'area', toBase: 0.83612736, canonical: 'yard2' },
  sqyd: { dimension: 'area', toBase: 0.83612736, canonical: 'yard2' },
  'sq yard': { dimension: 'area', toBase: 0.83612736, canonical: 'yard2' },
  sq_yard: { dimension: 'area', toBase: 0.83612736, canonical: 'yard2' },

  // volume (solid)
  mm3: { dimension: 'volume', toBase: 1e-9, canonical: 'mm3' },
  cm3: { dimension: 'volume', toBase: 1e-6, canonical: 'cm3' },
  m3: { dimension: 'volume', toBase: 1, canonical: 'm3' },
  cum: { dimension: 'volume', toBase: 1, canonical: 'm3' },
  'cu m': { dimension: 'volume', toBase: 1, canonical: 'm3' },
  cu_m: { dimension: 'volume', toBase: 1, canonical: 'm3' },
  ft3: { dimension: 'volume', toBase: 0.028316846592, canonical: 'ft3' },
  cft: { dimension: 'volume', toBase: 0.028316846592, canonical: 'ft3' },
  'cu ft': { dimension: 'volume', toBase: 0.028316846592, canonical: 'ft3' },
  cu_ft: { dimension: 'volume', toBase: 0.028316846592, canonical: 'ft3' },
  brass: { dimension: 'volume', toBase: 2.8316846592, canonical: 'brass' }, // 100 cu ft

  // mass
  kg: { dimension: 'mass', toBase: 1, canonical: 'kg' },
  g: { dimension: 'mass', toBase: 0.001, canonical: 'g' },
  tonne: { dimension: 'mass', toBase: 1000, canonical: 'tonne' },
  ton: { dimension: 'mass', toBase: 1000, canonical: 'tonne' },
  mt: { dimension: 'mass', toBase: 1000, canonical: 'tonne' },

  // liquid volume (treated as distinct dimension; 1 L = 0.001 m³ physically but kept separate)
  liter: { dimension: 'liquid', toBase: 1, canonical: 'liter' },
  litre: { dimension: 'liquid', toBase: 1, canonical: 'liter' },
  l: { dimension: 'liquid', toBase: 1, canonical: 'liter' },
  ml: { dimension: 'liquid', toBase: 0.001, canonical: 'ml' },

  // count
  piece: { dimension: 'count', toBase: 1, canonical: 'piece' },
  pcs: { dimension: 'count', toBase: 1, canonical: 'piece' },
  nos: { dimension: 'count', toBase: 1, canonical: 'piece' },
  bag: { dimension: 'count', toBase: 1, canonical: 'bag' },
  bags: { dimension: 'count', toBase: 1, canonical: 'bag' },
};

export function normalizeUnitKey(unit: string): string {
  return unit.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function resolveUnit(unit: string): {
  dimension: ConstructionDimension;
  toBase: number;
  canonical: string;
} | null {
  const key = normalizeUnitKey(unit);
  return UNIT_DEFS[key] ?? null;
}

export function getUnitDimension(unit: string): ConstructionDimension | null {
  return resolveUnit(unit)?.dimension ?? null;
}

export function listSupportedUnits(): string[] {
  return [...new Set(Object.values(UNIT_DEFS).map((u) => u.canonical))].sort();
}

export type UnitConversionResult =
  | { ok: true; value: number; from: string; to: string; dimension: ConstructionDimension }
  | { ok: false; error: string };

/**
 * Convert a value between compatible units. Deterministic.
 */
export function convertUnit(value: number, fromUnit: string, toUnit: string): UnitConversionResult {
  if (!Number.isFinite(value)) {
    return { ok: false, error: 'Value must be a finite number' };
  }
  const from = resolveUnit(fromUnit);
  const to = resolveUnit(toUnit);
  if (!from) return { ok: false, error: `Unsupported unit: ${fromUnit}` };
  if (!to) return { ok: false, error: `Unsupported unit: ${toUnit}` };
  if (from.dimension !== to.dimension) {
    return {
      ok: false,
      error: `Cannot convert ${from.canonical} (${from.dimension}) to ${to.canonical} (${to.dimension})`,
    };
  }
  const base = value * from.toBase;
  const converted = base / to.toBase;
  if (!Number.isFinite(converted)) {
    return { ok: false, error: 'Conversion overflow' };
  }
  return {
    ok: true,
    value: converted,
    from: from.canonical,
    to: to.canonical,
    dimension: from.dimension,
  };
}

export function toBaseUnit(value: number, unit: string): UnitConversionResult {
  const resolved = resolveUnit(unit);
  if (!resolved) return { ok: false, error: `Unsupported unit: ${unit}` };
  return convertUnit(value, unit, BASE_UNITS[resolved.dimension]);
}
