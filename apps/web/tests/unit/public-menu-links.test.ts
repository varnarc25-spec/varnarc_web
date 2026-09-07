import { describe, expect, it } from 'vitest';
import { publicMenuLinks } from '@/lib/public-menu-links';

describe('publicMenuLinks', () => {
  it('returns null when the CMS menu is missing so callers can use a static fallback', () => {
    expect(publicMenuLinks(null)).toBeNull();
    expect(publicMenuLinks(undefined)).toBeNull();
  });

  it('omits disabled items even if that makes the menu shorter than the static nav', () => {
    expect(
      publicMenuLinks({
        items: [
          { label: 'Home', href: '/', sortOrder: 1, isActive: true },
          { label: 'Solar', href: '/solar', sortOrder: 2, isActive: false },
        ],
      }),
    ).toEqual([{ label: 'Home', href: '/' }]);
  });

  it('treats a CMS menu with every item disabled as an empty list, not a missing menu', () => {
    expect(
      publicMenuLinks({
        items: [{ label: 'Solar', href: '/solar', sortOrder: 1, isActive: false }],
      }),
    ).toEqual([]);
  });
});
