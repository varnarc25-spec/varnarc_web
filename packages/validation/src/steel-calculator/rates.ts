/** Steel / rebar constants and common diameters. */

export const STEEL_CALC_VERSION = '2026.08.1';

/**
 * Standard engineering approximation for mild steel / TMT rebar mass:
 *   w (kg/m) = d² / 162
 * where d is bar diameter in millimetres.
 *
 * Derived from π/4 × d² × 7850 kg/m³ / 1e6 ≈ d² / 162.28 ≈ d² / 162.
 */
export const REBAR_WEIGHT_DIVISOR = 162;

export const REBAR_MASS_FORMULA = 'w (kg/m) = d² / 162';

export const STEEL_DENSITY_KG_PER_M3 = 7850;

/** Common rebar diameters used in building construction (mm). */
export const COMMON_REBAR_DIAMETERS_MM = [6, 8, 10, 12, 16, 20, 25, 28, 32, 36, 40] as const;

export type CommonRebarDiameterMm = (typeof COMMON_REBAR_DIAMETERS_MM)[number];

export function listCommonRebarDiameters(): Array<{ value: number; label: string }> {
  return COMMON_REBAR_DIAMETERS_MM.map((d) => ({
    value: d,
    label: `${d} mm`,
  }));
}

/** Exact density-based unit weight for cross-check / documentation. */
export function rebarWeightFromDensityKgPerM(diameterMm: number): number {
  const dM = diameterMm / 1000;
  const areaM2 = (Math.PI / 4) * dM * dM;
  return areaM2 * STEEL_DENSITY_KG_PER_M3;
}
