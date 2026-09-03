/**
 * Calculator hero vectors.
 *
 * Custom art (recommended):
 * - Format: SVG
 * - Canvas: 480 × 360 (4:3) — matches existing hub category art
 * - viewBox: "0 0 480 360"
 * - Safe area: keep the subject inside ~40px inset so it is not cropped on mobile
 * - Display: max 280px wide next to the H1 (desktop); full width under the title on small screens
 * - Palette: navy #0b1f3a, orange #f97316, paper #f7f9fc, stroke #e2e8f0
 *
 * Save custom files as:
 *   apps/web/public/calculators/illustrations/{slug}.svg
 * then add the slug to CUSTOM_CALCULATOR_ILLUSTRATIONS.
 *
 * Preferred: upload via Admin → Calculators → Optional illustration.
 * The public calculator pages use `illustrationUrl` from the API first.
 */

export const CALCULATOR_ILLUSTRATION_WIDTH = 480;
export const CALCULATOR_ILLUSTRATION_HEIGHT = 360;

export type CalculatorIllustrationType =
  | 'car'
  | 'fuel'
  | 'mileage'
  | 'insurance'
  | 'depreciation'
  | 'maintenance'
  | 'ev'
  | 'emi'
  | 'sip'
  | 'tax'
  | 'construction'
  | 'generic';

/** Slug-specific files you drop in /public/calculators/illustrations/{slug}.svg */
export const CUSTOM_CALCULATOR_ILLUSTRATIONS: Record<string, string> = {
  // Example: 'car-loan': '/calculators/illustrations/car-loan.svg',
};

export function illustrationTypeForCalculatorSlug(slug: string): CalculatorIllustrationType {
  const s = slug.toLowerCase();
  if (/(charging|ev-vs|range|ev-charging)/.test(s)) return 'ev';
  if (/(car-loan|bike-loan|two-wheeler|on-road|road-tax|toll|lease-vs-buy)/.test(s)) return 'car';
  if (/(fuel|petrol|diesel)/.test(s)) return 'fuel';
  if (/mileage/.test(s)) return 'mileage';
  if (/insurance/.test(s)) return 'insurance';
  if (/(depreciat|resale|tco)/.test(s)) return 'depreciation';
  if (/(maintenance|service)/.test(s)) return 'maintenance';
  if (/(emi|loan|afford|prepayment|simple-interest)/.test(s)) return 'emi';
  if (/(sip|fd|rd|nps|mutual|lumpsum|gold-return|roi)/.test(s)) return 'sip';
  if (/(tax|gst|tds|hra|income-tax)/.test(s)) return 'tax';
  if (
    /(brick|concrete|paint|steel|tile|construction|carpet|staircase|room-area|water-tank|electricity)/.test(
      s,
    )
  ) {
    return 'construction';
  }
  return 'generic';
}

export function calculatorIllustrationSrc(slug: string): string | null {
  return CUSTOM_CALCULATOR_ILLUSTRATIONS[slug] ?? null;
}
