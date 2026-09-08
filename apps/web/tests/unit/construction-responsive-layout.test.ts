import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('construction intelligence responsive markup', () => {
  it('city and admin tables use horizontal scroll wrappers', () => {
    const city = readFileSync(
      path.resolve(
        __dirname,
        '../../src/components/construction/construction-cost-city/construction-cost-city-view.tsx',
      ),
      'utf8',
    );
    expect(city).toContain('overflow-x-auto');
    expect(city).toContain('sm:grid-cols');
    const rates = readFileSync(
      path.resolve(
        __dirname,
        '../../../../apps/admin/src/app/construction/intelligence/reviews/page.tsx',
      ),
      'utf8',
    );
    expect(rates).toContain('overflow-x-auto');
  });
});
