/**
 * Indicative plot → built-up helper for the cost calculator.
 * Not a sanction, FSI/FAR, or development-control check.
 */

import { resolveConstructionLocation } from '../construction-location-catalog';

export const PLOT_SETBACK_DISCLAIMER =
  'Planning sketch only. Setbacks, coverage and FSI/FAR depend on plot size, road width, zone and the local authority. Confirm with the development body before design or budgeting. This is not a building permission.';

export const PLOT_SETBACK_CATALOG_VERSION = '2026.09.1';

export type PlotLinearUnit = 'ft' | 'm';

export type PlotSetbacks = {
  front: number;
  rear: number;
  left: number;
  right: number;
};

export type PlotBuiltUpInput = {
  plotLength: number;
  plotWidth: number;
  floors: number;
  setbacks: PlotSetbacks;
  linearUnit: PlotLinearUnit;
};

export type PlotBuiltUpResult = {
  plotArea: number;
  coverageLength: number;
  coverageWidth: number;
  groundCoverage: number;
  suggestedBuiltUp: number;
  areaUnit: 'sqft' | 'sqm';
  valid: boolean;
  error: string | null;
};

const FT_PER_M = 3.280839895;

/** Typical mid-size residential defaults in feet — not bylaws. */
const NATIONAL_SETBACKS_FT: PlotSetbacks = { front: 10, rear: 5, left: 4, right: 4 };

const CITY_SETBACKS_FT: Record<string, PlotSetbacks> = {
  hyderabad: { front: 10, rear: 5, left: 4, right: 4 },
  bengaluru: { front: 10, rear: 6, left: 4, right: 4 },
  bangalore: { front: 10, rear: 6, left: 4, right: 4 },
  chennai: { front: 10, rear: 5, left: 3.5, right: 3.5 },
  mumbai: { front: 12, rear: 6, left: 5, right: 5 },
  pune: { front: 10, rear: 5, left: 4, right: 4 },
  delhi: { front: 10, rear: 6, left: 5, right: 5 },
  delhincr: { front: 10, rear: 6, left: 5, right: 5 },
  gurugram: { front: 10, rear: 6, left: 5, right: 5 },
  gurgaon: { front: 10, rear: 6, left: 5, right: 5 },
  noida: { front: 10, rear: 6, left: 5, right: 5 },
  ahmedabad: { front: 10, rear: 6, left: 4, right: 4 },
  kolkata: { front: 8, rear: 5, left: 4, right: 4 },
  jaipur: { front: 10, rear: 5, left: 4, right: 4 },
  coimbatore: { front: 10, rear: 5, left: 3.5, right: 3.5 },
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function convertSetbacks(feet: PlotSetbacks, unit: PlotLinearUnit): PlotSetbacks {
  if (unit === 'ft') return { ...feet };
  return {
    front: round1(feet.front / FT_PER_M),
    rear: round1(feet.rear / FT_PER_M),
    left: round1(feet.left / FT_PER_M),
    right: round1(feet.right / FT_PER_M),
  };
}

export function defaultPlotDimensions(linearUnit: PlotLinearUnit): {
  length: number;
  width: number;
} {
  if (linearUnit === 'ft') return { length: 40, width: 30 };
  return { length: round1(40 / FT_PER_M), width: round1(30 / FT_PER_M) };
}

export function defaultSetbacksForLocation(
  locationQuery: string,
  linearUnit: PlotLinearUnit,
): { setbacks: PlotSetbacks; locationLabel: string; usedNationalDefault: boolean } {
  const { location, matched } = resolveConstructionLocation(locationQuery);
  const bySlug = CITY_SETBACKS_FT[location.slug];
  const feet = bySlug ?? NATIONAL_SETBACKS_FT;
  return {
    setbacks: convertSetbacks(feet, linearUnit),
    locationLabel: matched ? location.city : 'National typical default',
    usedNationalDefault: !bySlug,
  };
}

export function convertLinearValue(
  value: number,
  from: PlotLinearUnit,
  to: PlotLinearUnit,
): number {
  if (!Number.isFinite(value) || from === to) return value;
  if (from === 'ft' && to === 'm') return round1(value / FT_PER_M);
  return round1(value * FT_PER_M);
}

export function linearUnitFromAreaUnit(areaUnit: 'sqft' | 'sqm'): PlotLinearUnit {
  return areaUnit === 'sqm' ? 'm' : 'ft';
}

export function calculateBuiltUpFromPlot(input: PlotBuiltUpInput): PlotBuiltUpResult {
  const areaUnit = input.linearUnit === 'm' ? 'sqm' : 'sqft';
  const empty: PlotBuiltUpResult = {
    plotArea: 0,
    coverageLength: 0,
    coverageWidth: 0,
    groundCoverage: 0,
    suggestedBuiltUp: 0,
    areaUnit,
    valid: false,
    error: 'Enter plot length and width greater than zero.',
  };
  if (
    !Number.isFinite(input.plotLength) ||
    !Number.isFinite(input.plotWidth) ||
    input.plotLength <= 0 ||
    input.plotWidth <= 0
  ) {
    return empty;
  }
  const s = input.setbacks;
  if ([s.front, s.rear, s.left, s.right].some((n) => !Number.isFinite(n) || n < 0)) {
    return { ...empty, error: 'Setbacks must be zero or positive numbers.' };
  }
  const floors = Number.isFinite(input.floors) ? Math.max(1, Math.round(input.floors)) : 1;
  const coverageLength = round1(input.plotLength - s.front - s.rear);
  const coverageWidth = round1(input.plotWidth - s.left - s.right);
  const plotArea = Math.round(input.plotLength * input.plotWidth * 100) / 100;
  if (coverageLength <= 0 || coverageWidth <= 0) {
    return {
      ...empty,
      plotArea,
      coverageLength,
      coverageWidth,
      error: 'Setbacks leave no buildable ground coverage. Reduce setbacks or increase plot size.',
    };
  }
  const groundCoverage = Math.round(coverageLength * coverageWidth * 100) / 100;
  const suggestedBuiltUp = Math.round(groundCoverage * floors);
  return {
    plotArea,
    coverageLength,
    coverageWidth,
    groundCoverage,
    suggestedBuiltUp,
    areaUnit,
    valid: true,
    error: null,
  };
}
