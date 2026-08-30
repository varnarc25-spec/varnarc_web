import { describe, expect, it } from 'vitest';
import {
  buildConstructionShareUrl,
  decodeConstructionShareState,
  encodeConstructionShareState,
  resolveConstructionShareFromSearchParams,
  sanitizeConstructionShareInputs,
} from '../src/construction-calculation-share';

describe('construction-calculation-share', () => {
  const cementInputs = {
    mode: 'forward' as const,
    useCase: 'concrete' as const,
    volume: 2.5,
    volumeUnit: 'm3' as const,
    mixPreset: 'M20' as const,
    wastagePercent: 5,
    bagSizeKg: 50,
  };

  it('encodes and decodes round-trip without private fields', () => {
    const encoded = encodeConstructionShareState('cement-calculator', {
      ...cementInputs,
      projectId: '11111111-1111-1111-1111-111111111111',
      userId: '22222222-2222-2222-2222-222222222222',
      email: 'x@y.com',
    });
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) return;
    const decoded = decodeConstructionShareState(encoded.encoded, 'cement-calculator');
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    expect(decoded.inputs.volume).toBe(2.5);
    expect(decoded.inputs).not.toHaveProperty('projectId');
    expect(decoded.inputs).not.toHaveProperty('userId');
    expect(decoded.inputs).not.toHaveProperty('email');
  });

  it('rejects injection / oversized / invalid encoding', () => {
    expect(decodeConstructionShareState('!!!not-base64!!!').ok).toBe(false);
    expect(
      sanitizeConstructionShareInputs('cement-calculator', {
        useCase: 'concrete',
        volume: Number.POSITIVE_INFINITY,
      }),
    ).toBeNull();
  });

  it('builds share URL and resolves flat params', () => {
    const built = buildConstructionShareUrl({
      pathname: '/construction/cement-calculator',
      calculatorSlug: 'cement-calculator',
      inputs: cementInputs,
      origin: 'https://varnarc.com',
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.url).toMatch(/^https:\/\/varnarc\.com\/construction\/cement-calculator\?s=/);

    const flat = resolveConstructionShareFromSearchParams('cement-calculator', {
      volume: '2.5',
      useCase: 'concrete',
    });
    expect(flat?.volume).toBe(2.5);
    expect(flat?.useCase).toBe('concrete');
  });

  it('rejects cross-calculator share payload', () => {
    const encoded = encodeConstructionShareState('cement-calculator', cementInputs);
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) return;
    const decoded = decodeConstructionShareState(encoded.encoded, 'tile-calculator');
    expect(decoded.ok).toBe(false);
  });
});
