'use client';

/**
 * Helpers for construction calculators to publish a universal save payload.
 * CalculatorShell → CalculatorSaveSlot reads the store automatically.
 */

import { setConstructionSavePayload } from '@/lib/construction/save-calculation/store';
import { recordRecentConstructionToolUse } from '@/lib/construction/recent-tools';

export function publishConstructionCalculationSave(input: {
  calculatorSlug: string;
  methodologyKey?: string;
  methodologyVersionLabel: string;
  inputs: Record<string, unknown>;
  normalizedInputs?: Record<string, unknown>;
  outputs: unknown;
  assumptions?: unknown;
  unitSummary?: unknown;
  name?: string | null;
  currency?: string;
  sourcePath?: string;
}) {
  setConstructionSavePayload({
    calculatorSlug: input.calculatorSlug,
    methodologyKey: input.methodologyKey ?? input.calculatorSlug,
    methodologyVersionLabel: input.methodologyVersionLabel,
    inputs: input.inputs,
    normalizedInputs: input.normalizedInputs ?? input.inputs,
    outputs: input.outputs as never,
    assumptions: input.assumptions ?? null,
    unitSummary: input.unitSummary ?? null,
    name: input.name ?? null,
    currency: input.currency ?? 'INR',
    sourcePath: input.sourcePath ?? null,
  });

  recordRecentConstructionToolUse({
    calculatorSlug: input.calculatorSlug,
    sourcePath: input.sourcePath,
    outputs: input.outputs,
    unitSummary: input.unitSummary,
  });
}

export function clearConstructionCalculationSave() {
  setConstructionSavePayload(null);
}
