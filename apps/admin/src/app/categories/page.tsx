import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { CategoryCreateForm } from '@/components/category-create-form';

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  parent?: { id: string; name: string; slug: string } | null;
};

export default async function CategoriesAdminPage() {
  const result = await apiServerFetch<CategoryRow[]>('/categories?limit=100');
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organize articles into parent/child categories."
        actions={<Badge>{rows.length} loaded</Badge>}
      />
      <CategoryCreateForm />
      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load categories</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] text-[var(--varnarc-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Parent</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.name}</div>
                    {row.description ? (
                      <div className="text-xs text-[var(--varnarc-subtle)]">{row.description}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{row.slug}</td>
                  <td className="px-4 py-3 text-sm text-[var(--varnarc-subtle)]">
                    {row.parent?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">{row.status}</td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--varnarc-subtle)]">
                    No categories yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
