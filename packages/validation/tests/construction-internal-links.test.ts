import { describe, expect, it } from 'vitest';
import {
  CONSTRUCTION_INTERNAL_LINK_CAPS,
  resolveConstructionInternalLinks,
  toConstructionRelatedLinkBuckets,
} from '../src/construction-internal-links';

describe('construction-internal-links', () => {
  it('resolves calculator → materials/calculators with caps', () => {
    const result = resolveConstructionInternalLinks({ entityId: 'calc:cement' });
    const calcSection = result.sections.find((s) => s.relation === 'related_calculators');
    const matSection = result.sections.find((s) => s.relation === 'related_materials');
    expect(matSection?.items.some((i) => i.id === 'mat:cement')).toBe(true);
    expect(calcSection?.items.length ?? 0).toBeLessThanOrEqual(
      CONSTRUCTION_INTERNAL_LINK_CAPS.related_calculators,
    );
    expect(result.flat.every((i) => i.href !== '/construction/cement-calculator')).toBe(true);
  });

  it('respects editorial exclude and hide', () => {
    const excluded = resolveConstructionInternalLinks({
      entityId: 'calc:cement',
      overrides: { excludeIds: ['mat:cement'] },
    });
    expect(excluded.flat.some((i) => i.id === 'mat:cement')).toBe(false);

    const hidden = resolveConstructionInternalLinks({
      entityId: 'calc:cement',
      overrides: { hideAll: true },
    });
    expect(hidden.sections).toHaveLength(0);
  });

  it('does not expand when depth exceeds maxDepth', () => {
    const deep = resolveConstructionInternalLinks({
      entityId: 'calc:cement',
      depth: 2,
      maxDepth: 1,
    });
    expect(deep.flat).toHaveLength(0);
  });

  it('maps material → calculator and price', () => {
    const result = resolveConstructionInternalLinks({ entityId: 'mat:steel' });
    expect(result.flat.some((i) => i.id === 'calc:steel')).toBe(true);
    expect(result.flat.some((i) => i.id === 'price:steel')).toBe(true);
  });

  it('maps guide → calculators and location → cost/prices', () => {
    const guide = resolveConstructionInternalLinks({ entityId: 'guide:cement' });
    expect(guide.flat.some((i) => i.kind === 'calculator')).toBe(true);

    const loc = resolveConstructionInternalLinks({ entityId: 'loc:hyderabad-cost' });
    expect(loc.flat.some((i) => i.id === 'calc:cost' || i.kind === 'price')).toBe(true);
  });

  it('builds RelatedLinks buckets without stuffing', () => {
    const buckets = toConstructionRelatedLinkBuckets(
      resolveConstructionInternalLinks({ entityId: 'calc:cost' }),
    );
    const total =
      buckets.calculators.length +
      buckets.materials.length +
      buckets.comparisons.length +
      buckets.cityPages.length +
      buckets.guides.length;
    expect(total).toBeLessThanOrEqual(16);
  });
});
