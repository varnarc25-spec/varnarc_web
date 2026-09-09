type PublicMenu = {
  items: Array<{
    label: string;
    href: string | null;
    sortOrder: number;
    isActive?: boolean;
  }>;
};

/** CMS still stores Blog as `/blog`; the live listing lives at `/articles`. */
export function canonicalPublicHref(href: string): string {
  try {
    const url = href.startsWith('http://') || href.startsWith('https://') ? new URL(href) : null;
    const path = (url ? url.pathname : (href.split('?')[0] ?? href)).replace(/\/+$/, '') || '/';
    if (path === '/blog') {
      return '/articles';
    }
    if (path.startsWith('/blog/')) {
      return `/articles${path.slice('/blog'.length)}`;
    }
    return href;
  } catch {
    return href;
  }
}

export function publicMenuLinks(menu: PublicMenu | null | undefined) {
  if (!menu) return null;
  return menu.items
    .filter((item) => Boolean(item.href) && item.isActive === true)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({ label: item.label, href: canonicalPublicHref(item.href!) }));
}
