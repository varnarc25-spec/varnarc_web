import { describe, expect, it } from 'vitest';
import {
  canIndexSupplierLanding,
  directorySlugsForCategory,
  inferSupplierCategoriesFromDirectorySlugs,
  verificationDisplay,
} from '../src/supplier-directory';

describe('supplier directory helpers', () => {
  it('maps category to directory slugs', () => {
    expect(directorySlugsForCategory('cement')).toContain('cement-dealers');
    expect(directorySlugsForCategory(null).length).toBeGreaterThan(3);
  });

  it('infers construction categories from directory slugs', () => {
    expect(inferSupplierCategoriesFromDirectorySlugs(['steel-dealers'])).toContain('steel');
  });

  it('only shows verified label for VERIFIED status', () => {
    expect(verificationDisplay('VERIFIED').verified).toBe(true);
    expect(verificationDisplay('PENDING').label).toBeNull();
    expect(verificationDisplay('UNVERIFIED').verified).toBe(false);
  });

  it('gates SEO landings on sufficient useful listings', () => {
    const thin = canIndexSupplierLanding({
      categoryKey: 'cement',
      citySlug: 'hyderabad',
      listings: [
        { description: 'Short', status: 'APPROVED' },
        {
          description: 'A longer description that passes the minimum length gate.',
          status: 'APPROVED',
        },
      ],
    });
    expect(thin).toBe(false);

    const ok = canIndexSupplierLanding({
      categoryKey: 'cement',
      citySlug: 'hyderabad',
      listings: [
        {
          description: 'Cement dealer with delivery across the city and suburbs.',
          status: 'APPROVED',
        },
        {
          description: 'Authorized cement stockist serving residential projects.',
          status: 'APPROVED',
        },
        { description: 'Bulk cement and allied materials for contractors.', status: 'APPROVED' },
      ],
    });
    expect(ok).toBe(true);
  });
});
