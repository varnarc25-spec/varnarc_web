/** URL-safe planning state shared across cost, material-quantity, and BOQ tools. */

import { constructionCostCalculatorHref } from '../construction-calculator-slug';

export const PLANNER_HANDOFF_STORAGE_KEY = 'varnarc.construction.planner-handoff.v1';

export type ConstructionPlannerHandoff = {
  location?: string;
  builtUpArea?: number;
  areaUnit?: 'sqft' | 'sqm';
  floors?: number;
  propertyType?: string;
  quality?: string;
  structureType?: string;
  foundationType?: string;
  basement?: boolean;
  parkingSlots?: number;
  lift?: boolean;
  compoundWall?: boolean;
  modularKitchen?: boolean;
  budgetInr?: number;
};

function asFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function asBool(value: unknown): boolean | undefined {
  if (value === true || value === '1' || value === 'true') return true;
  if (value === false || value === '0' || value === 'false') return false;
  return undefined;
}

function readParam(
  source: URLSearchParams | Record<string, string | undefined>,
  key: string,
): string | undefined {
  if (source instanceof URLSearchParams) {
    const v = source.get(key);
    return v?.trim() || undefined;
  }
  const v = source[key];
  return v?.trim() || undefined;
}

export function parsePlannerHandoffQuery(
  source: URLSearchParams | Record<string, string | undefined>,
): ConstructionPlannerHandoff {
  const area = asFiniteNumber(
    readParam(source, 'builtUpArea') ?? readParam(source, 'area') ?? readParam(source, 'areaSqft'),
  );
  const unit = readParam(source, 'areaUnit');
  const quality = readParam(source, 'quality');
  const structure = readParam(source, 'structureType') ?? readParam(source, 'structure');
  const foundation = readParam(source, 'foundationType') ?? readParam(source, 'foundation');
  const propertyType = readParam(source, 'propertyType');
  return {
    location: readParam(source, 'location') ?? readParam(source, 'region'),
    builtUpArea: area != null && area > 0 ? area : undefined,
    areaUnit: unit === 'sqm' || unit === 'sqft' ? unit : undefined,
    floors: asFiniteNumber(readParam(source, 'floors')),
    propertyType,
    quality,
    structureType: structure,
    foundationType: foundation,
    basement: asBool(readParam(source, 'basement')),
    parkingSlots: asFiniteNumber(readParam(source, 'parkingSlots')),
    lift: asBool(readParam(source, 'lift')),
    compoundWall: asBool(readParam(source, 'compoundWall')),
    modularKitchen: asBool(readParam(source, 'modularKitchen')),
    budgetInr: asFiniteNumber(readParam(source, 'budgetInr') ?? readParam(source, 'budget')),
  };
}

export function buildPlannerHandoffQuery(handoff: ConstructionPlannerHandoff): string {
  const sp = new URLSearchParams();
  if (handoff.location) sp.set('location', handoff.location);
  if (handoff.builtUpArea != null && handoff.builtUpArea > 0) {
    sp.set('builtUpArea', String(Math.round(handoff.builtUpArea * 100) / 100));
  }
  if (handoff.areaUnit) sp.set('areaUnit', handoff.areaUnit);
  if (handoff.floors != null) sp.set('floors', String(handoff.floors));
  if (handoff.propertyType) sp.set('propertyType', handoff.propertyType);
  if (handoff.quality) sp.set('quality', handoff.quality);
  if (handoff.structureType) sp.set('structureType', handoff.structureType);
  if (handoff.foundationType) sp.set('foundationType', handoff.foundationType);
  if (handoff.basement) sp.set('basement', '1');
  if (handoff.parkingSlots != null && handoff.parkingSlots > 0) {
    sp.set('parkingSlots', String(handoff.parkingSlots));
  }
  if (handoff.lift) sp.set('lift', '1');
  if (handoff.compoundWall) sp.set('compoundWall', '1');
  if (handoff.modularKitchen) sp.set('modularKitchen', '1');
  if (handoff.budgetInr != null && handoff.budgetInr > 0) {
    sp.set('budgetInr', String(Math.round(handoff.budgetInr)));
  }
  return sp.toString();
}

export function mergePlannerHandoff(
  ...parts: Array<ConstructionPlannerHandoff | null | undefined>
): ConstructionPlannerHandoff {
  const out: ConstructionPlannerHandoff = {};
  for (const part of parts) {
    if (!part) continue;
    for (const [key, value] of Object.entries(part) as Array<
      [
        keyof ConstructionPlannerHandoff,
        ConstructionPlannerHandoff[keyof ConstructionPlannerHandoff],
      ]
    >) {
      if (value == null || value === '') continue;
      (out as Record<string, unknown>)[key] = value;
    }
  }
  return out;
}

export function plannerToolHref(
  path:
    | '/construction/cost-calculator'
    | '/construction/material-calculator'
    | '/construction/boq-generator'
    | '/construction/boq',
  handoff: ConstructionPlannerHandoff,
  hash?: string,
): string {
  if (path === '/construction/cost-calculator') {
    return constructionCostCalculatorHref(handoff, hash);
  }
  const q = buildPlannerHandoffQuery(handoff);
  const href = q ? `${path}?${q}` : path;
  return hash ? `${href}#${hash}` : href;
}
