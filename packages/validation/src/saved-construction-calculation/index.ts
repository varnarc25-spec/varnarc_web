/**
 * Universal construction "Save Calculation" — payload shapes, version encoding,
 * and recalculate-with-latest-rates helpers.
 *
 * Distinguishes original saved outputs from a fresh recalculation when
 * methodology/rates change.
 */

import { z } from 'zod';
import { calculateCementQuantity } from '../cement-calculator/calculate';
import { CEMENT_CALC_VERSION } from '../cement-calculator/rates';
import { calculateSteelWeight } from '../steel-calculator/calculate';
import { STEEL_CALC_VERSION } from '../steel-calculator/rates';
import { calculateConcreteQuantity } from '../concrete-calculator/calculate';
import { CONCRETE_CALC_VERSION } from '../concrete-calculator/rates';
import { calculateConstructionCost } from '../construction-cost/calculate';
import { COST_CALC_VERSION } from '../construction-cost/rates';
import { calculatePaintQuantity } from '../paint-calculator/calculate';
import { PAINT_CALC_VERSION } from '../paint-calculator/rates';
import { calculateBrickQuantity } from '../brick-calculator/calculate';
import { BRICK_CALC_VERSION } from '../brick-calculator/rates';
import { calculateSandQuantity } from '../sand-calculator/calculate';
import { SAND_CALC_VERSION } from '../sand-calculator/rates';
import { calculateAggregateQuantity } from '../aggregate-calculator/calculate';
import { AGGREGATE_CALC_VERSION } from '../aggregate-calculator/rates';
import { calculatePlasterQuantity } from '../plaster-calculator/calculate';
import { PLASTER_CALC_VERSION } from '../plaster-calculator/rates';
import { calculateTileQuantity } from '../tile-calculator/calculate';
import { TILE_CALC_VERSION } from '../tile-calculator/rates';
import { calculateAacBlockQuantity } from '../aac-block-calculator/calculate';
import { AAC_CALC_VERSION } from '../aac-block-calculator/rates';

export const SAVED_CONSTRUCTION_CALC_PENDING_KEY = 'varnarc.pending.construction-calculation.v1';

export const saveConstructionCalculationSchema = z.object({
  projectId: z.string().uuid().optional().nullable(),
  calculatorSlug: z.string().min(1).max(120),
  name: z.string().max(150).optional().nullable(),
  methodologyKey: z.string().min(1).max(80),
  methodologyVersionLabel: z.string().min(1).max(40),
  inputs: z.record(z.unknown()),
  normalizedInputs: z.record(z.unknown()).optional().nullable(),
  assumptions: z.unknown().optional().nullable(),
  outputs: z.unknown().optional().nullable(),
  unitSummary: z.unknown().optional().nullable(),
  currency: z.string().length(3).default('INR'),
  /** Calculator page path for post-login restore */
  sourcePath: z.string().max(300).optional().nullable(),
});

export type SaveConstructionCalculationInput = z.infer<typeof saveConstructionCalculationSchema>;

export const updateSavedConstructionCalculationSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  projectId: z.string().uuid().optional().nullable(),
});

export type UpdateSavedConstructionCalculationInput = z.infer<
  typeof updateSavedConstructionCalculationSchema
>;

/** Encode semver-like labels (2026.08.1) into Int for DB methodologyVersion. */
export function encodeMethodologyVersionLabel(label: string): number {
  const m = label.trim().match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
  if (m?.[1] && m[2] && m[3]) {
    return Number(m[1]) * 10_000 + Number(m[2].padStart(2, '0')) * 100 + Number(m[3]);
  }
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  }
  return hash || 1;
}

export function buildPersistedCalculationPayload(input: SaveConstructionCalculationInput) {
  const parsed = saveConstructionCalculationSchema.parse(input);
  return {
    projectId: parsed.projectId ?? null,
    calculatorSlug: parsed.calculatorSlug,
    name: parsed.name ?? defaultSaveName(parsed.calculatorSlug),
    methodologyKey: parsed.methodologyKey,
    methodologyVersion: encodeMethodologyVersionLabel(parsed.methodologyVersionLabel),
    inputs: {
      raw: parsed.inputs,
      normalized: parsed.normalizedInputs ?? parsed.inputs,
      sourcePath: parsed.sourcePath ?? null,
    },
    assumptions: {
      value: parsed.assumptions ?? null,
      methodologyVersionLabel: parsed.methodologyVersionLabel,
    },
    outputs: {
      result: parsed.outputs ?? null,
      unitSummary: parsed.unitSummary ?? null,
      methodologyVersionLabel: parsed.methodologyVersionLabel,
      savedAt: new Date().toISOString(),
    },
    unitSummary: parsed.unitSummary ?? null,
    currency: parsed.currency,
    status: 'SUCCESS' as const,
  };
}

export function defaultSaveName(calculatorSlug: string): string {
  const label = calculatorSlug
    .replace(/-calculator$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return `${label} · ${new Date().toLocaleDateString('en-IN')}`;
}

export function readSavedMethodologyLabel(row: {
  assumptions?: unknown;
  outputs?: unknown;
}): string | null {
  const a = row.assumptions as { methodologyVersionLabel?: string } | null;
  if (a?.methodologyVersionLabel) return a.methodologyVersionLabel;
  const o = row.outputs as { methodologyVersionLabel?: string } | null;
  return o?.methodologyVersionLabel ?? null;
}

export function readSavedRawInputs(row: { inputs?: unknown }): Record<string, unknown> {
  const envelope = row.inputs as
    | { raw?: Record<string, unknown>; normalized?: Record<string, unknown> }
    | Record<string, unknown>
    | null;
  if (!envelope || typeof envelope !== 'object') return {};
  if ('raw' in envelope && envelope.raw && typeof envelope.raw === 'object') {
    return envelope.raw as Record<string, unknown>;
  }
  return envelope as Record<string, unknown>;
}

export function readSavedNormalizedInputs(row: { inputs?: unknown }): Record<string, unknown> {
  const envelope = row.inputs as {
    normalized?: Record<string, unknown>;
    raw?: Record<string, unknown>;
  } | null;
  if (envelope?.normalized && typeof envelope.normalized === 'object') {
    return envelope.normalized;
  }
  return readSavedRawInputs(row);
}

export function readSavedSourcePath(row: { inputs?: unknown }): string | null {
  const envelope = row.inputs as { sourcePath?: string | null } | null;
  return envelope?.sourcePath ?? null;
}

export function readSavedResult(row: { outputs?: unknown }): unknown {
  const o = row.outputs as { result?: unknown } | null;
  if (o && typeof o === 'object' && 'result' in o) return o.result;
  return row.outputs;
}

export type RecalculateConstructionSavedResult = {
  supported: boolean;
  calculatorSlug: string;
  original: {
    methodologyVersionLabel: string | null;
    outputs: unknown;
  };
  recalculated: {
    methodologyVersionLabel: string;
    outputs: unknown;
  } | null;
  methodologyChanged: boolean;
  /** True when recalculated outputs differ from original (shallow JSON compare). */
  resultChanged: boolean;
  error?: string;
};

type RecalcFn = (normalizedInputs: Record<string, unknown>) => {
  version: string;
  outputs: unknown;
};

const RECALC_REGISTRY: Record<string, RecalcFn> = {
  'cement-calculator': (inputs) => ({
    version: CEMENT_CALC_VERSION,
    outputs: calculateCementQuantity(inputs as never),
  }),
  'steel-calculator': (inputs) => ({
    version: STEEL_CALC_VERSION,
    outputs: calculateSteelWeight(inputs as never),
  }),
  'concrete-calculator': (inputs) => ({
    version: CONCRETE_CALC_VERSION,
    outputs: calculateConcreteQuantity(inputs as never),
  }),
  'cost-calculator': (inputs) => ({
    version: COST_CALC_VERSION,
    outputs: calculateConstructionCost(inputs as never),
  }),
  'paint-calculator': (inputs) => ({
    version: PAINT_CALC_VERSION,
    outputs: calculatePaintQuantity(inputs as never),
  }),
  'brick-calculator': (inputs) => ({
    version: BRICK_CALC_VERSION,
    outputs: calculateBrickQuantity(inputs as never),
  }),
  'sand-calculator': (inputs) => ({
    version: SAND_CALC_VERSION,
    outputs: calculateSandQuantity(inputs as never),
  }),
  'aggregate-calculator': (inputs) => ({
    version: AGGREGATE_CALC_VERSION,
    outputs: calculateAggregateQuantity(inputs as never),
  }),
  'plaster-calculator': (inputs) => ({
    version: PLASTER_CALC_VERSION,
    outputs: calculatePlasterQuantity(inputs as never),
  }),
  'tile-calculator': (inputs) => ({
    version: TILE_CALC_VERSION,
    outputs: calculateTileQuantity(inputs as never),
  }),
  'aac-block-calculator': (inputs) => ({
    version: AAC_CALC_VERSION,
    outputs: calculateAacBlockQuantity(inputs as never),
  }),
};

export function isRecalculateSupported(calculatorSlug: string): boolean {
  return Boolean(RECALC_REGISTRY[calculatorSlug]);
}

export function listRecalculateSupportedSlugs(): string[] {
  return Object.keys(RECALC_REGISTRY);
}

/**
 * Re-run saved normalized inputs through the current engine.
 * Keeps original saved outputs intact for side-by-side comparison.
 */
export function recalculateSavedConstructionCalculation(row: {
  calculatorSlug: string;
  inputs?: unknown;
  outputs?: unknown;
  assumptions?: unknown;
}): RecalculateConstructionSavedResult {
  const originalLabel = readSavedMethodologyLabel(row);
  const originalOutputs = readSavedResult(row);
  const fn = RECALC_REGISTRY[row.calculatorSlug];

  if (!fn) {
    return {
      supported: false,
      calculatorSlug: row.calculatorSlug,
      original: { methodologyVersionLabel: originalLabel, outputs: originalOutputs },
      recalculated: null,
      methodologyChanged: false,
      resultChanged: false,
      error: 'Recalculate is not supported for this calculator yet.',
    };
  }

  try {
    const normalized = readSavedNormalizedInputs(row);
    const { version, outputs } = fn(normalized);
    const methodologyChanged = Boolean(originalLabel && originalLabel !== version);
    const resultChanged =
      JSON.stringify(stripVolatile(originalOutputs)) !== JSON.stringify(stripVolatile(outputs));

    return {
      supported: true,
      calculatorSlug: row.calculatorSlug,
      original: { methodologyVersionLabel: originalLabel, outputs: originalOutputs },
      recalculated: { methodologyVersionLabel: version, outputs },
      methodologyChanged,
      resultChanged: methodologyChanged || resultChanged,
    };
  } catch (err) {
    return {
      supported: true,
      calculatorSlug: row.calculatorSlug,
      original: { methodologyVersionLabel: originalLabel, outputs: originalOutputs },
      recalculated: null,
      methodologyChanged: false,
      resultChanged: false,
      error: err instanceof Error ? err.message : 'Recalculate failed',
    };
  }
}

function stripVolatile(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  const clone = { ...(value as Record<string, unknown>) };
  delete clone.disclaimer;
  return clone;
}

/** Client-side pending payload (pre-auth). */
export type PendingConstructionSave = SaveConstructionCalculationInput & {
  savedAtClient: string;
};
