import { describe, expect, it } from 'vitest';
import {
  buildConstructionNewsImpact,
  formatCementBagScenarioCopy,
  parseConstructionNewsImpactMeta,
} from '../src/construction-news-impact';

const sampleMeta = {
  schemaVersion: 1 as const,
  vertical: 'construction' as const,
  reportedNews: {
    articleSlug: 'cement-supply-update-hyderabad',
    articleTitle: 'Cement supply update in Hyderabad',
    articlePath: '/articles/cement-supply-update-hyderabad',
    publishedAt: '2026-08-15T10:00:00.000Z',
    summary: 'Editors note regional cement market commentary.',
  },
  affectedMaterials: [
    { materialKey: 'cement', assumedUnitChangeInr: 15, unit: 'bag' as const },
    { materialKey: 'steel', assumedUnitChangeInr: 2, unit: 'kg' as const },
  ],
  doesNotGuaranteePriceMove: true as const,
};

describe('parseConstructionNewsImpactMeta', () => {
  it('parses nested constructionNewsImpact metadata', () => {
    const parsed = parseConstructionNewsImpactMeta({
      constructionNewsImpact: sampleMeta,
    });
    expect(parsed?.affectedMaterials).toHaveLength(2);
    expect(parsed?.doesNotGuaranteePriceMove).toBe(true);
  });
});

describe('buildConstructionNewsImpact', () => {
  it('separates reported news, scenario assumption, and calculated impact', () => {
    const bundle = buildConstructionNewsImpact({
      meta: sampleMeta,
      projectRequirements: [
        { nameOrKey: 'cement', quantity: 620, unit: 'bag', source: 'boq_item' },
      ],
    });

    expect(bundle.reportedNews.kind).toBe('reported_news');
    expect(bundle.reportedNews.articleHref).toContain('/articles/');
    expect(bundle.reportedNews.materialPageHrefs.some((m) => m.materialKey === 'cement')).toBe(
      true,
    );

    expect(bundle.scenarios).toHaveLength(2);
    expect(bundle.scenarios[0]?.kind).toBe('scenario_assumption');
    expect(bundle.scenarios[0]?.disclaimer).toMatch(/does not guarantee/i);

    const cementImpact = bundle.projectImpacts.find((i) => i.materialKey === 'cement');
    expect(cementImpact?.status).toBe('ok');
    if (cementImpact?.status === 'ok') {
      expect(cementImpact.estimatedCostDeltaInr).toBe(9300);
      expect(cementImpact.copy).toMatch(/₹15 per bag/i);
      expect(cementImpact.copy).toMatch(/₹9,300/);
      expect(cementImpact.copy).not.toMatch(/will rise|guaranteed/i);
      expect(cementImpact.disclaimer).toMatch(/does not guarantee/i);
    }

    const steelImpact = bundle.projectImpacts.find((i) => i.materialKey === 'steel');
    expect(steelImpact?.status).toBe('unavailable');
    if (steelImpact?.status === 'unavailable') {
      expect(steelImpact.reason).toMatch(/No saved project quantity/i);
    }

    expect(bundle.qualification).toMatch(/does not guarantee/i);
  });

  it('does not calculate when quantities are unavailable', () => {
    const bundle = buildConstructionNewsImpact({
      meta: sampleMeta,
      projectRequirements: [],
    });
    expect(bundle.projectImpacts.every((i) => i.status === 'unavailable')).toBe(true);
  });

  it('skips impact when unit cannot be reconciled', () => {
    const bundle = buildConstructionNewsImpact({
      meta: sampleMeta,
      projectRequirements: [
        { nameOrKey: 'cement', quantity: 31000, unit: 'kg', source: 'project_item' },
      ],
    });
    const cementImpact = bundle.projectImpacts.find((i) => i.materialKey === 'cement');
    expect(cementImpact?.status).toBe('unavailable');
    if (cementImpact?.status === 'unavailable') {
      expect(cementImpact.reason).toMatch(/unit does not match/i);
    }
  });
});

describe('formatCementBagScenarioCopy', () => {
  it('matches the product example arithmetic', () => {
    expect(formatCementBagScenarioCopy({ bagDeltaInr: 15, bags: 620 })).toBe(
      "If cement increases ₹15 per bag, your project's estimated cement cost would increase by approximately ₹9,300.",
    );
  });
});
