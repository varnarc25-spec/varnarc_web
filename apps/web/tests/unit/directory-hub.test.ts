import { describe, expect, it } from 'vitest';
import {
  activeLeafCategories,
  buildDirectorySearchHref,
  buildPopularServices,
  classifyCategorySlug,
  groupCategoriesByVertical,
  hasActiveListings,
  isOpenNow,
  verificationDisplay,
  verificationLabel,
  type DirectoryCategory,
} from '@/lib/directory-hub';

const categories: DirectoryCategory[] = [
  { id: '1', name: 'Architects', slug: 'architects', _count: { businesses: 2 } },
  { id: '2', name: 'Interior Designers', slug: 'interior-designers', _count: { businesses: 1 } },
  { id: '3', name: 'Hospitals', slug: 'hospitals', _count: { businesses: 5 } },
  { id: '4', name: 'Electricians', slug: 'electricians', _count: { businesses: 0 } },
  { id: '5', name: 'Car Dealers', slug: 'car-dealers', _count: { businesses: 3 } },
  { id: '6', name: 'SaaS Products', slug: 'saas-products', _count: { businesses: 4 } },
  { id: '7', name: 'Construction', slug: 'construction', _count: { businesses: 9 } },
];

describe('directory hub helpers', () => {
  it('hides empty and regulated categories from active leaves', () => {
    const leaves = activeLeafCategories(categories);
    expect(leaves.map((c) => c.slug)).toEqual(['architects', 'interior-designers', 'car-dealers']);
    expect(hasActiveListings(categories[2]!)).toBe(false);
    expect(hasActiveListings(categories[3]!)).toBe(false);
  });

  it('builds popular services from priority inventory only', () => {
    const popular = buildPopularServices(categories, 6);
    expect(popular.map((p) => p.slug)).toEqual(['architects', 'interior-designers', 'car-dealers']);
    expect(popular.every((p) => p.count > 0)).toBe(true);
  });

  it('groups categories by vertical', () => {
    const groups = groupCategoriesByVertical(categories);
    expect(groups.map((g) => g.key)).toEqual(['home', 'automobile']);
    expect(classifyCategorySlug('solar-installers')).toBe('solar');
  });

  it('maps verification labels without inventing verified state', () => {
    expect(verificationLabel({ verificationStatus: 'VERIFIED' })).toBe('verified');
    expect(verificationLabel({ ownerId: 'u1', verificationStatus: 'UNVERIFIED' })).toBe('claimed');
    expect(verificationDisplay('listed')).toBeNull();
    expect(verificationDisplay('verified')?.text).toBe('Verified business');
  });

  it('checks open-now from hours without fabricating slots', () => {
    const mondayOpen = [{ day: 1, openTime: '00:00', closeTime: '23:59', isClosed: false }];
    const closed = [{ day: 1, openTime: '09:00', closeTime: '10:00', isClosed: true }];
    // Use a fixed Monday noon
    const mondayNoon = new Date('2026-08-17T12:00:00');
    expect(isOpenNow(mondayOpen, mondayNoon)).toBe(true);
    expect(isOpenNow(closed, mondayNoon)).toBe(false);
    expect(isOpenNow(undefined, mondayNoon)).toBe(false);
  });

  it('builds search hrefs', () => {
    expect(buildDirectorySearchHref({ q: 'architects', city: 'Hyderabad' })).toBe(
      '/directory/search?q=architects&city=Hyderabad',
    );
    expect(buildDirectorySearchHref({})).toBe('/directory/search');
  });
});
