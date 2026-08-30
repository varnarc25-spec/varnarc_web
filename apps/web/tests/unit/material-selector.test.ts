import { describe, expect, it } from 'vitest';

import {
  MATERIAL_SELECTOR_TASKS,
  getSelectorTask,
  recommendForCementFocus,
  runSelector,
} from '@/lib/construction/material-selector/catalog';

describe('material selector', () => {
  it('covers required tasks', () => {
    expect(MATERIAL_SELECTOR_TASKS.map((t) => t.id)).toEqual([
      'foundation',
      'rcc',
      'masonry',
      'plaster',
      'flooring',
      'painting',
      'windows',
      'roofing',
    ]);
  });

  it('returns educational suggestions with required fields', () => {
    const masonry = getSelectorTask('masonry')!;
    const answers: Record<string, string> = {};
    for (const q of masonry.questions) {
      answers[q.id] = q.options[0]!.id;
    }
    const results = runSelector('masonry', answers);
    expect(results.length).toBeGreaterThan(0);
    for (const s of results) {
      expect(s.whyFits.length).toBeGreaterThan(20);
      expect(s.advantages.length).toBeGreaterThan(0);
      expect(s.limitations.length).toBeGreaterThan(0);
      expect(s.specsToVerify.length).toBeGreaterThan(0);
    }
  });

  it('supports cement-style context questions without brands', () => {
    const results = recommendForCementFocus({
      application: 'structural_concrete',
      environment: 'coastal',
      exposure: 'wet',
      characteristics: 'early_strength',
    });
    expect(results.some((r) => /OPC|cement/i.test(r.category))).toBe(true);
    const blob = JSON.stringify(results).toLowerCase();
    expect(blob.includes('ultratech') || blob.includes('ambuja')).toBe(false);
  });
});
