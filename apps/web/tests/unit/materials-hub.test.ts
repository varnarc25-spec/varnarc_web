import { describe, expect, it } from 'vitest';

import {
  MATERIAL_CATEGORIES,
  getMaterialGuide,
  listMaterialSlugs,
  materialsInCategory,
} from '@/lib/construction/materials-hub/catalog';

describe('materials hub catalog', () => {
  it('defines all required categories', () => {
    expect(MATERIAL_CATEGORIES.map((c) => c.id)).toEqual([
      'structural',
      'masonry',
      'finishing',
      'interior',
      'exterior',
      'electrical',
      'plumbing',
    ]);
  });

  it('includes cement guide with core sections', () => {
    const cement = getMaterialGuide('cement');
    expect(cement).toBeTruthy();
    expect(cement!.calculator?.href).toBe('/construction/cement-calculator');
    expect(cement!.faqs.length).toBeGreaterThanOrEqual(2);
    expect(cement!.commonUses.length).toBeGreaterThan(0);
    expect(cement!.methodology.length).toBeGreaterThan(20);
  });

  it('covers every category with at least one material', () => {
    for (const cat of MATERIAL_CATEGORIES) {
      expect(materialsInCategory(cat.id).length).toBeGreaterThan(0);
    }
  });

  it('lists unique slugs', () => {
    const slugs = listMaterialSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toContain('cement');
    expect(slugs).toContain('aac-blocks');
    expect(slugs).toContain('pvc-pipes');
  });
});
