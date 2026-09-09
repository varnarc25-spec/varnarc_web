import { describe, expect, it } from 'vitest';
import {
  areComparableMaterialSet,
  areMaterialsComparable,
  filterComparableCandidates,
  recommendComparableCatalogPair,
  resolveMaterialComparisonGroup,
} from '../src/construction-material-comparison';

describe('material comparison groups', () => {
  it('classifies known substitutable families', () => {
    expect(resolveMaterialComparisonGroup({ name: 'OPC 43 grade cement' })).toBe('cement');
    expect(resolveMaterialComparisonGroup({ name: 'PPC' })).toBe('cement');
    expect(resolveMaterialComparisonGroup({ name: 'AAC blocks' })).toBe('walling');
    expect(resolveMaterialComparisonGroup({ name: 'Fly ash bricks' })).toBe('walling');
    expect(resolveMaterialComparisonGroup({ name: 'M-sand' })).toBe('sand');
    expect(resolveMaterialComparisonGroup({ name: 'TMT Fe500' })).toBe('steel');
    expect(resolveMaterialComparisonGroup({ name: 'TMT Fe500D' })).toBe('steel');
    expect(resolveMaterialComparisonGroup({ name: 'Vitrified tiles' })).toBe('flooring');
    expect(resolveMaterialComparisonGroup({ name: 'Gypsum board' })).toBe('ceiling');
    expect(resolveMaterialComparisonGroup({ name: 'POP' })).toBe('ceiling');
    expect(resolveMaterialComparisonGroup({ name: 'uPVC windows' })).toBe('windows');
    expect(resolveMaterialComparisonGroup({ name: 'Plywood 18mm' })).toBe('boards');
    expect(resolveMaterialComparisonGroup({ name: 'Asian Paints emulsion' })).toBe('paint');
    expect(resolveMaterialComparisonGroup({ name: 'Cement plaster' })).toBe('plaster');
  });

  it('allows valid pairs from the approved groups', () => {
    expect(areMaterialsComparable({ name: 'OPC' }, { name: 'PPC' })).toBe(true);
    expect(areMaterialsComparable({ name: 'OPC 43' }, { name: 'OPC 53' })).toBe(true);
    expect(areMaterialsComparable({ name: 'AAC blocks' }, { name: 'Red bricks' })).toBe(true);
    expect(areMaterialsComparable({ name: 'Fly ash bricks' }, { name: 'Red bricks' })).toBe(true);
    expect(areMaterialsComparable({ name: 'M-sand' }, { name: 'River sand' })).toBe(true);
    expect(areMaterialsComparable({ name: 'Fe500 TMT' }, { name: 'Fe500D TMT' })).toBe(true);
    expect(areMaterialsComparable({ name: 'Vitrified tiles' }, { name: 'Ceramic tiles' })).toBe(
      true,
    );
    expect(areMaterialsComparable({ name: 'Granite slab' }, { name: 'Vitrified tiles' })).toBe(
      true,
    );
    expect(areMaterialsComparable({ name: 'Marble' }, { name: 'Granite' })).toBe(true);
    expect(areMaterialsComparable({ name: 'Gypsum board' }, { name: 'POP' })).toBe(true);
    expect(areMaterialsComparable({ name: 'PVC ceiling' }, { name: 'Gypsum board' })).toBe(true);
    expect(areMaterialsComparable({ name: 'uPVC window' }, { name: 'Aluminium window' })).toBe(
      true,
    );
    expect(areMaterialsComparable({ name: 'Plywood' }, { name: 'MDF' })).toBe(true);
    expect(areMaterialsComparable({ name: 'Plywood' }, { name: 'WPC' })).toBe(true);
    expect(areMaterialsComparable({ name: 'Asian Paints' }, { name: 'Berger' })).toBe(true);
    expect(areMaterialsComparable({ name: 'Interior emulsion' }, { name: 'Distemper' })).toBe(true);
  });

  it('never recommends unrelated comparison types together', () => {
    const invalid: Array<[string, string]> = [
      ['Interior emulsion paint', 'TMT Fe500 steel'],
      ['OPC cement', 'TMT bar'],
      ['Red bricks', 'River sand'],
      ['AAC blocks', 'Vitrified tiles'],
      ['M-sand', 'Plywood'],
      ['uPVC windows', 'OPC 53'],
      ['Gypsum board', 'TMT Fe500D'],
      ['Asian Paints', 'Red bricks'],
      ['Ceramic tiles', 'Aluminium window'],
      ['Cement plaster', 'TMT steel'],
    ];
    for (const [a, b] of invalid) {
      expect(areMaterialsComparable({ name: a }, { name: b }), `${a} vs ${b}`).toBe(false);
    }
  });

  it('rejects a mixed catalog set even if some pairs would be valid', () => {
    expect(
      areComparableMaterialSet([{ name: 'OPC' }, { name: 'PPC' }, { name: 'TMT Fe500' }]),
    ).toBe(false);
  });

  it('recommends the first same-group pair and skips cross-group featured items', () => {
    const pair = recommendComparableCatalogPair([
      { id: '1', name: 'Interior emulsion paint' },
      { id: '2', name: 'TMT Fe500' },
      { id: '3', name: 'Berger distemper' },
      { id: '4', name: 'OPC 53' },
    ]);
    expect(pair?.map((p) => p.id)).toEqual(['1', '3']);
  });

  it('filters candidates to the selected material group', () => {
    const selected = { id: 'p', name: 'Plywood' };
    const next = filterComparableCandidates(selected, [
      { id: '1', name: 'MDF' },
      { id: '2', name: 'TMT Fe500' },
      { id: '3', name: 'WPC' },
    ]);
    expect(next.map((n) => n.id)).toEqual(['1', '3']);
  });
});
