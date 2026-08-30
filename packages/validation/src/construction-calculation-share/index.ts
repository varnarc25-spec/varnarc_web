/**
 * Shareable construction calculation URLs.
 *
 * Encodes allowlisted public calculator inputs into `?s=` (base64url JSON).
 * Never encodes user identity, project IDs, or private metadata.
 */

import { z } from 'zod';
import { cementCalculatorInputSchema } from '../cement-calculator/types';
import { concreteCalculatorInputSchema } from '../concrete-calculator/types';
import { constructionCostInputSchema } from '../construction-cost/types';
import { tileCalculatorInputSchema } from '../tile-calculator/types';
import { steelCalculatorInputSchema } from '../steel-calculator/types';
import { brickCalculatorInputSchema } from '../brick-calculator/types';
import { sandCalculatorInputSchema } from '../sand-calculator/types';
import { aggregateCalculatorInputSchema } from '../aggregate-calculator/types';
import { plasterCalculatorInputSchema } from '../plaster-calculator/types';
import { paintCalculatorInputSchema } from '../paint-calculator/types';
import { aacCalculatorInputSchema } from '../aac-block-calculator/types';

/** Max length of the encoded `s` query value (chars). */
export const CONSTRUCTION_SHARE_MAX_ENCODED_LENGTH = 1800;

/** Max JSON payload size before encoding (bytes, utf8). */
export const CONSTRUCTION_SHARE_MAX_JSON_BYTES = 1200;

export const CONSTRUCTION_SHARE_QUERY_KEY = 's';

const BLOCKED_INPUT_KEYS = new Set([
  'projectid',
  'project_id',
  'userid',
  'user_id',
  'email',
  'phone',
  'mobile',
  'token',
  'password',
  'auth',
  'session',
  'name',
  'fullname',
  'address',
  'notes',
  'comment',
  'comments',
]);

export type ConstructionSharePayloadV1 = {
  v: 1;
  slug: string;
  i: Record<string, unknown>;
};

export type EncodeConstructionShareResult =
  { ok: true; encoded: string; hrefQuery: string } | { ok: false; error: string };

export type DecodeConstructionShareResult =
  { ok: true; slug: string; inputs: Record<string, unknown> } | { ok: false; error: string };

const SHARE_SCHEMAS: Record<string, z.ZodTypeAny> = {
  'cement-calculator': cementCalculatorInputSchema,
  'concrete-calculator': concreteCalculatorInputSchema,
  'cost-calculator': constructionCostInputSchema,
  'tile-calculator': tileCalculatorInputSchema,
  'steel-calculator': steelCalculatorInputSchema,
  'brick-calculator': brickCalculatorInputSchema,
  'sand-calculator': sandCalculatorInputSchema,
  'aggregate-calculator': aggregateCalculatorInputSchema,
  'plaster-calculator': plasterCalculatorInputSchema,
  'paint-calculator': paintCalculatorInputSchema,
  'aac-block-calculator': aacCalculatorInputSchema,
};

const genericShareInputsSchema = z
  .record(
    z.string().max(40),
    z.union([z.string().max(80), z.number().finite().min(-1e9).max(1e9), z.boolean(), z.null()]),
  )
  .superRefine((obj, ctx) => {
    if (Object.keys(obj).length > 40) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Too many keys',
      });
    }
  });

function stripBlockedKeys(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    const normalized = key.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (BLOCKED_INPUT_KEYS.has(normalized)) continue;
    if (normalized.includes('project') && normalized.includes('id')) continue;
    if (normalized.includes('user') && normalized.includes('id')) continue;
    out[key] = value;
  }
  return out;
}

function toBase64Url(json: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(json, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): string {
  if (encoded.length > CONSTRUCTION_SHARE_MAX_ENCODED_LENGTH) {
    throw new Error('Encoded share state too large');
  }
  if (!/^[A-Za-z0-9_-]+$/.test(encoded)) {
    throw new Error('Invalid share encoding');
  }
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(padded + pad, 'base64').toString('utf8');
  }
  return decodeURIComponent(escape(atob(padded + pad)));
}

function utf8ByteLength(s: string): number {
  if (typeof Buffer !== 'undefined') return Buffer.byteLength(s, 'utf8');
  return new TextEncoder().encode(s).length;
}

type ZodLike = z.ZodTypeAny;

function unwrapObjectSchema(schema: ZodLike): z.ZodObject<z.ZodRawShape> | null {
  let current: ZodLike = schema;
  while (current instanceof z.ZodEffects) {
    current = current._def.schema as ZodLike;
  }
  if (current instanceof z.ZodObject) return current;
  return null;
}

/**
 * Sanitize raw inputs for a calculator slug (allowlist + blocked keys).
 * Returns null if nothing usable remains.
 */
export function sanitizeConstructionShareInputs(
  calculatorSlug: string,
  raw: unknown,
): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const stripped = stripBlockedKeys(raw as Record<string, unknown>);
  const schema = SHARE_SCHEMAS[calculatorSlug] ?? genericShareInputsSchema;

  const full = schema.safeParse(stripped);
  if (full.success) {
    return full.data as Record<string, unknown>;
  }

  const objectSchema = unwrapObjectSchema(schema);
  if (objectSchema) {
    const partial = objectSchema.partial().safeParse(stripped);
    if (partial.success) {
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(partial.data as Record<string, unknown>)) {
        if (v !== undefined) cleaned[k] = v;
      }
      if (Object.keys(cleaned).length) return cleaned;
    }
  }

  const generic = genericShareInputsSchema.safeParse(stripped);
  if (generic.success) return generic.data;
  return null;
}

export function encodeConstructionShareState(
  calculatorSlug: string,
  inputs: unknown,
): EncodeConstructionShareResult {
  const sanitized = sanitizeConstructionShareInputs(calculatorSlug, inputs);
  if (!sanitized) {
    return { ok: false, error: 'Nothing safe to share' };
  }

  const payload: ConstructionSharePayloadV1 = {
    v: 1,
    slug: calculatorSlug.slice(0, 120),
    i: sanitized,
  };
  const json = JSON.stringify(payload);
  if (utf8ByteLength(json) > CONSTRUCTION_SHARE_MAX_JSON_BYTES) {
    return { ok: false, error: 'Share state too large' };
  }
  const encoded = toBase64Url(json);
  if (encoded.length > CONSTRUCTION_SHARE_MAX_ENCODED_LENGTH) {
    return { ok: false, error: 'Share URL would be too long' };
  }
  return {
    ok: true,
    encoded,
    hrefQuery: `${CONSTRUCTION_SHARE_QUERY_KEY}=${encoded}`,
  };
}

export function decodeConstructionShareState(
  encoded: string,
  expectedSlug?: string,
): DecodeConstructionShareResult {
  try {
    const json = fromBase64Url(encoded.trim());
    if (utf8ByteLength(json) > CONSTRUCTION_SHARE_MAX_JSON_BYTES + 64) {
      return { ok: false, error: 'Share state too large' };
    }
    const data = JSON.parse(json) as ConstructionSharePayloadV1;
    if (data.v !== 1 || typeof data.slug !== 'string' || !data.i || typeof data.i !== 'object') {
      return { ok: false, error: 'Invalid share payload' };
    }
    if (expectedSlug && data.slug !== expectedSlug) {
      return { ok: false, error: 'Share link is for a different calculator' };
    }
    const sanitized = sanitizeConstructionShareInputs(data.slug, data.i);
    if (!sanitized) {
      return { ok: false, error: 'Share inputs failed validation' };
    }
    return { ok: true, slug: data.slug, inputs: sanitized };
  } catch {
    return { ok: false, error: 'Could not decode share link' };
  }
}

/**
 * Build a shareable absolute or path URL for a calculator.
 * `pathname` must be a construction calculator path (no query).
 */
export function buildConstructionShareUrl(input: {
  pathname: string;
  calculatorSlug: string;
  inputs: unknown;
  origin?: string;
}): { ok: true; url: string; encoded: string } | { ok: false; error: string } {
  const encoded = encodeConstructionShareState(input.calculatorSlug, input.inputs);
  if (!encoded.ok) return encoded;
  const path = input.pathname.startsWith('/')
    ? input.pathname.split('?')[0]
    : `/${input.pathname.split('?')[0]}`;
  const url = `${input.origin ?? ''}${path}?${encoded.hrefQuery}`;
  return { ok: true, url, encoded: encoded.encoded };
}

/** Flat legacy/query aliases → inputs (cement / concrete / cost helpers). */
export function parseFlatConstructionShareParams(
  calculatorSlug: string,
  params: Record<string, string | undefined>,
): Record<string, unknown> | null {
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = params[k];
      if (v != null && String(v).trim() !== '') return String(v).trim().slice(0, 80);
    }
    return undefined;
  };
  const num = (...keys: string[]) => {
    const raw = pick(...keys);
    if (raw == null) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  };

  let draft: Record<string, unknown> = {};

  if (calculatorSlug === 'cement-calculator') {
    draft = {
      ...(pick('useCase', 'mix') ? { useCase: pick('useCase', 'mix') } : {}),
      ...(num('volume') != null ? { volume: num('volume') } : {}),
      ...(num('area') != null ? { area: num('area') } : {}),
      ...(pick('areaUnit', 'unit') ? { areaUnit: pick('areaUnit', 'unit') } : {}),
      ...(num('wastage', 'wastagePercent') != null
        ? { wastagePercent: num('wastage', 'wastagePercent') }
        : {}),
      ...(num('thickness') != null ? { thickness: num('thickness') } : {}),
      ...(num('bags', 'availableBags') != null
        ? { availableBags: num('bags', 'availableBags'), mode: 'reverse' }
        : {}),
    };
  } else if (calculatorSlug === 'concrete-calculator') {
    draft = {
      ...(pick('shape') ? { shape: pick('shape') } : {}),
      ...(num('length') != null ? { length: num('length') } : {}),
      ...(num('width') != null ? { width: num('width') } : {}),
      ...(num('height', 'depth') != null ? { height: num('height', 'depth') } : {}),
      ...(num('wastage', 'wastagePercent') != null
        ? { wastagePercent: num('wastage', 'wastagePercent') }
        : {}),
    };
  } else if (calculatorSlug === 'cost-calculator') {
    draft = {
      ...(pick('location') ? { location: pick('location') } : {}),
      ...(num('builtUpArea', 'area') != null ? { builtUpArea: num('builtUpArea', 'area') } : {}),
      ...(pick('areaUnit') ? { areaUnit: pick('areaUnit') } : {}),
      ...(num('floors') != null ? { floors: num('floors') } : {}),
      ...(pick('quality') ? { quality: pick('quality') } : {}),
      ...(pick('propertyType') ? { propertyType: pick('propertyType') } : {}),
      ...(pick('mode') ? { mode: pick('mode') } : {}),
    };
  } else {
    // Generic: only allowlisted primitive-looking keys already in SEO share list
    for (const [k, v] of Object.entries(params)) {
      if (v == null || v === '') continue;
      if (k === CONSTRUCTION_SHARE_QUERY_KEY) continue;
      if (k.length > 40) continue;
      const n = Number(v);
      draft[k] = Number.isFinite(n) && String(n) === v.trim() ? n : v.slice(0, 80);
    }
  }

  return sanitizeConstructionShareInputs(calculatorSlug, draft);
}

/**
 * Resolve share state from URL search params (`s=` preferred, flat params as fallback).
 */
export function resolveConstructionShareFromSearchParams(
  calculatorSlug: string,
  searchParams: Record<string, string | string[] | undefined | null> | URLSearchParams,
): Record<string, unknown> | null {
  const asRecord = (sp: typeof searchParams): Record<string, string | undefined> => {
    if (sp instanceof URLSearchParams) {
      const out: Record<string, string | undefined> = {};
      sp.forEach((v, k) => {
        out[k] = v;
      });
      return out;
    }
    const out: Record<string, string | undefined> = {};
    for (const [k, v] of Object.entries(sp)) {
      out[k] = Array.isArray(v) ? v[0] : (v ?? undefined);
    }
    return out;
  };

  const params = asRecord(searchParams);
  const encoded = params[CONSTRUCTION_SHARE_QUERY_KEY];
  if (encoded) {
    const decoded = decodeConstructionShareState(encoded, calculatorSlug);
    if (decoded.ok) return decoded.inputs;
  }
  return parseFlatConstructionShareParams(calculatorSlug, params);
}

export function listShareableConstructionCalculatorSlugs(): string[] {
  return Object.keys(SHARE_SCHEMAS);
}
