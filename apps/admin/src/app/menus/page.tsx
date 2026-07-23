import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { MenuCreateForm } from '@/components/menu-create-form';
import { MenuManager } from '@/components/menu-manager';

type MenuRow = {
  id: string;
  name: string;
  slug: string;
  location: string;
  items: Array<{ id: string; label: string; href: string | null; sortOrder: number }>;
};

export default async function MenusPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string }>;
}) {
  const { location } = await searchParams;
  const qs = new URLSearchParams({ limit: '50' });
  if (location) qs.set('location', location);

  const result = await apiServerFetch<MenuRow[]>(`/menus?${qs.toString()}`);
  const menus = Array.isArray(result.data) ? result.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menus"
        description={
          location
            ? `Configure ${location} navigation.`
            : 'Configure header, footer, and sidebar navigation.'
        }
        actions={<Badge>{menus.length} menus</Badge>}
      />

      <MenuCreateForm />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load menus</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {menus.map((menu) => (
            <MenuManager
              key={menu.id}
              menuId={menu.id}
              name={menu.name}
              location={menu.location}
              items={menu.items || []}
            />
          ))}
          {!menus.length ? (
            <p className="text-sm text-[var(--varnarc-subtle)]">No menus yet. Create one above.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
