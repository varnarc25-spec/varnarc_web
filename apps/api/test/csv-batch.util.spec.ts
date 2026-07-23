import { describe, expect, it } from 'vitest';
import { countCsvDataRows, splitCsvIntoBatches } from '../src/modules/catalog-ops/csv-batch.util';

describe('csv-batch.util', () => {
  const csv = 'name,slug\na,slug-a\nb,slug-b\nc,slug-c';

  it('counts data rows', () => {
    expect(countCsvDataRows(csv)).toBe(3);
    expect(countCsvDataRows('name\n')).toBe(0);
  });

  it('splits into batches preserving header', () => {
    const batches = splitCsvIntoBatches(csv, 2);
    expect(batches).toHaveLength(2);
    expect(batches[0]).toContain('name,slug');
    expect(batches[0]?.split('\n')).toHaveLength(3);
    expect(batches[1]?.split('\n')).toHaveLength(2);
  });
});
