type PublicMenu = {
  items: Array<{
    label: string;
    href: string | null;
    sortOrder: number;
    isActive?: boolean;
  }>;
};

export function publicMenuLinks(menu: PublicMenu | null | undefined) {
  if (!menu) return null;
  return menu.items
    .filter((item) => Boolean(item.href) && item.isActive === true)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({ label: item.label, href: item.href! }));
}
