import { describe, expect, it } from 'vitest';

import {
  CONSTRUCTION_GUIDE_CLUSTERS,
  buildClusterRelatedLinkProps,
  buildGuideClusterLanding,
  canIndexGuideCluster,
  resolveGuideClusterSections,
} from '../src/construction-guide-clusters';

describe('construction-guide-clusters', () => {
  it('indexes all curated topic clusters', () => {
    expect(CONSTRUCTION_GUIDE_CLUSTERS.length).toBe(11);
    for (const c of CONSTRUCTION_GUIDE_CLUSTERS) {
      expect(canIndexGuideCluster(c.slug).indexable).toBe(true);
    }
  });

  it('cement pillar resolves calculators, comparison, prices, glossary', () => {
    const landing = buildGuideClusterLanding('cement');
    expect(landing).not.toBeNull();
    const keys = landing!.sections.map((s) => s.key);
    expect(keys).toContain('calculators');
    expect(keys).toContain('comparisons');
    expect(keys).toContain('glossary');
    expect(keys).toContain('prices');
    expect(keys).toContain('materials');
    expect(keys).toContain('calcLandings');

    const labels = landing!.allLinks.map((l) => l.label);
    expect(labels).toContain('Cement calculator');
    expect(labels).toContain('OPC vs PPC');
    expect(labels).toContain('Cement prices');

    // Unpublished supporting guides must not appear in auto blocks
    expect(labels).not.toContain('Cement for concrete');
    expect(labels).not.toContain('Cement for plaster');
  });

  it('allows editorial override to replace or hide a section', () => {
    const cluster = CONSTRUCTION_GUIDE_CLUSTERS.find((c) => c.slug === 'cement')!;
    const hidden = resolveGuideClusterSections(cluster, { comparisons: null });
    expect(hidden.find((s) => s.key === 'comparisons')).toBeUndefined();

    const replaced = resolveGuideClusterSections(cluster, {
      calculators: [
        {
          id: 'custom',
          kind: 'calculator',
          href: '/construction/cement-calculator',
          label: 'Editorial cement calc',
          published: true,
        },
      ],
    });
    const calc = replaced.find((s) => s.key === 'calculators');
    expect(calc?.source).toBe('override');
    expect(calc?.items).toHaveLength(1);
    expect(calc?.items[0]?.label).toBe('Editorial cement calc');
  });

  it('hideAutoLinks clears all sections', () => {
    const landing = buildGuideClusterLanding('steel', { hideAutoLinks: true });
    expect(landing!.sections).toHaveLength(0);
  });

  it('buildClusterRelatedLinkProps maps sections for UI composer', () => {
    const props = buildClusterRelatedLinkProps('boq');
    expect(props).not.toBeNull();
    expect(props!.calculators.some((c) => c.href.includes('boq'))).toBe(true);
    expect(props!.guides.every((g) => g.href.startsWith('/'))).toBe(true);
  });

  it('does not treat taxonomy as article body generator', () => {
    for (const c of CONSTRUCTION_GUIDE_CLUSTERS) {
      // Pillar intro is short hub copy — not a long auto article
      expect(c.pillarIntro.length).toBeLessThan(800);
      const unpublished = c.resources.filter((r) => !r.published);
      for (const u of unpublished) {
        expect(u.kind === 'supporting_guide' || u.blurb).toBeTruthy();
      }
    }
  });
});
