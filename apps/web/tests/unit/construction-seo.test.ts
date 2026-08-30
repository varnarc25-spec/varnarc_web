import { describe, expect, it } from 'vitest';
import {
  buildConstructionJsonLdGraph,
  constructionCalculatorCanonicalPath,
  constructionCanonicalPath,
  formatConstructionLastUpdated,
  isConstructionCalculatorPath,
  resolveConstructionIndexing,
} from '@/lib/construction/seo';
import { CONSTRUCTION_PAGE_DEFAULTS } from '@/lib/construction/seo-pages';
import { buildConstructionPageMetadata } from '@/lib/construction/seo';

describe('constructionCanonicalPath', () => {
  it('strips trailing slash and normalizes compare paths', () => {
    expect(constructionCanonicalPath('/construction/materials/')).toBe('/construction/materials');
    expect(constructionCanonicalPath('/construction/compare')).toBe('/construction/compare');
    expect(constructionCanonicalPath('/construction/compare/')).toBe('/construction/compare');
  });

  it('keeps calculator paths clean for share URLs', () => {
    expect(constructionCalculatorCanonicalPath('/construction/cement-calculator')).toBe(
      '/construction/cement-calculator',
    );
    expect(constructionCalculatorCanonicalPath('/construction/estimate')).toBe(
      '/construction/estimate',
    );
  });
});

describe('resolveConstructionIndexing', () => {
  it('indexes clean public construction pages', () => {
    const result = resolveConstructionIndexing({ pathname: '/construction/materials' });
    expect(result.index).toBe(true);
    expect(result.follow).toBe(true);
    expect(result.canonicalPath).toBe('/construction/materials');
    expect(result.reason).toBe('indexable');
  });

  it('noindexes filter/query listing variants and canonicalizes to clean path', () => {
    const result = resolveConstructionIndexing({
      pathname: '/construction/materials',
      searchParams: { categoryId: 'abc', sort: 'price' },
    });
    expect(result.index).toBe(false);
    expect(result.follow).toBe(true);
    expect(result.canonicalPath).toBe('/construction/materials');
    expect(result.reason).toBe('filter_query');
  });

  it('noindexes compare URLs with ids while canonical stays /construction/compare', () => {
    const result = resolveConstructionIndexing({
      pathname: '/construction/compare',
      searchParams: { ids: 'id1,id2' },
    });
    expect(result.index).toBe(false);
    expect(result.canonicalPath).toBe('/construction/compare');
    expect(result.reason).toBe('filter_query');
  });

  it('indexes editorial compare slug pages with their own canonical', () => {
    expect(constructionCanonicalPath('/construction/compare/aac-vs-brick')).toBe(
      '/construction/compare/aac-vs-brick',
    );
    const result = resolveConstructionIndexing({
      pathname: '/construction/compare/aac-vs-brick',
    });
    expect(result.index).toBe(true);
    expect(result.canonicalPath).toBe('/construction/compare/aac-vs-brick');
  });

  it('indexes price landing paths and noindexes filtered hub queries', () => {
    expect(constructionCanonicalPath('/construction/prices/cement/hyderabad')).toBe(
      '/construction/prices/cement/hyderabad',
    );
    const landing = resolveConstructionIndexing({
      pathname: '/construction/prices/cement/hyderabad',
    });
    expect(landing.index).toBe(true);
    expect(landing.canonicalPath).toBe('/construction/prices/cement/hyderabad');

    const filtered = resolveConstructionIndexing({
      pathname: '/construction/prices',
      searchParams: { material: 'cement', location: 'hyderabad' },
    });
    expect(filtered.index).toBe(false);
    expect(filtered.canonicalPath).toBe('/construction/prices');
    expect(filtered.reason).toBe('filter_query');
  });

  it('noindexes calculator share-parameter URLs with clean canonical', () => {
    const result = resolveConstructionIndexing({
      pathname: '/calculators/concrete',
      searchParams: { volume: '10', unit: 'm3', wastage: '5' },
    });
    expect(isConstructionCalculatorPath('/calculators/concrete')).toBe(true);
    expect(result.index).toBe(false);
    expect(result.follow).toBe(true);
    expect(result.canonicalPath).toBe('/calculators/concrete');
    expect(result.reason).toBe('calculator_share_params');
  });

  it('indexes clean cost-calculator and noindexes share params', () => {
    expect(isConstructionCalculatorPath('/construction/cost-calculator')).toBe(true);
    const clean = resolveConstructionIndexing({ pathname: '/construction/cost-calculator' });
    expect(clean.index).toBe(true);
    expect(clean.canonicalPath).toBe('/construction/cost-calculator');

    const shared = resolveConstructionIndexing({
      pathname: '/construction/cost-calculator',
      searchParams: { builtUpArea: '1500', floors: '2' },
    });
    expect(shared.index).toBe(false);
    expect(shared.canonicalPath).toBe('/construction/cost-calculator');
    expect(shared.reason).toBe('calculator_share_params');
  });

  it('indexes renovation cost calculator and noindexes share params', () => {
    expect(isConstructionCalculatorPath('/construction/renovation-cost-calculator')).toBe(true);
    const clean = resolveConstructionIndexing({
      pathname: '/construction/renovation-cost-calculator',
    });
    expect(clean.index).toBe(true);
    const shared = resolveConstructionIndexing({
      pathname: '/construction/renovation-cost-calculator',
      searchParams: { renovationArea: '1000', work: 'painting,flooring' },
    });
    expect(shared.index).toBe(false);
    expect(shared.reason).toBe('calculator_share_params');
  });

  it('indexes affordability calculator and noindexes share params', () => {
    expect(isConstructionCalculatorPath('/construction/affordability-calculator')).toBe(true);
    const clean = resolveConstructionIndexing({
      pathname: '/construction/affordability-calculator',
    });
    expect(clean.index).toBe(true);
    const shared = resolveConstructionIndexing({
      pathname: '/construction/affordability-calculator',
      searchParams: { projectCost: '5000000', savings: '2000000' },
    });
    expect(shared.index).toBe(false);
    expect(shared.reason).toBe('calculator_share_params');
  });

  it('indexes scenario-compare editorial page but noindexes shared payloads', () => {
    expect(isConstructionCalculatorPath('/construction/scenario-compare')).toBe(true);
    const clean = resolveConstructionIndexing({ pathname: '/construction/scenario-compare' });
    expect(clean.index).toBe(true);
    const shared = resolveConstructionIndexing({
      pathname: '/construction/scenario-compare',
      searchParams: { s: 'abc123payload' },
    });
    expect(shared.index).toBe(false);
    expect(shared.canonicalPath).toBe('/construction/scenario-compare');
    expect(shared.reason).toBe('calculator_share_params');
  });

  it('indexes cost-change-simulator clean page', () => {
    expect(isConstructionCalculatorPath('/construction/cost-change-simulator')).toBe(true);
    const clean = resolveConstructionIndexing({
      pathname: '/construction/cost-change-simulator',
    });
    expect(clean.index).toBe(true);
  });

  it('indexes cost-optimization clean page', () => {
    expect(isConstructionCalculatorPath('/construction/cost-optimization')).toBe(true);
    const clean = resolveConstructionIndexing({ pathname: '/construction/cost-optimization' });
    expect(clean.index).toBe(true);
  });

  it('indexes cement-calculator clean page', () => {
    expect(isConstructionCalculatorPath('/construction/cement-calculator')).toBe(true);
    const clean = resolveConstructionIndexing({ pathname: '/construction/cement-calculator' });
    expect(clean.index).toBe(true);
  });

  it('indexes concrete-calculator clean page', () => {
    expect(isConstructionCalculatorPath('/construction/concrete-calculator')).toBe(true);
    const clean = resolveConstructionIndexing({ pathname: '/construction/concrete-calculator' });
    expect(clean.index).toBe(true);
  });

  it('indexes brick-calculator clean page', () => {
    expect(isConstructionCalculatorPath('/construction/brick-calculator')).toBe(true);
    const clean = resolveConstructionIndexing({ pathname: '/construction/brick-calculator' });
    expect(clean.index).toBe(true);
  });

  it('indexes aac-block-calculator clean page', () => {
    expect(isConstructionCalculatorPath('/construction/aac-block-calculator')).toBe(true);
    const clean = resolveConstructionIndexing({
      pathname: '/construction/aac-block-calculator',
    });
    expect(clean.index).toBe(true);
  });

  it('indexes steel-calculator clean page', () => {
    expect(isConstructionCalculatorPath('/construction/steel-calculator')).toBe(true);
    const clean = resolveConstructionIndexing({ pathname: '/construction/steel-calculator' });
    expect(clean.index).toBe(true);
  });

  it('indexes bar-bending-schedule clean page', () => {
    expect(isConstructionCalculatorPath('/construction/bar-bending-schedule')).toBe(true);
    const clean = resolveConstructionIndexing({
      pathname: '/construction/bar-bending-schedule',
    });
    expect(clean.index).toBe(true);
  });

  it('indexes boq-generator clean page', () => {
    expect(isConstructionCalculatorPath('/construction/boq-generator')).toBe(true);
    const clean = resolveConstructionIndexing({ pathname: '/construction/boq-generator' });
    expect(clean.index).toBe(true);
  });

  it('indexes timeline-planner clean page', () => {
    expect(isConstructionCalculatorPath('/construction/timeline-planner')).toBe(true);
    const clean = resolveConstructionIndexing({ pathname: '/construction/timeline-planner' });
    expect(clean.index).toBe(true);
  });

  it('indexes budget-tracker clean page', () => {
    expect(isConstructionCalculatorPath('/construction/budget-tracker')).toBe(true);
    const clean = resolveConstructionIndexing({ pathname: '/construction/budget-tracker' });
    expect(clean.index).toBe(true);
  });

  it('indexes document-vault clean page', () => {
    expect(isConstructionCalculatorPath('/construction/document-vault')).toBe(true);
    const clean = resolveConstructionIndexing({ pathname: '/construction/document-vault' });
    expect(clean.index).toBe(true);
  });

  it('indexes material-selector clean page', () => {
    expect(isConstructionCalculatorPath('/construction/material-selector')).toBe(true);
    const clean = resolveConstructionIndexing({ pathname: '/construction/material-selector' });
    expect(clean.index).toBe(true);
  });

  it('indexes sand-calculator clean page', () => {
    expect(isConstructionCalculatorPath('/construction/sand-calculator')).toBe(true);
    const clean = resolveConstructionIndexing({ pathname: '/construction/sand-calculator' });
    expect(clean.index).toBe(true);
  });

  it('indexes aggregate-calculator clean page', () => {
    expect(isConstructionCalculatorPath('/construction/aggregate-calculator')).toBe(true);
    const clean = resolveConstructionIndexing({
      pathname: '/construction/aggregate-calculator',
    });
    expect(clean.index).toBe(true);
  });

  it('noindexes private project paths', () => {
    const result = resolveConstructionIndexing({ pathname: '/construction/projects' });
    expect(result.index).toBe(false);
    expect(result.follow).toBe(false);
    expect(result.reason).toBe('private_or_forced');
  });

  it('noindexes intent navigator state URLs while canonical stays clean', () => {
    const result = resolveConstructionIndexing({
      pathname: '/construction',
      searchParams: { intent: 'build_home' },
    });
    expect(result.index).toBe(false);
    expect(result.canonicalPath).toBe('/construction');
    expect(result.reason).toBe('filter_query');
  });
});

describe('formatConstructionLastUpdated', () => {
  it('formats valid dates and rejects invalid', () => {
    expect(formatConstructionLastUpdated('2026-08-20T10:00:00.000Z')).toMatch(/2026/);
    expect(formatConstructionLastUpdated('not-a-date')).toBeNull();
    expect(formatConstructionLastUpdated(null)).toBeNull();
  });
});

describe('buildConstructionJsonLdGraph', () => {
  it('emits BreadcrumbList and ItemList when provided', () => {
    const graph = buildConstructionJsonLdGraph({
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Construction', path: '/construction' },
      ],
      itemList: {
        name: 'Tools',
        path: '/construction',
        items: [{ name: 'Cement calc', path: '/construction/cement-calculator' }],
      },
    });
    expect(graph.some((n) => n['@type'] === 'BreadcrumbList')).toBe(true);
    expect(graph.some((n) => n['@type'] === 'ItemList')).toBe(true);
  });

  it('emits WebPage for construction homepage pattern', () => {
    const graph = buildConstructionJsonLdGraph({
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Construction', path: '/construction' },
      ],
      webPage: {
        name: 'Construction',
        description: 'Plan construction',
        path: '/construction',
      },
    });
    expect(graph.some((n) => n['@type'] === 'WebPage')).toBe(true);
    expect(graph.some((n) => n['@type'] === 'Product')).toBe(false);
  });

  it('requires at least two FAQs for FAQPage', () => {
    const one = buildConstructionJsonLdGraph({
      faqs: [{ question: 'Q1?', answer: 'A1' }],
    });
    expect(one.some((n) => n['@type'] === 'FAQPage')).toBe(false);

    const two = buildConstructionJsonLdGraph({
      faqs: [
        { question: 'Q1?', answer: 'A1' },
        { question: 'Q2?', answer: 'A2' },
      ],
    });
    expect(two.some((n) => n['@type'] === 'FAQPage')).toBe(true);
  });

  it('emits WebApplication for calculators without SoftwareApplication duplicate', () => {
    const graph = buildConstructionJsonLdGraph({
      webApplication: {
        name: 'Concrete Calculator',
        path: '/calculators/concrete',
        description: 'Estimate concrete volume',
      },
    });
    const types = graph.map((n) => n['@type']);
    expect(types).toContain('WebApplication');
    expect(types).not.toContain('SoftwareApplication');
  });

  it('emits Article when article input is present', () => {
    const graph = buildConstructionJsonLdGraph({
      article: {
        title: 'How to estimate cement',
        path: '/construction/guides/cement',
        description: 'Guide',
        datePublished: '2026-01-01',
      },
    });
    expect(graph.some((n) => n['@type'] === 'Article')).toBe(true);
  });
});

describe('buildConstructionPageMetadata', () => {
  it('returns title/description/canonical/robots/og/twitter for hub', async () => {
    const meta = await buildConstructionPageMetadata('hub');
    expect(meta.title).toBe(CONSTRUCTION_PAGE_DEFAULTS.hub.title);
    expect(meta.description).toBe(CONSTRUCTION_PAGE_DEFAULTS.hub.description);
    expect(meta.alternates?.canonical).toBe('/construction');
    expect(meta.robots).toEqual({ index: true, follow: true });
    expect(meta.openGraph?.title).toBe(CONSTRUCTION_PAGE_DEFAULTS.hub.title);
    expect(meta.twitter?.title).toBe(CONSTRUCTION_PAGE_DEFAULTS.hub.title);
  });

  it('noindexes projects page by default', async () => {
    const meta = await buildConstructionPageMetadata('projects');
    expect(meta.robots).toEqual({ index: false, follow: false });
  });

  it('noindexes filtered materials metadata while keeping clean canonical', async () => {
    const meta = await buildConstructionPageMetadata('materials', {
      searchParams: { categoryId: 'x', q: 'cement' },
    });
    expect(meta.alternates?.canonical).toBe('/construction/materials');
    expect(meta.robots).toEqual({ index: false, follow: true });
  });
});
