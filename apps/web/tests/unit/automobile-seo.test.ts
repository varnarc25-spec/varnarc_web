import { describe, expect, it } from 'vitest';
import {
  automobileCanonicalPath,
  isAutomobileCalculatorPath,
  resolveAutomobileIndexing,
} from '@/lib/automobile/seo';
import { AUTOMOBILE_PAGE_DEFAULTS } from '@/lib/automobile/seo-pages';
import { buildAutomobileJsonLdGraph } from '@/lib/automobile/seo';

describe('automobileCanonicalPath', () => {
  it('normalizes trailing slashes', () => {
    expect(automobileCanonicalPath('/automobile/suv/')).toBe('/automobile/suv');
    expect(automobileCanonicalPath('/automobile/calculators/car-loan')).toBe(
      '/automobile/calculators/car-loan',
    );
  });
});

describe('resolveAutomobileIndexing', () => {
  it('indexes clean hub and category paths', () => {
    const hub = resolveAutomobileIndexing({ pathname: '/automobile' });
    expect(hub.index).toBe(true);
    expect(hub.canonicalPath).toBe('/automobile');

    const suv = resolveAutomobileIndexing({ pathname: '/automobile/suv' });
    expect(suv.index).toBe(true);
  });

  it('noindexes filter query variants', () => {
    const result = resolveAutomobileIndexing({
      pathname: '/automobile/vehicles',
      searchParams: { fuelType: 'Petrol' },
    });
    expect(result.index).toBe(false);
    expect(result.reason).toBe('filter_query');
    expect(result.canonicalPath).toBe('/automobile/vehicles');
  });

  it('noindexes compare ids and calculator share params', () => {
    expect(
      resolveAutomobileIndexing({
        pathname: '/automobile/compare',
        searchParams: { ids: 'a,b' },
      }).index,
    ).toBe(false);

    expect(isAutomobileCalculatorPath('/automobile/calculators/car-loan')).toBe(true);
    expect(
      resolveAutomobileIndexing({
        pathname: '/automobile/calculators/car-loan',
        searchParams: { amount: '800000', s: 'abc' },
      }).reason,
    ).toBe('calculator_share_params');
  });
});

describe('automobile page defaults', () => {
  it('covers hub, categories and ownership calculators', () => {
    expect(AUTOMOBILE_PAGE_DEFAULTS.hub.path).toBe('/automobile');
    expect(AUTOMOBILE_PAGE_DEFAULTS.suv.indexable).toBe(true);
    expect(AUTOMOBILE_PAGE_DEFAULTS['calc-car-loan'].path).toBe('/automobile/calculators/car-loan');
  });
});

describe('buildAutomobileJsonLdGraph (web shim)', () => {
  it('builds breadcrumbs + itemList for category hubs', () => {
    const graph = buildAutomobileJsonLdGraph({
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Automobile', path: '/automobile' },
        { name: 'SUVs', path: '/automobile/suv' },
      ],
      itemList: {
        name: 'SUVs',
        path: '/automobile/suv',
        items: [{ name: 'Demo SUV', path: '/automobile/vehicles/demo' }],
      },
    });
    expect(graph.some((n) => n['@type'] === 'BreadcrumbList')).toBe(true);
    expect(graph.some((n) => n['@type'] === 'ItemList')).toBe(true);
  });
});
