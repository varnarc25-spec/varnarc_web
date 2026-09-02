import { describe, expect, it } from 'vitest';
import { illustrationTypeForCalculatorSlug } from '@/lib/calculator-illustrations';

describe('illustrationTypeForCalculatorSlug', () => {
  it('maps car loan and ownership tools', () => {
    expect(illustrationTypeForCalculatorSlug('car-loan')).toBe('car');
    expect(illustrationTypeForCalculatorSlug('fuel')).toBe('fuel');
    expect(illustrationTypeForCalculatorSlug('charging-cost')).toBe('ev');
    expect(illustrationTypeForCalculatorSlug('emi')).toBe('emi');
    expect(illustrationTypeForCalculatorSlug('sip')).toBe('sip');
  });
});
