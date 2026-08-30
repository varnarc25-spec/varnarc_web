/** Paint calculator defaults — coverage and opening sizes are overridable. */

export const PAINT_CALC_VERSION = '2026.08.1';

/** Default interior emulsion coverage (m² per litre per coat). Users override freely. */
export const DEFAULT_PAINT_COVERAGE_M2_PER_L = 10;

/** Default primer coverage (m² per litre per coat). */
export const DEFAULT_PRIMER_COVERAGE_M2_PER_L = 12;

/** Default putty consumption (kg per m² of surface). */
export const DEFAULT_PUTTY_KG_PER_M2 = 1.1;

/** Common retail tin sizes (litres). */
export const DEFAULT_PAINT_PACKAGE_SIZES_L = [1, 4, 10, 20] as const;

export const DEFAULT_DOOR_WIDTH_M = 0.9;
export const DEFAULT_DOOR_HEIGHT_M = 2.1;
export const DEFAULT_WINDOW_WIDTH_M = 1.2;
export const DEFAULT_WINDOW_HEIGHT_M = 1.2;

export const M2_TO_FT2 = 10.76391041671;
