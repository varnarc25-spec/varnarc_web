import { describe, expect, it } from 'vitest';
import {
  assertValidJsonLdGraph,
  assertValidJsonLdNode,
  breadcrumbJsonLd,
  buildAggregateRatingJsonLd,
  faqJsonLd,
  filterVisibleFaqs,
  itemListJsonLd,
  jsonLdGraphTypes,
  productJsonLd,
  webApplicationJsonLd,
  webPageJsonLd,
  websiteJsonLd,
} from '../src/seo-json-ld';
import {
  buildConstructionJsonLdGraph,
  CONSTRUCTION_JSON_LD_MIN_FAQS,
} from '../src/construction-json-ld';

const SITE = 'https://varnarc.com';

describe('seo-json-ld builders', () => {
  it('builds BreadcrumbList with required fields', () => {
    const node = breadcrumbJsonLd([
      { name: 'Home', url: `${SITE}/` },
      { name: 'Construction', url: `${SITE}/construction` },
    ]);
    assertValidJsonLdNode(node);
    expect(node['@context']).toBe('https://schema.org');
    expect(node['@type']).toBe('BreadcrumbList');
    const items = node.itemListElement as Array<Record<string, unknown>>;
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ '@type': 'ListItem', position: 1, name: 'Home' });
    expect(JSON.parse(JSON.stringify(node))).toEqual(node);
  });

  it('builds WebPage and WebSite with required fields', () => {
    const page = webPageJsonLd({
      name: 'Construction',
      url: `${SITE}/construction`,
      description: 'Plan construction',
      isPartOfUrl: `${SITE}/`,
    });
    assertValidJsonLdNode(page);
    expect(page['@type']).toBe('WebPage');
    expect(page.url).toBe(`${SITE}/construction`);

    const site = websiteJsonLd({ name: 'Varnarc', url: SITE });
    assertValidJsonLdNode(site);
    expect(site['@type']).toBe('WebSite');
  });

  it('builds WebApplication for calculators', () => {
    const node = webApplicationJsonLd({
      name: 'Cement Calculator',
      url: `${SITE}/construction/cement-calculator`,
      description: 'Estimate cement',
    });
    assertValidJsonLdNode(node);
    expect(node['@type']).toBe('WebApplication');
    expect(node.url).toContain('/cement-calculator');
  });

  it('builds ItemList and FAQPage', () => {
    const list = itemListJsonLd({
      name: 'Materials',
      url: `${SITE}/construction/materials`,
      items: [{ name: 'Cement', url: `${SITE}/construction/materials/cement`, position: 1 }],
    });
    assertValidJsonLdNode(list);
    expect(list['@type']).toBe('ItemList');

    const faq = faqJsonLd([
      { question: 'Q1?', answer: 'A1' },
      { question: 'Q2?', answer: 'A2' },
    ]);
    assertValidJsonLdNode(faq);
    expect(faq['@type']).toBe('FAQPage');
    expect((faq.mainEntity as unknown[]).length).toBe(2);
  });

  it('filters empty FAQs and requires reviewCount for AggregateRating', () => {
    expect(filterVisibleFaqs([{ question: 'Q?', answer: '  ' }])).toHaveLength(0);
    expect(buildAggregateRatingJsonLd({ ratingValue: 4.5, reviewCount: 0 })).toBeUndefined();
    expect(buildAggregateRatingJsonLd({ ratingValue: 4.5, reviewCount: 3 })).toEqual({
      '@type': 'AggregateRating',
      ratingValue: 4.5,
      reviewCount: 3,
    });

    const product = productJsonLd({
      name: 'SKU',
      url: `${SITE}/p`,
      aggregateRating: { ratingValue: 4, reviewCount: 0 },
    });
    expect(product.aggregateRating).toBeUndefined();
  });
});

describe('buildConstructionJsonLdGraph', () => {
  it('emits BreadcrumbList + WebPage for construction homepage pattern', () => {
    const graph = buildConstructionJsonLdGraph({
      siteUrl: SITE,
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Construction', path: '/construction' },
      ],
      webPage: {
        name: 'Construction',
        description: 'Plan construction with calculators',
        path: '/construction',
      },
      itemList: {
        name: 'Popular calculators',
        path: '/construction',
        items: [{ name: 'Cement calculator', path: '/construction/cement-calculator' }],
      },
      faqs: [
        { question: 'Is this a quote?', answer: 'No, indicative only.' },
        { question: 'Who is it for?', answer: 'Homeowners and planners.' },
      ],
    });

    assertValidJsonLdGraph(graph);
    const types = jsonLdGraphTypes(graph);
    expect(types).toEqual(
      expect.arrayContaining(['BreadcrumbList', 'WebPage', 'ItemList', 'FAQPage']),
    );
    expect(types).not.toContain('Product');
    expect(types).not.toContain('Review');
    expect(() => JSON.stringify(graph)).not.toThrow();
  });

  it(`emits FAQPage only with ≥ ${CONSTRUCTION_JSON_LD_MIN_FAQS} visible FAQs`, () => {
    const one = buildConstructionJsonLdGraph({
      siteUrl: SITE,
      faqs: [{ question: 'Only one?', answer: 'Yes' }],
    });
    expect(jsonLdGraphTypes(one)).not.toContain('FAQPage');

    const two = buildConstructionJsonLdGraph({
      siteUrl: SITE,
      faqs: [
        { question: 'Q1?', answer: 'A1' },
        { question: 'Q2?', answer: 'A2' },
      ],
    });
    expect(jsonLdGraphTypes(two)).toContain('FAQPage');
  });

  it('emits WebApplication for calculators without SoftwareApplication', () => {
    const graph = buildConstructionJsonLdGraph({
      siteUrl: SITE,
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Construction', path: '/construction' },
        { name: 'Cement calculator', path: '/construction/cement-calculator' },
      ],
      webApplication: {
        name: 'Cement Calculator',
        path: '/construction/cement-calculator',
        description: 'Estimate cement bags',
      },
    });
    const types = jsonLdGraphTypes(graph);
    expect(types).toContain('WebApplication');
    expect(types).not.toContain('SoftwareApplication');
    const app = graph.find((n) => n['@type'] === 'WebApplication')!;
    expect(app.name).toBe('Cement Calculator');
    expect(app.url).toBe(`${SITE}/construction/cement-calculator`);
  });

  it('emits Article for guides', () => {
    const graph = buildConstructionJsonLdGraph({
      siteUrl: SITE,
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Guides', path: '/construction/guides' },
        { name: 'Cement buying', path: '/construction/guides/cement-buying-guide' },
      ],
      article: {
        title: 'Cement buying guide',
        path: '/construction/guides/cement-buying-guide',
        description: 'How to buy cement',
        datePublished: '2026-01-01',
      },
    });
    expect(jsonLdGraphTypes(graph)).toContain('Article');
    const article = graph.find((n) => n['@type'] === 'Article')!;
    expect(article.headline).toBe('Cement buying guide');
  });

  it('emits ItemList for material lists and HowTo when steps exist', () => {
    const graph = buildConstructionJsonLdGraph({
      siteUrl: SITE,
      itemList: {
        name: 'Material guides',
        path: '/construction/materials',
        items: [
          { name: 'Cement', path: '/construction/materials/cement' },
          { name: 'Steel', path: '/construction/materials/steel' },
        ],
      },
      howTo: {
        name: 'How to use OPC 53',
        steps: [
          { name: 'Check grade', text: 'Confirm bag grade.' },
          { name: 'Store dry', text: 'Keep bags off the floor.' },
        ],
      },
    });
    const types = jsonLdGraphTypes(graph);
    expect(types).toContain('ItemList');
    expect(types).toContain('HowTo');
    expect(types).not.toContain('Product');
  });

  it('does not emit Product for educational material discussion', () => {
    const graph = buildConstructionJsonLdGraph({
      siteUrl: SITE,
      webPage: {
        name: 'Cement',
        path: '/construction/materials/cement',
        description: 'Educational guide to cement',
      },
      article: {
        title: 'Cement',
        path: '/construction/materials/cement',
        description: 'Educational guide to cement',
      },
    });
    expect(jsonLdGraphTypes(graph)).not.toContain('Product');
    expect(JSON.stringify(graph)).not.toMatch(/AggregateRating/);
  });
});
