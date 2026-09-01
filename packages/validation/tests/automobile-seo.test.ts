import { describe, expect, it } from 'vitest';
import {
  AUTOMOBILE_SITEMAP_SEGMENTS,
  buildAutomobileJsonLdGraph,
  filterAutomobileSitemapPaths,
  isAutomobileSitemapSegment,
  listAllAutomobileSitemapStaticPaths,
  listAutomobileCategories,
  listAutomobileSitemapStaticPaths,
  vehicleMatchesAutomobileCategory,
  getAutomobileCategory,
} from '../src';

describe('automobile categories', () => {
  it('lists high-intent category hubs', () => {
    const slugs = listAutomobileCategories().map((c) => c.slug);
    expect(slugs).toEqual(['suv', 'hatchback', 'sedan', 'mpv', 'ev', 'bikes']);
  });

  it('matches body type and EV fuel filters', () => {
    const suv = getAutomobileCategory('suv')!;
    const ev = getAutomobileCategory('ev')!;
    expect(vehicleMatchesAutomobileCategory({ bodyType: 'SUV' }, suv)).toBe(true);
    expect(vehicleMatchesAutomobileCategory({ bodyType: 'Sedan' }, suv)).toBe(false);
    expect(vehicleMatchesAutomobileCategory({ fuelType: 'Electric' }, ev)).toBe(true);
  });
});

describe('automobile sitemap', () => {
  it('exposes nested segments', () => {
    expect(AUTOMOBILE_SITEMAP_SEGMENTS).toContain('automobile-core');
    expect(isAutomobileSitemapSegment('automobile-vehicles')).toBe(true);
    expect(isAutomobileSitemapSegment('automobile')).toBe(false);
  });

  it('lists all static paths for the flat automobile.xml', () => {
    const all = listAllAutomobileSitemapStaticPaths();
    expect(all).toContain('/automobile/suv');
    expect(all).toContain('/automobile/calculators/car-loan');
    expect(all).toContain('/automobile/calculators');
  });

  it('filters query and non-automobile paths', () => {
    // Query strings are stripped to the clean path; admin paths are dropped.
    expect(
      filterAutomobileSitemapPaths([
        '/automobile/suv',
        '/automobile/compare?ids=1',
        '/admin',
        '/finance',
      ]),
    ).toEqual(['/automobile/suv', '/automobile/compare']);
  });
});

describe('automobile JSON-LD', () => {
  it('emits Product with Offer when price present, without fabricated AggregateRating', () => {
    const graph = buildAutomobileJsonLdGraph({
      siteUrl: 'https://varnarc.com',
      product: {
        name: 'Test SUV',
        path: '/automobile/vehicles/test-suv',
        price: 1200000,
        brand: 'Acme',
      },
    });
    const product = graph.find((n) => n['@type'] === 'Product') as Record<string, unknown>;
    expect(product).toBeTruthy();
    expect(product.offers).toBeTruthy();
    expect(product.aggregateRating).toBeUndefined();
  });

  it('emits AggregateRating only with reviewCount ≥ 1', () => {
    const withRating = buildAutomobileJsonLdGraph({
      siteUrl: 'https://varnarc.com',
      product: {
        name: 'Rated Car',
        path: '/automobile/vehicles/rated',
        price: 900000,
        aggregateRating: { ratingValue: 4.2, reviewCount: 3 },
      },
    });
    const product = withRating.find((n) => n['@type'] === 'Product') as Record<string, unknown>;
    expect(product.aggregateRating).toBeTruthy();

    const without = buildAutomobileJsonLdGraph({
      siteUrl: 'https://varnarc.com',
      product: {
        name: 'Unrated',
        path: '/automobile/vehicles/unrated',
        aggregateRating: { ratingValue: 5, reviewCount: 0 },
      },
    });
    const bare = without.find((n) => n['@type'] === 'Product') as Record<string, unknown>;
    expect(bare.aggregateRating).toBeUndefined();
  });

  it('emits FAQPage only with ≥ 2 faqs and WebApplication for calculators', () => {
    const graph = buildAutomobileJsonLdGraph({
      siteUrl: 'https://varnarc.com',
      faqs: [
        { question: 'Q1', answer: 'A1' },
        { question: 'Q2', answer: 'A2' },
      ],
      webApplication: {
        name: 'Car loan EMI',
        path: '/automobile/calculators/car-loan',
      },
    });
    expect(graph.some((n) => n['@type'] === 'FAQPage')).toBe(true);
    expect(graph.some((n) => n['@type'] === 'WebApplication')).toBe(true);
  });
});
