import { describe, expect, it } from 'vitest';
import { publicMenuLinks } from '@/lib/public-menu-links';

describe('publicMenuLinks', () => {
  it('returns null when the CMS menu is missing so the header does not revive static links', () => {
    expect(publicMenuLinks(null)).toBeNull();
    expect(publicMenuLinks(undefined)).toBeNull();
  });

  it('omits items that are disabled or missing isActive', () => {
    expect(
      publicMenuLinks({
        items: [
          { label: 'Home', href: '/', sortOrder: 1, isActive: true },
          { label: 'Solar', href: '/solar', sortOrder: 2, isActive: false },
          { label: 'Tags', href: '/tags', sortOrder: 3 },
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

  it('maps CMS Blog /blog links to /articles', () => {
    expect(
      publicMenuLinks({
        items: [
          { label: 'Home', href: '/', sortOrder: 1, isActive: true },
          { label: 'Blog', href: '/blog', sortOrder: 2, isActive: true },
        ],
      }),
    ).toEqual([
      { label: 'Home', href: '/' },
      { label: 'Blog', href: '/articles' },
    ]);
  });
});
