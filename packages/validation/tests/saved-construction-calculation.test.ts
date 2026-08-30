import { describe, expect, it } from 'vitest';

import {
  buildPersistedCalculationPayload,
  encodeMethodologyVersionLabel,
  recalculateSavedConstructionCalculation,
  readSavedMethodologyLabel,
  readSavedNormalizedInputs,
} from '../src/saved-construction-calculation';

describe('saved-construction-calculation', () => {
  it('encodes methodology labels stably', () => {
    expect(encodeMethodologyVersionLabel('2026.08.1')).toBe(20260801);
  });

  it('persists raw + normalized inputs and version label', () => {
    const payload = buildPersistedCalculationPayload({
      calculatorSlug: 'cement-calculator',
      methodologyKey: 'cement-calculator',
      methodologyVersionLabel: '2026.08.1',
      inputs: { area: '100' },
      normalizedInputs: { area: 100, mode: 'forward' },
      outputs: { bags: 40 },
      assumptions: ['dry factor 1.54'],
      currency: 'INR',
      sourcePath: '/construction/cement-calculator',
    });
    expect(payload.methodologyVersion).toBe(20260801);
    expect(payload.status).toBe('SUCCESS');
    expect((payload.inputs as { normalized: { area: number } }).normalized.area).toBe(100);
    expect(
      (payload.assumptions as { methodologyVersionLabel: string }).methodologyVersionLabel,
    ).toBe('2026.08.1');
  });

  it('recalculates cement and distinguishes original vs current', () => {
    const saved = buildPersistedCalculationPayload({
      calculatorSlug: 'cement-calculator',
      methodologyKey: 'cement-calculator',
      methodologyVersionLabel: '2026.08.1',
      inputs: {},
      normalizedInputs: {
        mode: 'forward',
        useCase: 'concrete',
        volume: 1,
        volumeUnit: 'm3',
        mixPreset: 'M20',
        wastagePercent: 5,
        bagSizeKg: 50,
      },
      outputs: { bags: 999 },
      assumptions: null,
      currency: 'INR',
    });

    const comparison = recalculateSavedConstructionCalculation({
      calculatorSlug: 'cement-calculator',
      inputs: saved.inputs,
      outputs: saved.outputs,
      assumptions: saved.assumptions,
    });

    expect(comparison.supported).toBe(true);
    expect(comparison.original.outputs).toEqual({ bags: 999 });
    expect(comparison.recalculated).not.toBeNull();
    expect(comparison.resultChanged).toBe(true);
    expect(readSavedMethodologyLabel({ assumptions: saved.assumptions })).toBe('2026.08.1');
    expect(readSavedNormalizedInputs({ inputs: saved.inputs }).volume).toBe(1);
  });
});
