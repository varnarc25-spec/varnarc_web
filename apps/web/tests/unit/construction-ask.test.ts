import { describe, expect, it } from 'vitest';
import {
  parseAskConstructionQuery,
  resolveAskConstructionQuery,
  shouldAutoRouteAsk,
  autocompleteAskCatalog,
} from '@/lib/construction/ask';

describe('parseAskConstructionQuery examples', () => {
  it('parses cement required for area', () => {
    const r = parseAskConstructionQuery('cement required for 1500 sqft');
    expect(r.intent).toBe('calculator');
    expect(r.values.material).toBe('cement');
    expect(r.values.area).toBe(1500);
    expect(shouldAutoRouteAsk(r)).toBe(true);
    const route = resolveAskConstructionQuery('cement required for 1500 sqft');
    expect(route.href).toContain('/construction/cement-calculator');
    expect(route.href).toContain('area=1500');
  });

  it('parses cost to build 3 bhk in Hyderabad', () => {
    const r = parseAskConstructionQuery('cost to build 3 bhk in Hyderabad');
    expect(r.intent).toBe('cost');
    expect(r.values.bhk).toBe(3);
    expect(r.values.location).toBe('Hyderabad');
    const route = resolveAskConstructionQuery('cost to build 3 bhk in Hyderabad');
    expect(route.autoRoute).toBe(true);
    expect(route.href).toContain('/construction/cost-calculator');
    expect(route.href).toContain('location=Hyderabad');
  });

  it('routes renovation cost queries to renovation calculator', () => {
    const r = parseAskConstructionQuery('renovation cost for 1000 sqft apartment');
    expect(r.intent).toBe('cost');
    const route = resolveAskConstructionQuery('renovation cost for 1000 sqft apartment');
    expect(route.href).toContain('/construction/renovation-cost-calculator');
    expect(route.href).toContain('renovationArea=1000');
  });

  it('routes affordability queries to affordability calculator', () => {
    const route = resolveAskConstructionQuery('can I afford construction with savings and loan');
    expect(route.href).toContain('/construction/affordability-calculator');
  });

  it('parses tiles for 12 x 15 room', () => {
    const r = parseAskConstructionQuery('tiles for 12 x 15 room');
    expect(r.intent).toBe('calculator');
    expect(r.values.material).toBe('tile');
    expect(r.values.length).toBe(12);
    expect(r.values.width).toBe(15);
    const route = resolveAskConstructionQuery('tiles for 12 x 15 room');
    expect(route.href).toContain('/construction/tile-calculator');
    expect(route.href).toContain('length=12');
    expect(route.href).toContain('width=15');
  });

  it('parses compare AAC block and red brick', () => {
    const r = parseAskConstructionQuery('compare AAC block and red brick');
    expect(r.intent).toBe('comparison');
    expect(r.values.materials).toEqual(expect.arrayContaining(['aac', 'brick']));
    const route = resolveAskConstructionQuery('compare AAC block and red brick');
    expect(route.href).toContain('/construction/compare');
  });

  it('parses steel required for slab', () => {
    const r = parseAskConstructionQuery('steel required for slab');
    expect(r.intent).toBe('calculator');
    expect(r.values.material).toBe('steel');
    expect(shouldAutoRouteAsk(r)).toBe(true);
  });

  it('parses paint needed for 3 bedrooms', () => {
    const r = parseAskConstructionQuery('paint needed for 3 bedrooms');
    expect(r.intent).toBe('calculator');
    expect(r.values.material).toBe('paint');
    expect(r.values.bedrooms).toBe(3);
    const route = resolveAskConstructionQuery('paint needed for 3 bedrooms');
    expect(route.href).toContain('/construction/paint-calculator');
    expect(route.href).toContain('rooms=3');
  });

  it('tolerates cement typos', () => {
    const r = parseAskConstructionQuery('cemment required for 1200 sqft');
    expect(r.values.material).toBe('cement');
    expect(r.intent).toBe('calculator');
  });

  it('tolerates city typos', () => {
    const r = parseAskConstructionQuery('cost to build house in hyderbad');
    expect(r.values.location).toBe('Hyderabad');
    expect(r.intent).toBe('cost');
  });

  it('keeps low-confidence queries from auto-routing', () => {
    const route = resolveAskConstructionQuery('something vague maybe building');
    expect(route.autoRoute).toBe(false);
    expect(route.results.length).toBeGreaterThan(0);
  });
});

describe('autocompleteAskCatalog', () => {
  it('suggests cement calculator for cement query', () => {
    const hits = autocompleteAskCatalog('cement');
    expect(hits.some((h) => h.href.includes('/construction/cement-calculator'))).toBe(true);
  });
});
