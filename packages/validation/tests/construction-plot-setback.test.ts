import { describe, expect, it } from 'vitest';
import {
  PLOT_SETBACK_DISCLAIMER,
  calculateBuiltUpFromPlot,
  defaultPlotDimensions,
  defaultSetbacksForLocation,
  linearUnitFromAreaUnit,
} from '../src/construction-plot-setback';

describe('plot to built-up helper', () => {
  it('computes coverage × floors for a 40×30 ft plot', () => {
    const result = calculateBuiltUpFromPlot({
      plotLength: 40,
      plotWidth: 30,
      floors: 2,
      setbacks: { front: 10, rear: 5, left: 4, right: 4 },
      linearUnit: 'ft',
    });
    expect(result.valid).toBe(true);
    expect(result.coverageLength).toBe(25);
    expect(result.coverageWidth).toBe(22);
    expect(result.groundCoverage).toBe(550);
    expect(result.suggestedBuiltUp).toBe(1100);
    expect(result.areaUnit).toBe('sqft');
  });

  it('rejects setbacks that consume the plot', () => {
    const result = calculateBuiltUpFromPlot({
      plotLength: 20,
      plotWidth: 20,
      floors: 1,
      setbacks: { front: 12, rear: 12, left: 4, right: 4 },
      linearUnit: 'ft',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/no buildable/i);
  });

  it('prefills Hyderabad defaults and falls back nationally', () => {
    const hyd = defaultSetbacksForLocation('Hyderabad', 'ft');
    expect(hyd.usedNationalDefault).toBe(false);
    expect(hyd.setbacks.front).toBe(10);
    const other = defaultSetbacksForLocation('Unknownville', 'ft');
    expect(other.usedNationalDefault).toBe(true);
    expect(other.setbacks.front).toBe(10);
  });

  it('converts default plot size when using metres', () => {
    expect(linearUnitFromAreaUnit('sqm')).toBe('m');
    const dims = defaultPlotDimensions('m');
    expect(dims.length).toBeGreaterThan(10);
    expect(dims.length).toBeLessThan(15);
  });

  it('keeps the planning disclaimer', () => {
    expect(PLOT_SETBACK_DISCLAIMER).toMatch(/not a building permission/i);
  });
});
