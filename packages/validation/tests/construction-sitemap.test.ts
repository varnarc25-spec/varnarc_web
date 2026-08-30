import { describe, expect, it } from 'vitest';
import {
  CONSTRUCTION_SITEMAP_CALCULATOR_PATHS,
  CONSTRUCTION_SITEMAP_CORE_PATHS,
  CONSTRUCTION_SITEMAP_SEGMENTS,
  filterConstructionSitemapPaths,
  isConstructionSitemapExcludedPath,
  isConstructionSitemapSegment,
  listConstructionSitemapStaticPaths,
} from '../src/construction-sitemap';

describe('construction-sitemap', () => {
  it('lists seven construction segments', () => {
    expect(CONSTRUCTION_SITEMAP_SEGMENTS).toHaveLength(7);
    expect(isConstructionSitemapSegment('construction-calculators')).toBe(true);
    expect(isConstructionSitemapSegment('construction')).toBe(false);
  });

  it('excludes private, saved, alert, and admin paths', () => {
    expect(isConstructionSitemapExcludedPath('/construction/projects')).toBe(true);
    expect(isConstructionSitemapExcludedPath('/construction/project/abc')).toBe(true);
    expect(isConstructionSitemapExcludedPath('/construction/saved-calculations')).toBe(true);
    expect(isConstructionSitemapExcludedPath('/construction/price-alerts')).toBe(true);
    expect(isConstructionSitemapExcludedPath('/admin/seo')).toBe(true);
    expect(isConstructionSitemapExcludedPath('/construction/cost-calculator')).toBe(false);
  });

  it('strips query-like paths and dedupes', () => {
    expect(
      filterConstructionSitemapPaths([
        '/construction/cost-calculator?city=hyd',
        '/construction/cost-calculator',
        '/construction/cost-calculator/',
        '/construction/projects',
      ]),
    ).toEqual(['/construction/cost-calculator']);
  });

  it('keeps core and calculator paths disjoint', () => {
    const core = new Set(listConstructionSitemapStaticPaths('construction-core'));
    const calcs = listConstructionSitemapStaticPaths('construction-calculators');
    for (const p of calcs) {
      expect(core.has(p)).toBe(false);
    }
    expect(CONSTRUCTION_SITEMAP_CORE_PATHS.length).toBeGreaterThan(10);
    expect(CONSTRUCTION_SITEMAP_CALCULATOR_PATHS.length).toBeGreaterThan(20);
  });

  it('emits material guides and editorial comparisons in their segments', () => {
    expect(listConstructionSitemapStaticPaths('construction-materials')).toContain(
      '/construction/materials/cement',
    );
    expect(listConstructionSitemapStaticPaths('construction-comparisons')).toContain(
      '/construction/compare/aac-vs-brick',
    );
  });
});
