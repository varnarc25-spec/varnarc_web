import { EMI_LIMITS, monthsFromTenure } from '@/lib/emi';

export type CalculatorTenureUnit = 'months' | 'years';

/** Safe shareable calculator query keys. */
export const CALCULATOR_QUERY_KEYS = [
  'amount',
  'rate',
  'tenure',
  'tenureUnit',
  'product',
  'lender',
  'category',
] as const;

export type CalculatorQueryKey = (typeof CALCULATOR_QUERY_KEYS)[number];

/**
 * Keys that must never appear on shareable calculator URLs.
 * Catalog/filter keys are also ignored on parse.
 */
export const CALCULATOR_DISALLOWED_QUERY_KEYS = [
  'income',
  'creditScore',
  'creditScoreMaxRequired',
  'employment',
  'employmentType',
  'pan',
  'aadhaar',
  'phone',
  'email',
  'name',
  'dob',
  'amountMin',
  'amountMax',
  'tenureMin',
  'tenureMax',
  'rateMin',
  'rateMax',
  'bankId',
  'categorySlug',
  'productName',
  'productId',
] as const;

export type CalculatorQueryState = {
  amount?: number;
  rate?: number;
  tenure?: number;
  tenureUnit?: CalculatorTenureUnit;
  /** Safe product slug for contextual messaging only. */
  product?: string;
  /** Safe lender slug for contextual messaging only. */
  lender?: string;
  /** Safe loan category slug for navigation/messaging. */
  category?: string;
};

export type ParsedCalculatorParams = {
  amount: number | null;
  rate: number | null;
  tenure: number | null;
  tenureUnit: CalculatorTenureUnit | null;
  tenureMonths: number | null;
  product: string | null;
  lender: string | null;
  category: string | null;
  /** True when the corresponding key was missing/invalid and left null. */
  missing: {
    amount: boolean;
    rate: boolean;
    tenure: boolean;
  };
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

function getParam(
  params: URLSearchParams | Record<string, string | string[] | null | undefined>,
  key: string,
): string | null {
  if (params instanceof URLSearchParams) return params.get(key);
  const raw = params[key];
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw ?? null;
}

function parseNumber(raw: string | null | undefined): number | null {
  if (raw == null || String(raw).trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Positive amount within safe EMI bounds; null when invalid. */
export function sanitizeAmount(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : parseNumber(raw == null ? null : String(raw));
  if (n == null || n <= 0) return null;
  const rounded = Math.round(n);
  if (rounded < EMI_LIMITS.amountMin || rounded > EMI_LIMITS.amountMax) return null;
  return rounded;
}

/** Non-negative rate (0 allowed); null when invalid/negative/out of bounds. */
export function sanitizeRate(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : parseNumber(raw == null ? null : String(raw));
  if (n == null || n < 0) return null;
  if (n > EMI_LIMITS.rateMax) return null;
  return Math.round(n * 100) / 100;
}

export function sanitizeTenureUnit(raw: unknown): CalculatorTenureUnit | null {
  if (raw === 'months' || raw === 'years') return raw;
  if (typeof raw === 'string') {
    const v = raw.trim().toLowerCase();
    if (v === 'months' || v === 'month') return 'months';
    if (v === 'years' || v === 'year') return 'years';
  }
  return null;
}

/**
 * Positive tenure value. When unit is provided, also validates converted months
 * against safe bounds. Returns null when invalid.
 */
export function sanitizeTenure(
  raw: unknown,
  unit: CalculatorTenureUnit | null = 'years',
): { tenure: number; tenureUnit: CalculatorTenureUnit; tenureMonths: number } | null {
  const n = typeof raw === 'number' ? raw : parseNumber(raw == null ? null : String(raw));
  if (n == null || n <= 0) return null;
  const tenureUnit = unit ?? 'years';
  const tenure = tenureUnit === 'years' ? Math.round(n * 10) / 10 : Math.round(n);
  if (tenure <= 0) return null;
  const tenureMonths = monthsFromTenure(tenure, tenureUnit);
  if (tenureMonths < EMI_LIMITS.tenureMonthsMin || tenureMonths > EMI_LIMITS.tenureMonthsMax) {
    return null;
  }
  return { tenure, tenureUnit, tenureMonths };
}

/** Safe public slug (product / lender / category). */
export function sanitizeCalculatorSlug(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim().toLowerCase();
  if (!value || value.length > 120) return null;
  if (!SLUG_RE.test(value)) return null;
  return value;
}

/**
 * Parse calculator URL params. Unknown/disallowed/malformed keys are ignored.
 * Does not crash on bad input. Does not invent defaults — missing values stay null.
 */
export function parseCalculatorParams(
  params: URLSearchParams | Record<string, string | string[] | null | undefined>,
): ParsedCalculatorParams {
  const amount = sanitizeAmount(getParam(params, 'amount'));
  const rate = sanitizeRate(getParam(params, 'rate'));
  const unit = sanitizeTenureUnit(getParam(params, 'tenureUnit')) ?? 'years';
  const tenureParsed = sanitizeTenure(getParam(params, 'tenure'), unit);

  return {
    amount,
    rate,
    tenure: tenureParsed?.tenure ?? null,
    tenureUnit: tenureParsed?.tenureUnit ?? null,
    tenureMonths: tenureParsed?.tenureMonths ?? null,
    product: sanitizeCalculatorSlug(getParam(params, 'product')),
    lender: sanitizeCalculatorSlug(getParam(params, 'lender')),
    category: sanitizeCalculatorSlug(getParam(params, 'category')),
    missing: {
      amount: amount == null,
      rate: rate == null,
      tenure: tenureParsed == null,
    },
  };
}

/**
 * Serialize calculator state for shareable URLs.
 * Strips disallowed / private keys and catalog filter params.
 */
export function serializeCalculatorParams(state: CalculatorQueryState): URLSearchParams {
  const qs = new URLSearchParams();

  const amount = sanitizeAmount(state.amount);
  if (amount != null) qs.set('amount', String(amount));

  const rate = sanitizeRate(state.rate);
  if (rate != null) qs.set('rate', String(rate));

  const unit = sanitizeTenureUnit(state.tenureUnit) ?? 'years';
  const tenure = sanitizeTenure(state.tenure, unit);
  if (tenure) {
    qs.set('tenure', String(tenure.tenure));
    qs.set('tenureUnit', tenure.tenureUnit);
  }

  const product = sanitizeCalculatorSlug(state.product);
  if (product) qs.set('product', product);

  const lender = sanitizeCalculatorSlug(state.lender);
  if (lender) qs.set('lender', lender);

  const category = sanitizeCalculatorSlug(state.category);
  if (category) qs.set('category', category);

  return qs;
}

export function buildCalculatorHref(
  calculatorSlug: string,
  state: CalculatorQueryState = {},
): string {
  const slug = calculatorSlug.replace(/^\/+|\/+$/g, '');
  const qs = serializeCalculatorParams(state).toString();
  return qs ? `/calculators/${slug}?${qs}` : `/calculators/${slug}`;
}

export function calculatorCanonicalPath(calculatorSlug: string): string {
  return `/calculators/${calculatorSlug.replace(/^\/+|\/+$/g, '')}`;
}

export function hasCalculatorQueryParams(
  params: Record<string, string | undefined> | URLSearchParams,
): boolean {
  for (const key of CALCULATOR_QUERY_KEYS) {
    const value = params instanceof URLSearchParams ? params.get(key) : params[key];
    if (value != null && String(value).trim() !== '') return true;
  }
  return false;
}

/** Human label from a safe product slug (contextual UI only). */
export function productLabelFromSlug(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function calculatorContextNotice(parsed: ParsedCalculatorParams): string | null {
  const productLabel = productLabelFromSlug(parsed.product);
  if (productLabel && parsed.rate != null) {
    return `Illustrative calculation using ${productLabel}'s displayed starting rate. Actual rates may differ.`;
  }
  if (productLabel) {
    return `Illustrative calculation for ${productLabel}. Actual rates and terms may differ.`;
  }
  return null;
}

type FieldLike = { key: string };

/**
 * Map standard calculator query params onto CMS calculator field keys.
 * Does not invent values when params are missing.
 */
export function applyCalculatorParamsToFieldValues(
  fields: FieldLike[],
  parsed: ParsedCalculatorParams,
  current: Record<string, string> = {},
): Record<string, string> {
  const keys = new Set(fields.map((f) => f.key));
  const next = { ...current };

  if (parsed.amount != null) {
    if (keys.has('loanAmount')) next.loanAmount = String(parsed.amount);
    else if (keys.has('principal')) next.principal = String(parsed.amount);
    else if (keys.has('amount')) next.amount = String(parsed.amount);
  }

  if (parsed.rate != null) {
    if (keys.has('annualRate')) next.annualRate = String(parsed.rate);
    else if (keys.has('interestRate')) next.interestRate = String(parsed.rate);
    else if (keys.has('rate')) next.rate = String(parsed.rate);
  }

  if (parsed.tenureMonths != null) {
    if (keys.has('tenureMonths')) {
      next.tenureMonths = String(parsed.tenureMonths);
    } else if (keys.has('tenure')) {
      next.tenure = String(
        parsed.tenureUnit === 'years' && parsed.tenure != null
          ? parsed.tenure
          : parsed.tenureMonths,
      );
    } else if (keys.has('tenureYears') && parsed.tenureUnit === 'years' && parsed.tenure != null) {
      next.tenureYears = String(parsed.tenure);
    }
  }

  return next;
}

/** Build shareable calculator state from current field values. */
export function calculatorParamsFromFieldValues(
  values: Record<string, string>,
  context?: Pick<CalculatorQueryState, 'product' | 'lender' | 'category'>,
): CalculatorQueryState {
  const amountRaw = values.loanAmount ?? values.principal ?? values.amount ?? undefined;
  const rateRaw = values.annualRate ?? values.interestRate ?? values.rate ?? undefined;

  let tenure: number | undefined;
  let tenureUnit: CalculatorTenureUnit | undefined;

  if (values.tenureMonths != null && values.tenureMonths !== '') {
    const months = Number(values.tenureMonths);
    if (Number.isFinite(months) && months > 0) {
      if (months >= 12 && months % 12 === 0) {
        tenure = months / 12;
        tenureUnit = 'years';
      } else {
        tenure = months;
        tenureUnit = 'months';
      }
    }
  } else if (values.tenureYears) {
    tenure = Number(values.tenureYears);
    tenureUnit = 'years';
  } else if (values.tenure) {
    tenure = Number(values.tenure);
    tenureUnit = 'years';
  }

  return {
    amount: sanitizeAmount(amountRaw) ?? undefined,
    rate: sanitizeRate(rateRaw) ?? undefined,
    tenure: tenure != null && Number.isFinite(tenure) ? tenure : undefined,
    tenureUnit,
    product: context?.product,
    lender: context?.lender,
    category: context?.category,
  };
}

export function buildShareableCalculatorUrl(
  calculatorSlug: string,
  values: Record<string, string>,
  origin: string,
  context?: Pick<CalculatorQueryState, 'product' | 'lender' | 'category'>,
): string {
  const path = buildCalculatorHref(
    calculatorSlug,
    calculatorParamsFromFieldValues(values, context),
  );
  const base = origin.replace(/\/$/, '');
  return `${base}${path}`;
}
